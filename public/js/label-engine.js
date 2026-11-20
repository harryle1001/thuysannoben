/* Noben – bộ dàn trang nhãn theo tỷ lệ vàng, dùng logo chính thức (public/images/brand/logo-noben.svg) (dùng chung cho scripts/build-labels.js và /quan-tri/nhan).
   Đơn vị: mm. Gốc toạ độ = góc trên trái đường xén (trim); tràn lề nằm ở toạ độ âm và > W/H.
   Không phụ thuộc thư viện; cần một hàm đo chữ (canvas 2D) khi chạy. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NobenLabel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var PHI = (1 + Math.sqrt(5)) / 2;
  var NAVY = '#0b2347', INK = '#13213a', GOLD = '#ffc20e', MUTED = '#4a5b78', WARN = '#b4232c';
  var SANS = "'Be Vietnam Pro', sans-serif";
  var SERIF = "'Playfair Display', serif";
  // Tên họ phông cho từng độ đậm: Illustrator/Windows nhận tên họ "kiểu cũ" (… SemiBold), trình duyệt rơi về họ chính + font-weight.
  var FAMILY = {
    sans400: "'Be Vietnam Pro', sans-serif",
    sans600: "'Be Vietnam Pro SemiBold', 'Be Vietnam Pro', sans-serif",
    serif800: "'Playfair Display ExtraBold', 'Playfair Display', serif",
  };
  var DEFAULT_THEMES = {
    'sinh-hoc': { accent: '#1f7a4d', tint: '#dcefe4', ten: 'Chế phẩm sinh học' },
    'khoang-chat': { accent: '#0e6c8a', tint: '#d8ecf2', ten: 'Khoáng chất' },
    'thuc-an-bo-sung': { accent: '#9a5a00', tint: '#ffe6a0', ten: 'Thức ăn bổ sung' },
    'tri-benh': { accent: '#b4232c', tint: '#f6dcdc', ten: 'Trị bệnh · xử lý ao' },
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function n(v) { return (Math.round(v * 100) / 100).toString(); }
  function k5(v) { return (Math.round(v * 1e5) / 1e5).toString(); }
  // Văn bản thuần từ dữ liệu web: bỏ thẻ HTML, m<sup>3</sup> -> m³.
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function plain(s) {
    return String(s == null ? '' : s)
      .replace(/<sup>\s*(\d+)\s*<\/sup>/gi, function (_, d) { return d.split('').map(function (c) { return SUP[c]; }).join(''); })
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function list(v) {
    if (!v) return [];
    if (!Array.isArray(v)) v = String(v).split(/\n+/);
    return v.map(plain).filter(function (s) { return /[A-Za-z0-9À-ỹ]/.test(s); });
  }
  function mix(hex, other, t) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(other.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
    var g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
    var bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }
  function validHex(c) { return /^#[0-9a-f]{6}$/i.test(String(c || '')); }

  // ---------- Đo chữ ----------
  // measure(text, weight, family, size) -> độ rộng (mm khi size tính bằng mm). metrics(weight, family) -> {asc, desc} theo 1 đơn vị cỡ chữ.
  function canvasMeasurer(doc) {
    var ctx = (doc || document).createElement('canvas').getContext('2d');
    var cache = {};
    function font(weight, fam, px) { return weight + ' ' + px + 'px ' + (fam === 'serif' ? "'Playfair Display'" : "'Be Vietnam Pro'"); }
    return {
      width: function (text, weight, fam, size) {
        var k = weight + fam + '|' + text;
        if (!(k in cache)) { ctx.font = font(weight, fam, 100); cache[k] = ctx.measureText(text).width / 100; }
        return cache[k] * size;
      },
      metrics: function (weight, fam) {
        var k = 'm' + weight + fam;
        if (!(k in cache)) {
          // Hộp chữ SVG (getBBox) lấy theo phông thực dùng, kể cả phần phông tiếng Việt có ascent lớn hơn: đo bằng SVG cho khớp.
          var d = doc || document, NS = 'http://www.w3.org/2000/svg';
          try {
            var svg = d.createElementNS(NS, 'svg'), t = d.createElementNS(NS, 'text');
            svg.setAttribute('width', '10'); svg.setAttribute('height', '10');
            svg.style.position = 'absolute'; svg.style.left = '-9999px'; svg.style.top = '0';
            t.setAttribute('font-family', fam === 'serif' ? "'Playfair Display'" : "'Be Vietnam Pro'");
            t.setAttribute('font-weight', weight); t.setAttribute('font-size', '100'); t.setAttribute('y', '0');
            t.textContent = 'ẮỄÝgjpqỵ Ag';
            svg.appendChild(t); d.body.appendChild(svg);
            var b = t.getBBox();
            d.body.removeChild(svg);
            if (b.height > 0) cache[k] = { asc: -b.y / 100, desc: (b.y + b.height) / 100 };
          } catch (e) { /* rơi về canvas */ }
          if (!cache[k]) {
            ctx.font = font(weight, fam, 100);
            var m = ctx.measureText('ẮỄÝgjpqỵ');
            cache[k] = { asc: (m.fontBoundingBoxAscent || 95) / 100 * 1.25, desc: (m.fontBoundingBoxDescent || 25) / 100 };
          }
        }
        return cache[k];
      },
    };
  }

  // Ngắt dòng tham lam theo từ; từ dài hơn khung thì cắt theo ký tự.
  var BLANK = '\u2003\u2003\u2003\u2003\u2003';
  function wrap(M, text, weight, fam, size, width, indent) {
    var words = String(text).split(' ').filter(Boolean);
    var lines = [], cur = '';
    var room = function (i) { return width - (i > 0 ? indent || 0 : 0); };
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var test = cur ? cur + ' ' + w : w;
      if (M.width(test, weight, fam, size) <= room(lines.length)) { cur = test; continue; }
      if (cur) { lines.push(cur); cur = ''; }
      while (M.width(w, weight, fam, size) > room(lines.length)) {
        var k = w.length - 1;
        while (k > 1 && M.width(w.slice(0, k), weight, fam, size) > room(lines.length)) k--;
        lines.push(w.slice(0, k));
        w = w.slice(k);
      }
      cur = w;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------- Mã vạch EAN-13 (khi người dùng nhập đủ 13 số hợp lệ) ----------
  var EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  var EAN_PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  function eanValid(code) {
    if (!/^\d{13}$/.test(code)) return false;
    var s = 0;
    for (var i = 0; i < 12; i++) s += +code[i] * (i % 2 ? 3 : 1);
    return (10 - (s % 10)) % 10 === +code[12];
  }
  function eanBits(code) {
    var par = EAN_PAR[+code[0]], bits = '101';
    for (var i = 1; i <= 6; i++) {
      var l = EAN_L[+code[i]];
      if (par[i - 1] === 'G') l = l.split('').reverse().map(function (b) { return b === '1' ? '0' : '1'; }).join('');
      bits += l;
    }
    bits += '01010';
    for (var j = 7; j <= 12; j++) bits += EAN_L[+code[j]].split('').map(function (b) { return b === '1' ? '0' : '1'; }).join('');
    return bits + '101';
  }

  // ---------- Logo chính thức: lấy phần thân của logo-noben.svg, đổi id để không trùng ----------
  function prepareMark(svgText) {
    var body = String(svgText).replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/, '');
    return body
      .replace(/id="([^"]+)"/g, 'id="nb-$1"')
      .replace(/url\(#([^)]+)\)/g, 'url(#nb-$1)');
  }

  // ---------- Dàn trang ----------
  // size: { w, h, tran_le, le_an_toan, ten }  data: một mục trong brand/labels.json  opts: { mark, measure, spec }
  function layout(size, data, opts) {
    var M = opts.measure;
    var spec = opts.spec || {};
    var W = +size.w, H = +size.h, B = +(size.tran_le == null ? 3 : size.tran_le);
    var safe = Math.max(+(size.le_an_toan == null ? 4 : size.le_an_toan), W * 0.0438);
    var themes = spec.mau_nhom || DEFAULT_THEMES;
    var th = themes[data.nhom] || DEFAULT_THEMES[data.nhom] || DEFAULT_THEMES['khoang-chat'];
    var accent = validHex(data.mau_nhan) ? data.mau_nhan : th.accent;
    var tint = validHex(data.mau_nhan) ? mix(data.mau_nhan, '#ffffff', 0.82) : th.tint;
    var minBody = +(spec.co_chu_toi_thieu_mm || 1.6);
    var x0 = safe, x1 = W - safe, IW = x1 - x0;
    var out = { warnings: [] };
    var mS = M.metrics(400, 'sans'), mS6 = M.metrics(600, 'sans'), mF = M.metrics(800, 'serif');

    // Một khối chữ: trả về { lines:[{t,x,y}], h } với y là đường chân chữ.
    function block(text, o) {
      var lines = wrap(M, text, o.weight, o.fam, o.size, o.width, o.indent);
      var met = o.fam === 'serif' ? mF : o.weight >= 600 ? mS6 : mS;
      var lh = o.size * (o.lead || 1.32);
      return { lines: lines, size: o.size, lh: lh, asc: met.asc * o.size, desc: met.desc * o.size, h: met.asc * o.size + (lines.length - 1) * lh + met.desc * o.size };
    }
    function textEl(b, x, top, o) {
      var anchor = o.anchor || 'start';
      var fam = o.fam === 'serif' ? FAMILY.serif800 : o.weight >= 600 ? FAMILY.sans600 : FAMILY.sans400;
      var s = '<text font-family="' + fam + '" font-weight="' + o.weight + '" font-size="' + n(b.size) + '" fill="' + o.fill + '"' +
        (anchor !== 'start' ? ' text-anchor="' + anchor + '"' : '') + (o.ls ? ' letter-spacing="' + n(o.ls) + '"' : '') + '>';
      b.lines.forEach(function (t, i) {
        var lx = x + (i > 0 && o.indent ? o.indent : 0);
        s += '<tspan x="' + n(lx) + '" y="' + n(top + b.asc + i * b.lh) + '">' + esc(t) + '</tspan>';
      });
      return s + '</text>';
    }
    function khung(x, y, w, h) { return ' data-khung="' + [x, y, w, h].map(n).join(' ') + '"'; }

    // --- Dải thương hiệu: cao H/φ³, vạch vàng = dải/φ⁶ ---
    var bandH = H / Math.pow(PHI, 3);
    var stripe = bandH / Math.pow(PHI, 6);
    var markS = Math.min(bandH * 0.72, bandH - 2 * safe * 0.6);
    var markX = x0, markY = (bandH - markS) / 2;
    var wordSize = bandH * 0.266;
    var isoSize = Math.max(bandH * 0.057, minBody * 0.95);
    var isoW = Math.max(M.width('ISO 9001:2015', 600, 'sans', isoSize), M.width('Từ năm 2002', 400, 'sans', isoSize));
    var wordX = markX + markS + markS * 0.1;
    var wordRoom = x1 - wordX - isoW - markS * 0.12;
    // Chữ thương hiệu như đầu trang web: "Noben" (Playfair Display 800) + "THUỐC THỦY SẢN".
    var SUBLINE = 'THUỐC THỦY SẢN';
    var subLs = 0.16;
    var subW = function (sz) { return M.width(SUBLINE, 600, 'sans', sz) + SUBLINE.length * sz * subLs; };
    var showIso = wordRoom > M.width('Noben', 800, 'serif', bandH * 0.15);
    if (!showIso) wordRoom = x1 - wordX;
    var wordW = M.width('Noben', 800, 'serif', wordSize);
    if (wordW > wordRoom) { wordSize *= wordRoom / wordW; wordW = wordRoom; }
    var subSize = Math.max(wordSize * 0.25, minBody * 0.9);
    while (subSize > minBody * 0.8 && subW(subSize) > wordRoom) subSize *= 0.95;
    var showSub = subW(subSize) <= wordRoom;
    var wordBase = bandH * (showSub ? 0.5 : 0.56);
    var subBase = wordBase + wordSize * 0.2 + subSize * 1.05;

    // --- Khối pháp lý dưới cùng ---
    var co = spec.nha_san_xuat || {};
    var pl = data.phap_ly || {};
    var legalSize = Math.max(W * 0.0185, minBody);
    var bcW = Math.min(Math.max(W * 0.3, 22), 38, IW * 0.42);
    var bcH = bcW * 0.6;
    var legalW = IW - bcW - legalSize * 1.5;
    var legalLines = [];
    if (data.bao_quan) legalLines.push({ t: 'Bảo quản: ' + plain(data.bao_quan), w: 400, c: INK });
    // Ô để trống (in/đóng dấu theo lô): giữ một khoảng em-space, SVG không gộp ký tự này.
    var val = function (v, last) { v = plain(v); return v && v !== '[ĐIỀN]' ? v : (last ? '' : BLANK); };
    legalLines.push({ t: 'Số ĐK/MSLH: ' + val(pl.so_dang_ky) + ' · KL tịnh: ' + val(pl.khoi_luong_tinh, true), w: 400, c: INK });
    legalLines.push({ t: 'NSX: ' + val(pl.nsx) + ' · HSD: ' + val(pl.hsd, true), w: 400, c: INK });
    if (data.quy_cach) legalLines.push({ t: 'Quy cách: ' + plain(data.quy_cach), w: 400, c: INK });
    legalLines.push({ t: plain(data.luu_y || 'Đọc kỹ hướng dẫn sử dụng trước khi dùng.'), w: 600, c: WARN });
    var footLines = [
      { t: 'Sản xuất tại: ' + plain(co.ten || 'CÔNG TY TNHH NOBEN'), w: 600, c: NAVY },
      { t: plain(co.dia_chi || ''), w: 400, c: MUTED },
      { t: 'Hotline ' + plain(co.hotline || '') + (co.web ? ' · ' + plain(co.web) : ''), w: 600, c: NAVY },
    ].filter(function (l) { return l.t; });

    function legalBlock(sz) {
      var gap = sz * 0.35, blocks = [], hh = 0;
      legalLines.forEach(function (l, i) {
        var b = block(l.t, { size: sz, weight: l.w, fam: 'sans', width: legalW, lead: 1.25 });
        b.o = l; blocks.push(b); hh += b.h + (i ? gap : 0);
      });
      var fb = [], fh = 0;
      footLines.forEach(function (l, i) {
        var b = block(l.t, { size: sz, weight: l.w, fam: 'sans', width: IW, lead: 1.25 });
        b.o = l; fb.push(b); fh += b.h + (i ? gap * 0.6 : 0);
      });
      return { sz: sz, gap: gap, blocks: blocks, h: hh, foot: fb, fh: fh };
    }
    var LB = legalBlock(legalSize);
    var footPad = Math.max(LB.sz * 0.9, 1.6);
    var footH = Math.max(H / Math.pow(PHI, 5), LB.fh + footPad + safe);
    var footTop = H - footH;
    var legalH = Math.max(LB.h, bcH);
    var legalTop = footTop - footPad - legalH;

    // --- Phần giữa: tên, phụ đề, nhãn phụ và nội dung ---
    var heroTop = bandH + stripe;
    var goldenTop = H / PHI; // nội dung bắt đầu ở H/φ như mẫu G7
    var name = plain(data.ten || '');
    var tag = plain(data.phu_de || '');
    var chips = list(data.nhan_phu).slice(0, 3);
    var groupName = plain(data.nhom_hien_thi || th.ten || '');

    function hero(level) {
      // level 0: rộng rãi như mẫu; 1: gọn; 2: tối giản (bỏ nhãn phụ).
      var maxName = [H * 0.165, H * 0.09, H * 0.06][level];
      var minName = Math.max(minBody * 2.2, H * 0.03);
      var nameB = null, sz = maxName;
      for (; sz >= minName; sz *= 0.96) {
        nameB = block(name, { size: sz, weight: 800, fam: 'serif', width: IW, lead: 1.05 });
        if (nameB.lines.length <= (sz > H * 0.07 ? 2 : 3) && nameB.lines.every(function (t) { return M.width(t, 800, 'serif', sz) <= IW; })) break;
      }
      if (sz < minName) nameB = block(name, { size: minName, weight: 800, fam: 'serif', width: IW, lead: 1.05 });
      var tagSize = Math.max([W * 0.03, W * 0.027, W * 0.024][level], minBody * 1.1);
      var tagB = tag ? block(tag, { size: tagSize, weight: 600, fam: 'sans', width: IW * (level ? 1 : 0.92), lead: 1.3 }) : null;
      var grpSize = Math.max(W * 0.02, minBody);
      var grpText = groupName.toUpperCase();
      while (groupName && grpSize > minBody && M.width(grpText, 600, 'sans', grpSize) + grpText.length * grpSize * 0.12 > IW) grpSize *= 0.95;
      var grpB = groupName ? block(grpText, { size: grpSize, weight: 600, fam: 'sans', width: 9e9, lead: 1 }) : null;
      var chipH = W * 0.063 * (level ? 0.85 : 1), chipFont = Math.max(chipH * 0.42, minBody);
      var showChips = level < 2 && chips.length > 0;
      var g1 = nameB.size * 0.18, g2 = tagSize * 0.9;
      var h = (grpB ? grpB.h + g1 * 1.4 : 0) + nameB.h + (tagB ? g1 + tagB.h : 0) + (showChips ? g2 + chipH : 0);
      return { level: level, nameB: nameB, tagB: tagB, grpB: grpB, chipH: chipH, chipFont: chipFont, showChips: showChips, g1: g1, g2: g2, h: h };
    }

    var uses = list(data.cong_dung), dose = list(data.huong_dan), comp = list(data.thanh_phan);
    var heads = { cong_dung: 'CÔNG DỤNG', thanh_phan: 'THÀNH PHẦN', huong_dan: 'HƯỚNG DẪN SỬ DỤNG' };
    var sections = [];
    if (uses.length) sections.push({ id: 'cong-dung', head: heads.cong_dung, items: uses, bullet: true });
    if (comp.length) sections.push({ id: 'thanh-phan', head: heads.thanh_phan, items: comp, bullet: true });
    if (dose.length) sections.push({ id: 'huong-dan', head: heads.huong_dan, items: dose, bullet: true });
    var chars = function (s) { return s.items.join(' ').length + 40; };

    // Xếp các mục vào 2 cột (thứ tự giữ nguyên), cột rộng theo tỷ lệ vàng hoặc chia đôi.
    function columns(sz) {
      var gutter = Math.max(sz * 2.2, W * 0.03);
      var headSize = sz * 1.04;
      var best = null;
      var ratios = [1 / PHI, 0.5, 1 - 1 / PHI];
      var splits = [];
      for (var k = 1; k < sections.length; k++) splits.push(k);
      if (sections.length === 1) splits = [1];
      splits.forEach(function (k) {
        ratios.forEach(function (r) {
          var cols = sections.length === 1 ? [sections] : [sections.slice(0, k), sections.slice(k)];
          var widths = cols.length === 1 ? [IW] : [(IW - gutter) * r, (IW - gutter) * (1 - r)];
          var hs = cols.map(function (secs, ci) {
            var cw = widths[ci], h = 0, out2 = [];
            secs.forEach(function (sec, si) {
              var hb = block(sec.head, { size: headSize, weight: 600, fam: 'sans', width: cw, lead: 1.2 });
              var y = h + (si ? sz * 1.1 : 0);
              var items = [];
              var iy = y + hb.h + sz * 0.45;
              var bulletW = M.width('• ', 400, 'sans', sz);
              sec.items.forEach(function (it, ii) {
                var b = block(it, { size: sz, weight: 400, fam: 'sans', width: cw - bulletW, lead: 1.3 });
                items.push({ b: b, y: iy });
                iy += b.h + (ii < sec.items.length - 1 ? sz * 0.38 : 0);
              });
              out2.push({ sec: sec, hb: hb, y: y, items: items, bulletW: bulletW, bottom: iy });
              h = iy;
            });
            return { h: h, w: cw, secs: out2 };
          });
          var maxH = Math.max.apply(null, hs.map(function (c) { return c.h; }));
          if (!best || maxH < best.h - 0.01) best = { h: maxH, cols: hs, widths: widths, gutter: gutter, headSize: headSize };
        });
      });
      return best || { h: 0, cols: [], widths: [], gutter: gutter, headSize: headSize };
    }

    var bodyMax = Math.max(W * 0.024, 2.1, minBody);
    var plan = null;
    // Ưu tiên cỡ chữ nội dung (dễ đọc liều dùng) hơn cỡ tên: thu gọn phần tên trước, rồi mới giảm cỡ chữ.
    var stages = [[0, 1], [1, 0.92], [2, 0.82], [2, 0]];
    var gapAbove = function (sz) { return sz * 1.6; };
    outer: for (var si = 0; si < stages.length; si++) {
      var hr = hero(stages[si][0]);
      var floor = Math.max(bodyMax * stages[si][1], minBody);
      for (var sz = bodyMax; sz >= floor - 1e-6; sz = sz > floor && sz * 0.97 < floor ? floor : sz * 0.97) {
        var cols = columns(sz);
        var ruleGap = gapAbove(sz);
        var cTop = stages[si][0] === 0 ? Math.max(goldenTop, heroTop + hr.h + ruleGap * 1.4) : heroTop + ruleGap * 0.8 + hr.h + ruleGap * 1.4;
        if (cTop + ruleGap + cols.h <= legalTop - sz * 1.2) { plan = { hero: hr, cols: cols, sz: sz, cTop: cTop }; break outer; }
        if (sz === floor) break;
      }
    }
    if (!plan) {
      // Cứu cánh cuối: xuống dưới cỡ tối thiểu (tới 1,1 mm ≈ 3 pt) thay vì để chữ tràn; báo để chọn khổ lớn hơn.
      var hr2 = hero(2);
      for (var z = minBody * 0.97; z >= 1.1; z *= 0.97) {
        var c2 = columns(z), t2 = heroTop + gapAbove(z) * 0.8 + hr2.h + gapAbove(z) * 1.4;
        if (t2 + gapAbove(z) + c2.h <= legalTop - z * 1.2) { plan = { hero: hr2, cols: c2, sz: z, cTop: t2, small: true }; break; }
      }
      if (!plan) plan = { hero: hr2, cols: columns(1.1), sz: 1.1, cTop: heroTop + hr2.h + 4, overflow: true };
      out.warnings.push((plan.overflow ? 'TRÀN: ' : 'Cỡ chữ dưới mức tối thiểu: ') + 'nội dung quá dài cho khổ ' + W + '×' + H + ' mm, nên dùng khổ lớn hơn hoặc rút gọn chữ.');
    }
    out.fit = { body_mm: +plan.sz.toFixed(2), body_pt: +(plan.sz / 0.3528).toFixed(1), hero: plan.hero.level, overflow: Boolean(plan.overflow), below_min: Boolean(plan.small) };

    // ---------- Xuất SVG ----------
    var mark = opts.mark ? prepareMark(opts.mark) : '';
    var VB = [-B, -B, W + 2 * B, H + 2 * B];
    var L = function (id, label, extra) { return '<g id="' + id + '" inkscape:groupmode="layer" inkscape:label="' + esc(label) + '"' + (extra || '') + '>'; };
    var s = [];
    s.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" ' +
      'width="' + n(VB[2]) + 'mm" height="' + n(VB[3]) + 'mm" viewBox="' + VB.map(n).join(' ') + '" data-trim="' + n(W) + ' ' + n(H) + '" data-tran-le="' + n(B) + '" data-an-toan="' + n(safe) + '">');
    s.push('<title>' + esc('Nhãn ' + name + ' – ' + (size.ten || '') + ' ' + n(W) + '×' + n(H) + ' mm') + '</title>');
    s.push('<desc>' + esc('Noben · nhãn chỉnh sửa được. Kích thước xén ' + n(W) + '×' + n(H) + ' mm, tràn lề ' + n(B) + ' mm mỗi cạnh, lề an toàn ' + n(safe) + ' mm. Phông: Be Vietnam Pro 400/600, Playfair Display 800. Sinh bởi scripts/build-labels.js.') + '</desc>');
    s.push('<defs><clipPath id="nb-trang-giua"><rect x="0" y="' + n(heroTop) + '" width="' + n(W) + '" height="' + n(footTop - heroTop) + '"/></clipPath></defs>');

    // nen
    var wmS = Math.min(IW * 0.7, (legalTop - plan.cTop) * 0.95);
    s.push(L('nen', 'nen'));
    s.push('<rect x="' + n(-B) + '" y="' + n(-B) + '" width="' + n(W + 2 * B) + '" height="' + n(H + 2 * B) + '" fill="#ffffff"/>');
    s.push('<rect x="' + n(-B) + '" y="' + n(footTop) + '" width="' + n(W + 2 * B) + '" height="' + n(footH + B) + '" fill="#f4f7fb"/>');
    if (mark && wmS > 10) s.push('<g opacity="0.035" clip-path="url(#nb-trang-giua)"><use href="#nb-mark-art" xlink:href="#nb-mark-art" transform="translate(' + n(W / 2 - wmS / 2) + ' ' + n(plan.cTop + (legalTop - plan.cTop - wmS) / 2) + ') scale(' + k5(wmS / 512) + ')"/></g>');
    s.push('</g>');

    // dai-thuong-hieu
    s.push(L('dai-thuong-hieu', 'dai-thuong-hieu', khung(wordX, 0, x1 - wordX, bandH)));
    s.push('<rect x="' + n(-B) + '" y="' + n(-B) + '" width="' + n(W + 2 * B) + '" height="' + n(bandH + B) + '" fill="' + NAVY + '"/>');
    s.push('<rect x="' + n(-B) + '" y="' + n(bandH) + '" width="' + n(W + 2 * B) + '" height="' + n(stripe) + '" fill="' + GOLD + '"/>');
    s.push('<text font-family="' + FAMILY.serif800 + '" font-weight="800" font-size="' + n(wordSize) + '" fill="#ffffff" x="' + n(wordX) + '" y="' + n(wordBase) + '">Noben</text>');
    if (showSub) s.push('<text font-family="' + FAMILY.sans600 + '" font-weight="600" font-size="' + n(subSize) + '" fill="#a9b9d6" letter-spacing="' + n(subSize * subLs) + '" x="' + n(wordX) + '" y="' + n(subBase) + '">' + SUBLINE + '</text>');
    if (showIso) {
      s.push('<text font-family="' + FAMILY.sans600 + '" font-weight="600" font-size="' + n(isoSize) + '" fill="' + GOLD + '" text-anchor="end" x="' + n(x1) + '" y="' + n(bandH * 0.48) + '">ISO 9001:2015</text>');
      s.push('<text font-family="' + FAMILY.sans400 + '" font-weight="400" font-size="' + n(isoSize) + '" fill="#c7d3e6" text-anchor="end" x="' + n(x1) + '" y="' + n(bandH * 0.48 + isoSize * 1.5) + '">Từ năm 2002</text>');
    }
    s.push('</g>');

    // logo
    s.push(L('logo', 'logo'));
    if (mark) s.push('<g transform="translate(' + n(markX) + ' ' + n(markY) + ') scale(' + k5(markS / 512) + ')"><g id="nb-mark-art">' + mark + '</g></g>');
    s.push('</g>');

    // ten-san-pham
    var hr = plan.hero;
    var heroBox = [x0, heroTop, IW, plan.cTop - heroTop];
    var hy = heroTop + (plan.cTop - heroTop - hr.h) / 2 - gapAbove(plan.sz) * 0.5;
    hy = Math.max(hy, heroTop + gapAbove(plan.sz) * 0.6);
    s.push(L('ten-san-pham', 'ten-san-pham', khung.apply(null, heroBox)));
    if (hr.grpB) {
      s.push(textEl(hr.grpB, W / 2, hy, { weight: 600, fam: 'sans', fill: accent, anchor: 'middle', ls: hr.grpB.size * 0.12 }));
      hy += hr.grpB.h + hr.g1 * 1.4;
    }
    s.push(textEl(hr.nameB, W / 2, hy, { weight: 800, fam: 'serif', fill: NAVY, anchor: 'middle' }));
    hy += hr.nameB.h;
    if (hr.tagB) { hy += hr.g1; s.push(textEl(hr.tagB, W / 2, hy, { weight: 600, fam: 'sans', fill: accent, anchor: 'middle' })); hy += hr.tagB.h; }
    if (hr.showChips) {
      hy += hr.g2;
      var gapC = IW * 0.03, cw = (IW - gapC * (chips.length - 1)) / chips.length;
      if (chips.length < 3) cw = Math.min(cw, (IW - gapC * 2) / 3);
      var totalW = cw * chips.length + gapC * (chips.length - 1);
      var cx = W / 2 - totalW / 2;
      chips.forEach(function (c, i) {
        var f = hr.chipFont;
        while (f > minBody && M.width(c, 600, 'sans', f) > cw - hr.chipH * 0.6) f *= 0.95;
        var cb = block(c, { size: f, weight: 600, fam: 'sans', width: 9e9, lead: 1 });
        var x = cx + i * (cw + gapC);
        s.push('<rect x="' + n(x) + '" y="' + n(hy) + '" width="' + n(cw) + '" height="' + n(hr.chipH) + '" rx="' + n(hr.chipH / 2) + '" fill="' + tint + '"/>');
        s.push(textEl(cb, x + cw / 2, hy + (hr.chipH - cb.h) / 2, { weight: 600, fam: 'sans', fill: NAVY, anchor: 'middle' }));
      });
    }
    s.push('</g>');

    // Nội dung: một lớp cho mỗi mục.
    var C = plan.cols, sz = plan.sz;
    var ruleY = plan.cTop - gapAbove(sz) * 0.7;
    var colX = [x0, x0 + (C.widths[0] || IW) + C.gutter];
    var secOut = {};
    C.cols.forEach(function (col, ci) {
      col.secs.forEach(function (cs) {
        var x = colX[ci], top = plan.cTop + cs.y;
        var parts = [];
        parts.push(textEl(cs.hb, x, top, { weight: 600, fam: 'sans', fill: accent }));
        cs.items.forEach(function (it) {
          var t = plan.cTop + it.y;
          parts.push('<text font-family="' + FAMILY.sans400 + '" font-weight="400" font-size="' + n(sz) + '" fill="' + accent + '" x="' + n(x) + '" y="' + n(t + it.b.asc) + '">•</text>');
          parts.push(textEl(it.b, x + cs.bulletW, t, { weight: 400, fam: 'sans', fill: INK }));
        });
        secOut[cs.sec.id] = { svg: parts.join(''), box: [x, top, col.w, cs.bottom - cs.y] };
      });
    });
    ['cong-dung', 'huong-dan', 'thanh-phan'].forEach(function (id) {
      var o = secOut[id];
      s.push(L(id, id, o ? khung.apply(null, o.box) : ''));
      if (id === 'cong-dung') s.push('<line x1="' + n(x0) + '" y1="' + n(ruleY) + '" x2="' + n(x1) + '" y2="' + n(ruleY) + '" stroke="' + NAVY + '" stroke-opacity="0.15" stroke-width="0.2"/>');
      if (o) s.push(o.svg);
      s.push('</g>');
    });

    // phap-ly
    s.push(L('phap-ly', 'phap-ly', khung(x0, legalTop, IW, H - safe - legalTop)));
    var ly = legalTop + (legalH - LB.h) / 2;
    LB.blocks.forEach(function (b, i) {
      if (i) ly += LB.gap;
      s.push(textEl(b, x0, ly, { weight: b.o.w, fam: 'sans', fill: b.o.c }));
      ly += b.h;
    });
    var fy = footTop + footPad * 0.8;
    LB.foot.forEach(function (b, i) {
      if (i) fy += LB.gap * 0.6;
      s.push(textEl(b, x0, fy, { weight: b.o.w, fam: 'sans', fill: b.o.c }));
      fy += b.h;
    });
    s.push('</g>');

    // ma-vach
    var bcX = x1 - bcW, bcY = legalTop + (legalH - bcH) / 2;
    s.push(L('ma-vach', 'ma-vach', khung(bcX, bcY, bcW, bcH)));
    var code = String(pl.ma_vach || '').replace(/\s/g, '');
    if (eanValid(code)) {
      var bits = eanBits(code), mod = bcW / (bits.length + 18), qx = bcX + mod * 11;
      var digitSize = Math.min(mod * 9, bcH * 0.18);
      var barH = bcH - digitSize * 1.25;
      s.push('<rect x="' + n(bcX) + '" y="' + n(bcY) + '" width="' + n(bcW) + '" height="' + n(bcH) + '" fill="#ffffff"/>');
      var d = '';
      for (var i = 0; i < bits.length; i++) {
        if (bits[i] !== '1') continue;
        var j = i; while (j + 1 < bits.length && bits[j + 1] === '1') j++;
        var guard = i < 3 || (i >= 45 && i < 50) || i >= 92;
        d += 'M' + n(qx + i * mod) + ' ' + n(bcY) + 'h' + n((j - i + 1) * mod) + 'v' + n(barH + (guard ? digitSize * 0.6 : 0)) + 'h' + n(-(j - i + 1) * mod) + 'z';
        i = j;
      }
      s.push('<path d="' + d + '" fill="#000000"/>');
      var dy = bcY + bcH - digitSize * 0.1;
      var dg = function (t, x, anchor) { return '<text font-family="' + FAMILY.sans400 + '" font-weight="400" font-size="' + n(digitSize) + '" fill="#000000" text-anchor="' + anchor + '" x="' + n(x) + '" y="' + n(dy) + '">' + t + '</text>'; };
      s.push(dg(code[0], qx - mod * 2, 'end') + dg(code.slice(1, 7), qx + mod * 24, 'middle') + dg(code.slice(7), qx + mod * 71, 'middle'));
    }
    // Chưa có mã vạch: để trống vùng này.
    s.push('</g>');

    // vung-an-toan (ẩn): đường xén, tràn lề, vùng an toàn
    s.push(L('vung-an-toan', 'vung-an-toan (ẩn khi in)', ' display="none"'));
    s.push('<rect x="' + n(-B) + '" y="' + n(-B) + '" width="' + n(W + 2 * B) + '" height="' + n(H + 2 * B) + '" fill="none" stroke="#e6007e" stroke-width="0.2"/>');
    s.push('<rect x="0" y="0" width="' + n(W) + '" height="' + n(H) + '" fill="none" stroke="#00a0e9" stroke-width="0.25"/>');
    s.push('<rect x="' + n(safe) + '" y="' + n(safe) + '" width="' + n(W - 2 * safe) + '" height="' + n(H - 2 * safe) + '" fill="none" stroke="#2fb34a" stroke-width="0.2" stroke-dasharray="1 1"/>');
    s.push('<line x1="0" y1="' + n(goldenTop) + '" x2="' + n(W) + '" y2="' + n(goldenTop) + '" stroke="#ffc20e" stroke-width="0.2" stroke-dasharray="2 1"/>');
    s.push('</g>');
    s.push('</svg>');
    out.svg = s.join('\n');
    out.size = { w: W, h: H, bleed: B, safe: safe };
    return out;
  }

  // Bản xem trước chỉ trong đường xén (bỏ tràn lề).
  function trimView(svg) {
    var m = /data-trim="([\d.]+) ([\d.]+)"/.exec(svg);
    if (!m) return svg;
    return svg.replace(/width="[\d.]+mm" height="[\d.]+mm" viewBox="[^"]+"/, 'width="' + m[1] + 'mm" height="' + m[2] + 'mm" viewBox="0 0 ' + m[1] + ' ' + m[2] + '"');
  }

  return { layout: layout, canvasMeasurer: canvasMeasurer, plain: plain, list: list, eanValid: eanValid, prepareMark: prepareMark, trimView: trimView, PHI: PHI, THEMES: DEFAULT_THEMES };
});
