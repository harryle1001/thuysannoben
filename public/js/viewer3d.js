/* Xem bao bì 3D thật (WebGL, three.js tải khi cần): vuốt/kéo để xoay 360°, có quán tính, tự xoay nhẹ khi để yên.
   Khung: <div class="stage3d" data-model3d data-kind="chai|tui|xo" data-tex="/images/products-3d/x.jpg" data-mm="240x135">
   Không có WebGL hoặc lỗi tải: giữ nguyên ảnh sản phẩm bên trong khung. */
(function () {
  'use strict';
  var PHI = 1.61803;
  var stages = [].slice.call(document.querySelectorAll('[data-model3d]'));
  if (!stages.length) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGL = (function () { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (!hasGL) return;

  var threeReady = null;
  function loadThree() {
    if (window.THREE && window.Pack3D) return Promise.resolve();
    if (threeReady) return threeReady;
    threeReady = new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = '/js/vendor/three-0.149.0.min.js'; s.async = true; s.onerror = no;
      s.onload = function () { var p = document.createElement('script'); p.src = '/js/pack3d.js?v=1'; p.onload = ok; p.onerror = no; document.head.appendChild(p); };
      document.head.appendChild(s);
    });
    return threeReady;
  }

  function build(stage) {
    var T = window.THREE;
    var kind = stage.dataset.kind || 'chai';
    var mm = (stage.dataset.mm || '240x135').split('x').map(Number);
    var LW = mm[0] / 10, LH = mm[1] / 10;
    var r = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.physicallyCorrectLights = true;
    var s = new T.Scene();
    // phòng studio đơn giản cho phản chiếu mềm trên nhựa
    var env = new T.Scene(); env.background = new T.Color(0x8d9095);
    [[70, 110, -90, 50, 60, 3.4], [55, 90, 95, 40, 50, 1.8], [140, 40, 0, 120, 10, 2.4], [400, 400, 0, -80, 0, 0.7]].forEach(function (b) {
      var m = new T.Mesh(new T.PlaneGeometry(b[0], b[1]), new T.MeshBasicMaterial({ color: new T.Color(b[5], b[5], b[5]), side: T.DoubleSide }));
      m.position.set(b[2], b[3], b[4]); m.lookAt(0, 10, 0); env.add(m);
    });
    var pm = new T.PMREMGenerator(r); s.environment = pm.fromScene(env, 0.04).texture;
    s.add(new T.HemisphereLight(0xffffff, 0xcfd3d8, 0.5));
    var key = new T.DirectionalLight(0xfffaf4, 2.2); key.position.set(-40, 60, 50); s.add(key);
    var rim = new T.DirectionalLight(0xffffff, 1.0); rim.position.set(30, 40, -60); s.add(rim);

    var tex = new T.TextureLoader().load(stage.dataset.tex, function () { draw(); stage.classList.add('is-3d-ready'); });
    tex.encoding = T.sRGBEncoding; tex.anisotropy = r.capabilities.getMaxAnisotropy();
    var labelMat = new T.MeshPhysicalMaterial({ map: tex, roughness: 0.55, clearcoat: 0.12, clearcoatRoughness: 0.45, envMapIntensity: 0.6 });
    var built = window.Pack3D.build(T, kind, { lw: LW, lh: LH }, labelMat, { mau: stage.dataset.mau ? new T.Color(stage.dataset.mau) : null });
    var g = built.group, H = built.H, Wd = built.W;
    g.position.y = -H * 0.5;
    var pivot = new T.Group(); pivot.add(g); s.add(pivot);

    var cam = new T.PerspectiveCamera(22, 1, 1, 2000);
    function fit() {
      var w = stage.clientWidth, h = stage.clientHeight;
      r.setSize(w, h, false); cam.aspect = w / h;
      var vis = Math.max(H / 0.84, (Wd / 0.8) / cam.aspect);
      var d = vis / 2 / Math.tan(cam.fov * Math.PI / 360);
      cam.position.set(0, d * 0.08, d); cam.lookAt(0, -H * 0.03, 0); cam.updateProjectionMatrix();
      draw();
    }
    r.domElement.className = 'stage3d__gl';
    stage.appendChild(r.domElement);

    // ---- tương tác: kéo ngang xoay 360°, kéo dọc nghiêng nhẹ, quán tính, tự xoay khi để yên
    var ry = -0.35, rx = 0.06, vy = 0, drag = null, idle = 0, raf = null, visible = true;
    function draw() { pivot.rotation.set(rx, ry, 0); r.render(s, cam); }
    function loop(ts) {
      raf = null;
      if (!visible) return;
      if (!drag) {
        ry += vy; vy *= 0.94;
        rx += (0.06 - rx) * 0.08;
        if (Math.abs(vy) < 0.0008) { vy = 0; if (!reduce && performance.now() - idle > 1618) ry += 0.0045; }
      }
      draw();
      if (drag || vy || !reduce) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    stage.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, ry: ry, rx: rx, id: e.pointerId, cap: false, lx: e.clientX, lt: performance.now() };
      stage.classList.add('is-touched'); vy = 0; kick();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.cap && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { drag = null; return; } // để cuộn trang
      if (!drag.cap && Math.abs(dx) > 3) { drag.cap = true; try { stage.setPointerCapture(e.pointerId); } catch (err) {} stage.classList.add('is-dragging'); }
      if (!drag.cap) return;
      e.preventDefault();
      var k2 = 6.2 / Math.max(stage.clientWidth, 1);
      ry = drag.ry + dx * k2;
      rx = Math.max(-0.25, Math.min(0.35, drag.rx + dy * k2 * 0.4));
      var now = performance.now();
      vy = (e.clientX - drag.lx) * k2 * Math.min(16 / Math.max(now - drag.lt, 1), 1.5);
      drag.lx = e.clientX; drag.lt = now;
    });
    function end(e) { if (!drag || (e && e.pointerId !== drag.id)) return; drag = null; idle = performance.now(); stage.classList.remove('is-dragging'); kick(); }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); vy += e.key === 'ArrowLeft' ? -0.05 : 0.05; idle = performance.now(); kick(); }
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(stage);
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage); else window.addEventListener('resize', fit);
    fit(); idle = performance.now(); kick();
    stage.classList.add('is-3d');
  }

  function start(stage) { loadThree().then(function () { try { build(stage); } catch (e) { /* giữ ảnh tĩnh */ } }).catch(function () {}); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); start(x.target); } }); }, { rootMargin: '200px' });
    stages.forEach(function (s) { io.observe(s); });
  } else stages.forEach(start);
  void PHI;
})();
