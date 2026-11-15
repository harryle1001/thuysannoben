/* Sunrise background, built for buttery scrolling.
   The scene is a stack of layers painted ONCE by CSS (night sky, dawn sky, morning sky, stars, clouds,
   glow, the Noben logo as the sun, the sea and its glint). While the visitor scrolls, only the
   compositor-friendly properties `opacity` and `transform` of these few layers change, so the GPU
   does the work and nothing is repainted. The sun also rises on its own (φ³ ≈ 4.236 s) if nobody
   scrolls; scrolling simply runs ahead of it. Proportions in φ = 1.61803 (see the CSS block
   "Sunrise background"). Reduced motion: the risen scene, still. */
(function () {
  'use strict';
  var PHI = 1.61803;
  var doc = document.documentElement;
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var still = mq('(prefers-reduced-motion: reduce)');
  var intro = !!document.querySelector('[data-sunrise-intro]'); // home page: the sun rises here

  var html =
    '<div class="sky" aria-hidden="true">' +
      '<div class="sky__l sky__night"></div>' +
      '<div class="sky__l sky__dawn" data-k="dawn"></div>' +
      '<div class="sky__l sky__day" data-k="day"></div>' +
      '<div class="sky__clip">' +
        '<div class="sky__glow" data-k="glow"></div>' +
        '<img class="sky__sun" data-k="sun" src="/images/brand/logo-noben.svg" alt="" width="512" height="512" decoding="async">' +
      '</div>' +
      '<div class="sky__glint" data-k="glint"><i></i></div>' +
    '</div>' +
    '<div class="sunrise-veil" data-k="veil" aria-hidden="true"></div>';
  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  while (wrap.lastChild) document.body.insertBefore(wrap.lastChild, document.body.firstChild);
  doc.classList.add('has-sunrise');

  var el = {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-k]'), function (n) { el[n.getAttribute('data-k')] = n; });

  // smoothstep segments
  function seg(p, a, b) { var t = (p - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  var last = {};
  function set(k, prop, v) {
    var key = k + prop;
    if (last[key] === v) return;
    last[key] = v;
    el[k].style[prop] = v;
  }

  // Large-viewport height: stable while the phone's address bar slides, so timings never jump.
  var LH = Math.max(window.innerHeight, doc.clientHeight);
  window.addEventListener('resize', function () { LH = Math.max(LH, window.innerHeight); }, { passive: true });

  function apply(p, veil) {
    var r = function (x) { return x.toFixed(3); };
    set('dawn', 'opacity', r(seg(p, 0, 0.5)));                  // indigo → violet, rose, peach (covers the stars)
    set('day', 'opacity', r(0.854 * seg(p, 0.382, 1)));         // morning blue keeps a warm horizon
    set('glow', 'opacity', r(0.236 + 0.764 * seg(p, 0, 0.85)));
    set('glow', 'transform', 'scale(' + r(0.618 + 0.382 * seg(p, 0, 1)) + ')');
    // sun: starts with 38.2 % of its height above the horizon, rises 23.6 lvh + 11.8 % to its place at 38.2 lvh
    set('sun', 'transform', 'translate3d(-50%, calc(' + r(1 - seg(p, 0, 1)) + ' * (23.6lvh + 11.8%)), 0)');
    set('glint', 'opacity', r(0.146 + 0.854 * seg(p, 0.15, 0.9)));
    set('glint', 'transform', 'translateX(-50%) scaleX(' + r(0.382 + 0.618 * seg(p, 0, 1)) + ')');
    set('veil', 'opacity', r(veil));
  }

  if (still || !intro) {
    apply(1, intro && !still ? 0 : 0.854);
    if (intro) {
      var vs = function () { apply(1, 0.854 * seg(window.scrollY, LH / PHI, LH / PHI + LH / (PHI * PHI))); };
      window.addEventListener('scroll', vs, { passive: true }); vs();
    }
    return;
  }

  // Home: auto rise over φ³ s after a φ⁻¹ s pause; scrolling runs ahead of it.
  var AUTO = 4236, DELAY = 618, t0 = performance.now(), done = false, raf = 0;
  function frame(now) {
    raf = 0;
    var auto = seg(now - t0 - DELAY, 0, AUTO);
    var sp = seg(window.scrollY, 0, LH / PHI);
    var p = Math.max(auto, sp);
    var veil = 0.854 * seg(window.scrollY, LH / PHI, LH / PHI + LH / (PHI * PHI));
    apply(p, veil);
    if (auto < 1) { raf = requestAnimationFrame(frame); } else { done = true; }
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', onScroll, { passive: true });
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !done && !raf) raf = requestAnimationFrame(frame); });
})();
