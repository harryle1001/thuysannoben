'use strict';
// Automatic IndexNow pings (Bing, Yandex, Seznam, Naver...): shortly after each start (every deploy
// restarts the app) the site reads its own sitemap and submits the pages that are new or whose
// lastmod changed since the last submission. Google does not use IndexNow; it reads the sitemap.
// Off when INDEXNOW_AUTO=0, when there is no key file, or when SITE_URL is a local address.
const fs = require('fs');
const path = require('path');

const KEY_FILE = path.join(__dirname, '..', 'content', 'indexnow-key.txt');
const STATE_FILE = path.join(__dirname, '..', 'data', 'indexnow-sent.json');

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; }
}

async function submit({ port, siteUrl, log = console.log }) {
  const key = fs.existsSync(KEY_FILE) ? fs.readFileSync(KEY_FILE, 'utf8').trim() : '';
  const site = new URL(siteUrl);
  if (!key || process.env.INDEXNOW_AUTO === '0' || /^(localhost|127\.|0\.0\.0\.0)/.test(site.hostname)) return null;

  const xml = await (await fetch(`http://127.0.0.1:${port}/sitemap.xml`)).text();
  const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]]);
  const sent = readState();
  const changed = entries.filter(([loc, mod]) => sent[loc] !== mod).map(([loc]) => loc);
  if (!changed.length) { log('[indexnow] không có trang mới'); return 0; }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: site.host, key, keyLocation: `${site.origin}/${key}.txt`, urlList: changed.slice(0, 10000) }),
  });
  log(`[indexnow] gửi ${changed.length} trang, phản hồi ${res.status}`);
  if (res.status === 200 || res.status === 202) {
    for (const [loc, mod] of entries) sent[loc] = mod;
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(sent));
  }
  return changed.length;
}

// Run once, a minute after start, so the site is up and warm; never crash the app.
function schedule(opts) {
  const t = setTimeout(() => submit(opts).catch((e) => console.error('[indexnow]', e.message)), 60 * 1000);
  if (t.unref) t.unref();
}

module.exports = { submit, schedule };
