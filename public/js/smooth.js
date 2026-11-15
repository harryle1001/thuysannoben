/* Smooth scrolling with Lenis 1.3.27 (vendored in /js/vendor). Only for a mouse or trackpad:
   phones and tablets keep native scrolling and never download the library. Skipped for reduced motion. */
(function () {
  'use strict';
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  if (!mq('(hover: hover) and (pointer: fine)') || mq('(prefers-reduced-motion: reduce)')) return;
  var s = document.createElement('script');
  s.src = '/js/vendor/lenis-1.3.27.min.js';
  s.onload = start;
  document.head.appendChild(s);

  function start() {
    if (typeof window.Lenis !== 'function') return;
    var lenis = new window.Lenis({
      autoRaf: true,
      lerp: 0.09 /* 1/φ⁵ */,
      // inner scroll areas (mobile menu, chat log, wide tables, chip rows) keep their own scrolling
      prevent: function (node) {
        return !!(node.closest && node.closest('.nav, .chatbot, .chatbot__log, .table-wrap, .prose table, [data-lenis-prevent]'));
      },
    });
    window.__lenis = lenis;
    // pause while the mobile menu is open (main.js toggles body.menu-open)
    new MutationObserver(function () {
      if (document.body.classList.contains('menu-open')) lenis.stop(); else lenis.start();
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // same-page links (#section): glide instead of jumping; CSS scroll-margin still applies
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      var id = decodeURIComponent(a.getAttribute('href').slice(1)), el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el);
      if (history.pushState) history.pushState(null, '', '#' + id);
    });
  }
})();
