/* Racks interactivos y enlace entre edificios. */
(function () {
  'use strict';
  var D = MP2;

  function wrap(text, n) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) { if ((cur + ' ' + w).trim().length > n) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) lines.push(cur); return lines;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ------------------------------------------------------------- racks */
  function initRacks() {
    var tabs = U.$('#rack-tabs'), view = U.$('#rack-view'), det = U.$('#rack-detail');
    var cur = 'A', selItem = null;
    tabs.innerHTML = D.racks.map(function (r) { return '<button type="button" class="seg__b" role="tab" data-id="' + r.id + '">' + r.title + '</button>'; }).join('');

    function drawDetail(item) {
      if (!item || !item.i || typeof item.i === 'string') {
        det.innerHTML = '<div class="dev dev--empty">' + U.icon('hand-pointing', '') + '<p>Seleccione un equipo resaltado en ámbar para ver modelo, función y precio.</p></div>'; return;
      }
      var i = item.i;
      det.innerHTML = '<div class="dev"><h3>' + esc(i.m) + '</h3><p class="role">' + esc(i.f) + '</p><p>' + esc(i.s) + '</p><p class="price">' + esc(i.p) + '</p></div>';
    }
    function draw() {
      var r = D.racks.filter(function (x) { return x.id === cur; })[0];
      U.$$('.seg__b', tabs).forEach(function (b) { var on = b.dataset.id === cur; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      var UH = r.units > 20 ? 17 : 34, X = 54, W = 430, PAD = 14, H = r.units * UH + PAD * 2 + 56;
      var s = '<svg class="rk" viewBox="0 0 ' + (W + X + 24) + ' ' + H + '" role="img" aria-label="' + r.title + '">';
      s += '<text x="' + X + '" y="22" style="font-weight:650;font-size:15px">' + r.title + '</text><text x="' + X + '" y="40" class="u" style="font-family:var(--font);font-size:12px">' + r.sub + '</text>';
      var top = 56;
      s += '<rect class="rk-frame" x="' + (X - 8) + '" y="' + top + '" width="' + (W + 16) + '" height="' + (r.units * UH + PAD * 2) + '" rx="8"/>';
      for (var u = 1; u <= r.units; u++) s += '<text class="u" x="' + (X - 14) + '" y="' + (top + PAD + (r.units - u) * UH + UH / 2 + 3.5) + '" text-anchor="end">' + u + '</text>';
      r.items.forEach(function (it, idx) {
        var y = top + PAD + (r.units - it.t) * UH, h = (it.t - it.b + 1) * UH, cls = 'rk-' + (it.k === 'new' ? 'new' : it.k === 'existing' ? 'existing' : 'passive');
        var attrs = it.k === 'new' ? ' tabindex="0" role="button" aria-label="' + esc(it.l) + '"' : '';
        s += '<g data-i="' + idx + '"' + attrs + '><rect class="' + cls + (selItem === idx ? ' is-sel' : '') + '" x="' + X + '" y="' + (y + 1.5) + '" width="' + W + '" height="' + (h - 3) + '" rx="5"/>';
        var maxc = Math.floor(W / (UH > 20 ? 7.2 : 6.8)), lines = wrap(it.l, maxc);
        var fs = lines.length > 1 && h < lines.length * 15 ? 11 : 12;
        lines.forEach(function (ln, k) {
          s += '<text x="' + (X + W / 2) + '" y="' + (y + h / 2 + 4 + (k - (lines.length - 1) / 2) * 15) + '" text-anchor="middle" style="font-size:' + fs + 'px;' + (it.k === 'new' ? 'font-weight:650' : '') + '">' + esc(ln) + '</text>';
        });
        s += '</g>';
      });
      s += '</svg>';
      view.innerHTML = s + '<div class="rk-legend"><span><i class="n"></i>Equipo nuevo</span><span><i class="e"></i>Equipo existente</span><span><i class="p"></i>Pasivo o espacio libre</span></div>';
      drawDetail(selItem != null ? r.items[selItem] : null);
    }
    function pick(idx) { var r = D.racks.filter(function (x) { return x.id === cur; })[0]; selItem = idx; draw(); }
    function firstNew() { var r = D.racks.filter(function (x) { return x.id === cur; })[0]; for (var i = 0; i < r.items.length; i++) if (r.items[i].k === 'new') return i; return null; }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.seg__b'); if (!b) return; cur = b.dataset.id; selItem = firstNew(); draw(); });
    view.addEventListener('click', function (e) { var g = e.target.closest('[data-i]'); if (!g) return; var r = D.racks.filter(function (x) { return x.id === cur; })[0]; var it = r.items[+g.dataset.i]; if (it.k === 'new') pick(+g.dataset.i); });
    view.addEventListener('keydown', function (e) { var g = e.target.closest('[data-i]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(+g.dataset.i); } });
    view.addEventListener('mousemove', function (e) {
      var g = e.target.closest('[data-i]'); if (!g) return U.tip.hide();
      var r = D.racks.filter(function (x) { return x.id === cur; })[0], it = r.items[+g.dataset.i];
      var t = typeof it.i === 'string' ? it.i : (it.k === 'new' ? 'Toque para ver el detalle' : null);
      if (t) U.tip.show(t, e.clientX, e.clientY); else U.tip.hide();
    });
    view.addEventListener('mouseleave', U.tip.hide);
    selItem = firstNew(); draw();
    return { show: function (id) { cur = id; selItem = firstNew(); draw(); } };
  }

  /* ------------------------------------------------------------- enlace entre edificios */
  function initBuildings() {
    var B = D.buildings, bd = B.budget, ruler = U.$('#blds-ruler'), planBox = U.$('#blds-plan'), status = U.$('#blds-status'), btn = U.$('#blds-cut'), lab = U.$('#blds-cut-label');
    var dist = B.distance;
    ruler.innerHTML = '<p class="chart-title">¿Qué medio llega a esa distancia?</p><p class="chart-sub">Mueva la distancia entre los dos edificios.</p><div id="ruler-f"></div><div id="ruler-rows"></div><p class="o-reach" id="ruler-cost"></p>';
    var f = U.rangeField({ id: 'dist', label: 'Distancia entre edificios', min: 10, max: 150, step: 1, value: dist, fmt: function (v) { return v + ' m'; }, onInput: function (v) { dist = v; row(); } });
    U.$('#ruler-f').appendChild(f.el);
    function row() {
      var span = 150, w = function (m) { return (Math.min(m, span) / span * 100).toFixed(1) + '%'; };
      var utpOk = dist <= B.utpLimit;
      var cable = dist + 40, loss = cable / 1000 * bd.alpha + bd.splices * bd.spliceLoss + bd.conn * bd.connLoss, budget = bd.txMin - bd.sens, margin = budget - loss;
      var rows = [
        { n: 'Cobre UTP', ok: utpOk, bar: dist, res: utpOk ? 'cumple' : 'no cumple', limit: B.utpLimit },
        { n: 'Fibra OS2', ok: true, bar: dist, res: U.f1(margin) + ' dB de margen' },
        { n: 'Radio 60 GHz', ok: dist <= 500, bar: dist, res: 'respaldo' }
      ];
      U.$('#ruler-rows').innerHTML = rows.map(function (r) {
        return '<div class="ruler__row"><span>' + r.n + '</span><div class="ruler__track"><div class="ruler__bar' + (r.ok ? '' : ' is-over') + '" style="width:' + w(r.bar) + '"></div>' +
          (r.limit ? '<div class="ruler__limit" style="left:' + w(r.limit) + '"><em>límite 100 m</em></div>' : '') + '</div><span class="ruler__res ' + (r.ok ? 'ok' : 'bad') + '">' + r.res + '</span></div>';
      }).join('');
      U.$('#ruler-cost').innerHTML = 'Fibra OS2 a 10 Gb/s: presupuesto de <b>' + budget.toFixed(1) + ' dB</b>, pérdida de <b>' + loss.toFixed(2) + ' dB</b>. Costo del requerimiento: <b>USD ' + U.usd(D.costs.r2.total, 2) + '</b>.';
    }
    row();

    // plano esquemático
    var svg = U.svg('svg', { viewBox: '0 0 620 300', role: 'img', 'aria-label': 'Esquema de los dos edificios, el ducto de fibra y el radio de respaldo' });
    svg.innerHTML =
      '<rect class="bld" x="20" y="100" width="160" height="130" rx="10" style="fill:var(--surface-2);stroke:var(--line-strong)"/><rect class="bld" x="440" y="100" width="160" height="130" rx="10" style="fill:var(--surface-2);stroke:var(--line-strong)"/>' +
      '<text class="s-text" x="100" y="128" text-anchor="middle" style="font-weight:600">Edificio 1</text><text class="s-muted" x="100" y="146" text-anchor="middle">rack principal, C9200CX</text>' +
      '<text class="s-text" x="520" y="128" text-anchor="middle" style="font-weight:600">Edificio 2</text><text class="s-muted" x="520" y="146" text-anchor="middle">gabinete 12U, C9200CX</text>' +
      '<line class="s-grid" x1="180" x2="440" y1="262" y2="262" style="stroke:var(--muted);opacity:1"/><line class="s-grid" x1="180" x2="180" y1="254" y2="270" style="stroke:var(--muted);opacity:1"/><line class="s-grid" x1="440" x2="440" y1="254" y2="270" style="stroke:var(--muted);opacity:1"/>' +
      '<text class="s-text s-mono" x="310" y="290" text-anchor="middle">110 m</text>' +
      '<path id="bl-fib" class="s-fiber" d="M180 190 L440 190"/><path id="bl-glow" class="s-fiber-glow" d="M180 190 L440 190"/>' +
      '<path id="bl-rad" class="s-backup" d="M100 84 Q310 6 520 84"/><text class="s-muted" x="310" y="24" text-anchor="middle">Radio 60 GHz de respaldo, línea de vista entre techos</text>' +
      '<g id="bl-mast"><rect x="94" y="84" width="12" height="18" rx="2" fill="var(--text)"/><rect x="514" y="84" width="12" height="18" rx="2" fill="var(--text)"/></g>' +
      '<g>' + [180, 310, 440].map(function (x, i) { return '<rect x="' + (x - 9) + '" y="181" width="18" height="18" rx="3" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>'; }).join('') + '</g>' +
      '<text class="s-muted" x="245" y="176" text-anchor="middle">ducto HDPE, 0.60 m de profundidad</text>' +
      '<g id="bl-pulses"></g><g id="bl-pk"></g><g id="bl-cut"></g>';
    planBox.innerHTML = ''; planBox.appendChild(svg);
    var pulses = U.$('#bl-pulses', svg), pk = U.$('#bl-pk', svg);
    if (!U.reduce) {
      [0, .5].forEach(function (f) {
        pulses.appendChild(U.svg('circle', { r: 5, class: 's-pulse' }, '<animateMotion dur="2.4s" repeatCount="indefinite" begin="-' + (2.4 * f) + 's"><mpath href="#bl-fib"/></animateMotion>'));
        pk.appendChild(U.svg('circle', { r: 4.5, class: 's-pkt' }, '<animateMotion dur="2.8s" repeatCount="indefinite" begin="-' + (2.8 * f) + 's"><mpath href="#bl-rad"/></animateMotion>'));
      });
      pk.style.display = 'none';
    }
    var cut = false, busy = false;
    function idle() { status.innerHTML = '<span class="good">Fibra activa.</span> OSPF la prefiere por su costo 1; el radio queda en espera con costo 10.'; }
    async function toggle(force) {
      if (busy) return; busy = true;
      cut = force == null ? !cut : force;
      U.$('#bl-fib', svg).classList.toggle('is-cut', cut); U.$('#bl-glow', svg).style.display = cut ? 'none' : '';
      pulses.style.display = cut ? 'none' : ''; pk.style.display = cut ? '' : 'none';
      U.$('#bl-rad', svg).classList.toggle('is-live', cut);
      U.$('#bl-cut', svg).innerHTML = cut ? '<circle cx="245" cy="190" r="15" fill="var(--surface)" stroke="var(--bad)" stroke-width="2"/><use href="#i-scissors" x="235" y="180" width="20" height="20" style="color:var(--bad)" fill="currentColor"/>' : '';
      lab.textContent = cut ? 'Restaurar el ducto' : 'Dañar el ducto';
      if (cut) {
        status.innerHTML = '<span class="bad">Ducto dañado por una excavación.</span> BFD detecta la falla.';
        await U.sleep(U.reduce ? 100 : 1100);
        status.innerHTML = '<span class="good">Tráfico en el radio de 60 GHz.</span> Cambio de ruta en menos de 1 s, sin bucles de capa 2.';
      } else idle();
      busy = false;
    }
    btn.addEventListener('click', function () { toggle(); });
    idle();

    // alternativas
    U.$('#blds-alts').innerHTML = B.compare.map(function (a) {
      return '<article class="alt' + (a.ok ? ' is-ok' : '') + '"><h4>' + U.icon(a.ok ? 'check-circle' : 'x-circle') + a.n + '</h4><p>' + a.t + '</p></article>';
    }).join('');
    return { setDist: function (v) { f.set(v); dist = v; row(); }, cut: toggle };
  }

  window.RacksMod = { initRacks: initRacks, initBuildings: initBuildings };
})();
