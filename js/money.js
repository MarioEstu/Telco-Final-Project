/* Inversión, caso, conclusiones y grupo. */
(function () {
  'use strict';
  var D = MP2, C = D.costs, FX = D.fx;

  /* ------------------------------------------------------------- inversión */
  function initMoney() {
    var chart = U.$('#money-chart'), det = U.$('#money-detail');
    var REQ = [
      { id: 'r1', name: 'Enlace central a planta', sub: 'Fibra ADSS de 148 km, nodos, routers y monitoreo', col: 'var(--accent)' },
      { id: 'r3', name: 'Solución Wi-Fi', sub: '19 APs Wi-Fi 7, switch PoE y licencias', col: 'color-mix(in srgb, var(--accent) 45%, var(--surface-2))' },
      { id: 'r2', name: 'Enlace entre edificios', sub: 'Fibra OS2 de 110 m y radio de 60 GHz', col: 'var(--muted)' }
    ];
    var S = { iva: false, gtq: false, sel: 'r1' };
    var totalNet = C.r1.total + C.r2.total + C.r3.total;
    function conv(v) { var x = v * (S.iva ? 1 + FX.iva : 1) * (S.gtq ? FX.gtq : 1); return (S.gtq ? 'Q ' : 'USD ') + U.usd(x, 2); }
    function convBig(v) { var x = v * (S.iva ? 1 + FX.iva : 1) * (S.gtq ? FX.gtq : 1); return (S.gtq ? 'Q' : '$') + U.usd(Math.round(x)); }
    function draw() {
      var R0 = 80, CIRC = 2 * Math.PI * R0, off = 0;
      var arcs = REQ.map(function (r) {
        var frac = C[r.id].total / totalNet, len = frac * CIRC;
        var a = '<circle class="dn' + (S.sel === r.id ? '' : ' is-dim') + '" data-id="' + r.id + '" cx="110" cy="110" r="' + R0 + '" stroke="' + r.col + '" stroke-dasharray="' + (len - 3).toFixed(2) + ' ' + (CIRC - len + 3).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 110 110)"/>';
        off += len; return a;
      }).join('');
      var items = [];
      ['r1', 'r2', 'r3'].forEach(function (k) { C[k].items.forEach(function (i) { items.push(i); }); });
      items.sort(function (a, b) { return b.t - a.t; });
      var top = items.slice(0, 5), mx = top[0].t;
      var net = totalNet;
      chart.innerHTML =
        '<div class="money__ctrl"><div class="seg seg--tight" role="group" aria-label="IVA"><button type="button" class="seg__b' + (!S.iva ? ' is-on' : '') + '" data-f="iva0">Sin IVA</button><button type="button" class="seg__b' + (S.iva ? ' is-on' : '') + '" data-f="iva1">Con IVA 12 %</button></div>' +
        '<div class="seg seg--tight" role="group" aria-label="Moneda"><button type="button" class="seg__b' + (!S.gtq ? ' is-on' : '') + '" data-f="usd">USD</button><button type="button" class="seg__b' + (S.gtq ? ' is-on' : '') + '" data-f="gtq">Quetzales</button></div></div>' +
        '<div class="donut"><svg viewBox="0 0 220 220" role="img" aria-label="Distribución del presupuesto">' + arcs + '</svg><div class="donut__c"><b>' + convBig(net) + '</b><small>' + (S.iva ? 'con IVA' : 'sin IVA') + '</small></div></div>' +
        '<div class="legend-r">' + REQ.map(function (r) {
          return '<button type="button" data-id="' + r.id + '" class="' + (S.sel === r.id ? 'is-sel' : '') + '"><i style="background:' + r.col + '"></i><span>' + r.name + '</span><span class="mono">' + (C[r.id].total / net * 100).toFixed(1) + ' %</span></button>';
        }).join('') + '</div>' +
        '<p class="chart-title" style="margin-top:24px">Las cinco partidas mayores</p>' +
        top.map(function (i) { return '<div class="hbar" style="grid-template-columns:1fr"><span class="hbar__name" style="color:var(--text);font-size:.86rem">' + i.n.replace(/\s*\(.*\)$/, '').slice(0, 44) + '</span><span class="hbar__track"><span class="hbar__fill" style="background:var(--accent);width:' + Math.max(4, i.t / mx * 62) + '%"></span><span class="hbar__val">' + (S.gtq ? 'Q ' + U.usd(i.t * FX.gtq * (S.iva ? 1.12 : 1)) : 'USD ' + U.usd(i.t * (S.iva ? 1.12 : 1))) + '</span></span></div>'; }).join('');
      var r = REQ.filter(function (x) { return x.id === S.sel; })[0], c = C[r.id];
      det.innerHTML = '<h3 class="h3" style="margin-bottom:2px">' + r.name + '</h3><p class="chart-sub">' + r.sub + '</p>' +
        '<div class="items-wrap"><table class="items"><thead><tr><th>Concepto</th><th>Cantidad</th><th style="text-align:right">Total</th></tr></thead><tbody>' +
        c.items.map(function (i) { return '<tr><td>' + i.n + (i.o === 'Mercado' ? '' : '<span class="est">' + (i.o === 'Estimación' ? 'estimación' : i.o.toLowerCase()) + '</span>') + '</td><td class="n">' + i.q + '</td><td class="n">' + (S.gtq ? 'Q ' + U.usd(i.t * FX.gtq * (S.iva ? 1.12 : 1), 2) : U.usd(i.t * (S.iva ? 1.12 : 1), 2)) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="sumline"><span>Subtotal</span><span>' + conv(c.sub) + '</span></div>' +
        '<div class="sumline" style="border:0;padding-top:4px"><span>Contingencia 10 %</span><span>' + conv(c.cont) + '</span></div>' +
        '<div class="sumline" style="border-top-color:var(--accent)"><b>Total del requerimiento</b><b>' + conv(c.total) + '</b></div>';
    }
    chart.addEventListener('click', function (e) {
      var f = e.target.closest('[data-f]'), id = e.target.closest('[data-id]');
      if (f) { var k = f.dataset.f; if (k === 'iva0') S.iva = false; else if (k === 'iva1') S.iva = true; else if (k === 'usd') S.gtq = false; else S.gtq = true; draw(); }
      else if (id) { S.sel = id.dataset.id; draw(); }
    });
    draw();
    return { select: function (id) { S.sel = id; draw(); }, iva: function (v) { S.iva = v; draw(); } };
  }

  /* ------------------------------------------------------------- caso */
  function initCase() {
    var sites = U.$('#sites');
    sites.innerHTML =
      '<article class="site"><h4><b>A</b>Oficinas centrales</h4><p>Nivel 6 del Edificio Las Margaritas, zona 10 de la ciudad de Guatemala.</p><div class="chips"><span>Nube privada</span><span>SAN y SAN de respaldo</span><span>Firewall</span><span>Routers y switches</span></div></article>' +
      '<article class="site"><h4><b>B</b>Planta solar</h4><p>Cabecera de San Manuel Chaparrón, Jalapa (14.521165, −89.764833). Dos edificios de oficinas separados 110 m.</p><div class="chips"><span>Servidores web locales</span><span>Control de flujo eléctrico</span><span>Firewall</span><span>Routers y switches</span></div></article>';
    U.$$('.acc__btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') === 'true', p = document.getElementById(b.getAttribute('aria-controls'));
        U.$$('.acc__btn').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); document.getElementById(x.getAttribute('aria-controls')).hidden = true; });
        b.setAttribute('aria-expanded', String(!open)); p.hidden = open;
      });
    });
  }

  /* ------------------------------------------------------------- conclusiones y grupo */
  function initTeam() {
    var T = window.TEAM || { members: [] };
    U.$('#concl').innerHTML = D.conclusions.map(function (c) { return '<li><h3>' + c.h + '</h3><p>' + c.t + '</p></li>'; }).join('');
    var esc = U.esc;
    U.$('#team').innerHTML = T.members.map(function (m, i) {
      var ini = m.name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase() || String(i + 1);
      var meta = [];
      if (m.carne) meta.push('Carné ' + m.carne);
      if (m.pct != null && m.pct !== '') meta.push(m.pct + ' % del trabajo');
      return '<article class="member"><div class="ini">' + esc(ini) + '</div><h4>' + esc(m.name) + '</h4>' +
        (m.role ? '<div class="chips member__role"><span>' + esc(m.role) + '</span></div>' : '') +
        (meta.length ? '<p class="mono">' + esc(meta.join('. ')) + '</p>' : '') +
        (m.sections ? '<p class="member__sec">' + esc(m.sections) + '</p>' : '') +
        (m.review ? '<p class="member__rev">' + esc(m.review) + '</p>' : '') + '</article>';
    }).join('');
    U.$('#footer-id').textContent = T.school + ', ' + T.faculty + '. Curso de ' + T.course + ', ' + T.shift.toLowerCase() + '. ' +
      (T.group ? T.group + '. ' : '') + (T.professor ? 'Catedrático: ' + T.professor + '. ' : '') + T.date + '.';
  }

  window.MoneyMod = { initMoney: initMoney, initCase: initCase, initTeam: initTeam };
})();
