# CORE Scale

App para iPad y iPhone de **evaluación objetiva postoperatoria de ortopedia**:
goniometría, dinamometría y escalas funcionales, con seguimiento por paciente a
lo largo de sus citas. Pensada para el consultorio del Dr. Israel Romo y para
conectarse en el futuro con el expediente electrónico **COREGDL**.

Es una **app web instalable (PWA)**: se abre en Safari y con
*Compartir → Agregar a pantalla de inicio* queda como una app más, a pantalla
completa y funcionando **sin internet**. Está previsto convertirla en app
nativa (SwiftUI) cuando haya Xcode disponible; los datos y el diseño se migran.

## Qué hace

- **Pacientes** → **cirugías/tratamientos** (episodios) → **citas** con
  evaluaciones y escalas. La semana postoperatoria se calcula sola a partir de
  la fecha de cirugía.
- **4 plantillas de evaluación** transcritas de las hojas impresas de la serie
  "Evaluación" (carpeta Dinamómetro): cirugía de hombro, reconstrucción LPFM,
  prótesis total de rodilla y reconstrucción LCA. Cada sección trae el recuadro
  **"Cómo se hace"** con las instrucciones completas de la hoja.
- **Cálculos automáticos**: mejor de 3 intentos, índice de simetría (LSI,
  operado/contralateral, semáforo con meta ≥90 %), diferencias de perimetría,
  mejor tiempo del TUG (con **cronómetro integrado**, igual que el conteo de 30 s
  del STS), razón isquiotibiales/cuádriceps en LCA.
- **Escalas funcionales** con flujo guiado (una pregunta a la vez) y
  **puntuación automática**: EVA numérica, SANE, QuickDASH, DASH, Lysholm,
  Kujala, IKDC subjetivo 2000 y KOOS JR, más el nivel de actividad de Tegner.
  La app sugiere cuáles aplican según la cirugía.
- **Evolución**: gráficas por métrica a lo largo de las citas (fuerza operado
  vs contralateral, LSI con línea de meta, movilidad, perimetría, TUG/STS y
  cada escala).
- **Resumen copiable** de cada evaluación, listo para pegar en el expediente.
- **Respaldo**: exportar/importar todo en JSON (Ajustes), y exportación por
  paciente en el formato de intercambio pensado para COREGDL.

## Privacidad

**Nada sale a internet.** Los datos de pacientes viven en el almacenamiento del
navegador **de cada dispositivo** (IndexedDB). El código de la app no contiene
ningún dato clínico, así que el repositorio puede publicarse sin riesgo.
Consecuencia importante: **el respaldo es responsabilidad del usuario** — botón
"Descargar respaldo completo" en Ajustes, guardarlo en Archivos/iCloud.

## Verificación clínica de las escalas

Los puntos por opción y las fórmulas se verificaron (2026-09-01) contra:

- DASH/QuickDASH → PDFs oficiales de puntuación del Institute for Work & Health
- IKDC Subjetivo 2000 → formulario e instrucciones oficiales (AOSSM);
  el ítem 10a no se puntúa; fórmula suma/87×100 y regla oficial de faltantes
- KOOS JR → instrucciones oficiales de HSS con la tabla completa cruda→0-100
- Lysholm → Tegner & Lysholm 1985 (bandas 95-100/84-94/65-83/≤64)
- Kujala → validación con tabla de puntos completa (PMC10773022)
- Tegner → tabla reproducida en validación publicada

**No cambiar puntos ni fórmulas sin volver a la fuente.** Solo se muestran
bandas de interpretación donde existen publicadas (Lysholm); en el resto se
indica la dirección (mayor/menor es mejor) sin inventar cortes.

**Licencias**: DASH y QuickDASH son © IWH — uso clínico no comercial; si la app
se distribuye, hay que pasar por su proceso de autorización (dash.iwh.on.ca).
KOOS JR es de uso libre (HSS) sin alterar el cuestionario. IKDC es gratuito
(AOSSM) sin modificarlo. Lysholm/Kujala/Tegner: uso libre. **WOMAC y Oxford NO
se incluyeron** porque requieren licencia de pago.

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` | Cascarón de la app (una sola página) |
| `js/db.js` | Almacenamiento local (IndexedDB) + respaldo exportar/importar |
| `js/plantillas.js` | Las 4 plantillas de evaluación, con instrucciones y autocálculos |
| `js/escalas.js` | Escalas funcionales: ítems, puntos y fórmulas verificadas |
| `js/eval.js` | Captura guiada (acordeón + cronómetro) y vista de evaluación |
| `js/escala-ui.js` | Flujo de escala: intro → pregunta por pregunta → resultado |
| `js/evolucion.js` | Series de evolución por plantilla y por escala |
| `js/graficas.js` | Gráficas SVG propias (sin librerías: la app es offline) |
| `js/app.js` | Navegación, pacientes, episodios, ajustes |
| `sw.js` + `manifest.webmanifest` | Instalable y sin internet (PWA) |

## Correr en desarrollo

```bash
cd core-scale && python3 -m http.server 8791 --bind 127.0.0.1
```

y abrir <http://127.0.0.1:8791>. No hay dependencias ni compilación.

## Para tenerla en el iPad

La PWA necesita servirse por **HTTPS** (el service worker no funciona por HTTP
en red local). Opción recomendada: **GitHub Pages** — el código no contiene
datos de pacientes, y cada dispositivo guarda lo suyo localmente. Al publicar
cambios basta recargar la app para actualizarla (subir `VERSION` en `sw.js`).

## Integración con COREGDL (pendiente)

Cada paciente admite un campo **"ID en COREGDL"** y la exportación por paciente
produce un JSON con todo su historial (`app`, `formato`, `paciente`,
`episodios[].evaluaciones/escalas`). Cuando el expediente del colega exponga un
API, ese mismo formato es el punto de partida del enlace directo.
