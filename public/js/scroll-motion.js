/* Scroll-linked motion: images drift, tilt and settle as they pass through the screen, so the page
   feels three-dimensional while scrolling (works with Lenis on desktop and native scrolling on phones).
   Uses the individual `translate`, `scale` and `rotate` properties, so it never fights the transforms
   that other scripts set (3D product drag, reveal animations, hover zoom). Only elements on screen are
   updated, once per frame. Nothing moves for visitors who ask for reduced motion. */
(function () {
  'use strict';
  if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window) || !CSS.supports || !CSS.supports('translate', '0 1px')) return;

  var PHI = 1.618034;
  var phone = window.matchMedia('(max-width: 760px)').matches;
  // Touch scrolling runs off the main thread, so per-frame JS motion always trails the finger and
  // reads as jitter on long lists. On touch screens keep only the few large single objects.
  var touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var k = phone ? 1 / PHI : 1; // gentler on small screens

  // selector -> how the element reacts to its position p (-1 below the screen centre ... +1 above it)
  var RULES = [
    // Backgrounds move slower than the page: depth.
    { sel: '.hero__video, .lp-hero__bg video, .page-head__photo video, .page-head__photo img', y: 34, s: 1.08 },
    { sel: '.oem-band__photo img, .qc__frame', y: 21, s: 1.04, zoom: 0.05 },
    // Product packs float up against the scroll and turn slightly, like a real object under light.
    { sel: '.lp-pack__img', y: -42, r: -3.6, touch: true },
    { sel: '.stage3d__obj img', y: -21, r: 2.4, touch: true },
    { sel: '.pcard__img', y: -10 },
    { sel: '.lp-range__shots img', y: -21, stagger: true },
    { sel: '.stage__shot img, .finder__list img', y: -8 },
    // Cards and photos settle into place.
    { sel: '.cert img, .photo-grid img, .acard img', y: 13, s: 1.05 },
  ];

  var items = [];
  RULES.forEach(function (rule) {
    if (touch && !rule.touch) return;
    Array.prototype.forEach.call(document.querySelectorAll(rule.sel), function (el, i) {
      if (el.closest('[data-no-scroll-motion]')) return;
      if (phone && (el.tagName === 'VIDEO' || el.classList.contains('qc__frame'))) return; // full-bleed on phones: never scale past the screen edge
      var depth = rule.stagger ? 1 + (i % 3) * 0.382 : 1;
      items.push({ el: el, rule: rule, depth: depth, on: false });
      if (rule.s) el.style.scale = String(rule.s); // overscan so moving backgrounds never show an edge
    });
  });
  if (!items.length) return;

  var visible = new Set();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var it = e.target.__sm;
      if (!it) return;
      if (e.isIntersecting) visible.add(it); else visible.delete(it);
    });
    schedule();
  }, { rootMargin: '20% 0px' });
  items.forEach(function (it) { it.el.__sm = it; io.observe(it.el); });

  var ticking = false;
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function update() {
    ticking = false;
    var vh = window.innerHeight, list = [], i;
    // read every position first, then write: one layout pass per frame, no layout thrashing
    visible.forEach(function (it) { list.push([it, it.el.getBoundingClientRect()]); });
    for (i = 0; i < list.length; i++) {
      var it = list[i][0], r = list[i][1];
      var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      p = Math.max(-1, Math.min(1, p));
      var rule = it.rule, f = k * it.depth;
      if (rule.y) it.el.style.translate = '0 ' + (p * rule.y * f).toFixed(1) + 'px';
      if (rule.r) it.el.style.rotate = (p * rule.r * f).toFixed(2) + 'deg';
      if (rule.zoom) it.el.style.scale = ((rule.s || 1) + (1 - Math.abs(p)) * rule.zoom * k).toFixed(3);
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  if (window.__lenis && window.__lenis.on) window.__lenis.on('scroll', schedule);
  else window.addEventListener('load', function () { if (window.__lenis && window.__lenis.on) window.__lenis.on('scroll', schedule); });
  schedule();
})();
