/* Arranque del sitio: inicializa cada módulo, navegación, tema y acciones del recorrido. */
(function () {
  'use strict';
  var A = {};   // instancias para el recorrido

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    // tema
    var root = document.documentElement;
    U.$('#theme-toggle').addEventListener('click', function () {
      var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', t); U.store.set('mp2-theme', t);
    });
    // los formularios son solo controles de simulación: nunca se envían
    U.$$('form').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });
    // menú móvil
    var menu = U.$('#menu-toggle'), links = U.$('#nav-links');
    menu.addEventListener('click', function () { var o = links.classList.toggle('is-open'); menu.setAttribute('aria-expanded', o); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) { links.classList.remove('is-open'); menu.setAttribute('aria-expanded', false); } });

    // módulos
    RouteMod.initLegs();
    A.media = RouteMod.initMedia();
    A.route = RouteMod.initRoute();
    A.optics = RouteMod.initOptics();
    A.monitor = RouteMod.initMonitor();
    A.racks = RacksMod.initRacks();
    A.blds = RacksMod.initBuildings();
    A.spec = WifiMod.initSpectrum();
    A.cap = WifiMod.initCapacity();
    A.plans = WifiMod.initPlans();
    WifiMod.initGear();
    A.dfs = DfsMod.initDFS();
    A.money = MoneyMod.initMoney();
    MoneyMod.initCase();
    MoneyMod.initTeam();

    // revelado y contadores
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        U.$$('[data-count]', e.target).forEach(function (c) { if (!seen.has(c)) { seen.add(c); U.countUp(c); } });
        io.unobserve(e.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    U.$$('.reveal').forEach(function (el) { io.observe(el); });
    if (U.reduce) U.$$('[data-count]').forEach(U.countUp);

    // sección activa en la navegación
    var map = {}; U.$$('.nav__links a').forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var groups = { caso: 'caso', cifras: 'caso', medio: 'medio', ruta: 'medio', optico: 'medio', racks: 'medio', monitoreo: 'medio', edificios: 'edificios', frecuencias: 'frecuencias', capacidad: 'frecuencias', planos: 'frecuencias', dfs: 'dfs', inversion: 'inversion', equipo: 'equipo' };
    var io2 = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return; var g = groups[e.target.id];
        U.$$('.nav__links a').forEach(function (a) { a.classList.toggle('is-active', a === map[g]); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    U.$$('main section[id]').forEach(function (s) { io2.observe(s); });

    // acciones del recorrido
    var act = {
      media: function (id) { A.media.select(id); },
      route: function (s) { A.route.select(/^\d$/.test(s) ? +s : s); },
      cut: function (v) { U.bus.emit('cutRequest', v === 'on'); },
      optics: function (id) { id === 'best' ? A.optics.setBest() : A.optics.apply(id); },
      rack: function (id) { A.racks.show(id); },
      mon: function (v) { A.monitor.setDeg(parseFloat(v)); },
      bld: function (k, v) { if (k === 'dist') A.blds.setDist(+v); else A.blds.cut(v === 'on'); },
      spec: function (k, v) { k === 'w' ? A.spec.setWidth(v) : A.spec.setSite(v); },
      cap: function (site) { A.cap.site(site); },
      plan: function (k, v) { if (k === 'r') A.plans.setRadius(parseFloat(v)); else if (k === 'sel') A.plans.select(v); else A.plans.setPlan(k); },
      dfs: function (mode) { A.dfs.setMode(mode); A.dfs.run(); },
      money: function (id) { A.money.select(id); }
    };
    if (window.Tour) Tour.registerActions(act);
    window.MP2App = A;
  });
})();
