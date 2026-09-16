/* MAIA Escalas — captura y consulta de evaluaciones (las 4 plantillas).
   Asistente por secciones tomado del diseño Modernist: riel lateral en iPad,
   fila de números en iPhone, recuadro "Técnica", contadores −/+, cálculo del
   LSI en vivo y diálogo de confirmación al guardar.                          */

function _pasoBoton(campo) {
  if (campo.unidad === '°') return 5;
  if (campo.unidad === 'rep') return 1;
  if (campo.unidad === 'seg') return 0.1;
  return 0.5;
}

function _claseNum(a) {
  if (a.tipo !== 'lsi') return '';
  return { bueno: 'ok', medio: 'alerta', malo: 'peligro' }[claseLSI(a)] || '';
}
function _tagAuto(a) {
  if (a.tipo !== 'lsi') return 'tag-neutral';
  return { bueno: 'tag-ok', medio: 'tag-alerta', malo: 'tag-peligro' }[claseLSI(a)] || 'tag-neutral';
}

function _campoHTML(campo, valor) {
  const v = valor === undefined || valor === null ? '' : valor;
  if (campo.tipo === 'num') {
    return '<div class="field" data-campo="' + campo.id + '" style="min-width:0">' +
      '<label>' + campo.et + (campo.crono ? ' <span class="text-muted">(o use el cronómetro)</span>' : '') + '</label>' +
      '<div class="stepper">' +
      '<button type="button" class="paso" data-dir="-1">−</button>' +
      '<input class="input" type="text" inputmode="decimal" autocomplete="off" value="' + v + '" placeholder="—">' +
      '<div class="unidad">' + campo.unidad + '</div>' +
      '<button type="button" class="paso" data-dir="1">+</button>' +
      '</div></div>';
  }
  if (campo.tipo === 'ops' || campo.tipo === 'sino') {
    const ops = campo.tipo === 'sino'
      ? [{ v: 'si', et: 'Sí' }, { v: 'no', et: 'No' }] : campo.ops;
    return '<div class="field ancho-total" data-campo="' + campo.id + '"><label>' + campo.et + '</label>' +
      '<div class="opciones">' + ops.map(o =>
        '<button type="button" class="op' + (String(v) === String(o.v) ? ' activa' : '') +
        '" data-v="' + o.v + '">' + o.et + '</button>').join('') +
      '</div></div>';
  }
  if (campo.tipo === 'sel') {
    return '<div class="field" data-campo="' + campo.id + '"><label>' + campo.et + '</label>' +
      '<select class="input"><option value="">—</option>' + campo.ops.map(o =>
        '<option' + (v === o ? ' selected' : '') + '>' + o + '</option>').join('') +
      '</select></div>';
  }
  return '';
}

function _cintaHTML(seccion, valores) {
  const autos = calcularAutos(seccion, valores);
  if (!autos.length) return '';
  let datos = '';
  if (seccion.tipoSeccion === 'dinamometria') {
    const contra = parseFloat(String(valores[seccion.id + '_contra'] || '').replace(',', '.'));
    const mejor = autos.find(a => a.tipo === 'max');
    if (mejor) datos += '<div class="dato"><div class="card-kicker">Mejor intento</div>' +
      '<div class="num">' + formatoAuto(mejor) + '</div></div>';
    datos += '<div class="dato"><div class="card-kicker">Contralateral</div>' +
      '<div class="num">' + (isNaN(contra) ? '—' : contra + ' kg') + '</div></div>';
    const lsi = autos.find(a => a.tipo === 'lsi');
    if (lsi) datos += '<div class="dato"><div class="card-kicker">Índice de simetría (LSI)</div>' +
      '<div class="num ' + (_claseNum(lsi) || 'acento') + '">' + formatoAuto(lsi) + '</div></div>' +
      '<div class="nota">LSI = mejor intento ÷ contralateral × 100. ' + (lsi.nota || '') + '</div>';
  } else {
    for (const a of autos) {
      datos += '<div class="dato"><div class="card-kicker">' + a.et + '</div>' +
        '<div class="num ' + _claseNum(a) + '">' + formatoAuto(a) + '</div></div>';
    }
    const conNota = autos.find(a => a.nota && a.num !== null);
    if (conNota) datos += '<div class="nota">' + conNota.nota + '</div>';
  }
  return '<div class="cinta">' + datos + '</div>';
}

