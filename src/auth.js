'use strict';
// Admin sign-in with a signed, HttpOnly cookie. The password is ADMIN_PASS from the environment.
// When ADMIN_TOTP_SECRET is set, a 6-digit code from an authenticator app is also required.
const crypto = require('crypto');
const totp = require('./totp');

const COOKIE = 'nb_admin';
const PENDING = 'nb_2fa'; // password accepted, waiting for the 6-digit code
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PENDING_MS = 5 * 60 * 1000;
const totpSecret = () => String(process.env.ADMIN_TOTP_SECRET || '').replace(/\s/g, '').toUpperCase();
const totpEnabled = () => Boolean(totpSecret());
// The TOTP secret is part of the signing key: turning 2FA on (or changing it) signs everyone out.
const secret = () => `${process.env.SESSION_SECRET || `noben:${process.env.ADMIN_PASS || ''}`}|${totpSecret()}`;
const sign = (v, purpose = 'session') => crypto.createHmac('sha256', secret()).update(`${purpose}:${v}`).digest('base64url');

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

function validCookie(req, name, purpose) {
  if (!process.env.ADMIN_PASS) return false;
  const [exp, sig] = readCookie(req, name).split('.');
  return Boolean(exp && sig && /^\d+$/.test(exp) && Number(exp) > Date.now() && safeEqual(sig, sign(exp, purpose)));
}
const isAdmin = (req) => validCookie(req, COOKIE, 'session');
const hasPending = (req) => totpEnabled() && validCookie(req, PENDING, '2fa');

function checkPassword(user, pass) {
  const wantUser = process.env.ADMIN_USER || 'admin';
  const wantPass = process.env.ADMIN_PASS;
  return Boolean(wantPass) && safeEqual(user, wantUser) && safeEqual(pass, wantPass);
}

const secureFlag = (req) => (req.secure || process.env.NODE_ENV === 'production' ? '; Secure' : '');
const cookie = (req, name, value, maxAgeMs) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAgeMs / 1000)}${secureFlag(req)}`;

function setSession(req, res) {
  const exp = String(Date.now() + MAX_AGE_MS);
  res.setHeader('Set-Cookie', [cookie(req, COOKIE, `${exp}.${sign(exp, 'session')}`, MAX_AGE_MS), cookie(req, PENDING, '', 0)]);
}

function setPending(req, res) {
  const exp = String(Date.now() + PENDING_MS);
  res.setHeader('Set-Cookie', cookie(req, PENDING, `${exp}.${sign(exp, '2fa')}`, PENDING_MS));
}

function clearSession(res, req = { secure: false }) {
  res.setHeader('Set-Cookie', [cookie(req, COOKIE, '', 0), cookie(req, PENDING, '', 0)]);
}

// A code can be used only once: remember the last accepted time step.
let lastStep = -1;
function checkCode(code, time = Date.now()) {
  if (!totpEnabled()) return true;
  const step = totp.verify(totpSecret(), code, { time });
  if (step < 0 || step <= lastStep) return false;
  lastStep = step;
  return true;
}

// Basic auth is still accepted on admin pages so the old /quan-tri/lien-he bookmark keeps working,
// but not once 2FA is on (it would skip the code).
function basicAuthOk(req) {
  if (totpEnabled()) return false;
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

module.exports = { isAdmin, hasPending, checkPassword, checkCode, setSession, setPending, clearSession, basicAuthOk, sameOrigin, totpEnabled, safeEqual };
