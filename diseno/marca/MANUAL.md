# MAIA Escalas · manual de identidad

Manual de una sola app. Todo lo de marca que esta app necesita está aquí y en esta carpeta; no hace falta consultar otro documento.

## 1. Nombre

**MAIA Escalas**

MAIA significa **Medicina Asistida por Inteligencia Artificial**. El significado es fijo y no cambia entre apps. El nombre se escribe siempre `MAIA Escalas`, con `MAIA` en versalitas del mismo tamaño que la palabra, nunca `Maia`, nunca `MAIA-Escalas`, nunca la palabra sola.

- Título de ventana, `<title>`, splash, encabezados, pies de PDF y correos: `MAIA Escalas`.
- Identificador técnico / slug: `maia-escalas`.

## 2. Qué es esta app

Escalas de evaluación ortopédica aplicadas en consulta —IKDC, Lysholm, KOOS, WOMAC— y su comparación a lo largo de los meses.

Se llena en el iPad con el paciente enfrente, tocando opciones. Áreas de toque nunca por debajo de 44 px.

## 3. El logotipo

El isotipo de MAIA es un **nodo**: tres puntos en triángulo unidos por tres aristas. Los dos primeros puntos y las tres aristas son **idénticos en las seis apps** —mismas coordenadas, mismo grosor— y no se modifican nunca. Lo único propio de esta app es el **tercer nodo**, el inferior derecho.

### Tercer nodo de MAIA Escalas

**Barras de puntaje.** La rodilla medida en números que suben consulta tras consulta: tres barras ascendentes.

### Archivos en esta carpeta

| Archivo | Cuándo se usa |
|---|---|
| `isotipo-dark.svg` | fondo oscuro, isotipo a 56 px o más (tema por defecto de la app) |
| `isotipo-light.svg` | fondo claro, isotipo a 56 px o más |
| `isotipo-small-dark.svg` | fondo oscuro, 24–48 px: el nodo es punto de color, sin símbolo |
| `isotipo-small-light.svg` | fondo claro, 24–48 px |
| `isotipo-favicon-dark.svg` | 20 px o menos: sólo los tres puntos, sin aristas |
| `isotipo-favicon-light.svg` | 20 px o menos, fondo claro |
| `icon-1024.png` | ícono de app iOS/iPadOS/macOS · 1024×1024, sin transparencia, esquinas cuadradas |
| `icon-180.png` | apple-touch-icon |

Todos los SVG son vectoriales, sin fuentes embebidas y con `viewBox="0 0 100 100"`: escalan a cualquier tamaño sin pérdida.

### Regla dura de tamaño

| Alto del isotipo | Qué se muestra |
|---|---|
| ≥ 56 px | nodo con su símbolo |
| 24–48 px | nodo como punto de color, sin símbolo |
| ≤ 20 px | tres puntos, sin aristas |

Nunca se renderiza el símbolo por debajo de 56 px: a ese tamaño se convierte en una mancha y ensucia la marca.

### Logotipo horizontal

Isotipo + texto, alineados por el centro óptico:

- Isotipo a **40 px** de alto (archivo `-small-`), separación al texto = 0.45 × el alto del isotipo.
- Texto `MAIA Escalas` en una sola línea, `letter-spacing: 0.16em`, `MAIA` en peso regular y `Escalas` en medium.
- Tamaño del texto ≈ 0.46 × el alto del isotipo (a 40 px de isotipo, 18–19 px de texto).
- Alto mínimo del logotipo horizontal: **28 px**. Por debajo, sólo isotipo.

### Logotipo apilado

Isotipo arriba, `MAIA` y `Escalas` en dos renglones centrados debajo. Para splash, membrete y documentos.

### Zona de respeto

Alrededor del isotipo y del logotipo se deja libre un margen igual al **radio de un nodo** (11.5 % del ancho del isotipo). Nada entra en esa zona: ni texto, ni bordes, ni otro logo.

