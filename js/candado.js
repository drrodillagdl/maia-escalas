/* CORE Scale — candado con contraseña y CIFRADO real de los datos clínicos.

   Cómo funciona (todo en el dispositivo, sin servidor):
   · Al activar el candado se genera una LLAVE MAESTRA aleatoria (AES-GCM 256)
     con la que se cifra cada registro de pacientes/evaluaciones.
   · La llave maestra se guarda "envuelta": cifrada con una llave derivada de la
     contraseña del usuario (PBKDF2-SHA256, 310 000 iteraciones, sal aleatoria).
   · Abrir la app pide la contraseña; si es correcta, la envoltura se abre (el
     propio sello GCM valida la contraseña) y la llave queda SOLO en memoria.
   · Cambiar la contraseña re-envuelve la llave (no re-cifra los datos).
   ⚠ Sin la contraseña NO hay forma de recuperar los datos: el respaldo JSON
     (que se exporta descifrado) es la única salvación. Avisar SIEMPRE al activar.

   El material guardado en localStorage (sal + llave envuelta) no es secreto:
   sin la contraseña es inservible.                                            */

const CANDADO = (() => {
  const LS = 'cs_candado';        // material en localStorage (no secreto)
  const ITER = 310000;
  let _llave = null;              // CryptoKey maestra, solo en memoria

  const _b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const _debase = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  function _material() {
    try { return JSON.parse(localStorage.getItem(LS)); } catch (_) { return null; }
  }

  async function _derivar(contrasena, sal, iter) {
    const base = await crypto.subtle.importKey('raw',
      new TextEncoder().encode(contrasena), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: sal, iterations: iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async function _envolver(llaveMaestra, contrasena, sal, iter) {
    const kek = await _derivar(contrasena, sal, iter);
    const cruda = await crypto.subtle.exportKey('raw', llaveMaestra);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, cruda);
    return { iv: _b64(iv), ct: _b64(ct) };
  }

  async function _desenvolver(contrasena) {
    const m = _material();
    if (!m) throw new Error('Sin candado configurado.');
    const kek = await _derivar(contrasena, _debase(m.sal), m.iter);
    const cruda = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: _debase(m.envoltura.iv) }, kek, _debase(m.envoltura.ct));
    return crypto.subtle.importKey('raw', cruda, 'AES-GCM', true, ['encrypt', 'decrypt']);
  }

  /* ---- estado ---- */
  const configurado = () => !!_material();
  const desbloqueado = () => !!_llave;
  const usuario = () => { const m = _material(); return m ? m.usuario : ''; };

  /* ---- ciclo de vida ---- */
  async function activar(usuarioNombre, contrasena) {
    if (configurado()) throw new Error('El candado ya está activo.');
    const llave = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const sal = crypto.getRandomValues(new Uint8Array(16));
    const envoltura = await _envolver(llave, contrasena, sal, ITER);
    localStorage.setItem(LS, JSON.stringify(
      { v: 1, usuario: usuarioNombre, sal: _b64(sal), iter: ITER, envoltura }));
    _llave = llave;
    await _recifrarTodo();          // los registros ya guardados quedan cifrados
  }

  async function desbloquear(contrasena) {
    try { _llave = await _desenvolver(contrasena); return true; }
    catch (_) { return false; }     // GCM falla = contraseña incorrecta
  }

  function bloquear() { _llave = null; }

  async function cambiarContrasena(actual, nueva) {
    const llave = await _desenvolver(actual).catch(() => null);
    if (!llave) return false;
    const m = _material();
    const sal = crypto.getRandomValues(new Uint8Array(16));
    m.sal = _b64(sal); m.iter = ITER;
    m.envoltura = await _envolver(llave, nueva, sal, ITER);
    localStorage.setItem(LS, JSON.stringify(m));
    _llave = llave;
    return true;
  }

  let _forzarClaro = false;         // durante el desactivado, guardar en claro
  async function desactivar(contrasena) {
    const llave = await _desenvolver(contrasena).catch(() => null);
    if (!llave) return false;
    _llave = llave;
    _forzarClaro = true;            // descifrar sigue funcionando; guardar ya no cifra
    try { await _recifrarTodo(); }  // re-guarda todo en claro
    finally { _forzarClaro = false; }
    localStorage.removeItem(LS);    // solo al final, con los datos ya legibles
    _llave = null;
    return true;
  }

  async function _recifrarTodo() {
    for (const store of ['pacientes', 'episodios', 'evaluaciones', 'escalas']) {
      const lista = await DB.todos(store);          // llega descifrado
      for (const obj of lista) await DB.guardar(store, obj);
    }
  }

  /* ---- cifrado de registros (lo usa db.js) ---- */
  const cifrando = () => configurado() && !_forzarClaro;

  async function cifrarRegistro(obj, camposClaros) {
    if (!_llave) throw new Error('Candado bloqueado.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, _llave,
      new TextEncoder().encode(JSON.stringify(obj)));
    const shell = { _c: { iv: _b64(iv), ct: _b64(ct) } };
    for (const c of camposClaros) shell[c] = obj[c];   // id e índices, en claro
    return shell;
  }

  async function descifrarRegistro(shell) {
    if (!shell || !shell._c) return shell;             // registro en claro (legado)
    if (!_llave) throw new Error('Candado bloqueado.');
    const texto = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: _debase(shell._c.iv) }, _llave, _debase(shell._c.ct));
    return JSON.parse(new TextDecoder().decode(texto));
  }

  /* ---- pantalla de bloqueo (cubre toda la app) ---- */
  function pantalla(alDesbloquear) {
    const div = document.createElement('div');
    div.id = 'pantallaCandado';
    div.style.cssText = 'position:fixed;inset:0;z-index:200;background:var(--color-bg);' +
      'display:grid;place-items:center;padding:20px';
    div.innerHTML =
      '<form id="formCandado" style="width:min(360px,100%);text-align:center">' +
      '<svg viewBox="0 0 32 32" width="52" height="52" style="display:block;margin:0 auto" aria-label="CORE Scale"><rect x="0" y="0" width="32" height="32" fill="var(--color-text)"></rect><path d="M12 24 H24" stroke="var(--color-bg)" stroke-width="3" stroke-linecap="round" fill="none"></path><path d="M12 24 L20 9.5" stroke="var(--color-bg)" stroke-width="3" stroke-linecap="round" fill="none"></path><circle cx="25" cy="22.4" r="2" fill="var(--color-bg)"></circle><circle cx="25" cy="25.6" r="2" fill="var(--color-bg)"></circle><circle cx="18.7" cy="8.2" r="2" fill="var(--color-bg)"></circle><circle cx="21.5" cy="9.8" r="2" fill="var(--color-bg)"></circle><circle cx="12" cy="24" r="4.2" fill="var(--color-text)" stroke="var(--color-bg)" stroke-width="2.2"></circle><path d="M21 24 A9 9 0 0 0 16.4 16.2" stroke="var(--color-accent)" stroke-width="2.5" fill="none"></path></svg>' +
      '<div style="font-family:var(--font-heading);font-size:26px;letter-spacing:-0.02em;margin:12px 0 2px"><b style="font-weight:800">CORE</b><span style="font-weight:400">scale</span></div>' +
      '<div style="width:30px;height:4px;background:var(--color-accent);margin:10px auto 22px"></div>' +
      '<div class="text-muted" style="font-size:14px;margin-bottom:14px">' + escaparHTML(usuario()) + '</div>' +
      '<input class="input" type="password" id="candadoPass" placeholder="Contraseña" autocomplete="current-password" style="min-height:50px;font-size:17px;text-align:center">' +
      '<div id="candadoError" style="color:var(--color-accent-700);font-size:13px;min-height:20px;margin-top:8px"></div>' +
      '<button class="btn btn-primary btn-block btn-grande" type="submit">Entrar</button>' +
      '<button class="btn btn-ghost btn-block" type="button" id="candadoOlvide" style="margin-top:14px;font-size:12.5px">Olvidé mi contraseña</button>' +
      '</form>';
    document.body.appendChild(div);
    const pass = div.querySelector('#candadoPass');
    setTimeout(() => pass.focus(), 100);

    div.querySelector('#formCandado').addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = await desbloquear(pass.value);
      if (ok) { div.remove(); alDesbloquear(); }
      else {
        div.querySelector('#candadoError').textContent = 'Contraseña incorrecta.';
        pass.value = ''; pass.focus();
      }
    });

    div.querySelector('#candadoOlvide').addEventListener('click', () => {
      if (!confirm('Sin la contraseña, los datos cifrados de este dispositivo NO se pueden recuperar.\n\n' +
        'La única opción es borrar todo y restaurar después desde un respaldo JSON.\n\n¿Borrar TODOS los datos de este dispositivo?')) return;
      if (!confirm('Última confirmación: se borrarán todos los pacientes y evaluaciones de ESTE dispositivo. ¿Continuar?')) return;
      localStorage.removeItem(LS);
      indexedDB.deleteDatabase('core-scale');
      location.reload();
    });
  }

  return { configurado, desbloqueado, usuario, activar, desbloquear, bloquear,
           cambiarContrasena, desactivar, cifrando, cifrarRegistro,
           descifrarRegistro, pantalla };
})();
