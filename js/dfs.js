/* Escena DFS: qué pasa cuando un radar interrumpe un canal de 5 GHz. */
(function () {
  'use strict';
  var D = MP2.dfs;

  var ROWS = {
    naive: [
      { at: 0, h: 'Radar detectado en el canal DFS 54.' },
      { at: 0.5, h: 'El AP debe abandonar el canal en un máximo de 10 s y los tres clientes pierden la conexión.' },
      { at: 10, h: 'Escucha de 60 s (CAC) en otro canal DFS antes de volver a transmitir. Sin servicio.' },
      { at: 70, h: 'El servicio regresa tras más de un minuto sin conexión.' },
      { at: 71, h: 'El canal 54 queda bloqueado 30 minutos.' }
    ],
    smart: [
      { at: 0, h: 'Radar detectado en el canal DFS 54 de un AP.' },
      { at: 0, h: 'Los clientes de 6 GHz no lo notan: esa banda no tiene DFS.' },
      { at: 1, h: 'El AP anuncia el cambio con CSA (802.11h) y el cliente de 5 GHz lo sigue a un canal sin DFS sin reasociarse.' },
      { at: 10, h: 'El AP ya dejó el canal 54, dentro del máximo de 10 s.' },
      { at: 40, h: 'La radio de escaneo prueba otro canal con CAC de 60 s sin interrumpir a nadie.' },
      { at: 71, h: 'El canal 54 queda bloqueado 30 minutos. Dos radares en 24 h pasan al AP a un perfil sin DFS y avisan a Zabbix.' }
    ]
  };
  var LAYERS = [
    ['Equipo con DFS certificado y radio de escaneo', 'El CW9176I vigila el espectro sin dejar de atender clientes.'],
    ['6 GHz como banda principal', 'El 81 % de la capacidad de cada AP está en 6 GHz, sin DFS.'],
    ['Plan de canales defensivo en 5 GHz', '7 de los 13 APs usan canales sin DFS.'],
    ['Exclusión de 5600 a 5650 MHz', 'Los canales 120 a 128 coinciden con radares meteorológicos.'],
    ['Cambio de canal sin desconexión', 'CSA, Flex DFS y roaming 802.11k/v/r.'],
    ['Zero-Wait DFS donde la regulación lo permita', 'Se verifica en la instalación.'],
    ['Perfil adaptativo', 'Dos radares en 24 h y el AP pasa a un perfil sin DFS.']
  ];

  function initDFS() {
    var box = U.$('#dfs-scene'), tl = U.$('#dfs-timeline'), ly = U.$('#dfs-layers'), runBtn = U.$('#dfs-run'), seg = U.$('#dfs-mode');
    var mode = 'smart', timer = null, sim = 0;
    var CL = [{ x: 410, lab: 'Laptop Wi-Fi 7' }, { x: 520, lab: 'Laptop Wi-Fi 6E' }, { x: 630, lab: 'Equipo solo 5 GHz' }];
    var AP = { x: 520, y: 214 };

    var s = '<svg class="dfs-sc" viewBox="0 0 1000 440" role="img" aria-label="Edificio con un access point, tres clientes, un radar y un avión en aproximación">';
    s += '<line class="s-line" x1="0" x2="1000" y1="396" y2="396"/>';
    s += '<path id="plane-path" d="M-40 70 Q 400 90 1040 210" fill="none" stroke="var(--line-strong)" stroke-dasharray="3 9"/>';
    s += '<text class="m" x="40" y="116">Ruta de aterrizaje, Aeropuerto La Aurora</text>';
    s += '<g id="plane"><use href="#i-airplane-landing" x="-16" y="-16" width="32" height="32" style="color:var(--text)" fill="currentColor"/></g>';
    s += '<rect class="bld" x="320" y="170" width="400" height="226" rx="10"/><text x="520" y="196" text-anchor="middle" style="font-weight:600;font-size:13px">Edificio Las Margaritas, nivel 6</text>';
    s += '<circle cx="' + AP.x + '" cy="' + (AP.y + 8) + '" r="9" fill="var(--accent)"/><text class="m" x="' + (AP.x + 16) + '" y="' + (AP.y + 12) + '">AP</text>';
    CL.forEach(function (c, i) {
      s += '<g><use href="#i-laptop" x="' + (c.x - 20) + '" y="318" width="40" height="40" style="color:var(--text)" fill="currentColor"/><text class="m" x="' + c.x + '" y="378" text-anchor="middle" style="font-size:11px">' + c.lab + '</text></g>';
      s += '<path id="lk6-' + i + '" class="wave6" d="M' + AP.x + ' ' + (AP.y + 18) + ' Q ' + ((AP.x + c.x) / 2 + (i - 1) * 24) + ' ' + (AP.y + 70) + ' ' + c.x + ' 312"/>';
      s += '<path id="lk5-' + i + '" class="wave5" d="M' + AP.x + ' ' + (AP.y + 18) + ' Q ' + ((AP.x + c.x) / 2 + (i - 1) * 24) + ' ' + (AP.y + 70) + ' ' + c.x + ' 312"/>';
      s += '<g id="st-' + i + '"><circle cx="' + (c.x + 24) + '" cy="322" r="7" class="ok"/></g>';
    });
    s += '<g id="radar"><use href="#i-broadcast" x="836" y="330" width="40" height="40" style="color:var(--bad)" fill="currentColor"/><text class="m" x="856" y="388" text-anchor="middle">Radar</text>' +
      '<circle id="rw1" class="radar" cx="856" cy="350" r="0" opacity="0"/><circle id="rw2" class="radar" cx="856" cy="350" r="0" opacity="0"/></g>';
    s += '<g id="alert" opacity="0"><rect x="560" y="226" width="150" height="26" rx="13" fill="var(--bad)"/><text x="635" y="243" text-anchor="middle" style="fill:#fff;font-size:12px;font-weight:600">Radar detectado</text></g>';
    s += '<text id="clock" class="mono" x="40" y="420" style="font:600 15px var(--mono);fill:var(--accent)">t = 0 s</text>';
    s += '<text id="chan" class="m" x="140" y="420">AP en el canal 54 (DFS)</text>';
    s += '</svg>';
    box.innerHTML = s;
    var svg = U.$('svg', box);
    var plane = U.$('#plane', svg);
    if (!U.reduce) plane.innerHTML += '<animateMotion dur="26s" repeatCount="indefinite" rotate="auto"><mpath href="#plane-path"/></animateMotion>';
    else plane.setAttribute('transform', 'translate(420 80)');

    function setClient(i, state, band) {
      var st = U.$('#st-' + i, svg), l6 = U.$('#lk6-' + i, svg), l5 = U.$('#lk5-' + i, svg);
      var on6 = band === 6, on5 = band === 5;
      l6.style.display = on6 ? '' : 'none'; l5.style.display = on5 ? '' : 'none';
      [l6, l5].forEach(function (l) { l.classList.toggle('off', state === 'off'); });
      if (state === 'off') { l5.style.display = ''; l6.style.display = 'none'; }
      var c = CL[i], col = state === 'off' ? 'no' : state === 'move' ? '' : 'ok';
      st.innerHTML = state === 'move' ? '<circle cx="' + (c.x + 24) + '" cy="322" r="7" fill="var(--accent)"/>' : (state === 'off' ? '<circle cx="' + (c.x + 24) + '" cy="322" r="8" class="no"/><path d="M' + (c.x + 20) + ' 318 l8 8 m0 -8 l-8 8" stroke="#fff" stroke-width="2"/>' : '<circle cx="' + (c.x + 24) + '" cy="322" r="7" class="ok"/>');
    }
    function layout(m) {
      // bandas de enlace según el modo
      if (m === 'naive') [0, 1, 2].forEach(function (i) { setClient(i, 'ok', 5); });
      else { setClient(0, 'ok', 6); setClient(1, 'ok', 6); setClient(2, 'ok', 5); }
      U.$('#chan', svg).textContent = 'AP en el canal 54 (DFS)';
      U.$('#alert', svg).setAttribute('opacity', 0);
    }
    function drawRows(upTo) {
      tl.innerHTML = '<p class="tl__h">' + (mode === 'naive' ? 'Sin estrategia: todo en 5 GHz con DFS' : 'Diseño propuesto: 6 GHz, canales sin DFS y CSA') + '</p>' +
        ROWS[mode].map(function (r) {
          var t = r.at >= 71 ? '30 min' : (r.at === 0 ? '0 s' : (r.at >= 10 ? r.at + ' s' : '< ' + (r.at < 1 ? '1' : r.at) + ' s'));
          return '<div class="tl__row' + (upTo != null && r.at <= upTo ? ' is-on' : '') + '"><time>' + t + '</time><span>' + r.h + '</span></div>';
        }).join('');
      ly.innerHTML = LAYERS.map(function (l, i) {
        var on = mode === 'smart' && upTo != null && upTo >= [0, 0, 0, 0, 1, 10, 71][i];
        return '<li class="' + (on ? 'is-on' : '') + '"><b>' + l[0] + '</b>' + l[1] + '</li>';
      }).join('');
    }
    function waves(on) {
      ['rw1', 'rw2'].forEach(function (id, k) {
        var w = U.$('#' + id, svg);
        if (!on) { w.setAttribute('opacity', 0); return; }
        w.setAttribute('opacity', .7);
        if (!U.reduce) w.innerHTML = '<animate attributeName="r" from="0" to="' + (300 + k * 40) + '" dur="1.8s" begin="' + (k * .5) + 's" repeatCount="2"/><animate attributeName="opacity" from=".8" to="0" dur="1.8s" begin="' + (k * .5) + 's" repeatCount="2"/>';
        else w.setAttribute('r', 120);
      });
    }
    function frame(t) {
      var clock = U.$('#clock', svg); clock.textContent = 't = ' + Math.min(70, Math.floor(t)) + ' s';
      drawRows(t);
      if (mode === 'naive') {
        var off = t >= .5 && t < 70;
        [0, 1, 2].forEach(function (i) { setClient(i, off ? 'off' : 'ok', 5); });
        U.$('#chan', svg).textContent = t < .5 ? 'AP en el canal 54 (DFS)' : (t < 10 ? 'AP abandona el canal 54' : (t < 70 ? 'AP escucha 60 s (CAC) en otro canal DFS' : 'AP transmite en otro canal DFS'));
      } else {
        setClient(0, 'ok', 6); setClient(1, 'ok', 6);
        setClient(2, t >= 0.2 && t < 1.2 ? 'move' : 'ok', 5);
        U.$('#chan', svg).textContent = t < 1 ? 'AP en el canal 54 (DFS)' : 'AP en el canal 38 (sin DFS), 6 GHz sin cambios';
      }
    }
    function stop() { clearInterval(timer); timer = null; }
    function run() {
      stop(); sim = 0; layout(mode); waves(false);
      U.$('#alert', svg).setAttribute('opacity', 1); waves(true); frame(0);
      runBtn.disabled = true;
      if (U.reduce) { frame(72); U.$('#clock', svg).textContent = 't = 70 s'; runBtn.disabled = false; return; }
      var t0 = performance.now(), K = 10; // 1 s real = 10 s simulados
      timer = setInterval(function () {
        sim = (performance.now() - t0) / 1000 * K;
        if (sim > 72) { stop(); frame(72); runBtn.disabled = false; U.$('#alert', svg).setAttribute('opacity', 0); return; }
        frame(sim);
      }, 80);
    }
    function setMode(m) {
      mode = m; stop(); runBtn.disabled = false;
      U.$$('.seg__b', seg).forEach(function (b) { b.classList.toggle('is-on', b.dataset.mode === m); });
      layout(m); waves(false); U.$('#clock', svg).textContent = 't = 0 s'; drawRows(null);
    }
    seg.addEventListener('click', function (e) { var b = e.target.closest('.seg__b'); if (b) setMode(b.dataset.mode); });
    runBtn.addEventListener('click', run);
    setMode('smart');
    return { run: run, setMode: setMode };
  }

  window.DfsMod = { initDFS: initDFS };
})();