## 4. Color

| | Hex | OKLCH |
|---|---|---|
| Turquesa medición · tema oscuro | `#0090A9` | `oklch(0.60 0.11 215)` |
| Turquesa medición · tema claro | `#007187` | `oklch(0.50 0.10 215)` |
| Tinta | `#17181A` | — |
| Tinta invertida | `#FFFEFB` | — |
| Fondo del ícono de app | `#22252B` | — |

```css
:root {
  --maia-accent: #0090A9;        /* tema oscuro, el de por defecto */
  --maia-accent-light: #007187;      /* tema claro */
  --maia-ink: #FFFEFB;
  --maia-ink-inverse: #17181A;
  --maia-icon-bg: #22252B;
}
```

El color no decora: **identifica**. Se usa en el tercer nodo, en el botón primario, en el estado activo y en los enlaces. Todo lo demás va en tinta neutra. Una pantalla de MAIA Escalas con acento por todos lados deja de distinguirse de las otras cinco apps.

La app que el paciente toca. El turquesa marca la opción seleccionada y la línea de evolución en las gráficas; el resto de la interfaz permanece neutra para que el dato resalte.

Los seis colores de la familia comparten luminosidad y croma; sólo cambia el matiz. Si algún día hace falta un tono nuevo para esta app, se deriva del suyo variando la luminosidad, nunca introduciendo otro matiz.

## 5. Tipografía

Provisional, a confirmar para las seis apps a la vez: **Helvetica Neue** (interfaz y logotipo) e **IBM Plex Mono** (etiquetas, descriptor de MAIA y datos). Cuando se defina la tipografía con licencia, se cambia en las seis el mismo día.

## 6. Dónde aparece la identidad en esta app

1. **Ícono de app** en la pantalla de inicio, junto a las otras cinco: `icon-1024.png`.
2. **Logotipo horizontal** a 40 px de alto en la barra lateral y en la barra superior del teléfono.
3. **Pantalla de entrada**: isotipo a 96 px, `MAIA` a 40 px con `letter-spacing: 0.22em` y debajo, en monoespaciada y mayúsculas, *Medicina Asistida por Inteligencia Artificial* en dos renglones.
4. **Favicon** de pestaña: `isotipo-favicon-dark.svg`.
5. **PDF**: logotipo apilado en versión clara, junto al membrete del médico.

## 7. Qué se le pide al diseñador (y qué de eso ya está aquí)

| Entregable | Estado |
|---|---|
| Isotipo en SVG (vectorial, cualquier tamaño) | ✅ `isotipo-dark.svg` / `isotipo-light.svg` |
| Logotipo horizontal en SVG, fondo claro y fondo oscuro | ⏳ armado por código con isotipo + texto según §3; SVG de un solo archivo pendiente hasta fijar la tipografía |
| Ícono de app PNG 1024×1024, sin transparencia, esquinas cuadradas | ✅ `icon-1024.png` — fondo sólido, esquinas cuadradas, iOS redondea |
| Logotipo apilado, claro y oscuro | ⏳ mismo caso que el horizontal |
| Favicon | ✅ `isotipo-favicon-dark.svg` / `-light.svg` |
| Tipografía con licencia | ⏳ pendiente, decisión común a las seis |

El logotipo horizontal y el apilado quedan pendientes como archivo único **a propósito**: mientras la tipografía no esté decidida, se arman en código con el isotipo SVG más el texto, siguiendo §3. Así no hay que rehacerlos cuando cambie la fuente.

## 8. Lo que no se toca

- La parte común del nodo: dos puntos y tres aristas, mismas coordenadas y grosor que en las otras cinco apps. Es lo único que las hermana y se ven juntas todo el tiempo.
- El significado de MAIA.
- El símbolo y el color de esta app: barras de puntaje y turquesa medición son de MAIA Escalas y de ninguna otra.
