/* CORE Scale — aplicación guiada de escalas funcionales.
   Flujo: elegir escala → pantalla de introducción (qué es y cómo aplicarla)
   → una pregunta a la vez con barra de progreso → resultado automático.      */

async function vistaElegirEscala(cont, pid, eid) {
  const [paciente, episodio] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid)
  ]);
  barra('Escalas funcionales', paciente.nombre, '#/episodio/' + pid + '/' + eid);

  const { sugeridas, resto } = escalasParaEpisodio(episodio.tipo);
  const fila = (e) =>
    '<button class="fila-lista" data-escala="' + e.id + '">' +
    '<div class="cuerpo"><div class="principal">' + e.nombre + '</div>' +
    '<div class="secundario">' + e.descripcion + '</div>' +
    '<div style="margin-top:6px"><span class="chip">' + e.tiempo + '</span>' +
    '<span class="chip">' + (e.quien === 'paciente' ? 'La contesta el paciente' : 'La aplica el médico') + '</span></div>' +
    '</div><span class="extremo">›</span></button>';

  cont.innerHTML =
    '<p class="seccion-titulo">Sugeridas para ' + (PLANTILLAS[episodio.tipo] ? PLANTILLAS[episodio.tipo].nombre.toLowerCase() : 'este caso') + '</p>' +
    sugeridas.map(fila).join('') +
    (resto.length ? '<p class="seccion-titulo">Otras escalas</p>' + resto.map(fila).join('') : '');

  cont.querySelectorAll('[data-escala]').forEach(b =>
    b.addEventListener('click', () =>
      location.hash = '#/escala/' + pid + '/' + eid + '/' + b.dataset.escala));
}

/* Valor puntuable de la respuesta i (índice de opción o número elegido). */
function _valorRespuesta(preg, r) {
  if (r === null || r === undefined) return null;
  if (preg.tipo === 'numerica') return preg.invertir ? preg.max - r : r;
  return preg.ops[r].v;
}

