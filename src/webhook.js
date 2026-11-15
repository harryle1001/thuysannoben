'use strict';
// Optional copy of each new lead to an outside service (e.g. a Google Apps Script that appends a
// row to Google Sheets). Set LEADS_WEBHOOK_URL to turn it on; LEADS_WEBHOOK_SECRET, when set, is
// sent in the X-Noben-Secret header and in the body's "secret" field (Apps Script cannot read
// headers). 5-second timeout, 2 retries; a failure is logged and never affects the form.
const TIMEOUT_MS = 5000;
const RETRIES = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(url, record, { secret, fetchImpl = fetch, retries = RETRIES, delay = 1000 } = {}) {
  const { ip, ...lead } = record; // the visitor's IP stays on the server
  const body = JSON.stringify({ ...lead, ...(secret ? { secret } : {}), source: 'thuysannoben.com' });
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (secret) headers['X-Noben-Secret'] = secret;
  let lastErr = '';
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchImpl(url, { method: 'POST', headers, body, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) return true;
      lastErr = `HTTP ${res.status}`;
    } catch (err) {
      lastErr = err.name === 'TimeoutError' ? 'quá 5 giây' : err.message;
    }
    if (attempt < retries) await sleep(delay * (attempt + 1));
  }
  console.error(`[webhook] không gửi được khách mới (${lastErr})`);
  return false;
}

function send(record) {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return Promise.resolve(null);
  return post(url, record, { secret: process.env.LEADS_WEBHOOK_SECRET }).catch(() => false);
}

module.exports = { send, post };
