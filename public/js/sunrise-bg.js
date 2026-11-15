/* Scroll sunrise: the Noben logo rises out of the sea like the sun as the visitor scrolls,
   then stays risen as the background of the whole site, under a soft veil so text stays readable.
   Everything is measured in φ = 1.61803:
   - horizon at H/φ from the top (sky 61.8 %, sea 38.2 %)
   - the sun climbs from below the horizon to H/φ² and is fully up after H/φ px of scroll
   - glow radii S·φ, S·φ², S·φ³; 21 rays (Fibonacci); veil opacity 1 − 1/φ⁴ ≈ 0.854
   One fixed canvas, ≤ 30 fps (24 on phones), drawn only when something changed or light is moving;
   paused when the tab is hidden. Reduced motion: a still, fully risen scene. */
(function () {
  'use strict';
  var PHI = 1.61803, PI = Math.PI;
  var root = document.documentElement;
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var still = mq('(prefers-reduced-motion: reduce)');
  var phone = mq('(max-width: 760px)');
  var intro = !!document.querySelector('[data-sunrise-intro]'); // home page: rise with scroll

  var cv = document.createElement('canvas');
  cv.className = 'sunrise-bg';
  cv.setAttribute('aria-hidden', 'true');
  var veil = document.createElement('div');
  veil.className = 'sunrise-veil';
  veil.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(veil, document.body.firstChild);
  document.body.insertBefore(cv, document.body.firstChild);
  root.classList.add('has-sunrise');
  var ctx = cv.getContext('2d');

  var cue = document.querySelector('.hero__cue');
  var logo = new Image();
  logo.decoding = 'async';
  logo.src = '/images/brand/logo-noben.svg';

  var W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();

  // colour helpers
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }
  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
  // sky stops (top → horizon): pre-dawn → golden morning
  var SKY0 = [[4, 12, 32], [14, 24, 58], [42, 38, 86], [86, 58, 96]];
  var SKY1 = [[22, 44, 94], [96, 82, 140], [226, 120, 104], [255, 196, 92]];
  var SEA0 = [[10, 22, 52], [3, 10, 28]];
  var SEA1 = [[64, 54, 98], [6, 18, 46]];
  var GOLD = [255, 194, 14];

  // deterministic stars
  var stars = [];
  for (var i = 0; i < 55; i++) stars.push({ x: (i * 0.618034) % 1, y: ((i * 0.381966 * 13) % 1) * 0.58, r: 0.5 + (i % 4) * 0.35 });

  function progress() {
    if (!intro || still) return 1;
    return ease(window.scrollY / (H / PHI));
  }
  function veilLevel() {
    var max = 1 - 1 / Math.pow(PHI, 4); // ≈ 0.854
    if (!intro) return max;
    // home: clear while the sun rises, then fades in over 38.2 % of a screen once content arrives
    var start = H / PHI, span = H / (PHI * PHI);
    return max * ease((window.scrollY - start) / span);
  }

  function draw(time) {
    var t = time / 1000, p = progress();
    var hz = H / PHI;                                  // horizon
    var S = Math.min(W, H) / Math.pow(PHI, 3);         // sun (logo) size
    var sunY = hz + S * 0.382 - (hz + S * 0.382 - H / (PHI * PHI)) * p; // top edge peeking → H/φ²
    var sunX = W / 2;
    var light = 0.146 + 0.854 * ease(p * 1.15);      // a first glow at rest; light leads the sun

    // sky
    var g = ctx.createLinearGradient(0, 0, 0, hz);
    for (var k = 0; k < 4; k++) g.addColorStop([0, 0.382, 0.764, 1][k], rgb(mix(SKY0[k], SKY1[k], light)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz + 1);

    // stars fade out as light comes
    if (light < 0.95) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - light)) + ')';
      for (var s = 0; s < stars.length; s++) {
        var st = stars[s], tw = 0.6 + 0.4 * Math.sin(t * 1.618 + s);
        ctx.globalAlpha = tw;
        ctx.beginPath(); ctx.arc(st.x * W, st.y * hz, st.r, 0, 2 * PI); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // glow: three rings S·φ, S·φ², S·φ³
    var glowA = 0.18 + 0.62 * light;
    [[S * PHI * PHI * PHI, 0.22], [S * PHI * PHI, 0.38], [S * PHI, 0.62]].forEach(function (r) {
      var rg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, r[0]);
      rg.addColorStop(0, rgb([255, 226, 150], glowA * r[1]));
      rg.addColorStop(0.618, rgb([255, 170, 80], glowA * r[1] * 0.382));
      rg.addColorStop(1, rgb([255, 140, 60], 0));
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, hz);
    });

    // rays: 21 (Fibonacci), slowly turning, only above the horizon
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, hz); ctx.clip();
    ctx.translate(sunX, sunY);
    ctx.rotate(t * 0.02);
    var rayLen = S * Math.pow(PHI, 3.5);
    for (var r = 0; r < 21; r++) {
      var a = (r / 21) * 2 * PI;
      var lg = ctx.createLinearGradient(0, 0, Math.cos(a) * rayLen, Math.sin(a) * rayLen);
      lg.addColorStop(0, rgb([255, 236, 180], 0.32 * light));
      lg.addColorStop(1, rgb([255, 236, 180], 0));
      ctx.strokeStyle = lg; ctx.lineWidth = r % 2 ? 1 : 1.618;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * S * 0.62, Math.sin(a) * S * 0.62); ctx.lineTo(Math.cos(a) * rayLen, Math.sin(a) * rayLen); ctx.stroke();
    }
    ctx.restore();

    // the sun = Noben logo, hidden below the horizon line
    if (logo.complete && logo.naturalWidth) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, hz); ctx.clip();
      ctx.globalAlpha = 0.55 + 0.45 * light;
      ctx.drawImage(logo, sunX - S / 2, sunY - S / 2, S, S);
      ctx.restore();
    }

    // sea
    var sg = ctx.createLinearGradient(0, hz, 0, H);
    sg.addColorStop(0, rgb(mix(SEA0[0], SEA1[0], light)));
    sg.addColorStop(1, rgb(mix(SEA0[1], SEA1[1], light)));
    ctx.fillStyle = sg; ctx.fillRect(0, hz, W, H - hz);

    // horizon glow line
    var hg = ctx.createLinearGradient(sunX - W / 2, 0, sunX + W / 2, 0);
    hg.addColorStop(0, rgb([255, 200, 120], 0));
    hg.addColorStop(0.5, rgb([255, 214, 140], 0.25 + 0.6 * light));
    hg.addColorStop(1, rgb([255, 200, 120], 0));
    ctx.fillStyle = hg; ctx.fillRect(0, hz - 0.5, W, 1.618);

    // reflection: a column of glints under the sun that widens with depth
    var rows = phone ? 21 : 34;
    for (var j = 0; j < rows; j++) {
      var d = j / rows;                                  // 0 at horizon → 1 at bottom
      var y = hz + 4 + d * (H - hz - 8);
      var wv = S * (0.382 + d * PHI) * (0.8 + 0.2 * Math.sin(t * 1.618 + j * 1.3));
      var off = Math.sin(t * 0.9 + j * 2.1) * S * 0.12 * d;
      ctx.fillStyle = rgb(j % 3 ? GOLD : [255, 236, 190], (0.55 - d * 0.35) * light);
      ctx.fillRect(sunX - wv / 2 + off, y, wv, 1.2 + d * 1.2);
    }

    // gentle wave lines across the sea
    ctx.strokeStyle = rgb([200, 220, 255], 0.06 + 0.06 * light);
    ctx.lineWidth = 1;
    for (var w = 1; w <= 5; w++) {
      var wy = hz + (H - hz) * (w / 5.5);
      ctx.beginPath();
      for (var x = 0; x <= W + 10; x += 10) {
        var yy = wy + Math.sin(x / (60 + w * 26) + t * 0.6 + w) * (2 + w);
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    veil.style.opacity = veilLevel().toFixed(3);
    if (cue) cue.style.opacity = Math.max(0, 1 - p * PHI * PHI).toFixed(3);
  }

  var last = 0, raf = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < 1000 / (phone ? 24 : 30)) return;
    last = now; draw(now);
  }
  window.addEventListener('resize', function () { size(); if (still) draw(0); }, { passive: true });
  if (still) {
    draw(0);
    logo.addEventListener('load', function () { draw(0); });
    window.addEventListener('scroll', function () { veil.style.opacity = veilLevel().toFixed(3); }, { passive: true });
  } else {
    var start = function () { if (!raf) raf = requestAnimationFrame(loop); };
    var stop = function () { if (raf) cancelAnimationFrame(raf); raf = 0; };
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    start();
  }
})();
