#!/usr/bin/env python3
"""Mockup 4K bao bì Noben từ nhãn cũ (ảnh cutout đã nâng x4 bằng scripts/mockup-sr.py).

Dùng: python3 scripts/mockup-render.py <thư mục chứa *-x4.png> <thư mục ra>
Ra: <slug>-nhan-phang-4k.png (nhãn tách + làm thẳng), <slug>-mockup-4k.png,
    so-sanh-truoc-sau.png. Khung 1 : φ (2374 × 3840 px).
"""
import sys, os, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PHI = 1.61803
W4, H4 = 2374, 3840                      # khung dọc 1 : φ, cạnh dài 4K
SRC = 'public/images/products-cutout/{}.webp'
POSTER = 'public/images/products/{}.webp'

# ---- thông số đo trên ảnh cutout gốc (px của cutout 900 px cao) -------------
P = {
  'super-yucca': dict(kind='lathe', label=(258, 768), shade_rows=(200, 240),
                      cap=(27, 92), tmax=80, color=(246, 246, 242),
                      dim='Chai HDPE 500 ml: giả định Ø 76 mm × cao 193 mm; nhãn cao ≈117 mm, '
                          'phần nhãn nhìn thấy (160°) rộng ≈106 mm'),
  'aqualacto-q': dict(kind='lathe', label=(160, 772), shade_rows=(790, 840),
                      cap=(25, 152), tmax=78, color=(243, 243, 241), seam=154, white_bg=True, face=False,
                      dim='Hũ nhựa tròn 500 g: giả định Ø 100 mm × cao 144 mm; vùng in cao ≈104 mm'),
  'mix-79':      dict(kind='bag', panel=(30, 155, 490, 790), bag=(27, 27, 492, 872),
                      dim='Túi 5 kg: giả định 350 × 636 mm; mặt nhãn ≈346 × 478 mm'),
}

def lin(a): return np.asarray(a, np.float32) / 255.

