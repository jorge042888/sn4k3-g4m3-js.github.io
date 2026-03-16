# Sn4k3 G4m3

Juego de la serpiente en JavaScript (Canvas), con obstaculos dinamicos, estadisticas, sonido, branding actualizado y una interfaz optimizada para desktop y movil.

## Como ejecutar

- Abre `index.html` en un navegador moderno, o
- Sirve la carpeta con un servidor local (por ejemplo `npx serve .`) y accede a la URL indicada.

## Controles

En escritorio:

| Tecla | Accion |
|-------|--------|
| **Flechas** o **W A S D** | Mover la serpiente |
| **Espacio** | Pausar / reanudar |
| **Esc** | Volver a pantalla de inicio |

En movil:

- **Swipe tactil** sobre el tablero.
- **Botones tactiles** en pantalla (`arriba`, `abajo`, `izquierda`, `derecha`).
- **Boton de pausa** tactil junto al D-pad.

## Funcionalidades

- **Velocidad adaptativa**: la serpiente acelera conforme sube el score (6 niveles: desde 120 ms/tick hasta 56 ms/tick). El nivel actual se muestra en el header.
- **Ranking de inicio**: la pantalla de inicio muestra el Top 5 de jugadores con su mejor puntuacion.
- **Nuevo Record**: al superar el record anterior, la pantalla de `Game Over` muestra un badge animado.
- **Flash de muerte**: al chocar, el tablero hace un flash rojo breve antes de mostrar `Game Over`.
- **Boton de pausa movil**: boton dedicado junto al D-pad tactil para pausar/reanudar sin teclado.
- **Canvas nitido en Retina**: el canvas escala segun el `devicePixelRatio` del dispositivo para mayor resolucion en pantallas HiDPI.
- **Audio precargado**: los efectos de sonido se precargan tras la primera interaccion del usuario para reducir latencia.
- **Nombre de usuario**: al iniciar partida se solicita el nombre. Se muestra en `Game Over` y en el header como badge abreviado de 3 letras; al pasar el cursor o tocar el badge se revela el nombre completo. Por defecto: `Jugador`.
- **Input corregido**: el campo de nombre permite escribir normalmente letras como `A`, `W`, `S` y `D` sin disparar controles del juego mientras el foco esta en edicion.
- **Campo alineado a la UI**: el texto del input de nombre usa la paleta verde principal del juego.
- **Efectos de sonido**: sonidos locales para comida roja, comida verde, pausa y `game over`, cargados desde la carpeta `audio/`.
- **Fondo decorativo**: la interfaz usa una aurora estatica desde `imagenes/fondo1.jpg`, tratada con blur y capas tenues para mantener contraste con el tablero y overlays.
- **Comida roja (normal)**: suma `+10` puntos y hace crecer la serpiente.
- **Obstaculos**: cada vez que la serpiente come una comida roja, aparece un bloque hazard aleatorio de `1x1` celda. Chocar con el bloque termina la partida.
- **Comida verde (shrink)**: aparece aleatoriamente (`20%` de probabilidad por spawn), muestra indicador `x1`, `x2` o `x3`, y reduce la longitud de la serpiente segun ese valor (sin bajar del minimo jugable).
- **Animacion de reduccion**: al comer comida verde se renderiza una animacion de disolucion en los segmentos removidos y texto flotante `-N`.
- **Contadores de partida**: en `Game Over` se muestran:
  - `Comiste` (rojos + verdes).
  - `Obstaculos` generados en la partida.
- **Estadisticas**: boton `Estadisticas` en el header. Muestra partidas jugadas, mejor puntuacion, puntuacion media, total de puntos, y dos graficas (puntuacion y duracion por partida) con numeros en barras y linea de tendencia.
- **Reset de estadisticas**: el modal permite reiniciar historial y record guardados con confirmacion previa.
- **Persistencia**: record e historial de partidas (ultimas 100) en `localStorage`; cada partida guarda puntuacion, nombre, fecha y duracion.
- **Mejor jugador**: en la pantalla de inicio se muestra automaticamente el nombre del jugador con mayor puntuacion registrada y se pre-rellena el campo de nombre con ese valor.
- **Ventana de reglas**: boton `Reglas del juego` en el pie de pagina.
- **Marca actual**: el encabezado muestra `Sn4k3 G4m3` junto a un icono cargado desde `imagenes/Snake.ico`. Si el archivo no existe, el logo se oculta automaticamente.
- **Controles moviles renovados**: el pad tactil ahora usa un D-pad compacto, con mejor separacion y mas precision visual/tactil.

## Estructura del proyecto

```text
snake-game-js/
|-- index.html
|-- audio/
|   |-- comida_roja.mp3
|   |-- comida_verde.mp3
|   |-- game_over.mp3
|   `-- pause.mp3
|-- css/
|   `-- styles.css
|-- imagenes/
|   |-- fondo1.jpg
|   `-- Snake.ico
|-- js/
|   |-- game.js
|   `-- stats.js
|-- README.md
|-- CHANGELOG.md
`-- SECURITY.md
```

## Estructura final activa

- `index.html` carga solo `css/styles.css`, `js/game.js` y `js/stats.js`.
- Los archivos legacy en la raiz (`game.js`, `stats.js`, `styles.css`) ya no forman parte de la version final.

## Tecnologias

- HTML5, CSS3, JavaScript (vanilla)
- Canvas API para el juego y las graficas
- `localStorage` para record e historial de partidas

## Documentacion complementaria

- [CHANGELOG.md](CHANGELOG.md) - Cambios realizados por version.
- [SECURITY.md](SECURITY.md) - Seguridad, privacidad y assurance de la aplicacion.
