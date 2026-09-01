/* CORE Scale — gráficas de evolución en SVG puro (sin librerías: la app es offline).
   dibujarGrafica({series, unidad, min, max, objetivo}) devuelve el HTML del SVG.
   Cada serie: { nombre, color (var CSS), puntos: [{t: Date|ms, y: número}] }   */

function dibujarGrafica(cfg) {
  const W = 640, H = 260, mIzq = 44, mDer = 14, mArr = 16, mAbj = 34;
  const aw = W - mIzq - mDer, ah = H - mArr - mAbj;

  const series = (cfg.series || []).map(s => ({
    ...s,
    puntos: (s.puntos || [])
      .filter(p => p.y !== null && p.y !== undefined && !isNaN(p.y))
      .map(p => ({ t: (p.t instanceof Date) ? p.t.getTime() : p.t, y: p.y }))
      .sort((a, b) => a.t - b.t)
  })).filter(s => s.puntos.length > 0);

  if (!series.length)
    return '<p class="vacio" style="padding:20px">Aún no hay datos para graficar.</p>';

  const todosT = series.flatMap(s => s.puntos.map(p => p.t));
  const todosY = series.flatMap(s => s.puntos.map(p => p.y));
  if (cfg.objetivo !== undefined) todosY.push(cfg.objetivo);

  let t0 = Math.min(...todosT), t1 = Math.max(...todosT);
  if (t0 === t1) { t0 -= 86400e3 * 7; t1 += 86400e3 * 7; }
  let y0 = cfg.min !== undefined ? cfg.min : Math.min(...todosY);
  let y1 = cfg.max !== undefined ? cfg.max : Math.max(...todosY);
  if (cfg.min === undefined && cfg.max === undefined) {
    const margen = Math.max((y1 - y0) * 0.15, y1 === y0 ? Math.abs(y1) * 0.15 + 1 : 0);
    y0 -= margen; y1 += margen;
  }
  if (y0 === y1) { y0 -= 1; y1 += 1; }

  const X = t => mIzq + (t - t0) / (t1 - t0) * aw;
  const Y = y => mArr + (1 - (y - y0) / (y1 - y0)) * ah;

  let svg = '<svg class="grafica-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';

  /* rejilla horizontal: 4 líneas con su valor */
  for (let i = 0; i <= 4; i++) {
    const y = y0 + (y1 - y0) * i / 4;
    const py = Y(y);
    svg += '<line x1="' + mIzq + '" y1="' + py + '" x2="' + (W - mDer) + '" y2="' + py +
      '" stroke="var(--linea)" stroke-width="1"/>';
    svg += '<text x="' + (mIzq - 6) + '" y="' + (py + 4) + '" text-anchor="end" ' +
      'font-size="11" fill="var(--tinta-3)">' + (Math.round(y * 10) / 10) + '</text>';
  }

  /* línea objetivo (p. ej. LSI 90 %) */
  if (cfg.objetivo !== undefined) {
    const py = Y(cfg.objetivo);
    svg += '<line x1="' + mIzq + '" y1="' + py + '" x2="' + (W - mDer) + '" y2="' + py +
      '" stroke="var(--bueno)" stroke-width="1.5" stroke-dasharray="6 4"/>';
    svg += '<text x="' + (W - mDer) + '" y="' + (py - 5) + '" text-anchor="end" ' +
      'font-size="11" font-weight="700" fill="var(--bueno)">' + (cfg.etObjetivo || cfg.objetivo) + '</text>';
  }

  /* fechas en el eje X: primera, última y hasta 2 intermedias */
  const fechasEje = [...new Set(todosT)].sort((a, b) => a - b);
  const paso = Math.max(1, Math.ceil(fechasEje.length / 4));
  for (let i = 0; i < fechasEje.length; i += paso) {
    const t = fechasEje[i];
    const f = new Date(t);
    const et = f.getDate() + ' ' + f.toLocaleDateString('es-MX', { month: 'short' });
    svg += '<text x="' + X(t) + '" y="' + (H - 12) + '" text-anchor="middle" ' +
      'font-size="11" fill="var(--tinta-3)">' + et + '</text>';
  }

  const colores = ['var(--acento)', 'var(--tinta-3)', 'var(--medio)', 'var(--malo)', 'var(--bueno)'];
  series.forEach((s, i) => {
    const color = s.color || colores[i % colores.length];
    const d = s.puntos.map((p, j) => (j ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
    if (s.puntos.length > 1)
      svg += '<path d="' + d + '" fill="none" stroke="' + color +
        '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"' +
        (s.punteada ? ' stroke-dasharray="3 5"' : '') + '/>';
    for (const p of s.puntos) {
      svg += '<circle cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) +
        '" r="4.5" fill="' + color + '" stroke="var(--tarjeta)" stroke-width="1.5"/>';
    }
    /* etiqueta del último valor (pegada al borde se ancla a la derecha para no cortarse) */
    const u = s.puntos[s.puntos.length - 1];
    const cerca = X(u.t) > W - mDer - 60;
    svg += '<text x="' + (cerca ? X(u.t) - 8 : X(u.t) + 8) + '" y="' + (Y(u.y) - 8) +
      '" text-anchor="' + (cerca ? 'end' : 'start') + '" font-size="12" font-weight="800" fill="' + color + '">' +
      (Math.round(u.y * 10) / 10) + (cfg.unidad ? ' ' + cfg.unidad : '') + '</text>';
  });

  svg += '</svg>';

  /* leyenda si hay más de una serie */
  let leyenda = '';
  if (series.length > 1) {
    leyenda = '<div style="display:flex;gap:14px;flex-wrap:wrap;padding:2px 8px 8px;font-size:12.5px;color:var(--tinta-2)">' +
      series.map((s, i) => {
        const color = s.color || colores[i % colores.length];
        return '<span><span style="display:inline-block;width:10px;height:10px;border-radius:5px;background:' +
          color + ';margin-right:5px"></span>' + s.nombre + '</span>';
      }).join('') + '</div>';
  }
  return svg + leyenda;
}
