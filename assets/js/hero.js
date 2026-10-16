/* Witbound: the cover of the home page.
   The headline lights word by word, once, as the app does, then rests on "light up.". Beside it a real
   screen recording of the app plays, muted and looping, while it is on screen. Under reduced motion
   both stay still: the headline rests on "light up." and the clip waits behind its play button, as it
   does under Save-Data. "Play with sound" restarts the same file from the top with the voice, so the
   voice and the highlight cannot drift apart; scrolling away turns the sound off again. The clip only
   starts downloading after the page has loaded. No tracking, no storage. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  var words = document.querySelectorAll('#wb-hero-title .wb-w');
  if (!reduce && words.length) {
    words[words.length - 1].classList.remove('wb-lit');
    var i = 0;
    var step = function () {
      for (var k = 0; k < words.length; k++) { words[k].classList.toggle('wb-lit', k === i); }
      if (i < words.length - 1) { i++; setTimeout(step, i === 3 ? 520 : 360); }
    };
    setTimeout(step, 700);
  }

  var fig = document.getElementById('wb-hero-phone');
  if (!fig) { return; }
  var video = fig.querySelector('video');
  var over = fig.querySelector('.wb-play-over');
  var pauseBtn = fig.querySelector('.wb-clip-pause');
  var soundBtn = fig.querySelector('.wb-clip-sound');
  if (!video || !over || !pauseBtn || !soundBtn) { return; }
  var PAUSE = 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z';
  var PLAY = 'M7 4.5v15l12-7.5z';
  // wantPlay is the reader's intent: play whenever the phone is on screen. Paused because it
  // scrolled away is not the same as paused by the reader.
  var wantPlay = !reduce && !saveData;
  var inView = false;
  var started = false;

  function render() {
    var playing = !video.paused;
    fig.classList.toggle('wb-is-stopped', !playing && !wantPlay);
    pauseBtn.querySelector('span').textContent = wantPlay ? 'Pause' : 'Play';
    pauseBtn.setAttribute('aria-label', wantPlay ? 'Pause the clip' : 'Play the clip');
    pauseBtn.querySelector('path').setAttribute('d', wantPlay ? PAUSE : PLAY);
    soundBtn.querySelector('span').textContent = video.muted ? 'Play with sound' : 'Mute';
  }
  function play() {
    if (video.preload !== 'auto') { video.preload = 'auto'; }
    var p = video.play();
    if (p && p.catch) {
      p.catch(function (err) {
        // A pause() that lands before the start resolves rejects with AbortError: not a refusal.
        if (err && err.name === 'AbortError') { return; }
        // Refused (Low Power Mode, or a browser that blocks muted autoplay): the poster and the play button.
        wantPlay = false; video.muted = true; render();
      });
    }
  }
  function sync() {
    if (wantPlay && inView && started) { play(); } else if (!video.paused) { video.pause(); }
    render();
  }
  over.addEventListener('click', function () { wantPlay = true; started = true; inView = true; sync(); });
  pauseBtn.addEventListener('click', function () { wantPlay = !wantPlay; started = true; sync(); });
  soundBtn.addEventListener('click', function () {
    if (video.muted) {
      video.muted = false;
      try { video.currentTime = 0; } catch (e) { /* not seekable yet: it starts from 0 anyway */ }
      wantPlay = true;
      started = true;
    } else {
      video.muted = true;
    }
    sync();
  });
  ['play', 'pause', 'volumechange'].forEach(function (t) { video.addEventListener(t, render); });
  video.addEventListener('error', function () { wantPlay = false; render(); }, true);

  function start() {
    started = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[entries.length - 1].isIntersecting;
        if (!inView && !video.muted) { video.muted = true; }
        sync();
      }, { threshold: 0.25 }).observe(fig);
    } else {
      inView = true;
      sync();
    }
  }
  render();
  if (document.readyState === 'complete') { start(); } else { window.addEventListener('load', start); }
})();
