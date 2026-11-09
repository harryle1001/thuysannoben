'use strict';
// Loads the JSON content once at startup and builds lookup indexes.
// Edits made with the on-page editor are stored in data/overrides.json and applied on top of /content.
const fs = require('fs');
const path = require('path');
const { sanitizeHtml, sanitizeText } = require('./sanitize');

const dir = path.join(__dirname, '..', 'content');
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));
const overridesFile = path.join(__dirname, '..', 'data', 'overrides.json');

const company = read('company');
const categories = read('categories');
const products = read('products');
const posts = read('posts');
const pages = read('pages');
const symptoms = read('symptoms');
const texts = {};

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

function refreshProduct(p) {
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

/* ---------- On-page editing ----------
   A key names one editable value, for example:
     company.hotline            company.values.2
     products.prazi-s.tagline   products.prazi-s.uses.0
     posts.<slug>.body          pages.<slug>.body
     categories.<slug>.blurb    texts.home-hero-title
   "rich" values keep simple formatting (bold, lists, superscript); "text" values are plain. */
const FIELDS = {
  company: { hotline: 'text', address: 'text', email: 'text', vision: 'text', mission: 'text', 'phones.*': 'text', 'values.*': 'text', 'overview.*': 'text' },
  products: { name: 'text', tagline: 'text', packaging: 'text', 'uses.*': 'rich', 'dose.*': 'rich', 'composition.*': 'rich' },
  posts: { title: 'text', excerpt: 'text', body: 'rich' },
  categories: { name: 'text', blurb: 'text' },
  pages: { title: 'text', body: 'rich' },
};
const COLLECTIONS = { products: productBySlug, posts: postBySlug, categories: categoryBySlug, pages };

// Resolve a key to { obj, prop, type } or null when it is not an editable field.
function resolve(key) {
  if (typeof key !== 'string' || key.length > 200) return null;
  const parts = key.split('.');
  if (parts[0] === 'texts') return parts.length === 2 && /^[a-z0-9-]+$/.test(parts[1]) ? { obj: texts, prop: parts[1], type: 'text', create: true } : null;
  if (parts[0] === 'company') {
    const [, field, idx] = parts;
    const spec = FIELDS.company[idx === undefined ? field : `${field}.*`];
    if (!spec) return null;
    if (idx === undefined) return { obj: company, prop: field, type: spec };
    const arr = company[field];
    const i = Number(idx);
    return Array.isArray(arr) && Number.isInteger(i) && i >= 0 && i < arr.length ? { obj: arr, prop: i, type: spec } : null;
  }
  const coll = COLLECTIONS[parts[0]];
  if (!coll) return null;
  const [, slug, field, idx] = parts;
  const item = Object.prototype.hasOwnProperty.call(coll, slug) ? coll[slug] : null;
  if (!item) return null;
  const spec = FIELDS[parts[0]][idx === undefined ? field : `${field}.*`];
  if (!spec) return null;
  if (idx === undefined) return { obj: item, prop: field, type: spec, item, kind: parts[0] };
  const arr = item[field];
  const i = Number(idx);
  return Array.isArray(arr) && Number.isInteger(i) && i >= 0 && i < arr.length ? { obj: arr, prop: i, type: spec, item, kind: parts[0] } : null;
}

function clean(type, value) {
  return type === 'rich' ? sanitizeHtml(value).slice(0, 100000) : sanitizeText(value);
}

function applyOne(key, value) {
  const r = resolve(key);
  if (!r) return false;
  r.obj[r.prop] = clean(r.type, value);
  if (r.kind === 'products') refreshProduct(r.item);
  return true;
}

let overrides = {};
try {
  overrides = JSON.parse(fs.readFileSync(overridesFile, 'utf8'));
} catch {
  overrides = {};
}
for (const [k, v] of Object.entries(overrides)) applyOne(k, v);
for (const p of products) refreshProduct(p);

async function saveEdits(changes) {
  const applied = {};
  const rejected = [];
  for (const [key, value] of Object.entries(changes || {})) {
    if (applyOne(key, value)) {
      const r = resolve(key);
      applied[key] = r.obj[r.prop];
    } else rejected.push(key);
  }
  if (Object.keys(applied).length) {
    Object.assign(overrides, applied);
    await fs.promises.mkdir(path.dirname(overridesFile), { recursive: true });
    const tmp = overridesFile + '.tmp';
    await fs.promises.writeFile(tmp, JSON.stringify(overrides, null, 2), 'utf8');
    await fs.promises.rename(tmp, overridesFile);
  }
  return { applied, rejected };
}

const getOverrides = () => ({ ...overrides });
const text = (key, fallback) => (Object.prototype.hasOwnProperty.call(texts, key) ? texts[key] : fallback);

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
  const t = fold(post.title + ' ' + post.body.replace(/<[^>]+>/g, ' '));
  return products.filter((p) => p.name.length > 3 && t.includes(fold(p.name))).slice(0, n);
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
  saveEdits,
  getOverrides,
  text,
  resolveField: resolve,
};
