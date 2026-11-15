'use strict';
const fs = require('fs');
const path = require('path');

// Minimal .env loader so the app runs without extra dependencies.
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const routes = require('./src/routes');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Visitors arriving on an old or alternate domain get a permanent redirect to the main one,
// so links and Google rankings carry over (e.g. thuocthuysannoben.com -> thuysannoben.com).
const SITE_URL = (process.env.SITE_URL || 'https://thuysannoben.com').replace(/\/$/, '');
const OLD_HOSTS = (process.env.OLD_HOSTS || 'www.thuysannoben.com,thuocthuysannoben.com,www.thuocthuysannoben.com,thuysannoben.vn,www.thuysannoben.vn')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);
app.use((req, res, next) => {
  if (OLD_HOSTS.includes(String(req.hostname || '').toLowerCase())) return res.redirect(301, SITE_URL + req.originalUrl);
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://www.googletagmanager.com'],
        'style-src': ["'self'"],
        'font-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'https://i.ytimg.com', 'https://img.youtube.com', 'https://online.gov.vn', 'https://*.google-analytics.com', 'https://www.googletagmanager.com'],
        'frame-src': ['https://www.google.com', 'https://maps.google.com', 'https://www.youtube-nocookie.com'],
        'connect-src': ["'self'", 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com'],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '30d',
    setHeaders(res, file) {
      // CSS/JS are always linked with ?v=N (bump it when a file changes); fonts never change.
      if (/\.(css|js|woff2)$/.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));

// Health check for uptime monitors: short JSON, nothing private (no paths, no counts, no keys).
const dataDir = require('./src/datadir');
const COMMIT = (() => {
  if (process.env.COMMIT_SHA) return String(process.env.COMMIT_SHA).slice(0, 7);
  try {
    const git = path.join(__dirname, '.git');
    const head = fs.readFileSync(path.join(git, 'HEAD'), 'utf8').trim();
    if (!head.startsWith('ref: ')) return head.slice(0, 7);
    const ref = head.slice(5);
    const loose = path.join(git, ref);
    if (fs.existsSync(loose)) return fs.readFileSync(loose, 'utf8').trim().slice(0, 7);
    const packed = fs.readFileSync(path.join(git, 'packed-refs'), 'utf8').split('\n').find((l) => l.endsWith(' ' + ref));
    return packed ? packed.slice(0, 7) : null;
  } catch {
    return null;
  }
})();
let writableCache = { at: 0, ok: false };
app.get('/healthz', (req, res) => {
  if (Date.now() - writableCache.at > 60 * 1000) writableCache = { at: Date.now(), ok: dataDir.isWritable() };
  res.set('Cache-Control', 'no-store').set('X-Robots-Tag', 'noindex');
  res.json({ ok: writableCache.ok, uptime: Math.round(process.uptime()), dataWritable: writableCache.ok, dataLocation: dataDir.SOURCE, migratedFiles: dataDir.migratedCount, commit: COMMIT });
});

app.use(routes);

app.use((req, res) => {
  res.locals.lang = 'vi';
  res.locals.alt = null;
  res.status(404).render('pages/not-found', { meta: { title: 'Không tìm thấy trang', noindex: true } });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render('pages/not-found', {
    meta: { title: 'Có lỗi xảy ra', noindex: true },
    serverError: true,
  });
});

app.listen(PORT, () => {
  console.log(`Noben website đang chạy tại http://localhost:${PORT}`);
  require('./src/indexnow').schedule({ port: PORT, siteUrl: SITE_URL });
  require('./src/backup').schedule();
});
