/* CORE Scale — armazón de la app: navegación por hash, pacientes, episodios
   (cada cirugía o tratamiento) y ajustes con respaldo local.
   Preparada para conectarse a COREGDL: cada paciente admite un "ID en COREGDL"
   y la exportación produce el JSON de intercambio.                            */

const VERSION_APP = '0.1.0';

/* ---------------- utilidades ---------------- */
function hoyISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0');
}
function fmtFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.getDate() + ' ' + d.toLocaleDateString('es-MX', { month: 'short' }) +
    ' ' + d.getFullYear();
}
function semanasDesde(fechaCirugia, fecha) {
  if (!fechaCirugia || !fecha) return null;
  const dias = (new Date(fecha) - new Date(fechaCirugia)) / 86400e3;
  if (isNaN(dias)) return null;
  return Math.floor(dias / 7);
}
function edad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date(), n = new Date(fechaNac + 'T12:00:00');
  let e = hoy.getFullYear() - n.getFullYear();
  if (hoy.getMonth() < n.getMonth() ||
      (hoy.getMonth() === n.getMonth() && hoy.getDate() < n.getDate())) e--;
  return e;
}
function escaparHTML(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function iniciales(nombre) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
}

/* Barra superior: subtítulo contextual y botón de regreso. */
let _hashAtras = null;
function barra(titulo, subtitulo, atrasHash) {
  document.getElementById('subtituloBarra').textContent =
    [titulo, subtitulo].filter(Boolean).join(' · ');
  _hashAtras = atrasHash || null;
  document.getElementById('btnAtras').classList.toggle('oculto', !atrasHash);
}

function descargarJSON(nombreArchivo, datos) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombreArchivo;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ---------------- vistas: pacientes ---------------- */
async function vistaPacientes(cont) {
  barra('', '', null);
  const [pacientes, episodios] = await Promise.all([
    DB.todos('pacientes'), DB.todos('episodios')
  ]);
  pacientes.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const filas = (lista) => lista.map(p => {
    const eps = episodios.filter(e => e.pacienteId === p.id);
    const sub = [
      edad(p.fechaNacimiento) !== null ? edad(p.fechaNacimiento) + ' años' : null,
      eps.length ? eps.map(e => (PLANTILLAS[e.tipo] ? PLANTILLAS[e.tipo].nombre : e.titulo || 'Tratamiento')).join(' · ') : 'Sin cirugías registradas'
    ].filter(Boolean).join(' · ');
    return '<button class="fila-lista" data-pid="' + p.id + '">' +
      '<span class="avatar">' + iniciales(p.nombre) + '</span>' +
      '<span class="cuerpo"><span class="principal">' + escaparHTML(p.nombre) + '</span>' +
      '<span class="secundario">' + escaparHTML(sub) + '</span></span>' +
      '<span class="extremo">›</span></button>';
  }).join('');

  cont.innerHTML =
    (pacientes.length > 4 ? '<div class="buscador"><input type="search" id="buscar" placeholder="Buscar paciente…"></div>' : '') +
    '<div id="listaPacientes">' +
    (pacientes.length ? filas(pacientes) :
      '<div class="vacio"><div class="icono">🩺</div>Aún no hay pacientes.<br>' +
      'Dé de alta al primero y aquí quedará su seguimiento completo.</div>') +
    '</div>' +
    '<button class="btn" id="btnNuevoPaciente">➕ Nuevo paciente</button>';

  const instalar = () => cont.querySelectorAll('[data-pid]').forEach(b =>
    b.addEventListener('click', () => location.hash = '#/paciente/' + b.dataset.pid));
  instalar();

  const buscar = cont.querySelector('#buscar');
  if (buscar) buscar.addEventListener('input', () => {
    const q = buscar.value.trim().toLowerCase();
    cont.querySelector('#listaPacientes').innerHTML =
      filas(pacientes.filter(p => p.nombre.toLowerCase().includes(q)));
    instalar();
  });
  cont.querySelector('#btnNuevoPaciente').addEventListener('click',
    () => location.hash = '#/paciente/nuevo');
}

