#!/usr/bin/env python3
"""Tự đo bao bì cũ từ ảnh tách nền và tách NHÃN CŨ (giữ nguyên, không vẽ lại) để dựng 3D hàng loạt.

  python3 scripts/mockup-tu-dong.py <model.onnx> <thư mục ra> tron|det <slug> [slug ...]

  tron : chai, hũ, xô, lon (thân tròn). Lấy biên dạng xoay từ đường viền ảnh, màu thân/nắp theo từng hàng,
         nhãn quấn trụ được nắn phẳng (bỏ cong, bỏ bóng sáng chụp sẵn).
  det  : túi, gói, bao (dẹt). Lấy tỉ lệ khung từ ảnh; nếu là túi nhôm thì phần nhôm để trong suốt
         (vật liệu nhôm 3D hiện ra), phần in giữ nguyên.

Mỗi sản phẩm ra <slug>.json (thông số cho scripts/mockup-3d-cu.js --spec) và <slug>-nhan-4k.png.
Kích thước thật suy từ quy cách trong brand/labels.json (thể tích hoặc khối lượng).
Cần: pip install opencv-python-headless onnxruntime pillow numpy scipy
"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(__file__))
from importlib import import_module
upscale = import_module('mockup-nhan-cu').upscale

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'public', 'images', 'products-cutout')
QC = {p['slug']: (p.get('quy_cach') or '') for p in json.load(open(os.path.join(ROOT, 'brand', 'labels.json')))['san_pham']}


def lin(c):  # sRGB 0..255 -> tuyến tính 0..1 (màu đỉnh cho three.js)
    c = np.asarray(c, float) / 255.
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def qty(slug):
    """(giá trị, đơn vị) đầu tiên trong quy cách: ml hoặc g."""
    q = QC.get(slug, '').lower().replace(',', '.')
    m = re.search(r'(\d+(?:\.\d+)?)\s*(ml|lít|lit|l\b|kg|gram|g\b)', q)
    if not m: return None, None
    v, u = float(m.group(1)), m.group(2)
    if u in ('lít', 'lit', 'l'): return v * 1000, 'ml'
    if u == 'kg': return v * 1000, 'g'
    return v, 'ml' if u == 'ml' else 'g'


def load(slug):
    im = np.asarray(Image.open(os.path.join(SRC, slug + '.webp')).convert('RGBA')).astype(np.float32)
    a = im[..., 3] / 255.
    return im[..., :3] * a[..., None] + 255. * (1 - a[..., None]), a


def hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    return (mx - mn) / (mx + 1e-6), mx / 255.


def save_sr(sess, img, path, alpha=None):
    up = upscale(sess, img) if not os.environ.get('NOSR') else cv2.resize(img, (img.shape[1] * 4, img.shape[0] * 4), interpolation=cv2.INTER_LANCZOS4)  # NOSR=1: xem nhanh
    h, w = up.shape[:2]
    if max(h, w) < 2048:
        k = 2048 / max(h, w); up = cv2.resize(up, (round(w * k), round(h * k)), interpolation=cv2.INTER_LANCZOS4)
    up = up.clip(0, 255).astype(np.uint8)
    if alpha is not None:
        a = cv2.resize((alpha * 255).astype(np.uint8), (up.shape[1], up.shape[0]), interpolation=cv2.INTER_LINEAR)
        up = np.dstack([up, a])
    Image.fromarray(up).save(path)
    return up.shape[1], up.shape[0]


def tron(sess, slug, out):
    rgb, al = load(slug)
    A = al > 0.5
    H0, W0 = A.shape
    ys = np.arange(H0)
    L = np.full(H0, -1); R = np.full(H0, -1); fill = np.zeros(H0)
    for y in range(H0):
        xs = np.where(A[y])[0]
        if len(xs) > 8: L[y], R[y] = xs[0], xs[-1]; fill[y] = len(xs) / (xs[-1] - xs[0] + 1)
    solid = (fill > 0.9)
    lab, n = ndi.label(ndi.binary_closing(solid, iterations=3))
    k = np.argmax(np.bincount(lab)[1:]) + 1
    rows = ys[lab == k]; y0, y1 = rows[0], rows[-1]
    rr = (R - L) / 2.; cc = (R + L) / 2.
    cx = float(np.median(cc[y0:y1 + 1]))
    r = ndi.median_filter(rr[y0:y1 + 1], 5)
    q, unit = qty(slug)
    is_xo = 'xô' in QC.get(slug, '').lower()
    if is_xo:  # tai xô / quai làm phình đường viền: lấy bao dưới
        r = np.minimum(r, ndi.median_filter(r, 41))
    rmax = r.max()
    # nắp: vùng trên cùng hẹp hơn 0,62 thân (dò trước khi cắt elip)
    top = np.where(r >= 0.8 * rmax)[0][0]
    cy1 = 0
    if top > 6 and r[:max(3, top // 3)].mean() < 0.62 * rmax:
        rc = np.percentile(r[:max(3, top // 2)], 90)
        st = int(np.argmax(r[:top] >= 0.95 * rc))                      # hết phần bo mép trên nắp
        ce = st + np.where(r[st:top] < 0.86 * rc)[0]
        cy1 = int(ce[0]) if len(ce) else 0
    has_cap = top > 6 and cy1 > 0.025 * len(r)
    # bỏ phần elip phối cảnh ở đáy và mặt trên (ảnh chụp hơi từ trên xuống): đó không phải thân bao bì
    rm0 = float(np.median(r[len(r) // 3: 2 * len(r) // 3]))
    ye = max(np.where(A[:, int(cx + sg * 0.85 * rm0)])[0][-1] for sg in (-1, 1))
    kb = float(np.clip((y1 - ye) / (0.473 * rm0), 0, 0.4))
    cb = int(round(kb * np.percentile(r[-len(r) // 8:], 90)))
    ct = int(round(kb * np.percentile(r[:max(3, len(r) // 20)], 90)))
    if has_cap: ct = 0                      # nắp hẹp: elip mặt trên không đáng kể
    r = r[ct:len(r) - cb]; y0 += ct; y1 -= cb
    r = ndi.gaussian_filter1d(r, 2.0)       # mịn biên dạng (bỏ bậc thang 1 px)
    rmax = r.max()
    # tỉ lệ cm/px theo thể tích
    if q is None: q, unit = 1000, 'ml'
    V = q * 1.15 if unit == 'ml' else q * (1.8 if is_xo else 2.3)
    s = (V / (np.pi * (r ** 2).sum())) ** (1 / 3)
    cap = dict(y0=float((y1 - (y0 + cy1)) * s), y1=float((y1 - y0) * s), r=float(np.percentile(r[:max(3, cy1)], 90) * s)) if has_cap else None
    # màu thân theo hàng (dải giữa), khử bóng
    band = np.zeros((y1 - y0 + 1, 3))
    for i, y in enumerate(range(y0, y1 + 1)):
        hw = max(2, int(0.45 * r[i])); band[i] = np.median(rgb[y, int(cx) - hw:int(cx) + hw + 1], 0)
    # màu nền thân: hàng đáy 4–10 %
    nb = len(r)
    # màu nền thân: vai chai (ngay dưới nắp) nếu có nắp, không thì vùng đáy
    rs = slice(cy1 + int(nb * 0.04), cy1 + int(nb * 0.10)) if cap else slice(int(nb * 0.90), int(nb * 0.96))
    ref = np.median(band[rs], 0)
    hs, hv = hsv(band[cy1:])
    glass = bool(((hv < 0.45) & (hs > 0.35) & (band[cy1:, 0] > band[cy1:, 2])).mean() > 0.3)
    # ---- dò nhãn: khác màu nền sau khi chuẩn hóa bóng theo cột
    colref = np.median(rgb[y0 + rs.start:y0 + rs.stop], 0)  # màu nền theo cột
    norm = rgb * (ref / np.maximum(colref, 1))[None]
    dist = np.sqrt(((norm - ref) ** 2).sum(-1))
    mask = (dist > 48) & A
    ystart = y0 + (int((y1 - (cap['y0'] / s)) - y0) + 2 if cap else 0)
    mask[:ystart] = False; mask[y0 + int(nb * 0.97):] = False
    mask = ndi.binary_opening(mask, structure=np.ones((5, 1)))
    rm = float(np.median(r[nb // 3: 2 * nb // 3]))
    # dò nhãn theo hàng: tỉ lệ điểm khác màu thân trong dải giữa |x-cx| < 0,8 r
    hb = int(0.8 * rm)
    frac = mask[:, int(cx) - hb:int(cx) + hb + 1].mean(1)
    rowl = ndi.binary_closing(frac > 0.3, structure=np.ones(max(3, int(0.03 * nb)) | 1))
    rowl[:ystart] = False
    lb, nr = ndi.label(rowl)
    label = None
    if nr:
        k = np.argmax(np.bincount(lb)[1:]) + 1; yy = np.where(lb == k)[0]
        if len(yy) < 0.12 * nb: nr = 0
    if not nr:   # nhãn in thưa (chữ trên nền trắng): lấy cả thân dưới nắp
        yy = np.arange(ystart + 4, y0 + int(nb * 0.95))
        mask[yy[0]:yy[-1] + 1, int(cx - rm):int(cx + rm)] |= A[yy[0]:yy[-1] + 1, int(cx - rm):int(cx + rm)]
    if True:
        # mép nhãn là đường tròn: ở giữa thấp hơn ở mép kb·r (elip phối cảnh, đo ở đáy)
        ta, tb = yy[0] - kb * rm, kb * rm
        ba, bb = yy[-1] - kb * rm, kb * rm
        ta -= 2; ba += 2
        ta = max(ta, ystart + 2); ba = min(ba, y1 - 2)
        # bề ngang nhãn: cột có ≥ 30 % điểm nhãn trong dải
        cov = np.array([mask[int(ta + tb):int(ba + bb), x].mean() for x in range(int(cx - 0.97 * rm), int(cx + 0.97 * rm) + 1)])
        xx = np.arange(int(cx - 0.97 * rm), int(cx + 0.97 * rm) + 1)[cov > 0.3]
        u0 = float(np.arcsin(np.clip((xx[0] - cx) / rm, -1, 1))); u1 = float(np.arcsin(np.clip((xx[-1] - cx) / rm, -1, 1)))
        wrap = u0 < -1.15 and u1 > 1.15
        u0, u1 = (max(u0, -1.2566), min(u1, 1.2566)) if wrap else (u0, u1)
        # nắn phẳng: x = cx + r(y) sin u ; y nội suy tuyến tính giữa hai đường cong
        hpx = int(round((ba + bb) - (ta + tb)))
        wpx = int(round(rm * (u1 - u0)))
        U, Vv = np.meshgrid(np.linspace(u0, u1, wpx), (np.arange(hpx) + .5) / hpx)
        my = (ta + tb * np.cos(U)) * (1 - Vv) + (ba + bb * np.cos(U)) * Vv
        ry = np.interp(my, np.arange(y0, y1 + 1), r)
        mx = cx + ry * np.sin(U)
        # khử bóng sáng chụp sẵn theo cột (đo ở thân ngoài nhãn)
        g = np.clip(ref.mean() / np.maximum(colref.mean(-1), 1), 1.0, 1.35)
        flat = cv2.remap(rgb * g[None, :, None], mx.astype(np.float32), my.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).clip(0, 255)
        Image.fromarray(flat.astype(np.uint8)).save(os.path.join(out, slug + '-nhan-goc.png'))
        tw, th = save_sr(sess, flat, os.path.join(out, slug + '-nhan-4k.png'))
        # độ cao nhãn theo trục (cm từ đáy): lấy tại mép (cos = 0), là đường tròn thật trên thân
        label = dict(y0=float((y1 - ba) * s), y1=float((y1 - ta) * s), u0=u0, u1=u1, wrap=bool(wrap))
        lab_rows = (np.arange(y0, y1 + 1) >= ta + tb) & (np.arange(y0, y1 + 1) <= ba + bb)
        band[lab_rows] = np.nan
    # màu đỉnh: nội suy qua vùng nhãn, đưa về albedo
    for ch in range(3):
        b = band[:, ch]; ok = ~np.isnan(b)
        band[:, ch] = np.interp(np.arange(len(b)), np.where(ok)[0], b[ok])
    sat, val = hsv(band)
    alb = band.copy()
    white = (sat < 0.12) & (val > 0.55) & (not glass)
    alb[white] = [242, 242, 239]
    alb[~white] = np.clip(band[~white] * 1.12, 0, 255)
    step = 2
    idx = np.arange(0, nb, step)
    prof = [[float(r[i] * s), float((y1 - (y0 + i)) * s)] for i in idx][::-1]   # đáy -> đỉnh
    cols = [lin(alb[i]).round(4).tolist() for i in idx][::-1]
    spec = dict(kind='tron', slug=slug, cm_per_px=float(s), h=float((y1 - y0) * s), w=float(2 * rmax * s),
                profile=prof, colors=cols, glass=glass, cap=cap, label=label, xo=is_xo)
    json.dump(spec, open(os.path.join(out, slug + '.json'), 'w'))
    return spec


def det(sess, slug, out):
    rgb, al = load(slug)
    A = al > 0.5
    yy, xx = np.where(A); y0, y1, x0, x1 = yy.min(), yy.max(), xx.min(), xx.max()
    c = rgb[y0:y1 + 1, x0:x1 + 1]; a = A[y0:y1 + 1, x0:x1 + 1]
    sat, val = hsv(c)
    foil = (sat < 0.16) & (val > 0.35) & (val < 0.97) & a
    h = c.shape[0]
    topband = slice(int(h * 0.02), int(h * 0.10))
    foil_any = (sat < 0.16) & (val > 0.35) & a          # kể cả chỗ nhôm lóa trắng
    is_foil = foil_any[topband][a[topband]].mean() > 0.5
    if is_foil:
        nf = ndi.binary_opening(a & ~foil, iterations=2)
        lab, n = ndi.label(nf)
        sizes = np.bincount(lab.ravel()); keep = np.zeros_like(nf)
        for i in range(1, n + 1):
            if sizes[i] > 0.015 * a.sum(): keep |= lab == i
        keep = ndi.binary_fill_holes(ndi.binary_closing(keep, iterations=6))
        alpha = (ndi.binary_dilation(keep, iterations=1) & a).astype(np.float32)
        alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
        basecol = [223, 226, 230]
    else:
        alpha = a.astype(np.float32)
        basecol = np.median(c[topband][a[topband]], 0).tolist()
    q, unit = qty(slug)
    m = q if (q and unit == 'g') else 500
    W = 16 * (m / 250) ** 0.19
    Hc = W * h / c.shape[1]
    tw, th = save_sr(sess, c, os.path.join(out, slug + '-nhan-4k.png'), alpha)
    spec = dict(kind='tui' if is_foil else 'bao', slug=slug, w=float(W), h=float(Hc), foil=bool(is_foil),
                base=lin(basecol).round(4).tolist(), mass_g=m)
    json.dump(spec, open(os.path.join(out, slug + '.json'), 'w'))
    return spec


if __name__ == '__main__':
    import onnxruntime as ort
    model, out, kind = sys.argv[1:4]
    os.makedirs(out, exist_ok=True)
    sess = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
    for slug in sys.argv[4:]:
        if os.path.exists(os.path.join(out, slug + '.json')): print('bỏ qua (đã có)', slug, flush=True); continue
        try:
            sp = (tron if kind == 'tron' else det)(sess, slug, out)
            print(slug, sp['kind'], f"{sp['w']:.1f}×{sp['h']:.1f} cm", 'nhãn' if sp.get('label') or sp['kind'] != 'tron' else 'KHÔNG THẤY NHÃN', flush=True)
        except Exception as e:
            print('LỖI', slug, e, flush=True)
