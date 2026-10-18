/* Motion hero engine (AP + AR landing pages).
   Inside each .hm-scene, an element with data-at="ms" gets data-cls (default "in") added at that time;
   data-rm removes classes, data-text swaps its text, and any [data-count] inside it counts up.
   Scenes loop; pauses off-screen and in background tabs; reduced motion shows each scene's end state. */
(function () {
  var stage = document.querySelector('.hm-stage[data-engine]');
  if (!stage) return;
  var scenes = stage.querySelectorAll('.hm-scene');
  var tabs = stage.querySelectorAll('.hm-tab');
  var bar = stage.querySelector('.hm-progress i');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SCENE_MS = parseInt(stage.getAttribute('data-ms'), 10) || 6500;
  var timers = [], cur = 0, visible = true, running = false;
  var all = stage.querySelectorAll('[data-at], [data-count]');
  Array.prototype.forEach.call(all, function (el) { el._cls = el.className; el._txt = el.textContent; });

  function money(n, el) {
    var cents = el.getAttribute('data-dec') !== '0';
    var pre = el.getAttribute('data-pre'); pre = pre === null ? '$' : pre;
    return pre + n.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }) + (el.getAttribute('data-suf') || '');
  }
  function count(el, ms) {
    var target = parseFloat(el.getAttribute('data-count')), t0 = null;
    if (reduced) { el.textContent = money(target, el); return; }
    (function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / ms, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = money(Math.round(target * e * 100) / 100, el);
      if (p < 1 && running) requestAnimationFrame(step);
    })(performance.now());
  }
  function fire(el) {
    (el.getAttribute('data-rm') || '').split(' ').forEach(function (c) { if (c) el.classList.remove(c); });
    (el.getAttribute('data-cls') || 'in').split(' ').forEach(function (c) { if (c) el.classList.add(c); });
    if (el.hasAttribute('data-text')) el.textContent = el.getAttribute('data-text');
    var counts = el.hasAttribute('data-count') ? [el] : [];
    Array.prototype.push.apply(counts, el.querySelectorAll('[data-count]'));
    counts.forEach(function (c) { count(c, parseInt(c.getAttribute('data-count-ms'), 10) || 1000); });
  }
  function reset(scene) {
    Array.prototype.forEach.call(scene.querySelectorAll('[data-at], [data-count]'), function (el) {
      el.className = el._cls;
      if (el.hasAttribute('data-text') || el.hasAttribute('data-count')) el.textContent = el.hasAttribute('data-count') ? money(0, el) : el._txt;
    });
  }
  function play(i) {
    timers.forEach(clearTimeout); timers = [];
    var s = scenes[i];
    reset(s);
    Array.prototype.forEach.call(scenes, function (x, k) { x.classList.toggle('on', k === i); });
    Array.prototype.forEach.call(tabs, function (t, k) { t.classList.toggle('on', k === i); });
    if (bar) {
      bar.style.transition = 'none'; bar.style.width = reduced ? '100%' : '0';
      void bar.offsetWidth;
      if (!reduced) { bar.style.transition = 'width ' + SCENE_MS + 'ms linear'; bar.style.width = '100%'; }
    }
    var steps = Array.prototype.slice.call(s.querySelectorAll('[data-at]'));
    steps.sort(function (a, b) { return a.getAttribute('data-at') - b.getAttribute('data-at'); });
    steps.forEach(function (el) {
      if (reduced) fire(el);
      else timers.push(setTimeout(function () { fire(el); }, parseInt(el.getAttribute('data-at'), 10)));
    });
    if (!reduced) timers.push(setTimeout(function () { cur = (i + 1) % scenes.length; play(cur); }, SCENE_MS));
  }
  function start() { if (running) return; running = true; play(cur); }
  function stop() { running = false; timers.forEach(clearTimeout); timers = []; }
  Array.prototype.forEach.call(tabs, function (t, k) {
    t.addEventListener('click', function () { cur = k; running = true; play(k); });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0.2 }).observe(stage);
  } else start();
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) start(); });
})();
