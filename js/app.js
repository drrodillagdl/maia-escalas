/* CORE Scale — armazón de la app: navegación (barra lateral en iPad, pestañas
   en iPhone), pacientes, perfil con evolución, protocolos y ajustes.
   Interfaz adaptada del diseño "Modernist" de Claude Design (CORE Scale.dc.html).
   Preparada para conectarse a COREGDL: cada paciente admite un "ID en COREGDL"
   y la exportación produce el JSON de intercambio.                            */

const VERSION_APP = '0.2.2';

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
function fmtFechaCorta(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.getDate() + ' ' + d.toLocaleDateString('es-MX', { month: 'short' });
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
function descargarJSON(nombreArchivo, datos) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombreArchivo;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* navegación */
function irA(h) { location.hash = h; }
function instalarIr(cont) {
  cont.querySelectorAll('[data-ir]').forEach(el =>
    el.addEventListener('click', () => irA(el.dataset.ir)));
}
function atrasHTML(hash, etiqueta) {
  return '<button class="btn btn-ghost" data-ir="' + hash + '">← ' + escaparHTML(etiqueta) + '</button>';
}
function hashPerfil(pid, eid) {
  return eid ? '#/paciente/' + pid + '/ep/' + eid : '#/paciente/' + pid;
}
function activarNav(cual) {
  const mapa = { pacientes: ['navPacientes', 'tabPacientes'],
    protocolos: ['navProtocolos', 'tabProtocolos'], ajustes: ['navAjustes', 'tabAjustes'] };
  for (const grupo of Object.values(mapa))
    for (const id of grupo) document.getElementById(id).classList.remove('activa');
  if (mapa[cual]) for (const id of mapa[cual]) document.getElementById(id).classList.add('activa');
}
async function pintarPieLateral() {
  const ev = await DB.conf('evaluador');
  const hoy = new Date();
  document.getElementById('pieEvaluador').innerHTML =
    (ev ? escaparHTML(ev) + ' · Ortopedia<br>' : '') +
    hoy.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/* Texto de diagnóstico de un episodio: "Reconstrucción LCA · rodilla derecha" */
function dxEpisodio(e) {
  const pl = PLANTILLAS[e.tipo];
  if (!pl) return e.titulo || 'Tratamiento';
  let lado = '';
  if (e.lado) {
    const zona = {
      hombro: ['hombro', 'o'], rodilla: ['rodilla', 'a'], tobillo: ['tobillo', 'o'],
      cadera: ['cadera', 'a'], codo: ['codo', 'o'], muneca: ['muñeca', 'a']
    }[pl.region] || ['rodilla', 'a'];
    const genero = zona[1] === 'o'
      ? (e.lado === 'Derecha' ? 'derecho' : 'izquierdo') : e.lado.toLowerCase();
    lado = ' · ' + zona[0] + ' ' + genero;
  }
  return pl.nombre + lado;
}
function tagDe(e) {
  const pl = PLANTILLAS[e.tipo];
  return pl ? pl.tag : 'OTRO';
}

/* Tarjeta de protocolo/escala para las cuadrículas de selección. */
function cartaProtocolo(o) {
  return '<div class="card card-clic elev-sm" data-ir="' + o.ir + '" style="gap:10px">' +
    '<div class="card-kicker">' + o.kicker + '</div>' +
    '<div class="card-title">' + o.titulo + '</div>' +
    (o.desc ? '<p class="card-body">' + o.desc + '</p>' : '') +
    (o.meta ? '<div class="card-meta">' + o.meta + '</div>' : '') +
    '<div style="font-family:var(--font-heading);font-weight:800;font-size:13px;color:var(--color-accent)">' +
    (o.accion || 'Iniciar evaluación →') + '</div></div>';
}

/* ---------------- pacientes (lista) ---------------- */
async function vistaPacientes(cont) {
  activarNav('pacientes');
  const [pacientes, episodios, evals, escalas] = await Promise.all([
    DB.todos('pacientes'), DB.todos('episodios'),
    DB.todos('evaluaciones'), DB.todos('escalas')
  ]);
  pacientes.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const info = pacientes.map(p => {
    const eps = episodios.filter(e => e.pacienteId === p.id)
      .sort((a, b) => (b.fechaCirugia || '') < (a.fechaCirugia || '') ? -1 : 1);
    const ep = eps[0] || null;
    const evsEp = ep ? evals.filter(v => v.episodioId === ep.id).sort((a, b) => a.fecha < b.fecha ? -1 : 1) : [];
    const escEp = ep ? escalas.filter(r => r.episodioId === ep.id) : [];
    const fechas = [...evsEp.map(v => v.fecha), ...escEp.map(r => r.fecha)].sort();
    const ultima = fechas[fechas.length - 1] || null;
    const sem = ep ? semanasDesde(ep.fechaCirugia, hoyISO()) : null;

    /* tendencia: cambio del LSI principal entre las dos últimas evaluaciones */
    let tendencia = null;
    if (ep && PLANTILLAS[ep.tipo] && evsEp.length >= 1) {
      const pl = PLANTILLAS[ep.tipo], idLsi = lsiPrincipalId(pl);
      const vals = evsEp.map(v => _valorEnEval(v, pl, idLsi)).filter(x => x !== null);
      if (vals.length >= 2) tendencia = Math.round(vals[vals.length - 1] - vals[vals.length - 2]);
      else if (vals.length === 1) tendencia = null;
    }
    return { p, ep, eps, ultima, sem, tendencia };
  });

  const tagTendencia = t => t === null ? '' :
    '<span class="tag ' + (t >= 0 ? 'tag-ok' : 'tag-accent') + '">' +
    (t >= 0 ? '↑ +' : '↓ ') + t + ' % LSI</span>';

  const filasTabla = lista => lista.map(x =>
    '<tr class="clic" data-ir="' + hashPerfil(x.p.id, x.ep && x.ep.id) + '">' +
    '<td><div style="font-weight:600">' + escaparHTML(x.p.nombre) + '</div>' +
    '<div class="text-muted" style="font-size:11px">' +
    (x.p.idCOREGDL ? 'COREGDL · ' + escaparHTML(x.p.idCOREGDL) : 'Sin expediente ligado') + '</div></td>' +
    '<td>' + (edad(x.p.fechaNacimiento) !== null ? edad(x.p.fechaNacimiento) + ' años' : '—') + '</td>' +
    '<td>' + (x.ep ? escaparHTML(dxEpisodio(x.ep)) : '<span class="text-muted">Sin cirugía registrada</span>') + '</td>' +
    '<td>' + (x.ep ? '<span class="tag tag-accent">' + tagDe(x.ep) + '</span>' : '') + '</td>' +
    '<td>' + (x.sem !== null && x.sem >= 0 ? 'Sem ' + x.sem : '—') + '</td>' +
    '<td>' + (x.ultima ? fmtFecha(x.ultima) : '—') + '</td>' +
    '<td>' + (tagTendencia(x.tendencia) || '<span class="text-muted">—</span>') + '</td></tr>'
  ).join('');

  const tarjetas = lista => lista.map(x =>
    '<div class="card card-clic" data-ir="' + hashPerfil(x.p.id, x.ep && x.ep.id) + '" style="gap:6px">' +
    '<div style="display:flex;align-items:center;gap:8px">' +
    '<div style="font-weight:600;font-size:15px;flex:1">' + escaparHTML(x.p.nombre) + '</div>' +
    (x.ep ? '<span class="tag tag-accent">' + tagDe(x.ep) + '</span>' : '') + '</div>' +
    '<div class="text-muted" style="font-size:12px">' +
    (x.ep ? escaparHTML(dxEpisodio(x.ep)) : 'Sin cirugía registrada') + '</div>' +
    '<div class="card-meta">' +
    (x.sem !== null && x.sem >= 0 ? '<span>Sem ' + x.sem + ' PO</span><span>·</span>' : '') +
    (x.ultima ? '<span>' + fmtFecha(x.ultima) + '</span>' : '<span>Sin visitas</span>') +
    '<span style="flex:1"></span>' + tagTendencia(x.tendencia) + '</div></div>'
  ).join('');

  const pintar = lista =>
    '<div class="solo-ancho"><table class="table">' +
    '<thead><tr><th>Paciente</th><th>Edad</th><th>Diagnóstico</th><th>Protocolo</th>' +
    '<th>Sem. PO</th><th>Última visita</th><th>Evolución</th></tr></thead>' +
    '<tbody>' + filasTabla(lista) + '</tbody></table></div>' +
    '<div class="solo-angosto"><div class="lista-tarjetas">' + tarjetas(lista) + '</div></div>';

  cont.innerHTML = '<div class="pagina">' +
    '<div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid var(--color-divider);padding-bottom:16px;flex-wrap:wrap">' +
    '<h2 style="margin:0">Pacientes</h2>' +
    '<span class="text-muted" style="font-size:13px">' + pacientes.length + ' en seguimiento</span>' +
    '<div style="flex:1"></div>' +
    '<input class="input solo-ancho" style="width:250px" id="buscar" type="search" placeholder="Buscar paciente o diagnóstico">' +
    '<button class="btn btn-primary solo-ancho" id="btnNuevoPaciente">Nuevo paciente</button>' +
    '</div>' +
    '<input class="input solo-angosto" style="margin:12px 0 2px;min-height:44px;width:100%" id="buscarM" type="search" placeholder="Buscar paciente o diagnóstico">' +
    '<div id="listaPacientes" style="margin-top:12px">' +
    (pacientes.length ? pintar(info) :
      '<div class="vacio"><div class="icono">🩺</div>Aún no hay pacientes.<br>' +
      'Dé de alta al primero y aquí quedará su seguimiento completo.</div>') +
    '</div>' +
    '<p class="text-muted solo-ancho" style="font-size:12px;margin-top:14px">Toque un paciente para abrir su registro y ver la evolución entre visitas.</p>' +
    '<button class="btn btn-primary btn-block btn-grande solo-angosto" id="btnNuevoPacienteM">Nuevo paciente</button>' +
    '</div>';

  instalarIr(cont);
  const filtrar = (q) => {
    const lista = info.filter(x =>
      !q || (x.p.nombre + ' ' + (x.ep ? dxEpisodio(x.ep) : '')).toLowerCase().includes(q));
    cont.querySelector('#listaPacientes').innerHTML =
      lista.length ? pintar(lista) : '<div class="vacio">Sin coincidencias.</div>';
    instalarIr(cont.querySelector('#listaPacientes'));
  };
  for (const id of ['buscar', 'buscarM']) {
    const inp = cont.querySelector('#' + id);
    if (inp) inp.addEventListener('input', () => filtrar(inp.value.trim().toLowerCase()));
  }
  for (const id of ['btnNuevoPaciente', 'btnNuevoPacienteM']) {
    const b = cont.querySelector('#' + id);
    if (b) b.addEventListener('click', () => irA('#/paciente/nuevo'));
  }
}

/* ---------------- alta / edición de paciente ---------------- */
async function vistaFormPaciente(cont, pid) {
  activarNav('pacientes');
  const p = pid ? await DB.obtener('pacientes', pid) : null;

  cont.innerHTML = '<div class="pagina" style="max-width:640px">' +
    atrasHTML(p ? '#/paciente/' + pid : '#/', p ? p.nombre : 'Pacientes') +
    '<h3 style="margin:10px 0 14px">' + (p ? 'Editar paciente' : 'Nuevo paciente') + '</h3>' +
    '<div class="card" style="gap:14px">' +
    '<div class="field"><label>Nombre completo *</label>' +
    '<input class="input" type="text" id="pNombre" autocomplete="off" style="min-height:48px;font-size:16px" value="' + escaparHTML(p ? p.nombre : '') + '"></div>' +
    '<div class="dos-col">' +
    '<div class="field"><label>Fecha de nacimiento</label>' +
    '<input class="input" type="date" id="pNac" style="min-height:48px" value="' + (p && p.fechaNacimiento || '') + '"></div>' +
    '<div class="field"><label>Sexo</label><select class="input" id="pSexo">' +
    ['', 'Femenino', 'Masculino'].map(s =>
      '<option' + (p && p.sexo === s ? ' selected' : '') + '>' + s + '</option>').join('') +
    '</select></div>' +
    '<div class="field"><label>Teléfono</label>' +
    '<input class="input" type="tel" id="pTel" style="min-height:48px" value="' + escaparHTML(p && p.telefono || '') + '"></div>' +
    '<div class="field"><label>ID en COREGDL (opcional)</label>' +
    '<input class="input" type="text" id="pCoregdl" autocomplete="off" style="min-height:48px" placeholder="Para ligar con el expediente" value="' + escaparHTML(p && p.idCOREGDL || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Notas</label>' +
    '<textarea class="input" id="pNotas" rows="2">' + escaparHTML(p && p.notas || '') + '</textarea></div>' +
    '</div>' +
    '<button class="btn btn-primary btn-block btn-grande" id="btnGuardarP">Guardar paciente</button>' +
    (p ? '<button class="btn btn-peligro btn-block" id="btnBorrarP">Eliminar paciente y todo su historial</button>' : '') +
    '</div>';

  instalarIr(cont);
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
    irA('#/paciente/' + obj.id);
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
    irA('#/');
  });
}

/* ---------------- perfil del paciente (diseño: registro + evolución) -------- */
async function vistaPaciente(cont, pid, eidSel) {
  activarNav('pacientes');
  const p = await DB.obtener('pacientes', pid);
  if (!p) { irA('#/'); return; }
  const episodios = (await DB.porIndice('episodios', 'pacienteId', pid))
    .sort((a, b) => (b.fechaCirugia || '') < (a.fechaCirugia || '') ? -1 : 1);

  /* sin cirugías: invitación a registrar */
  if (!episodios.length) {
    cont.innerHTML = '<div class="pagina">' +
      atrasHTML('#/', 'Pacientes') +
      '<div style="display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap">' +
      '<h2 style="margin:0">' + escaparHTML(p.nombre) + '</h2>' +
      '<div style="flex:1"></div>' +
      '<button class="btn btn-ghost" data-ir="#/paciente/' + pid + '/editar">Editar datos</button></div>' +
      '<div class="vacio"><div class="icono">🩻</div>Registre la cirugía o el tratamiento<br>para empezar a evaluar.</div>' +
      '<button class="btn btn-primary btn-block btn-grande" data-ir="#/episodio/' + pid + '/nuevo">Registrar cirugía / tratamiento</button>' +
      '</div>';
    instalarIr(cont);
    return;
  }

  const ep = (eidSel && episodios.find(e => e.id === eidSel)) || episodios[0];
  const pl = PLANTILLAS[ep.tipo];
  const [evals, escalas] = await Promise.all([
    DB.porIndice('evaluaciones', 'episodioId', ep.id),
    DB.porIndice('escalas', 'episodioId', ep.id)
  ]);
  const evOrden = evals.sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  const sem = semanasDesde(ep.fechaCirugia, hoyISO());

  /* selector cuando hay varias cirugías */
  const selector = episodios.length > 1 ?
    '<div class="opciones" style="margin-top:12px">' + episodios.map(e =>
      '<button class="op' + (e.id === ep.id ? ' activa' : '') + '" style="flex:0 1 auto" data-ir="' +
      hashPerfil(pid, e.id) + '">' + tagDe(e) +
      (e.fechaCirugia ? ' · ' + fmtFecha(e.fechaCirugia) : '') + '</button>').join('') + '</div>' : '';

  /* franja de datos (diseño: 5 columnas entre divisores) */
  const franja =
    '<div class="franja-datos">' +
    '<div><div class="card-kicker">Edad</div><div class="valor">' +
    (edad(p.fechaNacimiento) !== null ? edad(p.fechaNacimiento) + ' años' : '—') + '</div></div>' +
    '<div><div class="card-kicker">Diagnóstico</div><div class="valor">' + escaparHTML(dxEpisodio(ep)) + '</div></div>' +
    '<div><div class="card-kicker">Cirugía</div><div class="valor">' +
    (ep.fechaCirugia ? fmtFecha(ep.fechaCirugia) : 'Sin fecha') + '</div></div>' +
    '<div><div class="card-kicker">Evolución</div><div class="valor">' +
    (sem !== null && sem >= 0 ? sem + ' semanas PO' : '—') + '</div></div>' +
    '<div><div class="card-kicker">Expediente</div><div class="valor">' +
    (p.idCOREGDL ? 'COREGDL · ' + escaparHTML(p.idCOREGDL) : '—') + '</div></div>' +
    '</div>';

  /* gráficas de resumen (ROM, LSI, escala) */
  const resumen = seriesResumen(ep, evOrden, escalas);
  const graficas = resumen.map(tarjetaGrafica).filter(Boolean);

  /* historial de visitas: evaluaciones + escalas del episodio */
  const rom = romPrincipal(pl), idLsi = lsiPrincipalId(pl);
  const filasVisitas = [];
  const fechasEval = new Set(evOrden.map(v => v.fecha));
  for (const v of evOrden) {
    const escMisma = escalas.filter(r => r.fecha === v.fecha);
    filasVisitas.push({
      fecha: v.fecha, ir: '#/evaluacion/' + pid + '/' + ep.id + '/' + v.id,
      rom: (() => { const n = _valorEnEval(v, pl, rom.id); return n !== null ? Math.round(n) + '°' : '—'; })(),
      lsi: (() => { const n = _valorEnEval(v, pl, idLsi); return n !== null ? Math.round(n) + ' %' : '—'; })(),
      escala: escMisma.length ? escMisma.map(r => {
        const esc = escalaPorId(r.escalaId);
        return (esc ? esc.corto : r.escalaId) + ' ' + r.puntos;
      }).join(' · ') : '—'
    });
  }
  for (const r of escalas.filter(r => !fechasEval.has(r.fecha))) {
    const esc = escalaPorId(r.escalaId);
    filasVisitas.push({
      fecha: r.fecha, ir: '#/resescala/' + pid + '/' + ep.id + '/' + r.id,
      rom: '—', lsi: '—',
      escala: (esc ? esc.corto : r.escalaId) + ' ' + r.puntos + '/' + r.maximo
    });
  }
  filasVisitas.sort((a, b) => a.fecha < b.fecha ? 1 : -1);

  const tablaVisitas = filasVisitas.length ?
    '<table class="table"><thead><tr><th>Fecha</th><th>Sem PO</th><th>' + rom.label +
    '</th><th>LSI fuerza</th><th>Escala</th><th></th></tr></thead><tbody>' +
    filasVisitas.map((f, i) => {
      const s = semanasDesde(ep.fechaCirugia, f.fecha);
      return '<tr class="clic" data-ir="' + f.ir + '">' +
        '<td style="font-weight:600">' + fmtFecha(f.fecha) + '</td>' +
        '<td>' + (s !== null ? 'Sem ' + s : '—') + '</td>' +
        '<td>' + f.rom + '</td><td>' + f.lsi + '</td><td>' + f.escala + '</td>' +
        '<td>' + (i === 0 ? '<span class="tag tag-neutral">Más reciente</span>' : '') + '</td></tr>';
    }).join('') + '</tbody></table>' :
    '<div class="vacio">Sin visitas registradas todavía.<br>Capture la primera evaluación con «Nueva evaluación».</div>';

  cont.innerHTML = '<div class="pagina">' +
    atrasHTML('#/', 'Pacientes') +
    '<div style="display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap">' +
    '<h2 style="margin:0">' + escaparHTML(p.nombre) + '</h2>' +
    '<span class="tag tag-accent">' + tagDe(ep) + '</span>' +
    '<div style="flex:1"></div>' +
    '<button class="btn btn-secondary solo-ancho" id="btnExportarP">Exportar a COREGDL</button>' +
    '<button class="btn btn-primary solo-ancho" data-ir="#/nueva/' + pid + '/' + ep.id + '">Nueva evaluación</button>' +
    '</div>' +
    selector + franja +
    '<div class="card-meta" style="margin-top:8px;gap:14px;flex-wrap:wrap">' +
    '<button class="btn btn-ghost" style="font-size:12px" data-ir="#/paciente/' + pid + '/editar">Editar datos</button>' +
    '<button class="btn btn-ghost" style="font-size:12px" data-ir="#/episodio/' + pid + '/' + ep.id + '/editar">Editar tratamiento</button>' +
    '<button class="btn btn-ghost" style="font-size:12px" data-ir="#/episodio/' + pid + '/nuevo">Registrar otra cirugía</button>' +
    '<button class="btn btn-ghost solo-angosto" style="font-size:12px" id="btnExportarPM">Exportar a COREGDL</button>' +
    '</div>' +
    '<button class="btn btn-primary btn-block btn-grande solo-angosto" data-ir="#/nueva/' + pid + '/' + ep.id + '" style="margin:14px 0 6px">Nueva evaluación</button>' +
    (p.notas ? '<p class="text-muted" style="font-size:13px;margin-top:10px">' + escaparHTML(p.notas) + '</p>' : '') +
    '<h4 style="margin:24px 0 12px">Evolución entre visitas</h4>' +
    (graficas.length ?
      '<div class="grid-graficas">' + graficas.join('') + '</div>' +
      '<button class="btn btn-ghost" style="margin-top:10px" data-ir="#/evolucion/' + pid + '/' + ep.id + '">Ver todas las gráficas →</button>' :
      '<p class="text-muted" style="font-size:13px">Las gráficas aparecen al guardar la primera evaluación o escala.</p>') +
    '<h4 style="margin:28px 0 4px">Historial de visitas</h4>' +
    tablaVisitas +
    '</div>';

  instalarIr(cont);
  const exportar = async () => {
    const paquete = { app: 'CORE Scale', formato: 1, exportado: new Date().toISOString(),
      paciente: p, episodios: [] };
    for (const e of episodios) {
      paquete.episodios.push({
        ...e,
        evaluaciones: await DB.porIndice('evaluaciones', 'episodioId', e.id),
        escalas: await DB.porIndice('escalas', 'episodioId', e.id)
      });
    }
    descargarJSON('corescale_' + p.nombre.replace(/\s+/g, '_') + '.json', paquete);
  };
  for (const id of ['btnExportarP', 'btnExportarPM']) {
    const b = cont.querySelector('#' + id);
    if (b) b.addEventListener('click', exportar);
  }
}

/* ---------------- alta / edición de episodio ---------------- */
async function vistaFormEpisodio(cont, pid, eid) {
  activarNav('pacientes');
  const p = await DB.obtener('pacientes', pid);
  const e = eid ? await DB.obtener('episodios', eid) : null;

  cont.innerHTML = '<div class="pagina" style="max-width:640px">' +
    atrasHTML(e ? hashPerfil(pid, eid) : '#/paciente/' + pid, p.nombre) +
    '<h3 style="margin:10px 0 14px">' + (e ? 'Editar tratamiento' : 'Nueva cirugía / tratamiento') + '</h3>' +
    '<div class="card" style="gap:14px">' +
    '<div class="field"><label>Tipo de cirugía / tratamiento *</label>' +
    '<select class="input" id="eTipo">' +
    Object.values(PLANTILLAS).map(pl =>
      '<option value="' + pl.id + '"' + (e && e.tipo === pl.id ? ' selected' : '') + '>' +
      pl.nombre + '</option>').join('') +
    '</select></div>' +
    '<div class="dos-col">' +
    '<div class="field"><label>Lado</label><select class="input" id="eLado">' +
    ['', 'Derecha', 'Izquierda'].map(l =>
      '<option' + (e && e.lado === l ? ' selected' : '') + '>' + l + '</option>').join('') +
    '</select></div>' +
    '<div class="field"><label>Fecha de la cirugía</label>' +
    '<input class="input" type="date" id="eFecha" style="min-height:48px" value="' + (e && e.fechaCirugia || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Notas (técnica, injerto, implante…)</label>' +
    '<textarea class="input" id="eNotas" rows="2">' + escaparHTML(e && e.notas || '') + '</textarea></div>' +
    '</div>' +
    '<button class="btn btn-primary btn-block btn-grande" id="btnGuardarE">Guardar</button>' +
    (e ? '<button class="btn btn-peligro btn-block" id="btnBorrarE">Eliminar este tratamiento y sus evaluaciones</button>' : '') +
    '</div>';

  instalarIr(cont);
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
    irA(hashPerfil(pid, obj.id));
  });
  const borrar = cont.querySelector('#btnBorrarE');
  if (borrar) borrar.addEventListener('click', async () => {
    if (!confirm('¿Eliminar este tratamiento con todas sus evaluaciones y escalas?')) return;
    for (const ev of await DB.porIndice('evaluaciones', 'episodioId', e.id)) await DB.borrar('evaluaciones', ev.id);
    for (const r of await DB.porIndice('escalas', 'episodioId', e.id)) await DB.borrar('escalas', r.id);
    await DB.borrar('episodios', e.id);
    irA('#/paciente/' + pid);
  });
}

