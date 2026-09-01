/* CORE Scale — Escalas funcionales con puntuación automática.
   ⚠ CLÍNICO: las opciones, puntos y fórmulas de este archivo fueron verificados
   contra las fuentes oficiales (2026-09-01):
     · DASH/QuickDASH → PDFs oficiales de puntuación del Institute for Work & Health
     · IKDC Subjetivo 2000 → formulario e instrucciones oficiales (AOSSM); 10a NO se puntúa
     · KOOS JR → instrucciones oficiales de HSS (tabla de conversión completa, © HSS)
     · Lysholm → Tegner & Lysholm, Clin Orthop 1985 (transcripción verificada)
     · Kujala → Kujala 1993, puntos verificados en la validación PMC10773022
     · Tegner → tabla reproducida en validación publicada (PMC8872031)
   NO cambie puntos ni fórmulas sin volver a la fuente. Las bandas de
   interpretación solo se muestran donde EXISTEN publicadas (Lysholm);
   inventar cortes en las demás sería mentirle al clínico.

   Licencias (uso clínico privado no comercial): DASH/QuickDASH son © IWH y las
   versiones electrónicas requieren su aprobación si la app se distribuye;
   KOOS JR es de uso libre (HSS) sin alterar el cuestionario; IKDC es gratuito
   (AOSSM, sin modificarlo); Lysholm/Kujala/Tegner son de uso libre.
   WOMAC y Oxford NO se incluyen porque requieren licencia de pago.            */

const OPS_DIFICULTAD_5 = [
  { et: 'Ninguna dificultad', v: 1 }, { et: 'Dificultad leve', v: 2 },
  { et: 'Dificultad moderada', v: 3 }, { et: 'Dificultad severa', v: 4 },
  { et: 'Incapaz de hacerlo', v: 5 }
];
const OPS_SEVERIDAD_5 = [
  { et: 'Ninguno', v: 1 }, { et: 'Leve', v: 2 }, { et: 'Moderado', v: 3 },
  { et: 'Severo', v: 4 }, { et: 'Extremo', v: 5 }
];
/* IKDC: escalera de actividad, de más a menos exigente (4 → 0) */
const OPS_ACTIVIDAD_IKDC = (verbo) => [
  { et: 'Actividades muy extenuantes (saltar o girar, como básquetbol o fútbol)', v: 4 },
  { et: 'Actividades extenuantes (trabajo físico pesado, esquiar, tenis)', v: 3 },
  { et: 'Actividades moderadas (trabajo físico moderado, correr, trotar)', v: 2 },
  { et: 'Actividades ligeras (caminar, trabajo de casa o de jardín)', v: 1 },
  { et: 'No puedo realizar ninguna de las anteriores ' + verbo, v: 0 }
];
const OPS_FUNCION_IKDC = [
  { et: 'Ninguna dificultad', v: 4 }, { et: 'Dificultad mínima', v: 3 },
  { et: 'Dificultad moderada', v: 2 }, { et: 'Dificultad extrema', v: 1 },
  { et: 'Incapaz de hacerlo', v: 0 }
];
const OPS_KOOS_5 = [
  { et: 'Ninguno', v: 0 }, { et: 'Leve', v: 1 }, { et: 'Moderado', v: 2 },
  { et: 'Severo', v: 3 }, { et: 'Extremo', v: 4 }
];

/* Tabla OFICIAL de conversión KOOS JR (HSS 2017/2022): crudo 0-28 → 0-100. */
const KOOS_JR_TABLA = [100.000, 91.975, 84.600, 79.914, 76.332, 73.342, 70.704,
  68.284, 65.994, 63.776, 61.583, 59.381, 57.140, 54.840, 52.465, 50.012,
  47.487, 44.905, 42.281, 39.625, 36.931, 34.174, 31.307, 28.251, 24.875,
  20.941, 15.939, 8.291, 0.000];

/* Fórmula DASH/QuickDASH: ((suma/n) − 1) × 25, con tope de faltantes. */
function _calcDash(respuestas, totalItems, maxFaltantes) {
  const validas = respuestas.filter(r => r !== null && r !== undefined);
  if (totalItems - validas.length > maxFaltantes)
    return { incompleta: true,
      texto: 'Faltan demasiadas respuestas: se admiten máximo ' + maxFaltantes + ' sin contestar.' };
  const suma = validas.reduce((a, b) => a + b, 0);
  const puntos = (suma / validas.length - 1) * 25;
  return { puntos: Math.round(puntos * 10) / 10, maximo: 100, mejorEs: 'bajo',
    texto: '0 = sin discapacidad · 100 = discapacidad máxima' };
}

