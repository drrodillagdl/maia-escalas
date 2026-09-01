/* CORE Scale — captura y consulta de evaluaciones (las 4 plantillas).
   La captura es un acordeón: una tarjeta por sección de la hoja impresa, cada
   una con su recuadro "Cómo se hace" y sus cálculos automáticos en vivo.     */

function _pasoBoton(campo) {
  if (campo.unidad === '°') return 5;
  if (campo.unidad === 'rep') return 1;
  return 0.5;
}

function _campoHTML(campo, valor) {
  const v = valor === undefined || valor === null ? '' : valor;
  if (campo.tipo === 'num') {
    return '<div class="campo" data-campo="' + campo.id + '">' +
      '<label>' + campo.et + (campo.crono ? ' <span style="font-weight:400;color:var(--tinta-3)">(puede usar el cronómetro)</span>' : '') + '</label>' +
      '<div class="campo-num">' +
      '<button type="button" class="mas-menos" data-dir="-1">−</button>' +
      '<input type="text" inputmode="decimal" autocomplete="off" value="' + v + '" placeholder="—">' +
      '<button type="button" class="mas-menos" data-dir="1">+</button>' +
      '<span class="unidad">' + campo.unidad + '</span>' +
      '</div></div>';
  }
  if (campo.tipo === 'ops' || campo.tipo === 'sino') {
    const ops = campo.tipo === 'sino'
      ? [{ v: 'si', et: 'Sí' }, { v: 'no', et: 'No' }] : campo.ops;
    return '<div class="campo" data-campo="' + campo.id + '"><label>' + campo.et + '</label>' +
      '<div class="opciones">' + ops.map(o =>
        '<button type="button" class="op' + (String(v) === String(o.v) ? ' activa' : '') +
        '" data-v="' + o.v + '">' + o.et + '</button>').join('') +
      '</div></div>';
  }
  if (campo.tipo === 'sel') {
    return '<div class="campo" data-campo="' + campo.id + '"><label>' + campo.et + '</label>' +
      '<select><option value="">—</option>' + campo.ops.map(o =>
        '<option' + (v === o ? ' selected' : '') + '>' + o + '</option>').join('') +
      '</select></div>';
  }
  return '';
}

function _autosHTML(seccion, valores) {
  const autos = calcularAutos(seccion, valores);
  if (!autos.length) return '';
  return '<div class="autos">' + autos.map(a => {
    const clase = claseLSI(a);
    return '<div class="auto-fila"><span class="et">⚡ ' + a.et + '</span>' +
      '<span class="valor ' + clase + '">' + formatoAuto(a) + '</span></div>' +
      (a.nota && a.num !== null ? '<p class="auto-nota">' + a.nota + '</p>' : '');
  }).join('') + '</div>';
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
    '<span class="tiempo">' + et + '<small style="font-size:16px;color:var(--tinta-2)"> seg</small></span>' +
    '<button type="button" class="ir">▶ Iniciar</button></div>';
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
    lbl.innerHTML = val.toFixed(1) + '<small style="font-size:16px;color:var(--tinta-2)"> seg</small>';
    if (esCuenta && val <= 0) {
      clearInterval(timer); timer = null;
      lbl.innerHTML = '<span style="color:var(--malo)">¡Tiempo! Anote las repeticiones.</span>';
      btn.textContent = '▶ Reiniciar'; btn.classList.remove('parar');
      if (navigator.vibrate) navigator.vibrate(400);
    }
  };
  btn.addEventListener('click', () => {
    if (timer) {                       // detener (solo cronómetro ascendente)
      clearInterval(timer); timer = null;
      const seg = Math.round((Date.now() - t0) / 100) / 10;
      btn.textContent = '▶ Iniciar'; btn.classList.remove('parar');
      if (!esCuenta) alTerminar(seg);
      pintar();
    } else {                           // iniciar
      t0 = Date.now();
      timer = setInterval(pintar, 100);
      btn.textContent = esCuenta ? '⏹ Cancelar' : '⏹ Detener y guardar';
      btn.classList.add('parar');
    }
  });
}

