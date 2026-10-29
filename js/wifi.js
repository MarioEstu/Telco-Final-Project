/* Wi-Fi: espectro, capacidad, planos con cobertura y equipos. */
(function () {
  'use strict';
  var D = MP2, TP = D.throughput, SP = D.spectrum;

  /* ------------------------------------------------------------- espectro */
  function initSpectrum() {
    var box = U.$('#spec-chart'), note = U.$('#spec-note');
    var site = 'z10', wid = 160;
    var X0 = 120, X1 = 980, W = X1 - X0;
    function sx(mhz, lo, hi) { return X0 + (mhz - lo) / (hi - lo) * W; }
    function draw() {
      var s = '<svg viewBox="0 0 1000 420" role="img" aria-label="Plan de canales en 2.4, 5 y 6 GHz" style="min-width:760px">';
      s += '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface-2)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--line-strong)" stroke-width="2"/></pattern></defs>';
      // 2.4 GHz
      s += '<text class="sp-lab" x="0" y="42">2.4 GHz</text><text class="s-muted" x="0" y="60">solo IoT</text>';
      [1, 6, 11].forEach(function (c) {
        var f = 2407 + 5 * c, x = sx(f - 10, 2400, 2484), w = 20 / 84 * W;
        s += '<rect class="sp-ch" x="' + x + '" y="26" width="' + w + '" height="34" rx="5"/><text class="sp-num used" x="' + (x + w / 2) + '" y="48">' + c + '</text>';
      });
      // 5 GHz
      var lo = 5150, hi = 5850, y5 = 150;
      s += '<text class="sp-lab" x="0" y="' + (y5 + 16) + '">5 GHz</text><text class="s-muted" x="0" y="' + (y5 + 34) + '">canales de 20 MHz</text>';
      var chans = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165];
      var cu = site === 'z10' ? SP.z10_40 : SP.planta_80, bw = site === 'z10' ? 40 : 80;
      var usedList = cu.nodfs.concat(cu.dfs);
      function covers(c20) { var fc = 5000 + 5 * c20; return usedList.some(function (u) { var fu = 5000 + 5 * u; return Math.abs(fc - fu) < bw / 2; }); }
      chans.forEach(function (c) {
        var fc = 5000 + 5 * c, x = sx(fc - 10, lo, hi), w = 20 / (hi - lo) * W, dfs = (c >= 52 && c <= 64) || (c >= 100 && c <= 144), ex = SP.excluded.indexOf(c) >= 0;
        var cls = 'sp-ch' + (dfs ? ' dfs' : '') + (ex ? ' excl' : '');
        s += '<rect class="' + cls + '" x="' + x + '" y="' + y5 + '" width="' + (w - 1.5) + '" height="40" rx="3"/><text class="sp-num' + (covers(c) ? ' used' : '') + '" x="' + (x + w / 2 - .7) + '" y="' + (y5 + 24) + '">' + c + '</text>';
      });
      usedList.forEach(function (u) {
        var fu = 5000 + 5 * u, x = sx(fu - bw / 2, lo, hi), w = bw / (hi - lo) * W, dfs = cu.dfs.indexOf(u) >= 0;
        s += '<rect class="sp-ch used' + (dfs ? ' dfs' : '') + '" x="' + (x + 1) + '" y="' + (y5 - 7) + '" width="' + (w - 3) + '" height="54" rx="5" style="fill:none"/><text class="sp-num used" x="' + (x + w / 2) + '" y="' + (y5 - 12) + '" style="fill:var(--accent)">' + u + '</text>';
      });
      // etiquetas de bloques UNII
      [['UNII-1', 36, 48], ['UNII-2A', 52, 64], ['UNII-2C', 100, 144], ['UNII-3', 149, 165]].forEach(function (b) {
        var x1 = sx(5000 + 5 * b[1] - 10, lo, hi), x2 = sx(5000 + 5 * b[2] + 10, lo, hi);
        s += '<path d="M' + x1 + ' ' + (y5 + 52) + ' V' + (y5 + 58) + ' H' + x2 + ' V' + (y5 + 52) + '" fill="none" stroke="var(--line-strong)"/><text class="s-muted" x="' + ((x1 + x2) / 2) + '" y="' + (y5 + 74) + '" text-anchor="middle">' + b[0] + (b[0] === 'UNII-2A' || b[0] === 'UNII-2C' ? ' DFS' : '') + '</text>';
      });
      // 6 GHz
      var y6 = 300, lo6 = 5925, hi6 = 7125;
      s += '<text class="sp-lab" x="0" y="' + (y6 + 16) + '">6 GHz</text><text class="s-muted" x="0" y="' + (y6 + 34) + '">sin DFS, ' + wid + ' MHz</text>';
      var n6 = { 80: 14, 160: 7, 320: 3 }[wid];
      var list = { 80: [7, 23, 39, 55, 71, 87, 103, 119, 135, 151, 167, 183, 199, 215], 160: SP.g6, 320: [31, 95, 159] }[wid];
      for (var i = 0; i < n6; i++) {
        var st = 5945 + wid * i, x = sx(st, lo6, hi6), w = wid / (hi6 - lo6) * W;
        var use = wid === 160;
        s += '<rect class="sp-ch' + (use ? ' used' : '') + '" x="' + (x + 1) + '" y="' + y6 + '" width="' + (w - 3) + '" height="46" rx="5"' + (use ? '' : '') + '/><text class="sp-num' + (use ? ' used' : '') + '" x="' + (x + w / 2) + '" y="' + (y6 + 28) + '" style="font-size:' + (wid === 80 ? 9.5 : 11) + 'px">' + list[i] + '</text>';
      }
      s += '<text class="s-muted" x="' + X0 + '" y="' + (y6 + 70) + '">5925 MHz</text><text class="s-muted" x="' + X1 + '" y="' + (y6 + 70) + '" text-anchor="end">7125 MHz</text>';
      // leyenda
      s += '<g transform="translate(' + X0 + ' 395)"><rect width="22" height="14" rx="3" fill="url(#hatch)" stroke="var(--line-strong)"/><text class="s-muted" x="30" y="12">canal con DFS</text>' +
        '<rect x="150" width="22" height="14" rx="3" class="sp-ch excl"/><text class="s-muted" x="180" y="12">excluido (radar meteorológico)</text>' +
        '<rect x="400" width="22" height="14" rx="3" class="sp-ch used"/><text class="s-muted" x="430" y="12">canal que usa el diseño</text></g>';
      s += '</svg>';
      box.innerHTML = s;
      var t6 = {
        80: 'Con 80 MHz hay 14 canales, pero cada AP rinde 576 Mb/s en 6 GHz en lugar de 1,153: harían falta más APs.',
        160: 'Con 160 MHz hay 7 canales y cada AP de zona 10 tiene uno propio o uno reutilizado a más de 14 m. Es el ancho que usa el diseño.',
        320: 'Con 320 MHz solo quedan 3 canales: los APs vecinos tendrían que compartir canal y se interferirían.'
      }[wid];
      var s5 = site === 'z10' ? 'Zona 10 usa canales de 40 MHz en 5 GHz: 4 sin DFS y 6 con DFS, y excluye 120 a 128.' : 'La planta usa canales de 80 MHz en 5 GHz: 38 y 155 sin DFS, 58, 106 y 138 con DFS.';
      note.textContent = t6 + ' ' + s5;
    }
    U.$('#spec-site').addEventListener('click', function (e) { var b = e.target.closest('.seg__b'); if (!b) return; site = b.dataset.site; U.$$('.seg__b', e.currentTarget).forEach(function (x) { x.classList.toggle('is-on', x === b); }); draw(); });
    U.$('#spec-width').addEventListener('click', function (e) { var b = e.target.closest('.seg__b'); if (!b) return; wid = +b.dataset.w; U.$$('.seg__b', e.currentTarget).forEach(function (x) { x.classList.toggle('is-on', x === b); }); draw(); });
    draw();
    return { setWidth: function (w) { var b = U.$('#spec-width [data-w="' + w + '"]'); if (b) b.click(); }, setSite: function (s) { var b = U.$('#spec-site [data-site="' + s + '"]'); if (b) b.click(); } };
  }

  /* ------------------------------------------------------------- capacidad */
  function phy(nsd) { return TP.nss * nsd * TP.bits * TP.rc / TP.tsym; }
  var R6 = Math.round(phy(TP.nsd160) * TP.mac), R5_40 = Math.round(phy(TP.nsd40) * TP.mac), R5_80 = Math.round(phy(TP.nsd80) * TP.mac);

  function initCapacity() {
    var form = U.$('#cap-fields'), view = U.$('#cap-view'), seg = U.$('#cap-site');
    var PRE = {
      z10: { users: 55, aps: 13, cover: 13, cap: R6 + R5_40, label: '1,153 Mb/s en 6 GHz + 275 Mb/s en 5 GHz a 40 MHz' },
      e1: { users: 17, aps: 3, cover: 3, cap: R6 + R5_80, label: '1,153 Mb/s en 6 GHz + 576 Mb/s en 5 GHz a 80 MHz' },
      e2: { users: 15, aps: 3, cover: 2, cap: R6 + R5_80, label: '1,153 Mb/s en 6 GHz + 576 Mb/s en 5 GHz a 80 MHz' }
    };
    var key = 'z10', S = { users: 55, conc: 60, aps: 13 };
    var fU = U.rangeField({ id: 'c-u', label: 'Usuarios del sitio', min: 5, max: 120, step: 1, value: S.users, fmt: function (v) { return String(v); }, onInput: function (v) { S.users = v; draw(); } });
    var fC = U.rangeField({ id: 'c-c', label: 'Usuarios transmitiendo a la vez', min: 20, max: 100, step: 5, value: S.conc, fmt: function (v) { return v + ' %'; }, hint: 'El diseño usa 60 %, y se verifica también con 100 %.', onInput: function (v) { S.conc = v; draw(); } });
    var fA = U.rangeField({ id: 'c-a', label: 'Access points instalados', min: 1, max: 24, step: 1, value: S.aps, fmt: function (v) { return String(v); }, onInput: function (v) { S.aps = v; draw(); } });
    [fU.el, fC.el, fA.el].forEach(function (e) { form.appendChild(e); });
    function draw() {
      var p = PRE[key], act = Math.max(1, Math.ceil(S.users * S.conc / 100)), per = Math.floor(p.cap / TP.need), need = Math.ceil(act / per);
      var air = S.aps * p.cap / act, air100 = S.aps * p.cap / S.users, okAir = air >= TP.need, ok100 = air100 >= TP.need;
      var SVW = 560, mx = Math.max(air, air100, TP.need * 1.4), sx = function (v) { return v / mx * SVW; };
      view.innerHTML =
        '<div class="cap-res">' +
        '<div class="stat"><small>Usuarios activos</small><b>' + act + '</b></div>' +
        '<div class="stat"><small>Capacidad real por AP</small><b>' + p.cap.toLocaleString('en-US') + ' Mb/s</b></div>' +
        '<div class="stat"><small>Usuarios por AP a 300 Mb/s</small><b>' + per + '</b></div>' +
        '<div class="stat ' + (S.aps >= need ? 'ok' : 'bad') + '"><small>APs mínimos por capacidad</small><b>' + need + '</b></div></div>' +
        '<div class="cap-bar"><div class="cap-bar__lab"><span>Tiempo de aire por usuario con ' + S.conc + ' % activos</span><b class="mono ' + (okAir ? 'o-ok' : 'o-bad') + '">' + Math.round(air) + ' Mb/s</b></div>' +
        '<svg class="cap-bar__sv" viewBox="0 0 ' + (SVW + 20) + ' 40"><rect x="0" y="12" width="' + sx(air) + '" height="16" rx="4" fill="' + (okAir ? 'var(--ok)' : 'var(--bad)') + '"/><line x1="' + sx(TP.need) + '" x2="' + sx(TP.need) + '" y1="2" y2="38" stroke="var(--text)" stroke-width="2" stroke-dasharray="4 3"/><text x="' + (sx(TP.need) + 6) + '" y="10" style="font:500 11px var(--mono);fill:var(--text)">300 requeridos</text></svg>' +
        '<div class="cap-bar__lab" style="margin-top:6px"><span>Con 100 % de usuarios activos</span><b class="mono ' + (ok100 ? 'o-ok' : 'o-bad') + '">' + Math.round(air100) + ' Mb/s</b></div></div>' +
        '<p class="cap-formula">Capacidad por AP: ' + p.label + '. Cada punto de 6 GHz se calcula con <code>2 flujos × 1960 subportadoras × 8 bits × 5/6 ÷ 13.6 µs = ' + Math.round(phy(TP.nsd160)).toLocaleString('en-US') + ' Mb/s</code> y una eficiencia de MAC de 60 %. Por cobertura, el plano necesita <b>' + p.cover + '</b> APs.</p>';
    }
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('.seg__b'); if (!b) return; key = b.dataset.site;
      U.$$('.seg__b', seg).forEach(function (x) { x.classList.toggle('is-on', x === b); });
      var p = PRE[key]; S.users = p.users; S.aps = p.aps; S.conc = 60; fU.set(p.users); fA.set(p.aps); fC.set(60); draw();
    });
    draw();
    return { site: function (k) { var b = U.$('[data-site="' + k + '"]', seg); if (b) b.click(); }, set: function (u, c, a) { S.users = u; S.conc = c; S.aps = a; fU.set(u); fC.set(c); fA.set(a); draw(); } };
  }

  /* ------------------------------------------------------------- planos */
  function inPoly(x, y, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  var FAR = Math.pow(10, 4 / 35);   // radio a 4 dB menos de señal con exponente de pérdida n = 3.5

  function initPlans() {
    var tabs = U.$('#plan-tabs'), stage = U.$('#plan-stage'), panel = U.$('#plan-panel'), rIn = U.$('#plan-r'), rOut = U.$('#plan-r-out'), tg = U.$('#plan-toggles');
    var keys = ['z10', 'e1', 'e2'], key = 'z10', sel = null, R = 8, show = { cells: true, chan: true, blind: true };
    tabs.innerHTML = keys.map(function (k) { return '<button type="button" class="seg__b" role="tab" data-k="' + k + '">' + D.plans[k].title + '</button>'; }).join('');
    var cache = {};
    function build() {
      var p = D.plans[key];
      stage.style.aspectRatio = p.w + ' / ' + p.h;
      stage.innerHTML = '<img src="' + p.img + '" alt="Plano de ' + p.title + '" width="' + p.w + '" height="' + p.h + '"><canvas width="' + p.w + '" height="' + p.h + '"></canvas><svg viewBox="0 0 ' + p.w + ' ' + p.h + '" aria-label="Ubicación de los access points"></svg>';
    }
    function coverage(p, r) {
      var key2 = p.title + r;
      if (cache[key2]) return cache[key2];
      var step = 6, rr = r * p.ppm, rf = rr * FAR, tot = 0, c1 = 0, c2 = 0, unc = [];
      var xs = p.poly.map(function (q) { return q[0]; }), ys = p.poly.map(function (q) { return q[1]; });
      for (var y = Math.min.apply(null, ys); y < Math.max.apply(null, ys); y += step) for (var x = Math.min.apply(null, xs); x < Math.max.apply(null, xs); x += step) {
        if (!inPoly(x, y, p.poly)) continue; tot++;
        var d = 1e9; p.aps.forEach(function (a) { var dd = Math.hypot(a.x - x, a.y - y); if (dd < d) d = dd; });
        if (d <= rr) c1++; else unc.push([x, y]);
        if (d <= rf) c2++;
      }
      return (cache[key2] = { p1: 100 * c1 / tot, p2: 100 * c2 / tot, unc: unc, step: step });
    }
    function draw() {
      var p = D.plans[key], cv = coverage(p, R);
      U.$$('.seg__b', tabs).forEach(function (b) { var on = b.dataset.k === key; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      // canvas de puntos ciegos
      var c = U.$('canvas', stage), ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
      if (show.blind) {
        ctx.fillStyle = 'rgba(205, 45, 40, .42)'; cv.unc.forEach(function (q) { ctx.fillRect(q[0] - 3, q[1] - 3, 6, 6); });
      }
      // svg
      var svg = U.$('svg', stage), s = '';
      s += '<path d="M' + p.poly.map(function (q) { return q.join(' '); }).join(' L') + ' Z" fill="none" stroke="rgba(15,22,29,.35)" stroke-width="2" stroke-dasharray="8 6"/>';
      if (show.cells) p.aps.forEach(function (a) { s += '<circle class="pl-cell" cx="' + a.x + '" cy="' + a.y + '" r="' + (R * p.ppm) + '"/>'; });
      var fs = p.w / 62;
      p.aps.forEach(function (a) {
        s += '<g class="ap" data-id="' + a.id + '" tabindex="0" role="button" aria-label="AP ' + a.id + '"><circle class="pl-ap' + (sel === a.id ? ' is-sel' : '') + '" cx="' + a.x + '" cy="' + a.y + '" r="' + (fs * 1.45) + '"/><text class="pl-apn" x="' + a.x + '" y="' + a.y + '" style="font-size:' + fs + 'px">' + a.id + '</text></g>';
        if (show.chan) s += '<text class="pl-chan" x="' + (a.x + fs * 1.9) + '" y="' + (a.y - fs * 0.1) + '" style="font-size:' + (fs * .95) + 'px">6G ' + a.c6 + '</text><text class="pl-chan" x="' + (a.x + fs * 1.9) + '" y="' + (a.y + fs * 1.05) + '" style="font-size:' + (fs * .95) + 'px">5G ' + a.c5 + (a.dfs ? ' DFS' : '') + '</text>';
      });
      svg.innerHTML = s; svg.style.pointerEvents = 'none';
      rOut.textContent = R.toFixed(1) + ' m';
      // panel
      var chips = p.aps.map(function (a) { return '<li><button type="button" data-id="' + a.id + '" class="' + (sel === a.id ? 'is-sel' : '') + '">' + a.id + '</button></li>'; }).join('');
      var card;
      var ap = sel && p.aps.filter(function (a) { return a.id === sel; })[0];
      if (ap) {
        var nd = null, dm = 1e9;
        if (ap.dfs) p.aps.forEach(function (o) { if (!o.dfs) { var d = Math.hypot(o.x - ap.x, o.y - ap.y) / p.ppm; if (d < dm) { dm = d; nd = o; } } });
        card = '<div class="ap-card"><h3>AP ' + ap.id + '</h3><p class="sub">' + ap.area + '</p><dl class="kv"><dt>Modelo</dt><dd>Cisco ' + p.model + '</dd><dt>6 GHz</dt><dd>canal ' + ap.c6 + ', 160 MHz</dd><dt>5 GHz</dt><dd>canal ' + ap.c5 + (ap.dfs ? ', DFS' : ', sin DFS') + '</dd>' +
          (nd ? '<dt>Respaldo sin DFS</dt><dd>AP ' + nd.id + ' a ' + dm.toFixed(1) + ' m</dd>' : '') + '</dl></div>';
      } else {
        card = '<p style="color:var(--muted);font-size:.93rem;margin-top:16px">Toque un AP del plano o de la lista para ver su canal, su área y su modelo.</p>';
      }
      panel.innerHTML =
        '<h3 class="h3" style="margin-bottom:4px">' + p.title + '</h3><p class="chart-sub" style="margin-bottom:16px">' + p.sub + '. ' + p.users + ' usuarios.</p>' +
        '<div class="cov"><div class="cov__row"><span>Objetivo, −65 dBm</span><b class="mono">' + cv.p1.toFixed(1) + ' %</b><span class="cov__bar ' + (cv.p1 >= 99.9 ? '' : 'part') + '" style="width:' + cv.p1 + '%;height:8px;border-radius:4px;display:block"></span><small>Radio de ' + R.toFixed(1) + ' m en la banda de 6 GHz</small></div>' +
        '<div class="cov__row"><span>Utilizable, unos −69 dBm</span><b class="mono">' + cv.p2.toFixed(1) + ' %</b><span class="cov__bar ' + (cv.p2 >= 99.9 ? '' : 'part') + '" style="width:' + cv.p2 + '%;height:8px;border-radius:4px;display:block"></span><small>Radio de ' + (R * FAR).toFixed(1) + ' m, con exponente de pérdida n = 3.5</small></div></div>' +
        '<ul class="aplist">' + chips + '</ul>' + card;
    }
    function setKey(k) { key = k; sel = null; build(); draw(); }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.seg__b'); if (b) setKey(b.dataset.k); });
    panel.addEventListener('click', function (e) { var b = e.target.closest('[data-id]'); if (!b) return; sel = (sel === b.dataset.id) ? null : b.dataset.id; draw(); });
    stage.addEventListener('click', function (e) { var g = e.target.closest('.ap'); if (!g) return; sel = (sel === g.dataset.id) ? null : g.dataset.id; draw(); });
    stage.addEventListener('keydown', function (e) { var g = e.target.closest('.ap'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sel = g.dataset.id; draw(); } });
    // el svg ignora eventos para no bloquear la imagen; los .ap sí los reciben
    rIn.addEventListener('input', function () { R = parseFloat(rIn.value); draw(); });
    tg.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; var t = b.dataset.t; show[t] = !show[t]; b.classList.toggle('is-on', show[t]); b.setAttribute('aria-pressed', show[t]); draw(); });
    build(); draw();
    return {
      setPlan: setKey, setRadius: function (r) { R = r; rIn.value = r; draw(); },
      select: function (id) { sel = id; draw(); }
    };
  }

  /* ------------------------------------------------------------- equipos */
  function initGear() {
    var c = D.costs.r3.items;
    function f(prefix) { return c.filter(function (i) { return i.n.indexOf(prefix) === 0; })[0]; }
    var cw76 = f('Access point Cisco CW9176I'), cw72 = f('Access point Cisco CW9172I'), lic = f('Licencia'), sw = f('Switch Cisco Catalyst C9300X'), up = f('Módulo de uplink');
    var items = [
      { t: 'Cisco CW9176I', q: cw76.q + ' en zona 10', d: 'Wi-Fi 7 tribanda 4×4:4 por banda, 6 GHz hasta 320 MHz y puerto de 10 Gb/s. Su radio de escaneo dedicada vigila el espectro sin interrumpir a los clientes.', p: 'USD ' + U.usd(cw76.u, 2) + ' cada uno' },
      { t: 'Cisco CW9172I', q: cw72.q + ' en la planta', d: 'Wi-Fi 7 tribanda 2×2:2 con radio de escaneo y puerto de 2.5 Gb/s. Cubre la menor densidad de la planta a menor costo y comparte controlador.', p: 'USD ' + U.usd(cw72.u, 2) + ' cada uno' },
      { t: 'Catalyst C9300X-24HX', q: '1 en zona 10', d: '24 puertos multigigabit con UPOE+ y 735 W de PoE. Alimenta los 13 APs (507 W) y deja 11 puertos libres.', p: 'USD ' + U.usd(sw.u, 2) + ' + módulo ' + U.usd(up.u, 2) },
      { t: 'Controlador 9800-CL', q: 'virtual, sin hardware', d: 'Corre en la nube privada existente y administra los 19 APs de ambos sitios por la fibra. Licencia Wireless Advantage por 5 años: RRM, DFS avanzado y analítica.', p: '19 licencias × USD ' + U.usd(lic.u, 2) }
    ];
    U.$('#gear').innerHTML = items.map(function (i) {
      return '<article class="gear__i"><h4>' + i.t + '</h4><span class="q">' + i.q + '</span><p>' + i.d + '</p><p class="p">' + i.p + '</p></article>';
    }).join('');
  }

  window.WifiMod = { initSpectrum: initSpectrum, initCapacity: initCapacity, initPlans: initPlans, initGear: initGear, R6: R6, R5_40: R5_40, R5_80: R5_80 };
})();
