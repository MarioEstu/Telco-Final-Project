/* Enlace A-B: comparación de medios, mapa de la ruta, presupuesto óptico y monitoreo. */
(function () {
  'use strict';
  var D = MP2, R = D.route, O = D.optics;

  /* ------------------------------------------------------------- tramos en la cinta del bento */
  function initLegs() {
    var box = U.$('#legs'); if (!box) return;
    box.innerHTML = R.tramos.map(function (t, i) {
      return '<div class="leg" style="--w:' + t.fibra + ';--o:' + (1 - i * 0.22) + '"><i></i><span>' + t.fibra.toFixed(1) + ' km</span></div>';
    }).join('');
  }

  /* ------------------------------------------------------------- comparación de medios */
  function initMedia() {
    var tabs = U.$('#media-tabs'), info = U.$('#media-info'), chart = U.$('#media-chart');
    var cur = 'fibra';
    tabs.innerHTML = D.media.map(function (m) {
      return '<button type="button" class="seg__b" role="tab" data-id="' + m.id + '">' + m.chip + '</button>';
    }).join('');
    function draw() {
      var m = D.media.filter(function (x) { return x.id === cur; })[0];
      U.$$('.seg__b', tabs).forEach(function (b) {
        var on = b.dataset.id === cur; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on);
      });
      info.innerHTML =
        '<span class="verdict ' + (m.ok ? 'verdict--ok' : 'verdict--no') + '">' + U.icon(m.ok ? 'check-circle' : 'x-circle') + m.verdict + '</span>' +
        '<h3 class="h3" style="margin:14px 0 0">' + m.name + '</h3>' +
        '<dl class="facts"><div><dt>Inversión</dt><dd>' + m.capex + '</dd></div><div><dt>Disponibilidad</dt><dd>' + m.avail + '</dd></div><div><dt>Capacidad</dt><dd>' + m.cap + '</dd></div></dl>' +
        '<p>' + m.why + '</p>';
      var MAX = 525.6;
      chart.innerHTML =
        '<p class="chart-title">Minutos sin servicio al año</p><p class="chart-sub">Según la disponibilidad típica de cada alternativa.</p>' +
        D.media.map(function (x) {
          var val;
          if (x.id === 'fibra') val = '<span class="hbar__none">0 por clima o interferencia</span>';
          else if (!x.outage) val = '<span class="hbar__val">sin garantía</span>';
          else {
            var lo = Math.round(x.outage.lo * x.outage.hops), hi = Math.round(x.outage.hi * x.outage.hops);
            var w = Math.max(3, Math.round(100 * x.outage.hi * x.outage.hops / (MAX * 1.0) * 0.62));
            val = '<span class="hbar__fill" style="width:' + w + '%"></span><span class="hbar__val">' + (lo === hi ? hi : lo + ' a ' + hi) + ' min</span>';
          }
          return '<div class="hbar' + (x.id === cur ? ' is-sel' : '') + '"><span class="hbar__name">' + x.chip + '</span><span class="hbar__track">' + val + '</span></div>';
        }).join('') +
        '<p class="chart-sub" style="margin:18px 0 0">La microonda se calcula con tres saltos en serie. La fibra solo falla por un corte físico, que el respaldo IPsec absorbe.</p>';
    }
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.seg__b'); if (!b) return; cur = b.dataset.id; draw();
    });
    draw();
    return { select: function (id) { cur = id; draw(); } };
  }

  /* ------------------------------------------------------------- mapa de la ruta */
  var VB = { w: 1000, h: 560 }, LON0 = -90.60, LAT0 = 14.86, COS = Math.cos(14.65 * Math.PI / 180);
  var K = (VB.w - 120) / (0.90 * COS), OY = (VB.h - 0.42 * K) / 2;
  function proj(lon, lat) { return { x: 60 + (lon - LON0) * COS * K, y: OY + (LAT0 - lat) * K }; }
  var P = {}; R.pts.forEach(function (p) { P[p.id] = Object.assign({}, p, proj(p.lon, p.lat)); });
  var TR = [
    { id: 1, ids: ['A', 'p1', 'p2', 'p3', 'NR1'] },
    { id: 2, ids: ['NR1', 'sansare', 'NR2'] },
    { id: 3, ids: ['NR2', 'monjas', 'B'] }
  ];
  function pathD(ids) { return ids.map(function (id, i) { return (i ? 'L' : 'M') + P[id].x.toFixed(1) + ' ' + P[id].y.toFixed(1); }).join(' '); }

  function RouteMap(box, hero) {
    var uid = hero ? 'h' : 'r';
    var svg = U.svg('svg', { viewBox: '0 0 ' + VB.w + ' ' + VB.h, role: 'img', 'aria-label': 'Ruta de la fibra: zona 10, Sanarate, Jalapa y San Manuel Chaparrón' });
    var h = '';
    // retícula geográfica tenue
    for (var lon = -90.6; lon <= -89.69; lon += 0.2) { var a = proj(lon, 14.86), b = proj(lon, 14.44); h += '<path class="s-grid" d="M' + a.x + ' ' + a.y + ' L' + b.x + ' ' + b.y + '"/>'; }
    for (var lat = 14.8; lat >= 14.44; lat -= 0.1) { var c = proj(-90.6, lat), d = proj(-89.7, lat); h += '<path class="s-grid" d="M' + c.x + ' ' + c.y + ' L' + d.x + ' ' + d.y + '"/>'; }
    // respaldo por Internet
    var A = P.A, B = P.B, ctrl = { x: (A.x + B.x) / 2, y: Math.max(A.y, B.y) + 150 };
    h += '<path id="bk-' + uid + '" class="s-backup" d="M' + A.x + ' ' + A.y + ' Q' + ctrl.x + ' ' + ctrl.y + ' ' + B.x + ' ' + B.y + '"/>';
    h += '<text class="s-muted" x="' + (ctrl.x - 4) + '" y="' + (A.y + 148) + '" text-anchor="middle" id="bk-lab-' + uid + '">Respaldo por Internet, túnel IPsec</text>';
    // aeropuerto
    var ap = proj(R.airport.lon, R.airport.lat);
    h += '<g opacity=".9"><use href="#i-airplane-landing" x="' + (ap.x - 10) + '" y="' + (ap.y + 18) + '" width="22" height="22" style="color:var(--muted)" fill="currentColor"/><text class="s-muted" x="' + ap.x + '" y="' + (ap.y + 58) + '" text-anchor="middle">Aeropuerto La Aurora</text></g>';
    // tramos
    TR.forEach(function (t) {
      h += '<path class="s-fiber-glow" data-glow="' + t.id + '" d="' + pathD(t.ids) + '"/>';
      h += '<path id="tr-' + uid + t.id + '" class="s-fiber" data-t="' + t.id + '" d="' + pathD(t.ids) + '"/>';
    });
    if (!hero) TR.forEach(function (t) { h += '<path class="s-hit" data-hit="' + t.id + '" tabindex="-1" d="' + pathD(t.ids) + '"/>'; });
    h += '<g id="pulses-' + uid + '"></g><g id="pk-' + uid + '"></g><g id="badges-' + uid + '"></g><g id="cutmark-' + uid + '"></g>';
    // nodos y etiquetas
    var lab = {
      A: { dx: -18, dy: -2, an: 'end', t: 'Zona 10', s: 'Edif. Las Margaritas' },
      NR1: { dx: 0, dy: -30, an: 'middle', t: 'NR-1 Sanarate', s: 'nodo de repotencia, km 58' },
      NR2: { dx: 20, dy: -22, an: 'start', t: 'NR-2 Jalapa', s: 'nodo de repotencia, km 102' },
      B: { dx: 0, dy: -34, an: 'middle', t: 'San Manuel Chaparrón', s: 'Planta solar' },
      sansare: { dx: -12, dy: 4, an: 'end', t: 'Sansare', small: 1 },
      monjas: { dx: 8, dy: -16, an: 'start', t: 'Monjas', small: 1 }
    };
    ['A', 'NR1', 'NR2', 'B', 'sansare', 'monjas'].forEach(function (id) {
      var p = P[id], l = lab[id];
      if (l.small) {
        if (!hero) h += '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="var(--line-strong)"/><text class="s-muted" x="' + (p.x + l.dx) + '" y="' + (p.y + l.dy) + '" text-anchor="' + l.an + '">' + l.t + '</text>';
        return;
      }
      var site = p.kind === 'site';
      h += '<g class="node" data-node="' + id + '" ' + (hero ? '' : 'tabindex="0" role="button" aria-label="' + l.t + '" style="cursor:pointer"') + '>';
      h += (site ? '<circle class="s-node s-node--site" cx="' + p.x + '" cy="' + p.y + '" r="11"/>' : '<rect class="s-node" x="' + (p.x - 10) + '" y="' + (p.y - 10) + '" width="20" height="20" rx="5" transform="rotate(45 ' + p.x + ' ' + p.y + ')"/>');
      h += '<text class="s-text" x="' + (p.x + l.dx) + '" y="' + (p.y + l.dy) + '" text-anchor="' + l.an + '" style="font-weight:600">' + l.t + '</text>';
      if (l.s && !hero) h += '<text class="s-muted" x="' + (p.x + l.dx) + '" y="' + (p.y + l.dy + 16) + '" text-anchor="' + l.an + '">' + l.s + '</text>';
      h += '</g>';
    });
    svg.innerHTML = h;
    box.innerHTML = ''; box.appendChild(svg);

    // insignias de longitud, en el punto medio de cada tramo
    var badges = U.$('#badges-' + uid, svg);
    var paths = {};
    TR.forEach(function (t) {
      var p = U.$('#tr-' + uid + t.id, svg); paths[t.id] = p;
      var len = p.getTotalLength(), mid = p.getPointAtLength(len / 2), tr = R.tramos[t.id - 1];
      var g = U.svg('g', { 'data-badge': t.id });
      var txt = tr.fibra.toFixed(1) + ' km';
      g.innerHTML = '<rect x="' + (mid.x - 42) + '" y="' + (mid.y - 14) + '" width="84" height="28" rx="14" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.5"/><text class="s-text s-mono" x="' + mid.x + '" y="' + (mid.y + 5) + '" text-anchor="middle">' + txt + '</text>';
      badges.appendChild(g);
      t.mid = mid; t.len = len;
    });

    // pulsos de luz sobre la fibra y paquetes sobre el respaldo
    var pulses = U.$('#pulses-' + uid, svg), pk = U.$('#pk-' + uid, svg);
    if (!U.reduce) {
      TR.forEach(function (t) {
        var dur = (t.len / 85).toFixed(2);
        [0, 0.5].forEach(function (f) {
          pulses.appendChild(U.svg('circle', { r: 5, class: 's-pulse' }, '<animateMotion dur="' + dur + 's" repeatCount="indefinite" begin="-' + (dur * f).toFixed(2) + 's"><mpath href="#tr-' + uid + t.id + '"/></animateMotion>'));
        });
      });
      var bk = U.$('#bk-' + uid, svg), bl = bk.getTotalLength(), bd = (bl / 85).toFixed(2);
      [0, 0.5].forEach(function (f) {
        pk.appendChild(U.svg('circle', { r: 4.5, class: 's-pkt' }, '<animateMotion dur="' + bd + 's" repeatCount="indefinite" begin="-' + (bd * f).toFixed(2) + 's"><mpath href="#bk-' + uid + '"/></animateMotion>'));
      });
      pk.style.display = 'none';
    }

    var api = { svg: svg, selected: 2 };
    api.setCut = function (on, tid) {
      var cm = U.$('#cutmark-' + uid, svg); cm.innerHTML = '';
      U.$$('.s-fiber', svg).forEach(function (p) {
        p.classList.remove('is-cut', 'is-dim');
        if (on) p.classList.add(+p.dataset.t === tid ? 'is-cut' : 'is-dim');
      });
      pulses.style.display = on ? 'none' : '';
      pk.style.display = on ? '' : 'none';
      var bk = U.$('#bk-' + uid, svg); bk.classList.toggle('is-live', on);
      if (on) {
        var m = TR[tid - 1].mid;
        cm.innerHTML = '<circle cx="' + m.x + '" cy="' + (m.y - 34) + '" r="15" fill="var(--surface)" stroke="var(--bad)" stroke-width="2"/><use href="#i-scissors" x="' + (m.x - 10) + '" y="' + (m.y - 44) + '" width="20" height="20" style="color:var(--bad)" fill="currentColor"/>';
      }
    };
    api.select = function (sel) {
      U.$$('.s-node', svg).forEach(function (n) { n.classList.remove('is-sel'); });
      U.$$('[data-glow]', svg).forEach(function (g) { g.style.opacity = (+g.dataset.glow === sel) ? .38 : ''; });
      U.$$('.s-fiber', svg).forEach(function (p) { p.style.strokeWidth = (+p.dataset.t === sel) ? 6 : ''; });
      if (typeof sel === 'string') { var g = U.$('[data-node="' + sel + '"] .s-node', svg); if (g) g.classList.add('is-sel'); }
    };
    return api;
  }

  /* ------------------------------------------------------------- panel de tramo/nodo y simulación de corte */
  function initRoute() {
    var hero = RouteMap(U.$('#hero-map'), true);
    var map = RouteMap(U.$('#route-map'), false);
    var panel = U.$('#tramo-panel'), status = U.$('#route-status'), btn = U.$('#cut-btn'), lab = U.$('#cut-label');
    var sel = 2, busy = false;

    function kv(rows) { return '<dl class="kv">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd' + (r[2] ? ' class="' + r[2] + '"' : '') + '>' + r[1] + '</dd>'; }).join('') + '</dl>'; }
    function chips() {
      return '<div class="seg seg--tight" style="margin-bottom:18px" role="group" aria-label="Tramo">' +
        [1, 2, 3].map(function (i) { return '<button type="button" class="seg__b' + (sel === i ? ' is-on' : '') + '" data-pick="' + i + '">Tramo ' + i + '</button>'; }).join('') + '</div>';
    }
    function draw() {
      map.select(sel);
      if (typeof sel === 'number') {
        var t = R.tramos[sel - 1];
        panel.innerHTML = '<div class="tp">' + chips() + '<h3>' + t.from_ + ' a ' + t.to + '</h3><p class="sub">' + t.road + '</p>' +
          kv([['Distancia vial', t.vial + ' km'], ['Fibra instalada', t.fibra.toFixed(1) + ' km'], ['Empalmes', t.splices], ['Pérdida del tramo', U.f1(t.loss) + ' dB'],
            ['Atenuador', t.att ? t.att + ' dB' : 'no lleva'], ['Potencia recibida, peor caso', U.f1(t.prx) + ' dBm'], ['Margen sobre −24 dBm', U.f1(t.margin) + ' dB', 'good']]) +
          '<p class="note">Fibra instalada = distancia vial + 4 % por catenaria y reservas. El margen se calcula después de 3 dB de reserva.</p></div>';
      } else {
        var n = P[sel], isNR = sel === 'NR1' || sel === 'NR2';
        panel.innerHTML = '<div class="tp">' + chips() + '<h3>' + (n.name || sel) + '</h3><p class="sub">' + n.sub + '</p>' +
          (isNR ? kv([['Función', 'Regenera la señal (OEO)'], ['Equipo', 'Switch C9200CX-12P-2X2G'], ['Gabinete', 'Exterior 12U, IP55'], ['Energía', '2 paneles, MPPT y LiFePO4 48 V']]) +
            '<p class="note">Un switch con dos transceptores ZR recibe la luz, recupera los bits y los retransmite con potencia nueva, sin acumular ruido.</p>'
            : kv([['Equipos nuevos', sel === 'A' ? 'C8500L + C8200 + C9300X' : 'C8500L + C8200 + C9200CX'], ['Gateway', 'VRRP con el firewall existente'], ['Enrutamiento', 'OSPF área 0 + BFD']]) +
            '<p class="note">Cada sitio tiene dos routers: uno para la fibra y otro para el respaldo por Internet.</p>') + '</div>';
      }
    }
    function say(html) { status.innerHTML = html; }
    function idle() {
      if (U.state.cut) return;
      say('<span class="good">Fibra principal activa.</span> Pérdida de paquetes <b>0 %</b>, retardo de ida <b>0.8 ms</b> en 148 km.');
    }
    async function toggleCut(force) {
      if (busy) return; busy = true;
      var want = force == null ? !U.state.cut : force;
      var tid = typeof sel === 'number' ? sel : 2;
      if (want) {
        U.state.cut = true; U.state.cutTramo = tid;
        btn.disabled = true; lab.textContent = 'Restaurar la fibra';
        hero.setCut(true, tid); map.setCut(true, tid);
        say('<span class="bad">Corte en el tramo ' + tid + '.</span> BFD detecta la falla: 300 ms por 3 intervalos.');
        U.bus.emit('cut', { cut: true, tramo: tid });
        await U.sleep(U.reduce ? 200 : 1300);
        say('<span class="good">Tráfico en el respaldo.</span> OSPF lo movió al túnel IPsec por Internet en menos de 1 s.');
        btn.disabled = false;
      } else {
        U.state.cut = false;
        hero.setCut(false); map.setCut(false);
        lab.textContent = 'Cortar la fibra';
        U.bus.emit('cut', { cut: false });
        idle();
      }
      busy = false;
    }
    U.bus.on('cutRequest', function (v) { toggleCut(v); });
    btn.addEventListener('click', function () { toggleCut(); });

    var svg = map.svg;
    svg.addEventListener('click', function (e) {
      var hit = e.target.closest('[data-hit]'), nd = e.target.closest('[data-node]');
      if (hit) sel = +hit.dataset.hit; else if (nd) sel = nd.dataset.node; else return;
      draw();
    });
    svg.addEventListener('keydown', function (e) {
      var nd = e.target.closest('[data-node]');
      if (nd && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sel = nd.dataset.node; draw(); }
    });
    svg.addEventListener('mousemove', function (e) {
      var hit = e.target.closest('[data-hit]');
      if (hit) { var t = R.tramos[hit.dataset.hit - 1]; U.tip.show('<b>Tramo ' + t.id + '</b><br>' + t.fibra.toFixed(1) + ' km, margen ' + U.f1(t.margin) + ' dB', e.clientX, e.clientY); }
      else U.tip.hide();
    });
    svg.addEventListener('mouseleave', U.tip.hide);
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]'); if (!b) return; sel = +b.dataset.pick; draw();
    });
    draw(); idle();
    return { select: function (s) { sel = s; draw(); }, cut: toggleCut };
  }

  /* ------------------------------------------------------------- calculadora de presupuesto óptico */
  function initOptics() {
    var box = U.$('#optics-fields'), view = U.$('#optics-view'), presets = U.$$('[data-preset]');
    var S = { L: 60.3, spl: 17, att: 0, tx: 0, best: false };
    var scen = { worst: { alpha: .25, sl: .1, conn: 1.0, res: 3 }, best: { alpha: .19, sl: .05, conn: .6, res: 0 } };
    var fL = U.rangeField({ id: 'o-L', label: 'Longitud del tramo', min: 5, max: 110, step: .1, value: S.L, fmt: function (v) { return v.toFixed(1) + ' km'; }, onInput: function (v) { S.L = v; S.spl = Math.ceil(v / 4) + 2; fS.set(S.spl); draw(); } });
    var fS = U.rangeField({ id: 'o-S', label: 'Empalmes', min: 0, max: 40, step: 1, value: S.spl, fmt: function (v) { return String(v); }, onInput: function (v) { S.spl = v; draw(); } });
    var fT = U.rangeField({ id: 'o-T', label: 'Potencia del transmisor', min: 0, max: 4, step: .1, value: S.tx, fmt: function (v) { return v.toFixed(1) + ' dBm'; }, hint: 'El ZR transmite entre 0 y +4 dBm.', onInput: function (v) { S.tx = v; draw(); } });
    var attWrap = document.createElement('div'); attWrap.className = 'field';
    attWrap.innerHTML = '<div class="field__row"><span class="field__lab">Atenuador en el receptor</span></div><div class="seg seg--tight" role="group" aria-label="Atenuador">' +
      [0, 3, 5, 10].map(function (a) { return '<button type="button" class="seg__b' + (a === 0 ? ' is-on' : '') + '" data-att="' + a + '">' + (a ? a + ' dB' : 'Ninguno') + '</button>'; }).join('') + '</div>';
    var scWrap = document.createElement('div'); scWrap.className = 'field';
    scWrap.innerHTML = '<div class="field__row"><span class="field__lab">Escenario</span></div><div class="seg seg--tight" role="group" aria-label="Escenario">' +
      '<button type="button" class="seg__b is-on" data-scen="worst">Peor caso</button><button type="button" class="seg__b" data-scen="best">Mejor caso</button></div>' +
      '<span class="field__hint" id="scen-hint"></span>';
    [fL.el, fS.el, fT.el, attWrap, scWrap].forEach(function (e) { box.appendChild(e); });

    function calc() {
      var c = S.best ? scen.best : scen.worst;
      var fib = c.alpha * S.L, spl = S.spl * c.sl, con = c.conn, att = S.att, res = c.res;
      var prxNo = S.tx - fib - spl - con - att;   // sin reserva: para revisar saturación
      var prx = prxNo - res;                      // con reserva: para revisar sensibilidad
      var prxR = U.r1(prx);
      return { c: c, fib: fib, spl: spl, con: con, att: att, res: res, loss: fib + spl + con, prx: prx, prxR: prxR, prxNo: prxNo, margin: +(prxR - O.sens).toFixed(1), toSat: +(O.overload - U.r1(prxNo)).toFixed(1) };
    }
    function draw() {
      var r = calc();
      var sat = r.prxNo > O.overload, low = r.prxR < O.sens;
      var tone = (sat || low) ? 'o-bad' : 'o-ok';
      var msg = low ? 'Sin margen: el receptor no recibe señal suficiente. Hace falta repotenciar.' : (sat ? 'Saturación: el receptor recibe demasiada luz. Hace falta un atenuador.' : 'Dentro de la ventana operativa del receptor.');
      // escala de -32 a +6 dBm
      var X0 = 20, X1 = 640, mn = -32, mx = 6, sx = function (v) { return X0 + (v - mn) / (mx - mn) * (X1 - X0); };
      var mk = sx(U.clamp(r.prxR, mn, mx));
      var scale = '<svg class="o-scale" viewBox="0 0 660 120" role="img" aria-label="Escala de potencia recibida">' +
        '<rect x="' + sx(mn) + '" y="34" width="' + (sx(O.sens) - sx(mn)) + '" height="30" fill="var(--bad-soft)"/>' +
        '<rect x="' + sx(O.sens) + '" y="34" width="' + (sx(O.overload) - sx(O.sens)) + '" height="30" fill="var(--ok-soft)"/>' +
        '<rect x="' + sx(O.overload) + '" y="34" width="' + (sx(mx) - sx(O.overload)) + '" height="30" fill="var(--bad-soft)"/>' +
        '<line x1="' + sx(O.sens) + '" x2="' + sx(O.sens) + '" y1="28" y2="70" stroke="var(--bad)" stroke-width="2"/><line x1="' + sx(O.overload) + '" x2="' + sx(O.overload) + '" y1="28" y2="70" stroke="var(--bad)" stroke-width="2"/>' +
        '<text x="' + sx(O.sens) + '" y="86" text-anchor="middle">−24 sensibilidad</text><text x="' + sx(O.overload) + '" y="86" text-anchor="middle">−7 saturación</text>' +
        '<text x="' + ((sx(mn) + sx(O.sens)) / 2) + '" y="52" text-anchor="middle" style="fill:var(--bad)">sin señal</text><text x="' + ((sx(O.sens) + sx(O.overload)) / 2) + '" y="52" text-anchor="middle" style="fill:var(--ok)">ventana operativa</text><text x="' + ((sx(O.overload) + sx(mx)) / 2) + '" y="52" text-anchor="middle" style="fill:var(--bad)">satura</text>' +
        '<g style="transition:transform .25s"><path d="M' + mk + ' 30 l-9 -16 h18 z" fill="var(--accent)"/><line x1="' + mk + '" x2="' + mk + '" y1="30" y2="70" stroke="var(--accent)" stroke-width="3"/></g>' +
        '<text x="' + X0 + '" y="110">−32 dBm</text><text x="' + X1 + '" y="110" text-anchor="end">+6 dBm</text></svg>';
      // cascada de pérdidas
      var rows = [['Transmisor', S.tx, null], ['Fibra', -r.fib, r.fib], ['Empalmes', -r.spl, r.spl], ['Conectores', -r.con, r.con], ['Atenuador', -r.att, r.att], ['Reserva', -r.res, r.res]];
      var top = Math.max(0.1, r.fib, r.spl, r.con, r.att, r.res, S.tx);
      var wf = '<div class="o-wf">' + rows.map(function (x) {
        var v = x[2] == null ? S.tx : x[2];
        return '<div class="o-wf__row"><span>' + x[0] + '</span><span class="o-wf__bar" style="width:' + Math.max(1, v / top * 100) + '%;' + (x[2] == null ? 'background:var(--ok)' : '') + '"></span><span>' + (x[2] == null ? '+' + S.tx.toFixed(1) : '−' + v.toFixed(1)) + ' dB</span></div>';
      }).join('') + '</div>';
      // alcance máximo por tramo (sin atenuador): Tx - res - conn - 2*sl - sens = L*(alpha + sl/4)
      var Lmax = (S.tx - r.res - r.con - 2 * r.c.sl - O.sens) / (r.c.alpha + r.c.sl / 4);
      var nodes = Math.max(0, Math.ceil(148 / Lmax) - 1);
      view.innerHTML =
        '<div class="o-state"><div class="o-big ' + tone + '">' + U.f1(r.prx) + '<small> dBm</small></div><div><b class="' + tone + '">' + msg + '</b><br><span style="color:var(--muted);font-size:.92rem">Margen sobre la sensibilidad: <b class="mono">' + r.margin.toFixed(1) + ' dB</b>' + (r.toSat > 0 || sat ? ' · hasta la saturación: <b class="mono">' + r.toSat.toFixed(1) + ' dB</b>' : '') + '</span></div></div>' +
        scale + wf +
        '<p class="o-reach">Con estos parámetros y sin atenuador, un tramo alcanza <b>' + Lmax.toFixed(0) + ' km</b>. Para cubrir 148 km hacen falta <b>' + nodes + ' nodos de repotencia</b>.</p>';
      U.$('#scen-hint').textContent = S.best ? 'Mejor caso: 0.19 dB/km, empalmes de 0.05 dB, conectores de 0.3 dB y sin reserva. Sirve para revisar la saturación.' : 'Peor caso: 0.25 dB/km, empalmes de 0.1 dB, conectores de 0.5 dB y 3 dB de reserva. Sirve para revisar la sensibilidad.';
    }
    var PRE = { t1: { L: 60.3, spl: 17, att: 0 }, t2: { L: 45.8, spl: 13, att: 5 }, t3: { L: 41.6, spl: 12, att: 5 } };
    function setAtt(a) { S.att = a; U.$$('[data-att]', attWrap).forEach(function (b) { b.classList.toggle('is-on', +b.dataset.att === a); }); }
    function apply(id) {
      var p = PRE[id]; S.L = p.L; S.spl = p.spl; S.tx = 0; S.best = false;
      fL.set(p.L); fS.set(p.spl); fT.set(0); setAtt(p.att);
      U.$$('[data-scen]', scWrap).forEach(function (b) { b.classList.toggle('is-on', b.dataset.scen === 'worst'); });
      presets.forEach(function (b) { b.classList.toggle('is-on', b.dataset.preset === id); });
      draw();
    }
    attWrap.addEventListener('click', function (e) { var b = e.target.closest('[data-att]'); if (!b) return; setAtt(+b.dataset.att); presets.forEach(function (x) { x.classList.remove('is-on'); }); draw(); });
    scWrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-scen]'); if (!b) return;
      S.best = b.dataset.scen === 'best'; if (S.best) { S.tx = 4; fT.set(4); } else { S.tx = 0; fT.set(0); }
      U.$$('[data-scen]', scWrap).forEach(function (x) { x.classList.toggle('is-on', x === b); }); draw();
    });
    U.$('#optics-form').addEventListener('click', function (e) {
      var b = e.target.closest('[data-preset]'); if (!b) return;
      if (b.dataset.preset === 'best') { U.$('[data-scen="best"]', scWrap).click(); presets.forEach(function (x) { x.classList.toggle('is-on', x === b); }); return; }
      apply(b.dataset.preset);
    });
    apply('t2');
    return { apply: apply, setBest: function () { U.$('[data-scen="best"]', scWrap).click(); } };
  }

  /* ------------------------------------------------------------- monitoreo */
  function initMonitor() {
    var list = U.$('#monitor-list'), live = U.$('#monitor-live');
    list.innerHTML = D.monitor.map(function (m) {
      return '<div class="mon-row"><h4>' + m.q + '</h4><p>' + m.how + '</p><span class="al">Alarma: ' + m.alarm + '</span></div>';
    }).join('');
    var N = 60, loss = [], lat = [], rx = [], t0 = Date.now(), alarms = [], deg = 0, cut = false, lossSpike = 0;
    for (var i = 0; i < N; i++) { loss.push(0); lat.push(.8); rx.push(-20.8); }
    live.innerHTML =
      '<div class="live__grid">' +
      '<div class="gauge" data-g="loss"><div class="gauge__top"><span>Pérdida de paquetes A a B</span><span class="gauge__val">0 %</span></div><svg viewBox="0 0 300 46" preserveAspectRatio="none"><path/></svg></div>' +
      '<div class="gauge" data-g="lat"><div class="gauge__top"><span>Retardo A a B</span><span class="gauge__val">0.8 ms</span></div><svg viewBox="0 0 300 46" preserveAspectRatio="none"><path/></svg></div>' +
      '<div class="gauge" data-g="rx"><div class="gauge__top"><span>Potencia recibida, NR-1</span><span class="gauge__val">−20.8 dBm</span></div><svg viewBox="0 0 300 46" preserveAspectRatio="none"><path/></svg></div></div>' +
      '<div class="live__ctrl" id="mon-ctrl"></div><div class="alarms" id="alarms"><span class="none">Sin alarmas. Valores simulados con fines ilustrativos.</span></div>';
    var f = U.rangeField({ id: 'deg', label: 'Degradar la fibra del tramo 1', min: 0, max: 6, step: .1, value: 0, fmt: function (v) { return v.toFixed(1) + ' dB'; }, hint: 'Alarma si la potencia cae más de 2 dB o baja de −22 dBm.', onInput: function (v) { deg = v; } });
    U.$('#mon-ctrl').appendChild(f.el);
    var G = {}; U.$$('[data-g]', live).forEach(function (g) { G[g.dataset.g] = g; });
    function path(arr, lo, hi) { return 'M' + arr.map(function (v, i) { return (i * 300 / (N - 1)).toFixed(1) + ' ' + (44 - U.clamp((v - lo) / (hi - lo), 0, 1) * 40).toFixed(1); }).join(' L'); }
    function stamp() { var s = Math.round((Date.now() - t0) / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
    function push(cls, txt) {
      alarms.unshift('<div class="a ' + cls + '"><time>' + stamp() + '</time><b>' + txt + '</b></div>'); alarms = alarms.slice(0, 4);
      U.$('#alarms').innerHTML = alarms.join('');
    }
    var lastBad = false, lastWarn = false;
    U.bus.on('cut', function (d) {
      cut = d.cut;
      if (d.cut) { lossSpike = 3; push('bad', 'Conmutación al respaldo: cambio de ruta OSPF'); }
      else push('good', 'Fibra restaurada: la ruta principal vuelve a OSPF');
    });
    function tick() {
      var n = function (a) { return (Math.random() - .5) * a; };
      var rxv = cut ? -40 : -20.8 - deg + n(.15);
      var lv = lossSpike > 0 ? 100 : 0; if (lossSpike > 0) lossSpike--;
      var tv = cut ? 11 + n(.8) : .8 + n(.05);
      loss.push(lv); lat.push(tv); rx.push(rxv); [loss, lat, rx].forEach(function (a) { a.shift(); });
      function setG(k, val, txt, bad) { G[k].querySelector('.gauge__val').textContent = txt; G[k].querySelector('path').setAttribute('d', path(val.arr, val.lo, val.hi)); G[k].classList.toggle('is-bad', !!bad); }
      var bad = !cut && (rxv < -22 || deg > 2);
      setG('loss', { arr: loss, lo: 0, hi: 100 }, lv + ' %', lv > 0);
      setG('lat', { arr: lat, lo: 0, hi: 16 }, tv.toFixed(1) + ' ms', tv > 3);
      setG('rx', { arr: rx, lo: -42, hi: -16 }, cut ? 'sin luz' : U.f1(rxv) + ' dBm', bad || cut);
      if (bad && !lastBad) push('bad', deg > 2 ? 'Caída de ' + deg.toFixed(1) + ' dB respecto a la línea base' : 'Potencia recibida < −22 dBm');
      if (!bad && lastBad && !cut) push('good', 'Potencia óptica normalizada');
      lastBad = bad;
    }
    var timer = null;
    function run() { if (timer || U.reduce) return; timer = setInterval(tick, 1000); }
    function stop() { clearInterval(timer); timer = null; }
    var io = new IntersectionObserver(function (en) { en[0].isIntersecting ? run() : stop(); }, { threshold: .1 });
    io.observe(live);
    if (U.reduce) { tick(); }
    return { tick: tick, setDeg: function (v) { deg = v; f.set(v); } };
  }

  window.RouteMod = { initLegs: initLegs, initMedia: initMedia, initRoute: initRoute, initOptics: initOptics, initMonitor: initMonitor };
})();