async function vistaAplicarEscala(cont, pid, eid, escalaId) {
  const [paciente, episodio] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid)
  ]);
  const esc = escalaPorId(escalaId);
  if (!esc) { location.hash = '#/escalas/' + pid + '/' + eid; return; }
  barra(esc.corto, paciente.nombre, '#/escalas/' + pid + '/' + eid);

  const n = esc.preguntas.length;
  const indices = new Array(n).fill(undefined);   // índice de opción o número elegido
  let paso = -1;                                  // -1 = introducción

  function pintar() {
    if (paso === -1) {
      cont.innerHTML =
        '<div class="tarjeta"><h2 style="margin:4px 0 8px">' + esc.nombre + '</h2>' +
        '<p style="color:var(--tinta-2);margin:0 0 10px">' + esc.descripcion + '</p>' +
        '<span class="chip">' + n + (n === 1 ? ' pregunta' : ' preguntas') + '</span>' +
        '<span class="chip">' + esc.tiempo + '</span>' +
        '<span class="chip">' + (esc.quien === 'paciente' ? 'La contesta el paciente' : 'La aplica el médico') + '</span>' +
        '</div>' +
        '<div class="tarjeta"><b>Cómo aplicarla</b><ul style="margin:8px 0 0;padding-left:20px">' +
        esc.instrucciones.map(x => '<li style="margin-bottom:6px">' + x + '</li>').join('') + '</ul></div>' +
        (esc.nota ? '<div class="aviso">' + esc.nota + '</div>' : '') +
        '<button class="btn" id="btnEmpezar">Comenzar</button>';
      cont.querySelector('#btnEmpezar').addEventListener('click', () => { paso = 0; pintar(); });
      return;
    }

    if (paso >= n) { pintarResultado(); return; }

    const p = esc.preguntas[paso];
    const pct = Math.round(paso / n * 100);
    let cuerpoPregunta;

    if (p.tipo === 'numerica') {
      const rango = p.max - p.min;
      const pasoNum = p.paso || 1;
      if (rango / pasoNum <= 10) {
        let botones = '';
        for (let v = p.min; v <= p.max; v += pasoNum) {
          botones += '<button type="button" class="op' +
            (indices[paso] === v ? ' activa' : '') + '" data-num="' + v +
            '" style="min-width:52px;font-size:19px;font-weight:700">' + v + '</button>';
        }
        cuerpoPregunta = '<div class="opciones">' + botones + '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--tinta-2);margin-top:8px">' +
          '<span>' + (p.etMin || p.min) + '</span><span>' + (p.etMax || p.max) + '</span></div>';
      } else {
        const val = indices[paso] !== undefined ? indices[paso] : Math.round((p.min + p.max) / 2);
        cuerpoPregunta =
          '<div class="resultado-grande" style="padding:8px"><div class="numero" id="valSlider" style="font-size:46px">' +
          (indices[paso] !== undefined ? indices[paso] : '—') + '</div></div>' +
          '<input type="range" id="slider" min="' + p.min + '" max="' + p.max +
          '" step="' + pasoNum + '" value="' + val + '" style="width:100%">' +
          '<div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--tinta-2);margin-top:6px">' +
          '<span>' + (p.etMin || p.min) + '</span><span>' + (p.etMax || p.max) + '</span></div>' +
          '<button class="btn" id="btnSigNum"' + (indices[paso] === undefined ? ' disabled style="opacity:.5"' : '') + '>Continuar</button>';
      }
    } else {
      cuerpoPregunta = p.ops.map((o, i) =>
        '<button type="button" class="op-escala' + (indices[paso] === i ? ' activa' : '') +
        '" data-op="' + i + '">' + o.et + '</button>').join('');
    }

    cont.innerHTML =
      '<div class="progreso"><div style="width:' + pct + '%"></div></div>' +
      '<p class="pregunta-num">Pregunta ' + (paso + 1) + ' de ' + n + '</p>' +
      '<p class="pregunta-texto">' + p.texto + '</p>' +
      cuerpoPregunta +
      '<div style="display:flex;gap:10px;margin-top:16px">' +
      (paso > 0 || true ? '<button class="btn secundario" style="margin:0" id="btnAnt">‹ Anterior</button>' : '') +
      (esc.permitirOmitir ? '<button class="btn secundario" style="margin:0" id="btnOmitir">Omitir</button>' : '') +
      '</div>';

    cont.querySelector('#btnAnt').addEventListener('click', () => {
      if (paso === 0) { paso = -1; } else { paso--; }
      pintar();
    });
    const omitir = cont.querySelector('#btnOmitir');
    if (omitir) omitir.addEventListener('click', () => { indices[paso] = null; paso++; pintar(); });

    cont.querySelectorAll('[data-op]').forEach(b =>
      b.addEventListener('click', () => {
        indices[paso] = parseInt(b.dataset.op);
        b.classList.add('activa');
        setTimeout(() => { paso++; pintar(); }, 220);
      }));
    cont.querySelectorAll('[data-num]').forEach(b =>
      b.addEventListener('click', () => {
        indices[paso] = parseFloat(b.dataset.num);
        b.classList.add('activa');
        setTimeout(() => { paso++; pintar(); }, 220);
      }));
    const slider = cont.querySelector('#slider');
    if (slider) {
      slider.addEventListener('input', () => {
        indices[paso] = parseFloat(slider.value);
        cont.querySelector('#valSlider').textContent = slider.value;
        const btn = cont.querySelector('#btnSigNum');
        btn.disabled = false; btn.style.opacity = '';
      });
      cont.querySelector('#btnSigNum').addEventListener('click', () => {
        if (indices[paso] === undefined) return;
        paso++; pintar();
      });
    }
  }

  function pintarResultado() {
    const valores = esc.preguntas.map((p, i) =>
      _valorRespuesta(p, indices[i] === undefined ? null : indices[i]));
    const res = esc.calcular(valores);

    if (res.incompleta) {
      cont.innerHTML =
        '<div class="tarjeta"><div class="vacio"><div class="icono">✋</div>' +
        'No se puede calcular todavía.<br>' + res.texto + '</div></div>' +
        '<button class="btn secundario" id="btnVolverP">‹ Revisar respuestas</button>';
      cont.querySelector('#btnVolverP').addEventListener('click', () => { paso = 0; pintar(); });
      return;
    }

    cont.innerHTML =
      '<div class="tarjeta resultado-grande">' +
      '<div class="numero" style="color:var(--acento)">' + res.puntos + '</div>' +
      '<div class="de">de ' + res.maximo + ' · ' + esc.corto + '</div>' +
      (res.interpretacion ? '<div class="interpretacion">' + res.interpretacion + '</div>' : '') +
      (res.detalle ? '<div class="de" style="margin-top:8px">' + res.detalle + '</div>' : '') +
      '<div class="de" style="margin-top:8px">' + (res.texto || '') + '</div>' +
      '</div>' +
      '<button class="btn" id="btnGuardarEsc">Guardar resultado</button>' +
      '<button class="btn secundario" id="btnRevisar">‹ Revisar respuestas</button>';

    cont.querySelector('#btnRevisar').addEventListener('click', () => { paso = 0; pintar(); });
    cont.querySelector('#btnGuardarEsc').addEventListener('click', async () => {
      const obj = {
        id: DB.uuid(), episodioId: eid, escalaId: esc.id, fecha: hoyISO(),
        indices: indices.map(x => x === undefined ? null : x),
        puntos: res.puntos, maximo: res.maximo,
        interpretacion: res.interpretacion || '', detalle: res.detalle || '',
        guardado: new Date().toISOString()
      };
      await DB.guardar('escalas', obj);
      location.hash = '#/episodio/' + pid + '/' + eid;
    });
  }

  pintar();
}