async function vistaFormPaciente(cont, pid) {
  const p = pid ? await DB.obtener('pacientes', pid) : null;
  barra(p ? 'Editar paciente' : 'Nuevo paciente', '', p ? '#/paciente/' + pid : '#/');

  cont.innerHTML =
    '<div class="tarjeta">' +
    '<div class="campo"><label>Nombre completo *</label>' +
    '<input type="text" id="pNombre" autocomplete="off" value="' + escaparHTML(p ? p.nombre : '') + '"></div>' +
    '<div class="dos-columnas">' +
    '<div class="campo"><label>Fecha de nacimiento</label>' +
    '<input type="date" id="pNac" value="' + (p && p.fechaNacimiento || '') + '"></div>' +
    '<div class="campo"><label>Sexo</label><select id="pSexo">' +
    ['', 'Femenino', 'Masculino'].map(s =>
      '<option' + (p && p.sexo === s ? ' selected' : '') + '>' + s + '</option>').join('') +
    '</select></div>' +
    '<div class="campo"><label>Teléfono</label>' +
    '<input type="tel" id="pTel" value="' + escaparHTML(p && p.telefono || '') + '"></div>' +
    '<div class="campo"><label>ID en COREGDL (opcional)</label>' +
    '<input type="text" id="pCoregdl" autocomplete="off" placeholder="Para ligar con el expediente" value="' + escaparHTML(p && p.idCOREGDL || '') + '"></div>' +
    '</div>' +
    '<div class="campo"><label>Notas</label>' +
    '<textarea id="pNotas" rows="2">' + escaparHTML(p && p.notas || '') + '</textarea></div>' +
    '</div>' +
    '<button class="btn" id="btnGuardarP">Guardar paciente</button>' +
    (p ? '<button class="btn peligro" id="btnBorrarP">Eliminar paciente y todo su historial</button>' : '');

  cont.querySelector('#btnGuardarP').addEventListener('click', async () => {
    const nombre = cont.querySelector('#pNombre').value.trim();
    if (!nombre) { alert('El nombre es obligatorio.'); return; }
    const obj = {
      id: p ? p.id : DB.uuid(),
      nombre,
      fechaNacimiento: cont.querySelector('#pNac').value || null,
      sexo: cont.querySelector('#pSexo').value || null,
      telefono: cont.querySelector('#pTel').value.trim() || null,
      idCOREGDL: cont.querySelector('#pCoregdl').value.trim() || null,
      notas: cont.querySelector('#pNotas').value.trim() || null,
      creado: p ? p.creado : new Date().toISOString()
    };
    await DB.guardar('pacientes', obj);
    location.hash = '#/paciente/' + obj.id;
  });

  const borrar = cont.querySelector('#btnBorrarP');
  if (borrar) borrar.addEventListener('click', async () => {
    if (!confirm('¿Eliminar a ' + p.nombre + ' con TODAS sus evaluaciones y escalas?\nEsta acción no se puede deshacer.')) return;
    const eps = await DB.porIndice('episodios', 'pacienteId', p.id);
    for (const e of eps) {
      for (const ev of await DB.porIndice('evaluaciones', 'episodioId', e.id)) await DB.borrar('evaluaciones', ev.id);
      for (const r of await DB.porIndice('escalas', 'episodioId', e.id)) await DB.borrar('escalas', r.id);
      await DB.borrar('episodios', e.id);
    }
    await DB.borrar('pacientes', p.id);
    location.hash = '#/';
  });
}

