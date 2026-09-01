/* CORE Scale — gráficas de evolución en SVG puro (sin librerías: la app es
   offline). Réplica del estilo del diseño Modernist: tarjeta con kicker,
   último valor grande, línea en acento con puntos, rejilla mínima de 3 líneas.
   La serie contralateral se dibuja punteada en gris; la meta de simetría (90 %)
   como línea discontinua sutil.

   API:
     svgGrafica({series, objetivo})            → string SVG (viewBox 320x118)
     tarjetaGrafica({kicker, series, unidad, objetivo, notaMenor}) → tarjeta HTML
   Cada serie: { puntos: [{et, y}], contra?: true }  (et = etiqueta 'Sem 3')   */

function svgGrafica(cfg) {
  const W = 320, H = 118, P = 16;
  const series = (cfg.series || []).map(s => ({
    ...s,
    puntos: (s.puntos || []).filter(p => p.y !== null && p.y !== undefined && !isNaN(p.y))
  })).filter(s => s.puntos.length > 0);
  if (!series.length) return '';

  const todosY = series.flatMap(s => s.puntos.map(p => p.y));
  if (cfg.objetivo !== undefined) todosY.push(cfg.objetivo);
  let min = Math.min(...todosY), max = Math.max(...todosY);
  const rango = (max - min) || 1;
  min -= rango * 0.15; max += rango * 0.15;

  const X = (i, n) => n > 1 ? P + i * (W - 2 * P) / (n - 1) : W / 2;
  const Y = v => H - P - (v - min) / (max - min) * (H - 2 * P);

  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="grafica-svg" xmlns="http://www.w3.org/2000/svg">' +
    '<line x1="16" y1="16" x2="304" y2="16" stroke="var(--color-neutral-300)" stroke-width="1"/>' +
    '<line x1="16" y1="59" x2="304" y2="59" stroke="var(--color-neutral-300)" stroke-width="1"/>' +
    '<line x1="16" y1="102" x2="304" y2="102" stroke="var(--color-neutral-400)" stroke-width="1.5"/>';

  if (cfg.objetivo !== undefined) {
    const py = Y(cfg.objetivo).toFixed(1);
    svg += '<line x1="16" y1="' + py + '" x2="304" y2="' + py +
      '" stroke="var(--color-accent-300)" stroke-width="1.5" stroke-dasharray="5 4"/>';
  }

  /* primero la contralateral (queda debajo), después la principal */
  for (const s of [...series].sort((a, b) => (a.contra ? 0 : 1) - (b.contra ? 0 : 1))) {
    const n = s.puntos.length;
    const pts = s.puntos.map((p, i) => X(i, n).toFixed(1) + ',' + Y(p.y).toFixed(1)).join(' ');
    const color = s.contra ? 'var(--color-neutral-500)' : 'var(--color-accent)';
    if (n > 1)
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + color +
        '" stroke-width="' + (s.contra ? 2 : 2.5) + '"' +
        (s.contra ? ' stroke-dasharray="4 4"' : '') + '/>';
    s.puntos.forEach((p, i) => {
      svg += '<circle cx="' + X(i, n).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) +
        '" r="' + (s.contra ? 3 : 4) + '" fill="' + color + '"/>';
    });
  }
  return svg + '</svg>';
}

function tarjetaGrafica(cfg) {
  const principal = (cfg.series || []).find(s => !s.contra && s.puntos && s.puntos.length);
  if (!principal) return '';
  const pts = principal.puntos.filter(p => p.y !== null && !isNaN(p.y));
  if (!pts.length) return '';
  const ultimo = pts[pts.length - 1], primero = pts[0];
  const red = n => Math.round(n * 10) / 10;
  const delta = red(ultimo.y - primero.y);
  const hayContra = (cfg.series || []).some(s => s.contra && s.puntos && s.puntos.length);

  return '<div class="card">' +
    '<div class="card-kicker">' + cfg.kicker + '</div>' +
    '<div class="grafica-num">' + red(ultimo.y) + (cfg.unidad ? '<span style="font-size:16px;font-weight:600;color:var(--color-neutral-600)"> ' + cfg.unidad + '</span>' : '') + '</div>' +
    svgGrafica(cfg) +
    '<div class="card-meta"><span>' + (primero.et || '') + '</span><span style="flex:1"></span>' +
    (pts.length > 1 ? '<span style="color:var(--color-accent-700);font-weight:600">' +
      (delta >= 0 ? '+' : '') + delta + (primero.et ? ' desde ' + primero.et.toLowerCase() : '') + '</span>' : '') +
    '<span style="flex:1"></span><span>' + (ultimo.et || '') + '</span></div>' +
    ((hayContra || cfg.objetivo !== undefined || cfg.notaMenor) ?
      '<div class="card-meta">' +
      (hayContra ? '<span>— gris punteado: contralateral</span>' : '') +
      (cfg.objetivo !== undefined ? '<span>— discontinua: meta ' + cfg.objetivo + (cfg.unidad === '%' ? ' %' : '') + '</span>' : '') +
      (cfg.notaMenor ? '<span>menor puntaje = mejor</span>' : '') +
      '</div>' : '') +
    '</div>';
}
