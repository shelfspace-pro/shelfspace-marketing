/* Mobile menu enhancements (sitewide). The overlay itself is CSS
   (styles.css § MOBILE MENU) toggled by the hamburger's inline onclick via
   `.mobile-open`; this file adds: product-group accordions, an overview link
   where a group has none, close on link tap / Escape / back-forward cache,
   and aria state. Desktop (>900px) is untouched. */
(function () {
  var mq = window.matchMedia('(max-width: 900px)');
  var links = document.querySelector('.nav-links');
  var burger = document.querySelector('.nav-hamburger');
  if (!links || !burger) return;
  document.documentElement.classList.add('js-nav');

  burger.setAttribute('role', 'button');
  burger.setAttribute('aria-label', 'Menu');
  burger.setAttribute('tabindex', '0');

  function isOpen() { return links.classList.contains('mobile-open'); }
  function sync() { burger.setAttribute('aria-expanded', isOpen() ? 'true' : 'false'); }
  function close() { links.classList.remove('mobile-open'); sync(); }

  new MutationObserver(sync).observe(links, { attributes: true, attributeFilter: ['class'] });
  sync();

  burger.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); burger.click(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { close(); burger.focus(); }
  });
  window.addEventListener('pageshow', close);
  mq.addEventListener && mq.addEventListener('change', function (e) { if (!e.matches) close(); });

  Array.prototype.forEach.call(links.querySelectorAll('.nav-dropdown'), function (group) {
    var toggle = group.querySelector('.nav-dropdown-toggle');
    var menu = group.querySelector('.nav-dropdown-menu');
    if (!toggle || !menu) return;

    // Every group needs a way to its own page once the title becomes a toggle.
    var href = toggle.getAttribute('href');
    if (href && !menu.querySelector('a[href="' + href + '"]')) {
      var label = toggle.childNodes[0] ? toggle.childNodes[0].textContent.trim() : '';
      var ov = document.createElement('a');
      ov.href = href;
      ov.className = 'nav-overview-mobile';
      ov.textContent = 'All ' + label.toLowerCase();
      menu.insertBefore(ov, menu.firstChild);
    }

    var inner = document.createElement('div');
    inner.className = 'nav-acc-inner';
    while (menu.firstChild) inner.appendChild(menu.firstChild);
    menu.appendChild(inner);

    var bar = document.createElement('span');
    bar.className = 'nav-acc-bar';
    bar.setAttribute('aria-hidden', 'true');
    toggle.appendChild(bar);
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', function (e) {
      if (!mq.matches) return;
      e.preventDefault();
      var open = !group.classList.contains('nav-acc-open');
      Array.prototype.forEach.call(links.querySelectorAll('.nav-dropdown.nav-acc-open'), function (g) {
        g.classList.remove('nav-acc-open');
        g.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
      });
      group.classList.toggle('nav-acc-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Open the group you're currently in.
    if (toggle.classList.contains('active') && !links.querySelector('.nav-dropdown.nav-acc-open')) {
      group.classList.add('nav-acc-open');
      toggle.setAttribute('aria-expanded', 'true');
    }
  });

  // Tapping a real destination closes the sheet behind the navigation.
  // A tap inside the open sheet stops here: ~130 pages carry an inline
  // "close mobile nav on any document click" handler, which otherwise shut
  // the whole sheet when you tapped a group's +/- toggle.
  links.addEventListener('click', function (e) {
    if (!mq.matches) return;
    if (isOpen()) e.stopPropagation();
    var a = e.target.closest('a');
    if (!a || a.classList.contains('nav-dropdown-toggle')) return;
    setTimeout(close, 250);
  });
})();