async function vistaPaciente(cont, pid) {
  const p = await DB.obtener('pacientes', pid);
  if (!p) { location.hash = '#/'; return; }
  const episodios = (await DB.porIndice('episodios', 'pacienteId', pid))
    .sort((a, b) => (b.fechaCirugia || '') < (a.fechaCirugia || '') ? -1 : 1);
  barra(p.nombre, '', '#/');

  const datos = [
    edad(p.fechaNacimiento) !== null ? edad(p.fechaNacimiento) + ' años' : null,
    p.sexo, p.telefono,
    p.idCOREGDL ? 'COREGDL: ' + p.idCOREGDL : null
  ].filter(Boolean).join(' · ');

  cont.innerHTML =
    '<div class="tarjeta">' +
    '<div style="display:flex;gap:12px;align-items:center">' +
    '<span class="avatar" style="width:52px;height:52px;border-radius:50%;background:var(--acento-suave);color:var(--acento);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:19px">' +
    iniciales(p.nombre) + '</span>' +
    '<div style="flex:1;min-width:0"><b style="font-size:18px">' + escaparHTML(p.nombre) + '</b>' +
    '<div style="font-size:14px;color:var(--tinta-2)">' + escaparHTML(datos || 'Sin datos adicionales') + '</div></div>' +
    '<button class="btn-icono" id="btnEditarP" aria-label="Editar">✏️</button>' +
    '</div>' +
    (p.notas ? '<p style="margin:10px 0 0;font-size:14.5px;color:var(--tinta-2)">' + escaparHTML(p.notas) + '</p>' : '') +
    '</div>' +
    '<p class="seccion-titulo">Cirugías y tratamientos</p>' +
    (episodios.length ? episodios.map(e => {
      const pl = PLANTILLAS[e.tipo];
      const sem = semanasDesde(e.fechaCirugia, hoyISO());
      return '<button class="fila-lista" data-eid="' + e.id + '">' +
        '<span class="cuerpo"><span class="principal">' + (pl ? pl.nombre : escaparHTML(e.titulo || 'Tratamiento')) +
        (e.lado ? ' — ' + e.lado.toLowerCase() : '') + '</span>' +
        '<span class="secundario">' +
        (e.fechaCirugia ? 'Cirugía: ' + fmtFecha(e.fechaCirugia) +
          (sem !== null && sem >= 0 ? ' · semana ' + sem : '') : 'Sin fecha de cirugía') +
        '</span></span><span class="extremo">›</span></button>';
    }).join('') :
      '<div class="vacio">Registre la cirugía o el tratamiento para empezar a evaluar.</div>') +
    '<button class="btn" id="btnNuevoEp">➕ Registrar cirugía / tratamiento</button>' +
    '<button class="btn secundario" id="btnExportarP">📤 Exportar paciente (JSON para COREGDL)</button>';

  cont.querySelector('#btnEditarP').addEventListener('click',
    () => location.hash = '#/paciente/' + pid + '/editar');
  cont.querySelectorAll('[data-eid]').forEach(b =>
    b.addEventListener('click', () => location.hash = '#/episodio/' + pid + '/' + b.dataset.eid));
  cont.querySelector('#btnNuevoEp').addEventListener('click',
    () => location.hash = '#/episodio/' + pid + '/nuevo');
  cont.querySelector('#btnExportarP').addEventListener('click', async () => {
    const eps = await DB.porIndice('episodios', 'pacienteId', pid);
    const paquete = { app: 'CORE Scale', formato: 1, exportado: new Date().toISOString(),
      paciente: p, episodios: [] };
    for (const e of eps) {
      paquete.episodios.push({
        ...e,
        evaluaciones: await DB.porIndice('evaluaciones', 'episodioId', e.id),
        escalas: await DB.porIndice('escalas', 'episodioId', e.id)
      });
    }
    descargarJSON('corescale_' + p.nombre.replace(/\s+/g, '_') + '.json', paquete);
  });
}

