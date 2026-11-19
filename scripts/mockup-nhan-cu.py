#!/usr/bin/env python3
"""Tách NHÃN CŨ khỏi ảnh bao bì đang đăng trên web, nắn phẳng rồi nâng nét lên 4K.

Nguồn: public/images/products-cutout/<slug>.webp (ảnh bao bì tách nền, cao 900 px).
Không vẽ lại, không thêm bớt chữ: chỉ nắn hình học (bỏ cong trụ), khử bóng sáng chụp sẵn
và phóng to bằng Real-ESRGAN x4plus (ONNX, chạy CPU).

  python3 scripts/mockup-nhan-cu.py <model.onnx> <thư mục ra> [slug ...]

Cần: pip install opencv-python-headless onnxruntime pillow numpy
"""
import sys, os, numpy as np, cv2
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'products-cutout')
MAXDEG = 72  # chỉ lấy ±72° quanh mặt trước: ngoài đó ảnh gốc bị nén quá mạnh

# Thông số đo trên ảnh tách nền (px): cx, R = tâm và bán kính thân; top/bot = mép nhãn ở góc 90°
# và độ võng (px) ở chính giữa do phối cảnh; white = các dải thân trắng dùng để đo bóng sáng.
SPEC = {
    'super-yucca': dict(kind='tru', cx=196.0, R=165.0, top=(256, 15), bot=(732, 57), white=[(236, 256), (800, 812)]),
    'bio-aq': dict(kind='tru', cx=305.5, R=280.0, top=(205, -9.4), bot=(747, 27), white=[(110, 170), (792, 812)]),
    'clear-12h': dict(kind='phang', box=(94, 250, 508, 738)),
    'mix-79': dict(kind='phang', box=(27, 157, 493, 790)),
}


def load(slug):
    im = np.asarray(Image.open(os.path.join(SRC, slug + '.webp')).convert('RGBA')).astype(np.float32)
    a = im[..., 3:4] / 255.
    return im[..., :3] * a + 255. * (1 - a), a[..., 0]


def flat_cylinder(rgb, alpha, sp):
    """Trải nửa mặt trước của nhãn quấn trụ ra phẳng (chiều ngang theo góc quay)."""
    cx, R = sp['cx'], sp['R']
    (t90, tb), (b90, bb) = sp['top'], sp['bot']
    # khử bóng sáng chụp sẵn: lấy độ sáng theo cột ở phần thân trắng
    prof = []
    for y0, y1 in sp['white']:
        band = rgb[y0:y1].mean(-1); m = alpha[y0:y1] > .9
        prof.append(np.where(m.sum(0) > 0, (band * m).sum(0) / np.maximum(m.sum(0), 1), np.nan))
    prof = np.nanmean(np.array(prof), 0)
    prof = cv2.GaussianBlur(np.nan_to_num(prof, nan=np.nanmax(prof)).reshape(1, -1), (0, 0), 9)[0]
    gain = np.clip(np.percentile(prof, 90) / prof, 1.0, 1.35)
    rgb = np.clip(rgb * gain[None, :, None], 0, 255)
    th = np.deg2rad(MAXDEG)
    W = int(round(R * 2 * th)); H = int(round((b90 + bb) - (t90 + tb)))
    u = (np.arange(W) + .5) / W * 2 * th - th
    v = (np.arange(H) + .5) / H
    U, V = np.meshgrid(u, v)
    mx = (cx + R * np.sin(U)).astype(np.float32)
    my = ((t90 + tb * np.cos(U)) * (1 - V) + (b90 + bb * np.cos(U)) * V).astype(np.float32)
    return cv2.remap(rgb, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def flat_box(rgb, sp):
    x0, y0, x1, y1 = sp['box']
    return rgb[y0:y1, x0:x1]


def upscale(sess, a, pad=8):
    tile = sess.get_inputs()[0].shape[2]
    tile = tile if isinstance(tile, int) else 128   # mô hình ONNX cố định ô 64 px thì chia ô 64
    a = a.astype(np.float32) / 255.
    H, W, _ = a.shape
    out = np.zeros((H * 4, W * 4, 3), np.float32)
    step = tile - 2 * pad
    ap = np.pad(a, ((pad, pad + tile), (pad, pad + tile), (0, 0)), mode='reflect')
    name = sess.get_inputs()[0].name
    for y in range(0, H, step):
        for x in range(0, W, step):
            t = ap[y:y + tile, x:x + tile].transpose(2, 0, 1)[None]
            r = sess.run(None, {name: t})[0][0].transpose(1, 2, 0)
            core = r[pad * 4:(pad + step) * 4, pad * 4:(pad + step) * 4]
            hh = min(step, H - y) * 4; ww = min(step, W - x) * 4
            out[y * 4:y * 4 + hh, x * 4:x * 4 + ww] = core[:hh, :ww]
    return np.clip(out, 0, 1) * 255.


if __name__ == '__main__':
    import onnxruntime as ort
    model, outdir = sys.argv[1:3]
    slugs = sys.argv[3:] or list(SPEC)
    os.makedirs(outdir, exist_ok=True)
    sess = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
    for slug in slugs:
        sp = SPEC[slug]
        rgb, alpha = load(slug)
        flat = flat_cylinder(rgb, alpha, sp) if sp['kind'] == 'tru' else flat_box(rgb, sp)
        Image.fromarray(flat.clip(0, 255).astype(np.uint8)).save(os.path.join(outdir, slug + '-nhan-goc.png'))
        up = upscale(sess, flat)                      # x4 (Real-ESRGAN)
        if os.environ.get('SR2', '1') == '1':
            up = upscale(sess, up)                    # x16
        h, w = up.shape[:2]
        k = 4096 / max(h, w)                          # đưa cạnh dài về 4096 px
        up = cv2.resize(up, (int(round(w * k)), int(round(h * k))), interpolation=cv2.INTER_AREA if k < 1 else cv2.INTER_LANCZOS4)
        Image.fromarray(up.clip(0, 255).astype(np.uint8)).save(os.path.join(outdir, slug + '-nhan-4k.png'))
        print(slug, flat.shape[1], 'x', flat.shape[0], '->', up.shape[1], 'x', up.shape[0], flush=True)
