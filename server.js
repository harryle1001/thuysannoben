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
// so links and Google rankings carry over (e.g. thuocthuysannoben.com -> thuysannoben.vn).
const SITE_URL = (process.env.SITE_URL || 'https://thuysannoben.vn').replace(/\/$/, '');
const OLD_HOSTS = (process.env.OLD_HOSTS || 'thuocthuysannoben.com,www.thuocthuysannoben.com,www.thuysannoben.vn')
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
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'font-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'https://i.ytimg.com', 'https://img.youtube.com', 'https://online.gov.vn'],
        'frame-src': ['https://www.google.com', 'https://maps.google.com', 'https://www.youtube-nocookie.com'],
        'connect-src': ["'self'"],
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
      if (/\.(css|js)$/.test(file)) res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));

app.use(routes);

app.use((req, res) => {
  res.status(404).render('pages/not-found', { meta: { title: 'Không tìm thấy trang', noindex: true } });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render('pages/not-found', {
    meta: { title: 'Có lỗi xảy ra', noindex: true },
    serverError: true,
  });
});

app.listen(PORT, () => console.log(`Noben website đang chạy tại http://localhost:${PORT}`));
