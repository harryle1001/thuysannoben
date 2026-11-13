// Tell IndexNow search engines (Bing, Yandex, Seznam, Naver...) about every page in the sitemap.
// Usage: node scripts/indexnow.js            (uses SITE_URL or https://thuysannoben.com)
// The key file is served by the site at /<key>.txt (content/indexnow-key.txt).
'use strict';
const fs = require('fs');
const path = require('path');
const SITE = (process.env.SITE_URL || 'https://thuysannoben.com').replace(/\/$/, '');
const key = fs.readFileSync(path.join(__dirname, '..', 'content', 'indexnow-key.txt'), 'utf8').trim();
(async () => {
  const xml = await (await fetch(SITE + '/sitemap.xml')).text();
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation: `${SITE}/${key}.txt`, urlList }),
  });
  console.log(`IndexNow: gửi ${urlList.length} trang, phản hồi ${res.status} ${res.statusText}`);
})();
