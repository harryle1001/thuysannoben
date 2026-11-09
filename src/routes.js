'use strict';
const express = require('express');
const c = require('./content');
const leads = require('./leads');
const auth = require('./auth');
const seo = require('./seo');

const router = express.Router();
const SITE_URL = (process.env.SITE_URL || 'https://thuysannoben.vn').replace(/\/$/, '');

// Values every template can use.
router.use((req, res, next) => {
  res.locals.company = c.company;
  res.locals.categories = c.categories;
  res.locals.symptoms = c.symptoms;
  res.locals.path = req.path;
  res.locals.siteUrl = SITE_URL;
  res.locals.canonical = SITE_URL + (req.path === '/' ? '/' : req.path.replace(/\/$/, ''));
  res.locals.tel = (n) => 'tel:' + String(n).replace(/\D/g, '');
  res.locals.zaloUrl = 'https://zalo.me/' + c.company.zalo;
  res.locals.img = (i, opts = {}) => {
    if (!i) return '';
    const attrs = Object.entries({ loading: 'lazy', decoding: 'async', ...opts })
      .filter(([, v]) => v !== false && v != null)
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');
    return `<img src="${i.src}" width="${i.w}" height="${i.h}"${attrs}>`;
  };
  res.locals.jsonld = [];

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

// ---------- Admin: sign in, sign out, save on-page edits ----------
const loginAttempts = new Map();
router.get('/quan-tri/dang-nhap', (req, res) => {
  if (auth.isAdmin(req)) return res.redirect(303, '/');
  res.render('pages/admin-login', { meta: { title: 'Đăng nhập quản trị', noindex: true }, error: '', next: safeNext(req.query.next), configured: Boolean(process.env.ADMIN_PASS) });
});
router.post('/quan-tri/dang-nhap', (req, res) => {
  const now = Date.now();
  const recent = (loginAttempts.get(req.ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  const next = safeNext(req.body.next);
  const fail = (msg, code = 401) =>
    res.status(code).render('pages/admin-login', { meta: { title: 'Đăng nhập quản trị', noindex: true }, error: msg, next, configured: Boolean(process.env.ADMIN_PASS) });
  if (recent.length >= 8) return fail('Đăng nhập sai nhiều lần. Thử lại sau 15 phút.', 429);
  if (!auth.sameOrigin(req)) return fail('Yêu cầu không hợp lệ.', 403);
  if (!auth.checkPassword(String(req.body.user || ''), String(req.body.pass || ''))) {
    recent.push(now);
    loginAttempts.set(req.ip, recent);
    return fail('Tên đăng nhập hoặc mật khẩu chưa đúng.');
  }
  loginAttempts.delete(req.ip);
  auth.setSession(req, res);
  res.redirect(303, next);
});
router.get('/quan-tri/dang-xuat', (req, res) => {
  auth.clearSession(res);
  res.redirect(303, '/');
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
      title: 'Thuốc thủy sản Noben – Thuốc nuôi tôm, chế phẩm sinh học, khoáng chất',
      description:
        'Thuốc thủy sản Noben: thuốc trị bệnh tôm, vi sinh xử lý đáy, khoáng chất, men tiêu hóa cho ao tôm, cá. Nhà máy ISO 9001:2015 tại Củ Chi, hơn 15 năm kinh nghiệm, tư vấn kỹ thuật miễn phí.',
      image: '/images/brand/banner-1.webp',
    },
    featured: c.featured,
    articles: knowledge.filter((p) => p.source === 'md').slice(0, 6),
    knowledgeCount: knowledge.length,
    solutions: c.solutions,
    topics: c.TOPICS,
    productCount: c.products.length,
    allProducts: c.products,
    certificates: c.gallery.certificates.slice(0, 4),
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

router.get('/san-pham/:slug', (req, res, next) => {
  const p = c.productBySlug[req.params.slug.toLowerCase()];
  if (!p) return next();
  if (req.params.slug !== p.slug) return res.redirect(301, p.url);
  const desc = `${p.name}: ${p.tagline}. ${p.uses[0] ? p.uses[0].replace(/<[^>]+>/g, '') + ' ' : ''}Sản phẩm của Thủy sản Noben, nhà máy ISO 9001:2015. Gọi ${c.company.hotline} để được tư vấn.`;
  res.render('pages/product', {
    meta: { title: clip(`${p.name}: ${p.tagline}`, 62), description: clip(desc, 300), image: p.image && p.image.src, type: 'product' },
    p,
    related: c.relatedProducts(p),
    articles: c.articlesForProduct(p, 3),
    solutions: p.symptoms.map((s) => c.symptomBySlug[s] && c.symptomBySlug[s].solution).filter(Boolean),
    jsonld: [seo.product(p), crumbs([['Trang chủ', '/'], ['Sản phẩm', '/san-pham'], [p.categoryInfo.name, `/san-pham/nhom/${p.category}`], [p.name, p.url]])],
  });
});

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
    meta: { title: 'Về Noben – Hơn 15 năm sản xuất thuốc thủy sản', description: c.company.overview[0] },
    gallery: c.gallery,
    productCount: c.products.length,
    jsonld: [org(), crumbs([['Trang chủ', '/'], ['Về chúng tôi', '/ve-chung-toi']])],
  })
);
router.get('/chung-nhan', (req, res) =>
  res.render('pages/certificates', {
    meta: { title: 'Chứng nhận ISO 9001:2015 và hợp quy – Noben', description: 'Công ty TNHH Noben đạt chứng nhận ISO 9001:2015 và chứng nhận hợp quy sản phẩm thức ăn thủy sản, thức ăn bổ sung do VinaCert cấp.' },
    certPosts: c.posts.filter((p) => p.category === 'chung-nhan'),
    jsonld: [crumbs([['Trang chủ', '/'], ['Chứng nhận', '/chung-nhan']])],
  })
);
router.get('/gia-cong', (req, res) =>
  res.render('pages/oem', {
    meta: { title: 'Gia công thuốc thủy sản, chế phẩm sinh học – Noben', description: 'Noben nhận gia công thành phẩm, bán thành phẩm thuốc thủy sản, tư vấn thành lập công ty và đăng ký lưu hành sản phẩm.' },
    jsonld: [crumbs([['Trang chủ', '/'], ['Gia công', '/gia-cong']])],
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
  res.render('pages/policy', { meta: { title: `${page.title} – Thủy sản Noben`, description: `${page.title} khi mua thuốc thủy sản, chế phẩm sinh học và khoáng chất tại Công ty TNHH Noben. Hotline ${c.company.hotline}.` }, page, slug: req.params.slug, policies: c.pages });
});

// ---------- Contact form ----------
router.post('/lien-he', async (req, res, next) => {
  try {
    const wantsJson = (req.get('accept') || '').includes('application/json');
    if (req.body.website) return wantsJson ? res.json({ ok: true }) : res.redirect(303, '/lien-he?da_gui=1'); // honeypot
    if (leads.throttled(req.ip)) {
      const msg = 'Bạn đã gửi nhiều lần liên tiếp. Vui lòng gọi hotline hoặc thử lại sau 10 phút.';
      return wantsJson ? res.status(429).json({ ok: false, message: msg }) : res.status(429).send(msg);
    }
    const { lead, errors } = leads.validate(req.body);
    if (Object.keys(errors).length) {
      if (wantsJson) return res.status(422).json({ ok: false, errors });
      return res.status(422).render('pages/contact', {
        meta: { title: 'Liên hệ – Thủy sản Noben', noindex: true },
        prefill: {},
        needs: leads.NEEDS,
        sent: false,
        errors,
        values: lead,
      });
    }
    await leads.save(lead, { page: String(req.body.page || req.get('referer') || '').slice(0, 200), ip: req.ip });
    return wantsJson ? res.json({ ok: true }) : res.redirect(303, '/lien-he?da_gui=1');
  } catch (err) {
    next(err);
  }
});

// Read-only list of form submissions for the signed-in admin (basic auth also accepted).
router.get('/quan-tri/lien-he', async (req, res) => {
  if (!auth.isAdmin(req) && !auth.basicAuthOk(req)) return res.redirect(303, '/quan-tri/dang-nhap?next=/quan-tri/lien-he');
  res.render('pages/admin-leads', { meta: { title: 'Khách liên hệ', noindex: true }, leads: await leads.list(), mailEnabled: leads.mailEnabled() });
});

// ---------- SEO ----------
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
    ...['/ve-chung-toi', '/chung-nhan', '/gia-cong', '/lien-he', '/tin-tuc'].map((loc) => ({ loc, priority: '0.6', changefreq: 'monthly' })),
    ...Object.keys(c.pages).map((s) => ({ loc: `/chinh-sach/${s}`, priority: '0.3', changefreq: 'yearly' })),
  ];
  const body = entries
    .map((e) => {
      const imgs = (e.images || [])
        .map((i) => `    <image:image><image:loc>${xmlEsc(seo.abs(i))}</image:loc>${e.imageTitle ? `<image:title>${xmlEsc(e.imageTitle)}</image:title>` : ''}</image:image>`)
        .join('\n');
      return `  <url>\n    <loc>${xmlEsc(SITE_URL + e.loc)}</loc>\n    <lastmod>${e.lastmod || today}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>${imgs ? '\n' + imgs : ''}\n  </url>`;
    })
    .join('\n');
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`);
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
  '/tuyen-dung': '/lien-he',
  '/khach-hang-than-thiet': '/lien-he',
  '/he-thong-thong-minh': '/',
  '/partnersearch': '/lien-he',
};
router.get('/van-de/:sym', (req, res) => {
  const s = c.symptomBySlug[req.params.sym];
  res.redirect(301, s && s.solution ? s.solution.url : '/giai-phap');
});
router.get('/products/:slug', (req, res, next) => {
  const p = c.productBySlug[req.params.slug.toLowerCase()];
  return p ? res.redirect(301, p.url) : res.redirect(301, '/san-pham');
});
router.get('/product-categories/:old', (req, res) => {
  const cat = c.categoryByOldSlug[req.params.old];
  res.redirect(301, cat ? `/san-pham/nhom/${cat.slug}` : '/san-pham');
});
router.get(['/product-tags/:tag', '/tag/:tag'], (req, res) => res.redirect(301, '/san-pham'));
router.get('/:slug', (req, res, next) => {
  const s = req.params.slug;
  if (REDIRECTS['/' + s]) return res.redirect(301, REDIRECTS['/' + s]);
  if (c.pages[s]) return res.redirect(301, `/chinh-sach/${s}`);
  if (c.postBySlug[s]) return res.redirect(301, `/bai-viet/${s}`);
  next();
});

module.exports = router;
