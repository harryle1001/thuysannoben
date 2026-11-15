/* Trang quản trị đánh giá: tạo link /danh-gia?sp=... và tin nhắn Zalo mẫu, hỏi lại trước khi xóa. */
(function () {
  'use strict';
  var box = document.querySelector('[data-review-link]');
  if (box) {
    var sp = box.querySelector('[data-review-link-sp]');
    var url = box.querySelector('[data-review-link-url]');
    var msg = box.querySelector('[data-review-link-msg]');
    var st = box.querySelector('[data-review-link-status]');
    var base = url.value.replace(/\?.*$/, '');
    var update = function () {
      var o = sp.options[sp.selectedIndex];
      var link = base + (sp.value ? '?sp=' + encodeURIComponent(sp.value) : '');
      url.value = link;
      msg.value = 'Dạ, Noben cảm ơn anh/chị đã tin dùng ' + (sp.value ? o.getAttribute('data-name') : 'sản phẩm Noben') +
        '. Sau khi dùng, anh/chị thấy ao và tôm thế nào, cho Noben xin vài dòng đánh giá thật tại đây nhé (khoảng 1 phút, số điện thoại không công khai): ' + link;
    };
    sp.addEventListener('change', update);
    box.querySelector('[data-review-link-copy]').addEventListener('click', function () {
      var done = function () { st.textContent = 'Đã chép, dán vào Zalo để gửi khách.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(msg.value).then(done, function () { msg.select(); });
      else { msg.select(); try { document.execCommand('copy'); done(); } catch (e) { /* select is enough */ } }
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('form[data-confirm]'), function (f) {
    f.addEventListener('submit', function (e) { if (!window.confirm(f.getAttribute('data-confirm'))) e.preventDefault(); });
  });
})();
