/* MAIA Escalas — aplicación guiada de escalas funcionales, con el estilo
   Modernist del diseño: introducción con kicker, una pregunta a la vez con
   barra de progreso, opciones planas y resultado con número grande.          */

/* La pantalla de elección vive en la vista "Nueva evaluación" (app.js);
   esta ruta queda por compatibilidad. */
async function vistaElegirEscala(cont, pid, eid) {
  irA('#/nueva/' + pid + '/' + eid);
}

/* Valor puntuable de la respuesta i (índice de opción o número elegido). */
function _valorRespuesta(preg, r) {
  if (r === null || r === undefined) return null;
  if (preg.tipo === 'numerica') return preg.invertir ? preg.max - r : r;
  return preg.ops[r].v;
}

async function vistaAplicarEscala(cont, pid, eid, escalaId) {
  activarNav('pacientes');
  const [paciente, episodio] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid)
  ]);
  const esc = escalaPorId(escalaId);
  if (!esc || !paciente || !episodio) { irA('#/nueva/' + pid + '/' + eid); return; }

  const n = esc.preguntas.length;
  const indices = new Array(n).fill(undefined);   // índice de opción o número elegido
  let paso = -1;                                  // -1 = introducción

  const envoltura = (interior) =>
    '<div class="pagina" style="max-width:640px">' + interior + '</div>';

  function pintar() {
    if (paso === -1) {
      cont.innerHTML = envoltura(
        atrasHTML('#/nueva/' + pid + '/' + eid, paciente.nombre) +
        '<div class="card-kicker" style="margin-top:14px">' +
        (esc.quien === 'paciente' ? 'Escala reportada por el paciente' : 'Escala aplicada por el médico') + '</div>' +
        '<h3 style="margin:4px 0 8px">' + esc.nombre + '</h3>' +
        '<p class="text-muted" style="font-size:14px">' + esc.descripcion + '</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px">' +
        '<span class="tag tag-neutral">' + n + (n === 1 ? ' pregunta' : ' preguntas') + '</span>' +
        '<span class="tag tag-neutral">' + esc.tiempo + '</span></div>' +
        '<div class="card" style="margin-top:12px"><div class="card-kicker">Cómo aplicarla</div>' +
        '<ul style="margin:4px 0 0;padding-left:18px;font-size:13.5px;line-height:1.55">' +
        esc.instrucciones.map(x => '<li>' + x + '</li>').join('') + '</ul></div>' +
        (esc.nota ? '<div class="aviso">' + esc.nota + '</div>' : '') +
        '<button class="btn btn-primary btn-block btn-grande" id="btnEmpezar">Comenzar</button>');
      instalarIr(cont);
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
            '" style="min-width:52px;font-family:var(--font-heading);font-weight:800;font-size:19px">' + v + '</button>';
        }
        cuerpoPregunta = '<div class="opciones">' + botones + '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--color-neutral-600);margin-top:8px">' +
          '<span>' + (p.etMin || p.min) + '</span><span>' + (p.etMax || p.max) + '</span></div>';
      } else {
        const val = indices[paso] !== undefined ? indices[paso] : Math.round((p.min + p.max) / 2);
        cuerpoPregunta =
          '<div style="text-align:center;font-family:var(--font-heading);font-weight:800;font-size:46px;color:var(--color-accent-700)" id="valSlider">' +
          (indices[paso] !== undefined ? indices[paso] : '—') + '</div>' +
          '<input type="range" id="slider" min="' + p.min + '" max="' + p.max +
          '" step="' + pasoNum + '" value="' + val + '">' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--color-neutral-600);margin-top:6px">' +
          '<span>' + (p.etMin || p.min) + '</span><span>' + (p.etMax || p.max) + '</span></div>' +
          '<button class="btn btn-primary btn-block btn-grande" id="btnSigNum"' +
          (indices[paso] === undefined ? ' disabled' : '') + '>Continuar</button>';
      }
    } else {
      cuerpoPregunta = p.ops.map((o, i) =>
        '<button type="button" class="op-escala' + (indices[paso] === i ? ' activa' : '') +
        '" data-op="' + i + '">' + o.et + '</button>').join('');
    }

    cont.innerHTML = envoltura(
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<span class="tag tag-accent">' + esc.corto + '</span>' +
      '<span class="text-muted" style="font-size:12px">Pregunta ' + (paso + 1) + ' de ' + n + '</span></div>' +
      '<div class="progreso"><div style="width:' + pct + '%"></div></div>' +
      '<p class="pregunta-texto">' + p.texto + '</p>' +
      cuerpoPregunta +
      '<div style="display:flex;gap:10px;margin-top:16px">' +
      '<button class="btn btn-secondary" id="btnAnt">← Anterior</button>' +
      (esc.permitirOmitir ? '<button class="btn btn-ghost" id="btnOmitir">Omitir pregunta</button>' : '') +
      '</div>');

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
        cont.querySelector('#btnSigNum').disabled = false;
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
      cont.innerHTML = envoltura(
        '<div class="vacio"><div class="icono">✋</div>No se puede calcular todavía.<br>' +
        res.texto + '</div>' +
        '<button class="btn btn-secondary btn-block" id="btnVolverP">← Revisar respuestas</button>');
      cont.querySelector('#btnVolverP').addEventListener('click', () => { paso = 0; pintar(); });
      return;
    }

    cont.innerHTML = envoltura(
      '<div class="card" style="text-align:center;padding:26px 16px;gap:6px">' +
      '<div class="card-kicker">' + esc.corto + ' · Resultado</div>' +
      '<div class="resultado-num">' + res.puntos + '</div>' +
      '<div class="text-muted" style="font-size:14px">de ' + res.maximo + '</div>' +
      (res.interpretacion ? '<div style="font-family:var(--font-heading);font-weight:800;font-size:18px;margin-top:6px">' + res.interpretacion + '</div>' : '') +
      (res.detalle ? '<div class="text-muted" style="font-size:12.5px;margin-top:4px">' + res.detalle + '</div>' : '') +
      '<div class="text-muted" style="font-size:12.5px;margin-top:4px">' + (res.texto || '') + '</div>' +
      '</div>' +
      '<button class="btn btn-primary btn-block btn-grande" id="btnGuardarEsc">Guardar resultado</button>' +
      '<button class="btn btn-secondary btn-block" id="btnRevisar">← Revisar respuestas</button>');

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
      irA(hashPerfil(pid, eid));
    });
  }

  pintar();
}

