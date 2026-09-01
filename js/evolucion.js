/* CORE Scale — evolución del paciente entre visitas.
   Cada tarjeta grafica UNA métrica (estilo del diseño Modernist): línea en
   acento, contralateral punteada en gris y, en los LSI, la meta de 90 %.
   También arma las 3 tarjetas de resumen del perfil (ROM · LSI · escala).    */

/* Especificación por plantilla: t = kicker, u = unidad, id = campo o auto,
   contra = serie contralateral, obj = línea de meta.                          */
const EVOLUCION_SPECS = {
  hombro: [
    { t: 'Elevación anterior activa', u: '°', id: 'elev_act', contra: 'elev_contra' },
    { t: 'Abducción activa', u: '°', id: 'abd_act', contra: 'abd_contra' },
    { t: 'Rotación externa a 90°', u: '°', id: 're_90', contra: 're_90_c' },
    { t: 'Rotación interna a 90°', u: '°', id: 'ri_90', contra: 'ri_90_c' },
    { t: 'RE con codo al costado', u: '°', id: 're_costado', contra: 're_costado_c' },
    { t: 'Fuerza · abducción full can', u: 'kg', id: 'fullcan_mejor', contra: 'fullcan_contra' },
    { t: 'Fuerza · rotación externa', u: 'kg', id: 'rot_re', contra: 'rot_re_c' },
    { t: 'Fuerza · rotación interna', u: 'kg', id: 'rot_ri', contra: 'rot_ri_c' },
    { t: 'Fuerza · flexión de codo', u: 'kg', id: 'biceps_mejor', contra: 'biceps_contra' },
    { t: 'LSI abducción full can', u: '%', id: 'fullcan_lsi', obj: 90 },
    { t: 'LSI rotación externa', u: '%', id: 'rot_re_lsi', obj: 90 },
    { t: 'LSI rotación interna', u: '%', id: 'rot_ri_lsi', obj: 90 },
    { t: 'LSI flexión de codo', u: '%', id: 'biceps_lsi', obj: 90 },
    { t: 'Perimetría de brazo · diferencia', u: 'cm', id: 'peri_dif' }
  ],
  lpfm: [
    { t: 'Flexión activa', u: '°', id: 'flex_act', contra: 'flex_contra' },
    { t: 'Déficit de extensión activa', u: '°', id: 'ext_act' },
    { t: 'Retraso extensor', u: '°', id: 'lag' },
    { t: 'Fuerza · cuádriceps', u: 'kg', id: 'cuadriceps_mejor', contra: 'cuadriceps_contra' },
    { t: 'Fuerza · abductores de cadera', u: 'kg', id: 'abductores_mejor', contra: 'abductores_contra' },
    { t: 'LSI cuádriceps', u: '%', id: 'cuadriceps_lsi', obj: 90 },
    { t: 'LSI abductores', u: '%', id: 'abductores_lsi', obj: 90 },
    { t: 'Perimetría muslo 10 cm · diferencia', u: 'cm', id: 'dif_10' },
    { t: 'Perimetría muslo 15 cm · diferencia', u: 'cm', id: 'dif_15' }
  ],
  ptr: [
    { t: 'Flexión activa', u: '°', id: 'flex_act', contra: 'flex_contra' },
    { t: 'Déficit de extensión activa', u: '°', id: 'def_ext_act' },
    { t: 'Fuerza · cuádriceps', u: 'kg', id: 'cuadriceps_mejor', contra: 'cuadriceps_contra' },
    { t: 'LSI cuádriceps', u: '%', id: 'cuadriceps_lsi', obj: 90 },
    { t: 'Timed Up and Go', u: 'seg', id: 'tug_mejor', menor: true },
    { t: 'Sentarse y levantarse · 30 s', u: 'rep', id: 'sts_rep' },
    { t: 'Perimetría rodilla · diferencia', u: 'cm', id: 'dif_rodilla' },
    { t: 'Perimetría muslo · diferencia', u: 'cm', id: 'dif_muslo' }
  ],
  lca: [
    { t: 'Flexión activa', u: '°', id: 'flex_act', contra: 'flex_contra' },
    { t: 'Déficit de extensión activa', u: '°', id: 'ext_act' },
    { t: 'Fuerza · cuádriceps', u: 'kg', id: 'cuadriceps_mejor', contra: 'cuadriceps_contra' },
    { t: 'Fuerza · isquiotibiales', u: 'kg', id: 'isquios_mejor', contra: 'isquios_contra' },
    { t: 'LSI cuádriceps', u: '%', id: 'cuadriceps_lsi', obj: 90 },
    { t: 'LSI isquiotibiales', u: '%', id: 'isquios_lsi', obj: 90 },
    { t: 'Perimetría muslo 10 cm · diferencia', u: 'cm', id: 'dif_10' },
    { t: 'Perimetría muslo 15 cm · diferencia', u: 'cm', id: 'dif_15' }
  ],
  artro: [
    { t: 'Flexión activa', u: '°', id: 'flex_act', contra: 'flex_contra' },
    { t: 'Déficit de extensión activa', u: '°', id: 'ext_act' },
    { t: 'Retraso extensor', u: '°', id: 'lag' },
    { t: 'Fuerza · cuádriceps', u: 'kg', id: 'cuadriceps_mejor', contra: 'cuadriceps_contra' },
    { t: 'Fuerza · isquiotibiales', u: 'kg', id: 'isquios_mejor', contra: 'isquios_contra' },
    { t: 'LSI cuádriceps', u: '%', id: 'cuadriceps_lsi', obj: 90 },
    { t: 'LSI isquiotibiales', u: '%', id: 'isquios_lsi', obj: 90 },
    { t: 'Perimetría muslo 10 cm · diferencia', u: 'cm', id: 'dif_10' },
    { t: 'Perimetría muslo 15 cm · diferencia', u: 'cm', id: 'dif_15' }
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

/* Métrica principal de fuerza (LSI) y de movilidad de cada plantilla. */
function lsiPrincipalId(pl) {
  const sec = pl.secciones.find(s => s.tipoSeccion === 'dinamometria');
  if (!sec) return null;
  const a = (sec.autos || []).find(a => a.tipo === 'lsi');
  return a ? a.id : null;
}
function romPrincipal(pl) {
  return pl.region === 'hombro'
    ? { id: 'elev_act', contra: 'elev_contra', label: 'Elevación activa (°)', corto: 'Elevación anterior activa' }
    : { id: 'flex_act', contra: 'flex_contra', label: 'Flexión activa (°)', corto: 'Flexión activa de rodilla' };
}

function _etiquetaPunto(episodio, fecha) {
  const s = semanasDesde(episodio.fechaCirugia, fecha);
  return s !== null && s >= 0 ? 'Sem ' + s : fmtFechaCorta(fecha);
}

function _serieDeCampo(episodio, evals, pl, id) {
  return evals
    .map(ev => ({ et: _etiquetaPunto(episodio, ev.fecha), y: _valorEnEval(ev, pl, id) }))
    .filter(p => p.y !== null);
}

/* Las 3 tarjetas de resumen del perfil: ROM · LSI de fuerza · escala. */
function seriesResumen(episodio, evalsOrdenadas, escalas) {
  const pl = PLANTILLAS[episodio.tipo];
  if (!pl) return [];
  const cfgs = [];

  const rom = romPrincipal(pl);
  const sRom = _serieDeCampo(episodio, evalsOrdenadas, pl, rom.id);
  if (sRom.length) {
    cfgs.push({ kicker: rom.corto + ' (°)', unidad: '°',
      series: [{ puntos: sRom },
        { contra: true, puntos: _serieDeCampo(episodio, evalsOrdenadas, pl, rom.contra) }] });
  }

  const idLsi = lsiPrincipalId(pl);
  const sLsi = idLsi ? _serieDeCampo(episodio, evalsOrdenadas, pl, idLsi) : [];
  if (sLsi.length) {
    cfgs.push({ kicker: (pl.region === 'hombro' ? 'LSI abducción (%)' : 'LSI cuádriceps (%)'),
      unidad: '%', objetivo: 90, series: [{ puntos: sLsi }] });
  }

  /* la escala con más resultados registrados */
  const porEscala = {};
  for (const r of escalas) (porEscala[r.escalaId] = porEscala[r.escalaId] || []).push(r);
  const idEsc = Object.keys(porEscala).sort((a, b) => porEscala[b].length - porEscala[a].length)[0];
  if (idEsc) {
    const esc = escalaPorId(idEsc);
    const lista = porEscala[idEsc].sort((a, b) => a.fecha < b.fecha ? -1 : 1);
    const menor = ['eva', 'quickdash', 'dash'].includes(idEsc);
    cfgs.push({ kicker: (esc ? esc.corto : idEsc) + ' (0-' + lista[0].maximo + ')',
      unidad: '', notaMenor: menor,
      series: [{ puntos: lista.map(r => ({ et: _etiquetaPunto(episodio, r.fecha), y: r.puntos })) }] });
  }
  return cfgs;
}

/* ---------------- vista: todas las gráficas ---------------- */
async function vistaEvolucion(cont, pid, eid) {
  activarNav('pacientes');
  const [paciente, episodio, evals, escalas] = await Promise.all([
    DB.obtener('pacientes', pid), DB.obtener('episodios', eid),
    DB.porIndice('evaluaciones', 'episodioId', eid),
    DB.porIndice('escalas', 'episodioId', eid)
  ]);
  if (!paciente || !episodio) { irA('#/'); return; }
  const pl = PLANTILLAS[episodio.tipo];
  const evalsOrden = evals.sort((a, b) => a.fecha < b.fecha ? -1 : 1);

  let tarjetas = [];
  if (pl) {
    for (const spec of (EVOLUCION_SPECS[episodio.tipo] || [])) {
      const puntos = _serieDeCampo(episodio, evalsOrden, pl, spec.id);
      if (!puntos.length) continue;
      const series = [{ puntos }];
      if (spec.contra) {
        const pc = _serieDeCampo(episodio, evalsOrden, pl, spec.contra);
        if (pc.length) series.push({ contra: true, puntos: pc });
      }
      tarjetas.push(tarjetaGrafica({ kicker: spec.t + ' (' + spec.u + ')', unidad: spec.u,
        objetivo: spec.obj, notaMenor: spec.menor, series }));
    }
  }

  /* una gráfica por escala aplicada */
  const porEscala = {};
  for (const r of escalas) (porEscala[r.escalaId] = porEscala[r.escalaId] || []).push(r);
  for (const idEsc of Object.keys(porEscala)) {
    const esc = escalaPorId(idEsc);
    const lista = porEscala[idEsc].sort((a, b) => a.fecha < b.fecha ? -1 : 1);
    tarjetas.push(tarjetaGrafica({
      kicker: (esc ? esc.nombre : idEsc),
      notaMenor: ['eva', 'quickdash', 'dash'].includes(idEsc),
      series: [{ puntos: lista.map(r => ({ et: _etiquetaPunto(episodio, r.fecha), y: r.puntos })) }]
    }));
  }
  tarjetas = tarjetas.filter(Boolean);

  cont.innerHTML = '<div class="pagina">' +
    atrasHTML(hashPerfil(pid, eid), paciente.nombre) +
    '<h3 style="margin:10px 0 2px">Evolución entre visitas</h3>' +
    '<p class="text-muted" style="font-size:13px">' + escaparHTML(dxEpisodio(episodio)) + '</p>' +
    (tarjetas.length ?
      '<div class="grid-graficas-2" style="margin-top:14px">' + tarjetas.join('') + '</div>' +
      '<p class="text-muted" style="font-size:12px;margin-top:14px">Cada punto es una cita. ' +
      'La línea gris punteada es el lado contralateral y la discontinua la meta de simetría (90 %).</p>' :
      '<div class="vacio"><div class="icono">📈</div>Todavía no hay mediciones que graficar.<br>' +
      'Las gráficas aparecen solas al ir guardando evaluaciones y escalas.</div>') +
    '</div>';
  instalarIr(cont);
}