function _seccionCompleta(seccion, valores) {
  const conValor = seccion.campos.filter(c =>
    valores[c.id] !== undefined && valores[c.id] !== null && valores[c.id] !== '').length;
  return { conValor, total: seccion.campos.length };
}

/* ---------- Cronómetro (TUG y 30s STS) ---------- */
function _cronoHTML(tipo) {
  const et = tipo === 'cronometro30' ? '30.0' : '0.0';
  return '<div class="crono" data-tipo="' + tipo + '">' +
    '<span class="tiempo">' + et + '<small style="font-size:15px;color:var(--color-neutral-600)"> seg</small></span>' +
    '<button type="button" class="btn btn-secondary btn-grande ir">▶ Iniciar</button></div>';
}

function _instalarCrono(cont, seccion, alTerminar) {
  const caja = cont.querySelector('.crono');
  if (!caja) return;
  const esCuenta = caja.dataset.tipo === 'cronometro30';
  const lbl = caja.querySelector('.tiempo');
  const btn = caja.querySelector('.ir');
  let t0 = null, timer = null;
  const pintar = () => {
    const trans = (Date.now() - t0) / 1000;
    const val = esCuenta ? Math.max(0, 30 - trans) : trans;
    lbl.innerHTML = val.toFixed(1) + '<small style="font-size:15px;color:var(--color-neutral-600)"> seg</small>';
    if (esCuenta && val <= 0) {
      clearInterval(timer); timer = null;
      lbl.innerHTML = '<span style="color:var(--color-accent-700)">¡Tiempo! Anote las repeticiones.</span>';
      btn.textContent = '▶ Reiniciar';
      if (navigator.vibrate) navigator.vibrate(400);
    }
  };
  btn.addEventListener('click', () => {
    if (timer) {
      clearInterval(timer); timer = null;
      const seg = Math.round((Date.now() - t0) / 100) / 10;
      btn.textContent = '▶ Iniciar';
      if (!esCuenta) alTerminar(seg);
      pintar();
    } else {
      t0 = Date.now();
      timer = setInterval(pintar, 100);
      btn.textContent = esCuenta ? '⏹ Cancelar' : '⏹ Detener y guardar';
    }
  });
}

