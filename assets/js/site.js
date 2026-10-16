/* Witbound: the small-screen menu, and a link to a question opens it. No tracking, no storage.
   The site is one book in Oxblood and cream, so the old light/dark choice is gone: a "wb-theme" key
   that an earlier visit stored is removed, and nothing else is ever written. */
(function () {
  try { localStorage.removeItem('wb-theme'); } catch (e) { /* storage blocked: nothing was stored */ }
  var root = document.documentElement;
  if (root.getAttribute('data-theme')) { root.removeAttribute('data-theme'); }
  // A link to a question (index.html#languages) opens that question rather than landing on it shut.
  function openTarget() {
    var id = decodeURIComponent((location.hash || '').slice(1));
    var el = id && document.getElementById(id);
    if (el && el.tagName === 'DETAILS') { el.open = true; }
  }
  openTarget();
  window.addEventListener('hashchange', openTarget);

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
