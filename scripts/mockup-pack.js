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
const TRONG = args.includes('--trong');
const MAU = opt('--mau', '');
const TAM = opt('--tam', ''); // phần (0–1) theo bề ngang nhãn đặt ra mặt trước khi quấn // nền trong suốt (ảnh tách nền cho web)
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
  // Khuôn bao bì dùng chung với web (public/js/pack3d.js): kích thước cố định, nhãn thu cho vừa
  const built = Pack3D.build(THREE, CFG.kind, { lw: LW, lh: LH }, labelMat, { mau: CFG.mau ? new THREE.Color(CFG.mau) : null, tam: CFG.tam });
  const g = built.group; CFG.height = built.H; CFG.width = built.W;
  s.add(g);
  g.rotation.y = /^(tui|bao)/.test(CFG.kind) ? -0.52 : -0.2;

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
    const KIEU = ['chai1l', 'chai500', 'chainau', 'hu', 'hucao', 'hutron', 'xo', 'tuibac', 'tuivang', 'baodet', 'baogiay'];
    const kind = KIEU.includes(l.bao_bi) ? l.bao_bi : /^chai/.test(l.bao_bi) ? 'chai1l' : l.bao_bi === 'xo' ? 'xo' : 'tuibac';
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    page.on('console', (x) => { if (x.type() === 'error') console.error('page:', x.text()); });
    await page.setContent('<!doctype html><html><body style="margin:0"></body></html>');
    await page.addScriptTag({ path: THREE_JS });
    await page.addScriptTag({ path: path.join(ROOT, 'public', 'js', 'pack3d.js') });
    await page.evaluate(async (src) => { window.LABEL = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }); }, 'data:image/png;base64,' + png.toString('base64'));
    const url = await page.evaluate(`(() => { window.CFG = ${JSON.stringify({ W, H, kind, lw, lh, trong: TRONG, mau: MAU, tam: TAM === '' ? null : +TAM })}; return (${scene.toString()})(); })()`);
    const file = path.join(OUT, `${l.slug}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    await page.close();
    console.log(`${l.slug} (${kind}) → ${path.relative(ROOT, file)} ${W}×${H}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