/* --------- nueva evaluación: elegir protocolo o escala (diseño) --------- */
async function vistaNueva(cont, pid, eid) {
  activarNav('pacientes');
  const [p, ep] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid)
  ]);
  if (!p || !ep) { irA('#/'); return; }
  const pl = PLANTILLAS[ep.tipo];
  const sem = semanasDesde(ep.fechaCirugia, hoyISO());
  const { sugeridas, resto } = escalasParaEpisodio(ep.tipo);

  const cartaEscala = e => cartaProtocolo({
    ir: '#/escala/' + pid + '/' + eid + '/' + e.id,
    kicker: e.quien === 'paciente' ? 'Escala reportada por el paciente' : 'Escala aplicada por el médico',
    titulo: e.corto, desc: e.descripcion,
    meta: e.preguntas.length + (e.preguntas.length === 1 ? ' pregunta' : ' preguntas') + ' · ' + e.tiempo,
    accion: 'Aplicar escala →'
  });

  cont.innerHTML = '<div class="pagina">' +
    atrasHTML(hashPerfil(pid, eid), p.nombre) +
    '<h2 style="margin:10px 0 4px">Nueva evaluación</h2>' +
    '<p class="text-muted" style="font-size:13px">' + escaparHTML(dxEpisodio(ep)) +
    (edad(p.fechaNacimiento) !== null ? ' · ' + edad(p.fechaNacimiento) + ' años' : '') +
    (sem !== null && sem >= 0 ? ' · Sem ' + sem + ' PO' : '') +
    (p.idCOREGDL ? ' · Expediente ' + escaparHTML(p.idCOREGDL) : '') + '</p>' +
    '<div class="hr"></div>' +
    '<div class="grid-cartas">' +
    (pl ? cartaProtocolo({
      ir: '#/capturar/' + pid + '/' + eid + '/' + pl.id,
      kicker: pl.kicker, titulo: pl.nombre, desc: pl.desc,
      meta: pl.secciones.length + ' secciones · registro guiado con técnica'
    }) : '') +
    sugeridas.map(cartaEscala).join('') +
    '</div>' +
    (resto.length ?
      '<h5 style="margin:22px 0 10px">Otras escalas</h5>' +
      '<div class="grid-cartas">' + resto.map(cartaEscala).join('') + '</div>' : '') +
    '</div>';
  instalarIr(cont);
}

