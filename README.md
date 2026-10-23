# Terre Rouge Iguazú: sitio web

Web de una sola página para **Terre Rouge, Café & Patisserie**, en Av. Brasil y San Martín, Puerto Iguazú.
Es HTML, CSS y JS sin framework. Se usa la misma página en celular y en escritorio.

## Cómo verla

```bash
cd terre-rouge
python3 -m http.server 8000   # o cualquier servidor estático
# abrir http://localhost:8000
```

Hace falta un servidor (no `file://`), porque las lámparas 3D se cargan como módulo ES.

## Cómo editar la carta

La carta completa (172 ítems, con precios y fotos) está en `data/menu.json`.
El HTML se genera a partir de `src/template.html`:

```bash
node build.mjs   # regenera index.html
```

No edites `index.html` a mano: se sobrescribe. Los textos de la página están en `src/template.html`,
y los momentos de "Hora por hora" están en `build.mjs` (`MOMENTS`).

## Qué hay en la página

- **Lámparas 3D** (`js/lamps.js`, Three.js r160 en `vendor/`): las lámparas de mimbre del alero, tejidas y encendidas
  según la hora real de Iguazú. Si el navegador no tiene WebGL, se muestran dibujadas en SVG.
- **Hora por hora**: un control deslizante de 7 a 23 h que cambia el color de la sección del día a la noche,
  enciende las lámparas y muestra qué se sirve a esa hora, con platos reales de la carta.
- **La carta**: pestañas por categoría, buscador y vista previa grande al pasar el mouse (escritorio).
- **Reservas**: el formulario arma un mensaje de WhatsApp al +54 9 3757 63-7686.
- **Mapa**: Google Maps embebido. Debajo queda un plano dibujado de la esquina por si el mapa no carga.
- **Dos menús de tres pasos**: los platos que la casa presentó en Instagram (Día de la Madre) y que quedan en la carta, con un video corto de esos platos (`media/menus-loop.mp4`, armado desde su reel solo con tomas de los platos).
- **Lo último en Instagram**: los posts más recientes de @terrerougeiguazu (sin los que muestran a la chica de los reels), cada uno con enlace al post. Para actualizarlos, cambiá la lista `IG` en `build.mjs` y las imágenes en `img/ig/`.

## Fuentes de los datos y las fotos

- Carta, precios y fotos de platos: la carta digital del local, soymenu.com.ar/terrerougeiguazu.
- Fachada de noche: nota de Economis (febrero de 2025).
- Fachada de día: foto de Fabián Zeballos en Google Maps (nov. 2025).
- Dirección, teléfono, horario (todos los días de 7 a 23) y nota 4,3: Google Maps.
- Posts, fotos, textos, el lema «Degustá el momento. Disfrutá la experiencia.» y el video de platos: Instagram @terrerougeiguazu (posts del 29/9 al 19/10/2026).

Antes de publicar, conviene que el local confirme las fotos de terceros (o las reemplace por fotos propias),
los precios y los horarios de cada momento de "Hora por hora", que son una propuesta.
