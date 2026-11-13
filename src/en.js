'use strict';
// English edition: product data with translated label text, English categories and symptoms,
// and the URL pairs (Vietnamese <-> English) used for the language switch and hreflang tags.
const c = require('./content');

const strings = require('../content/en/strings.json');
strings['Sử dụng khi trường hợp khí độc cao, cấp cứu nổi đầu: Dùng 20kg/ 1.000m² nước, sử dụng 2 ngày liên tục.'] =
  'High toxic gas levels or surfacing shrimp: 20 kg per 1,000 m² of pond area, for 2 consecutive days.';

const norm = (x) =>
  String(x || '')
    .replace(/<sup>3<\/sup>/g, '³')
    .replace(/<sup>2<\/sup>/g, '²')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const tr = (x) => {
  const k = norm(x);
  return strings[k] || k;
};

const CATS = {
  'sinh-hoc': {
    en: 'probiotics-pond-care',
    name: 'Probiotics & pond care',
    blurb: 'Bottom-cleaning probiotics, toxic-gas binders, water disinfectants and pond conditioners.',
    kind: 'probiotic and pond-care product for shrimp ponds',
  },
  'khoang-chat': {
    en: 'minerals',
    name: 'Minerals',
    blurb: 'Macro and trace minerals for even moulting, fast shell hardening and fewer cases of bent body and white muscle.',
    kind: 'mineral supplement for shrimp',
  },
  'thuc-an-bo-sung': {
    en: 'feed-supplements',
    name: 'Feed supplements',
    blurb: 'Digestive enzymes, vitamins, liver tonics and growth boosters mixed into the daily feed.',
    kind: 'feed supplement for shrimp',
  },
  'tri-benh': {
    en: 'health-water-colour-snail-control',
    name: 'Health, water colour & snail control',
    blurb: 'Liver and gut health support, water-colour builders and snail control before stocking.',
    kind: 'aquaculture health product for shrimp',
  },
};
const SYMS = {
  'gan-ruot': 'White faeces, hepatopancreas, gut',
  'mang-dom-den': 'Black spot, black gill, fouling',
  'mem-vo': 'Soft shell, bent body, slow growth',
  'mau-nuoc': 'Algae & water colour',
  'khi-doc': 'Toxic gas, liner slime, pond bottom',
  'oxy-stress': 'Low oxygen, shock, stress',
  'sat-trung': 'Disinfection & snail control',
  'tieu-hoa': 'Digestion, immunity, vitamins',
};

const categories = c.categories.map((cat) => {
  const e = CATS[cat.slug] || { en: cat.slug, name: cat.name, blurb: cat.blurb, kind: 'aquaculture product' };
  return { slug: e.en, vi: cat.slug, name: e.name, blurb: e.blurb, kind: e.kind, url: `/en/products/category/${e.en}`, count: 0 };
});
const catByVi = Object.fromEntries(categories.map((x) => [x.vi, x]));
const catBySlug = Object.fromEntries(categories.map((x) => [x.slug, x]));
const symptoms = c.symptoms.map((s) => ({ slug: s.slug, label: SYMS[s.slug] || s.label }));

const NAMES = {
  'vi-sinh-3-trong-1-chuyen-lam-sach-day-nuoc-cat-tao-sach-nhot-bat': '3-in-1 PROBIOTIC (bottom, water, algae and liner slime)',
  'premix-khoang-khoang-kich-lot': 'PREMIX MINERAL',
  'vita-c-tat': 'VITA C (pond application)',
};
const products = c.products.map((p) => {
  const cat = catByVi[p.category];
  cat.count += 1;
  const tagline = tr(p.tagline);
  return {
    ...p,
    name: NAMES[p.slug] || p.name,
    viUrl: p.url,
    url: `/en/products/${p.slug}`,
    tagline,
    uses: p.uses.map(tr).filter(Boolean),
    dose: p.dose.map(tr).filter(Boolean),
    composition: p.composition.map(tr).filter(Boolean),
    category: cat.slug,
    categoryInfo: cat,
    search: `${p.search} ${tagline.toLowerCase()}`,
  };
});
const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

function filterProducts({ category, symptom, q }) {
  const words = String(q || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  return products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!symptom || p.symptoms.includes(symptom)) &&
      words.every((w) => p.search.normalize('NFD').replace(/[̀-ͯ]/g, '').includes(w))
  );
}
function related(p, n) {
  return c.relatedProducts(c.productBySlug[p.slug], n).map((r) => productBySlug[r.slug]).filter(Boolean);
}

// Vietnamese path -> English path, for the language switch and hreflang alternates.
const STATIC = {
  '/': '/en',
  '/san-pham': '/en/products',
  '/ve-chung-toi': '/en/about',
  '/gia-cong': '/en/oem-manufacturing',
  '/lien-he': '/en/contact',
  '/chung-nhan': '/en/about',
};
function enFor(viPath) {
  const pth = viPath.replace(/\/$/, '') || '/';
  if (STATIC[pth] && pth !== '/chung-nhan') return STATIC[pth];
  let m = pth.match(/^\/san-pham\/nhom\/([^/]+)$/);
  if (m && catByVi[m[1]]) return catByVi[m[1]].url;
  m = pth.match(/^\/san-pham\/([^/]+)$/);
  if (m && productBySlug[m[1]]) return productBySlug[m[1]].url;
  return '';
}
function viFor(enPath) {
  const pth = enPath.replace(/\/$/, '');
  for (const [vi, en] of Object.entries(STATIC)) if (en === pth && vi !== '/chung-nhan') return vi;
  let m = pth.match(/^\/en\/products\/category\/([^/]+)$/);
  if (m && catBySlug[m[1]]) return `/san-pham/nhom/${catBySlug[m[1]].vi}`;
  m = pth.match(/^\/en\/products\/([^/]+)$/);
  if (m && productBySlug[m[1]]) return productBySlug[m[1]].viUrl;
  return '/';
}

module.exports = { tr, categories, catBySlug, catByVi, symptoms, products, productBySlug, filterProducts, related, enFor, viFor };
