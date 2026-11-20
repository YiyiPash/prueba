// Sesión del equipo (fase 2, aprobada por Luis el 20/11/2026). Va en TODAS las páginas del equipo:
//   <script src="sesion.js" data-pagina="inicio"></script>   (en consentimiento/ y nota/: src="../sesion.js")
// · Aparato nuevo → contraseña general (la clave del equipo de siempre; la saben Luis y Yoltic).
// · "¿Quién eres?" → PIN de 6 dígitos. La primera vez cada quien crea su PIN, con Luis o Yoltic presentes.
// · Cada perfil ve sus módulos: los elementos con data-ver="dueno artista" solo salen para esos perfiles.
// · iPad del estudio: tras 1 hora sin usarse vuelve a "¿Quién eres?" (lo que estaba a medias no se pierde).
// · Toda petición al Apps Script lleva la sesión; el servidor la usa para "quién hizo" y lo que es solo de dueños.
(function () {
  'use strict';
  var AS_URL = 'https://script.google.com/macros/s/AKfycbwOhVk8lowZwedDv-J0wOCparRSL1MZu9ybJXJ6oru5Br87eLRgtO6Ny10sv947ciuv/exec';
  var yo = document.currentScript, PAG = (yo && yo.getAttribute('data-pagina')) || 'inicio';
  var INICIO = PAG === 'consentimiento' || PAG === 'nota' ? '../' : './';
  // Qué perfiles entran a cada página
  var PAGINAS = { inicio: 'dueno artista ipad', ayuda: 'dueno artista ipad', consentimiento: 'dueno artista ipad', fichas: 'dueno artista ipad',
    nota: 'dueno artista', panel: 'dueno', clientas: 'dueno', config: 'dueno', perfiles: 'dueno' };
  var UNA_HORA = 60 * 60 * 1000;
  var K = { clave: 'yp_pink_clave', sesion: 'ypp_sesion', aparato: 'ypp_aparato', act: 'ypp_actividad', lista: 'ypp_perfiles' };
  // Fuera de yiyipash.com (una copia en la computadora) no hay servidor: se comporta como dueño, sin pedir nada
  var SIN_SERVIDOR = !/(\.github\.io|(^|\.)yiyipash\.com|^localhost|^127\.0\.0\.1)$/.test(location.hostname);

  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  function leerSesion() {
    try {
      var s = JSON.parse(ls.get(K.sesion) || 'null');
      if (!s || !s.token) return null;
      var exp = Number(String(s.token).split('.')[1]) || 0;
      return exp > Date.now() ? s : null;
    } catch (e) { return null; }
  }
  var esIpad = function () { return ls.get(K.aparato) === 'ipad'; };
  var permitido = function (s, lista) { return !!s && (' ' + lista + ' ').indexOf(' ' + s.clave_rol + ' ') >= 0; };

  // ── Toda petición al Apps Script lleva la sesión ─────────────────────
  var fetch0 = window.fetch.bind(window);
  window.fetch = function (url, init) {
    var u = String(url && url.url || url || ''), api = /\/exec(\?|$)/.test(u);
    if (api && init && typeof init.body === 'string' && init.body.charAt(0) === '{') {
      var s = leerSesion();
      if (s) { try { var b = JSON.parse(init.body); if (!b.sesion) { b.sesion = s.token; init = Object.assign({}, init, { body: JSON.stringify(b) }); } } catch (e) {} }
    }
    var p = fetch0(url, init);
    if (api) p.then(function (r) { r.clone().json().then(function (j) { if (j && !j.ok && /sesión ya no vale/i.test(j.error || '')) cerrar('Tu sesión terminó. Vuelve a entrar.'); }).catch(function () {}); }).catch(function () {});
    return p;
  };
  function api(action, data) {
    var body = Object.assign({ action: action, clave: ls.get(K.clave) || '' }, data || {});
    return fetch(AS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || 'Error del servidor'); return j.data; });
  }

  // ── Estilos (todo con prefijo ys-) ───────────────────────────────────
  var css = document.createElement('style');
  css.textContent = [
    '.ys-capa{position:fixed;inset:0;z-index:2147483000;background:#ffe1ee;color:#3b1f2e;font-family:Montserrat,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;overflow:auto;',
    'padding:calc(18px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 32px max(16px,env(safe-area-inset-left,0px))}',
    '.ys-in{max-width:420px;margin:0 auto;display:grid;gap:12px}',
    '.ys-capa h1{margin:4px 0 0;font-size:23px;font-weight:700;color:#b82a6c}',
    '.ys-hint{margin:0;color:#7d5468;font-size:13.5px}',
    '.ys-card{background:#fff;border:1.5px solid #f8c4dc;border-radius:16px;padding:14px;display:grid;gap:10px}',
    '.ys-capa label{display:grid;gap:5px;font-size:13px;font-weight:600}',
    '.ys-capa input{font:inherit;padding:11px 12px;border:1.5px solid #f8c4dc;border-radius:10px;background:#fff7fb;color:#3b1f2e;width:100%;box-sizing:border-box}',
    '.ys-btn{border:none;border-radius:999px;background:linear-gradient(135deg,#d6347f,#ff74af);color:#fff;font:inherit;font-weight:700;font-size:15px;padding:12px 14px;cursor:pointer}',
    '.ys-btn.sec{background:#fff;color:#d6347f;border:1.5px solid #f8c4dc}',
    '.ys-btn:disabled{opacity:.6}',
    '.ys-who{display:grid;gap:8px}',
    '.ys-who button{display:flex;align-items:center;gap:12px;background:#fff;border:1.5px solid #f8c4dc;border-radius:16px;padding:11px 12px;font:inherit;color:#3b1f2e;cursor:pointer;text-align:left}',
    '.ys-who button[aria-pressed="true"]{border-color:#d6347f;box-shadow:0 0 0 2px #ff74af inset}',
    '.ys-av{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:700;color:#fff;background:#d6347f}',
    '.ys-who b{display:block;font-size:16px}.ys-who small{display:block;color:#7d5468;font-size:12.5px}',
    '.ys-pin{display:flex;justify-content:center;gap:11px;margin:2px 0}',
    '.ys-pin i{width:15px;height:15px;border-radius:50%;border:2px solid #d6347f;display:block}.ys-pin i.on{background:#d6347f}',
    '.ys-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
    '.ys-keys button{font:inherit;font-size:22px;font-weight:600;padding:11px 0;border-radius:14px;border:1.5px solid #f8c4dc;background:#fff;color:#3b1f2e;cursor:pointer;font-variant-numeric:tabular-nums}',
    '.ys-keys .k0{grid-column:2}',
    '.ys-err{color:#b4232b;font-size:13.5px;margin:0;text-align:center;min-height:1.2em}',
    '.ys-capa button:focus-visible{outline:3px solid #ff74af;outline-offset:2px}',
    '.ys-barra{display:flex;align-items:center;justify-content:space-between;gap:8px;max-width:520px;margin:0 auto 8px;font-family:Montserrat,system-ui,sans-serif;font-size:12.5px;color:#7d5468}',
    '.ys-chip{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1.5px solid #f8c4dc;border-radius:999px;padding:4px 10px;font-weight:600;color:#3b1f2e}',
    '.ys-chip::before{content:"";width:8px;height:8px;border-radius:50%;background:#d6347f}',
    '.ys-link{background:none;border:none;font:inherit;font-size:12.5px;font-weight:700;color:#d6347f;cursor:pointer;padding:6px 4px}',
    '[data-ver].ys-oculto{display:none!important}',
  ].join('');
  document.head.appendChild(css);

  var capa = null;
  function abrirCapa(html) {
    if (!capa) { capa = document.createElement('div'); capa.className = 'ys-capa'; capa.setAttribute('role', 'dialog'); capa.setAttribute('aria-modal', 'true'); }
    capa.innerHTML = '<div class="ys-in">' + html + '</div>';
    (document.body || document.documentElement).appendChild(capa);
    try { document.documentElement.style.overflow = 'hidden'; } catch (e) {}
    return capa;
  }
  function cerrarCapa() { if (capa && capa.parentNode) capa.parentNode.removeChild(capa); try { document.documentElement.style.overflow = ''; } catch (e) {} }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var q = function (sel) { return capa.querySelector(sel); };

  // ── 1. Aparato nuevo ─────────────────────────────────────────────────
  function pedirClave(msg) {
    abrirCapa('<h1>Registrar este aparato</h1><p class="ys-hint">Se hace una sola vez en cada celular o iPad.</p>' +
      '<form class="ys-card" id="ysF"><label>Contraseña general<input type="password" id="ysC" autocomplete="off" placeholder="La saben Luis y Yoltic"></label>' +
      '<button class="ys-btn" id="ysB">Registrar este aparato</button><p class="ys-err" id="ysE">' + esc(msg || '') + '</p></form>');
    q('#ysF').onsubmit = function (e) {
      e.preventDefault();
      var c = q('#ysC').value.trim(); if (!c) return;
      q('#ysB').disabled = true; q('#ysE').textContent = '';
      api('pink_validar_clave', { clave: c }).then(function () { ls.set(K.clave, c); quienEres(); })
        .catch(function (x) { q('#ysB').disabled = false; q('#ysE').textContent = /Clave de equipo/i.test(x.message) ? 'Esa contraseña no es correcta.' : 'No se pudo revisar. Revisa tu conexión.'; });
    };
  }

  // ── 2. ¿Quién eres? ──────────────────────────────────────────────────
  var estado = { perfiles: [], elegido: null, pin: '', pin1: '', aviso: '' };
  function quienEres(aviso) {
    estado.elegido = null; estado.pin = ''; estado.pin1 = ''; estado.aviso = aviso || '';
    try { estado.perfiles = JSON.parse(ls.get(K.lista) || '[]'); } catch (e) { estado.perfiles = []; }
    pintarQuien();
    api('consent_perf_lista').then(function (d) { estado.perfiles = d.perfiles || []; ls.set(K.lista, JSON.stringify(estado.perfiles)); if (!estado.elegido) pintarQuien(); })
      .catch(function (x) {
        if (/Clave de equipo/i.test(x.message)) { ls.del(K.clave); return pedirClave('La contraseña del aparato cambió. Escríbela otra vez.'); }
        if (!estado.perfiles.length) { var e = capa && capa.querySelector('#ysE'); if (e) e.textContent = 'No se pudo cargar la lista: ' + x.message; }
      });
  }
  var ROL_TXT = { 'Dueño': 'Dueña / dueño', 'Artista': 'Artista', 'iPad': 'iPad del estudio' };
  function pintarQuien() {
    var p = estado.elegido, creando = p && !p.tiene_pin, paso2 = creando && estado.pin1;
    var titulo = !p ? 'Toca tu nombre.' : creando ? (paso2 ? 'Escríbelo otra vez para confirmar' : 'Hola, ' + p.nombre + '. Crea tu PIN de 6 números') : 'Hola, ' + p.nombre + '. Escribe tu PIN';
    abrirCapa((estado.aviso ? '<p class="ys-hint" style="text-align:center;font-weight:600">' + esc(estado.aviso) + '</p>' : '') +
      '<h1>¿Quién eres?</h1><div class="ys-who">' + estado.perfiles.map(function (x, i) {
        return '<button type="button" data-q="' + i + '" aria-pressed="' + (p && p.id === x.id) + '"><span class="ys-av">' + esc(x.nombre.charAt(0).toUpperCase()) + '</span><span><b>' + esc(x.nombre) +
          '</b><small>' + esc(ROL_TXT[x.rol] || x.rol) + (x.tiene_pin ? '' : ' · primera vez') + '</small></span></button>';
      }).join('') + '</div>' +
      (p ? '<div class="ys-card"><p class="ys-hint" style="text-align:center">' + esc(titulo) + '</p>' +
        '<div class="ys-pin" aria-label="PIN, ' + estado.pin.length + ' de 6">' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i < estado.pin.length ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<div class="ys-keys">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<button type="button" data-n="' + n + '">' + n + '</button>'; }).join('') +
        '<button type="button" data-n="0" class="k0">0</button><button type="button" data-n="x" aria-label="Borrar">⌫</button></div>' +
        (paso2 ? '<label>Contraseña general (la escribe Luis o Yoltic)<input type="password" id="ysG" autocomplete="off"></label><button class="ys-btn" type="button" id="ysCrear">Crear mi PIN</button>' : '') +
        '</div>' : '') + '<p class="ys-err" id="ysE"></p>');
    capa.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { estado.elegido = estado.perfiles[+b.getAttribute('data-q')]; estado.pin = ''; estado.pin1 = ''; pintarQuien(); }; });
    capa.querySelectorAll('[data-n]').forEach(function (b) { b.onclick = function () { tecla(b.getAttribute('data-n')); }; });
    var crear = q('#ysCrear'); if (crear) crear.onclick = crearPin;
  }
  function tecla(n) {
    var p = estado.elegido; if (!p || estado.ocupado) return;
    if (n === 'x') estado.pin = estado.pin.slice(0, -1); else if (estado.pin.length < 6) estado.pin += n;
    if (estado.pin.length < 6) return pintarQuien();
    if (!p.tiene_pin) {
      if (!estado.pin1) { estado.pin1 = estado.pin; estado.pin = ''; return pintarQuien(); }
      if (estado.pin1 !== estado.pin) { estado.pin1 = ''; estado.pin = ''; pintarQuien(); q('#ysE').textContent = 'Los dos PIN no son iguales. Empieza otra vez.'; return; }
      pintarQuien(); var g = q('#ysG'); if (g) g.focus(); return;
    }
    estado.ocupado = true; pintarQuien();
    api('consent_perf_entrar', { id: p.id, pin: estado.pin }).then(entro).catch(function (x) { estado.ocupado = false; estado.pin = ''; pintarQuien(); q('#ysE').textContent = x.message; });
  }
  function crearPin() {
    var p = estado.elegido, g = q('#ysG').value;
    if (!g) { q('#ysE').textContent = 'Falta la contraseña general.'; return; }
    q('#ysCrear').disabled = true;
    api('consent_perf_crear_pin', { id: p.id, pin: estado.pin, clave_general: g }).then(entro)
      .catch(function (x) { q('#ysCrear').disabled = false; q('#ysE').textContent = x.message; if (/fácil|6 números/.test(x.message)) { estado.pin1 = ''; estado.pin = ''; pintarQuien(); q('#ysE').textContent = x.message; } });
  }
  function entro(s) {
    estado.ocupado = false;
    ls.set(K.sesion, JSON.stringify(s));
    ls.set(K.act, String(Date.now()));
    if (s.clave_rol === 'ipad') { ls.set(K.aparato, 'ipad'); ls.del('ypp_elaboro_id'); ls.del('ypp_elaboro_alias'); }
    else if (s.colab) { ls.set('ypp_elaboro_id', s.colab.id); ls.set('ypp_elaboro_alias', s.colab.alias); }
    // Si la página abrió sin nadie, se recarga para que todo (Elaboró, quién atiende) salga con esta persona.
    // Si solo se cerró por la hora del iPad, no se recarga: lo que estaba a medias sigue ahí.
    if (!sesionAlAbrir || sesionAlAbrir.id !== s.id) return location.reload();
    sesionAlAbrir = s;
    cerrarCapa(); aplicar(s);
  }

  // ── 3. Permisos y barra de arriba ────────────────────────────────────
  function aplicar(s) {
    window.YP_SESION = s;
    document.querySelectorAll('[data-ver]').forEach(function (el) { el.classList.toggle('ys-oculto', !permitido(s, el.getAttribute('data-ver'))); });
    if (!permitido(s, PAGINAS[PAG] || 'dueno')) {
      abrirCapa('<h1>Esta parte no es para tu perfil</h1><p class="ys-hint">Entraste como ' + esc(s.nombre) + '. Pide a Luis o Yoltic que lo hagan, o entra con otra persona.</p>' +
        '<a class="ys-btn" style="text-align:center;text-decoration:none" href="' + INICIO + '">Ir al Inicio</a><button class="ys-btn sec" type="button" id="ysOtra">Entrar con otra persona</button>');
      q('#ysOtra').onclick = function () { cerrar(''); };
      return;
    }
    var barra = document.getElementById('ysBarra');
    if (!barra) { barra = document.createElement('div'); barra.id = 'ysBarra'; barra.className = 'ys-barra'; document.body.insertBefore(barra, document.body.firstChild); }
    barra.innerHTML = '<span class="ys-chip">' + esc(s.nombre) + ' · ' + esc(ROL_TXT[s.rol] || s.rol) + '</span><span>' +
      (esIpad() && s.clave_rol === 'dueno' ? '<button class="ys-link" type="button" id="ysNoIpad" title="Este aparato deja de cerrarse solo a la hora">Quitar modo iPad</button>' : '') +
      '<button class="ys-link" type="button" id="ysCambiar">Cambiar de persona</button></span>';
    document.getElementById('ysCambiar').onclick = function () { cerrar(''); };
    var noIpad = document.getElementById('ysNoIpad');
    if (noIpad) noIpad.onclick = function () { ls.del(K.aparato); aplicar(s); };
    try { document.dispatchEvent(new CustomEvent('yp-sesion', { detail: s })); } catch (e) {}
  }
  function cerrar(aviso) {
    ls.del(K.sesion);
    window.YP_SESION = null;
    quienEres(aviso);
  }

  // ── 4. iPad: 1 hora sin usarse ───────────────────────────────────────
  var ultimo = 0;
  function actividad() { var t = Date.now(); if (t - ultimo > 20000) { ultimo = t; ls.set(K.act, String(t)); } }
  function revisarHora() {
    if (!esIpad() || !leerSesion()) return;
    var a = Number(ls.get(K.act)) || 0;
    if (a && Date.now() - a > UNA_HORA) cerrar('El iPad estuvo 1 hora sin usarse. Lo que estaba a medias se guardó.');
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, actividad, { passive: true, capture: true }); });
  setInterval(revisarHora, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) revisarHora(); });

  // ── Arranque ─────────────────────────────────────────────────────────
  var sesionAlAbrir = null;
  function arrancar() {
    if (SIN_SERVIDOR) return aplicar({ id: 'PRF-000', nombre: 'Demo', rol: 'Dueño', clave_rol: 'dueno', colab: null });
    var vencio = false;
    if (esIpad() && leerSesion()) { var a = Number(ls.get(K.act)) || 0; if (a && Date.now() - a > UNA_HORA) { ls.del(K.sesion); vencio = true; } }
    var s = leerSesion();
    if (!ls.get(K.clave)) return pedirClave('');
    if (!s) return quienEres(vencio ? 'El iPad estuvo 1 hora sin usarse. Lo que estaba a medias se guardó.' : '');
    sesionAlAbrir = s;
    actividad();
    aplicar(s);
  }
  window.YP = { sesion: leerSesion, cambiar: function () { cerrar(''); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
