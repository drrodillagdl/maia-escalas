/* CORE Scale — Plantillas de evaluación postoperatoria.
   Transcritas de las hojas impresas del Dr. Israel Romo (serie "Evaluación",
   carpeta Dinamómetro). Cada sección conserva sus instrucciones completas:
   la app enseña CÓMO hacer cada medición, no solo dónde anotarla.

   Tipos de campo:
     num   → número con unidad (°, kg, cm, seg, rep). neg:true admite negativos.
     ops   → opción única en botones (checkboxes de la hoja impresa).
     sino  → Sí / No.
     sel   → lista desplegable (p. ej. nivel vertebral).
   "autos" son valores que la app calcula sola:
     max   → mejor de los intentos (fuerza)
     min   → mejor tiempo (TUG)
     lsi   → índice de simetría: operado / contralateral × 100
     dif   → diferencia operado − contralateral                                */

const NIVELES_VERTEBRALES = ['C7','T1','T2','T3','T4','T5','T6','T7','T8','T9',
  'T10','T11','T12','L1','L2','L3','L4','L5','Sacro','Glúteo','Trocánter'];

function _dinamo(prefijo, etiqueta, instrucciones) {
  /* Sección estándar de dinamometría: 3 intentos + contralateral, mejor y LSI automáticos. */
  return {
    id: prefijo, titulo: etiqueta, tipoSeccion: 'dinamometria',
    instrucciones,
    campos: [
      { id: prefijo + '_f1', et: 'Fuerza 1', tipo: 'num', unidad: 'kg', min: 0, max: 200, paso: 0.1 },
      { id: prefijo + '_f2', et: 'Fuerza 2', tipo: 'num', unidad: 'kg', min: 0, max: 200, paso: 0.1 },
      { id: prefijo + '_f3', et: 'Fuerza 3', tipo: 'num', unidad: 'kg', min: 0, max: 200, paso: 0.1 },
      { id: prefijo + '_contra', et: 'Mejor contralateral', tipo: 'num', unidad: 'kg', min: 0, max: 200, paso: 0.1 }
    ],
    autos: [
      { id: prefijo + '_mejor', et: 'Mejor resultado', tipo: 'max',
        de: [prefijo + '_f1', prefijo + '_f2', prefijo + '_f3'], unidad: 'kg' },
      { id: prefijo + '_lsi', et: 'Índice de simetría (LSI)', tipo: 'lsi',
        de: [prefijo + '_mejor', prefijo + '_contra'], unidad: '%',
        nota: 'Criterio habitual de simetría: ≥ 90 % del lado sano.' }
    ]
  };
}

const INSTR_DINAMO_CUAD = [
  'Paciente sentado al borde de la mesa, cadera y rodilla a 90°, brazos cruzados sobre el pecho.',
  'Colocar el dinamómetro manual sobre la cara anterior de la tibia, inmediatamente proximal a los maléolos; el explorador fija el dinamómetro contra su propio cuerpo sin ceder (prueba isométrica tipo make test).',
  'Comando: «empuje contra mi mano estirando la rodilla con toda su fuerza». Contracción máxima de 5 segundos, 3 intentos, con 30 segundos de descanso entre cada uno.',
  'Registrar cada intento en kilogramos y el mejor valor; medir también el mejor valor contralateral.'
];

const SECCION_DERRAME = {
  id: 'derrame', titulo: 'Derrame articular — prueba del barrido (stroke test)',
  instrucciones: [
    'Paciente en decúbito supino con la rodilla en extensión completa y el cuádriceps relajado.',
    'Con el borde de la mano, barrer 2-3 veces la cara medial de la rodilla en sentido ascendente (desde la interlínea hacia el fondo de saco suprarrotuliano) y después descender por la cara lateral observando la cara medial.',
    'Registrar el grado según la onda de líquido visible en la cara medial.'
  ],
  campos: [
    { id: 'derrame', et: 'Grado de derrame', tipo: 'ops', ops: [
      { v: '0', et: '0 (sin onda)' }, { v: 'trazas', et: 'Trazas' },
      { v: '1+', et: '1+' }, { v: '2+', et: '2+ (retorno espontáneo)' },
      { v: '3+', et: '3+ (a tensión)' } ] }
  ]
};

