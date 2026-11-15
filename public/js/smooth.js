/* Smooth scrolling with Lenis 1.3.27 (vendored in /js/vendor). Skipped for reduced motion. */
(function () {
  'use strict';
  if (typeof window.Lenis !== 'function') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
})();
