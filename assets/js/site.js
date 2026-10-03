/* Witbound: colours toggle, the small-screen menu, the header's playback line and the
   reading highlight. No tracking, no storage beyond the colour choice. */
(function () {
  var root = document.documentElement;
  /* Two states, light and dark, and light is the page for everyone: the device's own dark
     mode is ignored (Moe, 2 Oct 2026). Dark is only ever chosen here, so only "dark" is
     stored, and going back to light removes the key: someone who never touches the button
     keeps nothing in storage. The inline script in each page's head reads the same key
     before first paint, so these two must agree on 'wb-theme' and on the colours. */
  var KEY = 'wb-theme';
  var NIGHT = '#0F1511';
  var SAGE = '#F3F5F1';

  function isDark() { return root.getAttribute('data-theme') === 'dark'; }

  function setMeta(name, value) {
    var m = document.querySelector('meta[name="' + name + '"]');
    if (m) { m.setAttribute('content', value); }
  }

  /* aria-pressed carries the state for screen readers ("Dark colours, pressed"); the title
     says in words what a tap does, as the icon does. */
  function show(btn, dark) {
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('title', dark ? 'Switch to light colours' : 'Switch to dark colours');
  }

  function apply(dark, btn) {
    if (dark) { root.setAttribute('data-theme', 'dark'); }
    else { root.removeAttribute('data-theme'); }
    setMeta('theme-color', dark ? NIGHT : SAGE);
    setMeta('color-scheme', dark ? 'dark' : 'light');
    show(btn, dark);
    try {
      if (dark) { localStorage.setItem(KEY, 'dark'); }
      else { localStorage.removeItem(KEY); }
    } catch (e) { /* storage blocked: the choice lasts for this page only */ }
  }

  var btn = document.querySelector('.wb-theme');
  if (btn) {
    show(btn, isDark());
    btn.addEventListener('click', function () { apply(!isDark(), btn); });
  }

  var menu = document.querySelector('.wb-menu');
  if (menu) {
    menu.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) { menu.removeAttribute('open'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.hasAttribute('open')) {
        menu.removeAttribute('open');
        var s = menu.querySelector('summary');
        if (s) { s.focus(); }
      }
    });
    document.addEventListener('click', function (e) {
      if (menu.hasAttribute('open') && !menu.contains(e.target)) { menu.removeAttribute('open'); }
    });
  }

  /* The header's bottom edge fills with gilt as the page is read, like a playback line.
     It follows the reader's own scrolling, so it stays on under reduced motion too. */
  var top = document.querySelector('.wb-top');
  if (top) {
    var queued = false;
    var measure = function () {
      queued = false;
      var span = document.documentElement.scrollHeight - window.innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
      top.style.setProperty('--wb-read', p.toFixed(4));
    };
    var queue = function () { if (!queued) { queued = true; window.requestAnimationFrame(measure); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    measure();
  }

  /* The reading highlight draws in the first time a band scrolls into view. Bands already on
     screen at load stay as they are (no flash), and with reduced motion nothing moves. */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var bands = document.querySelectorAll('.wb-band[data-sweep]');
    if (bands.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.remove('wb-wait'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -18% 0px' });
      var below = window.innerHeight * 0.82;
      Array.prototype.forEach.call(bands, function (b) {
        if (b.getBoundingClientRect().top > below) { b.classList.add('wb-wait'); io.observe(b); }
      });
      root.classList.add('wb-sweep');
    }
  }
})();