/* ---------------- vistas: episodios ---------------- */
async function vistaFormEpisodio(cont, pid, eid) {
  const p = await DB.obtener('pacientes', pid);
  const e = eid ? await DB.obtener('episodios', eid) : null;
  barra(e ? 'Editar tratamiento' : 'Nueva cirugía / tratamiento', p.nombre,
    e ? '#/episodio/' + pid + '/' + eid : '#/paciente/' + pid);

  cont.innerHTML =
    '<div class="tarjeta">' +
    '<div class="campo"><label>Tipo de cirugía / tratamiento *</label>' +
    '<select id="eTipo">' +
    Object.values(PLANTILLAS).map(pl =>
      '<option value="' + pl.id + '"' + (e && e.tipo === pl.id ? ' selected' : '') + '>' +
      pl.nombre + '</option>').join('') +
    '</select></div>' +
    '<div class="dos-columnas">' +
    '<div class="campo"><label>Lado</label><select id="eLado">' +
    ['', 'Derecha', 'Izquierda'].map(l =>
      '<option' + (e && e.lado === l ? ' selected' : '') + '>' + l + '</option>').join('') +
    '</select></div>' +
    '<div class="campo"><label>Fecha de la cirugía</label>' +
    '<input type="date" id="eFecha" value="' + (e && e.fechaCirugia || '') + '"></div>' +
    '</div>' +
    '<div class="campo"><label>Notas (técnica, injerto, implante…)</label>' +
    '<textarea id="eNotas" rows="2">' + escaparHTML(e && e.notas || '') + '</textarea></div>' +
    '</div>' +
    '<button class="btn" id="btnGuardarE">Guardar</button>' +
    (e ? '<button class="btn peligro" id="btnBorrarE">Eliminar este tratamiento y sus evaluaciones</button>' : '');

  cont.querySelector('#btnGuardarE').addEventListener('click', async () => {
    const obj = {
      id: e ? e.id : DB.uuid(),
      pacienteId: pid,
      tipo: cont.querySelector('#eTipo').value,
      lado: cont.querySelector('#eLado').value || null,
      fechaCirugia: cont.querySelector('#eFecha').value || null,
      notas: cont.querySelector('#eNotas').value.trim() || null,
      creado: e ? e.creado : new Date().toISOString()
    };
    await DB.guardar('episodios', obj);
    location.hash = '#/episodio/' + pid + '/' + obj.id;
  });

  const borrar = cont.querySelector('#btnBorrarE');
  if (borrar) borrar.addEventListener('click', async () => {
    if (!confirm('¿Eliminar este tratamiento con todas sus evaluaciones y escalas?')) return;
    for (const ev of await DB.porIndice('evaluaciones', 'episodioId', e.id)) await DB.borrar('evaluaciones', ev.id);
    for (const r of await DB.porIndice('escalas', 'episodioId', e.id)) await DB.borrar('escalas', r.id);
    await DB.borrar('episodios', e.id);
    location.hash = '#/paciente/' + pid;
  });
}

