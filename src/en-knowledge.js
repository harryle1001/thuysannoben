'use strict';
// English knowledge articles (content/en/knowledge/<slug>.md, same slug as the Vietnamese article)
// and English solution pages (content/en/solutions.json, same slugs as content/giai-phap.json).
// Internal links written as Vietnamese paths are pointed at the English page when one exists.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const c = require('./content');
const en = require('./en');

const dir = path.join(__dirname, '..', 'content', 'en', 'knowledge');
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const slugify = (s) => stripTags(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const TOPICS = [
  { slug: 'shrimp-diseases', vi: 'benh-tom', name: 'Shrimp diseases', blurb: 'Early recognition and control of AHPND/EMS, EHP, white spot disease, white feces disease and hepatopancreas problems.' },
  { slug: 'water-quality', vi: 'moi-truong', name: 'Water quality & pond environment', blurb: 'pH, alkalinity, dissolved oxygen, toxic ammonia and nitrite, algae and seasonal risks in shrimp ponds.' },
  { slug: 'farming-techniques', vi: 'ky-thuat', name: 'Farming techniques', blurb: 'Postlarvae selection, lined ponds, intensive culture and the economics of a shrimp crop.' },
  { slug: 'nutrition-minerals', vi: 'dinh-duong', name: 'Nutrition & minerals', blurb: 'Mineral balance, feeding and supplements for whiteleg shrimp in low- and high-salinity ponds.' },
];
const topicByVi = Object.fromEntries(TOPICS.map((t) => [t.vi, t]));
const topicBySlug = Object.fromEntries(TOPICS.map((t) => [t.slug, t]));

function frontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  if (!m) return { meta, body: raw };
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
  return { meta: { ...meta, keywords: list(meta.keywords), symptoms: list(meta.symptoms), products: list(meta.products) }, body: m[2] };
}

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
const slugs = new Set(files.map((f) => f.replace(/\.md$/, '')));
const solutionsRaw = (() => {
  try {
    return require('../content/en/solutions.json');
  } catch {
    return [];
  }
})();
const solSlugs = new Set(solutionsRaw.map((s) => s.slug));

