'use strict';
// Website chat assistant. Answers shrimp-farming and product questions with the Claude API,
// grounded in the site's own catalog, solution pages and articles. Without ANTHROPIC_API_KEY
// (or when the API is unavailable) it falls back to a keyword search over the same content,
// so the chat box always gives the visitor something useful plus a way to reach a person.
const c = require('./content');

const MODEL = process.env.CHAT_MODEL || 'claude-opus-5-5';
const MAX_TURNS = 16; // messages kept from the conversation
const MAX_CHARS = 1200; // per visitor message
const PER_IP = { limit: 20, windowMs: 10 * 60 * 1000 };
const DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT || 800); // AI answers per day, whole site

let client = null;
let Anthropic = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    Anthropic = require('@anthropic-ai/sdk');
    client = new Anthropic({ maxRetries: 2, timeout: 60 * 1000 });
  }
  return client;
}

const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
const tel = (n) => String(n).replace(/\D/g, '');

// The system prompt is rebuilt only when the content changes (admin edits), so the cached
// prefix stays byte-identical between requests and prompt caching keeps working.
let cached = { key: '', text: '' };
function systemPrompt() {
  const co = c.company;
  const key = [co.hotline, co.zalo, c.products.length, c.solutions.length, c.knowledge().length].join('|');
  if (cached.key === key) return cached.text;

  const cats = Object.fromEntries(c.categories.map((x) => [x.slug, x.name]));
  const products = c.products.map((p) => {
    const lines = [`### ${p.name} — ${cats[p.category] || p.category} — ${p.url}`];
    if (p.tagline) lines.push(`Mô tả: ${strip(p.tagline)}`);
    if (p.uses && p.uses.length) lines.push('Công dụng: ' + p.uses.map(strip).join('; '));
    if (p.dose && p.dose.length) lines.push('Cách dùng (theo nhãn): ' + p.dose.map(strip).join('; '));
    if (p.composition && p.composition.length) lines.push('Thành phần: ' + p.composition.map(strip).join('; '));
    if (p.packaging) lines.push('Quy cách: ' + strip(p.packaging));
    return lines.join('\n');
  }).join('\n\n');

  const solutions = c.solutions.map((s) => {
    const prods = c.solutionProducts(s).map((p) => p.name).join(', ');
    return `### ${s.h1} — ${s.url}\nDấu hiệu: ${(s.signs || []).map(strip).join('; ')}\nCác bước: ${(s.steps || []).map(strip).join('; ')}${prods ? `\nSản phẩm liên quan: ${prods}` : ''}`;
  }).join('\n\n');

  const articles = c.knowledge().map((a) => `- ${a.title} — ${a.url}`).join('\n');

  const text = `Bạn là "Trợ lý Noben", trợ lý trực tuyến trên website thuysannoben.vn của ${co.legal} (${co.english}), nhà sản xuất thuốc và chế phẩm thủy sản hơn ${co.founded_years} năm, nhà máy đạt ISO 9001:2015, địa chỉ ${co.address}.

Người hỏi thường là bà con nuôi tôm, cá hoặc đại lý thuốc thủy sản. Họ hay gõ tiếng Việt không dấu, viết tắt, hoặc mô tả triệu chứng ao nuôi bằng lời quen thuộc của dân nuôi.

## Cách trả lời
- Luôn trả lời bằng tiếng Việt có dấu, xưng "em", gọi khách là "anh/chị", giọng thân thiện, gọn, dễ hiểu với người nuôi.
- Trả lời ngắn: thường 2 đến 6 câu hoặc vài gạch đầu dòng. Chỉ viết dài hơn khi khách hỏi quy trình nhiều bước.
- Định dạng đơn giản: đoạn văn, gạch đầu dòng bắt đầu bằng "- ", in đậm bằng **...**, liên kết dạng [tên trang](/duong-dan). Không dùng bảng, tiêu đề hay biểu tượng cảm xúc.
- Khi nhắc tới sản phẩm, bài viết hay trang giải pháp, gắn liên kết nội bộ đúng đường dẫn có trong dữ liệu bên dưới. Không tự tạo đường dẫn khác.
- Khi khách mô tả triệu chứng, hỏi thêm thông tin còn thiếu nếu cần (tuổi tôm, diện tích hoặc thể tích ao, ao đất hay ao bạt, độ mặn, pH, kiềm, màu nước, tỉ lệ hao) rồi gợi ý hướng xử lý và sản phẩm phù hợp của Noben.

## Giới hạn
- Chỉ dùng thông tin sản phẩm có trong danh mục bên dưới. Liều dùng chỉ nhắc đúng theo nhãn đã ghi; không tự bịa liều, thành phần, chứng nhận hay công dụng.
- Không chẩn đoán chắc chắn bệnh qua vài dòng mô tả. Nói rõ đây là gợi ý ban đầu; ca nặng, tôm chết nhiều hoặc cần phác đồ cụ thể thì mời khách gửi ảnh, video tôm qua Zalo hoặc gọi kỹ thuật viên.
- Giá bán, tồn kho, chiết khấu đại lý, đặt hàng, giao hàng và gia công: không tự báo giá. Mời khách gọi hotline ${co.hotline}, nhắn Zalo ${co.zalo} hoặc để lại thông tin tại [trang liên hệ](/lien-he).
- Chính sách mua hàng, thanh toán, vận chuyển, đổi trả: dẫn tới [trang chính sách](/chinh-sach/huong-dan-mua-hang).
- Không dùng kháng sinh cấm; khuyên khách tuân thủ thời gian ngưng thuốc và quy định của cơ quan thú y.
- Câu hỏi không liên quan tới nuôi trồng thủy sản hoặc Noben: lịch sự từ chối ngắn gọn và quay về chủ đề.
- Nếu khách hỏi, nói rõ bạn là trợ lý tự động (AI), có thể sai sót, và kỹ thuật viên Noben luôn sẵn sàng hỗ trợ trực tiếp.
- Không hỏi hay lưu số tài khoản, mật khẩu hay giấy tờ cá nhân của khách.

## Liên hệ
- Hotline / Zalo kỹ thuật: ${co.hotline} (Zalo: https://zalo.me/${co.zalo})
- Điện thoại khác: ${co.phones.join(', ')}
- Email: ${co.email}
- Trang liên hệ: /lien-he

## Trang giải pháp theo bệnh
${solutions}

## Bài viết kiến thức nuôi tôm
${articles}

## Danh mục sản phẩm Noben (${c.products.length} sản phẩm)
${products}`;

  cached = { key, text };
  return text;
}

