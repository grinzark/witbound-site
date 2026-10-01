/* Witbound: colours toggle and the small-screen menu. No tracking, no storage beyond the colour choice. */
(function () {
  var root = document.documentElement;
  var order = ['auto', 'light', 'dark'];
  var labels = {
    auto: 'Colours: automatic, following your device',
    light: 'Colours: light',
    dark: 'Colours: dark'
  };
  var metas = [].slice.call(document.querySelectorAll('meta[name="theme-color"]'));
  var metaDefaults = metas.map(function (m) { return m.getAttribute('content'); });

  function applyMeta(choice) {
    metas.forEach(function (m, i) {
      if (choice === 'auto') { m.setAttribute('content', metaDefaults[i]); }
      else { m.setAttribute('content', choice === 'dark' ? '#14110E' : '#F2ECE1'); }
    });
  }

  function label(btn, choice) {
    btn.setAttribute('aria-label', labels[choice] + '. Change colours');
    btn.setAttribute('title', labels[choice]);
  }

  function apply(choice, btn) {
    if (choice === 'auto') { root.removeAttribute('data-theme'); }
    else { root.setAttribute('data-theme', choice); }
    root.setAttribute('data-theme-choice', choice);
    applyMeta(choice);
    if (btn) { label(btn, choice); }
    try {
      if (choice === 'auto') { localStorage.removeItem('wb-theme'); }
      else { localStorage.setItem('wb-theme', choice); }
    } catch (e) { /* storage blocked: the choice lasts for this page only */ }
  }

  var btn = document.querySelector('.theme-toggle');
  if (btn) {
    var current = root.getAttribute('data-theme-choice') || 'auto';
    label(btn, current);
    applyMeta(current);
    btn.addEventListener('click', function () {
      var now = root.getAttribute('data-theme-choice') || 'auto';
      apply(order[(order.indexOf(now) + 1) % order.length], btn);
    });
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
