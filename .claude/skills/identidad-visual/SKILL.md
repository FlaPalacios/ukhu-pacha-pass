---
name: identidad-visual
description: Identidad visual de Ukhu Pacha Pass, con paleta, tipografías, estados, motivos cusqueños y reglas de diseño. Úsala siempre que, dentro del proyecto Ukhu Pacha Pass, se cree o modifique una pantalla, componente, estilo, logo, correo con diseño o texto visible, aunque el usuario no mencione el diseño. Incluye la pantalla funcional de la puerta. No aplica a otros proyectos.
---

# Identidad visual de Ukhu Pacha Pass

Fiesta de Halloween con identidad cusqueña. Ukhu Pacha es el "mundo de adentro" en la cosmovisión andina, y la fecha coincide con la época de las ánimas y Todos los Santos. Tono festivo, oscuro y con carácter, sin verse como una plantilla genérica. Fuente de verdad completa en `docs/plan.md`, sección 11.

## Colores (variables CSS o tokens de Tailwind, no valores sueltos)

| Uso | Color |
|---|---|
| Fondo de página | `#0A0A0A` |
| Tarjetas | `#141414` |
| Bordes finos | `#1E1E1E` |
| Morado base (secciones, cabeceras, etiquetas) | `#382054` |
| Morado oscuro (bloques destacados) | `#22123A` |
| Naranja (botón principal y acentos) | `#F7931E` |
| Amarillo (títulos principales y logo) | `#F2E94A` |
| Verde menta (válido, pagado, confirmaciones) | `#1FDB8A` |
| Rosa (errores, alertas, borde de botón secundario) | `#E8317F` |
| Texto principal | `#EDF3EF` |
| Texto sobre naranja, amarillo y menta | `#0A0A0A` |

No usar verde lima ni morado claro.

## Reglas de uso

- Un solo color de acento dominante por pantalla.
- Amarillo solo para títulos y logo. Naranja solo para la acción principal.
- Menta significa "bien" y rosa significa "problema". Nunca de forma decorativa.
- Sin degradados, sin brillos ni sombras difusas. Bordes de 1 px y esquinas de 4 px.
- Sin emojis. Sin íconos genéricos en cuadrículas de tres tarjetas. Sin portadas con frases vacías.
- Información real y concreta (fecha, hora, precio, cómo pagar). Pocas pantallas, mucho espacio, jerarquía clara.

## Estados

Pendiente en naranja. Pagado en menta. Ingresado en morado base con texto claro. Cancelado en gris sobre fondo oscuro. Error o alerta en rosa.

## Tipografía

- **IM Fell DW Pica** para títulos, botones y texto de la parte pública. Cuerpo de al menos 18 px, porque pierde legibilidad en tamaños pequeños.
- **Lora** para textos pequeños, tablas, formularios del panel y números (conteos, montos, códigos).
- **Abraham Lincoln** solo para el logo y solo si se compró la licencia. Si no, el logo se resuelve con IM Fell DW Pica.
- Cargar las fuentes con `next/font`.

## Identidad cusqueña

- Chakana (cruz andina escalonada) en SVG simple para logo, separadores y favicon.
- Franja escalonada fina inspirada en textiles, como borde decorativo.
- Silueta de cerros (apus) en morado oscuro al pie de la portada, con una luna delgada.
- Subtítulo del nombre: "Ukhu Pacha, el mundo de adentro".
- Textos cortos y con personalidad. Si se usan palabras en quechua, que las revise una persona que lo hable.

## Pantalla de la puerta (`/puerta`)

Es funcional, no decorativa. Botones enormes, resultado a pantalla completa en menta (válido) o rosa (problema), sin adornos, legible con poca luz. El aviso de menor debe destacar y no confundirse con "válido".

## Revisión rápida antes de terminar una pantalla

- Se ve bien en ancho de celular.
- Contraste suficiente. Texto oscuro sobre naranja, amarillo y menta.
- Un solo acento dominante.
- Sin emojis ni degradados ni sombras.
- Textos en español, concretos y sin frases de relleno.
