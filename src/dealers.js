'use strict';
// Dealer (đại lý) directory: content/dai-ly.json, filled by scripts/import-dai-ly.js from a CSV export.
// Each dealer: { slug, name, province, district, address, phone, contact, note }.
const fs = require('fs');
const path = require('path');
const { slugify, fold } = require('./articles');

const FILE = path.join(__dirname, '..', 'content', 'dai-ly.json');

// The 34 provinces and cities after the 2025 administrative merger, north to south.
const PROVINCES = [
  'Hà Nội', 'Tuyên Quang', 'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên', 'Hải Phòng', 'Ninh Bình',
  'Quảng Ninh', 'Cao Bằng', 'Lạng Sơn', 'Lai Châu', 'Điện Biên', 'Sơn La', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh',
  'Quảng Trị', 'Huế', 'Đà Nẵng', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hòa', 'Đắk Lắk', 'Lâm Đồng', 'TP. Hồ Chí Minh',
  'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cần Thơ', 'An Giang', 'Cà Mau',
];

function load() {
  let raw = [];
  try { raw = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { raw = []; }
  const seen = new Set();
  return raw
    .filter((d) => d && d.name)
    .map((d) => {
      const base = d.slug || slugify(`${d.name} ${d.province || ''}`) || 'dai-ly';
      let slug = base;
      for (let i = 2; seen.has(slug); i++) slug = `${base}-${i}`;
      seen.add(slug);
      const province = String(d.province || '').trim();
      return {
        slug,
        name: String(d.name).trim(),
        province,
        provinceSlug: slugify(province),
        district: String(d.district || '').trim(),
        address: String(d.address || '').trim(),
        phone: String(d.phone || '').trim(),
        contact: String(d.contact || '').trim(),
        note: String(d.note || '').trim(),
        url: `/dai-ly/${slug}`,
        search: fold([d.name, d.province, d.district, d.address, d.contact, d.phone].join(' ')),
      };
    })
    .sort((a, b) => a.province.localeCompare(b.province, 'vi') || a.name.localeCompare(b.name, 'vi'));
}

const dealers = load();
const bySlug = Object.fromEntries(dealers.map((d) => [d.slug, d]));

// Provinces that have dealers, with counts, in the official north-to-south order.
function provinces() {
  const counts = {};
  for (const d of dealers) if (d.province) counts[d.province] = (counts[d.province] || 0) + 1;
  const order = (p) => { const i = PROVINCES.findIndex((x) => fold(x) === fold(p)); return i < 0 ? 999 : i; };
  return Object.keys(counts)
    .sort((a, b) => order(a) - order(b) || a.localeCompare(b, 'vi'))
    .map((name) => ({ name, slug: slugify(name), count: counts[name] }));
}
const provinceBySlug = (slug) => provinces().find((p) => p.slug === slug) || null;

function search({ q = '', province = '' } = {}) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  return dealers.filter((d) => (!province || d.provinceSlug === province) && words.every((w) => d.search.includes(w)));
}

const related = (d, n = 6) => dealers.filter((x) => x.provinceSlug === d.provinceSlug && x.slug !== d.slug).slice(0, n);

module.exports = { dealers, bySlug, provinces, provinceBySlug, search, related, PROVINCES };