/* ================= Captura / edición (asistente) ================= */
async function vistaFormEvaluacion(cont, pid, eid, plantillaId, evalId) {
  activarNav('pacientes');
  const [paciente, episodio] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid)
  ]);
  if (!paciente || !episodio) { irA('#/'); return; }
  const existente = evalId ? await DB.obtener('evaluaciones', evalId) : null;
  const plantilla = PLANTILLAS[plantillaId];
  const secs = plantilla.secciones;

  const valores = existente ? { ...existente.valores } : {};
  let fecha = existente ? existente.fecha : hoyISO();
  let evaluador = existente ? (existente.evaluador || '') : (await DB.conf('evaluador') || '');
  let notas = existente && existente.notas || '';
  let si = 0;

  const metaCap = () => {
    const s = semanasDesde(episodio.fechaCirugia, fecha);
    return (s !== null && s >= 0 ? 'Sem ' + s + ' PO · ' : '') + fmtFecha(fecha) +
      (episodio.lado ? ' · ' + episodio.lado : '');
  };

  function pintar() {
    const sec = secs[si];
    const est = i => _seccionCompleta(secs[i], valores);

    const rail = '<div class="rail solo-ancho">' +
      atrasHTML(hashPerfil(pid, eid), paciente.nombre) +
      '<div class="card-kicker" style="margin-top:16px">Evaluación postoperatoria</div>' +
      '<h3 style="margin:4px 0 6px;font-size:20px">' + plantilla.nombre + '</h3>' +
      '<div class="text-muted" style="font-size:12px">' + metaCap() + '</div>' +
      '<div class="hr"></div>' +
      secs.map((sx, i) => {
        const e = est(i);
        return '<div class="rail-item' + (i === si ? ' activa' : '') + '" data-sec="' + i + '">' +
          '<div class="rail-num' + (e.conValor === e.total ? ' lista' : '') + '">' +
          (e.conValor === e.total ? '✓' : (i + 1)) + '</div><div>' + sx.titulo + '</div></div>';
      }).join('') + '</div>';

    const pasosMovil = '<div style="display:flex;align-items:center;gap:8px" class="solo-angosto">' +
      '<button class="btn btn-ghost" data-ir="' + hashPerfil(pid, eid) + '">←</button>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-family:var(--font-heading);font-weight:800;font-size:15px;line-height:1.15">' + plantilla.nombre + '</div>' +
      '<div class="text-muted" style="font-size:11px">' + escaparHTML(paciente.nombre) + ' · ' + metaCap() + '</div></div>' +
      '<span class="tag tag-neutral">' + (si + 1) + ' / ' + secs.length + '</span></div>' +
      '<div class="pasos-movil">' +
      secs.map((sx, i) => {
        const e = est(i);
        return '<button class="paso-num' + (i === si ? ' activa' : '') +
          (e.conValor === e.total ? ' lista' : '') + '" data-sec="' + i + '">' +
          (e.conValor === e.total ? '✓' : (i + 1)) + '</button>';
      }).join('') + '</div>';

    const visitaDatos = si === 0 ?
      '<div class="visita-datos">' +
      '<div class="field"><label>Fecha de la evaluación</label>' +
      '<input class="input" type="date" id="evFecha" value="' + fecha + '"></div>' +
      '<div class="field"><label>Evaluador</label>' +
      '<input class="input" type="text" id="evEvaluador" value="' + escaparHTML(evaluador) + '" placeholder="Nombre de quien evalúa"></div>' +
      '</div>' : '';

    const notasHTML = si === secs.length - 1 ?
      '<div class="field" style="margin-top:22px"><label>Notas de la consulta (opcional)</label>' +
      '<textarea class="input" id="evNotas" rows="3" placeholder="Observaciones, incidencias, plan…">' +
      escaparHTML(notas) + '</textarea></div>' : '';

    cont.innerHTML = '<div class="captura">' + rail +
      '<div class="captura-main">' + pasosMovil +
      '<div class="solo-ancho"><span class="tag tag-neutral">Sección ' + (si + 1) + ' de ' + secs.length + '</span></div>' +
      '<h2 style="margin:12px 0 14px;font-size:26px">' + sec.titulo + '</h2>' +
      visitaDatos +
      '<div class="tecnica"><div class="card-kicker" style="margin-bottom:4px">Técnica</div>' +
      '<div class="cuerpo"><ul>' + sec.instrucciones.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>' +
      (sec.tipoSeccion === 'cronometro' || sec.tipoSeccion === 'cronometro30' ? _cronoHTML(sec.tipoSeccion) : '') +
      '<div class="campos-grid">' + sec.campos.map(c => _campoHTML(c, valores[c.id])).join('') + '</div>' +
      '<div class="zona-autos">' + _cintaHTML(sec, valores) + '</div>' +
      notasHTML +
      '<div class="pie-captura">' +
      (si > 0 ? '<button class="btn btn-secondary btn-grande" id="btnAnt">← Anterior</button>' : '') +
      '<div style="flex:1"></div>' +
      (si < secs.length - 1 ?
        '<button class="btn btn-primary btn-grande" id="btnSig">Siguiente sección →</button>' :
        '<button class="btn btn-primary btn-grande" id="btnGuardarEv">Guardar evaluación</button>') +
      '</div></div></div>';

    /* estilos móviles: el encabezado del asistente vive dentro de captura-main */
    instalarIr(cont);

    cont.querySelectorAll('[data-sec]').forEach(el =>
      el.addEventListener('click', () => { si = parseInt(el.dataset.sec); pintar(); }));

    const fEl = cont.querySelector('#evFecha');
    if (fEl) fEl.addEventListener('change', () => { fecha = fEl.value || hoyISO(); });
    const eEl = cont.querySelector('#evEvaluador');
    if (eEl) eEl.addEventListener('input', () => { evaluador = eEl.value; });
    const nEl = cont.querySelector('#evNotas');
    if (nEl) nEl.addEventListener('input', () => { notas = nEl.value; });

    const refrescar = () => {
      cont.querySelector('.zona-autos').innerHTML = _cintaHTML(sec, valores);
      const e = _seccionCompleta(sec, valores);
      for (const el of cont.querySelectorAll('[data-sec="' + si + '"]')) {
        const num = el.classList.contains('paso-num') ? el : el.querySelector('.rail-num');
        if (!num) continue;
        num.classList.toggle('lista', e.conValor === e.total);
        num.textContent = e.conValor === e.total ? '✓' : (si + 1);
      }
    };

    for (const c of sec.campos) {
      const caja = cont.querySelector('[data-campo="' + c.id + '"]');
      if (!caja) continue;
      if (c.tipo === 'num') {
        const inp = caja.querySelector('input');
        inp.addEventListener('input', () => {
          const t = inp.value.replace(',', '.');
          valores[c.id] = t === '' ? undefined : t;
          refrescar();
        });
        caja.querySelectorAll('.paso').forEach(bt => {
          bt.addEventListener('click', () => {
            const paso = _pasoBoton(c) * parseInt(bt.dataset.dir);
            const actual = parseFloat(String(valores[c.id] || '').replace(',', '.'));
            let nuevo = (isNaN(actual) ? 0 : actual) + paso;
            nuevo = Math.round(nuevo * 10) / 10;
            if (c.min !== undefined && nuevo < c.min && !c.neg) nuevo = c.min;
            valores[c.id] = String(nuevo);
            inp.value = nuevo;
            refrescar();
          });
        });
      } else if (c.tipo === 'ops' || c.tipo === 'sino') {
        caja.querySelectorAll('.op').forEach(bt => {
          bt.addEventListener('click', () => {
            const ya = bt.classList.contains('activa');
            caja.querySelectorAll('.op').forEach(x => x.classList.remove('activa'));
            if (ya) { delete valores[c.id]; }
            else { bt.classList.add('activa'); valores[c.id] = bt.dataset.v; }
            refrescar();
          });
        });
      } else if (c.tipo === 'sel') {
        caja.querySelector('select').addEventListener('change', ev => {
          valores[c.id] = ev.target.value || undefined;
          refrescar();
        });
      }
    }

    if (sec.tipoSeccion === 'cronometro' || sec.tipoSeccion === 'cronometro30') {
      _instalarCrono(cont, sec, seg => {
        const destino = sec.campos.find(c => c.crono && !valores[c.id]);
        if (!destino) return;
        valores[destino.id] = String(seg);
        const inp = cont.querySelector('[data-campo="' + destino.id + '"] input');
        if (inp) inp.value = seg;
        refrescar();
      });
    }

    const ant = cont.querySelector('#btnAnt');
    if (ant) ant.addEventListener('click', () => { si = Math.max(si - 1, 0); pintar(); });
    const sig = cont.querySelector('#btnSig');
    if (sig) sig.addEventListener('click', () => { si = Math.min(si + 1, secs.length - 1); pintar(); });

    const guardar = cont.querySelector('#btnGuardarEv');
    if (guardar) guardar.addEventListener('click', async () => {
      const conAlgo = Object.keys(valores).some(k =>
        valores[k] !== undefined && valores[k] !== '');
      if (!conAlgo) { alert('La evaluación está vacía: capture al menos una medición.'); return; }
      if (evaluador.trim()) DB.conf('evaluador', evaluador.trim());
      const obj = {
        id: existente ? existente.id : DB.uuid(),
        episodioId: eid,
        plantillaId,
        fecha: fecha || hoyISO(),
        evaluador: evaluador.trim(),
        notas: notas.trim(),
        valores: Object.fromEntries(Object.entries(valores)
          .filter(([, v]) => v !== undefined && v !== '')),
        guardado: new Date().toISOString()
      };
      await DB.guardar('evaluaciones', obj);
      const s = semanasDesde(episodio.fechaCirugia, obj.fecha);
      const dlg = document.createElement('div');
      dlg.className = 'dialog-backdrop';
      dlg.innerHTML = '<div class="dialog">' +
        '<div class="card-kicker">' + DB.APP + ' · Guardado en este dispositivo</div>' +
        '<div class="dialog-title">Evaluación guardada</div>' +
        '<div class="dialog-body">La evaluación de ' + escaparHTML(paciente.nombre) +
        ' quedó registrada como visita del ' + fmtFecha(obj.fecha) +
        (s !== null && s >= 0 ? ' (sem ' + s + ' PO)' : '') +
        '. Puede exportarla a COREGDL desde su ficha.</div>' +
        '<div class="dialog-actions">' +
        '<button class="btn btn-secondary" id="dlgSeguir">Seguir editando</button>' +
        '<button class="btn btn-primary" id="dlgIr">Ir al registro</button></div></div>';
      document.body.appendChild(dlg);
      dlg.querySelector('#dlgSeguir').addEventListener('click', () => {
        dlg.remove();
        if (!existente) irA('#/capturar/' + pid + '/' + eid + '/' + plantillaId + '/' + obj.id);
      });
      dlg.querySelector('#dlgIr').addEventListener('click', () => {
        dlg.remove();
        irA('#/evaluacion/' + pid + '/' + eid + '/' + obj.id);
      });
    });
  }

  pintar();
}