// ---- limits --------------------------------------------------------------------------------
const hits = new Map();
let day = { date: '', count: 0 };
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < PER_IP.windowMs);
  if (list.length >= PER_IP.limit) return true;
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < PER_IP.windowMs)) hits.delete(k);
  return false;
}
function overDaily() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (day.date !== today) day = { date: today, count: 0 };
  return day.count >= DAILY_LIMIT;
}

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, m.role === 'user' ? MAX_CHARS : 4000) }))
    .filter((m) => m.content)
    .slice(-MAX_TURNS);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  // The API wants strictly alternating turns; merge any repeats.
  const out = [];
  for (const m of msgs) {
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + m.content;
    else out.push({ ...m });
  }
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  return out;
}

// ---- offline answer --------------------------------------------------------------------------
const STOP = new Set('tom the thi dung thuoc nao cho sao nhu khong lam can cua voi nuoi con duoc minh anh chi hoi giup biet muon xin cam nay may cac nhung rat qua hay'.split(' '));
function offlineAnswer(question) {
  const co = c.company;
  const q = fold(question);
  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const contact = `Anh/chị cần tư vấn ngay, vui lòng gọi **${co.hotline}**, nhắn [Zalo ${co.hotline}](https://zalo.me/${co.zalo}) hoặc để lại thông tin tại [trang liên hệ](/lien-he). Kỹ thuật viên Noben sẽ hỗ trợ miễn phí.`;

  if (/^(xin )?chao|^hello|^hi\b|^alo/.test(q.trim()) && q.length < 30) {
    return `Dạ, em chào anh/chị. Anh/chị cứ mô tả tình trạng ao (tuổi tôm, triệu chứng, màu nước) hoặc hỏi về sản phẩm Noben, em gợi ý ngay ạ.\n\n${contact}`;
  }
  if (/\b(gia|bao gia|dat hang|mua|giao hang|ship|dai ly|chiet khau|gia cong)\b/.test(q)) {
    return `Dạ, giá bán, đặt hàng và chính sách đại lý được báo trực tiếp để đúng số lượng và khu vực của anh/chị.\n\n${contact}\n\nThông tin mua hàng và vận chuyển: [hướng dẫn mua hàng](/chinh-sach/huong-dan-mua-hang).`;
  }

  const score = (text) => {
    const t = fold(text);
    return words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
  };
  const sols = c.solutions
    .map((s) => ({ s, n: score([s.h1, s.description, ...(s.signs || [])].join(' ')) }))
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 2);
  const linked = new Set(sols.length ? c.solutionProducts(sols[0].s).map((p) => p.slug) : []);
  const prods = c.products
    .map((p) => ({ p, n: score(p.name) * 3 + score([p.tagline, ...(p.uses || [])].join(' ')) + (linked.has(p.slug) ? 4 : 0) }))
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4);

  const parts = [];
  if (sols.length) parts.push('Anh/chị có thể xem hướng xử lý tại:\n' + sols.map(({ s }) => `- [${s.h1}](${s.url})`).join('\n'));
  if (prods.length) parts.push('Sản phẩm Noben liên quan:\n' + prods.map(({ p }) => `- [${p.name}](${p.url}): ${strip(p.tagline)}`).join('\n'));
  if (!parts.length) parts.push('Dạ, em chưa tìm thấy nội dung khớp với câu hỏi. Anh/chị có thể xem [giải pháp theo bệnh](/giai-phap), [kiến thức nuôi tôm](/ky-thuat-nuoi) hoặc [danh mục sản phẩm](/san-pham).');
  parts.push(contact);
  return parts.join('\n\n');
}

