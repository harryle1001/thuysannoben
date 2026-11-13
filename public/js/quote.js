// Quote list: visitors collect several products (with quantities) and send one price request.
// Stored in the browser only (localStorage); sent through the normal contact form as need "Yêu cầu báo giá".
(function () {
  'use strict';
  var KEY = 'noben-quote';
  var read = function () {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  };
  var write = function (list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode */ } };
  var list = read();
  var has = function (slug) { return list.some(function (x) { return x.slug === slug; }); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  function refresh() {
    write(list);
    var n = list.length;
    document.querySelectorAll('[data-quote-badge]').forEach(function (b) {
      b.hidden = n === 0;
      var c = b.querySelector('[data-quote-count]');
      if (c) c.textContent = n;
    });
    document.querySelectorAll('[data-quote-add]').forEach(function (btn) {
      var on = has(btn.getAttribute('data-slug'));
      btn.setAttribute('aria-pressed', String(on));
      var label = btn.querySelector('[data-quote-label]');
      if (label) label.textContent = on ? 'Đã có trong danh sách báo giá' : 'Thêm vào danh sách báo giá';
    });
    renderPage();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-quote-add]');
    if (!btn) return;
    var slug = btn.getAttribute('data-slug');
    if (has(slug)) list = list.filter(function (x) { return x.slug !== slug; });
    else list.push({ slug: slug, name: btn.getAttribute('data-name'), img: btn.getAttribute('data-img') || '', url: btn.getAttribute('data-url') || '', qty: 1 });
    refresh();
  });

  // The /bao-gia page.
  var box = document.querySelector('[data-quote-list]');
  var form = document.querySelector('[data-quote-form]');
  function renderPage() {
    if (!box) return;
    var empty = document.querySelector('[data-quote-empty]');
    if (empty) empty.hidden = list.length > 0;
    if (form) form.hidden = list.length === 0;
    box.innerHTML = list.map(function (x, i) {
      return '<li class="qitem">' +
        (x.img ? '<img class="qitem__img" src="' + esc(x.img) + '" alt="" width="64" height="64" loading="lazy">' : '<span class="qitem__img"></span>') +
        '<a class="qitem__name" href="' + esc(x.url || '#') + '">' + esc(x.name) + '</a>' +
        '<label class="qitem__qty"><span class="sr-only">Số lượng ' + esc(x.name) + '</span>' +
        '<button type="button" data-q-step="-1" data-i="' + i + '" aria-label="Bớt">−</button>' +
        '<input type="number" min="1" max="9999" inputmode="numeric" value="' + (x.qty || 1) + '" data-q-input data-i="' + i + '">' +
        '<button type="button" data-q-step="1" data-i="' + i + '" aria-label="Thêm">+</button></label>' +
        '<button class="qitem__del" type="button" data-q-del data-i="' + i + '">Bỏ</button></li>';
    }).join('');
    var field = form && form.elements.product;
    if (field) field.value = list.map(function (x) { return x.name + ' × ' + (x.qty || 1); }).join(' | ');
  }
  if (box) {
    box.addEventListener('click', function (e) {
      var t = e.target;
      var i = Number(t.getAttribute('data-i'));
      if (t.hasAttribute('data-q-del')) { list.splice(i, 1); refresh(); }
      if (t.hasAttribute('data-q-step')) { list[i].qty = Math.max(1, (list[i].qty || 1) + Number(t.getAttribute('data-q-step'))); refresh(); }
    });
    box.addEventListener('change', function (e) {
      if (!e.target.hasAttribute('data-q-input')) return;
      var i = Number(e.target.getAttribute('data-i'));
      list[i].qty = Math.max(1, Math.min(9999, parseInt(e.target.value, 10) || 1));
      refresh();
    });
  }
  if (form) form.addEventListener('lead:sent', function () { list = []; refresh(); });
  window.addEventListener('storage', function (e) { if (e.key === KEY) { list = read(); refresh(); } });
  refresh();
})();
