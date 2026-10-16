/* Witbound: the small-screen menu. No tracking, no storage.
   The site is one book in Oxblood and cream, so the old light/dark choice is gone: a "wb-theme" key
   that an earlier visit stored is removed, and nothing else is ever written. */
(function () {
  try { localStorage.removeItem('wb-theme'); } catch (e) { /* storage blocked: nothing was stored */ }
  var root = document.documentElement;
  if (root.getAttribute('data-theme')) { root.removeAttribute('data-theme'); }
  // The policy pages keep their older head byte for byte: give the browser's bar the cloth's colour there too.
  [['theme-color', '#461418'], ['color-scheme', 'light']].forEach(function (p) {
    var m = document.querySelector('meta[name="' + p[0] + '"]');
    if (m && m.getAttribute('content') !== p[1]) { m.setAttribute('content', p[1]); }
  });

  // The menu closes once a place is chosen, on Escape, and on a tap outside it.
  var menus = document.querySelectorAll('details.wb-menu');
  Array.prototype.forEach.call(menus, function (menu) {
    menu.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) { menu.removeAttribute('open'); }
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.hasAttribute('open')) {
        menu.removeAttribute('open');
        var s = menu.querySelector('summary');
        if (s) { s.focus(); }
      }
    });
  });
  document.addEventListener('click', function (e) {
    Array.prototype.forEach.call(menus, function (menu) {
      if (menu.hasAttribute('open') && !menu.contains(e.target)) { menu.removeAttribute('open'); }
    });
  });
})();
