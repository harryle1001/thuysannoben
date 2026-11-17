/* Bản đồ giải pháp: đồ thị lực (force-directed) Vấn đề ao ↔ Sản phẩm ↔ Nhóm, vẽ bằng canvas, không thư viện ngoài.
   Mọi thông số theo tỷ lệ vàng φ: bán kính 5/8/13 (Fibonacci), độ dài lò xo 68/110, tắt dần theo 1/φ. */
(function () {
  'use strict';
  var root = document.querySelector('[data-kmap]');
  var src = document.getElementById('kmap-data');
  if (!root || !src) return;
  var PHI = 1.61803, IPHI = 0.61803;
  var data = JSON.parse(src.textContent);
  var canvas = root.querySelector('[data-kmap-canvas]');
  var ctx = canvas.getContext('2d');
  var info = root.querySelector('[data-kmap-info]');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var C = { sym: '#ffc20e', prod: '#6f9bff', cat: { 'sinh-hoc': '#4cc28a', 'khoang-chat': '#4bb8d9', 'thuc-an-bo-sung': '#f0a64a', 'tri-benh': '#ff8189' } };

  // ---- Nodes & links ----
  var nodes = [], byId = {}, links = [];
  function add(n) { n.x = 0; n.y = 0; n.vx = 0; n.vy = 0; n.adj = []; nodes.push(n); byId[n.k + ':' + n.id] = n; return n; }
  data.s.forEach(function (s, i) {
    var n = add({ k: 's', id: s.id, name: s.n, short: s.n.split(',')[0], url: s.u, r: 13 });
    var a = (i / data.s.length) * Math.PI * 2; n.x = Math.cos(a) * 160; n.y = Math.sin(a) * 100;
  });
  data.c.forEach(function (c, i) {
    var n = add({ k: 'c', id: c.id, name: c.n, short: c.n.split(/[,&]/)[0].trim(), url: c.u, r: 8 });
    var a = (i / data.c.length) * Math.PI * 2 + 0.4; n.x = Math.cos(a) * 260; n.y = Math.sin(a) * 160;
  });
  var maxW = Math.max.apply(null, data.p.map(function (p) { return p.w || 0; }).concat(1));
  data.p.forEach(function (p) {
    var n = add({ k: 'p', id: p.id, name: p.n, short: p.n, tag: p.t, url: p.u, cat: p.c, w: p.w || 0, r: 3 + 2 * Math.sqrt((p.w || 0) / maxW) + 1 });
    n.x = (Math.random() - 0.5) * 400; n.y = (Math.random() - 0.5) * 260;
    (p.s || []).forEach(function (s) { link(n, byId['s:' + s], 68); });
    link(n, byId['c:' + p.c], 110);
  });
  function link(a, b, len) { if (!a || !b) return; links.push({ a: a, b: b, len: len }); a.adj.push(b); b.adj.push(a); }

  // ---- Simulation ----
  var GX = 0.0038, GY = 0.0062;
  var alpha = 1, FLOOR = calm ? 0 : 0.024;
  function tick() {
    var i, j, a, b, dx, dy, d2, d, f;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j]; dx = b.x - a.x; dy = b.y - a.y; d2 = dx * dx + dy * dy + 0.01;
        if (d2 > 90000 && (a.k === 'p' || b.k === 'p')) continue;
        f = (a.r + b.r) * 42 / d2 * alpha * (a.k !== 'p' && b.k !== 'p' ? 6.854 : 1); d = Math.sqrt(d2); // hub đẩy nhau mạnh gấp φ⁴
        dx *= f / d; dy *= f / d; a.vx -= dx; a.vy -= dy; b.vx += dx; b.vy += dy;
      }
    }
    for (i = 0; i < links.length; i++) {
      a = links[i].a; b = links[i].b; dx = b.x - a.x; dy = b.y - a.y; d = Math.sqrt(dx * dx + dy * dy) || 1;
      f = (d - links[i].len) / d * 0.0618 * alpha; dx *= f; dy *= f;
      var wa = a.k === 'p' ? IPHI : 1 - IPHI;
      a.vx += dx * wa; a.vy += dy * wa; b.vx -= dx * (1 - wa); b.vy -= dy * (1 - wa);
    }
    var t = performance.now() / 1000;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      a.vx -= a.x * GX * alpha; a.vy -= a.y * GY * alpha; // kéo về giữa, ép theo hướng khung (ngang/dọc) tỷ lệ φ
      if (!calm) { a.vx += Math.sin(t * IPHI + i) * 0.006; a.vy += Math.cos(t * IPHI + i * PHI) * 0.006; } // trôi nhẹ
      if (a === drag) { a.vx = a.vy = 0; continue; }
      a.vx *= IPHI; a.vy *= IPHI; a.x += a.vx; a.y += a.vy;
    }
    alpha = Math.max(FLOOR, alpha * 0.99);
  }

  // ---- View ----
  var W = 0, H = 0, dpr = 1, scale = 1, cx = 0, cy = 0;
  function resize() {
    var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; var tall = H > W; GX = tall ? 0.0062 : 0.0038; GY = tall ? 0.0038 : 0.0062; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); dirty = true;
  }
  function fit() {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    nodes.forEach(function (n) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); });
    var pad = 42, px = W < 600 ? 68 : 42, s = Math.min((W - px * 2) / (x1 - x0 || 1), (H - pad * 2) / (y1 - y0 || 1), 1.618);
    scale += (s - scale) * 0.1; cx += ((x0 + x1) / 2 - cx) * 0.1; cy += ((y0 + y1) / 2 - cy) * 0.1;
  }
  function toScreen(n) { return [(n.x - cx) * scale + W / 2, (n.y - cy) * scale + H / 2]; }
  function toWorld(px, py) { return [(px - W / 2) / scale + cx, (py - H / 2) / scale + cy]; }

  // ---- Pulses: chấm sáng chạy dọc các đường nối ----
  var pulses = [];
  for (var q = 0; q < 34; q++) pulses.push({ l: links[(Math.random() * links.length) | 0], t: Math.random(), v: 0.004 + Math.random() * 0.006 });

  var sel = null, hover = null, drag = null, dirty = true;
  function isLit(n) { return !sel || n === sel || sel.adj.indexOf(n) >= 0; }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var i, l, p, a, b;
    // links
    ctx.lineWidth = 1;
    for (i = 0; i < links.length; i++) {
      l = links[i]; a = toScreen(l.a); b = toScreen(l.b);
      var on = sel && (l.a === sel || l.b === sel);
      ctx.strokeStyle = on ? 'rgba(255,194,14,.618)' : sel ? 'rgba(160,190,255,.04)' : 'rgba(160,200,255,.13)';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // pulses
    if (!calm) {
      for (i = 0; i < pulses.length; i++) {
        p = pulses[i]; p.t += p.v;
        if (p.t > 1) { p.t = 0; p.l = sel && Math.random() < 0.618 ? pickLink(sel) : links[(Math.random() * links.length) | 0]; }
        a = toScreen(p.l.a); b = toScreen(p.l.b);
        var lit = !sel || p.l.a === sel || p.l.b === sel;
        ctx.fillStyle = lit ? 'rgba(255,230,150,.9)' : 'rgba(255,230,150,.12)';
        ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * p.t, a[1] + (b[1] - a[1]) * p.t, 1.6, 0, 6.2832); ctx.fill();
      }
    }
    // nodes
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i], s = toScreen(n), r = n.r * Math.max(0.618, Math.min(scale, 1.272));
      var col = n.k === 's' ? C.sym : n.k === 'c' ? C.cat[n.id] || '#b48cff' : C.prod;
      ctx.globalAlpha = isLit(n) ? 1 : 0.146;
      if (n.k !== 'p' || n === sel || n === hover) { ctx.shadowColor = col; ctx.shadowBlur = n === sel ? 26 : 16; }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(s[0], s[1], n === sel ? r * 1.272 : r, 0, 6.2832); ctx.fill();
      ctx.shadowBlur = 0;
      if (n === sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(s[0], s[1], r * 1.618 + 3, 0, 6.2832); ctx.stroke(); }
    }
    // labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var show = n.k !== 'p' ? isLit(n) : n === hover || (sel && isLit(n));
      if (!show) continue;
      s = toScreen(n);
      ctx.globalAlpha = 1;
      ctx.font = (n.k === 's' ? '600 12px ' : n.k === 'c' ? '600 11px ' : '400 10px ') + "'Be Vietnam Pro', system-ui, sans-serif";
      ctx.fillStyle = n.k === 's' ? '#ffe9a6' : n.k === 'c' ? '#e8eef9' : '#c9d7f2';
      ctx.fillText(n.short.length > 26 ? n.short.slice(0, 25) + '…' : n.short, s[0], s[1] + n.r * scale + 6);
    }
    ctx.globalAlpha = 1;
  }
  function pickLink(n) { var ls = links.filter(function (l) { return l.a === n || l.b === n; }); return ls[(Math.random() * ls.length) | 0] || links[0]; }

  // ---- Loop: chỉ chạy khi bản đồ đang hiện trên màn hình ----
  var visible = true, raf = 0;
  function frame() {
    raf = 0;
    if (!visible || document.hidden) return;
    if (alpha > 0 || drag) { tick(); fit(); dirty = true; }
    if (dirty || !calm) { draw(); dirty = false; }
    if (!calm || alpha > 0 || drag) raf = requestAnimationFrame(frame);
  }
  function wake(a) { alpha = Math.max(alpha, a || 0); if (!raf) raf = requestAnimationFrame(frame); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) wake(); }).observe(canvas);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); wake(0.1); }).observe(canvas);
  else window.addEventListener('resize', function () { resize(); wake(0.1); });
  resize();
  if (calm) { for (var k = 0; k < 300; k++) tick(); for (k = 0; k < 60; k++) fit(); alpha = 0; }
  wake();

  // ---- Pointer: chạm chọn, kéo node ----
  function hit(e) {
    var r = canvas.getBoundingClientRect(), w = toWorld(e.clientX - r.left, e.clientY - r.top), best = null, bd = Infinity;
    nodes.forEach(function (n) { var dx = n.x - w[0], dy = n.y - w[1], d = dx * dx + dy * dy, rr = (n.r + 10 / scale); if (d < rr * rr && d < bd) { bd = d; best = n; } });
    return { n: best, w: w };
  }
  var down = null;
  canvas.addEventListener('pointerdown', function (e) {
    var h = hit(e); down = { x: e.clientX, y: e.clientY, n: h.n, moved: false };
    if (h.n) { drag = h.n; canvas.setPointerCapture(e.pointerId); wake(0.3); }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (down && drag) {
      if (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6) down.moved = true;
      var w = hit(e).w; drag.x = w[0]; drag.y = w[1]; wake(0.3); return;
    }
    if (e.pointerType === 'mouse') { var n = hit(e).n; if (n !== hover) { hover = n; canvas.style.cursor = n ? 'pointer' : ''; dirty = true; wake(); } }
  });
  function up() { if (down && !down.moved) select(down.n); drag = null; down = null; }
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', function () { drag = null; down = null; });

  // ---- Panel ----
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function item(n) { return '<li><a href="' + esc(n.url) + '">' + esc(n.name) + '</a></li>'; }
  function select(n) {
    sel = n; dirty = true; wake(0.08);
    root.querySelectorAll('[data-kmap-pick]').forEach(function (b) { b.setAttribute('aria-pressed', String(!!n && n.k === 's' && b.dataset.kmapPick === n.id)); });
    if (!n) { info.hidden = true; info.innerHTML = ''; return; }
    var prods = n.adj.filter(function (x) { return x.k === 'p'; }).sort(function (a, b) { return b.w - a.w; });
    var html = '<p class="kmap__type">' + (n.k === 's' ? 'Vấn đề ao' : n.k === 'c' ? 'Nhóm sản phẩm' : 'Sản phẩm') + '</p><h2 class="kmap__name">' + esc(n.name) + '</h2>';
    if (n.k === 'p') {
      if (n.tag) html += '<p class="kmap__tag">' + esc(n.tag) + '</p>';
      var syms = n.adj.filter(function (x) { return x.k === 's'; });
      if (syms.length) html += '<p class="kmap__sub">Dùng cho</p><ul class="kmap__list">' + syms.map(item).join('') + '</ul>';
      html += '<a class="btn btn--sun btn--block" href="' + esc(n.url) + '">Xem sản phẩm</a>';
    } else {
      html += '<p class="kmap__sub">' + prods.length + ' sản phẩm phù hợp</p><ul class="kmap__list">' + prods.slice(0, 13).map(item).join('') + '</ul>';
      html += '<a class="btn btn--sun btn--block" href="' + esc(n.url) + '">' + (n.k === 's' ? 'Xem cách xử lý' : 'Xem cả nhóm') + '</a>';
    }
    info.innerHTML = html; info.hidden = false;
  }
  root.querySelectorAll('[data-kmap-pick]').forEach(function (b) {
    b.addEventListener('click', function () { var n = byId['s:' + b.dataset.kmapPick]; select(sel === n ? null : n); });
  });
})();
