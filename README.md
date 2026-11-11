# Línea directa a Saltadilla

Escena 3D interactiva a pantalla completa, inspirada en las Chicas Superpoderosas. Soy Johana Dávila y diseñé la propuesta artística para el segundo parcial de Diseño y Programación Web II.

## Cómo interactuar

- Arrastrá la escena para orbitar alrededor del teléfono y usá la rueda o un gesto de pellizco para acercarte o alejarte.
- Mové el cartel 3D arrastrándolo desde el marco o una zona libre de botones.
- Tocá el teléfono o elegí **Llamar** en el cartel. Cuando suene el timbre, elegí **Atender** para leer el mensaje. Con el sonido activado, empieza la música y el cielo pasa a modo noche con estrellas y focos rosa, verde y celeste. Al terminar la música, vuelve al modo de iluminación elegido.
- Usá los botones de sonido y de luna para silenciar el audio o cambiar entre día y noche. Las macetas y la birome también reaccionan al toque.

## Cómo lo hice

Usé **Three.js** para construir y renderizar la escena, y **Raycaster** para detectar qué objeto toca o selecciona el usuario. Con **GSAP** animé la transición entre día y noche, las guirnaldas, la ráfaga de viento, el cartel y el salto de la birome.

El teléfono es un modelo de Sketchfab. Modelé el resto del decorado con geometrías de Three.js, incluida la mesa, las macetas, el arcoíris, la birome y el cartel.

## Cómo abrir el proyecto

Instalá Node.js 24, descargá el proyecto y abrí su carpeta en VS Code. En la terminal ejecutá:

```bash
npm ci
npm run dev
```

Abrí el enlace local que muestra la terminal.

## Créditos

- **Diseño artístico y modelado del decorado** · Johana Dávila.
- **Modelo del teléfono** · [PowerPuff Girls Phone, de ZZBIGGY](https://sketchfab.com/3d-models/powerpuff-girls-phone-17023c5ae5184729a6b6874fb7bb3fcd), licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). El modelo se reescaló y se ajustaron sus materiales al integrarlo.
- **Textura de césped** · [Grass 004 de ambientCG](https://ambientcg.com/view?id=Grass004), licencia CC0.
