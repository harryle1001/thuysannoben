'use strict';
// Loads the JSON content once at startup and builds lookup indexes.
// Edits made with the on-page editor are stored in data/overrides.json and applied on top of /content.
const fs = require('fs');
const path = require('path');
const { sanitizeHtml, sanitizeText } = require('./sanitize');
const articles = require('./articles');

const dir = path.join(__dirname, '..', 'content');
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));
const overridesFile = path.join(__dirname, '..', 'data', 'overrides.json');

const company = read('company');
const categories = read('categories');
const products = read('products');
// Old posts whose content now lives in a fuller article (one page per topic, no duplicates
// competing in search). Their URLs redirect 301 to the article.
const MERGED = {
  'benh-ruot-do-tren-tom-va-cach-phong-ngua': 'benh-phan-trang-tren-tom-the',
  'benh-mem-vo-rot-cuc-thit': 'tom-mem-vo-cham-lot-nguyen-nhan-cach-xu-ly',
};
const posts = [...read('posts').filter((p) => !MERGED[p.slug]), ...articles.load()].sort((a, b) => (a.date < b.date ? 1 : -1));
const solutions = read('giai-phap');
const policies = require('./policies');
// Policy pages: Markdown in content/chinh-sach/ (falls back to the old content/pages.json entries).
const pages = { ...read('pages'), ...policies.load() };
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

// Width and height of a WebP file, read from its header (VP8X, VP8L or VP8).
function webpSize(file) {
  try {
    const b = Buffer.alloc(30);
    const fd = fs.openSync(file, 'r');
    fs.readSync(fd, b, 0, 30, 0);
    fs.closeSync(fd);
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
    }
    if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  } catch {
    /* missing file */
  }
  return null;
}
const cutoutDir = path.join(__dirname, '..', 'public', 'images', 'products-cutout');

function refreshProduct(p) {
  p.url = `/san-pham/${p.slug}`;
  p.categoryInfo = categoryBySlug[p.category];
  p.image = p.images[0] || null;
  // Package photo without the poster background (scripts/cutout-products.py); falls back to the poster.
  if (p.cutout === undefined) {
    const size = webpSize(path.join(cutoutDir, `${p.slug}.webp`));
    p.cutout = size ? { src: `/images/products-cutout/${p.slug}.webp`, ...size } : null;
  }
  p.shot = p.cutout || p.image;
  p.search = fold([p.name, p.tagline, ...p.uses].join(' ').replace(/<[^>]+>/g, ' '));
}

