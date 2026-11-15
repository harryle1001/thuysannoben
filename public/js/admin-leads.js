/* /quan-tri/lien-he: save a lead's follow-up status as soon as it changes (the Lưu button is the no-JS fallback). */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('[data-lead-status]'), function (f) {
    var btn = f.querySelector('button');
    var sel = f.elements.status;
    btn.hidden = true;
    sel.addEventListener('change', function () {
      sel.disabled = true;
      var body = new URLSearchParams({ id: f.elements.id.value, status: sel.value }).toString();
      fetch(f.action, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function () {
          var row = f.closest('tr');
          row.className = 'is-' + ({ 'Mới': 'new', 'Đã gọi': 'called', 'Đã chốt': 'won', 'Không tiềm năng': 'lost' })[sel.value];
        })
        .catch(function () { alert('Chưa lưu được trạng thái. Đăng nhập lại rồi thử lại.'); })
        .then(function () { sel.disabled = false; });
    });
  });
})();
