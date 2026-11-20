#!/usr/bin/env node
'use strict';
// Ảnh sản phẩm 4K: dựng bao bì 3D (chai, túi, xô) bằng three.js rồi dán nhãn thật từ brand/nhan/<slug>.svg.
//   node scripts/mockup-pack.js --chi g7-phong-va-tri-benh-gan-chet-som,aqua-yucca,oxy-99 [--out thư-mục] [--w 2160 --h 3840]
// Loại bao bì lấy theo bao_bi trong brand/labels.json: tui*, chai*, xo. Không cần ảnh mockup tải trên mạng.
// Cần three.js 0.149 (`npm i three@0.149.0 --no-save`) và Playwright + Chromium.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (f, d) => { const i = args.indexOf(f); return i > -1 ? args[i + 1] : d; };
const OUT = path.resolve(opt('--out', path.join(ROOT, 'brand', 'anh-3d')));
const W = +opt('--w', 2160), H = +opt('--h', 3840);
const THREE_JS = process.env.THREE_JS || path.join(ROOT, 'node_modules', 'three', 'build', 'three.min.js');
if (!fs.existsSync(THREE_JS)) { console.error('Thiếu three.min.js: chạy `npm i three@0.149.0 --no-save`.'); process.exit(2); }

const { fontCss } = require('./build-labels');
const engine = require(path.join(ROOT, 'public', 'js', 'label-engine.js'));
const labels = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand', 'labels.json'), 'utf8')).san_pham;
const only = (opt('--chi', '') || '').split(',').filter(Boolean);
const list = only.length ? labels.filter((l) => only.includes(l.slug)) : labels;
// Dán ảnh nhãn có sẵn (vd nhãn cũ vẽ lại): --anh file.png --kho chai --mm 240x135 [--ten g7]
const ANH = opt('--anh', '');
const TRONG = args.includes('--trong'); // nền trong suốt (ảnh tách nền cho web)
if (ANH) { const [mw, mh] = opt('--mm', '240x135').split('x').map(Number); list.length = 0; list.push({ slug: opt('--ten', path.basename(ANH, '.png')), bao_bi: opt('--kho', 'chai'), anh: path.resolve(ANH), mw, mh }); }