const POST_SECTIONS = {
  'ky-thuat': { label: 'Kiến thức nuôi tôm', list: '/ky-thuat-nuoi' },
  'gia-cong': { label: 'Gia công', list: '/gia-cong' },
  'cong-ty': { label: 'Tin công ty', list: '/tin-tuc' },
  'chung-nhan': { label: 'Chứng nhận', list: '/chung-nhan' },
  'tin-tuc': { label: 'Tin tức', list: '/tin-tuc' },
};
// Knowledge topics shown as filters on /ky-thuat-nuoi and as their own SEO pages.
const TOPICS = [
  { slug: 'benh-tom', name: 'Bệnh tôm', blurb: 'Nhận biết sớm và xử lý các bệnh thường gặp trên tôm thẻ, tôm sú: phân trắng, gan tụy, đốm trắng, EHP, đen mang, cong thân.' },
  { slug: 'moi-truong', name: 'Môi trường ao', blurb: 'Quản lý pH, độ kiềm, oxy, khí độc, màu nước và tảo để ao nuôi luôn ổn định.' },
  { slug: 'ky-thuat', name: 'Kỹ thuật nuôi', blurb: 'Cải tạo ao, chọn giống, dùng vi sinh, nuôi ao bạt mật độ cao và lịch chăm sóc theo ngày tuổi.' },
  { slug: 'dinh-duong', name: 'Dinh dưỡng & thức ăn', blurb: 'Cho ăn đúng cách, giảm FCR, bổ sung khoáng, vitamin và men tiêu hóa cho tôm.' },
];
const topicBySlug = Object.fromEntries(TOPICS.map((t) => [t.slug, t]));
// Topics for the articles that came from the old website.
const OLD_TOPICS = {
  'khoang-tang-trong-luong-khi-thu-hoach': 'dinh-duong',
  'nuoi-tom-mua-mua-va-cach-khac-phuc': 'moi-truong',
  'ky-thuat-chon-tom-giong-tot-ngay-tai-trai-tom-giong': 'ky-thuat',
};
const OLD_SYMPTOMS = {
  'benh-ruot-do-tren-tom-va-cach-phong-ngua': ['gan-ruot'],
  'su-dung-prazi-s-de-phong-va-tri-benh-teo-gan-tuy-phan-trang-trong-duong-ruot-tren-tom': ['gan-ruot'],
  'su-dung-thao-duoc-tu-nhien-an-toan-sinh-hoc-de-phong-va-tri-hieu-qua-benh-gan-chet-som-chet-tap-me': ['gan-ruot'],
  'benh-dom-den-tren-tom-the': ['mang-dom-den'],
  'benh-dong-rong-hay-mang-bam': ['mang-dom-den'],
  'benh-mem-vo-rot-cuc-thit': ['mem-vo'],
  'khoang-tang-trong-luong-khi-thu-hoach': ['mem-vo'],
  'nuoi-tom-mua-mua-va-cach-khac-phuc': ['oxy-stress', 'khi-doc'],
  'cach-su-dung-de-zoo-de-tieu-diet-cac-loai-nam-noi-ngoai-ky-sinh-trung-hen-trong-ao-nuoi-tom': ['sat-trung'],
};
const OLD_SEO_TITLES = {
  'su-dung-prazi-s-de-phong-va-tri-benh-teo-gan-tuy-phan-trang-trong-duong-ruot-tren-tom': 'Tẩy ký sinh trùng tôm, phòng gan, phân trắng bằng PRAZI S',
  'cach-su-dung-de-zoo-de-tieu-diet-cac-loai-nam-noi-ngoai-ky-sinh-trung-hen-trong-ao-nuoi-tom': 'Dùng DE ZOO diệt nấm, ký sinh trùng, hến trong ao tôm',
  'su-dung-thao-duoc-tu-nhien-an-toan-sinh-hoc-de-phong-va-tri-hieu-qua-benh-gan-chet-som-chet-tap-me': 'Trị bệnh gan, chết sớm, chết tấp mé trên tôm bằng thảo dược',
  'chuyen-tu-van-gia-cong-hang-thanh-pham-ban-thanh-pham-huong-dan-thu-tuc-cap-ma-so-hchq-san-pham': 'Tư vấn gia công, đăng ký lưu hành thuốc thủy sản – Noben',
  'khoang-tang-trong-luong-khi-thu-hoach': 'Khoáng tăng trọng khi thu hoạch, chống còi, trị mềm vỏ tôm',
  'mot-so-benh-thuong-gap-tren-tom-the': 'Các bệnh thường gặp trên tôm thẻ và cách phòng trị',
  'benh-dong-rong-hay-mang-bam': 'Bệnh đóng rong, mảng bám trên tôm: dấu hiệu và cách trị',
  'benh-dom-den-tren-tom-the': 'Bệnh đốm đen trên tôm thẻ: nguyên nhân và cách trị',
  'benh-mem-vo-rot-cuc-thit': 'Bệnh mềm vỏ, rớt cục thịt trên tôm thẻ và cách xử lý',
  'ky-thuat-chon-tom-giong-tot-ngay-tai-trai-tom-giong': 'Kỹ thuật chọn tôm giống tốt ngay tại trại giống',
};
for (const p of posts) {
  p.url = `/bai-viet/${p.slug}`;
  p.section = POST_SECTIONS[p.category] || POST_SECTIONS['tin-tuc'];
  if (p.category === 'ky-thuat') {
    p.topic = p.topic || OLD_TOPICS[p.slug] || 'benh-tom';
    p.topicInfo = topicBySlug[p.topic];
    p.symptoms = p.symptoms || OLD_SYMPTOMS[p.slug] || [];
  }
  // Old-site articles used bold paragraphs as headings: turn them into real headings.
  if (p.source !== 'md') p.body = p.body.replace(/<p>\s*<strong>([^<]{3,120})<\/strong>\s*:?\s*<\/p>/g, '<h3>$1</h3>');
  p.seoTitle = p.seoTitle || OLD_SEO_TITLES[p.slug] || p.title;
  p.description = p.description || p.excerpt;
  p.updated = p.updated || p.date;
  p.toc = p.toc || [];
  p.faq = p.faq || [];
  p.words = p.words || p.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  p.readingMinutes = p.readingMinutes || Math.max(1, Math.round(p.words / 200));
  const d = new Date(p.date + 'T00:00:00+07:00');
  p.dateLabel = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
}

