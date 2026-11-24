'use strict';
// Ảnh minh họa trong bài (content/anh-minh-hoa.json): ảnh có giấy phép mở (Wikimedia Commons),
// tự chèn vào thân bài trước tiêu đề H2 thứ 2 và thứ 4, kèm chú thích và ghi công tác giả, giấy phép.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'content', 'anh-minh-hoa.json');
let data = { images: {}, articles: {} };
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  /* chưa có dữ liệu ảnh */
}

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function figure(id, lang) {
  const im = data.images[id];
  if (!im) return '';
  const en = lang === 'en';
  const alt = en ? im.alt_en || im.alt : im.alt;
  const base = `/images/minh-hoa/${id}`;
  const h = Math.round((1600 * im.h) / im.w);
  const set = [800, 1600, 2400].map((w) => `${base}-${w}.webp ${w}w`).join(', ');
  const by = en ? 'Photo' : 'Ảnh';
  return (
    `<figure class="art-fig">` +
    `<img src="${base}-1600.webp" srcset="${set}" sizes="(max-width: 860px) 100vw, 820px" width="1600" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async">` +
    `<figcaption>${esc(alt)}. <span class="art-fig__credit">${by}: ${esc(im.author)}, <a href="${esc(im.source)}" target="_blank" rel="noopener nofollow">Wikimedia Commons</a>, <a href="${esc(im.license_url)}" target="_blank" rel="noopener nofollow license">${esc(im.license)}</a></span></figcaption></figure>`
  );
}

// Chèn ảnh vào html: ảnh thứ i đứng trước H2 thứ (2 + 2i); thiếu H2 thì đặt cuối bài.
function inject(html, slug, lang) {
  const ids = (data.articles[slug] || []).filter((id) => data.images[id]);
  if (!ids.length || !html || /class="art-fig"/.test(html)) return html;
  const parts = html.split(/(?=<h2[\s>])/);
  ids.forEach((id, i) => {
    const at = 2 + 2 * i;
    const fig = figure(id, lang);
    if (parts.length > at) parts[at] = fig + parts[at];
    else parts[parts.length - 1] += fig;
  });
  return parts.join('');
}

const imagesFor = (slug) => (data.articles[slug] || []).filter((id) => data.images[id]).map((id) => ({ id, ...data.images[id] }));

module.exports = { inject, imagesFor, data };
