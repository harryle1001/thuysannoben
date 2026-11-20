/* Trình chỉnh nhãn /quan-tri/nhan: dàn trang bằng public/js/label-engine.js (cùng bộ máy với scripts/build-labels.js). */
(function () {
  'use strict';
  var root = document.querySelector('[data-lbl]');
  if (!root || !window.NobenLabel) return;
  var $ = function (s) { return root.querySelector(s); };
  var status = document.querySelector('[data-lbl-status]');
  var form = $('[data-lbl-form]'), sel = $('[data-lbl-product]'), canvas = $('[data-lbl-canvas]');
  var saveMsg = $('[data-lbl-save]'), fitMsg = $('[data-lbl-fit]'), ocrMsg = $('[data-lbl-ocr]');
  var LISTS = ['nhan_phu', 'cong_dung', 'thanh_phan', 'huong_dan'];
  var TEXTS = ['ten', 'phu_de', 'nhom_hien_thi', 'quy_cach', 'bao_quan', 'luu_y', 'bao_bi'];
  var state = { spec: null, labels: [], mark: '', cur: null, colorSet: false, last: null };
  var M = null;

  function fail(msg) { status.textContent = msg; status.classList.add('is-warn'); }

  Promise.all([
    fetch('/quan-tri/nhan/du-lieu.json', { credentials: 'same-origin' }).then(function (r) { if (r.status === 401) { location.href = '/quan-tri/dang-nhap?next=/quan-tri/nhan'; throw new Error('401'); } return r.json(); }),
    fetch('/images/brand/logo-noben-phi.svg').then(function (r) { return r.text(); }),
    Promise.all(['400 20px "Be Vietnam Pro"', '600 20px "Be Vietnam Pro"', '800 20px "Playfair Display"'].map(function (f) { return document.fonts.load(f, 'Noben Ữ ắ 0123'); })),
  ]).then(function (res) {
    state.spec = res[0].spec; state.labels = res[0].labels; state.mark = res[1];
    M = NobenLabel.canvasMeasurer(document);
    Object.keys(state.spec.kho).forEach(function (k) {
      var o = document.createElement('option'); var s = state.spec.kho[k];
      o.value = k; o.textContent = s.ten + ' · ' + s.w + '×' + s.h + ' mm'; form.elements.bao_bi.appendChild(o);
    });
    state.labels.forEach(function (l, i) {
      var o = document.createElement('option'); o.value = String(i); o.textContent = l.ten + (l._sua ? ' (đã sửa)' : ''); sel.appendChild(o);
    });
    var want = new URLSearchParams(location.search).get('sp');
    var idx = Math.max(0, state.labels.findIndex(function (l) { return l.slug === want; }));
    sel.value = String(idx);
    load(idx);
    status.hidden = true; root.hidden = false;
  }).catch(function (e) { if (e.message !== '401') fail('Không tải được dữ liệu nhãn: ' + e.message); });

  function themeColor(l) { var t = (state.spec.mau_nhom || {})[l.nhom] || NobenLabel.THEMES[l.nhom] || {}; return t.accent || '#1b4db1'; }

  function load(i) {
    var l = state.labels[i]; state.cur = l;
    TEXTS.forEach(function (k) { if (form.elements[k]) form.elements[k].value = l[k] == null ? '' : l[k]; });
    if (!state.spec.kho[l.bao_bi]) form.elements.bao_bi.value = 'tui';
    LISTS.forEach(function (k) { form.elements[k].value = (l[k] || []).join('\n'); });
    form.querySelectorAll('[data-legal]').forEach(function (inp) { inp.value = (l.phap_ly || {})[inp.dataset.legal] || ''; });
    state.colorSet = Boolean(l.mau_nhan);
    form.elements.mau_nhan.value = l.mau_nhan || themeColor(l);
    var o = l.so_dang_ky_tham_khao || l.so_dang_ky_doc_tu_anh;
    ocrMsg.hidden = !o;
    ocrMsg.textContent = '';
    if (o) {
      ocrMsg.append('Số tham khảo: ', Object.assign(document.createElement('strong'), { textContent: o.gia_tri }), ' · ' + o.ghi_chu + (o.nguon ? ' Nguồn: ' + o.nguon + '.' : '') + ' ');
      var use = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn--line lbl__small', textContent: 'Chép vào ô số đăng ký' });
      use.addEventListener('click', function () { form.querySelector('[data-legal="so_dang_ky"]').value = o.gia_tri; render(); });
      ocrMsg.append(use);
    }
    saveMsg.textContent = l._sua ? 'Bản đã sửa lúc ' + new Date(l._sua).toLocaleString('vi-VN') : '';
    render();
  }

  function collect() {
    var l = state.cur, out = { slug: l.slug, nhom: l.nhom };
    TEXTS.forEach(function (k) { if (form.elements[k]) out[k] = form.elements[k].value.trim(); });
    LISTS.forEach(function (k) { out[k] = form.elements[k].value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); });
    out.phap_ly = {};
    form.querySelectorAll('[data-legal]').forEach(function (inp) { out.phap_ly[inp.dataset.legal] = inp.value.trim() || ''; });
    out.mau_nhan = state.colorSet ? form.elements.mau_nhan.value : null;
    return out;
  }

  var timer = 0;
  function render() {
    var data = collect();
    var size = state.spec.kho[data.bao_bi] || state.spec.kho.tui;
    var r = NobenLabel.layout(size, data, { measure: M, spec: state.spec, mark: state.mark });
    state.last = { svg: r.svg, data: data, size: size };
    canvas.innerHTML = NobenLabel.trimView(r.svg);
    var warn = r.warnings.length ? ' · ' + r.warnings.join(' ') : '';
    fitMsg.textContent = 'Khổ ' + size.w + '×' + size.h + ' mm (+ tràn lề ' + size.tran_le + ' mm) · cỡ chữ nội dung ' + String(r.fit.body_pt).replace('.', ',') + ' pt' + warn;
    fitMsg.classList.toggle('is-warn', Boolean(r.warnings.length) || r.fit.body_pt < 5.5);
  }
  form.addEventListener('input', function (e) {
    if (e.target.name === 'mau_nhan') state.colorSet = true;
    clearTimeout(timer); timer = setTimeout(render, 120);
  });
  form.addEventListener('change', function () { clearTimeout(timer); render(); });
  sel.addEventListener('change', function () { load(+sel.value); });
  $('[data-lbl-color-reset]').addEventListener('click', function () { state.colorSet = false; form.elements.mau_nhan.value = themeColor(state.cur); render(); });

  function post(body) {
    return fetch('/quan-tri/nhan', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || r.status); return j; }); });
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = collect(); delete d.slug; delete d.nhom;
    saveMsg.textContent = 'Đang lưu…'; saveMsg.classList.remove('is-warn');
    post({ slug: state.cur.slug, label: d }).then(function (j) {
      Object.assign(state.cur, d, { _sua: j.at });
      sel.options[sel.selectedIndex].textContent = state.cur.ten + ' (đã sửa)';
      saveMsg.textContent = 'Đã lưu lúc ' + new Date(j.at).toLocaleString('vi-VN') + '. Bản in: chạy node scripts/build-labels.js --dung-ban-luu';
    }).catch(function (err) { saveMsg.textContent = 'Chưa lưu được: ' + err.message; saveMsg.classList.add('is-warn'); });
  });
  $('[data-lbl-reset]').addEventListener('click', function () {
    if (!confirm('Bỏ mọi thay đổi đã lưu của nhãn này và quay về bản gốc?')) return;
    post({ slug: state.cur.slug, reset: true }).then(function () { location.href = '/quan-tri/nhan?sp=' + encodeURIComponent(state.cur.slug); })
      .catch(function (err) { saveMsg.textContent = 'Không thực hiện được: ' + err.message; saveMsg.classList.add('is-warn'); });
  });

  function download(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  var fileBase = function () { return 'nhan-' + state.cur.slug + '-' + (state.last.data.bao_bi || 'tui'); };
  $('[data-lbl-svg]').addEventListener('click', function () {
    download(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + state.last.svg + '\n'], { type: 'image/svg+xml' }), fileBase() + '.svg');
  });

  // PNG 300 dpi (trong đường xén). Phông được nhúng vào bản SVG dùng để vẽ, vì ảnh SVG không dùng phông của trang.
  var fontCss = null;
  var FONT_FILES = [['Be Vietnam Pro', 400, 'be-vietnam-pro-vietnamese-400-normal'], ['Be Vietnam Pro', 400, 'be-vietnam-pro-latin-400-normal'],
    ['Be Vietnam Pro', 600, 'be-vietnam-pro-vietnamese-600-normal'], ['Be Vietnam Pro', 600, 'be-vietnam-pro-latin-600-normal'],
    ['Playfair Display', 800, 'playfair-display-vietnamese-wght-normal'], ['Playfair Display', 800, 'playfair-display-latin-wght-normal']];
  function fonts() {
    if (fontCss) return Promise.resolve(fontCss);
    return Promise.all(FONT_FILES.map(function (f) {
      return fetch('/fonts/' + f[2] + '.woff2').then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
        var b = '', u = new Uint8Array(buf); for (var i = 0; i < u.length; i += 0x8000) b += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
        return "@font-face{font-family:'" + f[0] + "';font-weight:" + f[1] + ';src:url(data:font/woff2;base64,' + btoa(b) + ")}";
      });
    })).then(function (list) { fontCss = list.join(''); return fontCss; });
  }
  $('[data-lbl-png]').addEventListener('click', function () {
    var btn = this; btn.disabled = true;
    fonts().then(function (css) {
      var svg = NobenLabel.trimView(state.last.svg).replace(/(<svg[^>]*>)/, '$1<defs><style>' + css + '</style></defs>');
      var w = Math.round(state.last.size.w / 25.4 * 300), h = Math.round(state.last.size.h / 25.4 * 300);
      svg = svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/, 'width="' + w + '" height="' + h + '"');
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
          c.toBlob(function (b) { b ? resolve(b) : reject(new Error('canvas')); }, 'image/png');
        };
        img.onerror = function () { reject(new Error('không vẽ được ảnh')); };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
      });
    }).then(function (blob) { download(blob, fileBase() + '-300dpi.png'); })
      .catch(function (err) { saveMsg.textContent = 'Không tạo được PNG: ' + err.message; saveMsg.classList.add('is-warn'); })
      .then(function () { btn.disabled = false; });
  });
})();
