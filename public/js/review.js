/* Form gửi đánh giá (/danh-gia): kiểm tra nhanh, nén ảnh sang WebP (tối đa 1600px) rồi gửi bằng fetch. */
(function () {
  'use strict';
  var f = document.querySelector('[data-review-form]');
  if (!f) return;
  var MAX = 2;
  var LIMIT = 5 * 1024 * 1024;
  var TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  var status = f.querySelector('[data-form-status]');
  var photosIn = f.querySelector('[data-review-photos]');
  var preview = f.querySelector('[data-review-preview]');
  var setError = function (n, m) {
    var p = f.querySelector('[data-error-for="' + n + '"]');
    if (p) p.textContent = m || '';
    var el = f.elements[n];
    if (el && el.setAttribute && !el.length) { if (m) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
  };

  var cap = function (s) { return s.charAt(0).toLocaleUpperCase('vi') + s.slice(1).toLocaleLowerCase('vi'); };
  var updatePreview = function () {
    var last = f.elements.name.value.trim().split(/\s+/).pop() || 'Minh';
    preview.textContent = 'Hiển thị dạng "' + f.elements.salute.value + ' ' + cap(last) + '".';
  };
  f.elements.name.addEventListener('input', updatePreview);
  f.elements.salute.addEventListener('change', updatePreview);

  function check() {
    var e = {};
    if (!f.elements.product.value) e.product = 'Chọn sản phẩm bạn đã dùng.';
    if (!f.querySelector('input[name="stars"]:checked')) e.stars = 'Chọn số sao từ 1 đến 5.';
    if (f.elements.text.value.trim().length < 20) e.text = 'Viết ít nhất vài câu (từ 20 ký tự) về kết quả bạn thấy.';
    if (f.elements.name.value.trim().length < 2) e.name = 'Nhập họ tên của bạn.';
    if (f.elements.province.value.trim().length < 2) e.province = 'Nhập tỉnh, thành nơi bạn nuôi hoặc bán hàng.';
    if (!/^(0|84)\d{8,10}$/.test(f.elements.phone.value.replace(/\D/g, ''))) e.phone = 'Số điện thoại chưa đúng. Ví dụ: 0934 246 420.';
    if (!f.elements.consent.checked) e.consent = 'Đánh dấu đồng ý để Noben được đăng đánh giá.';
    var files = Array.prototype.slice.call(photosIn.files || []);
    if (files.length > MAX) e.photos = 'Chọn tối đa ' + MAX + ' ảnh.';
    else if (files.some(function (x) { return TYPES.indexOf(x.type) < 0; })) e.photos = 'Chỉ nhận ảnh JPG, PNG hoặc WebP.';
    else if (files.some(function (x) { return x.size > 15 * 1024 * 1024; })) e.photos = 'Ảnh quá lớn, chọn ảnh dưới 15 MB.';
    return e;
  }
  photosIn.addEventListener('change', function () { setError('photos', check().photos); });

  // Resize to at most 1600px and re-encode as WebP (JPEG if the browser cannot write WebP). Re-encoding also drops EXIF/GPS.
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var rd = new FileReader(); // data: URL, because the site's CSP does not allow blob: images
      rd.onerror = function () { reject(new Error('read')); };
      rd.onload = function () { draw(rd.result, resolve, reject); };
      rd.readAsDataURL(file);
    });
  }
  function draw(url, resolve, reject) {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * k);
        c.height = Math.round(im.naturalHeight * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(function (b) {
          if (b && b.type === 'image/webp') return resolve(b);
          c.toBlob(function (j) { return j ? resolve(j) : reject(new Error('encode')); }, 'image/jpeg', 0.82);
        }, 'image/webp', 0.8);
      };
      im.onerror = function () { reject(new Error('decode')); };
      im.src = url;
  }

  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var errs = check();
    ['product', 'stars', 'text', 'name', 'province', 'phone', 'consent', 'photos'].forEach(function (n) { setError(n, errs[n]); });
    var keys = Object.keys(errs);
    if (keys.length) {
      var first = f.querySelector('[aria-invalid="true"]') || f.querySelector('[data-error-for="' + keys[0] + '"]');
      if (first && first.focus) first.focus();
      status.textContent = 'Vui lòng kiểm tra lại các ô báo lỗi.';
      status.className = 'form__status is-error';
      return;
    }
    var btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    status.className = 'form__status';
    status.textContent = 'Đang gửi…';
    var fd = new FormData(f);
    fd.delete('photos');
    var files = Array.prototype.slice.call(photosIn.files || []).slice(0, MAX);
    Promise.all(files.map(function (x) { return shrink(x).catch(function () { return x; }); }))
      .then(function (blobs) {
        blobs.forEach(function (b, i) {
          if (b.size > LIMIT) throw new Error('big');
          fd.append('photos', b, 'anh-' + (i + 1) + (b.type === 'image/webp' ? '.webp' : b.type === 'image/png' ? '.png' : '.jpg'));
        });
        return fetch(f.action, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
      })
      .then(function (res) { return res.json().catch(function () { return { ok: false }; }).then(function (j) { return { res: res, j: j }; }); })
      .then(function (r) {
        if (r.j.ok) {
          var sp = f.elements.product.value;
          window.location.href = '/danh-gia?da_gui=1' + (sp && sp !== 'khac' ? '&sp=' + encodeURIComponent(sp) : '');
          return;
        }
        if (r.j.errors) Object.keys(r.j.errors).forEach(function (n) { setError(n, r.j.errors[n]); });
        status.textContent = r.j.message || 'Chưa gửi được. Vui lòng kiểm tra lại hoặc nhắn Zalo cho Noben.';
        status.className = 'form__status is-error';
        btn.disabled = false;
      })
      .catch(function (e) {
        status.textContent = e && e.message === 'big' ? 'Ảnh quá lớn, chọn ảnh khác nhỏ hơn 5 MB.' : 'Mạng yếu, chưa gửi được. Vui lòng thử lại.';
        status.className = 'form__status is-error';
        btn.disabled = false;
      });
  });
})();