/* Resultado de escala ya guardado (consulta y borrado). */
async function vistaResultadoEscala(cont, pid, eid, id) {
  const [paciente, r] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('escalas', id)
  ]);
  if (!r) { location.hash = '#/episodio/' + pid + '/' + eid; return; }
  const esc = escalaPorId(r.escalaId);
  barra(esc ? esc.corto : 'Escala', paciente.nombre + ' · ' + fmtFecha(r.fecha),
    '#/episodio/' + pid + '/' + eid);

  let detalles = '';
  if (esc && r.indices) {
    detalles = '<div class="tarjeta"><table class="tabla-resumen">' +
      esc.preguntas.map((p, i) => {
        const idx = r.indices[i];
        let respuesta = '—';
        if (idx !== null && idx !== undefined)
          respuesta = p.tipo === 'numerica' ? String(idx) : p.ops[idx].et;
        return '<tr><td>' + (i + 1) + '. ' + p.texto + '</td><td>' + respuesta + '</td></tr>';
      }).join('') + '</table></div>';
  }

  cont.innerHTML =
    '<div class="tarjeta resultado-grande">' +
    '<div class="numero" style="color:var(--acento)">' + r.puntos + '</div>' +
    '<div class="de">de ' + r.maximo + ' · ' + (esc ? esc.nombre : r.escalaId) + '</div>' +
    (r.interpretacion ? '<div class="interpretacion">' + r.interpretacion + '</div>' : '') +
    (r.detalle ? '<div class="de" style="margin-top:8px">' + r.detalle + '</div>' : '') +
    '</div>' + detalles +
    '<button class="btn peligro" id="btnBorrarEsc">Eliminar resultado</button>';

  cont.querySelector('#btnBorrarEsc').addEventListener('click', async () => {
    if (!confirm('¿Eliminar este resultado de escala?')) return;
    await DB.borrar('escalas', id);
    location.hash = '#/episodio/' + pid + '/' + eid;
  });
}
