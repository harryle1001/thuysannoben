/* Lịch chăm sóc tôm theo ngày tuổi (/lich-cham-soc). Ngày thả và loại ao lưu trong localStorage. */
(function () {
  'use strict';
  var root = document.querySelector('[data-care]');
  var dataEl = document.getElementById('care-data');
  if (!root || !dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var form = root.querySelector('[data-care-form]');
  var dateIn = root.querySelector('[data-care-date]');
  var err = root.querySelector('[data-care-error]');
  var out = root.querySelector('[data-care-out]');
  var msg = document.querySelector('[data-care-message]');
  var KEY = 'noben-care';

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var vn = function (d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); };
  var parse = function (v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  var pondVal = function () { var r = root.querySelector('[data-care-pond]:checked'); return r ? r.value : 'bat'; };

  try {
    var saved = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    if (saved && saved.date) {
      dateIn.value = saved.date;
      var r = root.querySelector('[data-care-pond][value="' + (saved.pond === 'dat' ? 'dat' : 'bat') + '"]');
      if (r) r.checked = true;
    }
  } catch (e) { /* storage blocked: the page still works */ }
  dateIn.max = ymd(new Date(Date.now() + 60 * 864e5));

  function productList(list) {
    return '<ul class="care-pick">' + list.map(function (p) {
      return '<li><a class="care-pick__card" href="' + esc(p.u) + '">' + (p.i ? '<img src="' + esc(p.i.replace(/([^/]+)$/, 'sm/$1')) + '" alt="" width="48" height="91" loading="lazy" decoding="async" data-care-img>' : '') +
        '<span><strong>' + esc(p.n) + '</strong><small>' + esc(p.t) + '</small><em>Xem liều trên nhãn</em></span></a>' +
        (p.d ? '<a class="care-pick__dose" href="/tinh-lieu?sp=' + encodeURIComponent(p.s) + '">Tính liều</a>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  function render(start, pond) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var age = Math.round((today - start) / 864e5) + 1; // ngày thả là ngày tuổi thứ 1
    var stage = D.stages.filter(function (s) { return age >= s.from && age <= s.to; })[0] || D.stages[0];
    var P = D.pond[pond];
    var html = '';
    if (age < 1) {
      html += '<p class="care__age"><span>Còn</span> <strong>' + (1 - age) + '</strong> <span>ngày nữa thả giống</span></p>';
    } else {
      var week = Math.ceil(age / 7);
      html += '<p class="care__age"><span>Tôm hôm nay</span> <strong>' + age + '</strong> <span>ngày tuổi</span></p>' +
        '<p class="care__meta">Thả ngày ' + vn(start) + ' · ' + esc(P.name) + ' · Tuần thứ ' + week + ' (ngày ' + ((week - 1) * 7 + 1) + ' đến ' + week * 7 + ')</p>';
    }
    if (age > 150) html += '<p class="care__note">Đã quá thời gian nuôi thông thường (75 đến 110 ngày). Kiểm tra lại ngày thả giống.</p>';
    html += '<div class="care__stage"><p class="care__label">Giai đoạn hiện tại</p><h2 class="h3">' + esc(stage.name) + '</h2><p>' + esc(stage.goal) + '</p>';
    if (age >= 1 && stage.to < 9999) html += '<progress max="' + (stage.to - stage.from + 1) + '" value="' + (age - stage.from + 1) + '">' + age + '</progress><p class="care__meta">Còn ' + (stage.to - age) + ' ngày nữa sang giai đoạn tiếp theo.</p>';
    html += '</div>';
    D.watch.filter(function (w) { return age >= w.from && age <= w.to; }).forEach(function (w) {
      html += '<p class="care__watch"><strong>Lưu ý:</strong> ' + esc(w.text) + ' <a href="' + esc(w.link) + '">' + esc(w.linkText) + '</a></p>';
    });
    var tasks = stage.tasks.slice();
    if (age >= 1) P.tasks.forEach(function (t) { if (age >= t.from) tasks.push(t.text); });
    html += '<h3 class="care__h">Việc cần làm tuần này</h3><ul class="care__tasks">' + tasks.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    if (age >= 1) html += '<details class="care__daily"><summary>Việc kiểm tra mỗi ngày</summary><ul>' + D.daily.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></details>';
    html += '<h3 class="care__h">Sản phẩm Noben gợi ý cho giai đoạn này</h3>' + productList(stage.products);
    if (age >= 1) html += '<h3 class="care__h">Dành riêng cho ' + esc(P.name.toLowerCase()) + '</h3>' + productList(P.products);
    html += '<p class="care__note">Liều dùng theo nhãn từng sản phẩm, điều chỉnh theo tình trạng ao. Xem thêm: <a href="' + esc(stage.article) + '">' + esc(stage.articleText) + '</a>.</p>';
    out.innerHTML = html;
    Array.prototype.forEach.call(out.querySelectorAll('[data-care-img]'), function (im) {
      im.addEventListener('error', function () { var full = im.src.replace('/sm/', '/'); if (im.src !== full) im.src = full; }, { once: true });
    });
    if (msg) msg.value = 'Nhắc lịch chăm sóc tôm: thả giống ngày ' + vn(start) + ', ' + P.name.toLowerCase() + (age >= 1 ? ', hiện ' + age + ' ngày tuổi' : '');
  }

  function run(save) {
    var d = parse(dateIn.value);
    var limit = Date.now() + 61 * 864e5;
    if (!d || d.getTime() > limit || d.getFullYear() < 2000) {
      err.textContent = 'Chọn ngày thả giống (không quá 60 ngày tới).';
      dateIn.setAttribute('aria-invalid', 'true');
      return;
    }
    err.textContent = '';
    dateIn.removeAttribute('aria-invalid');
    var pond = pondVal();
    render(d, pond);
    if (save) { try { window.localStorage.setItem(KEY, JSON.stringify({ date: dateIn.value, pond: pond })); } catch (e) { /* ignore */ } }
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); run(true); out.focus && out.setAttribute('tabindex', '-1'); });
  Array.prototype.forEach.call(root.querySelectorAll('[data-care-pond]'), function (r) { r.addEventListener('change', function () { if (dateIn.value) run(true); }); });
  if (dateIn.value) run(false);
})();
