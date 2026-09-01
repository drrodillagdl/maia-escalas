/* CORE Scale — almacenamiento local (IndexedDB).
   TODO se guarda en el propio dispositivo; nada sale a internet.
   Almacenes: pacientes, episodios (una cirugía/tratamiento), evaluaciones,
   escalas (resultados de escalas funcionales) y config. */

const DB = (() => {
  const NOMBRE = 'core-scale';
  const VERSION = 1;
  let _db = null;

  function abrir() {
    return new Promise((res, rej) => {
      if (_db) return res(_db);
      const req = indexedDB.open(NOMBRE, VERSION);
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('pacientes'))
          d.createObjectStore('pacientes', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('episodios')) {
          const s = d.createObjectStore('episodios', { keyPath: 'id' });
          s.createIndex('pacienteId', 'pacienteId');
        }
        if (!d.objectStoreNames.contains('evaluaciones')) {
          const s = d.createObjectStore('evaluaciones', { keyPath: 'id' });
          s.createIndex('episodioId', 'episodioId');
        }
        if (!d.objectStoreNames.contains('escalas')) {
          const s = d.createObjectStore('escalas', { keyPath: 'id' });
          s.createIndex('episodioId', 'episodioId');
        }
        if (!d.objectStoreNames.contains('config'))
          d.createObjectStore('config', { keyPath: 'clave' });
      };
      req.onsuccess = () => { _db = req.result; res(_db); };
      req.onerror = () => rej(req.error);
    });
  }

  function _tx(store, modo, fn) {
    return abrir().then(d => new Promise((res, rej) => {
      const tx = d.transaction(store, modo);
      const st = tx.objectStore(store);
      const out = fn(st);
      tx.oncomplete = () => res(out && out.result !== undefined ? out.result : out);
      tx.onerror = () => rej(tx.error);
    }));
  }

  function todos(store) {
    return _tx(store, 'readonly', st => {
      const req = st.getAll();
      return req;
    });
  }

  function porIndice(store, indice, valor) {
    return abrir().then(d => new Promise((res, rej) => {
      const req = d.transaction(store, 'readonly')
        .objectStore(store).index(indice).getAll(valor);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    }));
  }

  function obtener(store, id) {
    return abrir().then(d => new Promise((res, rej) => {
      const req = d.transaction(store, 'readonly').objectStore(store).get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    }));
  }

  function guardar(store, obj) {
    return _tx(store, 'readwrite', st => st.put(obj)).then(() => obj);
  }

  function borrar(store, id) {
    return _tx(store, 'readwrite', st => st.delete(id));
  }

  function uuid() {
    return (crypto.randomUUID ? crypto.randomUUID()
      : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10));
  }

  /* ---- Configuración simple (clave/valor) ---- */
  async function conf(clave, valor) {
    if (valor === undefined) {
      const r = await obtener('config', clave);
      return r ? r.valor : null;
    }
    return guardar('config', { clave, valor });
  }

  /* ---- Respaldo: exportar / importar TODO en un JSON ----
     El mismo formato sirve como intercambio futuro con COREGDL. */
  async function exportarTodo() {
    const [pacientes, episodios, evaluaciones, escalas] = await Promise.all([
      todos('pacientes'), todos('episodios'), todos('evaluaciones'), todos('escalas')
    ]);
    return {
      app: 'CORE Scale',
      formato: 1,
      exportado: new Date().toISOString(),
      pacientes, episodios, evaluaciones, escalas
    };
  }

  async function importarTodo(datos, reemplazar) {
    if (!datos || datos.app !== 'CORE Scale' || !Array.isArray(datos.pacientes))
      throw new Error('El archivo no es un respaldo de CORE Scale.');
    for (const store of ['pacientes', 'episodios', 'evaluaciones', 'escalas']) {
      const lista = datos[store] || [];
      for (const obj of lista) {
        if (!reemplazar) {
          const existe = await obtener(store, obj.id);
          if (existe) continue;   // sin reemplazar: solo añade lo que no está
        }
        await guardar(store, obj);
      }
    }
    return true;
  }

  /* Pedir almacenamiento persistente (evita que iOS/Safari lo purgue). */
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  return { abrir, todos, porIndice, obtener, guardar, borrar, uuid, conf,
           exportarTodo, importarTodo };
})();
