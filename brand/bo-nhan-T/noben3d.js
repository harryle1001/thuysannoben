#!/usr/bin/env node
'use strict';
// Dựng chai Noben 1 lít bằng 3D thật (three.js, vật liệu PBR, đèn studio, bóng đổ), nhãn quấn 161,8 × 100 mm.
//   node noben3d.js --labels a.png[,b.png,...] --out file.png [--shot front|duo|line] [--w 2400 --h 3200]
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const opt = (f, d) => { const i = args.indexOf(f); return i > -1 ? args[i + 1] : d; };
const LABELS = opt('--labels', '').split(',').filter(Boolean);
const OUT = opt('--out', 'chai3d.png');
const SHOT = opt('--shot', 'front');
const W = +opt('--w', 2400), H = +opt('--h', 3200);
const THREE_JS = path.join(__dirname, '..', '..', 'public', 'js', 'vendor', 'three-0.149.0.min.js');

function scene() {
  /* global THREE, TEX, CFG */
  THREE.ColorManagement.legacyMode = false;
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(CFG.W, CFG.H);
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.84;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.physicallyCorrectLights = true;
  document.body.appendChild(r.domElement);
  const s = new THREE.Scene();
  const BG = 0xe7e9ec;
  s.background = new THREE.Color(BG); s.fog = new THREE.Fog(BG, 150, 420);

  // Môi trường phản chiếu: phòng studio xám sáng với 3 softbox lớn (phản chiếu mềm trên nhựa)
  const env = new THREE.Scene(); env.background = new THREE.Color(0x9a9da2);
  const box = (w, h, x, y, z, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 10, 0); env.add(m); };
  box(70, 110, -90, 50, 60, 3.6); box(55, 90, 95, 40, 50, 1.7); box(140, 40, 0, 120, 10, 2.4); box(400, 400, 0, -80, 0, 0.7); box(60, 80, 0, 30, -120, 1.6);
  const pm = new THREE.PMREMGenerator(r); s.environment = pm.fromScene(env, 0.035).texture;

  const tex = (img) => { const t = new THREE.Texture(img); t.encoding = THREE.sRGBEncoding; t.anisotropy = r.capabilities.getMaxAnisotropy(); t.needsUpdate = true; return t; };

  // Sàn + phông liền (cyclorama) và bóng tiếp xúc mềm
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ color: BG, roughness: 0.92, envMapIntensity: 0.25 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  function contact(x, z) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d');
    const g = c.createRadialGradient(256, 256, 20, 256, 256, 250); g.addColorStop(0, 'rgba(30,36,48,.55)'); g.addColorStop(.45, 'rgba(30,36,48,.22)'); g.addColorStop(1, 'rgba(30,36,48,0)');
    c.fillStyle = g; c.fillRect(0, 0, 512, 512);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(17, 13), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z + 0.6); s.add(m);
  }
  s.add(new THREE.HemisphereLight(0xffffff, 0xcfd3d8, 0.38));
  const key = new THREE.DirectionalLight(0xfffaf4, 2.2); key.position.set(-42, 130, 70); key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096); key.shadow.radius = 22; key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -60, right: 60, top: 70, bottom: -20, near: 10, far: 320 }); s.add(key);
  const fill = new THREE.DirectionalLight(0xeef3ff, 0.9); fill.position.set(80, 35, 60); s.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1); rim.position.set(25, 60, -110); s.add(rim);

  // ---- Chai HDPE 1 lít, đúng dáng chai Noben: thân trụ Ø92, vai cong, cổ có gờ, nắp vặn có gân + vòng chống tháo
  const hdpe = new THREE.MeshPhysicalMaterial({ color: 0xf1f1ee, roughness: 0.5, clearcoat: 0.14, clearcoatRoughness: 0.55, sheen: 0.2, sheenRoughness: 0.8, envMapIntensity: 0.9 });
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0xfbfbfa, roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.9 });
  function bottle(img) {
    const g = new THREE.Group();
    const R = 4.3, pts = [[0, 0], [R - 0.9, 0], [R - 0.4, 0.1], [R - 0.1, 0.38], [R, 0.9], [R, 15.4]]; // chai 1 lít BVT2: Ø86 × cao 238 mm
    for (let i = 1; i <= 18; i++) { const t = (i / 18) * Math.PI / 2; pts.push([2.2 + (R - 2.2) * Math.cos(t), 15.4 + 4.3 * Math.sin(t)]); }
    pts.push([2.2, 20.1], [2.52, 20.2], [2.52, 20.5], [2.12, 20.6], [2.12, 22.4]);
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 192), hdpe);
    body.castShadow = true; body.receiveShadow = true; g.add(body);
    // đường ghép khuôn rất mờ ở hai bên (chi tiết nhỏ làm chai thật hơn)
    // vòng chống tháo
    const ring = new THREE.Mesh(new THREE.LatheGeometry([[2.12, 0], [2.5, 0.03], [2.52, 0.34], [2.44, 0.4], [2.12, 0.4]].map(([x, y]) => new THREE.Vector2(x, y)), 128), capMat);
    ring.position.y = 20.68; ring.castShadow = true; g.add(ring);
    // nắp: mép trên bo tròn
    const cp = [[0, 2.62], [2.05, 2.62], [2.26, 2.56], [2.38, 2.42], [2.42, 2.22], [2.42, 0.06], [2.36, 0], [2.12, 0]];
    const cap = new THREE.Mesh(new THREE.LatheGeometry(cp.map(([x, y]) => new THREE.Vector2(x, y)), 128), capMat);
    cap.position.y = 21.16; cap.castShadow = true; g.add(cap);
    const ribG = new THREE.BoxGeometry(0.085, 2.0, 0.09);
    for (let i = 0; i < 80; i++) { const a = (i / 80) * Math.PI * 2; const rb = new THREE.Mesh(ribG, capMat); rb.position.set(Math.sin(a) * 2.44, 21.16 + 1.12, Math.cos(a) * 2.44); rb.rotation.y = a; rb.castShadow = false; g.add(rb); }
    // nhãn giấy: dày 0,1 mm, bóng mờ nhẹ
    const len = 16.18 / (R + 0.012);
    const lg = new THREE.CylinderGeometry(R + 0.012, R + 0.012, 10, 220, 1, true, -len / 2, len);
    const lbl = new THREE.Mesh(lg, new THREE.MeshPhysicalMaterial({ map: tex(img), roughness: 0.6, clearcoat: 0.1, clearcoatRoughness: 0.5, envMapIntensity: 0.62 }));
    lbl.position.y = 8.3; lbl.receiveShadow = true; g.add(lbl);
    return g;
  }

  const cam = new THREE.PerspectiveCamera(CFG.shot === 'line' ? 24 : 21, CFG.W / CFG.H, 1, 2000);
  const n = TEX.length;
  if (CFG.shot === 'duo') {
    const a = bottle(TEX[0]); a.position.set(-3.6, 0, 3); a.rotation.y = 0.1; s.add(a); contact(-3.6, 3);
    const b = bottle(TEX[1] || TEX[0]); b.position.set(6.6, 0, -6.5); b.rotation.y = -1.18; s.add(b); contact(6.6, -6.5);
    cam.position.set(-6, 16.5, 82); cam.lookAt(1.2, 11.4, 0);
  } else if (CFG.shot === 'line') {
    const gap = 11.6;
    TEX.forEach((t, i) => { const b = bottle(t); const x = (i - (n - 1) / 2) * gap; b.position.set(x, 0, 0); b.rotation.y = -x * 0.008; s.add(b); contact(x, 0); });
    cam.position.set(0, 15.5, 42 + n * 11.5); cam.lookAt(0, 11.6, 0);
  } else {
    const a = bottle(TEX[0]); a.rotation.y = 0.0; s.add(a); contact(0, 0);
    cam.position.set(0, 15.5, 84); cam.lookAt(0, 11.4, 0);
  }
  r.render(s, cam);
  return r.domElement.toDataURL('image/png');
}

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  page.on('console', (m) => { if (m.type() === 'error') console.error('page:', m.text()); });
  await page.setContent('<!doctype html><html><body style="margin:0"></body></html>');
  await page.addScriptTag({ path: THREE_JS });
  const data = LABELS.map((f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
  await page.evaluate(async (T) => {
    window.TEX = await Promise.all(T.map((src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; })));
  }, data);
  const url = await page.evaluate(`(() => { window.CFG = ${JSON.stringify({ W, H, shot: SHOT })}; return (${scene.toString()})(); })()`);
  fs.writeFileSync(OUT, Buffer.from(url.split(',')[1], 'base64'));
  console.log('saved', OUT, W + '×' + H);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
