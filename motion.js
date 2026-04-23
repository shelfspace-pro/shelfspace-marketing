/* ShelfSpace motion-v2 — stagger + count-up
   Scoped under body.motion-v2 so other pages are unaffected.
   Remove the class from <body> to revert instantly. */
(function() {
  'use strict';

  var body = document.body;
  if (!body.classList.contains('motion-v2')) return;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════
     STAGGER — .reveal-stagger parent cascades direct .reveal children
     Children marked .staggered so the page's own reveal observer skips them.
     ══════════════════════════════════════════════════ */
  function initStagger() {
    var roots = document.querySelectorAll('.reveal-stagger');
    if (!roots.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var children = entry.target._staggerChildren || [];
        children.forEach(function(c) { c.classList.add('is-visible'); });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    roots.forEach(function(root) {
      var children = Array.prototype.filter.call(root.children, function(c) {
        return c.classList.contains('reveal');
      });
      if (!children.length) return;

      var delayStep = Math.min(60, Math.floor(500 / children.length));
      children.forEach(function(child, i) {
        child.classList.add('staggered');
        if (!prefersReduced) {
          child.style.transitionDelay = (i * delayStep) + 'ms';
        }
      });
      root._staggerChildren = children;
      observer.observe(root);
    });
  }

  /* ══════════════════════════════════════════════════
     COUNT-UP — .countup elements animate from 0 to data-to
     ══════════════════════════════════════════════════ */
  function formatValue(value, format, decimals) {
    switch (format) {
      case 'currency':
        return '$' + Math.round(value).toLocaleString();
      case 'currency-k':
        if (Math.abs(value) >= 1000) {
          var m = value / 1000;
          return '$' + (decimals ? m.toFixed(decimals) : Math.round(m)) + 'M';
        }
        return '$' + (decimals ? value.toFixed(decimals) : Math.round(value)) + 'K';
      case 'percent':
        return (decimals ? value.toFixed(decimals) : Math.round(value)) + '%';
      case 'multiplier':
        return Math.round(value) + 'X';
      case 'comma':
        return Math.round(value).toLocaleString();
      case 'plain':
      default:
        return decimals ? value.toFixed(decimals) : Math.round(value).toString();
    }
  }

  /* expo-out: cubic-bezier(0.16, 1, 0.3, 1) approximation */
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animate(el, from, to, duration, format, decimals) {
    if (el._rafId) cancelAnimationFrame(el._rafId);

    var start = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = easeOut(p);
      var current = from + (to - from) * eased;

      /* Decimals rule: integer-count during sweep, pop decimal at end */
      if (decimals > 0 && (format === 'percent' || format === 'plain')) {
        if (p < 1) {
          el.textContent = formatValue(Math.floor(current), format, 0);
        } else {
          el.textContent = formatValue(to, format, decimals);
        }
      } else {
        el.textContent = formatValue(current, format, decimals);
      }

      if (p < 1) {
        el._rafId = requestAnimationFrame(frame);
      } else {
        el._rafId = null;
      }
    }
    el._rafId = requestAnimationFrame(frame);
  }

  function parseInline(text) {
    var m = (text || '').match(/-?[\d,.]+/);
    if (!m) return 0;
    return parseFloat(m[0].replace(/,/g, ''));
  }

  function durationFor(target) {
    var abs = Math.abs(target);
    if (abs < 100) return 1200;
    return Math.min(1800, 1400 + 100 * Math.log10(Math.max(abs / 100000, 1)));
  }

  function initCountup() {
    var elements = document.querySelectorAll('.countup');
    if (!elements.length) return;

    /* Threshold matches the page's reveal observer (0.1) so the countup
       starts as the element enters view, not after a visible "pop" of the
       final value. */
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el._fired) return;
        el._fired = true;
        runCountup(el, true);
        observer.unobserve(el);
      });
    }, { threshold: 0.1 });

    elements.forEach(function(el) { observer.observe(el); });
  }

  function runCountup(el, fromZero) {
    var to = parseFloat(el.getAttribute('data-to'));
    if (isNaN(to)) to = parseInline(el.textContent);
    var format = el.getAttribute('data-format') || 'plain';
    var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
    var force = el.getAttribute('data-force') === 'true';

    /* Small-number gate (integers < 100 look silly counting) */
    if (!force && Math.abs(to) < 100 && format !== 'percent' && format !== 'multiplier') {
      el.textContent = formatValue(to, format, decimals);
      return;
    }

    /* Reduced motion — jump to final */
    if (prefersReduced) {
      el.textContent = formatValue(to, format, decimals);
      return;
    }

    /* Multiplier: blur-fade rather than count through meaningless integers */
    if (format === 'multiplier') {
      el.style.transition = 'opacity 0.4s ease-out, filter 0.4s ease-out';
      el.style.opacity = '0';
      el.style.filter = 'blur(4px)';
      setTimeout(function() {
        el.textContent = formatValue(to, format, decimals);
        el.style.opacity = '1';
        el.style.filter = 'blur(0)';
      }, 400);
      return;
    }

    var from = fromZero ? 0 : parseInline(el.textContent);
    animate(el, from, to, durationFor(to), format, decimals);
  }

  /* Public helper — update a countup with new target, animating from current value.
     Used by interactive elements (sliders) without resetting to zero. */
  window.motionV2UpdateCountup = function(el, newTo) {
    if (!el) return;
    var format = el.getAttribute('data-format') || 'plain';
    var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;

    if (prefersReduced || !el._fired) {
      el.setAttribute('data-to', String(newTo));
      if (el._fired) el.textContent = formatValue(newTo, format, decimals);
      return;
    }

    el.setAttribute('data-to', String(newTo));
    var from = parseInline(el.textContent);
    animate(el, from, newTo, 600, format, decimals);
  };

  /* Init — run synchronously. Place this script at the END of <body> so all
     .reveal-stagger / .countup elements are already parsed when we hit here.
     This ordering lets us mark stagger children with .staggered BEFORE the
     page's own reveal observer runs, so it can skip them. */
  initStagger();
  initCountup();
})();
