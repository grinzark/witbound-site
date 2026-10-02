/* Witbound: colours toggle and the small-screen menu. No tracking, no storage beyond the colour choice. */
(function () {
  var root = document.documentElement;
  /* Two states, light and dark, and light is the page for everyone: the device's own dark
     mode is ignored (Moe, 2 Oct 2026). Dark is only ever chosen here, so only "dark" is
     stored, and going back to light removes the key: someone who never touches the button
     keeps nothing in storage. The inline script in each page's head reads the same key
     before first paint, so these two must agree on 'wb-theme' and on the colours. */
  var KEY = 'wb-theme';
  var INK = '#14110E';
  var PAPER = '#F2ECE1';

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
    setMeta('theme-color', dark ? INK : PAPER);
    setMeta('color-scheme', dark ? 'dark' : 'light');
    show(btn, dark);
    try {
      if (dark) { localStorage.setItem(KEY, 'dark'); }
      else { localStorage.removeItem(KEY); }
    } catch (e) { /* storage blocked: the choice lasts for this page only */ }
  }

  var btn = document.querySelector('.theme-toggle');
  if (btn) {
    show(btn, isDark());
    btn.addEventListener('click', function () { apply(!isDark(), btn); });
  }

  var menu = document.querySelector('.menu');
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
})();
