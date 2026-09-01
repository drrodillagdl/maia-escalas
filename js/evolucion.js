/* CORE Scale — evolución del paciente: gráficas de cada métrica a lo largo
   de las citas. Las series se definen por plantilla; el criterio de simetría
   (LSI ≥ 90 %) se dibuja como línea objetivo.                                */

const EVOLUCION_SPECS = {
  hombro: [
    { titulo: 'Elevación anterior (°)', unidad: '°',
      series: [['elev_act', 'Operado'], ['elev_contra', 'Contralateral', true]] },
    { titulo: 'Abducción (°)', unidad: '°',
      series: [['abd_act', 'Operado'], ['abd_contra', 'Contralateral', true]] },
    { titulo: 'Rotaciones a 90° de abducción (°)', unidad: '°',
      series: [['re_90', 'Rotación externa'], ['ri_90', 'Rotación interna']] },
    { titulo: 'Fuerza — abducción full can (kg)', unidad: 'kg',
      series: [['fullcan_mejor', 'Operado'], ['fullcan_contra', 'Contralateral', true]] },
    { titulo: 'Fuerza — rotación externa (kg)', unidad: 'kg',
      series: [['rot_re', 'Operado'], ['rot_re_c', 'Contralateral', true]] },
    { titulo: 'Fuerza — rotación interna (kg)', unidad: 'kg',
      series: [['rot_ri', 'Operado'], ['rot_ri_c', 'Contralateral', true]] },
    { titulo: 'Fuerza — flexión de codo (kg)', unidad: 'kg',
      series: [['biceps_mejor', 'Operado'], ['biceps_contra', 'Contralateral', true]] },
    { titulo: 'Índice de simetría de fuerza (%)', unidad: '%', objetivo: 90, etObjetivo: 'meta 90 %', min: 0,
      series: [['fullcan_lsi', 'Full can'], ['rot_re_lsi', 'Rot. externa'],
               ['rot_ri_lsi', 'Rot. interna'], ['biceps_lsi', 'Bíceps']] },
    { titulo: 'Perimetría de brazo: diferencia vs contralateral (cm)', unidad: 'cm',
      series: [['peri_dif', 'Diferencia a 10 cm']] }
  ],
  lpfm: [
    { titulo: 'Flexión de rodilla (°)', unidad: '°',
      series: [['flex_act', 'Operada'], ['flex_contra', 'Contralateral', true]] },
    { titulo: 'Extensión: déficit (°) — ideal 0', unidad: '°',
      series: [['ext_act', 'Extensión activa'], ['lag', 'Retraso extensor']] },
    { titulo: 'Fuerza — cuádriceps (kg)', unidad: 'kg',
      series: [['cuadriceps_mejor', 'Operada'], ['cuadriceps_contra', 'Contralateral', true]] },
    { titulo: 'Fuerza — abductores de cadera (kg)', unidad: 'kg',
      series: [['abductores_mejor', 'Operada'], ['abductores_contra', 'Contralateral', true]] },
    { titulo: 'Índice de simetría de fuerza (%)', unidad: '%', objetivo: 90, etObjetivo: 'meta 90 %', min: 0,
      series: [['cuadriceps_lsi', 'Cuádriceps'], ['abductores_lsi', 'Abductores']] },
    { titulo: 'Perimetría de muslo: diferencia vs contralateral (cm)', unidad: 'cm',
      series: [['dif_10', 'A 10 cm'], ['dif_15', 'A 15 cm']] }
  ],
  ptr: [
    { titulo: 'Flexión de rodilla (°)', unidad: '°',
      series: [['flex_act', 'Operada'], ['flex_contra', 'Contralateral', true]] },
    { titulo: 'Déficit de extensión (°) — ideal 0', unidad: '°',
      series: [['def_ext_act', 'Activo'], ['def_ext_pas', 'Pasivo', true]] },
    { titulo: 'Fuerza — cuádriceps (kg)', unidad: 'kg',
      series: [['cuadriceps_mejor', 'Operada'], ['cuadriceps_contra', 'Contralateral', true]] },
    { titulo: 'Índice de simetría de cuádriceps (%)', unidad: '%', objetivo: 90, etObjetivo: 'meta 90 %', min: 0,
      series: [['cuadriceps_lsi', 'Cuádriceps']] },
    { titulo: 'Timed Up and Go (seg) — menor es mejor', unidad: 'seg',
      series: [['tug_mejor', 'Mejor tiempo']] },
    { titulo: 'Sentarse y levantarse en 30 seg (repeticiones)', unidad: 'rep',
      series: [['sts_rep', 'Repeticiones']] },
    { titulo: 'Perimetría: diferencia vs contralateral (cm)', unidad: 'cm',
      series: [['dif_rodilla', 'Rodilla'], ['dif_muslo', 'Muslo 10 cm']] }
  ],
  lca: [
    { titulo: 'Flexión de rodilla (°)', unidad: '°',
      series: [['flex_act', 'Operada'], ['flex_contra', 'Contralateral', true]] },
    { titulo: 'Extensión activa (°) — ideal 0', unidad: '°',
      series: [['ext_act', 'Operada']] },
    { titulo: 'Fuerza — cuádriceps (kg)', unidad: 'kg',
      series: [['cuadriceps_mejor', 'Operada'], ['cuadriceps_contra', 'Contralateral', true]] },
    { titulo: 'Fuerza — isquiotibiales (kg)', unidad: 'kg',
      series: [['isquios_mejor', 'Operada'], ['isquios_contra', 'Contralateral', true]] },
    { titulo: 'Índice de simetría de fuerza (%)', unidad: '%', objetivo: 90, etObjetivo: 'meta 90 %', min: 0,
      series: [['cuadriceps_lsi', 'Cuádriceps'], ['isquios_lsi', 'Isquiotibiales']] },
    { titulo: 'Perimetría de muslo: diferencia vs contralateral (cm)', unidad: 'cm',
      series: [['dif_10', 'A 10 cm'], ['dif_15', 'A 15 cm']] }
  ]
};