/* ================= Vista de una evaluación guardada ================= */

function _etiquetaOpcion(campo, v) {
  if (campo.tipo === 'sino') return v === 'si' ? 'Sí' : 'No';
  if (campo.tipo === 'ops') {
    const o = campo.ops.find(o => String(o.v) === String(v));
    return o ? o.et : v;
  }
  return v;
}

function _filasSeccion(s, valores) {
  let filas = '';
  for (const c of s.campos) {
    const v = valores[c.id];
    if (v === undefined || v === null || v === '') continue;
    const val = c.tipo === 'num' ? v + ' ' + c.unidad : _etiquetaOpcion(c, v);
    filas += '<tr><td>' + c.et + '</td><td>' + val + '</td></tr>';
  }
  for (const a of calcularAutos(s, valores)) {
    if (a.num === null) continue;
    filas += '<tr><td>⚡ ' + a.et + '</td><td><span class="tag ' + _tagAuto(a) + '">' +
      formatoAuto(a) + '</span></td></tr>';
  }
  return filas;
}

async function vistaEvaluacion(cont, pid, eid, evalId) {
  activarNav('pacientes');
  const [paciente, episodio, ev] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid),
    DB.obtener('evaluaciones', evalId)
  ]);
  if (!ev) { irA(hashPerfil(pid, eid)); return; }
  const plantilla = PLANTILLAS[ev.plantillaId];
  const semanas = semanasDesde(episodio.fechaCirugia, ev.fecha);

  let cuerpo = '';
  for (const s of plantilla.secciones) {
    const filas = _filasSeccion(s, ev.valores);
    if (!filas) continue;
    cuerpo += '<tr class="grupo"><td colspan="2">' + s.titulo + '</td></tr>' + filas;
  }

  /* Razón isquiotibiales/cuádriceps en LCA (si existen ambos mejores) */
  if (ev.plantillaId === 'lca') {
    const q = Math.max(...['cuadriceps_f1', 'cuadriceps_f2', 'cuadriceps_f3']
      .map(k => parseFloat(ev.valores[k])).filter(n => !isNaN(n)), 0);
    const i = Math.max(...['isquios_f1', 'isquios_f2', 'isquios_f3']
      .map(k => parseFloat(ev.valores[k])).filter(n => !isNaN(n)), 0);
    if (q > 0 && i > 0) {
      cuerpo += '<tr class="grupo"><td colspan="2">Razón isquiotibiales / cuádriceps</td></tr>' +
        '<tr><td>⚡ I/C lado operado</td><td>' + Math.round(i / q * 100) + ' %</td></tr>';
    }
  }

  cont.innerHTML = '<div class="pagina" style="max-width:760px">' +
    atrasHTML(hashPerfil(pid, eid), paciente.nombre) +
    '<div class="card-kicker" style="margin-top:14px">' + (plantilla.kicker || 'Evaluación') + '</div>' +
    '<h3 style="margin:4px 0 10px">' + plantilla.nombre + '</h3>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
    '<span class="tag tag-neutral">' + fmtFecha(ev.fecha) + '</span>' +
    (semanas !== null && semanas >= 0 ? '<span class="tag tag-neutral">Semana ' + semanas + '</span>' : '') +
    (episodio.lado ? '<span class="tag tag-neutral">' + episodio.lado + '</span>' : '') +
    (ev.evaluador ? '<span class="tag tag-neutral">' + escaparHTML(ev.evaluador) + '</span>' : '') +
    '</div>' +
    '<table class="table" style="margin-top:8px">' + cuerpo + '</table>' +
    (ev.notas ? '<div class="card" style="margin-top:14px"><div class="card-kicker">Notas</div>' +
      escaparHTML(ev.notas) + '</div>' : '') +
    '<button class="btn btn-primary btn-block btn-grande" id="btnCopiar" style="margin-top:18px">Copiar resumen para el expediente</button>' +
    '<button class="btn btn-secondary btn-block" id="btnEditar">Editar esta evaluación</button>' +
    '<button class="btn btn-peligro btn-block" id="btnBorrar">Eliminar evaluación</button>' +
    '</div>';

  instalarIr(cont);
  cont.querySelector('#btnEditar').addEventListener('click', () =>
    irA('#/capturar/' + pid + '/' + eid + '/' + ev.plantillaId + '/' + ev.id));
  cont.querySelector('#btnBorrar').addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta evaluación? Esta acción no se puede deshacer.')) return;
    await DB.borrar('evaluaciones', ev.id);
    irA(hashPerfil(pid, eid));
  });
  cont.querySelector('#btnCopiar').addEventListener('click', async (e) => {
    const texto = resumenEvaluacion(paciente, episodio, ev, plantilla, semanas);
    try {
      await navigator.clipboard.writeText(texto);
      e.target.textContent = '✓ Copiado';
      setTimeout(() => e.target.textContent = 'Copiar resumen para el expediente', 1800);
    } catch (_) {
      prompt('Copie el texto:', texto);
    }
  });
}

function resumenEvaluacion(paciente, episodio, ev, plantilla, semanas) {
  const L = [];
  L.push(plantilla.titulo);
  L.push('Paciente: ' + paciente.nombre + ' · Fecha: ' + fmtFecha(ev.fecha) +
    (semanas !== null ? ' · Semana postoperatoria: ' + semanas : '') +
    (episodio.lado ? ' · Lado: ' + episodio.lado : ''));
  if (ev.evaluador) L.push('Evaluador: ' + ev.evaluador);
  for (const s of plantilla.secciones) {
    const partes = [];
    for (const c of s.campos) {
      const v = ev.valores[c.id];
      if (v === undefined || v === '') continue;
      partes.push(c.et + ': ' + (c.tipo === 'num' ? v + ' ' + c.unidad : _etiquetaOpcion(c, v)));
    }
    for (const a of calcularAutos(s, ev.valores)) {
      if (a.num !== null) partes.push(a.et + ': ' + formatoAuto(a));
    }
    if (partes.length) L.push('· ' + s.titulo.toUpperCase() + ' — ' + partes.join(' · '));
  }
  if (ev.notas) L.push('Notas: ' + ev.notas);
  L.push('(Registrado con ' + DB.APP + ')');
  return L.join('\n');
}