async function vistaEpisodio(cont, pid, eid) {
  const [p, e] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid)
  ]);
  if (!p || !e) { location.hash = '#/'; return; }
  const [evals, escalas] = await Promise.all([
    DB.porIndice('evaluaciones', 'episodioId', eid),
    DB.porIndice('escalas', 'episodioId', eid)
  ]);
  const pl = PLANTILLAS[e.tipo];
  barra(pl ? pl.nombre : 'Tratamiento', p.nombre, '#/paciente/' + pid);

  const sem = semanasDesde(e.fechaCirugia, hoyISO());
  const eventos = [
    ...evals.map(ev => ({ clase: 'eval', fecha: ev.fecha, obj: ev })),
    ...escalas.map(r => ({ clase: 'escala', fecha: r.fecha, obj: r }))
  ].sort((a, b) => a.fecha < b.fecha ? 1 : -1);

  cont.innerHTML =
    '<div class="tarjeta">' +
    '<b style="font-size:17px">' + (pl ? pl.nombre : escaparHTML(e.titulo || 'Tratamiento')) + '</b> ' +
    '<button class="btn-icono" id="btnEditarE" style="float:right;width:34px;height:34px;font-size:16px" aria-label="Editar">✏️</button>' +
    '<div style="margin-top:8px">' +
    (e.lado ? '<span class="chip">' + e.lado + '</span>' : '') +
    (e.fechaCirugia ? '<span class="chip">Cirugía: ' + fmtFecha(e.fechaCirugia) + '</span>' : '') +
    (sem !== null && sem >= 0 ? '<span class="chip">Semana ' + sem + '</span>' : '') +
    '</div>' +
    (e.notas ? '<p style="margin:8px 0 0;font-size:14px;color:var(--tinta-2)">' + escaparHTML(e.notas) + '</p>' : '') +
    '</div>' +
    '<button class="btn" id="btnNuevaEval">📐 Nueva evaluación (' + (pl ? pl.nombre.toLowerCase() : '') + ')</button>' +
    '<div style="display:flex;gap:10px">' +
    '<button class="btn secundario" style="margin-top:0" id="btnEscala">🧾 Aplicar escala</button>' +
    '<button class="btn secundario" style="margin-top:0" id="btnEvolucion">📈 Evolución</button>' +
    '</div>' +
    '<p class="seccion-titulo">Historial de citas</p>' +
    (eventos.length ? eventos.map(x => {
      if (x.clase === 'eval') {
        const s = semanasDesde(e.fechaCirugia, x.obj.fecha);
        return '<button class="fila-lista" data-ev="' + x.obj.id + '">' +
          '<span class="avatar">📐</span>' +
          '<span class="cuerpo"><span class="principal">Evaluación física</span>' +
          '<span class="secundario">' + fmtFecha(x.obj.fecha) +
          (s !== null ? ' · semana ' + s : '') + '</span></span>' +
          '<span class="extremo">›</span></button>';
      }
      const esc = escalaPorId(x.obj.escalaId);
      return '<button class="fila-lista" data-esc="' + x.obj.id + '">' +
        '<span class="avatar">🧾</span>' +
        '<span class="cuerpo"><span class="principal">' + (esc ? esc.corto : x.obj.escalaId) +
        ': ' + x.obj.puntos + '/' + x.obj.maximo + '</span>' +
        '<span class="secundario">' + fmtFecha(x.obj.fecha) +
        (x.obj.interpretacion ? ' · ' + x.obj.interpretacion : '') + '</span></span>' +
        '<span class="extremo">›</span></button>';
    }).join('') :
      '<div class="vacio"><div class="icono">🗓</div>Sin citas registradas todavía.<br>' +
      'Capture la primera evaluación o aplique una escala.</div>');

  cont.querySelector('#btnEditarE').addEventListener('click',
    () => location.hash = '#/episodio/' + pid + '/' + eid + '/editar');
  cont.querySelector('#btnNuevaEval').addEventListener('click',
    () => location.hash = '#/capturar/' + pid + '/' + eid + '/' + e.tipo);
  cont.querySelector('#btnEscala').addEventListener('click',
    () => location.hash = '#/escalas/' + pid + '/' + eid);
  cont.querySelector('#btnEvolucion').addEventListener('click',
    () => location.hash = '#/evolucion/' + pid + '/' + eid);
  cont.querySelectorAll('[data-ev]').forEach(b =>
    b.addEventListener('click', () =>
      location.hash = '#/evaluacion/' + pid + '/' + eid + '/' + b.dataset.ev));
  cont.querySelectorAll('[data-esc]').forEach(b =>
    b.addEventListener('click', () =>
      location.hash = '#/resescala/' + pid + '/' + eid + '/' + b.dataset.esc));
}