/* ---------------- catálogo de protocolos (consulta) ---------------- */
async function vistaProtocolos(cont) {
  activarNav('protocolos');
  cont.innerHTML = '<div class="pagina">' +
    '<div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid var(--color-divider);padding-bottom:16px">' +
    '<h2 style="margin:0">Protocolos</h2>' +
    '<span class="text-muted" style="font-size:13px">Consulta de técnica; para capturar, entre desde un paciente</span></div>' +
    '<h5 style="margin:20px 0 10px">Evaluaciones postoperatorias</h5>' +
    '<div class="grid-cartas">' +
    Object.values(PLANTILLAS).map(pl => cartaProtocolo({
      ir: '#/protocolo/' + pl.id, kicker: pl.kicker, titulo: pl.nombre, desc: pl.desc,
      meta: pl.secciones.length + ' secciones', accion: 'Ver técnica →'
    })).join('') + '</div>' +
    '<h5 style="margin:22px 0 10px">Escalas funcionales</h5>' +
    '<div class="grid-cartas">' +
    ESCALAS.map(e => cartaProtocolo({
      ir: '#/protocolo/esc_' + e.id,
      kicker: e.quien === 'paciente' ? 'Escala reportada por el paciente' : 'Escala aplicada por el médico',
      titulo: e.corto, desc: e.descripcion,
      meta: e.preguntas.length + (e.preguntas.length === 1 ? ' pregunta' : ' preguntas') + ' · ' + e.tiempo,
      accion: 'Ver detalle →'
    })).join('') + '</div>' +
    '</div>';
  instalarIr(cont);
}

