'use strict';
// English pages under /en. Same design and data as the Vietnamese site, with translated copy.
const express = require('express');
const c = require('./content');
const en = require('./en');
const seo = require('./seo');

const router = express.Router();
const SITE_URL = (process.env.SITE_URL || 'https://thuysannoben.com').replace(/\/$/, '');

router.use('/en', (req, res, next) => {
  const p = '/en' + (req.path === '/' ? '' : req.path.replace(/\/$/, ''));
  res.locals.lang = 'en';
  res.locals.canonical = SITE_URL + p;
  res.locals.path = p;
  res.locals.alt = { vi: en.viFor(p), en: p };
  res.locals.categories = en.categories;
  res.locals.symptoms = en.symptoms;
  next();
});

const crumbs = (items) => seo.crumbs([['Home', '/en'], ...items]);
const org = () => ({ ...seo.organization(), url: SITE_URL + '/en', description: 'NOBEN CO., LTD manufactures aquaculture health products, probiotics, minerals and feed supplements for shrimp and fish farms in Vietnam.' });
const plain = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const cut = (s, n) => (s.length <= n ? s : s.slice(0, n).replace(/[\s,;:–-]+\S*$/, ''));

router.get('/en', (req, res) => {
  const featured = c.showcase.map((p) => en.productBySlug[p.slug]).filter(Boolean);
  res.render('en/home', {
    meta: {
      title: 'Noben Aquaculture – Shrimp health products, probiotics and minerals made in Vietnam',
      description: `NOBEN CO., LTD manufactures ${en.products.length} aquaculture products for shrimp and fish ponds: probiotics, pond conditioners, minerals and feed supplements. ISO 9001:2015 factory in Ho Chi Minh City, 22+ years of experience, OEM manufacturing available.`,
      image: '/images/brand/banner-1.webp',
    },
    all: en.products,
    featured,
    certificates: c.gallery.certificates.slice(0, 4),
    jsonld: [org(), { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Noben Aquaculture', url: SITE_URL + '/en', inLanguage: 'en' }],
  });
});

function catalog(req, res, cat) {
  const symptom = en.symptoms.some((s) => s.slug === req.query.issue) ? req.query.issue : '';
  const q = String(req.query.q || '').slice(0, 60);
  const category = cat ? cat.slug : en.catBySlug[req.query.category] ? req.query.category : '';
  const list = en.filterProducts({ category, symptom, q });
  const title = cat ? `${cat.name} for shrimp and fish ponds` : 'Aquaculture products for shrimp and fish ponds';
  res.render('en/catalog', {
    meta: {
      title: cat ? `${cat.name} for shrimp ponds – Noben Aquaculture` : 'Products – Shrimp health, probiotics, minerals | Noben',
      description: cat ? cat.blurb : `${en.products.length} Noben aquaculture products: probiotics and pond care, minerals, feed supplements, liver and gut health support for shrimp and fish.`,
      noindex: Boolean(symptom || q),
    },
    heading: title,
    cat,
    all: en.products,
    list,
    filters: { category, symptom, q },
    jsonld: [crumbs([['Products', '/en/products'], ...(cat ? [[cat.name, cat.url]] : [])]), seo.itemList(title, list)],
  });
}
router.get('/en/products', (req, res) => catalog(req, res));
router.get('/en/products/category/:cat', (req, res, next) => (en.catBySlug[req.params.cat] ? catalog(req, res, en.catBySlug[req.params.cat]) : next()));

router.get('/en/products/:slug', (req, res, next) => {
  const p = en.productBySlug[req.params.slug.toLowerCase()];
  if (!p) return next();
  if (req.params.slug !== p.slug) return res.redirect(301, p.url);
  const kind = p.categoryInfo.kind;
  const tag = plain(p.tagline);
  const title = p.name.length > 34 ? `${p.name} | Noben` : `${p.name} – ${cut(tag, 64 - p.name.length - 11)} | Noben`;
  const desc = `${p.name}: ${tag}. ${p.uses[0] ? plain(p.uses[0]) + ' ' : ''}Made by NOBEN CO., LTD in an ISO 9001:2015 factory in Vietnam.`;
  const faq = [];
  if (p.uses.length) faq.push({ q: `What is ${p.name} used for?`, a: `<p>${p.name} is a ${kind} made by Noben. ${tag}.</p><ul>${p.uses.map((u) => `<li>${u}</li>`).join('')}</ul>` });
  if (p.dose.length) faq.push({ q: `How do I use ${p.name}?`, a: `<p>According to the label:</p><ul>${p.dose.slice(0, 4).map((d) => `<li>${d}</li>`).join('')}</ul><p>Rates may be adjusted to pond conditions; contact our technical team for advice.</p>` });
  faq.push({ q: `How can I buy or import ${p.name}?`, a: `<p>Noben sells directly from its factory in Ho Chi Minh City and through dealers across Vietnam. Distributors and importers can request a quotation, specifications and registration documents via the <a href="/en/contact">contact form</a>, email <a href="mailto:${c.company.email}">${c.company.email}</a> or WhatsApp/Zalo ${c.company.hotline}.</p>` });
  const seoProduct = seo.product(c.productBySlug[p.slug]);
  if (seoProduct) Object.assign(seoProduct, { name: p.name, url: SITE_URL + p.url, description: tag, category: p.categoryInfo.name });
  res.render('en/product', {
    meta: { title, description: cut(desc, 300), image: p.image && p.image.src, type: 'product' },
    p,
    related: en.related(p, 10),
    faq,
    jsonld: [seoProduct, crumbs([['Products', '/en/products'], [p.categoryInfo.name, p.categoryInfo.url], [p.name, p.url]]), seo.faqPage(faq)].filter(Boolean),
  });
});

router.get('/en/about', (req, res) =>
  res.render('en/about', {
    meta: { title: 'About Noben – 22+ years manufacturing aquaculture products', description: 'NOBEN CO., LTD has manufactured aquaculture health products, probiotics and feed supplements in Vietnam since 2002. ISO 9001:2015 factory, VinaCert-certified feed supplements.' },
    gallery: c.gallery,
    jsonld: [org(), crumbs([['About', '/en/about']])],
  })
);
router.get('/en/oem-manufacturing', (req, res) =>
  res.render('en/oem', {
    meta: { title: 'OEM & private-label aquaculture product manufacturing – Noben', description: 'Private-label manufacturing of probiotics, minerals, feed supplements and pond treatments in an ISO 9001:2015 factory in Vietnam, with registration support for the Vietnamese market.' },
    jsonld: [crumbs([['OEM manufacturing', '/en/oem-manufacturing']])],
  })
);
router.get('/en/contact', (req, res) =>
  res.render('en/contact', {
    meta: { title: 'Contact Noben – Aquaculture manufacturer in Vietnam', description: `Contact NOBEN CO., LTD for quotations, distribution and OEM manufacturing. Phone/WhatsApp/Zalo ${c.company.hotline}, email ${c.company.email}.` },
    sent: req.query.sent === '1',
    product: en.productBySlug[req.query.product] ? en.productBySlug[req.query.product].name : '',
    jsonld: [crumbs([['Contact', '/en/contact']])],
  })
);

module.exports = router;