// Vietnamese path -> English path when that page exists in English (used for links and the language switch).
function enPath(viPath) {
  const p = viPath.replace(/\/$/, '') || '/';
  let m = p.match(/^\/bai-viet\/([^/#?]+)$/);
  if (m) return slugs.has(m[1]) ? `/en/knowledge/${m[1]}` : '';
  m = p.match(/^\/giai-phap\/([^/#?]+)$/);
  if (m) return solSlugs.has(m[1]) ? `/en/solutions/${m[1]}` : '';
  if (p === '/giai-phap') return solSlugs.size ? '/en/solutions' : '';
  if (p === '/ky-thuat-nuoi') return slugs.size ? '/en/knowledge' : '';
  m = p.match(/^\/ky-thuat-nuoi\/([^/]+)$/);
  if (m && topicByVi[m[1]] && slugs.size) return `/en/knowledge/topic/${topicByVi[m[1]].slug}`;
  return '';
}
function localiseLinks(html) {
  return html.replace(/<a href="(\/[^"#?]*)([^"]*)"/g, (all, p, rest) => {
    const e = enPath(p) || en.enFor(p);
    return e ? `<a href="${e}${rest}"` : `<a href="${p}${rest}" hreflang="vi"`;
  });
}

function render(markdown) {
  let html = marked.parse(markdown, { gfm: true });
  const toc = [];
  const used = new Set();
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (all, level, inner) => {
    let id = slugify(inner) || 'section';
    while (used.has(id)) id += '-2';
    used.add(id);
    if (level === '2') toc.push({ id, text: stripTags(inner) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = localiseLinks(html);
  const faq = [];
  const fm = html.match(/<h2 id="[^"]*">\s*Frequently asked questions\s*<\/h2>([\s\S]*?)(?=<h2 |$)/);
  if (fm) {
    for (const part of fm[1].split(/<h3 id="[^"]*">/).slice(1)) {
      const [q, ...rest] = part.split('</h3>');
      faq.push({ q: stripTags(q), a: rest.join('</h3>').trim() });
    }
    html = html.replace(fm[0], '');
    const i = toc.findIndex((t) => t.text === 'Frequently asked questions');
    if (i > -1) toc.splice(i, 1);
  }
  return { html: html.trim(), toc, faq };
}

const articles = files
  .map((file) => {
    const slug = file.replace(/\.md$/, '');
    const { meta, body } = frontMatter(fs.readFileSync(path.join(dir, file), 'utf8'));
    const vi = c.postBySlug[slug] || {};
    const { html, toc, faq } = render(body);
    const words = stripTags(html).split(/\s+/).filter(Boolean).length;
    const topicInfo = topicByVi[meta.category] || TOPICS[2];
    return {
      slug,
      url: `/en/knowledge/${slug}`,
      viUrl: `/bai-viet/${slug}`,
      title: meta.title || slug,
      seoTitle: meta.seo_title || meta.title,
      description: meta.description || '',
      excerpt: meta.description || '',
      keywords: meta.keywords,
      topic: topicInfo.slug,
      topicInfo,
      symptoms: meta.symptoms,
      productSlugs: meta.products,
      date: meta.date || vi.date,
      updated: meta.updated || vi.updated || meta.date,
      cover: vi.cover || null,
      ogImage: vi.ogImage || null,
      body: html,
      toc,
      faq,
      words,
      readingMinutes: Math.max(2, Math.round(words / 220)),
      hasSources: /<h2 id="references">/.test(html),
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : Number(b.hasSources) - Number(a.hasSources)));
const articleBySlug = Object.fromEntries(articles.map((a) => [a.slug, a]));

function relatedArticles(a, n = 3) {
  const score = (p) => p.symptoms.filter((s) => a.symptoms.includes(s)).length * 2 + (p.topic === a.topic ? 1 : 0);
  return articles
    .filter((p) => p !== a)
    .map((p) => [score(p), p])
    .sort((x, y) => y[0] - x[0])
    .slice(0, n)
    .map(([, p]) => p);
}
function articleProducts(a, n = 4) {
  const viPost = c.postBySlug[a.slug];
  const vi = viPost ? c.articleProducts(viPost, n) : [];
  const chosen = a.productSlugs.map((s) => en.productBySlug[s]).filter(Boolean);
  return (chosen.length ? chosen : vi.map((p) => en.productBySlug[p.slug]).filter(Boolean)).slice(0, n);
}

const symLabel = Object.fromEntries(en.symptoms.map((s) => [s.slug, s.label]));
const solutions = solutionsRaw
  .filter((s) => c.solutionBySlug[s.slug])
  .map((s) => ({ ...s, url: `/en/solutions/${s.slug}`, viUrl: `/giai-phap/${s.slug}`, label: symLabel[s.symptom] || s.h1 }));
const solutionBySlug = Object.fromEntries(solutions.map((s) => [s.slug, s]));
for (const s of solutions) {
  s.products = c.solutionProducts(c.solutionBySlug[s.slug]).map((p) => en.productBySlug[p.slug]).filter(Boolean);
  s.count = s.products.length;
  const picked = s.articles.map((x) => articleBySlug[x]).filter(Boolean);
  s.articleList = [...picked, ...articles.filter((a) => !picked.includes(a) && a.symptoms.includes(s.symptom))].slice(0, 6);
}
const solutionsFor = (a) => a.symptoms.map((x) => solutions.find((s) => s.symptom === x)).filter(Boolean);

// English path -> Vietnamese path for the language switch.
function viPath(p) {
  let m = p.match(/^\/en\/knowledge\/topic\/([^/]+)$/);
  if (m && topicBySlug[m[1]]) return `/ky-thuat-nuoi/${topicBySlug[m[1]].vi}`;
  m = p.match(/^\/en\/knowledge\/([^/]+)$/);
  if (m && articleBySlug[m[1]]) return articleBySlug[m[1]].viUrl;
  if (p === '/en/knowledge') return '/ky-thuat-nuoi';
  m = p.match(/^\/en\/solutions\/([^/]+)$/);
  if (m && solutionBySlug[m[1]]) return solutionBySlug[m[1]].viUrl;
  if (p === '/en/solutions') return '/giai-phap';
  return '';
}

module.exports = { TOPICS, topicBySlug, articles, articleBySlug, relatedArticles, articleProducts, solutions, solutionBySlug, solutionsFor, enPath, viPath };