/* ================= Captura / edición ================= */
async function vistaFormEvaluacion(cont, pid, eid, plantillaId, evalId) {
  const [paciente, episodio] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid)
  ]);
  const existente = evalId ? await DB.obtener('evaluaciones', evalId) : null;
  const plantilla = PLANTILLAS[plantillaId];
  const valores = existente ? { ...existente.valores } : {};
  const evaluadorDefault = existente ? existente.evaluador : (await DB.conf('evaluador') || '');
  const fecha = existente ? existente.fecha : hoyISO();

  barra(plantilla.nombre, paciente.nombre, '#/episodio/' + pid + '/' + eid);

  let htmlSecs = '';
  plantilla.secciones.forEach((s, i) => {
    const est = _seccionCompleta(s, valores);
    htmlSecs +=
      '<div class="sec-eval' + (i === 0 ? ' abierta' : '') + '" data-sec="' + i + '">' +
      '<button type="button" class="cabeza">' +
      '<span class="num' + (est.conValor === est.total ? ' lleno' : '') + '">' +
      (est.conValor === est.total ? '✓' : (i + 1)) + '</span>' +
      '<h3>' + s.titulo + '</h3><span class="flecha">›</span></button>' +
      '<div class="contenido">' +
      '<details class="como"' + '><summary>Cómo se hace</summary><ul>' +
      s.instrucciones.map(x => '<li>' + x + '</li>').join('') + '</ul></details>' +
      (s.tipoSeccion === 'cronometro' || s.tipoSeccion === 'cronometro30' ? _cronoHTML(s.tipoSeccion) : '') +
      '<div class="dos-columnas">' +
      s.campos.map(c => _campoHTML(c, valores[c.id])).join('') +
      '</div><div class="zona-autos">' + _autosHTML(s, valores) + '</div>' +
      '</div></div>';
  });

  cont.innerHTML =
    '<div class="tarjeta">' +
    '<div class="dos-columnas">' +
    '<div class="campo"><label>Fecha de la evaluación</label>' +
    '<input type="date" id="evFecha" value="' + fecha + '"></div>' +
    '<div class="campo"><label>Evaluador</label>' +
    '<input type="text" id="evEvaluador" value="' + escaparHTML(evaluadorDefault) + '" placeholder="Nombre de quien evalúa"></div>' +
    '</div>' +
    '<div id="evSemanas" class="chip"></div>' +
    ' <span class="chip">' + (episodio.lado ? 'Lado: ' + episodio.lado : '') + '</span>' +
    '</div>' +
    htmlSecs +
    '<div class="campo tarjeta"><label>Notas de la consulta (opcional)</label>' +
    '<textarea id="evNotas" rows="3" placeholder="Observaciones, incidencias, plan…">' +
    escaparHTML(existente && existente.notas || '') + '</textarea></div>' +
    '<button class="btn" id="btnGuardarEv">Guardar evaluación</button>';

  const pintaSemanas = () => {
    const f = cont.querySelector('#evFecha').value;
    const s = semanasDesde(episodio.fechaCirugia, f);
    cont.querySelector('#evSemanas').textContent =
      s === null ? 'Sin fecha de cirugía' : 'Semana postoperatoria: ' + s;
  };
  pintaSemanas();
  cont.querySelector('#evFecha').addEventListener('change', pintaSemanas);

  /* acordeón + campos */
  plantilla.secciones.forEach((s, i) => {
    const sec = cont.querySelector('[data-sec="' + i + '"]');

    sec.querySelector('.cabeza').addEventListener('click', () => {
      sec.classList.toggle('abierta');
    });

    const refrescar = () => {
      sec.querySelector('.zona-autos').innerHTML = _autosHTML(s, valores);
      const est = _seccionCompleta(s, valores);
      const num = sec.querySelector('.num');
      num.classList.toggle('lleno', est.conValor === est.total);
      num.textContent = est.conValor === est.total ? '✓' : (i + 1);
    };

    for (const c of s.campos) {
      const caja = sec.querySelector('[data-campo="' + c.id + '"]');
      if (!caja) continue;
      if (c.tipo === 'num') {
        const inp = caja.querySelector('input');
        inp.addEventListener('input', () => {
          const t = inp.value.replace(',', '.');
          valores[c.id] = t === '' ? undefined : t;
          refrescar();
        });
        caja.querySelectorAll('.mas-menos').forEach(b => {
          b.addEventListener('click', () => {
            const paso = _pasoBoton(c) * parseInt(b.dataset.dir);
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
        caja.querySelectorAll('.op').forEach(b => {
          b.addEventListener('click', () => {
            const ya = b.classList.contains('activa');
            caja.querySelectorAll('.op').forEach(x => x.classList.remove('activa'));
            if (ya) { delete valores[c.id]; }
            else { b.classList.add('activa'); valores[c.id] = b.dataset.v; }
            refrescar();
          });
        });
      } else if (c.tipo === 'sel') {
        caja.querySelector('select').addEventListener('change', e => {
          valores[c.id] = e.target.value || undefined;
          refrescar();
        });
      }
    }

    /* cronómetro: al detener llena el primer campo de tiempo vacío */
    if (s.tipoSeccion === 'cronometro' || s.tipoSeccion === 'cronometro30') {
      _instalarCrono(sec, s, seg => {
        const destino = s.campos.find(c => c.crono && !valores[c.id]);
        if (!destino) return;
        valores[destino.id] = String(seg);
        const inp = sec.querySelector('[data-campo="' + destino.id + '"] input');
        if (inp) inp.value = seg;
        refrescar();
      });
    }
  });

  cont.querySelector('#btnGuardarEv').addEventListener('click', async () => {
    const conAlgo = Object.keys(valores).some(k =>
      valores[k] !== undefined && valores[k] !== '');
    if (!conAlgo) { alert('La evaluación está vacía: capture al menos una medición.'); return; }
    const evaluador = cont.querySelector('#evEvaluador').value.trim();
    if (evaluador) DB.conf('evaluador', evaluador);
    const obj = {
      id: existente ? existente.id : DB.uuid(),
      episodioId: eid,
      plantillaId,
      fecha: cont.querySelector('#evFecha').value || hoyISO(),
      evaluador,
      notas: cont.querySelector('#evNotas').value.trim(),
      valores: Object.fromEntries(Object.entries(valores)
        .filter(([, v]) => v !== undefined && v !== '')),
      guardado: new Date().toISOString()
    };
    await DB.guardar('evaluaciones', obj);
    location.hash = '#/evaluacion/' + pid + '/' + eid + '/' + obj.id;
  });
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
    const clase = claseLSI(a);
    filas += '<tr><td>⚡ ' + a.et + '</td><td><span class="chip ' + clase + '">' +
      formatoAuto(a) + '</span></td></tr>';
  }
  return filas;
}

async function vistaEvaluacion(cont, pid, eid, evalId) {
  const [paciente, episodio, ev] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid),
    DB.obtener('evaluaciones', evalId)
  ]);
  if (!ev) { location.hash = '#/episodio/' + pid + '/' + eid; return; }
  const plantilla = PLANTILLAS[ev.plantillaId];
  const semanas = semanasDesde(episodio.fechaCirugia, ev.fecha);

  barra(plantilla.nombre, paciente.nombre + ' · ' + fmtFecha(ev.fecha),
    '#/episodio/' + pid + '/' + eid);

  let cuerpo = '';
  for (const s of plantilla.secciones) {
    const filas = _filasSeccion(s, ev.valores);
    if (!filas) continue;
    cuerpo += '<tr class="sub"><td colspan="2">' + s.titulo + '</td></tr>' + filas;
  }

  /* Razón isquiotibiales/cuádriceps en LCA (si existen ambos mejores) */
  if (ev.plantillaId === 'lca') {
    const q = Math.max(...['cuadriceps_f1', 'cuadriceps_f2', 'cuadriceps_f3']
      .map(k => parseFloat(ev.valores[k])).filter(n => !isNaN(n)), 0);
    const i = Math.max(...['isquios_f1', 'isquios_f2', 'isquios_f3']
      .map(k => parseFloat(ev.valores[k])).filter(n => !isNaN(n)), 0);
    if (q > 0 && i > 0) {
      cuerpo += '<tr class="sub"><td colspan="2">Razón isquiotibiales / cuádriceps</td></tr>' +
        '<tr><td>⚡ I/C lado operado</td><td>' + Math.round(i / q * 100) + ' %</td></tr>';
    }
  }

  cont.innerHTML =
    '<div class="tarjeta">' +
    '<span class="chip">' + fmtFecha(ev.fecha) + '</span>' +
    (semanas !== null ? '<span class="chip">Semana ' + semanas + '</span>' : '') +
    (episodio.lado ? '<span class="chip">' + episodio.lado + '</span>' : '') +
    (ev.evaluador ? '<span class="chip">' + escaparHTML(ev.evaluador) + '</span>' : '') +
    '</div>' +
    '<div class="tarjeta"><table class="tabla-resumen">' + cuerpo + '</table></div>' +
    (ev.notas ? '<div class="tarjeta"><b>Notas</b><br>' + escaparHTML(ev.notas) + '</div>' : '') +
    '<button class="btn" id="btnCopiar">📋 Copiar resumen para el expediente</button>' +
    '<button class="btn secundario" id="btnEditar">✏️ Editar esta evaluación</button>' +
    '<button class="btn peligro" id="btnBorrar">Eliminar evaluación</button>';

  cont.querySelector('#btnEditar').addEventListener('click', () =>
    location.hash = '#/capturar/' + pid + '/' + eid + '/' + ev.plantillaId + '/' + ev.id);

  cont.querySelector('#btnBorrar').addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta evaluación? Esta acción no se puede deshacer.')) return;
    await DB.borrar('evaluaciones', ev.id);
    location.hash = '#/episodio/' + pid + '/' + eid;
  });

  cont.querySelector('#btnCopiar').addEventListener('click', async (e) => {
    const texto = resumenEvaluacion(paciente, episodio, ev, plantilla, semanas);
    try {
      await navigator.clipboard.writeText(texto);
      e.target.textContent = '✓ Copiado';
      setTimeout(() => e.target.textContent = '📋 Copiar resumen para el expediente', 1800);
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
  L.push('(Registrado con CORE Scale)');
  return L.join('\n');
}
