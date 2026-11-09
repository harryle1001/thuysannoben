'use strict';
const express = require('express');
const c = require('./content');
const leads = require('./leads');

const router = express.Router();
const SITE_URL = (process.env.SITE_URL || 'https://thuocthuysannoben.com').replace(/\/$/, '');

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
  next();
});

const org = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: c.company.legal,
  alternateName: 'Thủy sản Noben',
  url: SITE_URL,
  logo: SITE_URL + '/images/brand/logo-noben.png',
  email: c.company.email,
  telephone: c.company.hotline,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '228/9 Nguyễn Thị Lắng, Tổ 5, Ấp Phú Lợi, Xã Tân Phú Trung',
    addressLocality: 'Củ Chi',
    addressRegion: 'TP. Hồ Chí Minh',
    addressCountry: 'VN',
  },
});
const crumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + url })),
});

// ---------- Pages ----------
router.get('/', (req, res) => {
  res.render('pages/home', {
    meta: {
      title: 'Thuốc và chế phẩm thủy sản Noben – Nhà máy đạt ISO 9001:2015',
      description:
        'Noben sản xuất thuốc thú y thủy sản, chế phẩm sinh học, khoáng chất và thức ăn bổ sung cho ao tôm, cá. Hơn 15 năm kinh nghiệm, nhà máy tại Củ Chi đạt ISO 9001:2015.',
    },
    featured: c.featured,
    articles: c.posts.filter((p) => p.category === 'ky-thuat').slice(0, 4),
    productCount: c.products.length,
    allProducts: c.products,
    certificates: c.gallery.certificates.slice(0, 4),
    jsonld: [org()],
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
      title: catInfo ? `${catInfo.name} – Thủy sản Noben` : 'Sản phẩm – Thủy sản Noben',
      description: catInfo ? catInfo.blurb : `${c.products.length} sản phẩm thuốc thủy sản Noben: chế phẩm sinh học, khoáng chất, thức ăn bổ sung, đặc trị bệnh tôm cá.`,
      noindex: Boolean(symptom || q),
    },
    heading: title,
    all: c.products,
    list,
    filters: { category: cat, symptom, q },
    lockedCategory: Boolean(category),
    jsonld: [crumbs([['Trang chủ', '/'], ['Sản phẩm', '/san-pham'], ...(catInfo ? [[catInfo.name, `/san-pham/nhom/${cat}`]] : [])])],
  });
}
router.get('/san-pham', (req, res) => renderCatalog(req, res));
router.get('/san-pham/nhom/:cat', (req, res, next) => (c.categoryBySlug[req.params.cat] ? renderCatalog(req, res, req.params.cat) : next()));

router.get('/san-pham/:slug', (req, res, next) => {
  const p = c.productBySlug[req.params.slug.toLowerCase()];
  if (!p) return next();
  if (req.params.slug !== p.slug) return res.redirect(301, p.url);
  const desc = `${p.name}: ${p.tagline}. Sản phẩm của Công ty TNHH Noben, nhà máy đạt ISO 9001:2015.`;
  res.render('pages/product', {
    meta: { title: `${p.name} – ${p.tagline}`.slice(0, 90), description: desc.slice(0, 300), image: p.image && p.image.src, type: 'product' },
    p,
    related: c.relatedProducts(p),
    articles: c.posts.filter((post) => post.category === 'ky-thuat' && c.productsMentioned(post, 20).includes(p)).slice(0, 2),
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.tagline,
        image: p.images.map((i) => SITE_URL + i.src),
        brand: { '@type': 'Brand', name: 'Noben' },
        manufacturer: { '@type': 'Organization', name: c.company.legal },
        category: p.categoryInfo.name,
      },
      crumbs([['Trang chủ', '/'], ['Sản phẩm', '/san-pham'], [p.categoryInfo.name, `/san-pham/nhom/${p.category}`], [p.name, p.url]]),
    ],
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
router.get('/ky-thuat-nuoi', (req, res) =>
  renderPostList(res, {
    title: 'Kỹ thuật nuôi',
    intro: 'Kinh nghiệm phòng và trị bệnh thường gặp trên tôm thẻ, tôm sú do đội kỹ thuật Noben tổng hợp từ ao nuôi thực tế.',
    description: 'Cẩm nang kỹ thuật nuôi tôm: bệnh phân trắng, đốm đen, mềm vỏ, đóng rong, gan tụy và cách xử lý ao nuôi mùa mưa.',
    list: c.posts.filter((p) => p.category === 'ky-thuat'),
    path: '/ky-thuat-nuoi',
  })
);
router.get('/tin-tuc', (req, res) =>
  renderPostList(res, {
    title: 'Tin tức',
    intro: 'Hoạt động của Công ty TNHH Noben, nhà máy và đội ngũ.',
    description: 'Tin tức và hoạt động của Công ty TNHH Noben.',
    list: c.posts.filter((p) => p.category === 'cong-ty' || p.category === 'tin-tuc'),
    path: '/tin-tuc',
  })
);

router.get('/bai-viet/:slug', (req, res, next) => {
  const post = c.postBySlug[req.params.slug];
  if (!post) return next();
  res.render('pages/post', {
    meta: { title: post.title, description: post.excerpt, image: post.cover && post.cover.src, type: 'article' },
    post,
    mentioned: c.productsMentioned(post),
    more: c.posts.filter((p) => p.category === post.category && p !== post).slice(0, 3),
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        datePublished: post.date,
        image: post.cover ? [SITE_URL + post.cover.src] : undefined,
        author: { '@type': 'Organization', name: c.company.legal },
        publisher: { '@type': 'Organization', name: c.company.legal, logo: { '@type': 'ImageObject', url: SITE_URL + '/images/brand/logo-noben.png' } },
      },
      crumbs([['Trang chủ', '/'], [post.section.label, post.section.list], [post.title, post.url]]),
    ],
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
  res.render('pages/policy', { meta: { title: `${page.title} – Thủy sản Noben`, description: page.title }, page, slug: req.params.slug, policies: c.pages });
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

// Read-only list of form submissions, protected by HTTP basic auth (ADMIN_USER / ADMIN_PASS).
router.get('/quan-tri/lien-he', async (req, res) => {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASS;
  const [u, p] = Buffer.from((req.get('authorization') || '').replace(/^Basic /, ''), 'base64').toString().split(':');
  if (!pass || u !== user || p !== pass) {
    res.set('WWW-Authenticate', 'Basic realm="Noben"');
    return res.status(401).send(pass ? 'Cần đăng nhập.' : 'Chưa đặt ADMIN_PASS trong biến môi trường.');
  }
  res.render('pages/admin-leads', { meta: { title: 'Khách liên hệ', noindex: true }, leads: await leads.list(), mailEnabled: leads.mailEnabled() });
});

// ---------- SEO ----------
router.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /quan-tri/\nSitemap: ${SITE_URL}/sitemap.xml\n`));
router.get('/sitemap.xml', (req, res) => {
  const urls = [
    '/', '/san-pham', '/ky-thuat-nuoi', '/tin-tuc', '/ve-chung-toi', '/chung-nhan', '/gia-cong', '/lien-he',
    ...c.categories.map((x) => `/san-pham/nhom/${x.slug}`),
    ...c.products.map((p) => p.url),
    ...c.posts.map((p) => p.url),
    ...Object.keys(c.pages).map((s) => `/chinh-sach/${s}`),
  ];
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`)
      .join('\n')}\n</urlset>\n`
  );
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
