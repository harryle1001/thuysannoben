#!/usr/bin/env python3
"""Nâng phân giải ảnh x4 bằng Real-ESRGAN x4plus (ONNX, tile 128) – chạy CPU.
Dùng: python3 scripts/mockup-sr.py model.onnx in.png out.png"""
import sys, numpy as np, onnxruntime as ort
from PIL import Image

def upscale(model, img, tile=128, pad=12):
    s = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
    a = np.asarray(img.convert('RGB'), np.float32) / 255.
    H, W, _ = a.shape
    out = np.zeros((H*4, W*4, 3), np.float32)
    step = tile - 2*pad
    ap = np.pad(a, ((pad, pad+tile), (pad, pad+tile), (0, 0)), mode='reflect')
    for y in range(0, H, step):
        for x in range(0, W, step):
            t = ap[y:y+tile, x:x+tile].transpose(2, 0, 1)[None]
            r = s.run(None, {'image': t})[0][0].transpose(1, 2, 0)
            core = r[pad*4:(pad+step)*4, pad*4:(pad+step)*4]
            hh = min(step, H-y)*4; ww = min(step, W-x)*4
            out[y*4:y*4+hh, x*4:x*4+ww] = core[:hh, :ww]
    return Image.fromarray((np.clip(out, 0, 1)*255+.5).astype(np.uint8))

if __name__ == '__main__':
    m, i, o = sys.argv[1:4]
    im = Image.open(i)
    up = upscale(m, im)
    if im.mode == 'RGBA':
        up.putalpha(im.getchannel('A').resize(up.size, Image.LANCZOS))
    up.save(o)
