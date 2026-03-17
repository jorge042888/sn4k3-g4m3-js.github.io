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

- **Velocidad adaptativa**: la serpiente acelera cada 5 comidas rojas (50 pts), 6 niveles desde 120 ms/tick hasta 56 ms/tick. El nivel se muestra en el header.
- **Power-ups**: tras cada comida roja hay un 20% de probabilidad de que aparezca un power-up en el tablero durante 6 segundos. Tres tipos:
  - **ESCUDO** (cyan): absorbe una colision con cuerpo u obstaculo.
  - **LENTO** (amarillo): reduce la velocidad un 55% durante 7 s.
  - **2X PTS** (morado): dobla los puntos obtenidos durante 7 s.
- **Sistema de combo**: comer varias comidas rojas en menos de 2,5 s activa un multiplicador (x2, x3, x4). Se muestra en el tablero y se refleja en el texto flotante de puntos.
- **Texto flotante de puntos**: al comer aparece `+N` animado sobre la comida; el color indica si hay combo (dorado) o 2X (morado).
- **Banner NIVEL**: al subir de nivel aparece un banner animado centrado en el tablero.
- **Screen shake**: al morir, el tablero trepida brevemente.
- **Serpiente con gradiente**: el cuerpo se vuelve mas tenue hacia la cola para mayor sensacion de profundidad.
- **Comida animada**: la comida pulsa suavemente en bucle.
- **Ranking de inicio**: la pantalla de inicio muestra el Top 5 de jugadores con su mejor puntuacion.
- **Nuevo Record**: al superar el record anterior, la pantalla de `Game Over` muestra un badge animado y el delta `+N vs record`.
- **Flash de muerte**: al chocar, el tablero hace un flash rojo breve antes de mostrar `Game Over`.
- **Game Over ampliado**: muestra tiempo de partida, delta vs record y boton `Compartir` (usa `navigator.share` en movil o copia al portapapeles en desktop).
- **Boton de pausa movil**: boton dedicado junto al D-pad tactil para pausar/reanudar sin teclado.
- **Canvas nitido en Retina**: el canvas escala segun el `devicePixelRatio` del dispositivo para mayor resolucion en pantallas HiDPI.
- **Audio precargado**: los efectos de sonido se precargan tras la primera interaccion del usuario para reducir latencia.
- **Nombre de usuario**: al iniciar partida se solicita el nombre. Se muestra en `Game Over` y en el header como badge abreviado de 3 letras; al pasar el cursor o tocar el badge se revela el nombre completo.
- **Efectos de sonido**: sonidos locales para comida roja, comida verde, pausa y `game over`.
- **Fondo decorativo**: aurora estatica desde `imagenes/fondo1.jpg` con orbs animados en CSS.
- **Comida roja (normal)**: suma puntos segun combo y multiplicadores activos; hace crecer la serpiente.
- **Obstaculos**: cada comida roja genera un bloque hazard `1x1`. Chocar con el bloque termina la partida (o consume el escudo).
- **Comida verde (shrink)**: `20%` de probabilidad, reduce la serpiente segun indicador `x1/x2/x3`.
- **Estadisticas**: historial de partidas con graficas de puntuacion y duracion con linea de tendencia.
- **Persistencia**: record e historial (ultimas 100 partidas) en `localStorage`.

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