/* Busca el valor de un campo o de un auto dentro de una evaluación. */
function _valorEnEval(ev, plantilla, id) {
  if (ev.valores[id] !== undefined) {
    const n = parseFloat(String(ev.valores[id]).replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  for (const s of plantilla.secciones) {
    if (!s.autos || !s.autos.some(a => a.id === id)) continue;
    const a = calcularAutos(s, ev.valores).find(a => a.id === id);
    if (a) return a.num;
  }
  return null;
}

async function vistaEvolucion(cont, pid, eid) {
  const [paciente, episodio, evals, escalas] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid),
    DB.porIndice('evaluaciones', 'episodioId', eid),
    DB.porIndice('escalas', 'episodioId', eid)
  ]);
  barra('Evolución', paciente.nombre, '#/episodio/' + pid + '/' + eid);

  const plantilla = PLANTILLAS[episodio.tipo];
  const specs = EVOLUCION_SPECS[episodio.tipo] || [];
  const evalsOrden = evals.sort((a, b) => a.fecha < b.fecha ? -1 : 1);

  let htmlG = '';

  if (plantilla) {
    for (const spec of specs) {
      const series = spec.series.map(([id, nombre, punteada]) => ({
        nombre, punteada: !!punteada,
        color: punteada ? 'var(--tinta-3)' : undefined,
        puntos: evalsOrden.map(ev => ({
          t: new Date(ev.fecha + 'T12:00:00'), y: _valorEnEval(ev, plantilla, id)
        })).filter(p => p.y !== null)
      })).filter(s => s.puntos.length > 0);
      if (!series.length) continue;
      htmlG += '<div class="tarjeta grafica-tarjeta"><h4>' + spec.titulo + '</h4>' +
        dibujarGrafica({ series, unidad: spec.unidad, objetivo: spec.objetivo,
          etObjetivo: spec.etObjetivo, min: spec.min }) + '</div>';
    }
  }

  /* Escalas funcionales: una gráfica por escala aplicada. */
  const porEscala = {};
  for (const r of escalas) (porEscala[r.escalaId] = porEscala[r.escalaId] || []).push(r);
  for (const idEsc of Object.keys(porEscala)) {
    const esc = escalaPorId(idEsc);
    const lista = porEscala[idEsc].sort((a, b) => a.fecha < b.fecha ? -1 : 1);
    htmlG += '<div class="tarjeta grafica-tarjeta"><h4>' + (esc ? esc.nombre : idEsc) + '</h4>' +
      '<p class="sub">' + (esc && esc.calcular ? (lista[0].maximo === 10 && idEsc === 'eva' ? 'Menor es mejor' : 'Mayor es mejor') : '') + '</p>' +
      dibujarGrafica({
        min: 0, max: lista[0].maximo,
        series: [{ nombre: esc ? esc.corto : idEsc,
          puntos: lista.map(r => ({ t: new Date(r.fecha + 'T12:00:00'), y: r.puntos })) }]
      }) + '</div>';
  }

  if (!htmlG) {
    htmlG = '<div class="vacio"><div class="icono">📈</div>' +
      'Todavía no hay mediciones que graficar.<br>' +
      'Las gráficas aparecen solas al ir guardando evaluaciones y escalas.</div>';
  }

  cont.innerHTML = htmlG +
    '<p class="nota-pie">Cada punto es una cita. La línea punteada gris es el lado contralateral<br>y la línea verde discontinua la meta de simetría (90 %).</p>';
}