// Cảnh 3D, chạy trong trình duyệt. Đơn vị: cm.
function scene() {
  /* global THREE, CFG, LABEL */
  THREE.ColorManagement.legacyMode = false;
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: !!CFG.trong });
  r.setPixelRatio(1); r.setSize(CFG.W, CFG.H);
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.9;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.physicallyCorrectLights = true;
  document.body.appendChild(r.domElement);
  const s = new THREE.Scene();
  const BG = 0xeceff3;
  if (!CFG.trong) s.background = new THREE.Color(BG);

  // Phòng studio cho phản chiếu mềm
  const env = new THREE.Scene(); env.background = new THREE.Color(0x9a9da2);
  const box = (w, h, x, y, z, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 10, 0); env.add(m); };
  box(70, 110, -90, 50, 60, 3.6); box(55, 90, 95, 40, 50, 1.7); box(140, 40, 0, 120, 10, 2.4); box(400, 400, 0, -80, 0, 0.7); box(60, 80, 0, 30, -120, 1.6);
  const pm = new THREE.PMREMGenerator(r); s.environment = pm.fromScene(env, 0.035).texture;

  const tex = new THREE.Texture(LABEL); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = r.capabilities.getMaxAnisotropy(); tex.needsUpdate = true;
  const LW = CFG.lw / 10, LH = CFG.lh / 10; // khổ nhãn, cm
  const labelMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.55, clearcoat: 0.12, clearcoatRoughness: 0.45, envMapIntensity: 0.6 });
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf3f3f0, roughness: 0.5, clearcoat: 0.14, clearcoatRoughness: 0.55, sheen: 0.2, sheenRoughness: 0.8, envMapIntensity: 0.9 });
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0xfbfbfa, roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.9 });
  const V2 = (p) => p.map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.Group();
  const add = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; g.add(m); return m; };

  if (CFG.kind === 'chai') {
    // Chai HDPE dáng chai Noben; phóng theo chiều cao nhãn (thân thẳng cao hơn nhãn 1 cm)
    const k = (LH + 1) / 14.5, R = 4.6 * k;
    const pts = [[0, 0], [3.7, 0], [4.2, 0.1], [4.5, 0.38], [4.6, 0.9], [4.6, 15.4]];
    for (let i = 1; i <= 18; i++) { const t = (i / 18) * Math.PI / 2; pts.push([2.2 + 2.4 * Math.cos(t), 15.4 + 4.3 * Math.sin(t)]); }
    pts.push([2.2, 20.1], [2.52, 20.2], [2.52, 20.5], [2.12, 20.6], [2.12, 22.4]);
    add(new THREE.Mesh(new THREE.LatheGeometry(V2(pts.map(([x, y]) => [x * k, y * k])), 192), white));
    const ring = add(new THREE.Mesh(new THREE.LatheGeometry(V2([[2.12, 0], [2.5, 0.03], [2.52, 0.34], [2.44, 0.4], [2.12, 0.4]].map(([x, y]) => [x * k, y * k])), 128), capMat));
    ring.position.y = 20.68 * k;
    const cap = add(new THREE.Mesh(new THREE.LatheGeometry(V2([[0, 2.62], [2.05, 2.62], [2.26, 2.56], [2.38, 2.42], [2.42, 2.22], [2.42, 0.06], [2.36, 0], [2.12, 0]].map(([x, y]) => [x * k, y * k])), 128), capMat));
    cap.position.y = 21.16 * k;
    const rib = new THREE.BoxGeometry(0.085 * k, 2.0 * k, 0.09 * k);
    for (let i = 0; i < 80; i++) { const a = (i / 80) * Math.PI * 2; const m = new THREE.Mesh(rib, capMat); m.position.set(Math.sin(a) * 2.44 * k, (21.16 + 1.12) * k, Math.cos(a) * 2.44 * k); m.rotation.y = a; g.add(m); }
    const len = LW / (R + 0.012);
    const l = add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, LH, 240, 1, true, -len / 2, len), labelMat), false);
    l.position.y = 0.9 * k + (14.5 * k - LH) / 2 + LH / 2;
    CFG.height = 23.8 * k; CFG.width = 2 * R;
  } else if (CFG.kind === 'xo') {
    // Xô nhựa có nắp, quai thép: thân côn, nhãn quấn mặt trước
    const Hb = LH + 4.2, rb = (LW / 1.9), rt = rb + 1.7;
    const rAt = (y) => rb + (rt - rb) * (y / Hb);
    const p = [[0, 0], [rb - 0.5, 0], [rb - 0.1, 0.15], [rb, 0.6]];
    for (let i = 1; i <= 20; i++) { const y = 0.6 + (Hb - 2.2) * i / 20; p.push([rAt(y), y]); }
    p.push([rAt(Hb - 1.5) + 0.35, Hb - 1.5], [rAt(Hb - 1.2) + 0.35, Hb - 1.2], [rAt(Hb - 1.1), Hb - 1.1], [rt + 0.5, Hb - 0.4], [rt + 0.55, Hb], [0, Hb]);
    add(new THREE.Mesh(new THREE.LatheGeometry(V2(p), 192), white));
    // nắp: mép ôm ngoài miệng xô, mặt hơi nhô
    const lid = [[0, Hb + 0.9], [rt - 1.5, Hb + 0.85], [rt + 0.35, Hb + 0.75], [rt + 0.75, Hb + 0.55], [rt + 0.8, Hb - 0.6], [rt + 0.6, Hb - 0.7]];
    add(new THREE.Mesh(new THREE.LatheGeometry(V2(lid), 192), capMat));
    // nhãn trên mặt côn
    const y0 = 1.8, y1 = y0 + LH, rm = rAt((y0 + y1) / 2) + 0.02, len = LW / rm;
    const l = add(new THREE.Mesh(new THREE.CylinderGeometry(rAt(y1) + 0.02, rAt(y0) + 0.02, LH, 240, 1, true, -len / 2, len), labelMat), false);
    l.position.y = (y0 + y1) / 2;
    // tai và quai thép
    const metal = new THREE.MeshStandardMaterial({ color: 0x9aa1aa, metalness: 0.9, roughness: 0.32 });
    const ey = Hb - 2.6, er = rAt(ey) + 0.35;
    [-1, 1].forEach((sg) => { const ear = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 1.8), white)); ear.position.set(sg * er, ey, 0); });
    const pts = [];
    for (let i = 0; i <= 64; i++) { const t = Math.PI * i / 64; pts.push(new THREE.Vector3(-Math.cos(t) * (er + 0.3), ey + Math.sin(t) * (rt * 0.62) + (t > 0.2 && t < Math.PI - 0.2 ? 0.8 : 0) * Math.sin(t), -Math.sin(t) * rt * 0.55)); }
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.13, 12, false), metal));
    const grip = add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 6, 32), new THREE.MeshPhysicalMaterial({ color: 0x2a3340, roughness: 0.55 })));
    grip.rotation.z = Math.PI / 2; grip.position.copy(pts[32]);
    CFG.height = Hb + rt * 0.62 + 1.5; CFG.width = 2 * (rt + 1.2);
  } else {
    // Túi nhựa trắng hàn mép trên, phồng nhẹ ở giữa; nhãn dán mặt trước theo bề mặt túi
    const Wb = LW * 1.5, Hb = LH * 1.42, D = Wb * 0.2;
    const bulge = (u, v) => {
      const a = Math.pow(Math.sin(Math.PI * u), 0.75);
      const top = v > 0.9 ? 0 : v > 0.8 ? (0.9 - v) / 0.1 : 1, bot = v < 0.04 ? v / 0.04 : 1;
      const vv = Math.min(v / 0.86, 1); return a * Math.pow(Math.sin(Math.PI * vv), 0.5) * (vv < 0.5 ? 1 : 1) * Math.min(top, 1) * Math.max(bot, 0) + 0 * v;
    };
    const pos = (u, v, sgn, off) => {
      const b = bulge(u, v);
      const x = (u - 0.5) * Wb * (1 - 0.07 * b) + Math.sin(v * 31 + u * 7) * 0.03 * b;
      const z = sgn * (D * b + off) + Math.sin(u * 23 + v * 17) * 0.05 * b + Math.sin(u * 9 - v * 41) * 0.035 * b * (1 - b);
      return [x, v * Hb, z];
    };
    const surf = (u0, u1, v0, v1, sgn, off, nu, nv) => {
      const geo = new THREE.BufferGeometry(), P = [], UV = [], I = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const u = u0 + (u1 - u0) * i / nu, v = v0 + (v1 - v0) * j / nv;
        P.push(...pos(u, v, sgn, off)); UV.push(sgn > 0 ? i / nu : 1 - i / nu, j / nv);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
        if (sgn > 0) I.push(a, b, d, a, d, c); else I.push(a, d, b, a, c, d);
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      geo.setIndex(I); geo.computeVertexNormals(); return geo;
    };
    const bag = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f4, roughness: 0.62, sheen: 0.4, sheenRoughness: 0.6, clearcoat: 0.08, envMapIntensity: 0.8, side: THREE.DoubleSide });
    add(new THREE.Mesh(surf(0, 1, 0, 1, 1, 0, 160, 220), bag));
    add(new THREE.Mesh(surf(0, 1, 0, 1, -1, 0, 80, 110), bag));
    // đường hàn mép trên
    const seal = add(new THREE.Mesh(new THREE.BoxGeometry(Wb, Hb * 0.012, 0.03), new THREE.MeshPhysicalMaterial({ color: 0xe4e6e9, roughness: 0.5 })));
    seal.position.set(0, Hb * 0.955, 0.02);
    const du = LW / Wb / 2, vc = 0.44, dv = LH / Hb / 2;
    add(new THREE.Mesh(surf(0.5 - du, 0.5 + du, vc - dv, vc + dv, 1, 0.025, 120, 180), labelMat), false);
    CFG.height = Hb; CFG.width = Wb;
  }
  s.add(g);
  g.rotation.y = CFG.kind === 'tui' ? -0.34 : -0.2;

  // Sàn, bóng tiếp xúc, đèn
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: BG, roughness: 0.92, envMapIntensity: 0.25 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; if (!CFG.trong) s.add(floor);
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d');
  const gr = c.createRadialGradient(256, 256, 20, 256, 256, 250); gr.addColorStop(0, 'rgba(30,36,48,.5)'); gr.addColorStop(.45, 'rgba(30,36,48,.2)'); gr.addColorStop(1, 'rgba(30,36,48,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 512, 512);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(CFG.width * 1.7, CFG.width * 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.set(0, 0.02, 0.5); s.add(sh);
  const Hh = CFG.height;
  s.add(new THREE.HemisphereLight(0xffffff, 0xcfd3d8, 0.4));
  const key = new THREE.DirectionalLight(0xfffaf4, 2.6); key.position.set(-Hh * 3.2, Hh * 4.4, Hh * 2.4); key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096); key.shadow.radius = 18; key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -Hh * 2, right: Hh * 2, top: Hh * 2, bottom: -Hh, near: 1, far: Hh * 14 }); s.add(key);
  const fill = new THREE.DirectionalLight(0xeef3ff, 0.55); fill.position.set(Hh * 3, Hh * 1.4, Hh * 2.4); s.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1); rim.position.set(Hh, Hh * 2.4, -Hh * 4.4); s.add(rim);

  // Máy ảnh: sản phẩm chiếm 61,8 % chiều cao khung (tỷ lệ vàng)
  const fov = 20, cam = new THREE.PerspectiveCamera(fov, CFG.W / CFG.H, 1, 4000);
  const vis = Math.max(Hh / 0.618, (CFG.width / 0.8) * CFG.H / CFG.W);
  const d = vis / 2 / Math.tan(fov * Math.PI / 360);
  const ty = Hh * 0.47;
  cam.position.set(0, ty + d * 0.1, d); cam.lookAt(0, ty, 0);
  if (!CFG.trong) s.fog = new THREE.Fog(BG, d * 1.15, d * 2.2);
  r.render(s, cam);
  return r.domElement.toDataURL('image/png');
}

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const css = fontCss();
  fs.mkdirSync(OUT, { recursive: true });
  for (const l of list) {
    const t0 = Date.now();
    // 1) Nhãn → PNG độ phân giải cao bằng phông thật
    let png, lw, lh;
    if (l.anh) { png = fs.readFileSync(l.anh); lw = l.mw; lh = l.mh; } else {
    let svg = fs.readFileSync(path.join(ROOT, 'brand', 'nhan', `${l.slug}.svg`), 'utf8').replace(/^<\?xml[^>]*>\s*/, '');
    svg = engine.trimView(svg);
    const m = /width="([\d.]+)mm" height="([\d.]+)mm"/.exec(svg);
    lw = +m[1]; lh = +m[2]; const px = Math.round(lh * 16); // ≈ 400 dpi
    const lp = await browser.newPage({ viewport: { width: Math.round(px * lw / lh), height: px } });
    await lp.setContent(`<!doctype html><meta charset="utf-8"><style>${css}\nhtml,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`);
    await lp.evaluate(() => document.fonts.ready);
    png = await lp.screenshot({ type: 'png' });
    await lp.close(); }
    // 2) Dựng cảnh và chụp
    const kind = /^chai/.test(l.bao_bi) ? 'chai' : l.bao_bi === 'xo' ? 'xo' : 'tui';
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    page.on('console', (x) => { if (x.type() === 'error') console.error('page:', x.text()); });
    await page.setContent('<!doctype html><html><body style="margin:0"></body></html>');
    await page.addScriptTag({ path: THREE_JS });
    await page.evaluate(async (src) => { window.LABEL = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }); }, 'data:image/png;base64,' + png.toString('base64'));
    const url = await page.evaluate(`(() => { window.CFG = ${JSON.stringify({ W, H, kind, lw, lh, trong: TRONG })}; return (${scene.toString()})(); })()`);
    const file = path.join(OUT, `${l.slug}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    await page.close();
    console.log(`${l.slug} (${kind}) → ${path.relative(ROOT, file)} ${W}×${H}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
