'use strict';
// Admin sign-in with a signed, HttpOnly cookie. The password is ADMIN_PASS from the environment.
const crypto = require('crypto');

const COOKIE = 'nb_admin';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const secret = () => process.env.SESSION_SECRET || `noben:${process.env.ADMIN_PASS || ''}`;
const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');

function readCookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function isAdmin(req) {
  if (!process.env.ADMIN_PASS) return false;
  const [exp, sig] = readCookie(req, COOKIE).split('.');
  return Boolean(exp && sig && Number(exp) > Date.now() && safeEqual(sig, sign(exp)));
}

function checkPassword(user, pass) {
  const wantUser = process.env.ADMIN_USER || 'admin';
  const wantPass = process.env.ADMIN_PASS;
  return Boolean(wantPass) && safeEqual(user, wantUser) && safeEqual(pass, wantPass);
}

function setSession(req, res) {
  const exp = String(Date.now() + MAX_AGE_MS);
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE_MS / 1000}${secure}`);
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}

// Basic auth is still accepted on admin pages so the old /quan-tri/lien-he bookmark keeps working.
function basicAuthOk(req) {
  const raw = Buffer.from(String(req.get('authorization') || '').replace(/^Basic /, ''), 'base64').toString();
  const i = raw.indexOf(':');
  return i > -1 && checkPassword(raw.slice(0, i), raw.slice(i + 1));
}

// Blocks cross-site form posts: the request must come from this site's own pages.
function sameOrigin(req) {
  // Modern browsers say where a request came from; our strict referrer policy makes Origin "null" on form posts.
  const site = req.get('sec-fetch-site');
  if (site) return site === 'same-origin' || site === 'none';
  const origin = req.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === req.get('host');
  } catch {
    return false;
  }
}

module.exports = { isAdmin, checkPassword, setSession, clearSession, basicAuthOk, sameOrigin };
