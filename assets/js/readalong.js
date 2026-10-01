/* Witbound: the live page.
   The passage is real text in the HTML. Each word carries the time (in seconds
   into the clip) when the narrator reaches it, from Witbound's own sync of the
   book. While the audio plays, the lit word is the last word whose time has
   passed, read from audio.currentTime on every animation frame, and it stays lit
   until the next word starts. Tap a word to hear it from there. */
(function () {
  var fig = document.getElementById('readalong');
  if (!fig) { return; }
  var text = fig.querySelector('.leaf-text');
  var audio = fig.querySelector('audio');
  var btn = fig.querySelector('.leaf-play');
  var track = fig.querySelector('.leaf-track');
  var elapsed = fig.querySelector('.leaf-elapsed');
  var remaining = fig.querySelector('.leaf-remaining');
  if (!text || !audio || !btn) { return; }

  var words = [].slice.call(text.querySelectorAll('.w'));
  var starts = words.map(function (w) { return parseFloat(w.getAttribute('data-s')); });
  var fallbackDuration = parseFloat(fig.getAttribute('data-duration')) || 24.1;
  var lit = -1;
  var frame = 0;
  var pendingSeek = null;

  // JS is running: hand over from the browser's own player to the page's.
  audio.removeAttribute('controls');
  fig.classList.add('is-ready');

  function duration() {
    return (audio.duration && isFinite(audio.duration)) ? audio.duration : fallbackDuration;
  }

  // Last word whose start has passed; -1 before the first word.
  function indexAt(t) {
    var lo = 0, hi = starts.length - 1, found = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (starts[mid] <= t) { found = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    return found;
  }

  function clock(t) {
    var s = Math.max(0, Math.round(t));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function paint(t) {
    var i = indexAt(t);
    if (i !== lit) {
      if (lit >= 0) { words[lit].classList.remove('is-lit'); }
      if (i >= 0) { words[i].classList.add('is-lit'); }
      lit = i;
    }
    var d = duration();
    var f = Math.min(1, Math.max(0, t / d));
    fig.style.setProperty('--progress', f.toFixed(4));
    if (elapsed) { elapsed.textContent = clock(t); }
    if (remaining) { remaining.textContent = '-' + clock(Math.max(0, d - t)); }
  }

  function tick() {
    paint(pendingSeek !== null ? pendingSeek : audio.currentTime);
    if (!audio.paused && !audio.ended) { frame = requestAnimationFrame(tick); }
  }

  function setPlaying(on) {
    fig.classList.toggle('is-playing', on);
    btn.setAttribute('aria-label', on ? 'Pause the reading' : 'Play the reading');
  }

  // A server that cannot send byte ranges cannot seek inside the audio. When
  // that happens, load the whole clip (about 200 KB) into memory once and seek
  // there. witbound.app sends ranges, so this only helps simple local servers.
  var swapping = false;
  var swapped = false;
  var wantPlay = false;

  function canSeek(t) {
    var r = audio.seekable;
    for (var i = 0; i < r.length; i++) {
      if (t >= r.start(i) && t <= r.end(i) + 0.01) { return true; }
    }
    return false;
  }

  function swapToMemory() {
    if (swapping || swapped || !window.fetch || !window.URL) { return; }
    swapping = true;
    var src = audio.currentSrc;
    fetch(src).then(function (r) { return r.blob(); }).then(function (b) {
      swapped = true;
      audio.src = URL.createObjectURL(b);
      audio.load();
    }).catch(function () { swapping = false; });
  }

  function play() {
    if (swapping) { wantPlay = true; return; }
    var p = audio.play();
    if (p && p.catch) { p.catch(function () { setPlaying(false); }); }
  }

  function seek(t) {
    t = Math.max(0, Math.min(t, duration() - 0.05));
    if (audio.readyState >= 1 && !swapping) {
      if (t < 0.05 || canSeek(t) || swapped) { audio.currentTime = t; }
      else {
        pendingSeek = t;
        wantPlay = wantPlay || !audio.paused;
        swapToMemory();
        audio.pause();
      }
    } else {
      pendingSeek = t;
    }
    paint(t);
  }

  audio.addEventListener('loadedmetadata', function () {
    if (pendingSeek !== null) {
      if (pendingSeek < 0.05 || canSeek(pendingSeek) || swapped) {
        audio.currentTime = pendingSeek;
        pendingSeek = null;
      } else {
        wantPlay = wantPlay || !audio.paused;
        swapToMemory();
        audio.pause();
        return;
      }
    }
    if (swapped && swapping) {
      swapping = false;
      if (wantPlay) { wantPlay = false; play(); }
    }
  });
  audio.addEventListener('play', function () {
    if (swapping) { audio.pause(); wantPlay = true; return; }
    setPlaying(true);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  });
  audio.addEventListener('pause', function () {
    if (swapping) { return; }
    setPlaying(false);
    cancelAnimationFrame(frame);
    paint(pendingSeek !== null ? pendingSeek : audio.currentTime);
  });
  audio.addEventListener('seeked', function () { paint(audio.currentTime); });
  audio.addEventListener('ended', function () {
    setPlaying(false);
    paint(duration());
  });

  btn.addEventListener('click', function () {
    if (audio.paused) {
      if (audio.ended || audio.currentTime >= duration() - 0.1) { seek(0); }
      play();
    } else {
      audio.pause();
    }
  });

  text.addEventListener('click', function (e) {
    var w = e.target.closest ? e.target.closest('.w') : null;
    if (!w) { return; }
    var i = words.indexOf(w);
    if (i < 0) { return; }
    seek(starts[i]);
    play();
  });

  // Keyboard: Space or Enter plays and pauses, the arrow keys step a word at a time.
  text.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      btn.click();
    } else if (k === 'ArrowRight') {
      e.preventDefault();
      seek(starts[Math.min(words.length - 1, lit + 1)]);
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      seek(starts[Math.max(0, lit - 1)]);
    } else if (k === 'Home') {
      e.preventDefault();
      seek(0);
    }
  });

  if (track) {
    track.addEventListener('click', function (e) {
      var r = track.getBoundingClientRect();
      if (!r.width) { return; }
      seek(((e.clientX - r.left) / r.width) * duration());
    });
  }

  paint(0);
})();