async function vistaProtocolo(cont, id) {
  activarNav('protocolos');
  if (id.startsWith('esc_')) {
    const e = escalaPorId(id.slice(4));
    if (!e) { irA('#/protocolos'); return; }
    cont.innerHTML = '<div class="pagina" style="max-width:720px">' +
      atrasHTML('#/protocolos', 'Protocolos') +
      '<div class="card-kicker" style="margin-top:14px">' +
      (e.quien === 'paciente' ? 'Escala reportada por el paciente' : 'Escala aplicada por el médico') + '</div>' +
      '<h3 style="margin:4px 0 8px">' + e.nombre + '</h3>' +
      '<p class="text-muted" style="font-size:14px">' + e.descripcion + '</p>' +
      '<div class="card" style="margin-top:14px"><div class="card-kicker">Cómo aplicarla</div>' +
      '<ul style="margin:4px 0 0;padding-left:18px;font-size:13px;line-height:1.55">' +
      e.instrucciones.map(x => '<li>' + x + '</li>').join('') + '</ul></div>' +
      (e.nota ? '<div class="aviso">' + e.nota + '</div>' : '') +
      '<h5 style="margin:20px 0 8px">Preguntas (' + e.preguntas.length + ')</h5>' +
      '<table class="table">' + e.preguntas.map((q, i) =>
        '<tr><td style="width:30px" class="text-muted">' + (i + 1) + '</td><td>' + q.texto + '</td></tr>').join('') +
      '</table></div>';
  } else {
    const pl = PLANTILLAS[id];
    if (!pl) { irA('#/protocolos'); return; }
    cont.innerHTML = '<div class="pagina" style="max-width:760px">' +
      atrasHTML('#/protocolos', 'Protocolos') +
      '<div class="card-kicker" style="margin-top:14px">' + pl.kicker + '</div>' +
      '<h3 style="margin:4px 0 8px">' + pl.nombre + '</h3>' +
      '<p class="text-muted" style="font-size:14px">' + pl.desc + '</p>' +
      pl.secciones.map((s, i) =>
        '<div class="card" style="margin-top:14px;gap:6px">' +
        '<div class="card-kicker">Sección ' + (i + 1) + '</div>' +
        '<div class="card-title" style="font-size:16px">' + s.titulo + '</div>' +
        '<ul style="margin:4px 0 6px;padding-left:18px;font-size:13px;line-height:1.55">' +
        s.instrucciones.map(x => '<li>' + x + '</li>').join('') + '</ul>' +
        '<div class="card-meta">Se registra: ' + s.campos.map(c => c.et).join(' · ') + '</div>' +
        '</div>').join('') +
      '</div>';
  }
  instalarIr(cont);
}

