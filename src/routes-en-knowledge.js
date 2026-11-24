'use strict';
// English knowledge articles (/en/knowledge) and solution pages (/en/solutions).
const express = require('express');
const seo = require('./seo');
const k = require('./en-knowledge');

const router = express.Router();
const crumbs = (items) => seo.crumbs([['Home', '/en'], ...items]);
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n).replace(/[\s,;:–-]+\S*$/, ''));

function article(a) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': seo.abs(a.url) },
    headline: a.title.slice(0, 110),
    description: a.description,
    image: [seo.abs(a.ogImage || (a.cover && a.cover.src))].filter(Boolean),
    datePublished: a.date,
    dateModified: a.updated || a.date,
    inLanguage: 'en',
    keywords: a.keywords.join(', ') || undefined,
    articleSection: a.topicInfo.name,
    wordCount: a.words,
    author: { '@type': 'Organization', name: 'Noben technical team', url: seo.abs('/en/about') },
    publisher: { '@id': `${seo.SITE_URL}/#organization`, '@type': 'Organization', name: 'NOBEN CO., LTD', logo: { '@type': 'ImageObject', url: seo.abs('/images/brand/logo-noben.png') } },
  };
}

function knowledge(req, res, topic) {
  const list = topic ? k.articles.filter((a) => a.topic === topic.slug) : k.articles;
  const title = topic ? `${topic.name} – Shrimp farming knowledge` : 'Shrimp farming knowledge';
  res.render('en/knowledge', {
    meta: {
      title: topic ? `${topic.name}: shrimp farming guides – Noben Aquaculture` : 'Shrimp farming knowledge: diseases, water quality, minerals – Noben',
      description: topic ? `${topic.blurb} Practical guides by the Noben technical team for shrimp farmers.` : 'Technical guides for whiteleg and black tiger shrimp farming: AHPND/EMS, EHP, white spot, white feces disease, water quality, minerals and lined ponds, with references.',
    },
    topic,
    topics: k.TOPICS.map((t) => ({ ...t, count: k.articles.filter((a) => a.topic === t.slug).length })).filter((t) => t.count),
    list,
    total: k.articles.length,
    solutions: k.solutions,
    jsonld: [crumbs([['Knowledge', '/en/knowledge'], ...(topic ? [[topic.name, `/en/knowledge/topic/${topic.slug}`]] : [])]), seo.itemList(title, list)],
  });
}
router.get('/en/knowledge', (req, res) => knowledge(req, res));
router.get('/en/knowledge/topic/:topic', (req, res, next) => (k.topicBySlug[req.params.topic] ? knowledge(req, res, k.topicBySlug[req.params.topic]) : next()));
router.get('/en/knowledge/:slug', (req, res, next) => {
  const a = k.articleBySlug[req.params.slug];
  if (!a) return next();
  res.render('en/article', {
    meta: { title: a.seoTitle, description: clip(a.description, 300), image: a.ogImage || (a.cover && a.cover.src), type: 'article', published: a.date, modified: a.updated },
    a,
    mentioned: k.articleProducts(a),
    more: k.relatedArticles(a, 3),
    solutions: k.solutionsFor(a),
    jsonld: [article(a), seo.faqPage(a.faq), crumbs([['Knowledge', '/en/knowledge'], [a.topicInfo.name, `/en/knowledge/topic/${a.topic}`], [a.title, a.url]])].filter(Boolean),
  });
});

router.get('/en/solutions', (req, res) =>
  res.render('en/solutions', {
    meta: { title: 'Shrimp pond health solutions by problem – Noben Aquaculture', description: 'Pick the problem in your shrimp pond: white feces, hepatopancreas, black gill, soft shell, toxic gas, algae, low oxygen. Signs, treatment steps and matching Noben products.' },
    solutions: k.solutions,
    jsonld: [crumbs([['Solutions', '/en/solutions']]), seo.itemList('Shrimp pond health solutions', k.solutions.map((s) => ({ url: s.url, name: s.h1 })))],
  })
);
router.get('/en/solutions/:slug', (req, res, next) => {
  const s = k.solutionBySlug[req.params.slug];
  if (!s) return next();
  const faq = s.faq || [];
  res.render('en/solution', {
    meta: { title: s.seo_title, description: s.description },
    s,
    faq,
    others: k.solutions.filter((x) => x !== s),
    jsonld: [crumbs([['Solutions', '/en/solutions'], [s.h1, s.url]]), seo.itemList(s.h1, s.products), seo.faqPage(faq)].filter(Boolean),
  });
});

module.exports = router;
