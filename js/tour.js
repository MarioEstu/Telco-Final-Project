/* Recorrido narrado: audio pregrabado + subtítulos palabra por palabra + avatar con boca sincronizada.
   Si el audio no carga, el recorrido sigue con un temporizador (solo subtítulos). */
(function () {
  'use strict';
  var T = window.TOUR;
  if (!T) return;
  var dock = U.$('#tour'), bar = U.$('#tour-progress'), titleEl = U.$('#tour-title'), capEl = U.$('#tour-caption'),
      playBtn = U.$('#tour-play'), playIc = U.$('#tour-play-ic'), muteBtn = U.$('#tour-mute'), muteIc = U.$('#tour-mute-ic'),
      avatar = U.$('#avatar'), mouth = U.$('#av-mouth');
  var S = { i: -1, playing: false, muted: false, noAudio: false, t0: 0, tPaused: 0, raf: null, cue: 0, sentence: -1, focusEl: null, actions: {} };
  var audio = new Audio(); audio.preload = 'auto';

  /* ---- tokens y oraciones de cada paso (se calculan una vez) ---- */
  T.steps.forEach(function (st) {
    st.tokens = st.text.split(/\s+/).filter(Boolean);
    st.sent = []; var start = 0;
    st.tokens.forEach(function (tk, k) { if (/[.?!]$/.test(tk) || k === st.tokens.length - 1) { st.sent.push([start, k]); start = k + 1; } });
    // tiempo de inicio por token: relleno e interpolación entre los conocidos
    var n = st.tokens.length, ts = new Array(n).fill(null);
    (st.words || []).forEach(function (w) { if (ts[w[0]] == null) ts[w[0]] = w[1]; });
    ts[0] = ts[0] == null ? 0 : ts[0];
    var last = 0;
    for (var k = 1; k <= n; k++) {
      var kk = k === n ? n : k;
      if (k === n || ts[k] != null) {
        var t1 = k === n ? st.dur : ts[k], t0 = ts[last];
        for (var m = last + 1; m < k; m++) ts[m] = t0 + (t1 - t0) * (m - last) / (k - last);
        last = k;
      }
    }
    st.ts = ts;
  });

  bar.innerHTML = T.steps.map(function (s, i) { return '<button type="button" data-i="' + i + '" aria-label="' + s.title + '" title="' + s.title + '"><i></i></button>'; }).join('');

  function curTime() {
    if (S.noAudio) return S.playing ? (performance.now() - S.t0) / 1000 : S.tPaused;
    return audio.currentTime;
  }
  function setPlayIcon() {
    playIc.innerHTML = '<use href="#i-' + (S.playing ? 'pause' : 'play') + '"/>';
    playBtn.setAttribute('aria-label', S.playing ? 'Pausar' : 'Reproducir');
  }
  function highlight(sel) {
    if (S.focusEl) S.focusEl.classList.remove('hl-target');
    S.focusEl = sel ? U.$(sel) : null;
    if (S.focusEl) { void S.focusEl.offsetWidth; S.focusEl.classList.add('hl-target'); }
  }
  function scrollTo(sel) {
    var el = U.$(sel); if (!el) return;
    var r = el.getBoundingClientRect(), nav = 64, dockH = dock.offsetHeight + 24, avail = window.innerHeight - nav - dockH;
    var y = window.scrollY + r.top - nav - 16 - (r.height < avail ? (avail - r.height) / 2 : 0);
    window.scrollTo({ top: Math.max(0, y), behavior: U.reduce ? 'auto' : 'smooth' });
  }

  function drawCaption(st, k) {
    var si = 0; for (var q = 0; q < st.sent.length; q++) if (k >= st.sent[q][0] && k <= st.sent[q][1]) { si = q; break; }
    if (si !== S.sentence) {
      S.sentence = si; var a = st.sent[si][0], b = st.sent[si][1], h = '';
      for (var j = a; j <= b; j++) h += '<span class="w" data-k="' + j + '">' + st.tokens[j].replace(/&/g, '&amp;') + '</span> ';
      capEl.innerHTML = h;
    }
    var spans = capEl.children;
    for (var s = 0; s < spans.length; s++) {
      var kk = +spans[s].dataset.k; spans[s].className = 'w' + (kk < k ? ' said' : (kk === k ? ' on' : ''));
    }
  }
  function tokenAt(st, t) { var k = 0; for (var i = 0; i < st.ts.length; i++) { if (st.ts[i] <= t + 0.04) k = i; else break; } return k; }

  function runCues(st, p) {
    while (S.cue < (st.cues || []).length && p >= st.cues[S.cue].p) { var c = st.cues[S.cue++]; (Array.isArray(c.do) ? c.do : [c.do]).forEach(runAction); }
  }
  function runAction(a) { var f = S.actions[a.split(':')[0]]; if (f) { try { f.apply(null, a.split(':').slice(1)); } catch (e) { console.warn('acción', a, e); } } }

  function loop() {
    var st = T.steps[S.i]; if (!st) return;
    var t = curTime(), p = Math.min(1, t / st.dur);
    drawCaption(st, tokenAt(st, t));
    runCues(st, p);
    // progreso
    var btn = bar.children[S.i]; if (btn) btn.style.setProperty('--p', p.toFixed(3));
    // boca
    var amp = 0;
    if (S.playing && st.env && !S.noAudio) { var e = st.env[Math.min(st.env.length - 1, Math.floor(t * T.envHz))] || 0; amp = e / 99; }
    else if (S.playing && S.noAudio) amp = (Math.sin(t * 14) + 1) / 2 * .6;
    mouth.style.transform = 'scaleY(' + (1 + amp * 4.6) + ') scaleX(' + (1 - amp * .25) + ')';
    avatar.classList.toggle('speaking', S.playing && amp > .08);
    if (S.noAudio && S.playing && t >= st.dur + .4) return next(true);
    S.raf = requestAnimationFrame(loop);
  }

  function go(i, auto) {
    cancelAnimationFrame(S.raf);
    if (S.i >= 0) runResets();
    S.i = U.clamp(i, 0, T.steps.length - 1); S.cue = 0; S.sentence = -1;
    var st = T.steps[S.i];
    U.$$('button', bar).forEach(function (b, k) { b.className = k < S.i ? 'done' : (k === S.i ? 'now' : ''); b.style.setProperty('--p', 0); });
    titleEl.textContent = st.title;
    highlight(st.focus); scrollTo(st.focus || st.target);
    capEl.innerHTML = '';
    audio.pause(); S.noAudio = false;
    audio.src = st.audio; audio.currentTime = 0;
    audio.muted = S.muted;
    S.tPaused = 0;
    if (auto !== false) play();
    else { S.playing = false; setPlayIcon(); S.raf = requestAnimationFrame(loop); }
  }
  function runResets() {
    var st = T.steps[S.i]; (st.reset || []).forEach(runAction);
  }
  function play() {
    var st = T.steps[S.i];
    var started = function () { S.playing = true; setPlayIcon(); cancelAnimationFrame(S.raf); S.raf = requestAnimationFrame(loop); };
    if (S.noAudio) { S.t0 = performance.now() - S.tPaused * 1000; return started(); }
    var pr = audio.play();
    if (pr && pr.then) pr.then(started).catch(function () { S.noAudio = true; S.t0 = performance.now() - S.tPaused * 1000; started(); });
    else started();
  }
  function pause() {
    if (S.noAudio) S.tPaused = curTime(); else audio.pause();
    S.playing = false; setPlayIcon();
  }
  function next(auto) { if (S.i >= T.steps.length - 1) { return finish(); } go(S.i + 1, true); }
  function finish() { pause(); runResets(); capEl.textContent = 'Fin del recorrido. Puede explorar libremente cada sección.'; cancelAnimationFrame(S.raf); }

  audio.addEventListener('error', function () { S.noAudio = true; S.t0 = performance.now(); if (S.playing || S.i >= 0) { S.playing = true; setPlayIcon(); } });
  audio.addEventListener('ended', function () { setTimeout(function () { if (S.playing) next(true); }, 650); });

  function open() { dock.hidden = false; document.body.classList.add('tour-on'); }
  function close() {
    pause(); runResets(); cancelAnimationFrame(S.raf); highlight(null);
    dock.hidden = true; document.body.classList.remove('tour-on'); S.i = -1;
  }
  function start() { open(); go(0, true); }

  U.$$('[data-tour-start]').forEach(function (b) { b.addEventListener('click', start); });
  playBtn.addEventListener('click', function () { if (S.playing) pause(); else { if (S.i < 0) start(); else if (audio.ended || (!S.noAudio && audio.currentTime >= T.steps[S.i].dur - 0.05)) go(S.i, true); else play(); } });
  U.$('#tour-next').addEventListener('click', function () { if (S.i >= T.steps.length - 1) finish(); else go(S.i + 1, true); });
  U.$('#tour-prev').addEventListener('click', function () { go(Math.max(0, S.i - 1), true); });
  U.$('#tour-close').addEventListener('click', close);
  muteBtn.addEventListener('click', function () {
    S.muted = !S.muted; audio.muted = S.muted; muteBtn.setAttribute('aria-pressed', S.muted);
    muteIc.innerHTML = '<use href="#i-' + (S.muted ? 'speaker-slash' : 'speaker-high') + '"/>';
    muteBtn.setAttribute('aria-label', S.muted ? 'Activar sonido' : 'Silenciar');
  });
  bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) go(+b.dataset.i, true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dock.hidden) close(); });

  window.Tour = { start: start, close: close, go: go, registerActions: function (a) { S.actions = a; }, state: S };
})();