/* ---------------- ajustes ---------------- */
async function vistaAjustes(cont) {
  activarNav('ajustes');
  const evaluador = await DB.conf('evaluador') || '';
  const [np, ne, nev, nes] = await Promise.all([
    DB.todos('pacientes'), DB.todos('episodios'),
    DB.todos('evaluaciones'), DB.todos('escalas')
  ]);

  cont.innerHTML = '<div class="pagina" style="max-width:640px">' +
    '<h2 style="margin:0 0 16px">Ajustes</h2>' +
    '<div class="card" style="gap:12px">' +
    '<div class="field"><label>Evaluador por defecto</label>' +
    '<input class="input" type="text" id="ajEvaluador" style="min-height:48px" value="' + escaparHTML(evaluador) + '" placeholder="Dr. …"></div>' +
    '<div><button class="btn btn-primary" id="btnGuardarAj">Guardar</button></div>' +
    '</div>' +
    '<h5 style="margin:22px 0 10px">Respaldo</h5>' +
    '<div class="card" style="gap:10px">' +
    '<p class="text-muted" style="margin:0;font-size:13.5px;line-height:1.55">' +
    'Todo se guarda en ESTE dispositivo; nada sale a internet. Haga un respaldo con regularidad ' +
    'y guárdelo en Archivos/iCloud: si se borra Safari o se pierde el dispositivo, el respaldo es lo único que queda.</p>' +
    '<div style="font-size:14px"><b>' + np.length + '</b> pacientes · <b>' + ne.length + '</b> tratamientos · <b>' +
    nev.length + '</b> evaluaciones · <b>' + nes.length + '</b> escalas</div>' +
    '<button class="btn btn-primary btn-block btn-grande" id="btnRespaldo">Descargar respaldo completo</button>' +
    '<button class="btn btn-secondary btn-block" id="btnImportar">Restaurar / importar respaldo</button>' +
    '<input type="file" id="archivoImportar" accept=".json,application/json" class="oculto">' +
    '</div>' +
    '<h5 style="margin:22px 0 10px">Acerca de</h5>' +
    '<div class="card text-muted" style="font-size:13.5px;line-height:1.6">' +
    '<div><b style="color:var(--color-text)">CORE Scale ' + VERSION_APP + '</b></div>' +
    'Evaluación objetiva postoperatoria: goniometría, dinamometría y escalas funcionales, ' +
    'con seguimiento por paciente. Pensada para consultorios de ortopedia y para conectarse ' +
    'con el expediente COREGDL.<br><br>' +
    'Escalas: DASH y QuickDASH © Institute for Work &amp; Health (uso clínico no comercial); ' +
    'IKDC (AOSSM); KOOS JR (HSS, uso libre); Lysholm, Kujala y Tegner (dominio de la literatura). ' +
    'Los resultados apoyan el juicio clínico, no lo sustituyen.' +
    '</div></div>';

  cont.querySelector('#btnGuardarAj').addEventListener('click', async (ev) => {
    await DB.conf('evaluador', cont.querySelector('#ajEvaluador').value.trim());
    pintarPieLateral();
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
      irA('#/'); render();
    } catch (err) {
      alert('No se pudo importar: ' + err.message);
    }
  });
}