// ---- route -----------------------------------------------------------------------------------
async function handle(req, res) {
  const messages = cleanMessages(req.body && req.body.messages);
  if (!messages) return res.status(400).json({ error: 'Tin nhắn chưa hợp lệ.' });
  const ip = req.ip || 'unknown';
  if (limited(ip)) {
    return res.status(429).json({ error: `Anh/chị gửi hơi nhanh, vui lòng thử lại sau ít phút hoặc gọi ${c.company.hotline}.` });
  }

  res.set({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Accel-Buffering': 'no',
  });

  const api = getClient();
  const question = messages[messages.length - 1].content;
  if (!api || overDaily()) {
    res.set('X-Chat-Mode', 'offline');
    return res.end(offlineAnswer(question));
  }
  day.count += 1;
  res.set('X-Chat-Mode', 'ai');
  if (res.flushHeaders) res.flushHeaders();

  let wrote = false;
  const stream = api.messages.stream({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: systemPrompt(), cache_control: { type: 'ephemeral' } }],
    messages,
  });
  res.on('close', () => { if (!res.writableEnded) stream.abort(); });
  stream.on('text', (t) => { wrote = true; res.write(t); });

  try {
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') {
      res.write((wrote ? '\n\n' : '') + `Dạ, em không hỗ trợ được nội dung này. Anh/chị vui lòng gọi ${c.company.hotline} để kỹ thuật viên hỗ trợ trực tiếp.`);
    } else if (final.stop_reason === 'max_tokens') {
      res.write(`…\n\nCâu trả lời hơi dài, anh/chị gọi ${c.company.hotline} để được tư vấn chi tiết hơn.`);
    }
    res.end();
  } catch (err) {
    if (res.writableEnded || res.destroyed) return;
    const status = err && err.status;
    console.error('[chat]', status || '', (err && err.message) || err);
    // Nothing streamed yet: answer from the site's own content instead of showing an error.
    if (!wrote) return res.end(offlineAnswer(question));
    res.end(`\n\n(Kết nối bị gián đoạn. Anh/chị vui lòng hỏi lại hoặc gọi ${c.company.hotline}.)`);
  }
}

module.exports = { handle, systemPrompt, offlineAnswer, enabled: () => Boolean(process.env.ANTHROPIC_API_KEY) };
