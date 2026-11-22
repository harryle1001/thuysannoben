/* Xoay 360° bao bì Noben (mẫu nhãn T). Dữ liệu và ảnh nhãn: /xoay-360-3d/ (xuất bằng brand/bo-nhan-T/xuat-360.py). */
(function () {
  'use strict';
  var T = window.THREE, PHI = 1.61803;
  var stage = document.getElementById('stage'); if (!stage || !window.THREE) return; var root = document.querySelector('.s360');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var r = new T.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 0.95; r.physicallyCorrectLights = true;
  stage.prepend(r.domElement);
  var scene = new T.Scene();
  // phòng chụp: softbox lớn để phản chiếu mềm trên nhựa và màng túi
  var env = new T.Scene(); env.background = new T.Color(0x9a9da2);
  [[160, 160, -110, 60, 90, 1.7], [160, 160, 120, 50, 80, 1.2], [220, 60, 0, 140, 20, 1.5], [500, 500, 0, -90, 0, 0.75], [200, 140, 0, 40, -160, 1.1]].forEach(function (b) {
    var m = new T.Mesh(new T.PlaneGeometry(b[0], b[1]), new T.MeshBasicMaterial({ color: new T.Color(b[5], b[5], b[5]), side: T.DoubleSide }));
    m.position.set(b[2], b[3], b[4]); m.lookAt(0, 10, 0); env.add(m);
  });
  scene.environment = new T.PMREMGenerator(r).fromScene(env, 0.035).texture;
  scene.add(new T.HemisphereLight(0xffffff, 0xd6d9de, 0.55));
  var key = new T.DirectionalLight(0xfffaf4, 1.5); key.position.set(-140, 110, 120); scene.add(key);
  var fill = new T.DirectionalLight(0xeef3ff, 0.55); fill.position.set(130, 40, 90); scene.add(fill);
  var rim = new T.DirectionalLight(0xffffff, 0.8); rim.position.set(30, 70, -120); scene.add(rim);
  // bóng tiếp xúc mềm dưới đáy
  var sc = document.createElement('canvas'); sc.width = sc.height = 256; var sx = sc.getContext('2d');
  var gr = sx.createRadialGradient(128, 128, 8, 128, 128, 125); gr.addColorStop(0, 'rgba(25,32,48,.55)'); gr.addColorStop(1, 'rgba(25,32,48,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 256, 256);
  var shadow = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; scene.add(shadow);
  var cam = new T.PerspectiveCamera(24, 1, 1, 2000);
  var holder = new T.Group(); scene.add(holder);
  var loader = new T.TextureLoader();
  var tex = function (u) { return new Promise(function (ok, no) { loader.load(u, function (t) { t.encoding = T.sRGBEncoding; t.anisotropy = r.capabilities.getMaxAnisotropy(); ok(t); }, undefined, no); }); };

  // ---- chai HDPE: 1 lít (Ø92 mm) hoặc 500 ml (Ø72 mm); nhãn quấn đúng khổ in
  function bottle(t, k) {
    // chai 1 lít BVT2: Ø86 × 238 mm; chai 500 ml 3 sọc: Ø79 × 165 mm (kich-thuoc.json)
    var g = new T.Group(), s5 = k === 'chai500', sr = s5 ? 3.95 / 4.3 : 1, s = s5 ? 16.5 / 23.78 : 1, R0 = 4.3, R = R0 * sr;
    var hdpe = new T.MeshPhysicalMaterial({ color: 0xf1f1ee, roughness: 0.5, clearcoat: 0.14, clearcoatRoughness: 0.55, sheen: 0.2, sheenRoughness: 0.8, envMapIntensity: 0.9 });
    var capM = new T.MeshPhysicalMaterial({ color: 0xfbfbfa, roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.9 });
    var pts = [[0, 0], [R0 - 0.9, 0], [R0 - 0.4, 0.1], [R0 - 0.1, 0.38], [R0, 0.9], [R0, 15.4]];
    for (var i = 1; i <= 18; i++) { var a = i / 18 * Math.PI / 2; pts.push([2.2 + (R0 - 2.2) * Math.cos(a), 15.4 + 4.3 * Math.sin(a)]); }
    pts.push([2.2, 20.1], [2.52, 20.2], [2.52, 20.5], [2.12, 20.6], [2.12, 22.4]);
    var V = function (p) { return p.map(function (q) { return new T.Vector2(q[0] * sr, q[1] * s); }); };
    g.add(new T.Mesh(new T.LatheGeometry(V(pts), 160), hdpe));
    var ring = new T.Mesh(new T.LatheGeometry(V([[2.12, 0], [2.5, 0.03], [2.52, 0.34], [2.44, 0.4], [2.12, 0.4]]), 100), capM); ring.position.y = 20.68 * s; g.add(ring);
    var cap = new T.Mesh(new T.LatheGeometry(V([[0, 2.62], [2.05, 2.62], [2.26, 2.56], [2.38, 2.42], [2.42, 2.22], [2.42, 0.06], [2.36, 0], [2.12, 0]]), 100), capM); cap.position.y = 21.16 * s; g.add(cap);
    var rib = new T.BoxGeometry(0.085 * sr, 2.0 * s, 0.09 * sr);
    for (var j = 0; j < 72; j++) { var b2 = j / 72 * Math.PI * 2, m = new T.Mesh(rib, capM); m.position.set(Math.sin(b2) * 2.44 * sr, (21.16 + 1.12) * s, Math.cos(b2) * 2.44 * sr); m.rotation.y = b2; g.add(m); }
    var lw = (k === 'chai500' ? 15.94 : 16.18), lh = (k === 'chai500' ? 8 : 10), len = lw / (R + 0.012);
    var lab = new T.Mesh(new T.CylinderGeometry(R + 0.012, R + 0.012, lh, 200, 1, true, -len / 2, len), new T.MeshPhysicalMaterial({ map: t, roughness: 0.6, clearcoat: 0.1, clearcoatRoughness: 0.5, envMapIntensity: 0.62 }));
    lab.position.y = 8.3 * s; g.add(lab);
    return { g: g, h: 23.78 * s, w: 2 * R, d: 2 * R };
  }

  // ---- túi gối chứa bột: phồng ở đáy, xẹp dần lên miệng, mép hàn phẳng có vân, eo túi thắt vào
  var smooth = function (a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function bulge(u, v) {
    var sxv = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.035) / 0.93))), 0.3);
    var vv = Math.min(1, Math.max(0, (v - 0.03) / 0.885));
    var fv = Math.pow(Math.sin(Math.PI * Math.min(1, vv * 0.96 + 0.02)), 0.3) * (1.04 - 0.12 * vv);
    return Math.max(0, sxv * fv * (1 - smooth(0.8, 1, vv) * 0.25));
  }
  function corner(u, v, cu, cv) { var du = (u - cu) * 1.8, dv = v - cv, d = Math.hypot(du, dv), al = du * Math.sign(cu - 0.5) + dv * Math.sign(cv - 0.5); return Math.exp(-d * 7) * Math.sin(d * 46 + al * 8); }
  function wr(u, v) { return 0.9 * (corner(u, v, 0, 1) + corner(u, v, 1, 1)) + 0.55 * (corner(u, v, 0, 0) + corner(u, v, 1, 0)) + smooth(0.6, 0.92, v) * 0.25 * Math.sin(u * 19 + v * 7) * Math.sin(v * 27 - u * 5); }
  var bump = (function () {
    var c = document.createElement('canvas'); c.width = 512; c.height = 1024; var x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 1024);
    var seal = function (X, Y, W, H, vert) { for (var k = 0; k < (vert ? W : H); k += 4) { x.fillStyle = k % 8 < 4 ? '#b0b0b0' : '#505050'; if (vert) x.fillRect(X + k, Y, 4, H); else x.fillRect(X, Y + k, W, 4); } };
    seal(0, 0, 512, 82, true); seal(0, 993, 512, 31, true); seal(0, 0, 18, 1024, false); seal(494, 0, 18, 1024, false);
    return new T.CanvasTexture(c);
  })();
  function pouch(tf, tb, w, h) {
    var g = new T.Group(), D = w * 0.11;
    var film = { roughness: 0.58, clearcoat: 0.18, clearcoatRoughness: 0.55, sheen: 0.25, sheenRoughness: 0.6, envMapIntensity: 0.75, bumpMap: bump, bumpScale: 0.05 };
    function side(sign, t) {
      var geo = new T.PlaneGeometry(w, h, 90, 150), p = geo.attributes.position, uv = geo.attributes.uv;
      for (var i = 0; i < p.count; i++) {
        var u = uv.getX(i), v = uv.getY(i), b = bulge(u, v);
        var uu = sign > 0 ? u : 1 - u; // mặt sau: lật u để ảnh không bị ngược
        p.setXYZ(i, (uu - 0.5) * w, v * h, sign * (D * b + 0.0025 * w * wr(u, v) + 0.012));
      }
      // mặt sau: lật u đã đảo chiều mặt tam giác, nên không đảo chỉ số nữa
      geo.computeVertexNormals();
      g.add(new T.Mesh(geo, new T.MeshPhysicalMaterial(Object.assign({ map: t }, film))));
    }
    side(1, tf); side(-1, tb);
    return { g: g, h: h, w: w, d: D * 2 };
  }

  // ---- điều khiển: kéo xoay quanh trục đứng (360°), nghiêng nhẹ, quán tính, tự xoay khi để yên, phóng to
  var yaw = 0, pitch = 0.05, vy = 0, zoom = 1, spin = !reduce, drag = null, idle = 0, target = null;
  var spinBtn = document.getElementById('b-spin');
  function setSpin(on) { spin = on; spinBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  setSpin(spin);
  spinBtn.onclick = function () { setSpin(!spin); };
  document.getElementById('b-front').onclick = function () { setSpin(false); target = 0; };
  document.getElementById('b-back').onclick = function () { setSpin(false); target = Math.PI; };
  var pts = new Map();
  stage.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY }; vy = 0; target = null; idle = 0; });
  stage.addEventListener('pointermove', function (e) {
    if (!pts.has(e.pointerId)) return;
    var prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { var a = [...pts.values()], d1 = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); if (drag.pd) zoom = Math.min(2.2, Math.max(0.7, zoom * d1 / drag.pd)); drag.pd = d1; return; }
    var dx = e.clientX - prev[0], dy = e.clientY - prev[1];
    yaw += dx * 0.0085; vy = dx * 0.0085; pitch = Math.max(-0.25, Math.min(0.35, pitch + dy * 0.004)); idle = 0;
  });
  var up = function (e) { pts.delete(e.pointerId); if (!pts.size) drag = null; };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.min(2.2, Math.max(0.7, zoom * Math.exp(-e.deltaY * 0.001))); }, { passive: false });

  var cur = null, dims = { h: 20, w: 9, d: 9 };
  function frame() {
    var W = stage.clientWidth, H = stage.clientHeight; r.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
    var need = Math.max(dims.h * 1.25, (dims.w * 1.4) / cam.aspect), dist = need / (2 * Math.tan(cam.fov * Math.PI / 360)) / zoom;
    cam.position.set(Math.sin(0) * dist, dims.h * 0.5 + Math.sin(pitch) * dist, Math.cos(pitch) * dist);
    cam.lookAt(0, dims.h * 0.5, 0);
  }
  var last = performance.now();
  function loop(now) {
    now = now || performance.now(); var dt = Math.min(0.1, (now - last) / 1000); last = now; // theo thời gian thật, máy chậm vẫn quay đúng tốc độ
    if (!drag) {
      if (target != null) { var d = ((target - yaw) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; yaw += d * Math.min(1, dt * 7); if (Math.abs(d) < 0.002) { yaw = target; target = null; } vy = 0; }
      else { yaw += vy; vy *= Math.pow(0.94, dt * 60); idle += dt; if (spin && idle > 0.7 && Math.abs(vy) < 0.002) yaw += dt * 0.36; }
    }
    holder.rotation.y = yaw; frame(); r.render(scene, cam); requestAnimationFrame(loop);
  }

  // ---- danh sách sản phẩm và thông tin (từ san-pham.json, xuất từ hồ sơ TCCS)
  var $ = function (id) { return document.getElementById(id); };
  function show(p) {
    root.style.setProperty('--c', p.mau);
    $('type').textContent = p.loai; $('name').textContent = p.ten; $('hc').textContent = p.hoat_chat;
    $('qc').textContent = p.quy_cach; var lk = $('link'); if (p.web) { lk.href = '/san-pham/' + p.web; lk.hidden = false; } else lk.hidden = true; $('cach').textContent = p.cach; $('ms').textContent = p.ma_so; $('tc').textContent = p.tccs;
    $('uses').innerHTML = ''; p.cong_dung.forEach(function (c) { var li = document.createElement('li'); li.textContent = c; $('uses').appendChild(li); });
    [].forEach.call(document.querySelectorAll('.list button'), function (b) { b.setAttribute('aria-current', b.dataset.s === p.slug ? 'true' : 'false'); });
    $('load').hidden = false;
    var job = p.kieu === 'tui' ? Promise.all([tex('/xoay-360-3d/tex/' + p.slug + '-truoc.jpg'), tex('/xoay-360/tex/' + p.slug + '-sau.jpg')]) : tex('/xoay-360/tex/' + p.slug + '.jpg').then(function (t) { return [t]; });
    job.then(function (ts) {
      if (cur) { holder.remove(cur.g); cur.g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
      cur = p.kieu === 'tui' ? pouch(ts[0], ts[1], p.w, p.h) : bottle(ts[0], p.kieu);
      holder.add(cur.g); dims = cur; shadow.scale.set(cur.w * 1.35, cur.d * 1.9 + 2, 1);
      yaw = 0; target = null; $('load').hidden = true;
      try { history.replaceState(null, '', '#' + p.slug); } catch (e) {}
    }).catch(function () { $('load').textContent = 'Không tải được ảnh nhãn của ' + p.ten + '.'; });
  }
  fetch('/xoay-360-3d/san-pham.json?v=' + (root.dataset.v || '1')).then(function (x) { return x.json(); }).then(function (list) {
    list.forEach(function (p) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.s = p.slug;
      var sw = document.createElement('i'); sw.style.background = p.mau; b.appendChild(sw); b.appendChild(document.createTextNode(p.ten));
      b.onclick = function () { show(p); }; $('list').appendChild(b);
    });
    var first = list.find(function (p) { return p.slug === location.hash.slice(1); }) || list[0];
    show(first); loop();
  }).catch(function () { $('load').textContent = 'Không tải được danh sách sản phẩm.'; });
  addEventListener('hashchange', function () { var b = document.querySelector('.list button[data-s="' + location.hash.slice(1) + '"]'); if (b && b.getAttribute('aria-current') !== 'true') b.click(); });
})();
