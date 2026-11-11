'use strict';
// Structured data (schema.org JSON-LD) used across pages. Google reads these to show rich results:
// breadcrumbs, FAQ dropdowns, sitelinks search box, article dates and business details.
const c = require('./content');

const SITE_URL = (process.env.SITE_URL || 'https://thuysannoben.com').replace(/\/$/, '');
const abs = (u) => (!u ? undefined : /^https?:/.test(u) ? u : SITE_URL + u);
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const ORG_ID = `${SITE_URL}/#organization`;

function organization() {
  const co = c.company;
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    '@id': ORG_ID,
    name: co.legal,
    alternateName: ['Thủy sản Noben', 'Noben', 'Thuốc thủy sản Noben'],
    description: co.overview && co.overview[0],
    foundingDate: co.founded_year || undefined,
    url: SITE_URL,
    logo: abs('/images/brand/logo-noben.png'),
    image: abs('/images/brand/banner-1.webp'),
    email: co.email,
    telephone: co.hotline,
    contactPoint: [
      { '@type': 'ContactPoint', telephone: co.hotline, contactType: 'customer support', areaServed: 'VN', availableLanguage: 'Vietnamese' },
      ...co.phones.map((p) => ({ '@type': 'ContactPoint', telephone: p, contactType: 'sales', areaServed: 'VN', availableLanguage: 'Vietnamese' })),
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '228/9 Nguyễn Thị Lắng, Tổ 5, Ấp Phú Lợi A',
      addressLocality: 'Xã Củ Chi',
      addressRegion: 'TP. Hồ Chí Minh',
      addressCountry: 'VN',
    },
    sameAs: [co.messenger && 'https://www.facebook.com/107785190995978'].filter(Boolean),
    knowsAbout: ['thuốc thủy sản', 'thuốc nuôi tôm', 'chế phẩm sinh học', 'khoáng chất cho tôm', 'thức ăn bổ sung thủy sản', 'bệnh tôm'],
  };
}

function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Thủy sản Noben',
    inLanguage: 'vi-VN',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/san-pham?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

const crumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(url) })),
});

function article(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': abs(post.url) },
    headline: post.title.slice(0, 110),
    description: post.description,
    image: [abs(post.ogImage || (post.cover && post.cover.src))].filter(Boolean),
    datePublished: post.date,
    dateModified: post.updated || post.date,
    inLanguage: 'vi-VN',
    keywords: (post.keywords || []).join(', ') || undefined,
    articleSection: post.topicInfo ? post.topicInfo.name : post.section.label,
    wordCount: post.words,
    author: { '@type': 'Organization', name: 'Đội ngũ kỹ thuật Noben', url: abs('/ve-chung-toi') },
    publisher: { '@id': ORG_ID, '@type': 'Organization', name: c.company.legal, logo: { '@type': 'ImageObject', url: abs('/images/brand/logo-noben.png') } },
  };
}

function faqPage(faq) {
  if (!faq || !faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })),
  };
}

function product(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${abs(p.url)}#product`,
    name: p.name,
    description: strip([p.tagline, ...(p.uses || [])].join('. ')).slice(0, 500),
    image: p.images.map((i) => abs(i.src)),
    sku: p.slug.toUpperCase(),
    brand: { '@type': 'Brand', name: 'Noben' },
    manufacturer: { '@id': ORG_ID, '@type': 'Organization', name: c.company.legal },
    category: p.categoryInfo.name,
    audience: { '@type': 'Audience', audienceType: 'Người nuôi tôm, cá và đại lý thuốc thủy sản' },
  };
}

function itemList(name, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(it.url), name: it.name || it.title })),
  };
}

module.exports = { SITE_URL, abs, organization, website, crumbs, article, faqPage, product, itemList };
