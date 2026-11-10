/* Product presentation: 3D carousel (drag/swipe), card tilt and drag-to-turn on the product page.
   Pure CSS transforms, no library. Respects prefers-reduced-motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- 3D carousel ---------- */
  $$('[data-showcase]').forEach(function (root) {
    var stage = root.querySelector('[data-sc-stage]');
    var items = $$('[data-sc-item]', root);
    if (!stage || !items.length) return;
    var n = items.length;
    var pos = 0;          // current position, fractional while dragging or animating
    var target = 0;
    var raf = null;
    var info = {
      name: root.querySelector('[data-sc-name]'),
      tagline: root.querySelector('[data-sc-tagline]'),
      cat: root.querySelector('[data-sc-cat]'),
      link: root.querySelector('[data-sc-link]'),
      index: root.querySelector('[data-sc-index]'),
    };
    var shown = -1;

    function spacing() { return clamp(stage.clientWidth * 0.2, 120, 260); }
    // Wrap around so the carousel never runs out of products.
    function offset(i) {
      var d = i - pos;
      d = ((d % n) + n) % n;
      if (d > n / 2) d -= n;
      return d;
    }
    function render() {
      var sp = spacing();
      items.forEach(function (el, i) {
        var d = offset(i);
        var ad = Math.abs(d);
        var x = d * sp * (ad > 1 ? 0.9 : 1);
        var rot = clamp(-d * 38, -62, 62);
        var z = -Math.min(ad, 4) * 140;
        var s = 1 - Math.min(ad, 4) * 0.07;
        el.style.transform = 'translateX(' + x.toFixed(1) + 'px) translateZ(' + z.toFixed(1) + 'px) rotateY(' + rot.toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')';
        el.style.zIndex = String(100 - Math.round(ad * 10));
        el.style.opacity = ad > 3.6 ? '0' : String(1 - Math.max(0, ad - 2.6));
        el.style.filter = ad < 0.5 ? 'none' : 'brightness(' + (1 - Math.min(ad, 3) * 0.12).toFixed(2) + ')';
        el.classList.toggle('is-active', ad < 0.5);
        el.setAttribute('aria-hidden', ad < 0.5 ? 'false' : 'true');
      });
      var active = ((Math.round(pos) % n) + n) % n;
      if (active !== shown) {
        shown = active;
        var it = items[active];
        if (info.name) info.name.textContent = it.getAttribute('data-name');
        if (info.tagline) info.tagline.textContent = it.getAttribute('data-tagline');
        if (info.cat) { info.cat.textContent = it.getAttribute('data-cat'); info.cat.className = 'showcase__cat cat-tag cat-tag--' + it.getAttribute('data-catslug'); }
        if (info.link) info.link.href = it.getAttribute('data-url');
        if (info.index) info.index.textContent = String(active + 1);
      }
    }
    function animate() {
      var diff = target - pos;
      if (Math.abs(diff) < 0.001) { pos = target; render(); raf = null; return; }
      pos += diff * (reduce ? 1 : 0.14);
      render();
      raf = requestAnimationFrame(animate);
    }
    function go(t) { target = t; if (!raf) raf = requestAnimationFrame(animate); }

    // Drag / swipe with mouse, pen or touch.
    var drag = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, start: pos, moved: 0, t: performance.now(), v: 0, lastX: e.clientX, lastT: performance.now(), id: e.pointerId, captured: false };
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      stopAuto();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      // Let vertical swipes scroll the page on phones.
      if (!drag.captured && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { drag = null; go(Math.round(pos)); return; }
      if (!drag.captured && Math.abs(dx) > 4) { drag.captured = true; try { stage.setPointerCapture(e.pointerId); } catch (err) {} stage.classList.add('is-dragging'); }
      if (!drag.captured) return;
      e.preventDefault();
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      var now = performance.now();
      drag.v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
      drag.lastX = e.clientX; drag.lastT = now;
      pos = drag.start - dx / spacing();
      target = pos;
      render();
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      stage.classList.remove('is-dragging');
      var fling = clamp(-drag.v * 6, -3, 3);   // a quick flick travels a few products
      var moved = drag.moved;
      drag = null;
      go(Math.round(pos + fling));
      if (moved > 6) suppressClick = true;
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    // A click on a side product brings it to the centre; a click on the centre one opens it.
    var suppressClick = false;
    items.forEach(function (el, i) {
      el.addEventListener('click', function (e) {
        if (suppressClick) { e.preventDefault(); suppressClick = false; return; }
        var d = offset(i);
        if (Math.abs(d) > 0.5) { e.preventDefault(); go(Math.round(pos + d)); stopAuto(); }
      });
    });
    root.querySelector('[data-sc-prev]').addEventListener('click', function () { stopAuto(); go(Math.round(target) - 1); });
    root.querySelector('[data-sc-next]').addEventListener('click', function () { stopAuto(); go(Math.round(target) + 1); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stopAuto(); go(Math.round(target) - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stopAuto(); go(Math.round(target) + 1); }
      if (e.key === 'Enter') { var a = items[shown] && items[shown].querySelector('a'); if (a) a.click(); }
    });
    // Horizontal trackpad scroll moves the carousel too.
    var wheelT = 0;
    stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      var now = performance.now();
      if (now - wheelT < 260) return;
      wheelT = now; stopAuto();
      go(Math.round(target) + (e.deltaX > 0 ? 1 : -1));
    }, { passive: false });

    // Slow automatic turn until the visitor interacts; pauses when off screen or hovered.
    var auto = null;
    var hovering = false;
    function startAuto() { if (!reduce && !auto) auto = setInterval(function () { if (!hovering && !document.hidden) go(Math.round(target) + 1); }, 4200); }
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
    stage.addEventListener('mouseenter', function () { hovering = true; });
    stage.addEventListener('mouseleave', function () { hovering = false; });
    stage.addEventListener('focus', stopAuto);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) startAuto(); else stopAuto(); }); }, { threshold: 0.3 }).observe(stage);
    }
    window.addEventListener('resize', render);
    root.classList.add('is-ready');
    render();
  });

  /* ---------- Card tilt: product cards lean towards the pointer ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (px * 16).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * 12).toFixed(2) + 'deg');
        el.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---------- Product page: drag to turn the package ---------- */
  $$('[data-spin]').forEach(function (stage) {
    var obj = stage.querySelector('[data-spin-obj]');
    if (!obj) return;
    var ry = 0, rx = 0, vr = 0, raf = null, drag = null;
    function apply() {
      obj.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      obj.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      obj.style.setProperty('--gx', (50 + ry * 1.4).toFixed(1) + '%');
      stage.style.setProperty('--shadow-x', (ry * -0.6).toFixed(1) + 'px');
    }
    // Spring back to the front view after letting go.
    function settle() {
      if (drag) { raf = null; return; }
      vr = vr * 0.86 - ry * 0.06;
      ry += vr;
      rx *= 0.85;
      apply();
      if (Math.abs(ry) < 0.05 && Math.abs(vr) < 0.05 && Math.abs(rx) < 0.05) { ry = 0; rx = 0; apply(); raf = null; return; }
      raf = requestAnimationFrame(settle);
    }
    stage.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, ry: ry, rx: rx, id: e.pointerId, captured: false };
      stage.classList.add('is-touched');
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.captured && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { drag = null; return; }
      if (!drag.captured && Math.abs(dx) > 3) { drag.captured = true; try { stage.setPointerCapture(e.pointerId); } catch (err) {} stage.classList.add('is-dragging'); }
      if (!drag.captured) return;
      e.preventDefault();
      var prev = ry;
      ry = clamp(drag.ry + dx * 0.45, -55, 55);
      rx = clamp(drag.rx - dy * 0.15, -12, 12);
      vr = ry - prev;
      apply();
    });
    function end(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      drag = null;
      stage.classList.remove('is-dragging');
      if (!raf) raf = requestAnimationFrame(settle);
    }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        vr += e.key === 'ArrowLeft' ? -6 : 6;
        if (!raf) raf = requestAnimationFrame(settle);
      }
    });
    // A gentle sway on load shows that the package can be turned.
    if (!reduce) {
      setTimeout(function () { if (!drag && !stage.classList.contains('is-touched')) { vr = 7; if (!raf) raf = requestAnimationFrame(settle); } }, 900);
    }
    apply();
  });
})();
