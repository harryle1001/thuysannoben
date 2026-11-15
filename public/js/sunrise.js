// Hero sunrise: the rise film plays once, then the same <video> switches to the seamless loop.
// The still behind the video (<picture>) is the risen frame = loop frame 0, so the gap while the loop loads is invisible.
(function () {
  var v = document.querySelector('[data-sunrise]');
  if (!v) return;
  v.addEventListener('ended', function () {
    if (v.loop) return;
    Array.prototype.forEach.call(v.querySelectorAll('source[data-loop]'), function (s) { s.src = s.dataset.loop; });
    v.loop = true;
    v.load();
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  });
})();
