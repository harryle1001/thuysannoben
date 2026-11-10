'use strict';
// Policy pages written in Markdown (content/chinh-sach/*.md). Company details are written as tokens
// such as {{TEN}} or {{KHOI_LIEN_HE}} and filled in from content/company.json when the page is shown,
// so a change of address, tax code or bank account updates every policy at once.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { slugify } = require('./articles');

const dir = path.join(__dirname, '..', 'content', 'chinh-sach');

function parse(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return { meta, body: m ? m[2] : raw };
}

function load() {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const { meta, body } = parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    let html = marked.parse(body, { gfm: true });
    const toc = [];
    html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (all, level, inner) => {
      const id = slugify(inner.replace(/<[^>]+>/g, '').replace(/\{\{[A-Z_]+\}\}/g, ''));
      if (level === '2') toc.push({ id, text: inner.replace(/<[^>]+>/g, '') });
      return `<h${level} id="${id}">${inner}</h${level}>`;
    });
    html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
    out[file.replace(/\.md$/, '')] = {
      title: meta.title,
      description: meta.description || meta.title,
      order: Number(meta.order || 99),
      updated: meta.updated || null,
      body: html,
      toc,
    };
  }
  return out;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const MISSING = 'Đang cập nhật';

function tokens(co, siteUrl) {
  const host = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const v = (x) => (x && String(x).trim() ? String(x).trim() : MISSING);
  const phones = (co.phones || []).join(', ');
  const rows = (pairs) => `<div class="table-wrap"><table class="info-table"><tbody>${pairs.map(([k, val]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(val)}</td></tr>`).join('')}</tbody></table></div>`;
  return {
    TEN: esc(co.legal),
    DIA_CHI: esc(co.address),
    DIEN_THOAI: esc(phones),
    HOTLINE: esc(co.hotline),
    EMAIL: esc(co.email),
    WEBSITE: esc(host),
    MST: esc(v(co.tax_id)),
    KHOI_LIEN_HE: rows([
      ['Đơn vị', co.legal],
      ['Địa chỉ', co.address],
      ['Hotline', co.hotline],
      ['Phòng kinh doanh', phones],
      ['Email', co.email],
      ['Website', host],
    ]),
    KHOI_DOANH_NGHIEP: rows([
      ['Tên doanh nghiệp', co.legal],
      ['Tên tiếng Anh', v(co.english)],
      ['Mã số doanh nghiệp (mã số thuế)', v(co.tax_id)],
      ['Ngày cấp', v(co.reg_date)],
      ['Nơi cấp', v(co.reg_place)],
      ['Người đại diện theo pháp luật', v(co.representative)],
      ['Địa chỉ trụ sở', co.address],
      ['Điện thoại', `${co.hotline}, ${phones}`],
      ['Email', co.email],
      ['Website', host],
    ]),
    KHOI_NGAN_HANG:
      co.bank_account && String(co.bank_account).trim()
        ? rows([
            ['Chủ tài khoản', v(co.bank_holder || co.legal)],
            ['Số tài khoản', co.bank_account],
            ['Ngân hàng', v(co.bank_name)],
          ])
        : `<p>Số tài khoản đứng tên ${esc(co.legal)} được gửi kèm khi nhân viên xác nhận đơn hàng và in trên hóa đơn.</p>`,
  };
}

// Replace {{TOKENS}}. A block token alone in a paragraph replaces the whole paragraph.
function fill(html, co, siteUrl) {
  const t = tokens(co, siteUrl);
  return String(html || '')
    .replace(/<p>\s*\{\{(KHOI_[A-Z_]+)\}\}\s*<\/p>/g, (all, k) => t[k] || '')
    .replace(/\{\{([A-Z_]+)\}\}/g, (all, k) => (k in t ? t[k] : all));
}

const fillText = (s, co, siteUrl) => fill(s, co, siteUrl).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');

module.exports = { load, fill, fillText, MISSING };
