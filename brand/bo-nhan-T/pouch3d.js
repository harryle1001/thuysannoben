#!/usr/bin/env node
'use strict';
// Túi bột 3D (three.js, PBR): túi gối có bột bên trong — phồng nhiều ở đáy, xẹp dần lên miệng, mép hàn phẳng,
// nếp nhăn nhẹ ở phần trên, màng ghép bóng. Kích thước túi (cm) truyền theo từng túi.
//   node pouch3d.js --items "art.png:12.36:22.49,art2.png:15:27.3" --out file.png --w 3840 --h 2160 [--shot line|single]
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const opt = (f, d) => { const i = args.indexOf(f); return i > -1 ? args[i + 1] : d; };
const ITEMS = opt('--items', '').split(',').filter(Boolean).map((s) => { const [f, w, h] = s.split(':'); return { f, w: +w, h: +h }; });
const OUT = opt('--out', 'tui3d.png'), SHOT = opt('--shot', 'line');
const W = +opt('--w', 3840), H = +opt('--h', 2160);
const THREE_JS = path.join(__dirname, '..', '..', 'public', 'js', 'vendor', 'three-0.149.0.min.js');

function scene() {
  /* global THREE, TEX, CFG */
  THREE.ColorManagement.legacyMode = false;
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(CFG.W, CFG.H);
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.95;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.physicallyCorrectLights = true;
  document.body.appendChild(r.domElement);
  const s = new THREE.Scene();
  const BG = 0xe7e9ec; s.background = new THREE.Color(BG); s.fog = new THREE.Fog(BG, 200, 520);
  const env = new THREE.Scene(); env.background = new THREE.Color(0x9a9da2);
  const box = (w, h, x, y, z, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 10, 0); env.add(m); };
  box(160, 160, -110, 60, 90, 1.6); box(160, 160, 120, 50, 80, 1.2); box(220, 60, 0, 140, 20, 1.4); box(500, 500, 0, -90, 0, 0.75); box(200, 140, 0, 40, -160, 1.0);
  const pm = new THREE.PMREMGenerator(r); s.environment = pm.fromScene(env, 0.035).texture;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: BG, roughness: 0.92, envMapIntensity: 0.25 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  s.add(new THREE.HemisphereLight(0xffffff, 0xd6d9de, 0.55));
  const key = new THREE.DirectionalLight(0xfffaf4, 1.6); key.position.set(-140, 110, 120); key.castShadow = false;
  key.shadow.mapSize.set(4096, 4096); key.shadow.radius = 40; key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -90, right: 90, top: 90, bottom: -20, near: 10, far: 400 }); s.add(key);
  const fill = new THREE.DirectionalLight(0xeef3ff, 0.55); fill.position.set(130, 40, 90); s.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.7); rim.position.set(30, 70, -120); s.add(rim);

  // độ phồng của túi tại (u, v) ∈ [0,1]²: 0 ở mép hàn, lớn ở đáy (bột lắng), thoải lên miệng túi
  const sealS = 0.035, sealB = 0.03, sealT = 0.085;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function bulge(u, v) {
    const sx = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (u - sealS) / (1 - 2 * sealS)))), 0.3);
    const vv = Math.min(1, Math.max(0, (v - sealB) / (1 - sealB - sealT)));
    const fillV = Math.pow(Math.sin(Math.PI * Math.min(1, vv * 0.96 + 0.02)), 0.3) * (1.04 - 0.12 * vv);
    const top = 1 - smooth(0.8, 1.0, vv) * 0.25; // phần trên ít bột, xẹp xuống
    return Math.max(0, sx * fillV * top);
  }
  // nếp nhăn: chỉ ở phần trên (không có bột), nhỏ, ngẫu nhiên nhưng cố định
  const corner = (u, v, cu, cv) => { const du = (u - cu) * 1.8, dv = (v - cv); const d = Math.hypot(du, dv); const along = (du * Math.sign(cu - 0.5) + dv * Math.sign(cv - 0.5)); return Math.exp(-d * 7) * Math.sin(d * 46 + along * 8); };
  const wr = (u, v) => 0.9 * (corner(u, v, 0, 1) + corner(u, v, 1, 1)) + 0.55 * (corner(u, v, 0, 0) + corner(u, v, 1, 0)) + smooth(0.6, 0.92, v) * 0.25 * Math.sin(u * 19 + v * 7) * Math.sin(v * 27 - u * 5);

  function pouch(img, w, h) {
    const g = new THREE.Group();
    const D = w * 0.11; // độ dày nửa túi lúc đầy (cm)
    const nx = 120, ny = 200;
    const make = (sign, mat) => {
      const geo = new THREE.PlaneGeometry(w, h, nx, ny);
      const p = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const u = uv.getX(i), v = uv.getY(i);
        const b = bulge(u, v);
        const x = (u - 0.5) * w; // hai cạnh thẳng, không thắt eo
        const y = v * h;
        const z = sign * (D * b + 0.0025 * w * wr(u, v) + 0.012);
        p.setXYZ(i, x, y, z);
      }
      if (sign < 0) { const idx = geo.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 2]; idx[i + 2] = t; } }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m;
    };
    const t = new THREE.Texture(img); t.encoding = THREE.sRGBEncoding; t.anisotropy = 16; t.needsUpdate = true;
    const bcv = document.createElement('canvas'); bcv.width = 1024; bcv.height = 2048; const bc = bcv.getContext('2d');
    bc.fillStyle = '#808080'; bc.fillRect(0, 0, 1024, 2048);
    const seal = (x, y, w2, h2, vertical) => { for (let k = 0; k < (vertical ? w2 : h2); k += 6) { bc.fillStyle = k % 12 < 6 ? '#b0b0b0' : '#505050'; vertical ? bc.fillRect(x + k, y, 6, h2) : bc.fillRect(x, y + k, w2, 6); } };
    const topH = 2048 * 0.08, botH = 2048 * 0.03, sideW = 1024 * 0.035;
    seal(0, 0, 1024, topH, true); seal(0, 2048 - botH, 1024, botH, true); seal(0, 0, sideW, 2048, false); seal(1024 - sideW, 0, sideW, 2048, false);
    const bump = new THREE.CanvasTexture(bcv);
    const film = { roughness: 0.58, clearcoat: 0.18, clearcoatRoughness: 0.55, sheen: 0.25, sheenRoughness: 0.6, envMapIntensity: 0.75, bumpMap: bump, bumpScale: 0.05 };
    g.add(make(1, new THREE.MeshPhysicalMaterial({ map: t, ...film })));
    g.add(make(-1, new THREE.MeshPhysicalMaterial({ color: 0xf3f4f6, ...film })));
    // tựa nghiêng ra sau như túi đứng trên kệ
    g.rotation.x = 0;
    return { g, D };
  }

  const n = TEX.length;
  const cam = new THREE.PerspectiveCamera(CFG.shot === 'line' ? 26 : 20, CFG.W / CFG.H, 1, 3000);
  const shadowCv = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d'); const gr = c.createRadialGradient(128, 128, 10, 128, 128, 125); gr.addColorStop(0, 'rgba(30,36,48,.62)'); gr.addColorStop(1, 'rgba(30,36,48,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(cv); };
  const sh = shadowCv();
  let x = 0; const placed = [];
  const gap = 4;
  const total = CFG.items.reduce((a, it) => a + it.w, 0) + gap * (n - 1);
  CFG.items.forEach((it, i) => {
    const { g, D } = pouch(TEX[i], it.w, it.h);
    const cx = -total / 2 + x + it.w / 2; x += it.w + gap;
    g.position.set(cx, 0.4, 0); g.rotation.y = CFG.shot === 'angle' ? -0.42 : 0;
    s.add(g); placed.push(it);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(it.w * 1.25, D * 3.2), new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false }));
    c.rotation.x = -Math.PI / 2; c.position.set(cx, 0.03, 0); s.add(c);
  });
  const maxH = Math.max(...CFG.items.map((it) => it.h));
  if (CFG.shot === 'single' || CFG.shot === 'angle') { cam.position.set(0, maxH * 0.5, maxH * 3.3); cam.lookAt(0, maxH * 0.5, 0); }
  else { const dist = Math.max(total * 1.5 * (16 / 9) / (CFG.W / CFG.H), maxH * 2.8); cam.position.set(0, maxH * 0.5, dist); cam.lookAt(0, maxH * 0.5, 0); }
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
  const data = ITEMS.map((it) => 'data:image/png;base64,' + fs.readFileSync(it.f).toString('base64'));
  await page.evaluate(async (T) => { window.TEX = await Promise.all(T.map((src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }))); }, data);
  const url = await page.evaluate(`(() => { window.CFG = ${JSON.stringify({ W, H, shot: SHOT, items: ITEMS.map(({ w, h }) => ({ w, h })) })}; return (${scene.toString()})(); })()`);
  fs.writeFileSync(OUT, Buffer.from(url.split(',')[1], 'base64'));
  console.log('saved', OUT, W + '×' + H);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