/* Resultado de escala ya guardado (consulta y borrado). */
async function vistaResultadoEscala(cont, pid, eid, id) {
  activarNav('pacientes');
  const [paciente, r] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('escalas', id)
  ]);
  if (!r) { irA(hashPerfil(pid, eid)); return; }
  const esc = escalaPorId(r.escalaId);

  let detalles = '';
  if (esc && r.indices) {
    detalles = '<table class="table" style="margin-top:14px">' +
      esc.preguntas.map((p, i) => {
        const idx = r.indices[i];
        let respuesta = '—';
        if (idx !== null && idx !== undefined)
          respuesta = p.tipo === 'numerica' ? String(idx) : p.ops[idx].et;
        return '<tr><td style="width:30px" class="text-muted">' + (i + 1) + '</td>' +
          '<td>' + p.texto + '</td><td style="font-weight:600;white-space:nowrap">' + respuesta + '</td></tr>';
      }).join('') + '</table>';
  }

  cont.innerHTML = '<div class="pagina" style="max-width:720px">' +
    atrasHTML(hashPerfil(pid, eid), paciente.nombre) +
    '<div class="card" style="text-align:center;padding:26px 16px;gap:6px;margin-top:14px">' +
    '<div class="card-kicker">' + (esc ? esc.nombre : r.escalaId) + ' · ' + fmtFecha(r.fecha) + '</div>' +
    '<div class="resultado-num">' + r.puntos + '</div>' +
    '<div class="text-muted" style="font-size:14px">de ' + r.maximo + '</div>' +
    (r.interpretacion ? '<div style="font-family:var(--font-heading);font-weight:800;font-size:18px;margin-top:6px">' + r.interpretacion + '</div>' : '') +
    (r.detalle ? '<div class="text-muted" style="font-size:12.5px;margin-top:4px">' + r.detalle + '</div>' : '') +
    '</div>' + detalles +
    '<button class="btn btn-peligro btn-block" id="btnBorrarEsc" style="margin-top:16px">Eliminar resultado</button>' +
    '</div>';

  instalarIr(cont);
  cont.querySelector('#btnBorrarEsc').addEventListener('click', async () => {
    if (!confirm('¿Eliminar este resultado de escala?')) return;
    await DB.borrar('escalas', id);
    irA(hashPerfil(pid, eid));
  });
}
