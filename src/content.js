'use strict';
// Loads the JSON content once at startup and builds lookup indexes.
// To edit products, posts or company details, change the files in /content and restart.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'content');
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));

const company = read('company');
const categories = read('categories');
const products = read('products');
const posts = read('posts');
const pages = read('pages');
const symptoms = read('symptoms');

const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
const categoryByOldSlug = Object.fromEntries(categories.map((c) => [c.old_slug, c]));
const symptomBySlug = Object.fromEntries(symptoms.map((s) => [s.slug, s]));
const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
const postBySlug = Object.fromEntries(posts.map((p) => [p.slug, p]));

// Plain-text search key without Vietnamese diacritics, so "phan trang" finds "phân trắng".
const fold = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

for (const p of products) {
  p.url = `/san-pham/${p.slug}`;
  p.categoryInfo = categoryBySlug[p.category];
  p.image = p.images[0] || null;
  p.search = fold([p.name, p.tagline, ...p.uses].join(' ').replace(/<[^>]+>/g, ' '));
}

const POST_SECTIONS = {
  'ky-thuat': { label: 'Kỹ thuật nuôi', list: '/ky-thuat-nuoi' },
  'gia-cong': { label: 'Gia công', list: '/gia-cong' },
  'cong-ty': { label: 'Tin công ty', list: '/tin-tuc' },
  'chung-nhan': { label: 'Chứng nhận', list: '/chung-nhan' },
  'tin-tuc': { label: 'Tin tức', list: '/tin-tuc' },
};
for (const p of posts) {
  p.url = `/bai-viet/${p.slug}`;
  p.section = POST_SECTIONS[p.category] || POST_SECTIONS['tin-tuc'];
  const d = new Date(p.date + 'T00:00:00+07:00');
  p.dateLabel = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Hand-picked products for the home page, one per common pond problem.
const FEATURED = ['prazi-s', 'ben-xid-3000', 'caphote', 'aqua-bac', 'oxy-99', 'sorbest', 'nb-brown-gay-mau-nuoc-mau-tra', 'aqualac-fs'];
const featured = FEATURED.map((s) => productBySlug[s]).filter(Boolean);

// Images that show the company itself (factory, team, certificates), taken from the old site's posts.
const gallery = {
  factory: (postBySlug['hinh-anh-cong-ty-noben'] || { gallery: [] }).gallery,
  team: (postBySlug['hinh-anh-cong-ty-tnhh-noben'] || { gallery: [] }).gallery,
  certificates: posts.filter((p) => p.category === 'chung-nhan').flatMap((p) => p.gallery),
};

function filterProducts({ category, symptom, q } = {}) {
  const needle = fold(q).trim();
  return products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!symptom || p.symptoms.includes(symptom)) &&
      (!needle || needle.split(/\s+/).every((w) => p.search.includes(w)))
  );
}

function relatedProducts(product, n = 4) {
  const score = (p) => p.symptoms.filter((s) => product.symptoms.includes(s)).length + (p.category === product.category ? 0.5 : 0);
  return products
    .filter((p) => p !== product)
    .map((p) => [score(p), p])
    .sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name))
    .slice(0, n)
    .map(([, p]) => p);
}

// Products mentioned by name inside an article, so readers can jump straight to them.
function productsMentioned(post, n = 4) {
  const text = fold(post.title + ' ' + post.body.replace(/<[^>]+>/g, ' '));
  return products.filter((p) => p.name.length > 3 && text.includes(fold(p.name))).slice(0, n);
}

module.exports = {
  company,
  categories,
  products,
  posts,
  pages,
  symptoms,
  featured,
  gallery,
  categoryBySlug,
  categoryByOldSlug,
  symptomBySlug,
  productBySlug,
  postBySlug,
  filterProducts,
  relatedProducts,
  productsMentioned,
  fold,
};