const PLANTILLAS = {

  /* ================= CIRUGÍA DE HOMBRO ================= */
  hombro: {
    id: 'hombro',
    nombre: 'Cirugía de hombro',
    tag: 'HOMBRO', kicker: 'Hombro · Postoperatorio',
    desc: 'Goniometría de elevación, abducción y rotaciones; dinamometría full can, RE/RI y bíceps; perimetría de brazo.',
    titulo: 'CIRUGÍA DE HOMBRO — EVALUACIÓN POSTOPERATORIA GENERAL',
    region: 'hombro',
    lados: ['Derecha', 'Izquierda'],
    secciones: [
      {
        id: 'gonio_elev', titulo: 'Goniometría — elevación anterior y abducción',
        instrucciones: [
          'Paciente de pie o sentado, tronco erguido; evitar compensación con inclinación del tronco o elevación escapular exagerada.',
          'Centrar el eje del goniómetro justo por debajo del acromion (cara lateral del hombro para flexión; cara posterior para abducción); brazo fijo paralelo al tronco y brazo móvil sobre el eje del húmero hacia el epicóndilo lateral.',
          'Comando: «levante el brazo al frente lo más alto que pueda» (elevación anterior) y «levante el brazo hacia un lado lo más alto que pueda» (abducción); registrar el máximo activo y después el pasivo llevado por el explorador al máximo tolerado.',
          'Registrar en grados y repetir en el hombro contralateral.'
        ],
        campos: [
          { id: 'elev_act', et: 'Elevación anterior activa', tipo: 'num', unidad: '°', min: 0, max: 190 },
          { id: 'elev_pas', et: 'Elevación anterior pasiva', tipo: 'num', unidad: '°', min: 0, max: 190 },
          { id: 'elev_contra', et: 'Elevación contralateral', tipo: 'num', unidad: '°', min: 0, max: 190 },
          { id: 'abd_act', et: 'Abducción activa', tipo: 'num', unidad: '°', min: 0, max: 190 },
          { id: 'abd_pas', et: 'Abducción pasiva', tipo: 'num', unidad: '°', min: 0, max: 190 },
          { id: 'abd_contra', et: 'Abducción contralateral', tipo: 'num', unidad: '°', min: 0, max: 190 }
        ],
        autos: [
          { id: 'elev_pct', et: 'Elevación activa vs contralateral', tipo: 'lsi', de: ['elev_act', 'elev_contra'], unidad: '%' },
          { id: 'abd_pct', et: 'Abducción activa vs contralateral', tipo: 'lsi', de: ['abd_act', 'abd_contra'], unidad: '%' }
        ]
      },
      {
        id: 'gonio_rot', titulo: 'Goniometría — rotaciones',
        instrucciones: [
          'Rotación externa con codo al costado: paciente supino, codo pegado al tronco flexionado a 90°, antebrazo neutro; eje del goniómetro en el olécranon, brazo fijo vertical y brazo móvil sobre el cúbito.',
          'Rotaciones a 90° de abducción: paciente supino, hombro abducido a 90° y codo a 90°; eje en el olécranon, brazo fijo perpendicular a la mesa y brazo móvil sobre el cúbito; girar hacia rotación externa e interna al máximo activo.',
          'Rotación interna funcional: de pie, pedir «lleve el pulgar por la espalda lo más alto que alcance»; registrar la apófisis espinosa alcanzada (p. ej. T7, T12, L3, sacro).',
          'Registrar en grados cada rotación y el nivel vertebral; repetir en el hombro contralateral.'
        ],
        campos: [
          { id: 're_costado', et: 'RE codo al costado', tipo: 'num', unidad: '°', min: -20, max: 120, neg: true },
          { id: 're_90', et: 'RE a 90° abd.', tipo: 'num', unidad: '°', min: 0, max: 130 },
          { id: 'ri_90', et: 'RI a 90° abd.', tipo: 'num', unidad: '°', min: 0, max: 110 },
          { id: 're_costado_c', et: 'RE contralateral', tipo: 'num', unidad: '°', min: -20, max: 120, neg: true },
          { id: 're_90_c', et: 'RE 90° contralateral', tipo: 'num', unidad: '°', min: 0, max: 130 },
          { id: 'ri_90_c', et: 'RI 90° contralateral', tipo: 'num', unidad: '°', min: 0, max: 110 },
          { id: 'ri_funcional', et: 'RI funcional (nivel vertebral)', tipo: 'sel', ops: NIVELES_VERTEBRALES },
          { id: 'ri_funcional_c', et: 'RI funcional contralateral', tipo: 'sel', ops: NIVELES_VERTEBRALES }
        ]
      },
      _dinamo('fullcan', 'Dinamometría — abducción en plano escapular (full can)', [
        'Paciente de pie, brazo elevado a 90° en el plano de la escápula (30° por delante del plano coronal), codo extendido y pulgar hacia arriba.',
        'Colocar el dinamómetro manual sobre la cara dorsal del antebrazo, inmediatamente proximal a la muñeca; el explorador resiste sin ceder (prueba isométrica tipo make test).',
        'Comando: «empuje hacia arriba contra mi mano con toda su fuerza». Contracción máxima de 5 segundos, 3 intentos, con 30 segundos de descanso entre cada uno.',
        'Registrar cada intento en kilogramos, el mejor valor y el mejor valor contralateral.'
      ]),
      {
        id: 'dinamo_rot', titulo: 'Dinamometría — rotación externa e interna',
        instrucciones: [
          'Paciente sentado, codo pegado al tronco flexionado a 90°, antebrazo neutro apuntando al frente.',
          'Colocar el dinamómetro sobre la cara dorsal de la muñeca para rotación externa («gire hacia afuera contra mi mano») y sobre la cara palmar para rotación interna («gire hacia adentro contra mi mano»); el explorador resiste sin ceder.',
          'Contracción máxima de 5 segundos, 3 intentos por movimiento, 30 segundos de descanso; registrar el mejor valor de cada movimiento y su contralateral.'
        ],
        campos: [
          { id: 'rot_re', et: 'RE — mejor de 3', tipo: 'num', unidad: 'kg', min: 0, max: 100, paso: 0.1 },
          { id: 'rot_re_c', et: 'RE — contralateral', tipo: 'num', unidad: 'kg', min: 0, max: 100, paso: 0.1 },
          { id: 'rot_ri', et: 'RI — mejor de 3', tipo: 'num', unidad: 'kg', min: 0, max: 100, paso: 0.1 },
          { id: 'rot_ri_c', et: 'RI — contralateral', tipo: 'num', unidad: 'kg', min: 0, max: 100, paso: 0.1 }
        ],
        autos: [
          { id: 'rot_re_lsi', et: 'LSI rotación externa', tipo: 'lsi', de: ['rot_re', 'rot_re_c'], unidad: '%',
            nota: 'Criterio habitual de simetría: ≥ 90 % del lado sano.' },
          { id: 'rot_ri_lsi', et: 'LSI rotación interna', tipo: 'lsi', de: ['rot_ri', 'rot_ri_c'], unidad: '%' }
        ]
      },
      _dinamo('biceps', 'Dinamometría — flexión de codo (bíceps)', [
        'Paciente sentado, brazo pegado al tronco, codo flexionado a 90° con el antebrazo en supinación completa.',
        'Colocar el dinamómetro sobre la cara anterior del antebrazo, inmediatamente proximal a la muñeca; el explorador resiste sin ceder.',
        'Comando: «doble el codo contra mi mano con toda su fuerza». Contracción máxima de 5 segundos, 3 intentos, 30 segundos de descanso.',
        'Registrar cada intento en kilogramos, el mejor valor y el mejor valor contralateral.'
      ]),
      {
        id: 'perimetria', titulo: 'Perimetría de brazo',
        instrucciones: [
          'Paciente de pie con el brazo relajado a lo largo del cuerpo, codo extendido.',
          'Medir desde el epicóndilo lateral y marcar un punto a 10 cm en sentido proximal; colocar la cinta métrica perpendicular al eje del húmero sobre la marca, ajustada sin comprimir la piel.',
          'Registrar en centímetros y repetir en el brazo contralateral.'
        ],
        campos: [
          { id: 'peri_10', et: 'Brazo 10 cm — operado', tipo: 'num', unidad: 'cm', min: 10, max: 80, paso: 0.1 },
          { id: 'peri_10_c', et: 'Brazo 10 cm — contralateral', tipo: 'num', unidad: 'cm', min: 10, max: 80, paso: 0.1 }
        ],
        autos: [
          { id: 'peri_dif', et: 'Diferencia operado − contralateral', tipo: 'dif', de: ['peri_10', 'peri_10_c'], unidad: 'cm',
            nota: 'Una diferencia negativa indica atrofia del lado operado.' }
        ]
      }
    ]
  },

  /* ================= LPFM ================= */
  lpfm: {
    id: 'lpfm',
    nombre: 'Reconstrucción LPFM',
    tag: 'LPFM', kicker: 'Rodilla · Patelofemoral',
    desc: 'Goniometría, retraso extensor, derrame, perimetría, movilidad rotuliana, aprensión y dinamometría.',
    titulo: 'RECONSTRUCCIÓN DE LIGAMENTO PATELOFEMORAL MEDIAL — EVALUACIÓN POSTOPERATORIA',
    region: 'rodilla',
    lados: ['Derecha', 'Izquierda'],
    secciones: [
      {
        id: 'gonio', titulo: 'Goniometría de rodilla',
        instrucciones: [
          'Paciente en decúbito supino con la extremidad relajada sobre la mesa de exploración.',
          'Centrar el eje del goniómetro sobre el epicóndilo femoral lateral; brazo fijo dirigido al trocánter mayor y brazo móvil dirigido al maléolo lateral.',
          'Flexión: pedir «doble la rodilla lo más que pueda» (activa) y después llevarla el explorador al máximo tolerado (pasiva). Extensión: pedir «estire la rodilla por completo»; registrar déficit con valor positivo e hiperextensión con valor negativo.',
          'Registrar en grados y repetir en la rodilla contralateral.'
        ],
        campos: [
          { id: 'flex_act', et: 'Flexión activa', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'flex_pas', et: 'Flexión pasiva', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'flex_contra', et: 'Flexión contralateral', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'ext_act', et: 'Extensión activa', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true },
          { id: 'ext_pas', et: 'Extensión pasiva', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true },
          { id: 'ext_contra', et: 'Extensión contralateral', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true }
        ],
        autos: [
          { id: 'flex_pct', et: 'Flexión activa vs contralateral', tipo: 'lsi', de: ['flex_act', 'flex_contra'], unidad: '%' }
        ]
      },
      {
        id: 'lag', titulo: 'Retraso extensor (extension lag)',
        instrucciones: [
          'Paciente sentado al borde de la mesa con la rodilla a 90°; pedir «estire la rodilla por completo y sosténgala».',
          'Medir con goniómetro el déficit entre la extensión activa máxima sostenida y la extensión pasiva completa; registrar además si sostiene la elevación de pierna recta sin caída de la rodilla.'
        ],
        campos: [
          { id: 'lag', et: 'Retraso extensor', tipo: 'num', unidad: '°', min: 0, max: 60 },
          { id: 'slr', et: 'Elevación de pierna recta sin retraso', tipo: 'sino' }
        ]
      },
      SECCION_DERRAME,
      {
        id: 'perimetria', titulo: 'Perimetría de muslo',
        instrucciones: [
          'Paciente en decúbito supino, rodilla en extensión y musculatura relajada.',
          'Medir desde el polo superior de la rótula y marcar puntos a 10 cm y 15 cm en sentido proximal.',
          'Colocar la cinta perpendicular al eje del fémur sobre cada marca, ajustada sin comprimir la piel; registrar en cm y repetir en la extremidad contralateral.'
        ],
        campos: [
          { id: 'peri_10', et: '10 cm — operada', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_10_c', et: '10 cm — contralateral', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_15', et: '15 cm — operada', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_15_c', et: '15 cm — contralateral', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 }
        ],
        autos: [
          { id: 'dif_10', et: 'Diferencia a 10 cm', tipo: 'dif', de: ['peri_10', 'peri_10_c'], unidad: 'cm' },
          { id: 'dif_15', et: 'Diferencia a 15 cm', tipo: 'dif', de: ['peri_15', 'peri_15_c'], unidad: 'cm',
            nota: 'Una diferencia negativa indica atrofia del lado operado.' }
        ]
      },
      {
        id: 'movilidad_rotula', titulo: 'Movilidad rotuliana — deslizamiento en cuadrantes e inclinación',
        instrucciones: [
          'Paciente en decúbito supino, rodilla en 20-30° de flexión sobre un rollo, cuádriceps relajado. Dividir mentalmente el ancho de la rótula en cuatro cuadrantes.',
          'Deslizamiento lateral: empujar la rótula hacia lateral de manera SUAVE, sin forzar (protección de la plastia), y registrar cuántos cuadrantes se desplaza. Deslizamiento medial: empujar hacia medial y registrar los cuadrantes.',
          'Inclinación (tilt): elevar el borde lateral de la rótula respecto al plano frontal; registrar si alcanza o supera la horizontal. Comparar siempre con la rodilla contralateral.'
        ],
        campos: [
          { id: 'desl_lat', et: 'Deslizamiento lateral', tipo: 'ops', ops: [
            { v: '<1', et: '<1 cuadrante' }, { v: '1', et: '1' }, { v: '2', et: '2' },
            { v: '3', et: '3' }, { v: '4', et: '4 (luxable)' } ] },
          { id: 'desl_med', et: 'Deslizamiento medial', tipo: 'ops', ops: [
            { v: '<1', et: '<1 cuadrante' }, { v: '1', et: '1' }, { v: '2', et: '2' }, { v: '3', et: '3' } ] },
          { id: 'tilt', et: 'Inclinación lateral (tilt)', tipo: 'ops', ops: [
            { v: 'neutra', et: 'Neutra o positiva' },
            { v: 'restringida', et: 'Restringida (no alcanza la horizontal)' } ] }
        ]
      },
      {
        id: 'aprension', titulo: 'Prueba de aprensión rotuliana',
        instrucciones: [
          'Paciente en decúbito supino y relajado; el explorador presiona el borde medial de la rótula desplazándola hacia lateral mientras flexiona la rodilla de 0° a 30°.',
          'Comando: «avíseme si siente que la rodilla se le va a salir». Suspender de inmediato ante aprensión.',
          'Registrar el resultado y el grado de flexión en que aparece.'
        ],
        campos: [
          { id: 'aprension', et: 'Resultado', tipo: 'ops', ops: [
            { v: 'negativa', et: 'Negativa' }, { v: 'dudosa', et: 'Dudosa' }, { v: 'positiva', et: 'Positiva' } ] },
          { id: 'aprension_flex', et: 'Flexión al aparecer', tipo: 'num', unidad: '°', min: 0, max: 60 }
        ]
      },
      _dinamo('cuadriceps', 'Dinamometría de cuádriceps', INSTR_DINAMO_CUAD),
      _dinamo('abductores', 'Dinamometría de abductores de cadera', [
        'Paciente en decúbito lateral sobre el lado sano, cadera y rodilla en extensión, pelvis estabilizada por el explorador.',
        'Colocar el dinamómetro en la cara lateral del muslo, 5 cm proximal al epicóndilo femoral lateral; resistir sin ceder.',
        'Comando: «suba la pierna contra mi mano con toda su fuerza». Contracción máxima de 5 segundos, 3 intentos, 30 segundos de descanso.',
        'Registrar cada intento en kilogramos, el mejor valor y el mejor valor contralateral.'
      ])
    ]
  },

  /* ================= PRÓTESIS TOTAL DE RODILLA ================= */
  ptr: {
    id: 'ptr',
    nombre: 'Prótesis total de rodilla',
    tag: 'PTR', kicker: 'Rodilla · Artroplastia',
    desc: 'Goniometría, derrame, perimetría, estabilidad varo/valgo, dinamometría, TUG y sit-to-stand de 30 s.',
    titulo: 'PRÓTESIS TOTAL DE RODILLA — EVALUACIÓN POSTOPERATORIA',
    region: 'rodilla',
    lados: ['Derecha', 'Izquierda'],
    secciones: [
      {
        id: 'gonio', titulo: 'Goniometría de rodilla',
        instrucciones: [
          'Paciente en decúbito supino con la extremidad relajada sobre la mesa de exploración.',
          'Centrar el eje del goniómetro sobre el epicóndilo femoral lateral; brazo fijo dirigido al trocánter mayor y brazo móvil dirigido al maléolo lateral.',
          'Flexión: pedir «doble la rodilla lo más que pueda» (activa) y después llevarla el explorador al máximo tolerado (pasiva). Extensión: pedir «estire la rodilla por completo»; registrar déficit de extensión con valor positivo.',
          'Registrar el valor en grados de cada movimiento y repetir en la rodilla contralateral.'
        ],
        campos: [
          { id: 'flex_act', et: 'Flexión activa', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'flex_pas', et: 'Flexión pasiva', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'flex_contra', et: 'Flexión contralateral', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'def_ext_act', et: 'Déficit de extensión activa', tipo: 'num', unidad: '°', min: 0, max: 40 },
          { id: 'def_ext_pas', et: 'Déficit de extensión pasiva', tipo: 'num', unidad: '°', min: 0, max: 40 },
          { id: 'ext_contra', et: 'Extensión contralateral', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true }
        ],
        autos: [
          { id: 'flex_pct', et: 'Flexión activa vs contralateral', tipo: 'lsi', de: ['flex_act', 'flex_contra'], unidad: '%' }
        ]
      },
      SECCION_DERRAME,
      {
        id: 'perimetria', titulo: 'Perimetría de rodilla y muslo',
        instrucciones: [
          'Paciente en decúbito supino, rodilla en extensión y musculatura relajada.',
          'Rodilla: colocar la cinta métrica a nivel del punto medio de la rótula, perpendicular al eje de la extremidad, ajustada sin comprimir la piel.',
          'Muslo: medir desde el polo superior de la rótula, marcar un punto a 10 cm en sentido proximal y medir el perímetro sobre la marca.',
          'Registrar en centímetros y repetir ambas mediciones en la extremidad contralateral.'
        ],
        campos: [
          { id: 'peri_rodilla', et: 'Rodilla (medio patelar) — operada', tipo: 'num', unidad: 'cm', min: 20, max: 80, paso: 0.1 },
          { id: 'peri_rodilla_c', et: 'Rodilla (medio patelar) — contralateral', tipo: 'num', unidad: 'cm', min: 20, max: 80, paso: 0.1 },
          { id: 'peri_10', et: 'Muslo 10 cm — operada', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_10_c', et: 'Muslo 10 cm — contralateral', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 }
        ],
        autos: [
          { id: 'dif_rodilla', et: 'Diferencia de rodilla', tipo: 'dif', de: ['peri_rodilla', 'peri_rodilla_c'], unidad: 'cm',
            nota: 'Positiva = rodilla operada más voluminosa (edema/derrame).' },
          { id: 'dif_muslo', et: 'Diferencia de muslo', tipo: 'dif', de: ['peri_10', 'peri_10_c'], unidad: 'cm',
            nota: 'Una diferencia negativa indica atrofia del lado operado.' }
        ]
      },
      {
        id: 'estabilidad', titulo: 'Estabilidad coronal — estrés en varo y valgo',
        instrucciones: [
          'Paciente en decúbito supino. Explorar primero con la rodilla en extensión completa y después a 30° de flexión.',
          'Con una mano estabilizar el muslo distal y con la otra sujetar la pierna a nivel del tobillo; aplicar estrés en valgo (apertura medial) y en varo (apertura lateral) de forma sostenida.',
          'Registrar la apertura percibida en cada posición.'
        ],
        campos: ['valgo_0|Valgo 0°', 'valgo_30|Valgo 30°', 'varo_0|Varo 0°', 'varo_30|Varo 30°'].map(par => {
          const [id, et] = par.split('|');
          return { id, et, tipo: 'ops', ops: [
            { v: 'estable', et: 'Estable' }, { v: 'leve', et: 'Apertura leve (<5 mm)' },
            { v: 'moderada', et: 'Moderada (5-10 mm)' }, { v: 'severa', et: 'Severa (>10 mm)' } ] };
        })
      },
      _dinamo('cuadriceps', 'Dinamometría de cuádriceps', INSTR_DINAMO_CUAD),
      {
        id: 'tug', titulo: 'Timed Up and Go (TUG)', tipoSeccion: 'cronometro',
        instrucciones: [
          'Silla con descansabrazos (asiento a ~46 cm); marcar una línea a 3 metros del borde anterior de la silla.',
          'Paciente sentado con la espalda apoyada; puede usar su auxiliar de marcha habitual (registrarlo en el espacio correspondiente).',
          'Comando: «cuando diga ya, levántese, camine a paso normal hasta la línea, dé la vuelta, regrese y siéntese». Iniciar el cronómetro al decir «ya» y detenerlo cuando la espalda toque el respaldo.',
          'Realizar 1 intento de práctica sin cronometrar y 2 intentos cronometrados con 1 minuto de descanso; registrar ambos tiempos en segundos y el mejor.'
        ],
        campos: [
          { id: 'tug_1', et: 'Tiempo 1', tipo: 'num', unidad: 'seg', min: 0, max: 300, paso: 0.1, crono: true },
          { id: 'tug_2', et: 'Tiempo 2', tipo: 'num', unidad: 'seg', min: 0, max: 300, paso: 0.1, crono: true },
          { id: 'tug_aux', et: 'Auxiliar de marcha', tipo: 'ops', ops: [
            { v: 'ninguno', et: 'Ninguno' }, { v: 'baston', et: 'Bastón' },
            { v: 'andadera', et: 'Andadera' }, { v: 'muletas', et: 'Muletas' } ] }
        ],
        autos: [
          { id: 'tug_mejor', et: 'Mejor tiempo', tipo: 'min', de: ['tug_1', 'tug_2'], unidad: 'seg',
            nota: 'En adultos mayores, ≥ 13.5 seg se asocia a mayor riesgo de caídas.' }
        ]
      },
      {
        id: 'sts', titulo: 'Sentarse y levantarse en 30 segundos (30s STS)', tipoSeccion: 'cronometro30',
        instrucciones: [
          'Silla sin descansabrazos apoyada contra la pared (asiento a ~43-46 cm). Paciente sentado al centro, espalda recta, pies apoyados y brazos cruzados sobre el pecho.',
          'Comando: «cuando diga ya, levántese por completo y vuelva a sentarse tantas veces pueda durante 30 segundos».',
          'Contar el número de repeticiones completas (extensión completa de cadera y rodilla) en 30 segundos; si al terminar el tiempo está a más de la mitad de levantarse, cuenta como repetición.'
        ],
        campos: [
          { id: 'sts_rep', et: 'Repeticiones en 30 segundos', tipo: 'num', unidad: 'rep', min: 0, max: 60 }
        ]
      }
    ]
  },

  /* ================= RECONSTRUCCIÓN LCA ================= */
  lca: {
    id: 'lca',
    nombre: 'Reconstrucción LCA',
    tag: 'LCA', kicker: 'Rodilla · Postoperatorio',
    desc: 'Goniometría, derrame, perimetría, Lachman, pivot shift y dinamometría de cuádriceps e isquiotibiales.',
    titulo: 'RECONSTRUCCIÓN DE LIGAMENTO CRUZADO ANTERIOR — EVALUACIÓN POSTOPERATORIA',
    region: 'rodilla',
    lados: ['Derecha', 'Izquierda'],
    secciones: [
      {
        id: 'gonio', titulo: 'Goniometría de rodilla',
        instrucciones: [
          'Paciente en decúbito supino con la extremidad relajada sobre la mesa de exploración.',
          'Centrar el eje del goniómetro sobre el epicóndilo femoral lateral; brazo fijo dirigido al trocánter mayor y brazo móvil dirigido al maléolo lateral.',
          'Flexión: pedir «doble la rodilla lo más que pueda» (activa) y después llevarla el explorador al máximo tolerado (pasiva). Extensión: pedir «estire la rodilla por completo»; registrar déficit con valor positivo e hiperextensión con valor negativo.',
          'Registrar el valor en grados de cada movimiento y repetir en la rodilla contralateral.'
        ],
        campos: [
          { id: 'flex_act', et: 'Flexión activa', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'flex_pas', et: 'Flexión pasiva', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'flex_contra', et: 'Flexión contralateral', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'ext_act', et: 'Extensión activa', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true },
          { id: 'ext_pas', et: 'Extensión pasiva', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true },
          { id: 'ext_contra', et: 'Extensión contralateral', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true }
        ],
        autos: [
          { id: 'flex_pct', et: 'Flexión activa vs contralateral', tipo: 'lsi', de: ['flex_act', 'flex_contra'], unidad: '%' }
        ]
      },
      SECCION_DERRAME,
      {
        id: 'perimetria', titulo: 'Perimetría de muslo',
        instrucciones: [
          'Paciente en decúbito supino, rodilla en extensión y musculatura relajada.',
          'Medir desde el polo superior de la rótula y marcar puntos a 10 cm y 15 cm en sentido proximal.',
          'Colocar la cinta métrica perpendicular al eje del fémur sobre cada marca, ajustada sin comprimir la piel; registrar en centímetros y repetir en la extremidad contralateral.'
        ],
        campos: [
          { id: 'peri_10', et: '10 cm — operada', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_10_c', et: '10 cm — contralateral', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_15', et: '15 cm — operada', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_15_c', et: '15 cm — contralateral', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 }
        ],
        autos: [
          { id: 'dif_10', et: 'Diferencia a 10 cm', tipo: 'dif', de: ['peri_10', 'peri_10_c'], unidad: 'cm' },
          { id: 'dif_15', et: 'Diferencia a 15 cm', tipo: 'dif', de: ['peri_15', 'peri_15_c'], unidad: 'cm',
            nota: 'Una diferencia negativa indica atrofia del lado operado.' }
        ]
      },
      {
        id: 'lachman', titulo: 'Prueba de Lachman',
        instrucciones: [
          'Paciente en decúbito supino, rodilla en 20-30° de flexión.',
          'El explorador estabiliza el fémur distal con una mano y con la otra sujeta la tibia proximal; aplicar traslación anterior firme y súbita de la tibia.',
          'Registrar el grado de traslación comparado con la rodilla contralateral y la calidad del punto final.'
        ],
        campos: [
          { id: 'lachman', et: 'Traslación', tipo: 'ops', ops: [
            { v: 'neg', et: 'Negativo' }, { v: '1+', et: '1+ (3-5 mm)' },
            { v: '2+', et: '2+ (6-10 mm)' }, { v: '3+', et: '3+ (>10 mm)' } ] },
          { id: 'lachman_pf', et: 'Punto final', tipo: 'ops', ops: [
            { v: 'firme', et: 'Firme' }, { v: 'ausente', et: 'Ausente' } ] }
        ]
      },
      {
        id: 'pivot', titulo: 'Pivot shift',
        instrucciones: [
          'Paciente en decúbito supino, relajado; iniciar con la rodilla en extensión completa.',
          'Aplicar rotación interna de la tibia y estrés en valgo mientras se flexiona progresivamente la rodilla; percibir la reducción de la tibia entre 20° y 40°.',
          'Registrar el grado del fenómeno de reducción.'
        ],
        campos: [
          { id: 'pivot', et: 'Resultado', tipo: 'ops', ops: [
            { v: 'neg', et: 'Negativo' }, { v: '1+', et: '1+ (deslizamiento)' },
            { v: '2+', et: '2+ (resalto/clunk)' }, { v: '3+', et: '3+ (subluxación franca)' } ] }
        ]
      },
      _dinamo('cuadriceps', 'Dinamometría de cuádriceps', INSTR_DINAMO_CUAD),
      _dinamo('isquios', 'Dinamometría de isquiotibiales', [
        'Paciente en decúbito prono, rodilla flexionada a 90°.',
        'Colocar el dinamómetro manual sobre la cara posterior de la pierna, inmediatamente proximal al talón; el explorador resiste sin ceder.',
        'Comando: «doble la rodilla contra mi mano con toda su fuerza». Contracción máxima de 5 segundos, 3 intentos, 30 segundos de descanso.',
        'Registrar cada intento en kilogramos, el mejor valor y el mejor valor contralateral.'
      ])
    ]
  },

  /* ========= ARTROSCOPIA DE RODILLA — POSTOPERATORIO GENERAL ========= */
  artro: {
    id: 'artro',
    nombre: 'Artroscopia de rodilla',
    tag: 'ARTRO', kicker: 'Rodilla · Postoperatorio',
    desc: 'Protocolo general para cualquier artroscopia de rodilla (menisco, cartílago, cuerpos libres, plica…): goniometría, retraso extensor, derrame, interlíneas y portales, perimetría y dinamometría.',
    titulo: 'ARTROSCOPIA DE RODILLA — EVALUACIÓN POSTOPERATORIA GENERAL',
    region: 'rodilla',
    lados: ['Derecha', 'Izquierda'],
    secciones: [
      {
        id: 'gonio', titulo: 'Goniometría de rodilla',
        instrucciones: [
          'Paciente en decúbito supino con la extremidad relajada sobre la mesa de exploración.',
          'Centrar el eje del goniómetro sobre el epicóndilo femoral lateral; brazo fijo dirigido al trocánter mayor y brazo móvil dirigido al maléolo lateral.',
          'Flexión: pedir «doble la rodilla lo más que pueda» (activa) y después llevarla el explorador al máximo tolerado (pasiva). Extensión: pedir «estire la rodilla por completo»; registrar déficit con valor positivo e hiperextensión con valor negativo.',
          'Registrar en grados y repetir en la rodilla contralateral.'
        ],
        campos: [
          { id: 'flex_act', et: 'Flexión activa', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'flex_pas', et: 'Flexión pasiva', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'flex_contra', et: 'Flexión contralateral', tipo: 'num', unidad: '°', min: 0, max: 160 },
          { id: 'ext_act', et: 'Extensión activa', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true },
          { id: 'ext_pas', et: 'Extensión pasiva', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true },
          { id: 'ext_contra', et: 'Extensión contralateral', tipo: 'num', unidad: '°', min: -15, max: 40, neg: true }
        ],
        autos: [
          { id: 'flex_pct', et: 'Flexión activa vs contralateral', tipo: 'lsi', de: ['flex_act', 'flex_contra'], unidad: '%' }
        ]
      },
      {
        id: 'lag', titulo: 'Retraso extensor (extension lag)',
        instrucciones: [
          'Paciente sentado al borde de la mesa con la rodilla a 90°; pedir «estire la rodilla por completo y sosténgala».',
          'Medir con goniómetro el déficit entre la extensión activa máxima sostenida y la extensión pasiva completa; registrar además si sostiene la elevación de pierna recta sin caída de la rodilla.'
        ],
        campos: [
          { id: 'lag', et: 'Retraso extensor', tipo: 'num', unidad: '°', min: 0, max: 60 },
          { id: 'slr', et: 'Elevación de pierna recta sin retraso', tipo: 'sino' }
        ]
      },
      SECCION_DERRAME,
      {
        id: 'interlineas', titulo: 'Interlíneas articulares y portales',
        instrucciones: [
          'Paciente en decúbito supino con la rodilla en 90° de flexión y el pie apoyado en la mesa.',
          'Palpar la interlínea medial y la lateral de adelante hacia atrás con el pulgar; registrar si la palpación despierta dolor y su intensidad.',
          'Revisar los portales artroscópicos y heridas: cicatrización, eritema, secreción o dehiscencia.'
        ],
        campos: [
          { id: 'interlinea_med', et: 'Interlínea medial', tipo: 'ops', ops: [
            { v: 'no', et: 'No dolorosa' }, { v: 'leve', et: 'Dolorosa leve' },
            { v: 'marcada', et: 'Dolorosa marcada' } ] },
          { id: 'interlinea_lat', et: 'Interlínea lateral', tipo: 'ops', ops: [
            { v: 'no', et: 'No dolorosa' }, { v: 'leve', et: 'Dolorosa leve' },
            { v: 'marcada', et: 'Dolorosa marcada' } ] },
          { id: 'portales', et: 'Portales / heridas', tipo: 'ops', ops: [
            { v: 'normal', et: 'Cicatrización normal' },
            { v: 'alterada', et: 'Eritema / secreción / dehiscencia' } ] }
        ]
      },
      {
        id: 'perimetria', titulo: 'Perimetría de muslo',
        instrucciones: [
          'Paciente en decúbito supino, rodilla en extensión y musculatura relajada.',
          'Medir desde el polo superior de la rótula y marcar puntos a 10 cm y 15 cm en sentido proximal.',
          'Colocar la cinta perpendicular al eje del fémur sobre cada marca, ajustada sin comprimir la piel; registrar en cm y repetir en la extremidad contralateral.'
        ],
        campos: [
          { id: 'peri_10', et: '10 cm — operada', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_10_c', et: '10 cm — contralateral', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_15', et: '15 cm — operada', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 },
          { id: 'peri_15_c', et: '15 cm — contralateral', tipo: 'num', unidad: 'cm', min: 20, max: 100, paso: 0.1 }
        ],
        autos: [
          { id: 'dif_10', et: 'Diferencia a 10 cm', tipo: 'dif', de: ['peri_10', 'peri_10_c'], unidad: 'cm' },
          { id: 'dif_15', et: 'Diferencia a 15 cm', tipo: 'dif', de: ['peri_15', 'peri_15_c'], unidad: 'cm',
            nota: 'Una diferencia negativa indica atrofia del lado operado.' }
        ]
      },
      _dinamo('cuadriceps', 'Dinamometría de cuádriceps', INSTR_DINAMO_CUAD),
      _dinamo('isquios', 'Dinamometría de isquiotibiales', [
        'Paciente en decúbito prono, rodilla flexionada a 90°.',
        'Colocar el dinamómetro manual sobre la cara posterior de la pierna, inmediatamente proximal al talón; el explorador resiste sin ceder.',
        'Comando: «doble la rodilla contra mi mano con toda su fuerza». Contracción máxima de 5 segundos, 3 intentos, 30 segundos de descanso.',
        'Registrar cada intento en kilogramos, el mejor valor y el mejor valor contralateral.'
      ])
    ]
  }
};

/* El cociente isquiotibiales/cuádriceps (razón I/C) del lado operado se calcula
   en la vista de la evaluación de LCA cuando existen ambos "mejores". */

/* -------- Cálculo de los valores automáticos de una sección -------- */
function calcularAutos(seccion, valores) {
  if (!seccion.autos) return [];
  const res = [];
  const v = (id) => {
    // un auto puede depender de otro auto ya calculado
    const previo = res.find(a => a.id === id);
    if (previo) return previo.num;
    const x = parseFloat(valores[id]);
    return isNaN(x) ? null : x;
  };
  for (const a of seccion.autos) {
    const nums = a.de.map(v);
    let num = null;
    if (a.tipo === 'max') {
      const validos = nums.filter(n => n !== null);
      if (validos.length) num = Math.max(...validos);
    } else if (a.tipo === 'min') {
      const validos = nums.filter(n => n !== null);
      if (validos.length) num = Math.min(...validos);
    } else if (a.tipo === 'lsi') {
      if (nums[0] !== null && nums[1] !== null && nums[1] !== 0)
        num = nums[0] / nums[1] * 100;
    } else if (a.tipo === 'dif') {
      if (nums[0] !== null && nums[1] !== null) num = nums[0] - nums[1];
    }
    res.push({ ...a, num });
  }
  return res;
}

function formatoAuto(a) {
  if (a.num === null) return '—';
  const n = a.tipo === 'lsi' ? Math.round(a.num) : Math.round(a.num * 10) / 10;
  return (a.tipo === 'dif' && n > 0 ? '+' : '') + n + ' ' + a.unidad;
}

/* Semáforo clínico para el LSI de fuerza (criterio habitual ≥90 %). */
function claseLSI(a) {
  if (a.tipo !== 'lsi' || a.num === null) return '';
  if (a.num >= 90) return 'bueno';
  if (a.num >= 80) return 'medio';
  return 'malo';
}