/* ---------------- enrutador ---------------- */
async function render() {
  const cont = document.getElementById('contenido');
  const partes = (location.hash || '#/').slice(2).split('/').filter(Boolean);
  cont.scrollTop = 0; window.scrollTo(0, 0);

  try {
    if (!partes.length) return vistaPacientes(cont);
    const [r, a, b, c, d] = partes;
    if (r === 'paciente' && a === 'nuevo') return vistaFormPaciente(cont, null);
    if (r === 'paciente' && b === 'editar') return vistaFormPaciente(cont, a);
    if (r === 'paciente' && b === 'ep') return vistaPaciente(cont, a, c);
    if (r === 'paciente') return vistaPaciente(cont, a);
    if (r === 'episodio' && b === 'nuevo') return vistaFormEpisodio(cont, a, null);
    if (r === 'episodio' && c === 'editar') return vistaFormEpisodio(cont, a, b);
    if (r === 'episodio') return vistaPaciente(cont, a, b);
    if (r === 'nueva') return vistaNueva(cont, a, b);
    if (r === 'capturar') return vistaFormEvaluacion(cont, a, b, c, d);
    if (r === 'evaluacion') return vistaEvaluacion(cont, a, b, c);
    if (r === 'escalas') return vistaNueva(cont, a, b);
    if (r === 'escala') return vistaAplicarEscala(cont, a, b, c);
    if (r === 'resescala') return vistaResultadoEscala(cont, a, b, c);
    if (r === 'evolucion') return vistaEvolucion(cont, a, b);
    if (r === 'protocolos') return vistaProtocolos(cont);
    if (r === 'protocolo') return vistaProtocolo(cont, a);
    if (r === 'ajustes') return vistaAjustes(cont);
    return vistaPacientes(cont);
  } catch (err) {
    cont.innerHTML = '<div class="vacio"><div class="icono">⚠️</div>' +
      'Algo salió mal al abrir esta pantalla.<br>' + escaparHTML(err.message) + '</div>';
    console.error(err);
  }
}

for (const [id, hash] of [['navPacientes', '#/'], ['navProtocolos', '#/protocolos'],
  ['navAjustes', '#/ajustes'], ['tabPacientes', '#/'], ['tabProtocolos', '#/protocolos'],
  ['tabAjustes', '#/ajustes']]) {
  document.getElementById(id).addEventListener('click', () => {
    if (location.hash === hash || (hash === '#/' && !location.hash)) render();
    else location.hash = hash;
  });
}
window.addEventListener('hashchange', render);
pintarPieLateral();
render();
