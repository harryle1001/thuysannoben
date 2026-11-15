/* /tinh-lieu: product picker + pond inputs -> label doses scaled to the pond (parser in dose.js). */
(function () {
  'use strict';
  var root = document.querySelector('[data-dose-tool]');
  var D = window.NobenDose;
  if (!root || !D) return;
  var data = [];
  try { data = JSON.parse(document.getElementById('dose-data').textContent); } catch (e) { return; }

  var $ = function (s) { return root.querySelector(s); };
  var q = $('[data-dose-q]'), list = $('[data-dose-list]'), out = $('[data-dose-result]');
  var form = $('[data-dose-form]'), volOut = $('[data-dose-volout]');
  var feedField = $('[data-dose-feed-field]'), areaBox = $('[data-dose-area]'), volBox = $('[data-dose-volume]');
  var zalo = $('[data-dose-zalo]'), zaloStatus = $('[data-dose-zalo-status]');
  var leadProduct = $('[data-dose-product]'), leadMsg = $('[data-dose-message]');
  var current = null, summary = '', active = -1;

  var fold = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim(); };
  data.forEach(function (p) { p.k = fold(p.n + ' ' + p.s); p.lines = D.parseProduct(p.d); p.hasFeed = p.lines.some(function (l) { return l.doses.some(function (d) { return d.type === 'feed'; }); }); });
  var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  var val = function (name) { var v = String(form.elements[name].value || '').trim().replace(/\s/g, ''); return v ? D.num(v) : 0; };

  /* ---------- Product combobox ---------- */
  var options = [];
  var setActive = function (i) {
    options.forEach(function (o, j) { o.setAttribute('aria-selected', String(i === j)); });
    active = i;
    if (options[i]) { q.setAttribute('aria-activedescendant', options[i].id); options[i].scrollIntoView({ block: 'nearest' }); }
    else q.removeAttribute('aria-activedescendant');
  };
  var close = function () { list.hidden = true; q.setAttribute('aria-expanded', 'false'); setActive(-1); };
  var showList = function () {
    var t = fold(q.value);
    var hits = data.filter(function (p) { return !t || p.k.indexOf(t) > -1; }).slice(0, 12);
    list.textContent = '';
    options = hits.map(function (p, i) {
      var li = el('li', 'dtool__opt', p.n);
      li.id = 'dt-opt-' + i; li.setAttribute('role', 'option');
      li.addEventListener('mousedown', function (e) { e.preventDefault(); choose(p); });
      list.appendChild(li);
      return li;
    });
    if (!hits.length) list.appendChild(el('li', 'dtool__none', 'Không tìm thấy sản phẩm. Thử gõ tên ngắn hơn.'));
    list.hidden = false; q.setAttribute('aria-expanded', 'true'); setActive(hits.length && t ? 0 : -1);
    list._hits = hits;
  };
  var choose = function (p) {
    current = p; q.value = p.n; close();
    leadProduct.value = p.n;
    feedField.hidden = !p.hasFeed;
    try { history.replaceState(null, '', '/tinh-lieu?sp=' + p.s); } catch (e) { /* ignore */ }
    render();
  };
  q.addEventListener('input', showList);
  q.addEventListener('focus', showList);
  q.addEventListener('blur', close);
  q.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) showList(); setActive(Math.min(active + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); var h = list._hits || []; if (h[active]) choose(h[active]); else if (h.length === 1) choose(h[0]); }
    else if (e.key === 'Escape') close();
  });

  /* ---------- Pond inputs ---------- */
  var mode = function () { var m = form.querySelector('[data-dose-mode]:checked'); return m ? m.value : 'area'; };
  Array.prototype.forEach.call(form.querySelectorAll('[data-dose-mode]'), function (r) {
    r.addEventListener('change', function () { areaBox.hidden = mode() !== 'area'; volBox.hidden = mode() === 'area'; render(); });
  });
  form.addEventListener('input', function (e) { if (e.target !== q) render(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  var pond = function () {
    var p = { area: 0, volume: 0, feed: val('feed') };
    if (mode() === 'area') { p.area = val('area'); var depth = val('depth'); p.volume = p.area && depth ? p.area * depth : 0; }
    else p.volume = val('volume');
    return p;
  };
  var pondText = function (p) {
    var s = mode() === 'area' && p.area ? 'ao ' + D.fmtNum(p.area) + ' m²' + (p.volume ? ', sâu ' + D.fmtNum(p.volume / p.area) + ' m (' + D.fmtNum(p.volume) + ' m³ nước)' : '') : p.volume ? 'ao ' + D.fmtNum(p.volume) + ' m³ nước' : '';
    if (p.feed && current && current.hasFeed) s += (s ? ', ' : '') + D.fmtNum(p.feed) + ' kg thức ăn/ngày';
    return s;
  };

  /* ---------- Results ---------- */
  function render() {
    var p = pond();
    volOut.textContent = mode() === 'area' && p.volume ? 'Thể tích nước: ' + D.fmtNum(p.volume) + ' m³' : '';
    if (!current) return;
    out.textContent = '';
    var head = el('div', 'dtool__head');
    if (current.i) { var im = el('img'); im.src = current.i; im.alt = ''; im.width = 72; im.height = 72; im.loading = 'lazy'; head.appendChild(im); }
    var ht = el('div');
    ht.appendChild(el('h2', 'h3', current.n));
    var pt = pondText(p);
    ht.appendChild(el('p', 'dtool__pond', pt ? 'Cho ' + pt : 'Nhập thông tin ao để xem lượng cần dùng.'));
    var link = el('a', 'text-link', 'Xem trang sản phẩm'); link.href = current.u; ht.appendChild(link);
    head.appendChild(ht);
    out.appendChild(head);

    var rows = el('ul', 'dtool__rows'), notes = el('ul', 'dtool__notes');
    var lines = ['Tính liều ' + current.n + (pt ? ' cho ' + pt : '') + ':'];
    current.lines.forEach(function (l) {
      if (!l.candidate) { if (l.text) notes.appendChild(el('li', null, l.text)); return; }
      var li = el('li', 'dtool__row');
      var title = l.label || (l.doses[0] && l.doses[0].type === 'feed' ? 'Trộn thức ăn' : 'Tạt xuống ao');
      li.appendChild(el('p', 'dtool__label', title));
      if (!l.doses.length) {
        li.appendChild(el('p', 'dtool__na', 'Chưa tính tự động được, liều trên nhãn:'));
        lines.push('- ' + l.text);
      } else {
        var amts = l.doses.map(function (d) {
          var v = D.compute(d, p);
          var amt = el('p', 'dtool__amt');
          if (v) {
            amt.appendChild(el('strong', null, v));
            var unit = d.type === 'feed' ? ' / ngày (cho ' + D.fmtNum(p.feed) + ' kg thức ăn)' : l.brew ? ' dung dịch đã ủ' : '';
            if (unit) amt.appendChild(el('span', null, unit));
          } else {
            amt.appendChild(el('span', 'dtool__need', d.type === 'feed' ? 'Nhập số kg thức ăn mỗi ngày' : d.type === 'area' ? 'Nhãn tính theo m² mặt nước: nhập diện tích ao' : 'Nhập diện tích và độ sâu, hoặc thể tích nước'));
          }
          li.appendChild(amt);
          return v ? v + (d.type === 'feed' ? '/ngày' : l.brew ? ' dung dịch đã ủ' : '') : '';
        }).filter(Boolean);
        lines.push('- ' + title + ': ' + (amts.length ? amts.join(' + ') : '(chưa đủ thông tin ao)'));
      }
      li.appendChild(el('p', 'dtool__src', 'Nhãn ghi: ' + l.text));
      rows.appendChild(li);
    });
    if (rows.children.length) out.appendChild(rows);
    else out.appendChild(el('p', 'dtool__na', 'Nhãn sản phẩm này không ghi liều theo thể tích ao. Hướng dẫn trên nhãn:'));
    if (notes.children.length) {
      var det = el('details', 'dtool__more');
      det.open = !rows.children.length;
      det.appendChild(el('summary', null, 'Cách dùng ghi trên nhãn'));
      det.appendChild(notes);
      out.appendChild(det);
    }
    summary = lines.join('\n');
    leadMsg.value = summary.slice(0, 1900);
  }

  /* ---------- Send to Zalo: copy the result, then the link opens Zalo ---------- */
  zalo.addEventListener('click', function () {
    if (!summary) return;
    var text = summary + '\n(Nhờ kỹ thuật viên kiểm tra giúp)';
    var done = function () { zaloStatus.textContent = 'Đã chép kết quả. Trong Zalo, giữ ngón tay vào ô nhắn tin, chọn Dán rồi gửi.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { zaloStatus.textContent = 'Chép kết quả rồi dán vào Zalo: ' + text; });
    else zaloStatus.textContent = 'Chép kết quả rồi dán vào Zalo: ' + text;
  });

  var params = new URLSearchParams(location.search);
  var start = data.filter(function (p) { return p.s === params.get('sp'); })[0];
  if (start) choose(start);
})();