const ESCALAS = [

  /* ---------- Genéricas ---------- */
  {
    id: 'eva', nombre: 'Dolor — escala numérica (EVA/ENA)', corto: 'EVA dolor',
    region: 'general', quien: 'paciente', tiempo: '30 seg',
    descripcion: 'Intensidad del dolor en una escala numérica de 0 a 10. Es la forma más rápida de dejar registrado el dolor en cada cita y ver su curva en el tiempo.',
    instrucciones: [
      'Pregunte: «del 0 al 10, donde 0 es nada de dolor y 10 el peor dolor imaginable, ¿cuánto le duele HOY?».',
      'Deje que el paciente elija el número sin sugerirle ninguno.'
    ],
    preguntas: [
      { id: 'eva', texto: '¿Cuánto dolor tiene hoy?', tipo: 'numerica', min: 0, max: 10,
        etMin: '0 · Sin dolor', etMax: '10 · El peor imaginable' }
    ],
    calcular(r) {
      if (r[0] === null || r[0] === undefined) return { incompleta: true, texto: 'Sin responder.' };
      return { puntos: r[0], maximo: 10, mejorEs: 'bajo', texto: '0 = sin dolor · 10 = dolor máximo' };
    }
  },
  {
    id: 'sane', nombre: 'SANE — evaluación numérica única', corto: 'SANE',
    region: 'general', quien: 'paciente', tiempo: '30 seg',
    descripcion: 'Una sola pregunta validada: qué tan cerca de lo normal siente el paciente su articulación, de 0 a 100. Complementa muy bien a las escalas largas.',
    instrucciones: [
      'Pregunte: «¿cómo calificaría su articulación operada el día de hoy, de 0 a 100, donde 100 es completamente normal?».'
    ],
    preguntas: [
      { id: 'sane', texto: '¿Cómo calificaría su articulación hoy, como porcentaje de lo normal?',
        tipo: 'numerica', min: 0, max: 100, paso: 5, etMin: '0', etMax: '100 · Normal' }
    ],
    calcular(r) {
      if (r[0] === null || r[0] === undefined) return { incompleta: true, texto: 'Sin responder.' };
      return { puntos: r[0], maximo: 100, mejorEs: 'alto', texto: '100 = articulación normal' };
    }
  },

  /* ---------- Miembro superior ---------- */
  {
    id: 'quickdash', nombre: 'QuickDASH (miembro superior)', corto: 'QuickDASH',
    region: 'hombro', quien: 'paciente', tiempo: '~3 min',
    descripcion: 'Versión corta del DASH: 11 preguntas sobre lo que el paciente puede hacer con el brazo, hombro o mano en la ÚLTIMA SEMANA. Resultado de 0 (sin discapacidad) a 100.',
    instrucciones: [
      'La contesta el PACIENTE según su capacidad en la última semana, sin importar con qué brazo lo haga.',
      'Si no realizó alguna actividad, que estime su capacidad; solo se admite dejar 1 pregunta sin contestar.'
    ],
    nota: 'El DASH y el QuickDASH son © Institute for Work & Health. Uso clínico no comercial; para distribuir la app se requiere su autorización (dash.iwh.on.ca).',
    preguntas: [
      { texto: 'Abrir un frasco apretado o nuevo', ops: OPS_DIFICULTAD_5 },
      { texto: 'Realizar tareas domésticas pesadas (lavar paredes o pisos)', ops: OPS_DIFICULTAD_5 },
      { texto: 'Cargar una bolsa del mandado o un portafolio', ops: OPS_DIFICULTAD_5 },
      { texto: 'Lavarse la espalda', ops: OPS_DIFICULTAD_5 },
      { texto: 'Usar un cuchillo para cortar la comida', ops: OPS_DIFICULTAD_5 },
      { texto: 'Actividades recreativas con fuerza o impacto en brazo, hombro o mano (golf, martillar, tenis…)', ops: OPS_DIFICULTAD_5 },
      { texto: 'Durante la última semana, ¿en qué medida su problema del brazo, hombro o mano interfirió con sus actividades sociales normales con familia, amigos, vecinos o grupos?', ops: [
        { et: 'Nada', v: 1 }, { et: 'Un poco', v: 2 }, { et: 'Moderadamente', v: 3 },
        { et: 'Bastante', v: 4 }, { et: 'Extremadamente', v: 5 } ] },
      { texto: '¿Se sintió limitado en su trabajo u otras actividades diarias habituales por el problema de su brazo, hombro o mano?', ops: [
        { et: 'Nada limitado', v: 1 }, { et: 'Un poco limitado', v: 2 }, { et: 'Moderadamente limitado', v: 3 },
        { et: 'Muy limitado', v: 4 }, { et: 'Incapaz', v: 5 } ] },
      { texto: 'Dolor en el brazo, hombro o mano', ops: OPS_SEVERIDAD_5 },
      { texto: 'Hormigueo (piquetes o adormecimiento) en el brazo, hombro o mano', ops: OPS_SEVERIDAD_5 },
      { texto: 'Dificultad para dormir por el dolor del brazo, hombro o mano', ops: [
        { et: 'Ninguna dificultad', v: 1 }, { et: 'Dificultad leve', v: 2 }, { et: 'Dificultad moderada', v: 3 },
        { et: 'Dificultad severa', v: 4 }, { et: 'Tanta que no puedo dormir', v: 5 } ] }
    ],
    permitirOmitir: true,
    calcular(r) { return _calcDash(r, 11, 1); }
  },
  {
    id: 'dash', nombre: 'DASH completo (miembro superior)', corto: 'DASH',
    region: 'hombro', quien: 'paciente', tiempo: '~8 min',
    descripcion: 'Cuestionario completo de discapacidad de brazo, hombro y mano: 30 preguntas sobre la ÚLTIMA SEMANA. Resultado de 0 (sin discapacidad) a 100. Si el tiempo apremia, use el QuickDASH.',
    instrucciones: [
      'La contesta el PACIENTE según su capacidad en la última semana, sin importar con qué brazo lo haga.',
      'Se admiten máximo 3 preguntas sin contestar.'
    ],
    nota: 'El DASH es © Institute for Work & Health. Uso clínico no comercial; para distribuir la app se requiere su autorización (dash.iwh.on.ca).',
    preguntas: [
      { texto: 'Abrir un frasco apretado o nuevo', ops: OPS_DIFICULTAD_5 },
      { texto: 'Escribir', ops: OPS_DIFICULTAD_5 },
      { texto: 'Girar una llave', ops: OPS_DIFICULTAD_5 },
      { texto: 'Preparar una comida', ops: OPS_DIFICULTAD_5 },
      { texto: 'Empujar y abrir una puerta pesada', ops: OPS_DIFICULTAD_5 },
      { texto: 'Colocar un objeto en una repisa por arriba de la cabeza', ops: OPS_DIFICULTAD_5 },
      { texto: 'Realizar tareas domésticas pesadas (lavar paredes o pisos)', ops: OPS_DIFICULTAD_5 },
      { texto: 'Trabajar en el jardín o el patio', ops: OPS_DIFICULTAD_5 },
      { texto: 'Tender la cama', ops: OPS_DIFICULTAD_5 },
      { texto: 'Cargar una bolsa del mandado o un portafolio', ops: OPS_DIFICULTAD_5 },
      { texto: 'Cargar un objeto pesado (más de 4-5 kg)', ops: OPS_DIFICULTAD_5 },
      { texto: 'Cambiar un foco por arriba de la cabeza', ops: OPS_DIFICULTAD_5 },
      { texto: 'Lavarse o secarse el cabello', ops: OPS_DIFICULTAD_5 },
      { texto: 'Lavarse la espalda', ops: OPS_DIFICULTAD_5 },
      { texto: 'Ponerse un suéter cerrado', ops: OPS_DIFICULTAD_5 },
      { texto: 'Usar un cuchillo para cortar la comida', ops: OPS_DIFICULTAD_5 },
      { texto: 'Actividades recreativas de poco esfuerzo (jugar cartas, tejer…)', ops: OPS_DIFICULTAD_5 },
      { texto: 'Actividades recreativas con fuerza o impacto en brazo, hombro o mano (golf, martillar, tenis…)', ops: OPS_DIFICULTAD_5 },
      { texto: 'Actividades recreativas moviendo el brazo con libertad (frisbee, bádminton…)', ops: OPS_DIFICULTAD_5 },
      { texto: 'Trasladarse de un lugar a otro (manejar o usar transporte)', ops: OPS_DIFICULTAD_5 },
      { texto: 'Actividad sexual', ops: OPS_DIFICULTAD_5 },
      { texto: '¿En qué medida su problema del brazo, hombro o mano interfirió con sus actividades sociales normales con familia, amigos, vecinos o grupos?', ops: [
        { et: 'Nada', v: 1 }, { et: 'Un poco', v: 2 }, { et: 'Moderadamente', v: 3 },
        { et: 'Bastante', v: 4 }, { et: 'Extremadamente', v: 5 } ] },
      { texto: '¿Se sintió limitado en su trabajo u otras actividades diarias habituales?', ops: [
        { et: 'Nada limitado', v: 1 }, { et: 'Un poco limitado', v: 2 }, { et: 'Moderadamente limitado', v: 3 },
        { et: 'Muy limitado', v: 4 }, { et: 'Incapaz', v: 5 } ] },
      { texto: 'Dolor en el brazo, hombro o mano', ops: OPS_SEVERIDAD_5 },
      { texto: 'Dolor en el brazo, hombro o mano al realizar alguna actividad específica', ops: OPS_SEVERIDAD_5 },
      { texto: 'Hormigueo (piquetes o adormecimiento)', ops: OPS_SEVERIDAD_5 },
      { texto: 'Debilidad en el brazo, hombro o mano', ops: OPS_SEVERIDAD_5 },
      { texto: 'Rigidez en el brazo, hombro o mano', ops: OPS_SEVERIDAD_5 },
      { texto: 'Dificultad para dormir por el dolor', ops: [
        { et: 'Ninguna dificultad', v: 1 }, { et: 'Dificultad leve', v: 2 }, { et: 'Dificultad moderada', v: 3 },
        { et: 'Dificultad severa', v: 4 }, { et: 'Tanta que no puedo dormir', v: 5 } ] },
      { texto: '«Me siento menos capaz, menos confiado o menos útil por el problema de mi brazo, hombro o mano»', ops: [
        { et: 'Totalmente en desacuerdo', v: 1 }, { et: 'En desacuerdo', v: 2 },
        { et: 'Ni de acuerdo ni en desacuerdo', v: 3 }, { et: 'De acuerdo', v: 4 },
        { et: 'Totalmente de acuerdo', v: 5 } ] }
    ],
    permitirOmitir: true,
    calcular(r) { return _calcDash(r, 30, 3); }
  },

  /* ---------- Rodilla ---------- */
  {
    id: 'lysholm', nombre: 'Escala de Lysholm (rodilla)', corto: 'Lysholm',
    region: 'rodilla', quien: 'paciente', tiempo: '~3 min',
    descripcion: 'Ocho dominios de síntomas y función de rodilla (cojera, bloqueo, inestabilidad, dolor…). Resultado de 0 a 100, con bandas publicadas de interpretación. Clásica para ligamentos y rótula.',
    instrucciones: [
      'La contesta el PACIENTE (puede leerla usted en voz alta) según cómo ha estado su rodilla recientemente.',
      'Debe contestar los 8 dominios; elija la opción que mejor lo describa.'
    ],
    preguntas: [
      { texto: 'Cojera', ops: [
        { et: 'Ninguna', v: 5 }, { et: 'Leve o periódica', v: 3 }, { et: 'Grave y constante', v: 0 } ] },
      { texto: 'Apoyo al caminar', ops: [
        { et: 'Ninguno (camina sin ayuda)', v: 5 }, { et: 'Bastón o muleta', v: 2 },
        { et: 'No puede apoyar el peso', v: 0 } ] },
      { texto: 'Bloqueo de la rodilla', ops: [
        { et: 'Sin bloqueo ni sensación de enganche', v: 15 },
        { et: 'Sensación de enganche, sin bloqueo', v: 10 },
        { et: 'Bloqueo ocasional', v: 6 }, { et: 'Bloqueo frecuente', v: 2 },
        { et: 'Rodilla bloqueada en la exploración', v: 0 } ] },
      { texto: 'Inestabilidad (sensación de que la rodilla falla)', ops: [
        { et: 'Nunca falla', v: 25 },
        { et: 'Rara vez, en deporte u otro esfuerzo intenso', v: 20 },
        { et: 'Frecuente en deporte (o incapaz de participar)', v: 15 },
        { et: 'Ocasional en actividades diarias', v: 10 },
        { et: 'Frecuente en actividades diarias', v: 5 },
        { et: 'A cada paso', v: 0 } ] },
      { texto: 'Dolor', ops: [
        { et: 'Ninguno', v: 25 },
        { et: 'Inconstante y leve con esfuerzo intenso', v: 20 },
        { et: 'Marcado con esfuerzo intenso', v: 15 },
        { et: 'Marcado al caminar más de 2 km o después', v: 10 },
        { et: 'Marcado al caminar menos de 2 km o después', v: 5 },
        { et: 'Constante', v: 0 } ] },
      { texto: 'Inflamación (hinchazón)', ops: [
        { et: 'Ninguna', v: 10 }, { et: 'Con esfuerzo intenso', v: 6 },
        { et: 'Con actividad ordinaria', v: 2 }, { et: 'Constante', v: 0 } ] },
      { texto: 'Subir escaleras', ops: [
        { et: 'Sin problema', v: 10 }, { et: 'Levemente alterado', v: 6 },
        { et: 'Un escalón a la vez', v: 2 }, { et: 'Imposible', v: 0 } ] },
      { texto: 'Ponerse en cuclillas', ops: [
        { et: 'Sin problema', v: 5 }, { et: 'Levemente alterado', v: 4 },
        { et: 'No más allá de 90°', v: 2 }, { et: 'Imposible', v: 0 } ] }
    ],
    calcular(r) {
      if (r.some(x => x === null || x === undefined))
        return { incompleta: true, texto: 'Deben contestarse los 8 dominios.' };
      const p = r.reduce((a, b) => a + b, 0);
      let interp;
      if (p >= 95) interp = 'Excelente (95-100)';
      else if (p >= 84) interp = 'Bueno (84-94)';
      else if (p >= 65) interp = 'Regular (65-83)';
      else interp = 'Malo (≤64)';
      return { puntos: p, maximo: 100, mejorEs: 'alto', interpretacion: interp,
        texto: '100 = rodilla sin síntomas' };
    }
  },
  {
    id: 'kujala', nombre: 'Escala de Kujala — dolor anterior de rodilla', corto: 'Kujala',
    region: 'rodilla', quien: 'paciente', tiempo: '~4 min',
    descripcion: 'Trece preguntas específicas para dolor anterior de rodilla y patología patelofemoral (ideal tras reconstrucción del LPFM). Resultado de 0 a 100; mayor puntaje = mejor función.',
    instrucciones: [
      'La contesta el PACIENTE; elija en cada pregunta la opción que mejor describa su rodilla.',
      'Deben contestarse las 13 preguntas.'
    ],
    preguntas: [
      { texto: 'Cojera', ops: [
        { et: 'Ninguna', v: 5 }, { et: 'Leve o periódica', v: 3 }, { et: 'Constante', v: 0 } ] },
      { texto: 'Apoyo del peso sobre la pierna', ops: [
        { et: 'Apoyo completo sin dolor', v: 5 }, { et: 'Doloroso', v: 3 },
        { et: 'Imposible apoyar el peso', v: 0 } ] },
      { texto: 'Caminar', ops: [
        { et: 'Sin límite', v: 5 }, { et: 'Más de 2 km', v: 3 },
        { et: '1 a 2 km', v: 2 }, { et: 'Imposible', v: 0 } ] },
      { texto: 'Escaleras', ops: [
        { et: 'Sin dificultad', v: 10 }, { et: 'Dolor leve al bajar', v: 8 },
        { et: 'Dolor al bajar y al subir', v: 5 }, { et: 'Imposible', v: 0 } ] },
      { texto: 'Ponerse en cuclillas', ops: [
        { et: 'Sin dificultad', v: 5 }, { et: 'Doloroso si es repetido', v: 4 },
        { et: 'Doloroso cada vez', v: 3 }, { et: 'Posible solo con carga parcial', v: 2 },
        { et: 'Imposible', v: 0 } ] },
      { texto: 'Correr', ops: [
        { et: 'Sin dificultad', v: 10 }, { et: 'Dolor después de más de 2 km', v: 8 },
        { et: 'Dolor leve desde el inicio', v: 6 }, { et: 'Dolor intenso', v: 3 },
        { et: 'Imposible', v: 0 } ] },
      { texto: 'Saltar', ops: [
        { et: 'Sin dificultad', v: 10 }, { et: 'Ligera dificultad', v: 7 },
        { et: 'Dolor constante', v: 2 }, { et: 'Imposible', v: 0 } ] },
      { texto: 'Estar sentado mucho tiempo con las rodillas flexionadas', ops: [
        { et: 'Sin dificultad', v: 10 }, { et: 'Dolor después de hacer ejercicio', v: 8 },
        { et: 'Dolor constante', v: 6 },
        { et: 'El dolor obliga a estirar las rodillas por momentos', v: 4 },
        { et: 'Imposible', v: 0 } ] },
      { texto: 'Dolor', ops: [
        { et: 'Ninguno', v: 10 }, { et: 'Leve y ocasional', v: 8 },
        { et: 'Interfiere con el sueño', v: 6 }, { et: 'Ocasionalmente intenso', v: 3 },
        { et: 'Constante e intenso', v: 0 } ] },
      { texto: 'Inflamación (hinchazón)', ops: [
        { et: 'Ninguna', v: 10 }, { et: 'Tras esfuerzo intenso', v: 8 },
        { et: 'Tras actividades diarias', v: 6 }, { et: 'Cada noche', v: 4 },
        { et: 'Constante', v: 0 } ] },
      { texto: 'Movimientos anormales y dolorosos de la rótula (subluxaciones)', ops: [
        { et: 'Ninguno', v: 10 }, { et: 'Ocasional en deporte', v: 6 },
        { et: 'Ocasional en actividades diarias', v: 4 },
        { et: 'Al menos una luxación documentada', v: 2 },
        { et: 'Más de dos luxaciones', v: 0 } ] },
      { texto: 'Atrofia del muslo (pérdida de masa muscular)', ops: [
        { et: 'Ninguna', v: 5 }, { et: 'Leve', v: 3 }, { et: 'Grave', v: 0 } ] },
      { texto: 'Déficit de flexión de la rodilla', ops: [
        { et: 'Ninguno', v: 5 }, { et: 'Leve', v: 3 }, { et: 'Grave', v: 0 } ] }
    ],
    calcular(r) {
      if (r.some(x => x === null || x === undefined))
        return { incompleta: true, texto: 'Deben contestarse las 13 preguntas.' };
      const p = r.reduce((a, b) => a + b, 0);
      return { puntos: p, maximo: 100, mejorEs: 'alto',
        texto: '100 = rodilla sin síntomas. No hay bandas oficiales publicadas; el cambio mínimo relevante reportado es de 8-19 puntos.' };
    }
  },
  {
    id: 'ikdc', nombre: 'IKDC subjetivo 2000 (rodilla)', corto: 'IKDC',
    region: 'rodilla', quien: 'paciente', tiempo: '~6 min',
    descripcion: 'Formulario subjetivo internacional de rodilla: síntomas, actividad y función. El estándar en reconstrucción del LCA. Resultado de 0 a 100; mayor = mejor.',
    instrucciones: [
      'La contesta el PACIENTE pensando en las ÚLTIMAS 4 SEMANAS (o desde la lesión).',
      'Se puede calcular con hasta 2 preguntas sin contestar; procure que conteste todas.'
    ],
    permitirOmitir: true,
    preguntas: [
      { texto: '¿Cuál es el máximo nivel de actividad que puede realizar SIN dolor significativo de rodilla?',
        ops: OPS_ACTIVIDAD_IKDC('por el dolor de rodilla') },
      { texto: 'En las últimas 4 semanas, ¿con qué frecuencia ha tenido dolor?', tipo: 'numerica',
        min: 0, max: 10, etMin: '0 · Nunca', etMax: '10 · Constante', invertir: true },
      { texto: 'Si tiene dolor, ¿qué tan intenso es?', tipo: 'numerica',
        min: 0, max: 10, etMin: '0 · Sin dolor', etMax: '10 · El peor imaginable', invertir: true },
      { texto: 'En las últimas 4 semanas, ¿qué tan rígida o hinchada ha estado su rodilla?', ops: [
        { et: 'Nada', v: 4 }, { et: 'Levemente', v: 3 }, { et: 'Moderadamente', v: 2 },
        { et: 'Muy', v: 1 }, { et: 'Extremadamente', v: 0 } ] },
      { texto: '¿Cuál es el máximo nivel de actividad que puede realizar SIN que se le hinche la rodilla?',
        ops: OPS_ACTIVIDAD_IKDC('por la hinchazón') },
      { texto: 'En las últimas 4 semanas, ¿se le ha bloqueado o trabado la rodilla?', ops: [
        { et: 'No', v: 1 }, { et: 'Sí', v: 0 } ] },
      { texto: '¿Cuál es el máximo nivel de actividad que puede realizar SIN que la rodilla le falle?',
        ops: OPS_ACTIVIDAD_IKDC('porque la rodilla falla') },
      { texto: '¿Cuál es el máximo nivel de actividad que puede realizar de forma habitual?',
        ops: OPS_ACTIVIDAD_IKDC('de forma habitual') },
      { texto: 'Dificultad para SUBIR escaleras', ops: OPS_FUNCION_IKDC },
      { texto: 'Dificultad para BAJAR escaleras', ops: OPS_FUNCION_IKDC },
      { texto: 'Dificultad para arrodillarse sobre la parte delantera de la rodilla', ops: OPS_FUNCION_IKDC },
      { texto: 'Dificultad para ponerse en cuclillas', ops: OPS_FUNCION_IKDC },
      { texto: 'Dificultad para sentarse con la rodilla flexionada', ops: OPS_FUNCION_IKDC },
      { texto: 'Dificultad para levantarse de una silla', ops: OPS_FUNCION_IKDC },
      { texto: 'Dificultad para correr hacia el frente', ops: OPS_FUNCION_IKDC },
      { texto: 'Dificultad para saltar y caer sobre la pierna afectada', ops: OPS_FUNCION_IKDC },
      { texto: 'Dificultad para frenar y arrancar rápidamente al caminar o correr', ops: OPS_FUNCION_IKDC },
      { texto: '¿Cómo calificaría la función ACTUAL de su rodilla, de 0 a 10?', tipo: 'numerica',
        min: 0, max: 10, etMin: '0 · No puedo hacer mis actividades', etMax: '10 · Sin límite alguno' }
    ],
    /* Máximos por pregunta, para la regla oficial de faltantes (suma de máximos = 87). */
    maximos: [4, 10, 10, 4, 4, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 10],
    calcular(r) {
      const contestadas = r.map((x, i) => ({ x, i })).filter(o => o.x !== null && o.x !== undefined);
      if (contestadas.length < 16)
        return { incompleta: true, texto: 'Se necesitan al menos 16 de las 18 preguntas contestadas.' };
      const suma = contestadas.reduce((a, o) => a + o.x, 0);
      const maxPosible = contestadas.reduce((a, o) => a + this.maximos[o.i], 0);
      const p = suma / maxPosible * 100;
      return { puntos: Math.round(p * 10) / 10, maximo: 100, mejorEs: 'alto',
        texto: '100 = sin limitación ni síntomas. Fórmula oficial AOSSM (suma/máximo posible × 100).' };
    }
  },
  {
    id: 'koosjr', nombre: 'KOOS JR (rodilla — artrosis y prótesis)', corto: 'KOOS JR',
    region: 'rodilla', quien: 'paciente', tiempo: '~2 min',
    descripcion: 'Versión corta del KOOS desarrollada por HSS para artrosis y prótesis de rodilla: 7 preguntas sobre la ÚLTIMA SEMANA. Resultado de 0 a 100; mayor = mejor. La escala de elección para seguimiento de PTR.',
    instrucciones: [
      'La contesta el PACIENTE pensando en la ÚLTIMA SEMANA.',
      'Deben contestarse las 7 preguntas (no hay regla oficial para faltantes).'
    ],
    preguntas: [
      { texto: '¿Qué tan RÍGIDA siente la rodilla al despertar por la mañana?', ops: [
        { et: 'Nada', v: 0 }, { et: 'Poco', v: 1 }, { et: 'Moderadamente', v: 2 },
        { et: 'Mucho', v: 3 }, { et: 'Muchísimo', v: 4 } ] },
      { texto: '¿Cuánto DOLOR ha sentido al girar o pivotar sobre la rodilla?', ops: OPS_KOOS_5 },
      { texto: '¿Cuánto DOLOR ha sentido al estirar la rodilla por completo?', ops: OPS_KOOS_5 },
      { texto: '¿Cuánto DOLOR ha sentido al subir o bajar escaleras?', ops: OPS_KOOS_5 },
      { texto: '¿Cuánto DOLOR ha sentido al estar de pie erguido?', ops: OPS_KOOS_5 },
      { texto: '¿Qué tanta DIFICULTAD ha tenido para levantarse de estar sentado?', ops: [
        { et: 'Ninguna', v: 0 }, { et: 'Poca', v: 1 }, { et: 'Moderada', v: 2 },
        { et: 'Mucha', v: 3 }, { et: 'Extrema', v: 4 } ] },
      { texto: '¿Qué tanta DIFICULTAD ha tenido para agacharse al suelo o recoger un objeto?', ops: [
        { et: 'Ninguna', v: 0 }, { et: 'Poca', v: 1 }, { et: 'Moderada', v: 2 },
        { et: 'Mucha', v: 3 }, { et: 'Extrema', v: 4 } ] }
    ],
    calcular(r) {
      if (r.some(x => x === null || x === undefined))
        return { incompleta: true, texto: 'Deben contestarse las 7 preguntas.' };
      const crudo = r.reduce((a, b) => a + b, 0);
      const p = KOOS_JR_TABLA[crudo];
      return { puntos: Math.round(p * 10) / 10, maximo: 100, mejorEs: 'alto',
        detalle: 'Puntaje crudo ' + crudo + '/28 → conversión oficial HSS',
        texto: '100 = rodilla perfecta · 0 = discapacidad total' };
    }
  },
  {
    id: 'tegner', nombre: 'Nivel de actividad de Tegner', corto: 'Tegner',
    region: 'rodilla', quien: 'paciente', tiempo: '1 min',
    descripcion: 'Nivel de actividad deportiva y laboral de 0 a 10. Útil registrarlo ANTES de la lesión y en cada cita, para saber qué tanto se ha recuperado el nivel previo.',
    instrucciones: [
      'Pida al paciente elegir el nivel MÁS ALTO que puede realizar actualmente.',
      'Conviene anotar también (en las notas) el nivel que tenía antes de lesionarse.'
    ],
    preguntas: [
      { texto: '¿Cuál es el nivel más alto de actividad que puede realizar actualmente?', ops: [
        { et: '10 · Deporte competitivo de élite (fútbol nacional/internacional)', v: 10 },
        { et: '9 · Competitivo: fútbol divisiones inferiores, hockey, lucha, gimnasia', v: 9 },
        { et: '8 · Competitivo: squash/bádminton, atletismo de saltos, esquí alpino', v: 8 },
        { et: '7 · Competitivo: tenis, carrera, motocross, balonmano o básquetbol · Recreativo: fútbol, hockey, squash', v: 7 },
        { et: '6 · Recreativo: tenis, bádminton, balonmano, básquetbol, esquí, trote ≥5 veces/semana', v: 6 },
        { et: '5 · Trabajo pesado (construcción) · Ciclismo o esquí de fondo competitivo · Trote en terreno irregular ≥2 veces/semana', v: 5 },
        { et: '4 · Trabajo moderadamente pesado (manejar camión) · Ciclismo/esquí de fondo recreativo · Trote en plano ≥2 veces/semana', v: 4 },
        { et: '3 · Trabajo ligero (enfermería) · Natación · Caminar en bosque', v: 3 },
        { et: '2 · Trabajo ligero · Camina en terreno irregular, pero no en bosque', v: 2 },
        { et: '1 · Trabajo sedentario · Camina en terreno plano', v: 1 },
        { et: '0 · Incapacidad laboral por la rodilla', v: 0 } ] }
    ],
    calcular(r) {
      if (r[0] === null || r[0] === undefined) return { incompleta: true, texto: 'Sin responder.' };
      return { puntos: r[0], maximo: 10, mejorEs: 'alto',
        texto: 'Compárelo con el nivel que tenía antes de la lesión.' };
    }
  }
];

/* Escalas sugeridas según el tipo de cirugía del episodio. */
const ESCALAS_SUGERIDAS = {
  hombro: ['quickdash', 'dash', 'eva', 'sane'],
  lpfm: ['kujala', 'lysholm', 'eva', 'sane', 'tegner'],
  ptr: ['koosjr', 'eva', 'sane'],
  lca: ['ikdc', 'lysholm', 'tegner', 'eva', 'sane'],
  artro: ['lysholm', 'ikdc', 'koosjr', 'tegner', 'eva', 'sane'],
  otro: ['eva', 'sane']
};

function escalaPorId(id) { return ESCALAS.find(e => e.id === id); }

function escalasParaEpisodio(tipo) {
  const ids = ESCALAS_SUGERIDAS[tipo] || ESCALAS_SUGERIDAS.otro;
  const sugeridas = ids.map(escalaPorId).filter(Boolean);
  const resto = ESCALAS.filter(e => !ids.includes(e.id));
  return { sugeridas, resto };
}
