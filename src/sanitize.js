'use strict';
// Allow-list HTML cleaner for text edited in the browser. Keeps simple formatting, drops
// scripts, styles, event handlers and unsafe links. Unknown tags are removed but their text is kept.

const TAGS = {
  p: [], br: [], strong: [], b: [], em: [], i: [], u: [], sup: [], sub: [],
  ul: [], ol: [], li: [], h3: [], h4: [], blockquote: [],
  table: [], thead: [], tbody: [], tr: [], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'],
  a: ['href'],
  img: ['src', 'alt', 'width', 'height', 'loading'],
};
const VOID = new Set(['br', 'img']);

function safeUrl(name, value) {
  const v = value.trim();
  if (name === 'src') return /^\/images\/[\w\-./]+$/.test(v) ? v : null;
  if (name === 'href') return /^(https?:\/\/|\/(?!\/)|#|tel:|mailto:)/i.test(v) && !/^\s*javascript:/i.test(v) ? v : null;
  return v;
}

const escAttr = (s) => s.replace(/&(?!(#\d+|#x[0-9a-f]+|\w+);)/gi, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function sanitizeHtml(input) {
  let html = String(input || '');
  html = html.replace(/<(script|style|iframe|object|embed|template|svg|math)[\s\S]*?<\/\1\s*>/gi, '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (tag, rawName, rawAttrs) => {
    const name = rawName.toLowerCase();
    const allowed = TAGS[name];
    if (!allowed) return '';
    if (tag.startsWith('</')) return VOID.has(name) ? '' : `</${name}>`;
    const attrs = [];
    const re = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let m;
    while ((m = re.exec(rawAttrs))) {
      const key = m[1].toLowerCase();
      if (!allowed.includes(key)) continue;
      const value = safeUrl(key, m[3] ?? m[4] ?? m[5] ?? '');
      if (value != null) attrs.push(` ${key}="${escAttr(value)}"`);
    }
    if (name === 'img' && !attrs.some((a) => a.startsWith(' src='))) return '';
    return `<${name}${attrs.join('')}>`;
  });
  // Any stray "<" left in text must not start markup.
  html = html.replace(/<(?![a-z/])/gi, '&lt;');
  return html.trim();
}

function sanitizeText(input, max = 2000) {
  return String(input || '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

module.exports = { sanitizeHtml, sanitizeText };
