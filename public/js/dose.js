/* Noben dose parser: reads the dose lines printed on product labels ("Dùng 1 lít/3.000m3 nước",
   "Trộn 5g/kg thức ăn"...) and scales them to a pond. Shared by /tinh-lieu (browser) and scripts/test-dose.js (Node). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NobenDose = factory();
})(this, function () {
  'use strict';
  var NUM = '\\d+(?:[.,]\\d+)*';
  var RANGE = '(' + NUM + ')(?:\\s*[-–]\\s*(' + NUM + '))?';
  var UNIT = '(kg|mg|ml|gram|gr|g|lít|lit|l)';
  // amount unit [optional product name] / water volume
  var WATER = new RegExp(RANGE + '\\s*' + UNIT + '(?:\\s+[A-ZĐ][^/\\d]{0,24})?\\s*\\/\\s*' + RANGE + '\\s*(m3|m³|m2|m²|ha(?![a-zà-ỹ]))(?!\\d)', 'gi');
  // amount unit / kg feed
  var FEED = new RegExp(RANGE + '\\s*' + UNIT + '\\s*\\/\\s*(?:1\\s*)?kg\\s*(?:thức|thưc|thuc|TĂ)', 'gi');
  // Lines that look like a dose but may fail to parse (used for the coverage rate).
  var CANDIDATE = /\/\s*[\d.,\s–-]*\s*(m3|m³|m2|m²|ha)(?![a-z])|\/\s*kg\s*(thức|thưc|thuc|TĂ)/i;
  var BREW_START = /(lấy|ngâm)\s+1\b.*\+.*(như sau|với liều)/i;

  function strip(html) {
    return String(html || '').replace(/<sup>\s*3\s*<\/sup>/gi, '3 ').replace(/<sup>\s*2\s*<\/sup>/gi, '2 ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // Vietnamese labels write 1.000 / 5.000 for thousands and 0.5 or 0,5 for decimals.
  function num(s) {
    s = String(s);
    if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ''));
    return Number(s.replace(',', '.'));
  }
  function unitOf(u) {
    u = u.toLowerCase();
    if (u === 'kg') return { base: 'g', f: 1000 };
    if (u === 'mg') return { base: 'mg', f: 1 };
    if (u === 'ml') return { base: 'ml', f: 1 };
    if (u === 'g' || u === 'gr' || u === 'gram') return { base: 'g', f: 1 };
    return { base: 'ml', f: 1000 }; // lít, lit, l
  }
  function per(u) {
    u = u.toLowerCase();
    if (u === 'ha') return { kind: 'area', f: 10000 };
    if (u === 'm2' || u === 'm²') return { kind: 'area', f: 1 };
    return { kind: 'volume', f: 1 };
  }

  function parseLine(raw) {
    var text = strip(raw);
    var doses = [];
    var m;
    WATER.lastIndex = 0;
    while ((m = WATER.exec(text))) {
      var u = unitOf(m[3]), p = per(m[6]);
      var a1 = num(m[1]) * u.f, a2 = (m[2] ? num(m[2]) : num(m[1])) * u.f;
      var d1 = num(m[4]) * p.f, d2 = (m[5] ? num(m[5]) : num(m[4])) * p.f;
      if (!(a1 > 0 && a2 > 0 && d1 > 0 && d2 > 0)) continue;
      // Rate per 1 m3 (or 1 m2): low = smallest amount / largest volume.
      doses.push({ type: p.kind, base: u.base, min: Math.min(a1, a2) / Math.max(d1, d2), max: Math.max(a1, a2) / Math.min(d1, d2), match: m[0] });
    }
    FEED.lastIndex = 0;
    while ((m = FEED.exec(text))) {
      var fu = unitOf(m[3]);
      var b1 = num(m[1]) * fu.f, b2 = (m[2] ? num(m[2]) : num(m[1])) * fu.f;
      if (!(b1 > 0 && b2 > 0)) continue;
      doses.push({ type: 'feed', base: fu.base, min: Math.min(b1, b2), max: Math.max(b1, b2), match: m[0] });
    }
    var label = '';
    var colon = text.indexOf(':');
    if (colon > 0 && colon < 90) label = text.slice(0, colon).trim();
    return { text: text, label: label, candidate: CANDIDATE.test(text) || doses.length > 0, doses: doses };
  }

  // Parses every dose line of a product. Liquid doses that follow a brewing step ("ủ ... rồi đem ra
  // sử dụng với liều lượng như sau") are litres of the brewed solution, not of the product itself.
  function parseProduct(lines) {
    var brew = false;
    return (lines || []).map(function (l) {
      var r = parseLine(l);
      if (BREW_START.test(r.text) && !r.doses.length) brew = true;
      else if (/^(nếu|sử dụng) (tạt )?trực tiếp/i.test(r.text)) brew = false;
      r.brew = brew && r.doses.some(function (d) { return d.base === 'ml' && d.type !== 'feed'; });
      return r;
    });
  }

  function round(v) {
    if (v >= 100) return Math.round(v);
    if (v >= 10) return Math.round(v * 10) / 10;
    return Math.round(v * 100) / 100;
  }
  function fmtNum(v) {
    return String(round(v)).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  // Amount in base unit (g, ml, mg) -> readable string with kg / lít when large.
  function fmtAmount(v, base) {
    if (base === 'g') return v >= 1000 ? fmtNum(v / 1000) + ' kg' : fmtNum(v) + ' g';
    if (base === 'ml') return v >= 1000 ? fmtNum(v / 1000) + ' lít' : fmtNum(v) + ' ml';
    return v >= 1000 ? fmtNum(v / 1000) + ' g' : fmtNum(v) + ' mg';
  }
  function fmtRange(lo, hi, base) {
    if (Math.abs(hi - lo) / Math.max(hi, 1e-9) < 0.005) return fmtAmount(lo, base);
    return fmtAmount(lo, base) + ' – ' + fmtAmount(hi, base);
  }

  // pond: { volume (m3), area (m2), feed (kg/day) }. Returns null when the needed input is missing.
  function compute(dose, pond) {
    var q = dose.type === 'feed' ? pond.feed : dose.type === 'area' ? pond.area : pond.volume;
    if (!(q > 0)) return null;
    return fmtRange(dose.min * q, dose.max * q, dose.base);
  }

  return { strip: strip, num: num, parseLine: parseLine, parseProduct: parseProduct, compute: compute, fmtNum: fmtNum };
});
