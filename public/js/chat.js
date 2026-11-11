// Trợ lý Noben: the chat panel. Streams answers from /api/chat and renders a small, safe
// subset of Markdown (bold, bullet lists, links to this site, Zalo and phone numbers).
(function () {
  'use strict';
  var box = document.querySelector('[data-chatbot]');
  var openBtn = document.querySelector('[data-chat-open]');
  if (!box || !openBtn || !window.fetch) return;

  var log = box.querySelector('[data-chat-log]');
  var form = box.querySelector('[data-chat-form]');
  var input = form.querySelector('textarea');
  var send = form.querySelector('button');
  var chips = box.querySelector('[data-chat-chips]');
  var hotline = box.getAttribute('data-hotline');
  var KEY = 'noben-chat';
  var history = [];
  var busy = false;
  var controller = null;

  function store() {
    try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-20))); } catch (e) { /* private mode */ }
  }
  function restore() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(KEY) || '[]');
      if (Array.isArray(saved)) history = saved.filter(function (m) { return m && typeof m.content === 'string'; });
    } catch (e) { history = []; }
    history.forEach(function (m) { bubble(m.role, m.content); });
    if (history.length) chips.hidden = true;
  }

  function esc(s) {
    return s.replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; });
  }
  function safeUrl(u) {
    if (/^\/(?!\/)/.test(u)) return u;
    if (/^https:\/\/(www\.)?(thuysannoben\.com|zalo\.me)\//.test(u)) return u;
    if (/^(tel|mailto):[\w@.+\-]+$/.test(u)) return u;
    return null;
  }
  function inline(text) {
    var out = esc(text);
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (all, label, url) {
      var u = safeUrl(url.replace(/&amp;/g, '&'));
      if (!u) return label;
      var ext = /^https:/.test(u) && u.indexOf('thuysannoben.com') < 0;
      return '<a href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>';
    });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return out;
  }
  function render(text) {
    var html = '';
    var list = null;
    text.split('\n').forEach(function (line) {
      var t = line.trim();
      var m = /^([-*•]|\d+[.)])\s+(.*)$/.exec(t);
      if (m) {
        var tag = /\d/.test(m[1]) ? 'ol' : 'ul';
        if (list !== tag) { if (list) html += '</' + list + '>'; html += '<' + tag + '>'; list = tag; }
        html += '<li>' + inline(m[2]) + '</li>';
        return;
      }
      if (list) { html += '</' + list + '>'; list = null; }
      if (!t) return;
      html += '<p>' + inline(t.replace(/^#+\s*/, '')) + '</p>';
    });
    if (list) html += '</' + list + '>';
    return html;
  }

  function bubble(role, text) {
    var el = document.createElement('div');
    el.className = 'chatbot__msg chatbot__msg--' + (role === 'user' ? 'user' : 'bot');
    if (role === 'user') el.textContent = text;
    else el.innerHTML = render(text);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function setOpen(open) {
    box.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('chat-open', open);
    if (open) {
      log.scrollTop = log.scrollHeight;
      if (window.matchMedia('(min-width: 761px)').matches) input.focus();
    } else {
      openBtn.focus();
    }
  }

  function grow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    send.disabled = true;
    chips.hidden = true;
    history.push({ role: 'user', content: text });
    bubble('user', text);
    input.value = '';
    grow();

    var el = bubble('bot', '');
    el.classList.add('is-typing');
    el.innerHTML = '<span class="chatbot__typing" aria-label="Đang trả lời"><i></i><i></i><i></i></span>';
    var answer = '';
    var pending = false;
    function paint() {
      pending = false;
      el.innerHTML = render(answer);
      log.scrollTop = log.scrollHeight;
    }

    controller = window.AbortController ? new AbortController() : null;
    try {
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-16) }),
        signal: controller ? controller.signal : undefined,
      });
      if (!res.ok) {
        var err = {};
        try { err = await res.json(); } catch (e) { /* not JSON */ }
        throw new Error(err.error || 'Máy chủ đang bận.');
      }
      if (res.body && res.body.getReader) {
        var reader = res.body.getReader();
        var dec = new TextDecoder();
        for (;;) {
          var chunk = await reader.read();
          if (chunk.done) break;
          answer += dec.decode(chunk.value, { stream: true });
          el.classList.remove('is-typing');
          if (!pending) { pending = true; requestAnimationFrame(paint); }
        }
        answer += dec.decode();
      } else {
        answer = await res.text();
      }
      if (!answer.trim()) throw new Error('Chưa nhận được trả lời.');
      el.classList.remove('is-typing');
      paint();
      history.push({ role: 'assistant', content: answer });
      store();
    } catch (e) {
      if (e && e.name === 'AbortError') { el.remove(); history.pop(); }
      else {
        el.classList.remove('is-typing');
        el.classList.add('chatbot__msg--error');
        el.innerHTML = render((e && e.message ? e.message + ' ' : '') + 'Anh/chị vui lòng thử lại hoặc gọi **' + hotline + '**.');
        history.pop();
      }
    } finally {
      busy = false;
      send.disabled = false;
      controller = null;
    }
  }

  openBtn.addEventListener('click', function () { setOpen(box.hidden); });
  box.querySelector('[data-chat-close]').addEventListener('click', function () { setOpen(false); });
  box.querySelector('[data-chat-reset]').addEventListener('click', function () {
    if (controller) controller.abort();
    history = [];
    store();
    Array.prototype.slice.call(log.children, 1).forEach(function (n) { n.remove(); });
    chips.hidden = false;
    input.focus();
  });
  box.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) ask(b.textContent);
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('input', grow);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); }
  });
  document.querySelectorAll('[data-chat-link]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); setOpen(true); });
  });

  restore();
})();
