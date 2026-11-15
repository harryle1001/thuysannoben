'use strict';
const express = require('express');
const c = require('./content');
const leads = require('./leads');
const auth = require('./auth');
const totp = require('./totp');
const backup = require('./backup');
const seo = require('./seo');
const policies = require('./policies');
const chat = require('./chat');
const dealers = require('./dealers');
const en = require('./en');

const router = express.Router();
const SITE_URL = (process.env.SITE_URL || 'https://thuysannoben.com').replace(/\/$/, '');

const smallCache = new Map();
const hasSmall = (src) => {
  if (!/^\/images\/(products|products-cutout|posts|kien-thuc)\/[^/]+\.webp$/.test(src)) return false;
  if (!smallCache.has(src)) smallCache.set(src, require('fs').existsSync(require('path').join(__dirname, '..', 'public', src.replace(/([^/]+)$/, 'sm/$1'))));
  return smallCache.get(src);
};

// Values every template can use.
router.use((req, res, next) => {
  res.locals.company = c.company;
  res.locals.categories = c.categories;
  res.locals.productNames = c.products.map((p) => p.name);
  res.locals.symptoms = c.symptoms;
  res.locals.path = req.path;
  res.locals.siteUrl = SITE_URL;
  res.locals.googleVerify = String(process.env.GOOGLE_SITE_VERIFICATION || '').trim();
  // Google Analytics 4 measurement ID (G-XXXXXXXXXX), from the env or content/company.json.
  const ga = String(process.env.GA_MEASUREMENT_ID || c.company.ga_id || '').trim();
  res.locals.gaId = /^G-[A-Z0-9]{4,20}$/.test(ga) ? ga : '';
  res.locals.canonical = SITE_URL + (req.path === '/' ? '/' : req.path.replace(/\/$/, ''));
  res.locals.tel = (n) => 'tel:' + String(n).replace(/\D/g, '');
  res.locals.zaloUrl = 'https://zalo.me/' + c.company.zalo;
  res.locals.img = (i, opts = {}) => {
    if (!i) return '';
    // Product photos have a 360px copy in sm/, article covers a 768px one (scripts/make-small.py);
    // offer it when the caller says how wide the image shows.
    const smW = /^\/images\/(posts|kien-thuc)\//.test(i.src) ? 768 : 360;
    if (opts.sizes && !opts.srcset && i.w > smW * 1.1 && hasSmall(i.src)) opts = { ...opts, srcset: `${i.src.replace(/([^/]+)$/, 'sm/$1')} ${smW}w, ${i.src} ${i.w}w` };
    const attrs = Object.entries({ loading: 'lazy', decoding: 'async', ...opts })
      .filter(([, v]) => v !== false && v != null)
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');
    return `<img src="${i.src}" width="${i.w}" height="${i.h}"${attrs}>`;
  };
  res.locals.jsonld = [];
  const enPath = en.enFor(req.path);
  res.locals.alt = enPath ? { vi: req.path.replace(/\/$/, '') || '/', en: enPath } : null;
  res.locals.lang = 'vi';

  // On-page editing helpers. For visitors they print plain content; for a signed-in admin they
  // also mark each value with data-edit so the pencil editor can change it in place.
  const admin = auth.isAdmin(req);
  res.locals.isAdmin = admin;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const typeOf = (key) => (c.resolveField(key) || {}).type || 'text';
  res.locals.ed = (key) => (admin ? ` data-edit="${esc(key)}" data-edit-type="${typeOf(key)}"` : '');
  res.locals.ef = (key, value) => {
    const type = typeOf(key);
    const out = type === 'rich' ? String(value == null ? '' : value) : esc(value);
    return admin ? `<span data-edit="${esc(key)}" data-edit-type="${type}">${out}</span>` : out;
  };
  res.locals.tx = (key, fallback) => res.locals.ef(`texts.${key}`, c.text(key, fallback));
  if (admin) res.set('Cache-Control', 'private, no-store');
  next();
});

router.use(require('./routes-en'));

