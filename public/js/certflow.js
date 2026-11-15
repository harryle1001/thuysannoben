/* Certificate coverflow: native horizontal scroll (touch swipes stay native and smooth), mouse drag,
   arrows and keyboard. The centred certificate is full size; neighbours shrink by 1/√φ and 1/φ and
   turn away slightly, like papers fanned on a desk. Updated once per frame, only while scrolling. */
(function () {
  'use strict';
  var PHI = 1.61803;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('[data-certflow]'), function (root) {
    var track = root.querySelector('[data-certflow-track]');
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-certflow-item]'));
    var idxEl = root.querySelector('[data-certflow-index]');
    var grpEl = root.querySelector('[data-certflow-group]');
    if (!track || !items.length) return;
    var current = 0, ticking = false, target = -1, targetAt = 0;

    function update() {
      ticking = false;
      var box = track.getBoundingClientRect(), mid = box.left + box.width / 2, best = 0, bestD = 1e9;
      var rects = items.map(function (it) { return it.getBoundingClientRect(); });
      rects.forEach(function (r, i) {
        var c = r.left + r.width / 2, d = (c - mid) / r.width; // distance in card widths
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
        if (reduce) return;
        var a = Math.min(Math.abs(d), 2.618);
        var s = 1 - (1 - 1 / PHI) * Math.min(a, 1) - (a > 1 ? (a - 1) * 0.09 : 0); // 1 → 1/φ … smaller
        items[i].style.transform = 'perspective(1618px) rotateY(' + (Math.max(-1, Math.min(1, d)) * -21).toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
        items[i].style.opacity = (1 - Math.min(a, 2.618) * 0.236).toFixed(3);
        items[i].style.zIndex = String(100 - Math.round(a * 10));
      });
      // while gliding to a clicked target, keep that target as 'current' until we arrive (or 0.85 s pass)
      if (target >= 0) {
        if (best === target || performance.now() - targetAt > 850) target = -1; else best = target;
      }
      if (best !== current || !items[best].classList.contains('is-active')) {
        items.forEach(function (it, i) { it.classList.toggle('is-active', i === best); });
        current = best;
        if (idxEl) idxEl.textContent = String(best + 1);
        if (grpEl) grpEl.textContent = items[best].getAttribute('data-group');
      }
    }
    function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    function go(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      current = i; target = i; targetAt = performance.now(); // quick repeated clicks count from the target
      if (idxEl) idxEl.textContent = String(i + 1);
      if (grpEl) grpEl.textContent = items[i].getAttribute('data-group');
      var it = items[i];
      track.scrollTo({ left: it.offsetLeft - (track.clientWidth - it.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
    track.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    root.querySelector('[data-certflow-prev]').addEventListener('click', function () { go(current - 1); });
    root.querySelector('[data-certflow-next]').addEventListener('click', function () { go(current + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    });

    // mouse drag (touch keeps native scrolling); a drag never opens the lightbox
    var down = false, startX = 0, startL = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; startX = e.clientX; startL = track.scrollLeft;
      track.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      track.scrollLeft = startL - (e.clientX - startX);
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false; track.classList.remove('is-dragging');
      go(current); // settle on the nearest certificate
    });
    track.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; return; }
      // a click on a side certificate brings it to the centre first
      var li = e.target.closest('[data-certflow-item]');
      if (li && !li.classList.contains('is-active')) { e.preventDefault(); e.stopPropagation(); go(items.indexOf(li)); }
    }, true);

    // start a little in, so both directions show there is more to see
    requestAnimationFrame(function () { track.scrollLeft = 0; update(); });
  });
})();
