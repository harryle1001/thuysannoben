'use strict';
// Knowledge articles written in Markdown (content/kien-thuc/*.md) with a small front-matter header.
// Each article gets: HTML body, table of contents from its H2s, FAQ items (for FAQPage rich results)
// taken from the "Câu hỏi thường gặp" section, reading time and resolved product links.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const dir = path.join(__dirname, '..', 'content', 'kien-thuc');

const fold = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
const slugify = (s) => fold(s).replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

function parseFrontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
  meta.keywords = list(meta.keywords);
  meta.symptoms = list(meta.symptoms);
  meta.products = list(meta.products);
  return { meta, body: m[2] };
}

function render(markdown) {
  let html = marked.parse(markdown, { gfm: true });
  const toc = [];
  const used = new Set();
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (all, level, inner) => {
    let id = slugify(stripTags(inner)) || 'muc';
    while (used.has(id)) id += '-2';
    used.add(id);
    if (level === '2') toc.push({ id, text: stripTags(inner) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');

  // Pull the FAQ section out of the body.
  const faq = [];
  const faqMatch = html.match(/<h2 id="[^"]*">\s*Câu hỏi thường gặp\s*<\/h2>([\s\S]*?)(?=<h2 |$)/);
  if (faqMatch) {
    const parts = faqMatch[1].split(/<h3 id="[^"]*">/).slice(1);
    for (const part of parts) {
      const [q, ...rest] = part.split('</h3>');
      faq.push({ q: stripTags(q), a: rest.join('</h3>').trim() });
    }
    html = html.replace(faqMatch[0], '');
    const idx = toc.findIndex((t) => t.text === 'Câu hỏi thường gặp');
    if (idx > -1) toc.splice(idx, 1);
  }
  return { html: html.trim(), toc, faq };
}

function load() {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { meta, body } = parseFrontMatter(raw);
      const slug = file.replace(/\.md$/, '');
      const { html, toc, faq } = render(body);
      const words = stripTags(html).split(/\s+/).filter(Boolean).length;
      const stat = fs.statSync(path.join(dir, file));
      const coverWebp = `/images/kien-thuc/${slug}.webp`;
      const hasCover = fs.existsSync(path.join(__dirname, '..', 'public', coverWebp));
      return {
        slug,
        source: 'md',
        title: meta.title || slug,
        seoTitle: meta.seo_title || meta.title,
        description: meta.description || '',
        excerpt: meta.description || '',
        keywords: meta.keywords,
        topic: meta.category || 'ky-thuat',
        category: 'ky-thuat',
        symptoms: meta.symptoms,
        productSlugs: meta.products,
        date: meta.date || stat.mtime.toISOString().slice(0, 10),
        updated: meta.updated || meta.date || stat.mtime.toISOString().slice(0, 10),
        cover: hasCover ? { src: coverWebp, w: 1200, h: 630 } : meta.photo ? { src: meta.photo, w: 532, h: 250 } : null,
        ogImage: hasCover ? `/images/kien-thuc/${slug}.jpg` : meta.photo || null,
        photo: meta.photo || null,
        body: html,
        toc,
        faq,
        words,
        readingMinutes: Math.max(2, Math.round(words / 200)),
        gallery: [],
      };
    });
}

module.exports = { load, slugify, fold };