/* ---------- On-page editing ----------
   A key names one editable value, for example:
     company.hotline            company.values.2
     products.prazi-s.tagline   products.prazi-s.uses.0
     posts.<slug>.body          pages.<slug>.body
     categories.<slug>.blurb    texts.home-hero-title
   "rich" values keep simple formatting (bold, lists, superscript); "text" values are plain. */
const FIELDS = {
  company: { hotline: 'text', address: 'text', email: 'text', vision: 'text', mission: 'text', 'phones.*': 'text', 'values.*': 'text', 'overview.*': 'text', tax_id: 'text', reg_date: 'text', reg_place: 'text', representative: 'text', bank_name: 'text', bank_account: 'text', bank_holder: 'text', bct_url: 'text' },
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

// Solution landing pages (/giai-phap/<slug>): one per pond problem, with ranked products and articles.
for (const s of solutions) {
  s.url = `/giai-phap/${s.slug}`;
  s.symptomInfo = symptomBySlug[s.symptom];
  if (s.symptomInfo) s.symptomInfo.solution = s;
}
const solutionBySlug = Object.fromEntries(solutions.map((s) => [s.slug, s]));
const solutionProducts = (s) =>
  products.filter((p) => p.symptoms.includes(s.symptom)).sort((a, b) => (b.symscore[s.symptom] || 0) - (a.symscore[s.symptom] || 0));
const solutionArticles = (s) => {
  const picked = s.articles.map((slug) => postBySlug[slug]).filter(Boolean);
  const more = posts.filter((p) => p.category === 'ky-thuat' && !picked.includes(p) && (p.symptoms || []).includes(s.symptom));
  return [...picked, ...more].slice(0, 6);
};
const knowledge = () => posts.filter((p) => p.category === 'ky-thuat');
function relatedArticles(post, n = 3) {
  const score = (p) => (p.symptoms || []).filter((s) => (post.symptoms || []).includes(s)).length * 2 + (p.topic === post.topic ? 1 : 0) + (p.source === 'md' ? 0.5 : 0);
  return knowledge()
    .filter((p) => p !== post)
    .map((p) => [score(p), p])
    .sort((a, b) => b[0] - a[0] || (a[1].date < b[1].date ? 1 : -1))
    .slice(0, n)
    .map(([, p]) => p);
}
function articleProducts(post, n = 4) {
  const chosen = (post.productSlugs || []).map((s) => productBySlug[s]).filter(Boolean);
  return (chosen.length ? chosen : productsMentioned(post, n)).slice(0, n);
}
const articlesForProduct = (product, n = 3) =>
  knowledge()
    .filter((p) => (p.productSlugs || []).includes(product.slug) || productsMentioned(p, 30).includes(product))
    .slice(0, n);

// Hand-picked products for the home page, one per common pond problem.
const FEATURED = ['prazi-s', 'ben-xid-3000', 'caphote', 'aqua-bac', 'oxy-99', 'sorbest', 'nb-brown-gay-mau-nuoc-mau-tra', 'aqualac-fs'];
const featured = FEATURED.map((s) => productBySlug[s]).filter(Boolean);
// Products shown in the 3D carousel on the home page: the featured ones plus one or two from every group.
const SHOWCASE = [...FEATURED, 'kalimix', 'super-yucca', 'bio-edta', 'hepaliver-fs', 'grand-zeolite-zeo-hat-nhap-khau', 'aqua-c30', 'top-weigh', 'ben-iq'];
const showcase = SHOWCASE.map((s) => productBySlug[s]).filter(Boolean);

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
  MERGED,
  company,
  categories,
  products,
  posts,
  pages,
  symptoms,
  featured,
  showcase,
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
  TOPICS,
  topicBySlug,
  solutions,
  solutionBySlug,
  solutionProducts,
  solutionArticles,
  knowledge,
  relatedArticles,
  articleProducts,
  articlesForProduct,
};