/* ---------------- ajustes ---------------- */
async function vistaAjustes(cont) {
  barra('Ajustes', '', '#/');
  const evaluador = await DB.conf('evaluador') || '';
  const [np, ne, nev, nes] = await Promise.all([
    DB.todos('pacientes'), DB.todos('episodios'),
    DB.todos('evaluaciones'), DB.todos('escalas')
  ]);

  cont.innerHTML =
    '<div class="tarjeta">' +
    '<div class="campo"><label>Evaluador por defecto</label>' +
    '<input type="text" id="ajEvaluador" value="' + escaparHTML(evaluador) + '" placeholder="Dr. …"></div>' +
    '<button class="btn chico" id="btnGuardarAj">Guardar</button>' +
    '</div>' +
    '<p class="seccion-titulo">Respaldo</p>' +
    '<div class="tarjeta">' +
    '<p style="margin:0 0 10px;font-size:14.5px;color:var(--tinta-2)">' +
    'Todo se guarda en ESTE dispositivo; nada sale a internet. Haga un respaldo con regularidad ' +
    'y guárdelo en Archivos/iCloud: si se borra Safari o se pierde el dispositivo, el respaldo es lo único que queda.</p>' +
    '<b>' + np.length + '</b> pacientes · <b>' + ne.length + '</b> tratamientos · <b>' +
    nev.length + '</b> evaluaciones · <b>' + nes.length + '</b> escalas' +
    '<button class="btn" id="btnRespaldo">💾 Descargar respaldo completo</button>' +
    '<button class="btn secundario" id="btnImportar">📥 Restaurar / importar respaldo</button>' +
    '<input type="file" id="archivoImportar" accept=".json,application/json" class="oculto">' +
    '</div>' +
    '<p class="seccion-titulo">Acerca de</p>' +
    '<div class="tarjeta" style="font-size:14px;color:var(--tinta-2);line-height:1.55">' +
    '<b style="color:var(--tinta)">CORE Scale ' + VERSION_APP + '</b><br>' +
    'Evaluación objetiva postoperatoria: goniometría, dinamometría y escalas funcionales, ' +
    'con seguimiento por paciente. Pensada para consultorios de ortopedia y para conectarse ' +
    'con el expediente COREGDL.<br><br>' +
    'Escalas: DASH y QuickDASH © Institute for Work &amp; Health (uso clínico no comercial); ' +
    'IKDC (AOSSM); KOOS JR (HSS, uso libre); Lysholm, Kujala y Tegner (dominio de la literatura). ' +
    'Los resultados apoyan el juicio clínico, no lo sustituyen.' +
    '</div>';

  cont.querySelector('#btnGuardarAj').addEventListener('click', async (ev) => {
    await DB.conf('evaluador', cont.querySelector('#ajEvaluador').value.trim());
    ev.target.textContent = '✓ Guardado';
    setTimeout(() => ev.target.textContent = 'Guardar', 1500);
  });
  cont.querySelector('#btnRespaldo').addEventListener('click', async () => {
    descargarJSON('corescale_respaldo_' + hoyISO() + '.json', await DB.exportarTodo());
  });
  const archivo = cont.querySelector('#archivoImportar');
  cont.querySelector('#btnImportar').addEventListener('click', () => archivo.click());
  archivo.addEventListener('change', async () => {
    const f = archivo.files[0];
    if (!f) return;
    try {
      const datos = JSON.parse(await f.text());
      const reemplazar = confirm('¿Reemplazar los registros que ya existan con los del respaldo?\n' +
        'Aceptar = reemplazar · Cancelar = solo añadir lo que falte');
      await DB.importarTodo(datos, reemplazar);
      alert('Respaldo importado correctamente.');
      location.hash = '#/'; render();
    } catch (err) {
      alert('No se pudo importar: ' + err.message);
    }
  });
}

/* ---------------- enrutador ---------------- */
async function render() {
  const cont = document.getElementById('vista');
  const partes = (location.hash || '#/').slice(2).split('/').filter(Boolean);
  cont.scrollTop = 0; window.scrollTo(0, 0);

  try {
    if (!partes.length) return vistaPacientes(cont);
    const [r, a, b, c, d] = partes;
    if (r === 'paciente' && a === 'nuevo') return vistaFormPaciente(cont, null);
    if (r === 'paciente' && b === 'editar') return vistaFormPaciente(cont, a);
    if (r === 'paciente') return vistaPaciente(cont, a);
    if (r === 'episodio' && b === 'nuevo') return vistaFormEpisodio(cont, a, null);
    if (r === 'episodio' && c === 'editar') return vistaFormEpisodio(cont, a, b);
    if (r === 'episodio') return vistaEpisodio(cont, a, b);
    if (r === 'capturar') return vistaFormEvaluacion(cont, a, b, c, d);
    if (r === 'evaluacion') return vistaEvaluacion(cont, a, b, c);
    if (r === 'escalas') return vistaElegirEscala(cont, a, b);
    if (r === 'escala') return vistaAplicarEscala(cont, a, b, c);
    if (r === 'resescala') return vistaResultadoEscala(cont, a, b, c);
    if (r === 'evolucion') return vistaEvolucion(cont, a, b);
    if (r === 'ajustes') return vistaAjustes(cont);
    return vistaPacientes(cont);
  } catch (err) {
    cont.innerHTML = '<div class="vacio"><div class="icono">⚠️</div>' +
      'Algo salió mal al abrir esta pantalla.<br>' + escaparHTML(err.message) + '</div>';
    console.error(err);
  }
}

document.getElementById('btnAtras').addEventListener('click', () => {
  if (_hashAtras) location.hash = _hashAtras;
});
document.getElementById('btnAjustes').addEventListener('click',
  () => location.hash = '#/ajustes');
window.addEventListener('hashchange', render);
render();