// ---------- Admin: sign in (password, then a 6-digit code when 2FA is on), sign out, save on-page edits ----------
const loginAttempts = new Map();
const codeAttempts = new Map();
let codeFailsAll = [];
const recentOf = (map, key, ms) => (map.get(key) || []).filter((t) => Date.now() - t < ms);
const loginView = (extra) => ({ meta: { title: 'Đăng nhập quản trị', noindex: true }, error: '', configured: Boolean(process.env.ADMIN_PASS), ...extra });
router.get('/quan-tri/dang-nhap', (req, res) => {
  if (auth.isAdmin(req)) return res.redirect(303, '/');
  res.set('Cache-Control', 'no-store');
  res.render('pages/admin-login', loginView({ next: safeNext(req.query.next) }));
});
router.post('/quan-tri/dang-nhap', (req, res) => {
  const recent = recentOf(loginAttempts, req.ip, 15 * 60 * 1000);
  const next = safeNext(req.body.next);
  const fail = (msg, code = 401) => res.status(code).render('pages/admin-login', loginView({ error: msg, next }));
  if (recent.length >= 8) return fail('Đăng nhập sai nhiều lần. Thử lại sau 15 phút.', 429);
  if (!auth.sameOrigin(req)) return fail('Yêu cầu không hợp lệ.', 403);
  if (!auth.checkPassword(String(req.body.user || ''), String(req.body.pass || ''))) {
    recent.push(Date.now());
    loginAttempts.set(req.ip, recent);
    return fail('Tên đăng nhập hoặc mật khẩu chưa đúng.');
  }
  loginAttempts.delete(req.ip);
  if (auth.totpEnabled()) {
    auth.setPending(req, res);
    return res.redirect(303, '/quan-tri/xac-thuc?next=' + encodeURIComponent(next));
  }
  auth.setSession(req, res);
  res.redirect(303, next);
});
// Step 2: the code from the authenticator app. 5 tries per IP and 30 for everyone per 15 minutes.
const codeView = (extra) => ({ meta: { title: 'Nhập mã xác thực', noindex: true }, error: '', ...extra });
router.get('/quan-tri/xac-thuc', (req, res) => {
  if (!auth.hasPending(req)) return res.redirect(303, '/quan-tri/dang-nhap');
  res.set('Cache-Control', 'no-store');
  res.render('pages/admin-2fa-code', codeView({ next: safeNext(req.query.next) }));
});
router.post('/quan-tri/xac-thuc', (req, res) => {
  const next = safeNext(req.body.next);
  res.set('Cache-Control', 'no-store');
  const fail = (msg, code = 401) => res.status(code).render('pages/admin-2fa-code', codeView({ error: msg, next }));
  if (!auth.sameOrigin(req)) return fail('Yêu cầu không hợp lệ.', 403);
  if (!auth.hasPending(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=' + encodeURIComponent(next));
  const WINDOW = 15 * 60 * 1000;
  const recent = recentOf(codeAttempts, req.ip, WINDOW);
  codeFailsAll = codeFailsAll.filter((t) => Date.now() - t < WINDOW);
  if (recent.length >= 5 || codeFailsAll.length >= 30) {
    auth.clearSession(res, req);
    return fail('Nhập sai mã nhiều lần. Đợi 15 phút rồi đăng nhập lại.', 429);
  }
  if (!auth.checkCode(String(req.body.code || ''))) {
    recent.push(Date.now());
    codeAttempts.set(req.ip, recent);
    codeFailsAll.push(Date.now());
    return fail('Mã chưa đúng hoặc đã dùng. Xem mã mới trên ứng dụng xác thực.');
  }
  codeAttempts.delete(req.ip);
  auth.setSession(req, res);
  res.redirect(303, next);
});
router.get('/quan-tri/dang-xuat', (req, res) => {
  auth.clearSession(res, req);
  res.redirect(303, '/');
});
// Set up 2FA: a fresh secret and its QR code. The site never stores it; the admin pastes it into
// ADMIN_TOTP_SECRET on hPanel. A test box checks the phone app shows matching codes first.
router.get('/quan-tri/2fa', (req, res) => {
  if (!auth.isAdmin(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/2fa');
  res.set('Cache-Control', 'private, no-store');
  const secret = totp.newSecret();
  res.render('pages/admin-2fa', { meta: { title: 'Bảo mật 2 lớp', noindex: true }, enabled: auth.totpEnabled(), secret, qr: totp.qrSvg(totp.otpauthUrl(secret, { account: process.env.ADMIN_USER || 'admin' })), test: null });
});
router.post('/quan-tri/2fa', (req, res) => {
  if (!auth.isAdmin(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/2fa');
  if (!auth.sameOrigin(req)) return res.status(403).send('Yêu cầu không hợp lệ.');
  res.set('Cache-Control', 'private, no-store');
  const recent = recentOf(codeAttempts, 'setup:' + req.ip, 15 * 60 * 1000);
  const secret = String(req.body.secret || '').replace(/[^A-Z2-7]/gi, '').toUpperCase().slice(0, 64);
  if (!totp.base32Decode(secret) || secret.length < 16) return res.redirect(303, '/quan-tri/2fa');
  let ok = false;
  if (recent.length < 10) {
    ok = totp.verify(secret, String(req.body.code || '')) >= 0;
    if (!ok) { recent.push(Date.now()); codeAttempts.set('setup:' + req.ip, recent); }
  }
  res.render('pages/admin-2fa', { meta: { title: 'Bảo mật 2 lớp', noindex: true }, enabled: auth.totpEnabled(), secret, qr: totp.qrSvg(totp.otpauthUrl(secret, { account: process.env.ADMIN_USER || 'admin' })), test: ok ? 'ok' : recent.length >= 10 ? 'limit' : 'fail' });
});
// Download a backup of customer data (leads, status, reviews, photos, on-page edits; no passwords).
router.post('/quan-tri/sao-luu', (req, res) => {
  if (!auth.isAdmin(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/lien-he');
  if (!auth.sameOrigin(req)) return res.status(403).send('Yêu cầu không hợp lệ.');
  res
    .set('Content-Type', 'application/gzip')
    .set('Content-Disposition', `attachment; filename="noben-sao-luu-${backup.vnDay()}.tar.gz"`)
    .set('Cache-Control', 'no-store')
    .send(backup.build());
});
router.post('/quan-tri/noi-dung', async (req, res, next) => {
  try {
    if (!auth.isAdmin(req)) return res.status(401).json({ ok: false, message: 'Phiên đăng nhập đã hết. Đăng nhập lại để lưu.' });
    if (!auth.sameOrigin(req)) return res.status(403).json({ ok: false, message: 'Yêu cầu không hợp lệ.' });
    const changes = req.body && typeof req.body.changes === 'object' ? req.body.changes : {};
    if (Object.keys(changes).length > 300) return res.status(413).json({ ok: false, message: 'Quá nhiều thay đổi trong một lần lưu.' });
    const result = await c.saveEdits(changes);
    res.json({ ok: true, saved: Object.keys(result.applied).length, applied: result.applied, rejected: result.rejected });
  } catch (err) {
    next(err);
  }
});
// Download every on-page edit, e.g. to send to the developer so the change can be committed to /content.
router.get('/quan-tri/noi-dung.json', (req, res) => {
  if (!auth.isAdmin(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/noi-dung.json');
  res.set('Content-Disposition', 'attachment; filename="noben-noi-dung-da-sua.json"');
  res.json(c.getOverrides());
});
function safeNext(v) {
  const s = String(v || '/');
  return /^\/(?!\/)[\w\-./?=&%]*$/.test(s) ? s : '/';
}

const org = seo.organization;
const crumbs = seo.crumbs;
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

// ---------- Pages ----------
router.get('/', (req, res) => {
  const knowledge = c.knowledge();
  res.render('pages/home', {
    meta: {
      preloadImage: '/media/noben-hero-poster.webp',
      title: 'Thuốc thủy sản Noben – Thuốc nuôi tôm, chế phẩm sinh học, khoáng chất',
      description:
        'Thuốc thủy sản Noben: thuốc trị bệnh tôm, vi sinh xử lý đáy, khoáng chất, men tiêu hóa cho ao tôm, cá. Nhà máy ISO 9001:2015 tại Củ Chi, hơn 22 năm kinh nghiệm, tư vấn kỹ thuật miễn phí.',
      image: '/images/brand/banner-1.webp',
    },
    featured: c.featured,
    showcase: c.showcase,
    articles: knowledge.filter((p) => p.source === 'md').slice(0, 6),
    knowledgeCount: knowledge.length,
    solutions: c.solutions,
    topics: c.TOPICS,
    productCount: c.products.length,
    allProducts: c.products,
    certificates: c.gallery.certificates.slice(0, 4),
    videos: c.videos,
    homeReviews: reviews.approved().length >= 3 ? reviews.approved().slice(0, 6).map(reviewView) : [], // only real, approved reviews
    jsonld: [org(), seo.website()],
  });
});

function renderCatalog(req, res, category) {
  const symptom = c.symptomBySlug[req.query['van-de']] ? req.query['van-de'] : '';
  const q = String(req.query.q || '').slice(0, 60);
  const cat = category || (c.categoryBySlug[req.query.nhom] ? req.query.nhom : '');
  const catInfo = c.categoryBySlug[cat];
  const list = c.filterProducts({ category: cat, symptom, q });
  const title = catInfo ? `${catInfo.name} cho ao tôm, cá` : 'Sản phẩm thuốc và chế phẩm thủy sản';
  res.render('pages/catalog', {
    meta: {
      title: catInfo ? `${catInfo.name} cho tôm, cá – Thuốc thủy sản Noben` : 'Sản phẩm thuốc thủy sản, thuốc nuôi tôm – Noben',
      description: catInfo ? catInfo.blurb : `${c.products.length} sản phẩm thuốc thủy sản Noben: chế phẩm sinh học, khoáng chất, thức ăn bổ sung, đặc trị bệnh tôm cá.`,
      noindex: Boolean(symptom || q),
    },
    heading: title,
    all: c.products,
    list,
    filters: { category: cat, symptom, q },
    lockedCategory: Boolean(category),
    jsonld: [
      crumbs([['Trang chủ', '/'], ['Sản phẩm', '/san-pham'], ...(catInfo ? [[catInfo.name, `/san-pham/nhom/${cat}`]] : [])]),
      seo.itemList(title, list),
    ],
  });
}
router.get('/san-pham', (req, res) => renderCatalog(req, res));
router.get('/san-pham/nhom/:cat', (req, res, next) => (c.categoryBySlug[req.params.cat] ? renderCatalog(req, res, req.params.cat) : next()));


// Product pages: a title that names the product and what it is for, cut at a word (no "…"),
// and a short FAQ answering what buyers search for (what it does, how to use, price, where to buy),
// built only from the label data on file.
const KIND = {
  'sinh-hoc': 'chế phẩm sinh học cho ao tôm',
  'khoang-chat': 'khoáng chất cho tôm',
  'thuc-an-bo-sung': 'thức ăn bổ sung cho tôm',
  'tri-benh': 'thuốc thủy sản cho tôm',
};
const plain = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
function cutWords(str, n) {
  if (str.length <= n) return str;
  return str.slice(0, n).replace(/[\s,;:–-]+\S*$/, '');
}
function productTitle(p) {
  const tail = ' | Noben';
  const head = `${p.name} – `;
  if (p.name.length > 34) return cutWords(p.name, 64 - tail.length) + tail;
  const room = 64 - head.length - tail.length;
  const tag = plain(p.tagline);
  return head + (room > 18 ? cutWords(tag.charAt(0).toUpperCase() + tag.slice(1), room) : KIND[p.category]) + tail;
}
function productFaq(p, related, solutions) {
  const co = c.company;
  const esc = (x) => String(x).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const faq = [];
  const uses = p.uses.map(plain).filter(Boolean);
  if (uses.length) {
    faq.push({ q: `${p.name} dùng để làm gì?`, a: `<p>${esc(p.name)} là ${KIND[p.category] || 'sản phẩm thủy sản'} của Noben. ${esc(plain(p.tagline))}.</p><ul>${uses.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` });
  }
  const dose = p.dose.map(plain).filter(Boolean);
  if (dose.length) {
    faq.push({ q: `Cách sử dụng ${p.name} như thế nào?`, a: `<p>Theo hướng dẫn trên nhãn:</p><ul>${dose.slice(0, 4).map((d) => `<li>${esc(d)}</li>`).join('')}</ul><p>Liều có thể điều chỉnh theo tình trạng ao; gọi kỹ thuật viên ${esc(co.hotline)} để được hướng dẫn cụ thể.</p>` });
  }
  if (solutions.length) {
    faq.push({ q: `${p.name} dùng khi ao tôm gặp vấn đề gì?`, a: `<p>${esc(p.name)} thường được dùng trong phác đồ xử lý: ${solutions.map((s) => `<a href="${s.url}">${esc(s.symptomInfo.label.toLowerCase())}</a>`).join(', ')}.</p>` });
  }
  faq.push({ q: `${p.name} giá bao nhiêu?`, a: `<p>Giá ${esc(p.name)} tùy quy cách đóng gói, số lượng và khu vực giao hàng. Noben là nhà sản xuất nên báo giá trực tiếp từ nhà máy, có giá riêng cho đại lý. Gọi hoặc nhắn Zalo <a href="tel:${co.hotline.replace(/\D/g, '')}">${esc(co.hotline)}</a> để nhận báo giá trong ngày.</p>` });
  faq.push({ q: `Mua ${p.name} chính hãng ở đâu?`, a: `<p>Mua trực tiếp từ ${esc(co.name)} (nhà máy tại Củ Chi, TP.HCM) qua hotline ${esc(co.hotline)}, Zalo hoặc <a href="/lien-he?san-pham=${p.slug}">form liên hệ</a>, hoặc tại các đại lý thuốc thủy sản phân phối sản phẩm Noben. Noben giao hàng toàn quốc, xem <a href="/chinh-sach/huong-dan-mua-hang">hướng dẫn mua hàng</a> và <a href="/chinh-sach/chinh-sach-van-chuyen">chính sách vận chuyển</a>.</p>` });
  if (related.length) {
    faq.push({ q: `Có thể dùng ${p.name} cùng sản phẩm nào?`, a: `<p>Sản phẩm Noben thường phối hợp cho cùng vấn đề ao nuôi: ${related.slice(0, 4).map((r) => `<a href="${r.url}">${esc(r.name)}</a>`).join(', ')}. Nên hỏi kỹ thuật viên trước khi phối hợp để có liều và thời điểm phù hợp.</p>` });
  }
  return faq;
}

router.get('/san-pham/:slug', (req, res, next) => {
  const gone = c.hiddenProducts[req.params.slug.toLowerCase()];
  if (gone) return res.redirect(301, `/san-pham/nhom/${gone}`);
  const p = c.productBySlug[req.params.slug.toLowerCase()];
  if (!p) return next();
  if (req.params.slug !== p.slug) return res.redirect(301, p.url);
  const desc = `${p.name}: ${p.tagline}. ${p.uses[0] ? p.uses[0].replace(/<[^>]+>/g, '') + ' ' : ''}Sản phẩm của Thủy sản Noben, nhà máy ISO 9001:2015. Gọi ${c.company.hotline} để được tư vấn.`;
  const related = c.relatedProducts(p, 10);
  const solutions = p.symptoms.map((s) => c.symptomBySlug[s] && c.symptomBySlug[s].solution).filter(Boolean);
  const faq = productFaq(p, related, solutions);
  const productReviews = reviews.approved(p.slug).map(reviewView);
  const productLd = withRatings(seo.product(p), productReviews);
  res.render('pages/product', {
    meta: { title: productTitle(p), description: clip(desc, 300), image: p.image && p.image.src, type: 'product' },
    p,
    kind: KIND[p.category] || 'thuốc thủy sản',
    related,
    articles: c.articlesForProduct(p, 3),
    solutions,
    faq,
    reviews: productReviews,
    jsonld: [productLd, crumbs([['Trang chủ', '/'], ['Sản phẩm', '/san-pham'], [p.categoryInfo.name, `/san-pham/nhom/${p.category}`], [p.name, p.url]]), seo.faqPage(faq)].filter(Boolean),
  });
});

// ---------- Landing pages: dealer recruitment and flagship products (for ads and campaigns) ----------
const LANDINGS = require('../content/landings.json');
const DEALER_FAQ = [
  { q: 'Mở đại lý thuốc thủy sản Noben cần vốn bao nhiêu?', a: '<p>Không có mức cố định. Noben tư vấn danh mục nhập hàng ban đầu phù hợp với quy mô cửa hàng và vùng nuôi, có thể bắt đầu với nhóm sản phẩm bán chạy rồi mở rộng dần.</p>' },
  { q: 'Chính sách chiết khấu cho đại lý như thế nào?', a: '<p>Chiết khấu và thưởng doanh số tính theo sản lượng nhập. Phòng kinh doanh gửi bảng giá đại lý và chính sách cụ thể khi gọi lại cho bạn.</p>' },
  { q: 'Noben giao hàng cho đại lý ở tỉnh xa không?', a: '<p>Có. Noben giao hàng toàn quốc từ nhà máy tại Củ Chi, TP.HCM qua nhà xe và đơn vị vận chuyển. Xem thêm <a href="/chinh-sach/chinh-sach-van-chuyen">chính sách vận chuyển</a>.</p>' },
  { q: 'Đại lý có được hỗ trợ kỹ thuật không?', a: '<p>Có. Kỹ thuật viên Noben hướng dẫn đại lý về sản phẩm, phác đồ theo từng bệnh và hỗ trợ tư vấn cho bà con khi ao gặp ca khó.</p>' },
  { q: 'Tôi chưa có cửa hàng, có làm đại lý được không?', a: '<p>Kỹ thuật viên, trang trại lớn hoặc người am hiểu nghề nuôi muốn mở điểm bán đều có thể đăng ký. Noben sẽ trao đổi để chọn hình thức hợp tác phù hợp.</p>' },
];
router.get('/tuyen-dai-ly', (req, res) => {
  const ranges = c.categories.map((cat) => {
    const list = c.products.filter((p) => p.category === cat.slug);
    return { cat, count: list.length, items: list.filter((p) => p.cutout).slice(0, 3) };
  });
  res.render('lp/dealer', {
    meta: {
      preloadImage: '/media/noben-hero-poster.webp',
      title: 'Tuyển đại lý thuốc thủy sản toàn quốc – Giá nhà máy | Noben',
      description: `Noben tuyển đại lý thuốc thủy sản tại các vùng nuôi tôm, cá: nhập hàng giá nhà máy, đủ ${c.products.length} sản phẩm, chiết khấu theo sản lượng, kỹ thuật viên hỗ trợ tại ao, giao hàng toàn quốc.`,
      image: '/images/brand/banner-1.webp',
    },
    productCount: c.products.length,
    ranges,
    film: c.landingVideos['dai-ly'] || null,
    faq: DEALER_FAQ,
    jsonld: [crumbs([['Trang chủ', '/'], ['Hệ thống đại lý', '/dai-ly'], ['Tuyển đại lý', '/tuyen-dai-ly']]), seo.faqPage(DEALER_FAQ), seo.factoryVideo()].filter(Boolean),
  });
});
router.get('/lp/:slug', (req, res, next) => {
  const lp = LANDINGS.find((x) => x.slug === req.params.slug);
  if (lp && lp.type === 'combo') return renderCombo(lp, res);
  const p = lp && c.productBySlug[lp.product];
  if (!p) return next();
  const s = c.solutionBySlug[lp.solution] || null;
  const related = c.relatedProducts(p, 6);
  const solutions = s ? [s] : [];
  const faq = [...productFaq(p, related, solutions).slice(0, 4), ...((s && s.faq) || []).slice(0, 2).map((f) => ({ q: f.q, a: /^</.test(f.a) ? f.a : `<p>${f.a}</p>` }))];
  res.render('lp/product', {
    // Campaign page: indexing stays with the product page, so Google does not see two copies.
    meta: { title: lp.seo_title, description: lp.description, image: p.image && p.image.src, noindex: true },
    lp,
    p,
    s,
    bundle: lp.bundle.map((x) => c.productBySlug[x]).filter(Boolean),
    faq,
  });
});

// Need-based landing (type "combo"): a stage-by-stage protocol across several products, or the OEM offer.
// Protocol pages stay noindex (the knowledge articles rank instead); pages with "index": true go to the sitemap.
function renderCombo(lp, res) {
  const stages = (lp.stages || []).map((s) => ({ ...s, items: s.items.map((it) => ({ ...it, p: c.productBySlug[it.product] })).filter((it) => it.p) }));
  const shots = stages.map((s) => s.items[0] && s.items[0].p).filter((p) => p && p.cutout).slice(0, 3);
  const faq = (lp.faq || []).map((f) => ({ q: f.q, a: /^</.test(f.a) ? f.a : `<p>${f.a}</p>` }));
  res.render('lp/combo', {
    meta: { title: lp.seo_title, description: lp.description, image: (lp.hero_image && lp.hero_image.src) || (shots[0] && shots[0].image && shots[0].image.src), noindex: !lp.index },
    lp,
    stages,
    shots,
    film: c.landingVideos[lp.slug] || null,
    faq,
    jsonld: lp.index ? [crumbs([['Trang chủ', '/'], ['Gia công', '/gia-cong'], [lp.title, `/lp/${lp.slug}`]]), seo.faqPage(faq), seo.factoryVideo()].filter(Boolean) : [],
  });
}

function renderPostList(res, { title, intro, list, path, description }) {
  res.render('pages/posts', {
    meta: { title: `${title} – Thủy sản Noben`, description },
    heading: title,
    intro,
    list,
    jsonld: [crumbs([['Trang chủ', '/'], [title, path]])],
  });
}
function renderKnowledge(req, res, topic) {
  const all = c.knowledge();
  const list = topic ? all.filter((p) => p.topic === topic.slug) : all;
  const title = topic ? `${topic.name} – Kiến thức nuôi tôm` : 'Kiến thức nuôi tôm';
  res.render('pages/knowledge', {
    meta: {
      title: topic ? `${topic.name}: kiến thức nuôi tôm thẻ, tôm sú – Noben` : 'Kiến thức nuôi tôm: bệnh tôm, môi trường ao, kỹ thuật nuôi – Noben',
      description: topic ? topic.blurb : 'Cẩm nang nuôi tôm thẻ chân trắng, tôm sú: nhận biết và xử lý bệnh tôm, quản lý môi trường ao, kỹ thuật nuôi và dinh dưỡng do đội kỹ thuật Noben biên soạn.',
    },
    topic,
    topics: c.TOPICS.map((t) => ({ ...t, count: all.filter((p) => p.topic === t.slug).length })),
    list,
    total: all.length,
    solutions: c.solutions,
    jsonld: [
      crumbs([['Trang chủ', '/'], ['Kiến thức nuôi tôm', '/ky-thuat-nuoi'], ...(topic ? [[topic.name, `/ky-thuat-nuoi/${topic.slug}`]] : [])]),
      seo.itemList(title, list),
    ],
  });
}
router.get('/ky-thuat-nuoi', (req, res) => renderKnowledge(req, res));
router.get('/ky-thuat-nuoi/:topic', (req, res, next) => (c.topicBySlug[req.params.topic] ? renderKnowledge(req, res, c.topicBySlug[req.params.topic]) : next()));
router.get('/tin-tuc', (req, res) =>
  renderPostList(res, {
    title: 'Tin tức',
    intro: 'Hoạt động của Công ty TNHH Noben, nhà máy và đội ngũ.',
    description: 'Tin tức, hình ảnh nhà máy và hoạt động của đội ngũ Công ty TNHH Noben, nhà sản xuất thuốc thủy sản tại Củ Chi, TP.HCM.',
    list: c.posts.filter((p) => p.category === 'cong-ty' || p.category === 'tin-tuc'),
    path: '/tin-tuc',
  })
);

// Solution pages: one per pond problem, the pages people land on when they search for a treatment.
router.get('/giai-phap', (req, res) =>
  res.render('pages/solutions', {
    meta: { title: 'Giải pháp cho ao nuôi tôm theo từng vấn đề – Noben', description: 'Chọn vấn đề ao tôm đang gặp: phân trắng, gan tụy, đen mang, mềm vỏ, khí độc, tảo, thiếu oxy để xem cách xử lý và sản phẩm phù hợp.' },
    solutions: c.solutions.map((s) => ({ ...s, count: c.solutionProducts(s).length })),
    jsonld: [crumbs([['Trang chủ', '/'], ['Giải pháp', '/giai-phap']]), seo.itemList('Giải pháp cho ao nuôi tôm', c.solutions.map((s) => ({ url: s.url, name: s.h1 })))],
  })
);
router.get('/giai-phap/:slug', (req, res, next) => {
  const s = c.solutionBySlug[req.params.slug];
  if (!s) return next();
  const prods = c.solutionProducts(s);
  res.render('pages/solution', {
    meta: { title: s.seo_title, description: s.description },
    s,
    products: prods,
    articles: c.solutionArticles(s),
    others: c.solutions.filter((x) => x !== s),
    jsonld: [crumbs([['Trang chủ', '/'], ['Giải pháp', '/giai-phap'], [s.h1, s.url]]), seo.itemList(s.h1, prods), seo.faqPage(s.faq)].filter(Boolean),
  });
});

router.get('/bai-viet/:slug', (req, res, next) => {
  if (c.MERGED[req.params.slug]) return res.redirect(301, `/bai-viet/${c.MERGED[req.params.slug]}`);
  const post = c.postBySlug[req.params.slug];
  if (!post) return next();
  const isKnowledge = post.category === 'ky-thuat';
  res.render('pages/post', {
    meta: {
      title: post.seoTitle,
      description: clip(post.description || post.excerpt, 300),
      image: post.ogImage || (post.cover && post.cover.src),
      type: 'article',
      published: post.date,
      modified: post.updated,
    },
    post,
    mentioned: c.articleProducts(post),
    more: isKnowledge ? c.relatedArticles(post, 3) : c.posts.filter((p) => p.category === post.category && p !== post).slice(0, 3),
    solutions: (post.symptoms || []).map((s) => c.symptomBySlug[s] && c.symptomBySlug[s].solution).filter(Boolean),
    jsonld: [
      seo.article(post),
      seo.faqPage(post.faq),
      crumbs([['Trang chủ', '/'], [post.section.label, post.section.list], ...(post.topicInfo ? [[post.topicInfo.name, `/ky-thuat-nuoi/${post.topic}`]] : []), [post.title, post.url]]),
    ].filter(Boolean),
  });
});

router.get('/ve-chung-toi', (req, res) =>
  res.render('pages/about', {
    meta: { preloadImage: '/media/noben-hero-poster.webp', title: 'Về Noben – Hơn 22 năm sản xuất thuốc thủy sản', description: c.company.overview[0] },
    gallery: c.gallery,
    productCount: c.products.length,
    jsonld: [org(), crumbs([['Trang chủ', '/'], ['Về chúng tôi', '/ve-chung-toi']]), seo.factoryVideo()],
  })
);
// Brand identity proposal: golden-ratio logo and label system (noindex until the new logo is approved).
router.get('/thuong-hieu', (req, res) =>
  res.render('pages/brand', {
    meta: { title: 'Nhận diện thương hiệu Noben – Logo và nhãn mác theo tỷ lệ vàng', description: 'Logo Noben dựng theo đường xoắn vàng và số π, cùng hệ thống nhãn mác chia theo đoạn vàng.', image: '/images/brand/golden/noben-construction.webp', noindex: true },
    labels: ['g7-phong-va-tri-benh-gan-chet-som', 'caphote', 'aqualac-fs', 'sorbest', 'proticbest', 'super-yucca', 'top-weigh', 'amylac'].map((s) => c.productBySlug[s]).filter(Boolean),
    jsonld: [crumbs([['Trang chủ', '/'], ['Nhận diện thương hiệu', '/thuong-hieu']])],
  })
);
router.get('/chung-nhan', (req, res) =>
  res.render('pages/certificates', {
    meta: { title: 'Chứng nhận ISO 9001:2015 và hợp quy – Noben', description: 'Công ty TNHH Noben đạt chứng nhận ISO 9001:2015 và chứng nhận hợp quy sản phẩm thức ăn thủy sản, thức ăn bổ sung do VinaCert cấp.' },
    certPosts: c.posts.filter((p) => p.category === 'chung-nhan'),
    jsonld: [crumbs([['Trang chủ', '/'], ['Chứng nhận', '/chung-nhan']])],
  })
);
router.get('/bao-gia', (req, res) =>
  res.render('pages/quote', { meta: { title: 'Yêu cầu báo giá – Thủy sản Noben', description: 'Gửi yêu cầu báo giá nhiều sản phẩm Noben cùng lúc, nhận giá nhà máy và chính sách đại lý.', noindex: true } })
);
// Dose calculator: scales the label dose of each product to the visitor's pond (public/js/dose.js).
router.get('/tinh-lieu', (req, res) => {
  const list = c.products.filter((p) => p.dose && p.dose.length);
  const pick = c.productBySlug[String(req.query.sp || '').toLowerCase()];
  res.render('pages/dose', {
    meta: {
      title: 'Tính liều thuốc thủy sản theo diện tích ao – Noben',
      description: 'Nhập diện tích, độ sâu ao hoặc thể tích nước, chọn sản phẩm Noben để tính ngay lượng thuốc, vi sinh, khoáng cần dùng theo nhãn. Có liều trộn thức ăn theo kg thức ăn mỗi ngày.',
    },
    pick: pick && pick.dose && pick.dose.length ? pick : null,
    list,
    data: list.map((p) => ({ s: p.slug, n: p.name, u: p.url, i: p.shot ? p.shot.src : '', d: p.dose })),
    jsonld: [crumbs([['Trang chủ', '/'], ['Sản phẩm', '/san-pham'], ['Tính liều dùng', '/tinh-lieu']])],
  });
});
router.get('/tuyen-dung', (req, res) =>
  res.render('pages/careers', {
    meta: { title: 'Tuyển dụng – Cơ hội nghề nghiệp tại Thủy sản Noben', description: 'Noben tuyển kỹ thuật viên thủy sản, nhân viên kinh doanh phát triển đại lý và nhân sự sản xuất tại nhà máy Củ Chi, TP.HCM. Gửi hồ sơ ứng tuyển trực tuyến.' },
    jsonld: [crumbs([['Trang chủ', '/'], ['Tuyển dụng', '/tuyen-dung']])],
  })
);
router.get('/gia-cong', (req, res) =>
  res.render('pages/oem', {
    meta: { title: 'Gia công thuốc thủy sản, chế phẩm sinh học – Noben', description: 'Noben nhận gia công thành phẩm, bán thành phẩm thuốc thủy sản, tư vấn thành lập công ty và đăng ký lưu hành sản phẩm.' },
    jsonld: [crumbs([['Trang chủ', '/'], ['Gia công', '/gia-cong']]), seo.factoryVideo()],
  })
);
// Video gallery: every film with VideoObject data for Google Video.
const isoDur = (sec) => `PT${Math.round(sec)}S`;
const videoObject = (v) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: v.name,
  description: v.description,
  thumbnailUrl: [seo.abs(v.poster), seo.abs(v.verticalPoster || v.poster)],
  contentUrl: seo.abs(v.mp4),
  uploadDate: `${v.uploadDate}T08:00:00+07:00`,
  duration: isoDur(v.duration),
  inLanguage: 'vi',
  publisher: { '@type': 'Organization', name: c.company.legal, logo: { '@type': 'ImageObject', url: seo.abs('/images/brand/logo-noben.png') } },
});
router.get('/video', (req, res) =>
  res.render('pages/videos', {
    meta: {
      title: 'Video sản phẩm, phác đồ nuôi tôm – Thủy sản Noben',
      description: `${c.videos.length} video ngắn về sản phẩm Noben, phác đồ ao bạt mật độ cao, phòng bệnh mùa mưa, gia công OEM và tuyển đại lý. Xem trực tuyến hoặc tải bản dọc 9:16.`,
      image: c.videos[0] && c.videos[0].poster,
    },
    videos: c.videos,
    jsonld: [crumbs([['Trang chủ', '/'], ['Video', '/video']]), ...c.videos.map(videoObject)].filter(Boolean),
  })
);

router.get('/lien-he', (req, res) => {
  const product = c.productBySlug[req.query['san-pham']];
  res.render('pages/contact', {
    meta: { title: 'Liên hệ – Thủy sản Noben', description: `Gọi ${c.company.hotline} hoặc để lại lời nhắn, kỹ thuật viên Noben sẽ gọi lại tư vấn miễn phí.` },
    prefill: { product: product ? product.name : '', need: product ? 'Mua sản phẩm' : String(req.query['nhu-cau'] || '') },
    needs: leads.NEEDS,
    sent: req.query.da_gui === '1',
    errors: {},
    values: {},
    jsonld: [org()],
  });
});
router.get('/chinh-sach/:slug', (req, res, next) => {
  const page = c.pages[req.params.slug];
  if (!page) return next();
  const fill = (s) => policies.fill(s, c.company, SITE_URL);
  const list = Object.entries(c.pages).sort((a, b) => (a[1].order || 99) - (b[1].order || 99));
  res.render('pages/policy', {
    meta: { title: `${page.title} – Thủy sản Noben`, description: policies.fillText(page.description || `${page.title} khi mua hàng tại ${c.company.legal}.`, c.company, SITE_URL) },
    page: { ...page, body: fill(page.body) },
    slug: req.params.slug,
    policies: Object.fromEntries(list),
    jsonld: [crumbs([['Trang chủ', '/'], ['Chính sách', '/chinh-sach/huong-dan-mua-hang'], [page.title, `/chinh-sach/${req.params.slug}`]])],
  });
});

// ---------- Contact form ----------
// Website chat assistant (streams plain text).
router.post('/api/chat', (req, res, next) => {
  if (!auth.sameOrigin(req)) return res.status(403).json({ error: 'Yêu cầu không hợp lệ.' });
  chat.handle(req, res).catch(next);
});

router.post('/lien-he', async (req, res, next) => {
  try {
    const wantsJson = (req.get('accept') || '').includes('application/json');
    const done = req.body.lang === 'en' ? '/en/contact?sent=1' : '/lien-he?da_gui=1';
    if (req.body.website) return wantsJson ? res.json({ ok: true }) : res.redirect(303, done); // honeypot
    // Time trap: the page script stamps the form when it loads; bots post within a second or two.
    const t = Number(req.body.t);
    if (t && Date.now() - t < 2500) return wantsJson ? res.json({ ok: true }) : res.redirect(303, done);
    if (leads.throttled(req.ip)) {
      const msg = 'Bạn đã gửi nhiều lần liên tiếp. Vui lòng gọi hotline hoặc thử lại sau 10 phút.';
      return wantsJson ? res.status(429).json({ ok: false, message: msg }) : res.status(429).send(msg);
    }
    const { lead, errors } = leads.validate(req.body);
    if (Object.keys(errors).length) {
      if (wantsJson) return res.status(422).json({ ok: false, errors });
      if (req.body.lang === 'en') return res.redirect(303, '/en/contact');
      return res.status(422).render('pages/contact', {
        meta: { title: 'Liên hệ – Thủy sản Noben', noindex: true },
        prefill: {},
        needs: leads.NEEDS,
        sent: false,
        errors,
        values: lead,
      });
    }
    // Uptime monitor (scripts/monitor.js): full validation, nothing saved, mailed or forwarded.
    if (req.get('x-noben-dry-run') === '1') return res.json({ ok: true, dryRun: true });
    await leads.save(lead, { page: String(req.body.page || req.get('referer') || '').slice(0, 200), ip: req.ip });
    return wantsJson ? res.json({ ok: true }) : res.redirect(303, done);
  } catch (err) {
    next(err);
  }
});


// ---------- Đại lý ----------
const PER_PAGE = 24;
function renderDealers(req, res, province) {
  const q = String(req.query.q || '').trim().slice(0, 80);
  const page = Math.max(1, parseInt(req.query.trang, 10) || 1);
  const all = dealers.search({ q, province: province ? province.slug : '' });
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const list = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const where = province ? ` tại ${province.name}` : '';
  const base = province ? `/dai-ly/tinh/${province.slug}` : '/dai-ly';
  res.render('pages/dealers', {
    meta: {
      title: province ? `Đại lý thuốc thủy sản Noben tại ${province.name}` : 'Hệ thống đại lý thuốc thủy sản Noben toàn quốc',
      description: province
        ? `Danh sách ${province.count} đại lý phân phối thuốc thủy sản Noben tại ${province.name}: địa chỉ, số điện thoại, chỉ đường. Mua chính hãng, giá nhà máy, có kỹ thuật viên hỗ trợ.`
        : 'Tìm đại lý thuốc thủy sản Noben gần ao nuôi của bạn theo tỉnh, thành: địa chỉ, điện thoại, chỉ đường. Đăng ký làm đại lý phân phối sản phẩm Noben.',
      noindex: Boolean(q) || page > 1,
    },
    province, q, page, pages, base, list, total: all.length, where,
    provinces: dealers.provinces(), totalDealers: dealers.dealers.length,
    jsonld: [crumbs([['Trang chủ', '/'], ['Đại lý', '/dai-ly'], ...(province ? [[province.name, base]] : [])])],
  });
}
router.get('/dai-ly', (req, res) => {
  if (req.query.tinh && dealers.provinceBySlug(req.query.tinh)) {
    const qs = req.query.q ? `?q=${encodeURIComponent(req.query.q)}` : '';
    return res.redirect(302, `/dai-ly/tinh/${req.query.tinh}${qs}`);
  }
  renderDealers(req, res, null);
});
router.get('/dai-ly/tinh/:slug', (req, res, next) => {
  const p = dealers.provinceBySlug(req.params.slug);
  return p ? renderDealers(req, res, p) : next();
});
router.get('/dai-ly/:slug', (req, res, next) => {
  const d = dealers.bySlug[req.params.slug];
  if (!d) return next();
  const full = [d.address, d.district, d.province].filter(Boolean).join(', ');
  res.render('pages/dealer', {
    meta: {
      title: `${d.name}${d.province ? ' – đại lý Noben tại ' + d.province : ' – đại lý Noben'}`,
      description: `${d.name}, đại lý thuốc thủy sản Noben${d.province ? ' tại ' + d.province : ''}${full ? ': ' + full : ''}${d.phone ? '. Điện thoại ' + d.phone : ''}. Mua sản phẩm Noben chính hãng, được kỹ thuật viên hỗ trợ.`,
    },
    d, full, related: dealers.related(d, 6),
    jsonld: [
      {
        '@context': 'https://schema.org', '@type': 'Store', name: d.name, url: SITE_URL + d.url,
        ...(d.phone ? { telephone: d.phone } : {}),
        address: { '@type': 'PostalAddress', streetAddress: d.address || undefined, addressLocality: d.district || undefined, addressRegion: d.province || undefined, addressCountry: 'VN' },
        brand: { '@type': 'Brand', name: 'Noben' },
        parentOrganization: { '@id': seo.SITE_URL + '/#organization' },
      },
      crumbs([['Trang chủ', '/'], ['Đại lý', '/dai-ly'], ...(d.province ? [[d.province, `/dai-ly/tinh/${d.provinceSlug}`]] : []), [d.name, d.url]]),
    ],
  });
});

// Form submissions for the signed-in admin (basic auth also accepted): filters, quick stats, CSV, follow-up status.
const vnDay = (iso) => new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
async function filteredLeads(req) {
  const st = await leads.statuses();
  const all = (await leads.list()).map((l) => ({ ...l, status: st[l.id] || 'Mới', day: vnDay(l.at) }));
  const f = {};
  for (const k of ['need', 'source', 'landing', 'status', 'from', 'to']) f[k] = String(req.query[k] || '').slice(0, 120);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.from)) f.from = '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.to)) f.to = '';
  const rows = all.filter((l) => (!f.need || l.need === f.need) && (!f.source || l.source === f.source) && (!f.landing || l.landing === f.landing) && (!f.status || l.status === f.status) && (!f.from || l.day >= f.from) && (!f.to || l.day <= f.to));
  return { all, rows, f };
}
const countBy = (rows, key) => Object.entries(rows.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
const adminOk = (req) => auth.isAdmin(req) || auth.basicAuthOk(req);
router.get('/quan-tri/lien-he', async (req, res) => {
  if (!adminOk(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/lien-he');
  const { all, rows, f } = await filteredLeads(req);
  const today = vnDay(new Date().toISOString());
  const days = [];
  for (let i = 29; i >= 0; i--) days.push(new Date(Date.parse(today + 'T00:00:00Z') - i * 864e5).toISOString().slice(0, 10));
  const perDay = Object.fromEntries(countBy(rows, 'day'));
  const daily = days.map((d) => ({ d, n: perDay[d] || 0 })).reverse();
  res.render('pages/admin-leads', {
    meta: { title: 'Khách liên hệ', noindex: true },
    leads: rows,
    total: all.length,
    f,
    query: new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString(),
    options: { need: leads.NEEDS, source: countBy(all, 'source').map((x) => x[0]), landing: countBy(all, 'landing').map((x) => x[0]), status: leads.STATUSES },
    stats: {
      d7: daily.slice(0, 7).reduce((a, x) => a + x.n, 0),
      d30: daily.reduce((a, x) => a + x.n, 0),
      daily,
      max: Math.max(1, ...daily.map((x) => x.n)),
      bySource: countBy(rows, 'source'),
      byLanding: countBy(rows, 'landing').slice(0, 12),
      byStatus: countBy(rows, 'status'),
    },
    saved: req.query.saved === '1',
    mailEnabled: leads.mailEnabled(),
  });
});
router.get('/quan-tri/lien-he.csv', async (req, res) => {
  if (!adminOk(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/lien-he');
  const { rows } = await filteredLeads(req);
  const cell = (v) => {
    let t = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; // stop Excel from running formulas
    return '"' + t.replace(/"/g, '""') + '"';
  };
  const head = ['Thời gian', 'Họ tên', 'Điện thoại', 'Tỉnh/thành', 'Nhu cầu', 'Sản phẩm', 'Lời nhắn', 'Trạng thái', 'Nguồn', 'Chiến dịch', 'Trang gửi'];
  const lines = rows.map((l) => [new Date(l.at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), l.name, l.phone, l.province, l.need, l.product, l.message, l.status, l.source, l.campaign, l.landing].map(cell).join(','));
  res
    .set('Content-Type', 'text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="khach-lien-he-${vnDay(new Date().toISOString())}.csv"`)
    .set('Cache-Control', 'private, no-store')
    .send('\uFEFF' + [head.map(cell).join(','), ...lines].join('\r\n'));
});
router.post('/quan-tri/lien-he/trang-thai', async (req, res, next) => {
  try {
    const json = /json/.test(req.get('accept') || '');
    if (!auth.isAdmin(req)) return json ? res.status(401).json({ ok: false, message: 'Phiên đăng nhập đã hết.' }) : res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/lien-he');
    if (!auth.sameOrigin(req)) return res.status(403).json({ ok: false, message: 'Yêu cầu không hợp lệ.' });
    const ok = await leads.setStatus(req.body.id, req.body.status);
    if (json) return res.status(ok ? 200 : 400).json({ ok });
    const back = String(req.body.back || '').replace(/[^\w=&%.+-]/g, '');
    res.redirect(303, '/quan-tri/lien-he?' + (back ? back + '&' : '') + 'saved=1');
  } catch (err) {
    next(err);
  }
});

// ---------- Đánh giá của khách hàng (/danh-gia) và lịch chăm sóc tôm (/lich-cham-soc) ----------
const reviews = require('./reviews');
const reviewView = (r) => ({ ...r, productInfo: c.productBySlug[r.product] || null, photoUrls: (r.photos || []).map((n) => `/anh-danh-gia/${n}`) });
// Product schema gets AggregateRating/Review only when real approved reviews exist.
function withRatings(ld, list) {
  const sum = reviews.summary(list);
  if (!sum) return ld;
  return {
    ...ld,
    aggregateRating: { '@type': 'AggregateRating', ratingValue: sum.avg, reviewCount: sum.count, bestRating: 5, worstRating: 1 },
    review: list.slice(0, 5).map((r) => ({ '@type': 'Review', author: { '@type': 'Person', name: r.display }, datePublished: (r.approvedAt || r.at).slice(0, 10), reviewRating: { '@type': 'Rating', ratingValue: r.stars, bestRating: 5, worstRating: 1 }, reviewBody: r.text })),
  };
}
function renderReviewPage(req, res, extra = {}) {
  const pick = c.productBySlug[String(req.query.sp || extra.values?.product || '').toLowerCase()] || null;
  const list = reviews.approved().map(reviewView);
  res.status(extra.status || 200).render('pages/reviews', {
    meta: {
      title: 'Đánh giá sản phẩm Noben từ bà con nuôi tôm và đại lý',
      description: 'Bà con nuôi tôm và đại lý đã dùng sản phẩm Noben chia sẻ kết quả thực tế tại ao. Gửi đánh giá của bạn để giúp người nuôi khác chọn đúng sản phẩm.',
      noindex: Boolean(req.query.sp || req.query.da_gui),
    },
    pick,
    list,
    sum: reviews.summary(list),
    groups: c.categories.map((cat) => ({ name: cat.name, items: c.products.filter((p) => p.category === cat.slug) })),
    salutes: reviews.SALUTES,
    roles: reviews.ROLES,
    maxPhotos: reviews.MAX_PHOTOS,
    sent: req.query.da_gui === '1',
    errors: extra.errors || {},
    values: extra.values || {},
    jsonld: [crumbs([['Trang chủ', '/'], ['Đánh giá', '/danh-gia']])],
  });
}
router.get('/danh-gia', (req, res) => renderReviewPage(req, res));
router.post('/danh-gia', express.raw({ type: 'multipart/form-data', limit: '12mb' }), async (req, res, next) => {
  try {
    const json = (req.get('accept') || '').includes('application/json');
    const isMultipart = Buffer.isBuffer(req.body);
    const { fields, files } = isMultipart ? reviews.parseMultipart(req.body, req.get('content-type')) : { fields: req.body || {}, files: [] };
    const sp = c.productBySlug[fields.product] ? fields.product : '';
    const done = `/danh-gia?da_gui=1${sp ? '&sp=' + sp : ''}`;
    const quiet = () => (json ? res.json({ ok: true }) : res.redirect(303, done));
    if (!auth.sameOrigin(req)) return res.status(403).json({ ok: false, message: 'Yêu cầu không hợp lệ.' });
    if (fields.website) return quiet(); // honeypot
    const t = Number(fields.t);
    if (!t || Date.now() - t < 4000) return quiet(); // time trap: bots post within seconds or skip the page script
    if (reviews.throttled(req.ip)) {
      const msg = 'Bạn đã gửi nhiều đánh giá liên tiếp. Vui lòng thử lại sau một giờ hoặc nhắn Zalo cho Noben.';
      return json ? res.status(429).json({ ok: false, message: msg }) : res.status(429).send(msg);
    }
    const { review, errors } = reviews.validate(fields, (s) => Boolean(c.productBySlug[s]));
    if (Object.keys(errors).length) {
      if (json) return res.status(422).json({ ok: false, errors });
      return renderReviewPage(req, res, { status: 422, errors, values: review });
    }
    if (reviews.looksSpam(review)) return quiet();
    const p = c.productBySlug[review.product];
    await reviews.add(review, files.filter((f) => f.name === 'photos'), { ip: req.ip, productName: p ? p.name : 'Khác', adminUrl: `${SITE_URL}/quan-tri/danh-gia` });
    return quiet();
  } catch (err) {
    if (err.type === 'entity.too.large') return res.status(413).send('Ảnh quá lớn. Mỗi ảnh tối đa 5 MB.');
    next(err);
  }
});
router.get('/anh-danh-gia/:file', (req, res, next) => {
  const f = reviews.photoPath(req.params.file);
  if (!f || !(reviews.isApprovedPhoto(req.params.file) || adminOk(req))) return next();
  res.set('Cache-Control', reviews.isApprovedPhoto(req.params.file) ? 'public, max-age=2592000' : 'private, no-store');
  res.sendFile(f, (err) => err && next());
});
router.get('/quan-tri/danh-gia', (req, res) => {
  if (!adminOk(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/danh-gia');
  const list = reviews.listAll().map(reviewView);
  res.render('pages/admin-reviews', {
    meta: { title: 'Duyệt đánh giá', noindex: true },
    list,
    pending: list.filter((r) => r.status === 'pending').length,
    products: c.products.map((p) => ({ slug: p.slug, name: p.name })),
    saved: String(req.query.saved || ''),
  });
});
router.post('/quan-tri/danh-gia', async (req, res, next) => {
  try {
    if (!auth.isAdmin(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/danh-gia');
    if (!auth.sameOrigin(req)) return res.status(403).send('Yêu cầu không hợp lệ.');
    const id = String(req.body.id || '');
    const act = String(req.body.action || '');
    const ok = act === 'delete' ? await reviews.remove(id) : await reviews.setStatus(id, act === 'approve' ? 'approved' : 'pending');
    res.redirect(303, `/quan-tri/danh-gia?saved=${ok ? act : 'fail'}`);
  } catch (err) {
    next(err);
  }
});

// Lịch chăm sóc: bà con nhập ngày thả giống, trang tính tuổi tôm và việc cần làm (public/js/care.js).
const CARE = require('../content/lich-cham-soc.json');
router.get('/lich-cham-soc', (req, res) => {
  const pick = (list) => list.map((x) => c.productBySlug[x]).filter(Boolean);
  const mini = (p) => ({ n: p.name, u: p.url, t: p.tagline, i: p.shot ? p.shot.src : '', d: Boolean(p.dose && p.dose.length), s: p.slug });
  const stages = CARE.stages.map((s) => ({ ...s, products: pick(s.products) }));
  const pond = Object.fromEntries(Object.entries(CARE.pond).map(([k, v]) => [k, { ...v, products: pick(v.products) }]));
  res.render('pages/care', {
    meta: {
      title: 'Lịch chăm sóc tôm thẻ theo ngày tuổi – nhập ngày thả giống',
      description: 'Nhập ngày thả giống và loại ao (bạt hoặc đất) để biết tuổi tôm hôm nay, giai đoạn nuôi, việc cần làm trong tuần và sản phẩm Noben gợi ý cho từng giai đoạn.',
    },
    care: CARE,
    stages,
    pond,
    data: {
      daily: CARE.daily,
      watch: CARE.watch,
      pond: Object.fromEntries(Object.entries(pond).map(([k, v]) => [k, { name: v.name, tasks: v.tasks, products: v.products.map(mini) }])),
      stages: stages.map((s) => ({ id: s.id, from: s.from, to: s.to, name: s.name, goal: s.goal, tasks: s.tasks, article: s.article, articleText: s.articleText, products: s.products.map(mini) })),
    },
    jsonld: [crumbs([['Trang chủ', '/'], ['Kiến thức', '/ky-thuat-nuoi'], ['Lịch chăm sóc tôm', '/lich-cham-soc']])],
  });
});

// ---------- SEO ----------
// IndexNow key file (scripts/indexnow.js submits the sitemap to Bing and other engines).
const INDEXNOW_KEY = (() => { try { return require('fs').readFileSync(require('path').join(__dirname, '..', 'content', 'indexnow-key.txt'), 'utf8').trim(); } catch { return ''; } })();
if (INDEXNOW_KEY) router.get(`/${INDEXNOW_KEY}.txt`, (req, res) => res.type('text/plain').send(INDEXNOW_KEY));

router.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /quan-tri/\nDisallow: /*?q=\nSitemap: ${SITE_URL}/sitemap.xml\n`));
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
router.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    { loc: '/', priority: '1.0', changefreq: 'weekly', images: ['/images/brand/banner-1.webp'] },
    { loc: '/san-pham', priority: '0.9', changefreq: 'weekly' },
    { loc: '/ky-thuat-nuoi', priority: '0.9', changefreq: 'weekly' },
    { loc: '/giai-phap', priority: '0.9', changefreq: 'monthly' },
    ...c.solutions.map((s) => ({ loc: s.url, priority: '0.9', changefreq: 'monthly' })),
    ...c.TOPICS.map((t) => ({ loc: `/ky-thuat-nuoi/${t.slug}`, priority: '0.7', changefreq: 'weekly' })),
    ...c.categories.map((x) => ({ loc: `/san-pham/nhom/${x.slug}`, priority: '0.8', changefreq: 'weekly' })),
    ...c.products.map((p) => ({ loc: p.url, priority: '0.8', changefreq: 'monthly', images: p.images.map((i) => i.src), imageTitle: p.name })),
    ...c.posts.map((p) => ({ loc: p.url, priority: p.category === 'ky-thuat' ? '0.8' : '0.5', changefreq: 'monthly', lastmod: p.updated || p.date, images: [p.ogImage || (p.cover && p.cover.src)].filter(Boolean), imageTitle: p.title })),
    ...['/ve-chung-toi', '/chung-nhan', '/gia-cong', '/lien-he', '/tin-tuc', '/tuyen-dung'].map((loc) => ({ loc, priority: '0.6', changefreq: 'monthly' })),
    ...Object.keys(c.pages).map((s) => ({ loc: `/chinh-sach/${s}`, priority: '0.3', changefreq: 'yearly' })),
    { loc: '/dai-ly', priority: '0.7', changefreq: 'weekly' },
    { loc: '/tuyen-dai-ly', priority: '0.7', changefreq: 'monthly' },
    ...LANDINGS.filter((x) => x.index).map((x) => ({ loc: `/lp/${x.slug}`, priority: '0.7', changefreq: 'monthly', images: x.hero_image ? [x.hero_image.src] : [] })),
    { loc: '/video', priority: '0.7', changefreq: 'monthly', videos: c.videos },
    { loc: '/tinh-lieu', priority: '0.7', changefreq: 'monthly' },
    { loc: '/lich-cham-soc', priority: '0.7', changefreq: 'monthly' },
    { loc: '/danh-gia', priority: '0.6', changefreq: 'weekly' },
    ...dealers.provinces().map((p) => ({ loc: `/dai-ly/tinh/${p.slug}`, priority: '0.6', changefreq: 'weekly' })),
    ...dealers.dealers.map((d) => ({ loc: d.url, priority: '0.4', changefreq: 'monthly' })),
    // English edition
    { loc: '/en', priority: '0.7', changefreq: 'monthly' },
    { loc: '/en/products', priority: '0.6', changefreq: 'monthly' },
    ...en.categories.map((x) => ({ loc: x.url, priority: '0.5', changefreq: 'monthly' })),
    ...en.products.map((p) => ({ loc: p.url, priority: '0.5', changefreq: 'monthly', images: [p.images[0].src], imageTitle: p.name })),
    ...['/en/about', '/en/oem-manufacturing', '/en/contact'].map((loc) => ({ loc, priority: '0.5', changefreq: 'monthly' })),
    ...(() => {
      const k = require('./en-knowledge');
      return [
        ...(k.solutions.length ? [{ loc: '/en/solutions', priority: '0.6', changefreq: 'monthly' }, ...k.solutions.map((s) => ({ loc: s.url, priority: '0.6', changefreq: 'monthly' }))] : []),
        ...(k.articles.length ? [{ loc: '/en/knowledge', priority: '0.6', changefreq: 'weekly' }, ...k.TOPICS.map((t) => ({ loc: `/en/knowledge/topic/${t.slug}`, priority: '0.4', changefreq: 'weekly' }))] : []),
        ...k.articles.map((a) => ({ loc: a.url, priority: '0.6', changefreq: 'monthly', lastmod: a.updated, images: [a.ogImage || (a.cover && a.cover.src)].filter(Boolean), imageTitle: a.title })),
      ];
    })(),
  ];
  const body = entries
    .map((e) => {
      const imgs = (e.images || [])
        .map((i) => `    <image:image><image:loc>${xmlEsc(seo.abs(i))}</image:loc>${e.imageTitle ? `<image:title>${xmlEsc(e.imageTitle)}</image:title>` : ''}</image:image>`)
        .join('\n');
      const vids = (e.videos || [])
        .map((v) => `    <video:video><video:thumbnail_loc>${xmlEsc(seo.abs(v.poster))}</video:thumbnail_loc><video:title>${xmlEsc(v.name)}</video:title><video:description>${xmlEsc(v.description)}</video:description><video:content_loc>${xmlEsc(seo.abs(v.mp4))}</video:content_loc><video:duration>${Math.round(v.duration)}</video:duration><video:publication_date>${v.uploadDate}T08:00:00+07:00</video:publication_date><video:family_friendly>yes</video:family_friendly></video:video>`)
        .join('\n');
      return `  <url>\n    <loc>${xmlEsc(SITE_URL + e.loc)}</loc>\n    <lastmod>${e.lastmod || today}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>${imgs ? '\n' + imgs : ''}${vids ? '\n' + vids : ''}\n  </url>`;
    })
    .join('\n');
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${body}\n</urlset>\n`);
});
router.get('/rss.xml', (req, res) => {
  const items = c
    .knowledge()
    .slice(0, 30)
    .map(
      (p) =>
        `  <item>\n    <title>${xmlEsc(p.title)}</title>\n    <link>${SITE_URL}${p.url}</link>\n    <guid>${SITE_URL}${p.url}</guid>\n    <pubDate>${new Date(p.date + 'T08:00:00+07:00').toUTCString()}</pubDate>\n    <description>${xmlEsc(p.description || p.excerpt)}</description>\n  </item>`
    )
    .join('\n');
  res
    .type('application/rss+xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>Kiến thức nuôi tôm – Thủy sản Noben</title>\n  <link>${SITE_URL}/ky-thuat-nuoi</link>\n  <description>Cẩm nang nuôi tôm, bệnh tôm và quản lý ao nuôi từ đội kỹ thuật Noben</description>\n  <language>vi</language>\n${items}\n</channel>\n</rss>\n`);
});

// ---------- Permanent redirects from the old website's URLs ----------
const REDIRECTS = {
  '/products': '/san-pham',
  '/tu-van-ky-thuat': '/ky-thuat-nuoi',
  '/tong-quan-ve-cong-ty': '/ve-chung-toi',
  '/hinh-anh-cong-ty-noben': '/ve-chung-toi',
  '/chung-nhan-san-pham': '/chung-nhan',
  '/chung-nhan-iso-9001-2015': '/chung-nhan',
  '/chung-nhan-san-pham-thuc-an-thuy-san-thuc-an-bo-sung': '/chung-nhan',
  '/chuyen-tu-van-gia-cong-hang-thanh-pham-ban-thanh-pham-huong-dan-thu-tuc-cap-ma-so-hchq-san-pham': '/gia-cong',
  '/ho-tro-tu-van': '/lien-he',
  '/khach-hang-than-thiet': '/lien-he',
  '/he-thong-thong-minh': '/',
  '/partnersearch': '/dai-ly',
  '/partner': '/dai-ly',
  '/partners': '/dai-ly',
  '/he-thong-dai-ly': '/dai-ly',
  '/dai-ly-noben': '/dai-ly',
};
router.get('/van-de/:sym', (req, res) => {
  const s = c.symptomBySlug[req.params.sym];
  res.redirect(301, s && s.solution ? s.solution.url : '/giai-phap');
});
router.get('/products/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const p = c.productBySlug[slug];
  if (p) return res.redirect(301, p.url);
  return res.redirect(301, c.hiddenProducts[slug] ? `/san-pham/nhom/${c.hiddenProducts[slug]}` : '/san-pham');
});
router.get('/product-categories/:old', (req, res) => {
  const cat = c.categoryByOldSlug[req.params.old];
  res.redirect(301, cat ? `/san-pham/nhom/${cat.slug}` : '/san-pham');
});
router.get(['/partner/:any', '/partners/:any', '/partnersearch/:any', '/dai-ly-noben/:any'], (req, res) => res.redirect(301, '/dai-ly'));
router.get(['/product-tags/:tag', '/tag/:tag'], (req, res) => res.redirect(301, '/san-pham'));
router.get('/:slug', (req, res, next) => {
  const s = req.params.slug;
  if (REDIRECTS['/' + s]) return res.redirect(301, REDIRECTS['/' + s]);
  if (c.MERGED[s]) return res.redirect(301, `/bai-viet/${c.MERGED[s]}`);
  if (c.pages[s]) return res.redirect(301, `/chinh-sach/${s}`);
  if (c.postBySlug[s]) return res.redirect(301, `/bai-viet/${s}`);
  next();
});

module.exports = router;
