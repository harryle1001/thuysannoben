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
    if (window.THREE) return Promise.resolve();
    if (threeReady) return threeReady;
    threeReady = new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = '/js/vendor/three-0.149.0.min.js'; s.async = true; s.onload = ok; s.onerror = no;
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

    var white = new T.MeshPhysicalMaterial({ color: 0xf3f3f0, roughness: 0.5, clearcoat: 0.14, clearcoatRoughness: 0.55, envMapIntensity: 0.9 });
    var capMat = new T.MeshPhysicalMaterial({ color: 0xfbfbfa, roughness: 0.4, clearcoat: 0.25, envMapIntensity: 0.9 });
    var tex = new T.TextureLoader().load(stage.dataset.tex, function () { draw(); stage.classList.add('is-3d-ready'); });
    tex.encoding = T.sRGBEncoding; tex.anisotropy = r.capabilities.getMaxAnisotropy();
    var labelMat = new T.MeshPhysicalMaterial({ map: tex, roughness: 0.55, clearcoat: 0.12, clearcoatRoughness: 0.45, envMapIntensity: 0.6 });
    var V2 = function (p) { return p.map(function (q) { return new T.Vector2(q[0], q[1]); }); };
    var g = new T.Group(), H = 20, Wd = 10;

    if (kind === 'chai') {
      var k = (LH + 1) / 14.5, R = 4.6 * k;
      var pts = [[0, 0], [3.7, 0], [4.2, 0.1], [4.5, 0.38], [4.6, 0.9], [4.6, 15.4]];
      for (var i = 1; i <= 18; i++) { var t = (i / 18) * Math.PI / 2; pts.push([2.2 + 2.4 * Math.cos(t), 15.4 + 4.3 * Math.sin(t)]); }
      pts.push([2.2, 20.1], [2.52, 20.2], [2.52, 20.5], [2.12, 20.6], [2.12, 22.4]);
      g.add(new T.Mesh(new T.LatheGeometry(V2(pts.map(function (p) { return [p[0] * k, p[1] * k]; })), 128), white));
      var cap = new T.Mesh(new T.LatheGeometry(V2([[0, 2.62], [2.05, 2.62], [2.26, 2.56], [2.38, 2.42], [2.42, 2.22], [2.42, 0.06], [2.36, 0], [2.12, 0]].map(function (p) { return [p[0] * k, p[1] * k]; })), 96), capMat);
      cap.position.y = 21.16 * k; g.add(cap);
      var len = Math.min(LW / (R + 0.012), Math.PI * 2 - 0.05);
      var l = new T.Mesh(new T.CylinderGeometry(R + 0.012, R + 0.012, LH, 160, 1, true, -len / 2, len), labelMat);
      l.position.y = 0.9 * k + (14.5 * k - LH) / 2 + LH / 2; g.add(l);
      H = 23.8 * k; Wd = 2 * R;
    } else if (kind === 'xo') {
      var Hb = LH + 4.2, rb = Math.max(LW / 4.4, LH * 0.42), rt = rb + 1.7;
      var rAt = function (y) { return rb + (rt - rb) * (y / Hb); };
      var p = [[0, 0], [rb - 0.5, 0], [rb - 0.1, 0.15], [rb, 0.6]];
      for (var j = 1; j <= 20; j++) { var y = 0.6 + (Hb - 2.2) * j / 20; p.push([rAt(y), y]); }
      p.push([rAt(Hb - 1.5) + 0.35, Hb - 1.5], [rAt(Hb - 1.1), Hb - 1.1], [rt + 0.5, Hb - 0.4], [rt + 0.55, Hb], [0, Hb]);
      g.add(new T.Mesh(new T.LatheGeometry(V2(p), 128), white));
      g.add(new T.Mesh(new T.LatheGeometry(V2([[0, Hb + 0.9], [rt - 1.5, Hb + 0.85], [rt + 0.35, Hb + 0.75], [rt + 0.75, Hb + 0.55], [rt + 0.8, Hb - 0.6], [rt + 0.6, Hb - 0.7]]), 128), capMat));
      var y0 = 1.8, y1 = y0 + LH, rm = rAt((y0 + y1) / 2) + 0.02, ln = Math.min(LW / rm, Math.PI * 2 - 0.05);
      var lx = new T.Mesh(new T.CylinderGeometry(rAt(y1) + 0.02, rAt(y0) + 0.02, LH, 160, 1, true, -ln / 2, ln), labelMat);
      lx.position.y = (y0 + y1) / 2; g.add(lx);
      var metal = new T.MeshStandardMaterial({ color: 0x9aa1aa, metalness: 0.9, roughness: 0.32 });
      var ey = Hb - 2.6, er = rAt(ey) + 0.35, hp = [];
      for (var q = 0; q <= 48; q++) { var a = Math.PI * q / 48; hp.push(new T.Vector3(-Math.cos(a) * (er + 0.3), ey + Math.sin(a) * rt * 0.62, -Math.sin(a) * rt * 0.55)); }
      g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(hp), 120, 0.13, 8, false), metal));
      H = Hb + rt * 0.62 + 1.5; Wd = 2 * (rt + 1.2);
    } else {
      // túi: mặt trước phồng (nhãn là ảnh mặt trước), mặt sau trắng
      var Wb = LW, Hbg = LH * 1.08, D = Wb * 0.16;
      var bul = function (u, v) { var vv = Math.min(v / 0.9, 1); return Math.pow(Math.sin(Math.PI * u), 0.75) * Math.pow(Math.sin(Math.PI * vv), 0.5) * (v > 0.9 ? 0 : 1); };
      var surf = function (sg) {
        var geo = new T.BufferGeometry(), P = [], UV = [], I = [], nu = 80, nv = 110;
        for (var jj = 0; jj <= nv; jj++) for (var ii = 0; ii <= nu; ii++) {
          var u = ii / nu, v = jj / nv, b = bul(u, v);
          P.push((u - 0.5) * Wb * (1 - 0.07 * b), v * Hbg, sg * D * b);
          UV.push(sg > 0 ? u : 1 - u, Math.min(v / 0.92, 1));
        }
        for (jj = 0; jj < nv; jj++) for (ii = 0; ii < nu; ii++) {
          var A = jj * (nu + 1) + ii, B = A + 1, C = A + nu + 1, E = C + 1;
          if (sg > 0) I.push(A, B, E, A, E, C); else I.push(A, E, B, A, C, E);
        }
        geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(UV, 2));
        geo.setIndex(I); geo.computeVertexNormals(); return geo;
      };
      g.add(new T.Mesh(surf(1), labelMat));
      g.add(new T.Mesh(surf(-1), new T.MeshPhysicalMaterial({ color: 0xf4f4f2, roughness: 0.6, sheen: 0.4, side: T.DoubleSide })));
      H = Hbg; Wd = Wb;
    }
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