def unwrap(slug, x4, p):
    """Tách nhãn trên thân trụ, trải phẳng (bỏ cong), bù bóng theo cột."""
    a = np.asarray(Image.open(SRC.format(slug)).convert('RGBA'))[:, :, 3]
    y0, y1 = p['label']
    rows = [y for y in range(y0, y1, 4)]
    L = np.array([np.where(a[y] > 128)[0].min() for y in rows]).mean()
    R_ = np.array([np.where(a[y] > 128)[0].max() for y in rows]).mean()
    cx, R = (L + R_) / 2 * 4, (R_ - L) / 2 * 4
    img = lin(x4.convert('RGB'))
    # bù bóng: cột nhựa trắng ngoài nhãn cho biết độ sáng theo góc
    s0, s1 = p['shade_rows']
    prof = img[s0*4:s1*4].mean(axis=(0, 2))
    prof = cv2.GaussianBlur(prof[None], (0, 0), 6)[0]
    tm = np.radians(p['tmax'])
    Wf = int(2 * tm * R)
    th = (np.arange(Wf) + .5) / R - tm
    mx = (cx + R * np.sin(th)).astype(np.float32)
    my = np.arange(y0 * 4, y1 * 4, dtype=np.float32)
    MX, MY = np.meshgrid(mx, my)
    flat = cv2.remap(img, MX, MY, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    g = np.interp(mx, np.arange(len(prof)), prof)
    gain = np.clip(prof[int(cx)] / np.maximum(g, 1e-3), 1, 1.7)
    flat = np.clip(flat * gain[None, :, None], 0, 1)
    # cân trắng theo vùng nhựa trắng giữa
    ref = img[s0*4:s1*4, int(cx)-40:int(cx)+40].reshape(-1, 3).mean(0)
    flat = np.clip(flat * (0.965 / np.maximum(ref, .3)), 0, 1)
    if p.get('white_bg'):                                # in trực tiếp lên hũ trắng: làm phẳng nền
        lum = flat.max(2)
        bgest = cv2.dilate(lum, np.ones((41, 41), np.uint8))
        bgest = cv2.GaussianBlur(bgest, (0, 0), 25)
        flat = np.clip(flat / np.maximum(bgest, .4)[..., None] * .965, 0, 1)
    return flat, (L, R_)

def profile(slug, lab_top=0, lab_bot=0):
    a = np.asarray(Image.open(SRC.format(slug)).convert('RGBA'))[:, :, 3] > 128
    ys = np.where(a.any(1))[0]; top, bot = ys.min(), ys.max()
    r = np.zeros(a.shape[0]); c = np.zeros(a.shape[0])
    for y in range(top, bot + 1):
        xs = np.where(a[y])[0]
        if len(xs): r[y] = (xs.max() - xs.min()) / 2; c[y] = (xs.max() + xs.min()) / 2
    # đáy và đỉnh trong ảnh gốc bị bo do phối cảnh: giữ bán kính thẳng tới mép
    from scipy.ndimage import median_filter, gaussian_filter1d
    r = gaussian_filter1d(median_filter(r, 15), 3)
    if lab_bot: r[lab_bot:bot + 1] = r[lab_bot - 10]
    if lab_top: r[(top+lab_top)//2:lab_top] = np.maximum(r[(top+lab_top)//2:lab_top], 0)
    return r, top, bot, np.median(c[top:bot])

def studio(bbox_w, foot_y, cx):
    """Nền studio sáng nhẹ + bóng đổ mềm."""
    y = np.linspace(0, 1, H4)[:, None]; x = np.linspace(-1, 1, W4)[None]
    base = 0.975 - 0.07 * y + 0.0 * x
    vig = 1 - 0.09 * (x**2 + (y - .45)**2 * 1.3)
    bg = np.clip(base * vig, 0, 1)[..., None] * np.array([1, .995, .985])[None, None]
    sh = np.zeros((H4, W4), np.float32)
    cv2.ellipse(sh, (int(cx), int(foot_y)), (int(bbox_w * .62), int(bbox_w * .1)), 0, 0, 360, 1, -1)
    sh = cv2.GaussianBlur(sh, (0, 0), bbox_w * .07) * .38
    c2 = np.zeros_like(sh)
    cv2.ellipse(c2, (int(cx), int(foot_y)), (int(bbox_w * .5), int(bbox_w * .035)), 0, 0, 360, 1, -1)
    sh += cv2.GaussianBlur(c2, (0, 0), bbox_w * .018) * .45
    return np.clip(bg * (1 - np.clip(sh, 0, .7))[..., None], 0, 1)

def light(nx, ny, nz, gloss=60, ks=.55):
    Lv = np.array([-.55, -.55, .63]); Lv /= np.linalg.norm(Lv)
    F = np.array([.75, -.1, .65]); F /= np.linalg.norm(F)
    dif = np.clip(nx*Lv[0] + ny*Lv[1] + nz*Lv[2], 0, 1)
    fil = np.clip(nx*F[0] + ny*F[1] + nz*F[2], 0, 1)
    H = Lv + np.array([0, 0, 1]); H /= np.linalg.norm(H)
    spec = np.clip(nx*H[0] + ny*H[1] + nz*H[2], 0, 1) ** gloss * ks
    # dải phản chiếu softbox dọc (đặc trưng chai nhựa trong studio)
    strip = np.exp(-((nx + .45) / .09) ** 2) * .13 + np.exp(-((nx - .66) / .06) ** 2) * .06
    fres = (1 - nz) ** 3
    return .60 + .32 * dif + .10 * fil, spec + strip * (nz > .2), fres

def render_lathe(slug, p, flat):
    r_s, top, bot, _ = profile(slug, *p['label'])
    hgt = 0.66 * H4; sc = hgt / (bot - top)
    cx = W4 / 2; y_top = (H4 - hgt) / 2 - .04 * H4
    Rb = r_s[(p['label'][0] + p['label'][1]) // 2] * sc
    k = .075 * Rb                                       # camera hơi cao: viền elip
    Y, X = np.mgrid[0:H4, 0:W4].astype(np.float32)
    dx = X - cx
    ys = Y.copy()
    rr = lambda yy: np.interp((yy - y_top) / sc + top, np.arange(len(r_s)), r_s) * sc
    for _ in range(3):
        r = rr(ys); sn = np.clip(dx / np.maximum(r, 1), -1, 1); cs = np.sqrt(1 - sn**2)
        ys = Y - k * cs
    r = rr(ys)
    srow = (ys - y_top) / sc + top                       # hàng ảnh gốc
    inside = (srow >= top) & (srow <= bot)
    alpha = np.clip(r - np.abs(dx) + .5, 0, 1) * inside * (r > 2)
    # biên trên / dưới mềm
    alpha *= np.clip((srow - top) * sc + .5, 0, 1) * np.clip((bot - srow) * sc + .5, 0, 1)
    sn = np.clip(dx / np.maximum(r, 1), -.999, .999); cs = np.sqrt(1 - sn**2)
    from scipy.ndimage import gaussian_filter1d
    dr = gaussian_filter1d(np.gradient(rr(np.arange(H4, dtype=np.float32))), 10)
    drv = np.interp(ys, np.arange(H4), dr)
    nx, ny, nz = sn, -drv * cs, cs
    nn = np.sqrt(nx**2 + ny**2 + nz**2); nx, ny, nz = nx/nn, ny/nn, nz/nn
    alb = np.ones((H4, W4, 3), np.float32) * lin(p['color'])
    # nhãn
    th = np.arcsin(sn); tm = np.radians(p['tmax'])
    l0, l1 = p['label']
    u = (th + tm) / (2 * tm) * flat.shape[1]
    v = (srow - l0) / (l1 - l0) * flat.shape[0]
    onl = (srow >= l0) & (srow < l1) & (alpha > 0)
    lab = cv2.remap(flat, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR,
                    borderMode=cv2.BORDER_REPLICATE)
    m = onl.astype(np.float32)
    m = cv2.GaussianBlur(m, (0, 0), .7)
    alb = alb * (1 - m[..., None]) + lab * m[..., None]
    # nắp: gân dọc
    c0, c1 = p['cap']
    capm = (srow >= c0) & (srow <= c1)
    if slug == 'super-yucca':
        rib = 1 - .07 * (.5 + .5 * np.cos(th * 70)) * np.clip((srow - c0) / 6, 0, 1)
        alb = np.where(capm[..., None], alb * rib[..., None], alb)
    if 'seam' in p:                                      # khe nắp – thân hũ
        sm = np.exp(-((srow - p['seam']) / 1.2) ** 2)
        alb *= (1 - .45 * sm)[..., None]
    sh, spec, fres = light(nx, ny, nz, gloss=45, ks=.22)
    col = alb * sh[..., None] * (1 - .30 * fres)[..., None] + spec[..., None]
    # mặt nắp nhìn từ trên (elip)
    rmax = r_s[top:top + 40].max(); ft = top + int(np.argmax(r_s[top:top + 40] > .9 * rmax))
    rc = r_s[ft] * sc; face = np.zeros((H4, W4), np.float32)
    cv2.ellipse(face, (int(cx), int(y_top + (ft - top) * sc)), (int(rc - 2), int(k * rc / Rb)), 0, 0, 360, 1, -1)
    face = cv2.GaussianBlur(face, (0, 0), 1.2)
    fcol = lin(p['color']) * (.98 - .1 * np.clip((X - cx) / rc, -1, 1))[..., None]
    bg = studio(2 * Rb, y_top + (bot - top) * sc + k - 6, cx)
    if p.get('face', True): bg = bg * (1 - face[..., None]) + fcol * face[..., None]
    out = bg
    out = out * (1 - alpha[..., None]) + np.clip(col, 0, 1) * alpha[..., None]
    return out

def render_bag(slug, x4, p):
    img = lin(x4.convert('RGB'))
    bx0, by0, bx1, by1 = p['bag']; px0, py0, px1, py1 = p['panel']
    panel = img[py0*4:py1*4, px0*4:px1*4]
    bw = .66 * W4; bh = bw * (by1 - by0) / (bx1 - bx0)
    x0 = (W4 - bw) / 2; y0 = (H4 - bh) / 2 - .02 * H4
    Y, X = np.mgrid[0:H4, 0:W4].astype(np.float32)
    u = (X - x0) / bw; v = (Y - y0) / bh
    seal = .055
    # dáng gối: hông thắt vào gần mép hàn
    pinch = .018 * (1 - np.clip(np.minimum(v, 1 - v) / .16, 0, 1)) ** 2
    inside = (u > pinch) & (u < 1 - pinch) & (v > 0) & (v < 1)
    # mép hàn răng cưa trên / dưới
    tooth = (np.abs(((X - x0) / 14) % 2 - 1)) * 10
    inside &= (Y > y0 + tooth) & (Y < y0 + bh - tooth)
    alpha = cv2.GaussianBlur(inside.astype(np.float32), (0, 0), .8)
    uu = np.clip((u - pinch) / (1 - 2 * pinch), 0, 1)
    body = (v > seal) & (v < 1 - seal)
    vb = np.clip((v - seal) / (1 - 2 * seal), 0, 1)
    h = (np.clip(np.sin(np.pi * uu), 0, 1) ** .55) * (np.clip(np.sin(np.pi * vb), 0, 1) ** .45) * body
    h = cv2.GaussianBlur(h.astype(np.float32), (0, 0), 6) * 140
    gy, gx = np.gradient(h)
    nx, ny, nz = -gx, -gy, np.ones_like(h)
    # nếp nhăn nhẹ ở mép hàn
    wr = (~body) * np.sin(u * 90) * .25
    nx = nx + wr
    nn = np.sqrt(nx**2 + ny**2 + nz**2); nx, ny, nz = nx/nn, ny/nn, nz/nn
    gold = np.array([.92, .76, .16])
    sh, spec, fres = light(nx, ny, nz, gloss=25, ks=.9)
    foil = gold * (.35 + .75 * sh[..., None]) + spec[..., None] * np.array([1, .95, .7])
    foil *= (1 - .25 * fres)[..., None]
    # in nhãn: co nhẹ theo độ phồng
    pu0 = (px0 - bx0) / (bx1 - bx0); pu1 = (px1 - bx0) / (bx1 - bx0)
    pv0 = (py0 - by0) / (by1 - by0); pv1 = (py1 - by0) / (by1 - by0)
    uw = uu - .012 * np.sin(2 * np.pi * uu)
    pu = (uw - pu0) / (pu1 - pu0); pv = (v - pv0) / (pv1 - pv0)
    onp = (pu >= 0) & (pu <= 1) & (pv >= 0) & (pv <= 1)
    lab = cv2.remap(panel, (pu * panel.shape[1]).astype(np.float32),
                    (pv * panel.shape[0]).astype(np.float32), cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE)
    lit = lab * (.55 + .5 * sh[..., None]) + spec[..., None] * .35
    m = cv2.GaussianBlur(onp.astype(np.float32), (0, 0), .7)
    col = foil * (1 - m[..., None]) + lit * m[..., None]
    bg = studio(bw, y0 + bh - 6, W4 / 2)
    return bg * (1 - alpha[..., None]) + np.clip(col, 0, 1) * alpha[..., None]

def save(a, path):
    Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8)).save(path, optimize=True)

def to4k(a):
    h, w = a.shape[:2]; s = 3840 / max(h, w)
    if s <= 1: return a
    b = cv2.resize(a, (round(w * s), round(h * s)), interpolation=cv2.INTER_LANCZOS4)
    bl = cv2.GaussianBlur(b, (0, 0), 1.2)
    return np.clip(b + .35 * (b - bl), 0, 1)              # unsharp nhẹ

def main(sr, out):
    os.makedirs(out, exist_ok=True)
    shots = []
    for slug, p in P.items():
        x4 = Image.open(f'{sr}/{slug}-x4.png')
        if p['kind'] == 'lathe':
            flat, _ = unwrap(slug, x4, p)
            save(to4k(flat), f'{out}/{slug}-nhan-phang-4k.png')
            m = render_lathe(slug, p, flat)
        else:
            a = lin(x4.convert('RGB')); x0, y0, x1, y1 = p['panel']
            save(to4k(a[y0*4:y1*4, x0*4:x1*4]), f'{out}/{slug}-nhan-phang-4k.png')
            m = render_bag(slug, x4, p)
        save(m, f'{out}/{slug}-mockup-4k.png'); shots.append((slug, m))
        print('xong', slug)
    sheet(shots, out)

def sheet(shots, out):
    """Tờ so sánh: hàng trên ảnh cũ (poster web), hàng dưới mockup 4K."""
    cw, ch = 1040, 1683                                   # ô 1 : φ
    g = 68; W = 3 * cw + 4 * g; H = 2 * ch + 3 * g + 110
    S = Image.new('RGB', (W, H), (247, 246, 242)); d = ImageDraw.Draw(S)
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 42)
    except Exception: f = ImageFont.load_default()
    d.text((g, 40), 'TRƯỚC: ảnh trên web (532×1009)  ·  SAU: mockup 4K (2374×3840)', fill=(20, 40, 80), font=f)
    for i, (slug, m) in enumerate(shots):
        old = Image.open(POSTER.format(slug)).convert('RGB')
        old = old.resize((round(old.width * ch / old.height), ch), Image.LANCZOS)
        x = g + i * (cw + g)
        S.paste(old, (x + (cw - old.width) // 2, 110 + g))
        new = Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)); new.thumbnail((cw, ch), Image.LANCZOS)
        S.paste(new, (x + (cw - new.width) // 2, 110 + 2 * g + ch))
    S.save(f'{out}/so-sanh-truoc-sau.png', optimize=True)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
