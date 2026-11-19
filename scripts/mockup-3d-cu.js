#!/usr/bin/env node
'use strict';
// Đặt nhãn (PNG 4K từ scripts/mockup-nhan-moi.js, hoặc nhãn cũ từ scripts/mockup-nhan-cu.py) lên bao bì dựng 3D thật:
// chai HDPE 1 lít, hũ nhựa 500 g, túi đứng nhôm bạc có zip 250 g, bao gối 5 kg.
//   node scripts/mockup-3d-cu.js --dir <thư mục nhãn> --out anh.png --shot chai|hu|tui|bao|bo [--goc 0|34] [--w 3072 --h 3840]
// Cần: npm i three@0.149.0 --no-save (Chromium + Playwright có sẵn).
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const opt = (f, d) => { const i = args.indexOf(f); return i > -1 ? args[i + 1] : d; };
const DIR = opt('--dir', 'brand/mockup-4k/nhan');
const OUT = opt('--out', 'mockup.png');
const SHOT = opt('--shot', 'chai');
const GOC = +opt('--goc', 0);
const W = +opt('--w', 3072), H = +opt('--h', 3840);
const SLUG = { chai: 'super-yucca', hu: 'bio-aq', tui: 'clear-12h', bao: 'mix-79' };
const THREE_JS = process.env.THREE_JS || [path.join(process.cwd(), 'node_modules', 'three', 'build', 'three.min.js'), path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.min.js')].find((f) => fs.existsSync(f)) || '';
if (!THREE_JS) { console.error('Thiếu three.min.js: chạy `npm i three@0.149.0 --no-save` hoặc đặt THREE_JS.'); process.exit(2); }

function scene() {
  /* global THREE, TEX, CFG */
  const PHI = 1.61803;
  THREE.ColorManagement.legacyMode = false;
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(CFG.W, CFG.H);
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.86;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.physicallyCorrectLights = true;
  document.body.appendChild(r.domElement);
  const s = new THREE.Scene();
  const BG = 0xe7e9ec;
  s.background = new THREE.Color(BG); s.fog = new THREE.Fog(BG, 420, 1100); const setFog = (d) => { s.fog.near = d * 1.35; s.fog.far = d * 3.2; };

  // Môi trường phản chiếu: phòng studio xám sáng với các softbox lớn
  const env = new THREE.Scene(); env.background = new THREE.Color(0x9a9da2);
  const box = (w, h, x, y, z, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 10, 0); env.add(m); };
  box(70, 110, -90, 50, 60, 3.6); box(55, 90, 95, 40, 50, 1.7); box(140, 40, 0, 120, 10, 2.4); box(400, 400, 0, -80, 0, 0.7); box(60, 80, 0, 30, -120, 1.6); box(46, 120, -18, 40, 150, 2.6); box(30, 120, 70, 30, 120, 0.25); box(30, 120, -85, 30, 110, 0.3);
  const pm = new THREE.PMREMGenerator(r); s.environment = pm.fromScene(env, 0.035).texture;

  const tex = (img) => { const t = new THREE.Texture(img); t.encoding = THREE.sRGBEncoding; t.anisotropy = r.capabilities.getMaxAnisotropy(); t.needsUpdate = true; return t; };
  // Dải màu nối hai mép nhãn (phần sau lưng không có trong ảnh gốc): kéo cột mép phải → cột mép trái
  function edgeTex(img) {
    const cv = document.createElement('canvas'); cv.width = 2; cv.height = 1024; const c = cv.getContext('2d');
    c.drawImage(img, img.width - 3, 0, 2, img.height, 0, 0, 1, 1024); c.drawImage(img, 1, 0, 2, img.height, 1, 0, 1, 1024);
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t;
  }

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: BG, roughness: 0.92, envMapIntensity: 0.25 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  function contact(g, w, d) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d');
    const gr = c.createRadialGradient(256, 256, 20, 256, 256, 250); gr.addColorStop(0, 'rgba(30,36,48,.5)'); gr.addColorStop(.45, 'rgba(30,36,48,.2)'); gr.addColorStop(1, 'rgba(30,36,48,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 512, 512);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0.03, 0.4); g.add(m);
  }
  const lathe = (pts, seg, mat) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const arc = (a0, a1, cx, cy, rr, n, out) => { for (let i = 1; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; out.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]); } };

  // Nhãn quấn trụ: cung trước 144° mang ảnh nhãn, cung sau 216° chỉ là màu nền nối hai mép
  // Nhãn decal dán mặt trước thân trụ: rộng wd, cao ht (cm), tâm ở độ cao yc
  function front(g, img, R, yc, wd, ht) {
    const len = wd / R;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, ht, 220, 1, true, -len / 2, len),
      new THREE.MeshPhysicalMaterial({ map: tex(img), roughness: 0.5, clearcoat: 0.22, clearcoatRoughness: 0.42, envMapIntensity: 0.62 }));
    m.position.y = yc; m.receiveShadow = true; g.add(m);
  }

  const hdpe = new THREE.MeshPhysicalMaterial({ color: 0xf2f2ef, roughness: 0.46, clearcoat: 0.16, clearcoatRoughness: 0.5, sheen: 0.2, sheenRoughness: 0.8, envMapIntensity: 0.9 });
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0xfafaf8, roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.9 });

  // ---- Chai HDPE 1 lít: Ø92 × cao 247 mm, thân trụ cao 150 mm (vừa nhãn 90 × 145,6 mm), vai cong, cổ có gờ, nắp vặn có khía
  function chai(img) {
    const g = new THREE.Group(); const R = 4.6;
    const p = [[0, 0.12], [3.0, 0.12], [3.55, 0]]; arc(-Math.PI / 2, 0, R - 0.95, 0.95, 0.95, 12, p);
    p.push([R, 15.75]); arc(0, Math.PI / 2, R - 2.4, 15.75, 2.4, 20, p);
    p.push([2.2, 18.3], [2.2, 18.55], [2.52, 18.65], [2.52, 18.95], [2.12, 19.05], [2.12, 20.85]);
    g.add(lathe(p, 200, hdpe));
    const ring = lathe([[2.12, 0], [2.5, 0.03], [2.52, 0.34], [2.44, 0.4], [2.12, 0.4]], 128, capMat); ring.position.y = 19.12; g.add(ring);
    const cp = [[0, 2.62], [2.05, 2.62], [2.26, 2.56], [2.38, 2.42], [2.42, 2.22], [2.42, 0.06], [2.36, 0], [2.12, 0]];
    const cap = lathe(cp, 128, capMat); cap.position.y = 19.6; g.add(cap);
    const rib = new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8);
    for (let i = 0; i < 80; i++) { const a = (i / 80) * Math.PI * 2; const m = new THREE.Mesh(rib, capMat); m.position.set(Math.sin(a) * 2.425, 19.6 + 1.12, Math.cos(a) * 2.425); g.add(m); }
    front(g, img, R + 0.012, 8.4, 9.0, 14.562);
    contact(g, 15, 11); g.userData = { h: 22.2, w: 9.2 };
    return g;
  }

  // ---- Hũ nhựa 500 g: Ø100 × cao 150 mm, nắp vặn rộng bằng thân, có khía mịn (đo theo ảnh hũ Bio AQ cũ)
  function hu(img) {
    const g = new THREE.Group(); const R = 4.96;
    const p = [[0, 0.15], [3.6, 0.15], [4.1, 0]]; arc(-Math.PI / 2, 0, R - 0.75, 0.75, 0.75, 12, p);
    p.push([R, 12.5], [R - 0.06, 12.62], [R - 0.2, 12.66], [R - 0.2, 12.9]);
    g.add(lathe(p, 192, hdpe));
    const lp = [[0, 2.3], [4.3, 2.3], [4.72, 2.24], [4.95, 2.08], [5.03, 1.85], [5.03, 0.06], [4.97, 0], [4.7, 0]];
    const lid = lathe(lp, 192, capMat); lid.position.y = 12.72; g.add(lid);
    const rib = new THREE.CylinderGeometry(0.05, 0.05, 1.55, 8);
    for (let i = 0; i < 150; i++) { const a = (i / 150) * Math.PI * 2; const m = new THREE.Mesh(rib, capMat); m.position.set(Math.sin(a) * 5.035, 12.72 + 0.95, Math.cos(a) * 5.035); g.add(m); }
    front(g, img, R + 0.012, 6.95, 9.4 * 0.618, 9.4);                        // nhãn khổ túi thu nhỏ 61,8 × 100 mm cho vừa thân hũ
    contact(g, 18, 13); g.userData = { h: 15, w: 10 };
    return g;
  }

  // ---- nhiễu mượt để tạo nếp nhăn màng
  const hash = (x, y) => { const t = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return t - Math.floor(t); };
  const sm = (t) => t * t * (3 - 2 * t);
  const cl = (t) => Math.min(1, Math.max(0, t));
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf - 0.5; }
  const fbm = (x, y) => vnoise(x, y) + 0.5 * vnoise(x * 2.1 + 7, y * 2.1 + 3) + 0.25 * vnoise(x * 4.3 + 1, y * 4.3 + 9);
  // lưới tham số (u ngang -1..1, v dọc 0..1) → mặt màng
  function sheet(fn, u0, u1, v0, v1, nx, ny, back) {
    const pos = new Float32Array((nx + 1) * (ny + 1) * 3), uv = new Float32Array((nx + 1) * (ny + 1) * 2), idx = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const k = j * (nx + 1) + i, q = fn(u0 + (u1 - u0) * i / nx, v0 + (v1 - v0) * j / ny, j === 0 && v0 === 0 ? -1 : j === ny && v1 === 1 ? 1 : 0);
      pos[k * 3] = q[0]; pos[k * 3 + 1] = q[1]; pos[k * 3 + 2] = q[2]; uv[k * 2] = i / nx; uv[k * 2 + 1] = j / ny;
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; if (back) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
    const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals();
    return ge;
  }
  const film = (ge, mat) => { const m = new THREE.Mesh(ge, mat); m.castShadow = true; m.receiveShadow = true; return m; };

  // ---- Túi đứng nhôm bạc có zip 250 g: 160 × 248 mm, hàn biên 7 mm, đáy xếp (đo theo ảnh túi Clear 12H cũ)
  function tui(img) {
    const g = new THREE.Group(); const Wd = 16, Ht = 24.8, uS = 1 - 0.7 / 8, zipV = 1 - 2.9 / Ht;
    const depth = (u, v) => {
      const au = Math.abs(u), sU = au < uS ? Math.pow(1 - Math.pow(au / uS, 2.0), 0.7) : 0;
      const t = cl((v - 0.10) / 0.74), gV = v < 0.10 ? 0.9 + 0.1 * (v / 0.10) : Math.pow(1 - Math.pow(t, 1.5), 0.9);
      let d = 2.5 * gV * sU;
      d += (0.3 * fbm(u * 2.2 + 3, v * 3.4) + 0.07 * fbm(u * 7 + 1, v * 11)) * Math.pow(sU, 0.35) * (0.35 + 0.65 * (1 - gV)) * (v < 0.84 ? 1 : 0.15);
      d += 0.07 * Math.exp(-Math.pow((v - zipV) / 0.0045, 2)) + 0.045 * Math.exp(-Math.pow((v - zipV + 0.016) / 0.003, 2));
      return [d, gV, sU];
    };
    const f = (sg, eps) => (u, v) => { const [d, gV] = depth(u, v); return [u * Wd / 2 * (1 - 0.025 * gV), v * Ht, sg * (d + 0.02 + eps)]; };
    const foil = new THREE.MeshPhysicalMaterial({ color: 0xdfe2e6, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.15, side: THREE.DoubleSide });
    g.add(film(sheet(f(1, 0), -1, 1, 0, 1, 220, 340, false), foil));
    g.add(film(sheet(f(-1, 0), -1, 1, 0, 1, 220, 340, true), foil));
    // đáy xếp
    g.add(film(sheet((u, v) => { const [d] = depth(u, 0); return [u * Wd / 2 * (1 - 0.0225), 0.02 + 0.5 * (1 - Math.pow(2 * v - 1, 2)) * Math.min(1, d), (2 * v - 1) * (d + 0.02)]; }, -1, 1, 0.0001, 0.9999, 120, 24, true), foil));
    // nhãn decal 110 × 178 mm, mép trên cách miệng túi 43 mm
    const lm = new THREE.MeshPhysicalMaterial({ map: tex(img), roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const l = film(sheet(f(1, 0.012), -0.706, 0.706, 0.109, 0.827, 200, 280, false), lm); l.castShadow = false; g.add(l);
    contact(g, 24, 11); g.userData = { h: Ht, w: Wd };
    return g;
  }

  // ---- Bao gối 5 kg: 280 × 510 mm, hai đầu hàn răng cưa 16 mm (đo theo ảnh bao Mix 79 cũ)
  function bao(img) {
    const g = new THREE.Group(); const Wd = 28, Ht = 51, sV = 1.6 / Ht;
    const depth = (u, v) => {
      const a = sm(cl((v - sV) / 0.22)), b = sm(cl((1 - sV - v) / 0.22)), gV = Math.pow(a * b, 0.55);
      const sU = Math.pow(1 - Math.pow(Math.abs(u), 2.6), 0.5);
      const tr = 4 * a * b < 1 ? 1 - a * b : 0;                         // vùng chuyển gần mối hàn → nếp gấp
      let d = 4.4 * gV * sU;
      d += (0.22 * Math.sin(u * 21 + 5 * fbm(u * 2, v * 3)) * tr * Math.sqrt(gV) + 0.2 * fbm(u * 2.2 + 11, v * 3.6) * gV) * Math.pow(sU, 0.4);
      const inSeal = v < sV || v > 1 - sV; if (inSeal) d += 0.018 * Math.sin(v * Ht * 2 * Math.PI / 0.22);
      return [d, gV];
    };
    const f = (sg, eps) => (u, v, edge) => {
      const [d, gV] = depth(u, v); const x = u * Wd / 2 * (1 - 0.11 * gV);
      const zig = edge ? edge * 0.13 * (2 * Math.abs(((x / 0.34) % 1 + 1) % 1 - 0.5)) : 0;   // mép răng cưa
      return [x, v * Ht + zig, sg * (d + 0.02 + eps)];
    };
    const yel = new THREE.MeshPhysicalMaterial({ color: 0xdfe2e6, metalness: 0.9, roughness: 0.32, envMapIntensity: 1.1, side: THREE.DoubleSide });
    g.add(film(sheet(f(1, 0), -1, 1, 0, 1, 330, 700, false), yel));
    g.add(film(sheet(f(-1, 0), -1, 1, 0, 1, 330, 700, true), yel));
    // nhãn decal khổ túi phóng φ lần: 178 × 288 mm, giữa thân bao
    const pmat = new THREE.MeshPhysicalMaterial({ map: tex(img), roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const l = film(sheet(f(1, 0.012), -0.715, 0.715, 0.218, 0.782, 300, 520, false), pmat); l.castShadow = false; g.add(l);
    const wrapG = new THREE.Group(); g.rotation.x = -0.075; g.position.y = 0.05; wrapG.add(g);
    contact(wrapG, 40, 16); wrapG.userData = { h: Ht, w: Wd };
    return wrapG;
  }

  const make = { chai, hu, tui, bao };
  // đèn: key trên-trái, fill phải, rim sau
  s.add(new THREE.HemisphereLight(0xffffff, 0xcfd3d8, 0.38));
  const key = new THREE.DirectionalLight(0xfffaf4, 2.2); key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.radius = 22; key.shadow.bias = -0.0005; s.add(key); s.add(key.target);
  const fill = new THREE.DirectionalLight(0xeef3ff, 0.9); s.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1); s.add(rim);
  function lights(sz) {
    const k = sz / 20;
    key.position.set(-42 * k, 130 * k, 70 * k); fill.position.set(80 * k, 35 * k, 60 * k); rim.position.set(25 * k, 60 * k, -110 * k);
    Object.assign(key.shadow.camera, { left: -3 * sz, right: 3 * sz, top: 3.4 * sz, bottom: -1.5 * sz, near: 1, far: 16 * sz * k / k }); key.shadow.camera.far = 400 * k; key.shadow.camera.updateProjectionMatrix();
  }

  let cam;
  if (CFG.shot === 'bo') {
    // cả bộ, đúng tỉ lệ thật; tâm nhóm đặt theo đường 61,8 / 38,2
    const items = [['bao', -21.5, -7, 0.10], ['tui', 0.5, 1.5, -0.06], ['chai', 14.2, 4.5, -0.2], ['hu', 25.5, 0.5, -0.32]];
    items.forEach(([k, x, z, ry]) => { const o = make[k](TEX[k]); o.position.x = x; o.position.z = z; o.rotation.y = ry; s.add(o); });
    lights(34);
    cam = new THREE.PerspectiveCamera(22, CFG.W / CFG.H, 1, 4000);
    cam.position.set(4, 34, 205); cam.lookAt(-1.5, 20.5, 0); setFog(205);
  } else {
    const o = make[CFG.shot](TEX[CFG.shot]); const { h, w } = o.userData;
    o.rotation.y = -CFG.goc * Math.PI / 180; s.add(o);
    lights(Math.max(h, w * 1.3));
    const fov = 21; cam = new THREE.PerspectiveCamera(fov, CFG.W / CFG.H, 1, 4000);
    const frameH = Math.max(h * PHI, w * 1.5 * PHI * CFG.H / CFG.W);          // bao bì chiếm 61,8% chiều cao khung
    const dist = frameH / (2 * Math.tan(fov * Math.PI / 360));
    const up = CFG.goc ? 0.2 : 0.06;                                         // góc 3/4 nhìn hơi từ trên xuống
    setFog(dist); cam.position.set(0, h * 0.5 + dist * up, dist); cam.lookAt(0, h * 0.47, 0);
  }
  r.render(s, cam);
  return r.domElement.toDataURL('image/png');
}

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  page.on('console', (m) => { if (m.type() === 'error') console.error('page:', m.text()); });
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.setContent('<!doctype html><html><body style="margin:0"></body></html>');
  await page.addScriptTag({ path: THREE_JS });
  const need = SHOT === 'bo' ? Object.keys(SLUG) : [SHOT];
  const data = {};
  for (const k of need) data[k] = 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, SLUG[k] + '-nhan-4k.png')).toString('base64');
  await page.evaluate(async (T) => {
    window.TEX = {};
    for (const k of Object.keys(T)) window.TEX[k] = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = T[k]; });
  }, data);
  const url = await page.evaluate(`(() => { window.CFG = ${JSON.stringify({ W, H, shot: SHOT, goc: GOC })}; return (${scene.toString()})(); })()`);
  fs.writeFileSync(OUT, Buffer.from(url.split(',')[1], 'base64'));
  console.log('saved', OUT, W + '×' + H);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
