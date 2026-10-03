/* Witbound: the hero iPhone.
   A real screen recording of the app plays, muted and looping, while it is on screen. It never
   starts by itself under reduced motion or Save-Data: those visitors get the poster and a play
   button. "Play with sound" unmutes the same file from the top, so the voice and the highlight
   cannot drift apart. The playback line under the phone follows the clip. No tracking, no storage. */
(function () {
  var fig = document.getElementById('wb-hero-phone');
  if (!fig) { return; }
  var video = fig.querySelector('video');
  var playBtn = fig.querySelector('.wb-hero-play');
  var pauseBtn = fig.querySelector('.wb-hero-pause');
  var soundBtn = fig.querySelector('.wb-hero-sound');
  var soundLabel = fig.querySelector('.wb-hero-sound-label');
  var clip = fig.querySelector('.wb-clip');
  var clipAt = fig.querySelector('.wb-clip-at');
  if (!video || !playBtn || !pauseBtn || !soundBtn) { return; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  // wantPlay is the reader's intent: true means "play whenever the phone is on screen".
  // Paused because it scrolled away is not the same as paused by the reader.
  var wantPlay = !reduce && !saveData;
  var inView = false;
  var watching = false;

  function clock(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function tick() {
    if (!clip) { return; }
    var d = video.duration;
    var p = d && isFinite(d) ? Math.min(1, video.currentTime / d) : 0;
    clip.style.setProperty('--wb-clip', p.toFixed(4));
    if (clipAt) { clipAt.textContent = clock(video.currentTime); }
  }

  function render() {
    var playing = !video.paused;
    fig.classList.toggle('wb-is-playing', playing);
    fig.classList.toggle('wb-is-stopped', !wantPlay);
    fig.classList.toggle('wb-has-sound', !video.muted);
    pauseBtn.setAttribute('aria-label', wantPlay ? 'Pause the clip' : 'Play the clip');
    soundLabel.textContent = video.muted ? 'Play with sound' : 'Mute';
  }

  function play() {
    var p = video.play();
    if (p && p.catch) {
      p.catch(function (err) {
        // A pause() that lands before the start resolves rejects with AbortError: not a refusal.
        if (err && err.name === 'AbortError') { return; }
        // Refused (Low Power Mode on iPhone, or a browser that blocks muted autoplay):
        // fall back to the poster and the play button, without sound.
        wantPlay = false;
        video.muted = true;
        render();
      });
    }
  }

  function sync() {
    if (wantPlay && (inView || !watching)) { play(); }
    else if (!video.paused) { video.pause(); }
    render();
  }

  playBtn.addEventListener('click', function () { wantPlay = true; play(); render(); });

  pauseBtn.addEventListener('click', function () {
    wantPlay = !wantPlay;
    sync();
  });

  soundBtn.addEventListener('click', function () {
    if (video.muted) {
      video.muted = false;
      try { video.currentTime = 0; } catch (e) { /* not seekable yet: it starts from 0 anyway */ }
      wantPlay = true;
      play();
    } else {
      video.muted = true;
    }
    render();
  });

  ['play', 'pause', 'volumechange'].forEach(function (t) { video.addEventListener(t, render); });
  ['timeupdate', 'seeked', 'loadedmetadata'].forEach(function (t) { video.addEventListener(t, tick); });
  video.addEventListener('error', function () { wantPlay = false; render(); }, true);

  // Wait for the page to finish loading before the clip starts downloading, so the first
  // view (text, fonts, poster) never queues behind the video.
  function start() {
    if ('IntersectionObserver' in window) {
      watching = true;
      new IntersectionObserver(function (entries) {
        inView = entries[entries.length - 1].isIntersecting;
        // Scrolling away ends a listen: the sound goes off, and it comes back muted.
        if (!inView && !video.muted) { video.muted = true; }
        sync();
      }).observe(video);
    } else {
      sync();
    }
  }
  render();
  if (document.readyState === 'complete') { start(); }
  else { window.addEventListener('load', start); }
})();
