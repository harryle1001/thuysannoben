/* Light / dark theme. Runs in <head> before the page paints so a saved choice never flashes the wrong colours.
   Without a saved choice the site follows the device setting (prefers-color-scheme). */
(function () {
  'use strict';
  var KEY = 'noben-theme';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function current() {
    var t = root.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : (media && media.matches ? 'dark' : 'light');
  }
  function label(btn) {
    var dark = current() === 'dark';
    btn.setAttribute('aria-label', dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
    btn.setAttribute('title', dark ? 'Giao diện sáng' : 'Giao diện tối');
    btn.setAttribute('aria-pressed', String(dark));
  }
  function syncMeta() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', current() === 'dark' ? '#050f22' : '#0b2347');
  }
  document.addEventListener('DOMContentLoaded', function () {
    var buttons = [].slice.call(document.querySelectorAll('[data-theme-toggle]'));
    buttons.forEach(function (btn) {
      label(btn);
      btn.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
        buttons.forEach(label);
        syncMeta();
      });
    });
    if (media && media.addEventListener) media.addEventListener('change', function () { buttons.forEach(label); syncMeta(); });
    syncMeta();
  });
})();
