/* Ambient motion background: a faint layer behind every page — slow water lines, rising
   micro-bubbles and the golden spiral from the logo, which turns as the visitor scrolls.
   Drawn on one fixed canvas at ≤ 30 fps, capped pixel ratio, paused when the tab is hidden.
   Static single frame for reduced motion; skipped on data-saver / slow connections. */
(function () {
  'use strict';
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var conn = navigator.connection || {};
  if (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')) return;
  var still = mq('(prefers-reduced-motion: reduce)');
  var phone = mq('(max-width: 760px)');

  var PHI = 1.618034, PI = Math.PI;
  var cv = document.createElement('canvas');
  cv.className = 'ambient-bg';
  cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();

  // Colours follow the light/dark theme.
  var ink = '11,35,71', gold = '201,154,46';
  function theme() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && mq('(prefers-color-scheme: dark)'));
    ink = dark ? '200,220,255' : '11,35,71';
    gold = dark ? '255,194,14' : '201,154,46';
  }
  theme();
  new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Bubbles: few, slow, deterministic spread.
  var N = phone ? 13 : 21, bubbles = [];
  for (var i = 0; i < N; i++) {
    bubbles.push({ x: (i * 0.618034) % 1, y: (i * 0.381966 * 7) % 1, r: 1.2 + (i % 5) * 0.7, s: 0.006 + (i % 8) * 0.0018, w: (i % 3) * 0.6 });
  }

  function spiral(cx, cy, scale, rot, alpha) {
    // golden spiral r = a·φ^(2θ/π): grows by φ every quarter turn
    ctx.beginPath();
    for (var t = -4 * PI; t <= 1.5 * PI; t += 0.04) {
      var r = scale * Math.pow(PHI, 2 * t / PI);
      var x = cx + r * Math.cos(t + rot), y = cy + r * Math.sin(t + rot);
      if (t === -4 * PI) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(' + gold + ',' + alpha + ')';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function draw(time) {
    var t = time / 1000;
    var max = Math.max(1, document.documentElement.scrollHeight - H);
    var p = Math.min(1, window.scrollY / max);           // page progress 0..1
    var sy = window.scrollY;
    ctx.clearRect(0, 0, W, H);

    // 1) water lines: three layers, each drifting at its own speed; scroll lifts them (parallax)
    for (var layer = 0; layer < 3; layer++) {
      var depth = 1 / Math.pow(PHI, layer);               // 1, 0.618, 0.382
      var baseY = H * (0.382 + layer * 0.191) - (sy * 0.08 * depth) % (H * 0.5);
      for (var k = 0; k < 2; k++) {
        var y0 = baseY + k * H * 0.5;
        ctx.beginPath();
        for (var x = 0; x <= W + 8; x += 8) {
          var y = y0 + Math.sin(x / (180 * depth + 90) + t * 0.35 * depth + layer) * (14 * depth + 6) +
            Math.sin(x / 61 + t * 0.6 + k) * 3 * depth;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(' + ink + ',' + (0.085 * depth + 0.03) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 2) the golden spiral of the logo, turning one full revolution over the whole page
    var sc = Math.min(W, H) / (phone ? 9 : 13);
    spiral(W * (phone ? 0.78 : 0.82), H * 0.5, sc, p * 2 * PI + t * 0.02, phone ? 0.12 : 0.15);

    // 3) rising micro-bubbles
    for (var b = 0; b < bubbles.length; b++) {
      var o = bubbles[b];
      var by = ((o.y - t * o.s - p * 0.3) % 1 + 1) % 1;
      var bx = o.x + Math.sin(t * 0.5 + b) * 0.008 * (1 + o.w);
      ctx.beginPath();
      ctx.arc(bx * W, by * H, o.r, 0, 2 * PI);
      ctx.strokeStyle = 'rgba(' + ink + ',0.2)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  var last = 0, raf = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < 1000 / (phone ? 20 : 30)) return; // 20–30 fps is plenty for slow ambience
    last = now;
    draw(now);
  }
  function start() { if (!raf && !still) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  window.addEventListener('resize', function () { size(); if (still) draw(0); }, { passive: true });
  if (still) {
    draw(0);
    window.addEventListener('scroll', function () { draw(0); }, { passive: true });
  } else {
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    start();
  }
})();
