# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

## Cambios realizados (ultima actualizacion)

### 1. Documentacion base

- Se agregaron y organizaron `README.md`, `CHANGELOG.md` y `SECURITY.md`.

### 2. Graficas de estadisticas

- Se anadieron numeros visibles sobre barras.
- Se incorporo linea de tendencia por regresion lineal en puntuacion y duracion.

### 3. Obstaculos / muros

- Cada comida roja genera un obstaculo aleatorio de `1x1`.
- Colisionar con obstaculo termina la partida.
- Se mejoro el estilo visual de obstaculos con brillo en tonos `#EB8DFC`.

### 4. Nombre de usuario en partida

- Se solicita nombre al iniciar.
- Se muestra nombre en header y en `Game Over`.
- Se guarda en historial de partidas (`playerName`).

### 5. Ajustes visuales de serpiente y efectos

- Color base de serpiente en cyan (`#38CDEB`) con gradientes.
- Efectos de recoleccion actualizados a la misma paleta.

### 6. Mejor jugador y ventana de reglas

- Se calcula mejor jugador desde `snake-game-stats`.
- Se anadio modal de reglas desde el footer.

### 7. Control movil por swipe

- Se migro de flechas moviles iniciales a gesto swipe sobre el tablero.

### 8. Estabilidad y UX de overlays

- `Escape` no reinicia si hay overlays abiertos.
- `spawnFood()` usa intentos acotados + fallback para evitar loops infinitos.
- Al abrir estadisticas se pausa la partida y se reanuda al cerrar si aplica.

### 9. Nuevas mecanicas y UI

- Se agrego comida verde aleatoria (`20%`) con indicador `x1/x2/x3`.
- La comida verde reduce la serpiente (sin bajar del minimo), no suma puntos y no genera obstaculos.
- Se agrego animacion de reduccion con disolucion de segmentos y texto flotante `-N`.
- Se anadieron contadores de partida en `Game Over`:
  - Circulos comidos (rojos + verdes).
  - Cuadros aleatorios generados.
- En movil ahora conviven ambos controles:
  - Swipe sobre canvas.
  - Botones tactiles `arriba/abajo/izquierda/derecha`.

### 10. Ajustes recientes de UX, estado y branding

- El nombre del jugador en header se reemplazo por un badge abreviado de 3 letras para evitar colapsos visuales.
- El badge del jugador ahora revela el nombre completo al pasar el cursor en PC o al tocar/click en pantallas tactiles.
- El input de nombre ya no bloquea letras `A`, `W`, `S` ni `D`; los atajos del juego se ignoran mientras el foco esta en un campo editable.
- El texto del input de nombre se alineo con la paleta verde principal del juego.
- El modal de estadisticas ahora permite resetear historial y record mediante confirmacion.
- El logo activo del proyecto se documento desde `imagenes/Snake.ico`.
- Se actualizo la documentacion (`README.md`, `CHANGELOG.md` y `SECURITY.md`) para reflejar el estado real de la app.

### 11. Audio y limpieza de version final

- Se agrego soporte de efectos de sonido locales desde `audio/` para comida roja, comida verde, pausa y `game over`.
- Se comento la logica principal de `js/game.js` y `js/stats.js` en los bloques de flujo menos evidentes.
- Se eliminaron de la version final los archivos redundantes de la raiz (`game.js`, `stats.js`, `styles.css`).
- La estructura documentada ahora refleja solo los archivos activos que carga `index.html`.

### 13. Mejoras de gameplay, UX y rendimiento

- **Velocidad adaptativa**: el intervalo de tick se reduce automaticamente al subir el score (120 ms → 108 → 95 → 80 → 68 → 56 ms en seis niveles). El nivel se muestra en el header como "Vel.".
- **Leaderboard en pantalla de inicio**: muestra el Top 5 de jugadores (mejor puntuacion por nombre) calculado desde `snake-game-stats`. Se oculta si no hay partidas.
- **Badge de Nuevo Record**: al superar el record anterior, la pantalla de `Game Over` muestra un badge animado con efecto pop.
- **Flash de muerte**: animacion roja de ~520 ms sobre el tablero antes de mostrar `Game Over`, mejorando la retroalimentacion visual.
- **Boton de pausa tactil**: nuevo boton `⏸` junto al D-pad en movil; funciona con `touchstart` y `click`.
- **Canvas HiDPI**: el canvas de juego ahora escala con `devicePixelRatio` (max ×2) para renderizado nitido en pantallas Retina.
- **Audio precargado**: `preloadAudio()` clona instancias precargadas en lugar de crear `new Audio()` desde cero en cada sonido.
- **Flujo de inicio mejorado**: `Esc` y "Jugar de nuevo" llevan a la pantalla de inicio (con leaderboard actualizado) en lugar de reiniciar instantaneamente; `Iniciar partida` permite arrancar de inmediato.
- **Overlay scrollable**: el contenido de los overlays puede hacer scroll en pantallas muy pequenas para que nada quede cortado.

### 12. Rebranding y mejoras visuales recientes

- La marca visible del juego se actualizo de `Snake JS` a `Sn4k3 G4m3`.
- El `Game Over` simplifico sus metricas a `Comiste` y `Obstaculos`.
- Los obstaculos pasaron a renderizarse como hazard blocks mas evidentes, sin cambiar la mecanica.
- Los controles moviles se redisenaron como un D-pad compacto con mejor precision y uso de espacio.
- Se reemplazo el intento de fondo en video por una imagen estatica `imagenes/fondo1.jpg` con tratamiento visual tenue para mantener legibilidad.
- `README.md`, `CHANGELOG.md` y `SECURITY.md` se actualizaron para reflejar esta version activa.

### 14. Power-ups, combo, mejoras visuales y dinamicas

- **Power-ups** en tablero: tras cada comida roja hay 20% de probabilidad de aparecer un power-up durante 6 s. Tres tipos: `ESCUDO` (cyan, absorbe 1 golpe), `LENTO` (amarillo, +55% tick durante 7 s), `2X PTS` (morado, doble puntos durante 7 s). Los power-ups parpadean en los ultimos 2 s de vida y desaparecen solos si no se recogen. Los efectos activos se muestran como barras de progreso en la esquina superior derecha del canvas.
- **Sistema de combo**: comer multiples comidas rojas en menos de 2,5 s acumula un multiplicador (hasta x4). Se muestra el indicador `COMBO xN` en el canvas. El combo se reinicia al comer comida verde o al expirar la ventana.
- **Texto flotante de puntos**: al comer aparece un `+N` animado sobre la comida. El color es blanco (normal), dorado (combo activo) o morado (2X PTS activo).
- **Banner de subida de nivel**: al superar cada umbral de velocidad aparece un banner `NIVEL N` animado centrado en el tablero (fade-in + scale + fade-out en 1,6 s).
- **Screen shake**: al morir el canvas-container aplica una animacion CSS de vibrado de 520 ms.
- **Serpiente con gradiente de cola**: los segmentos reducen radio y alpha hacia la cola para dar sensacion de profundidad.
- **Comida animada**: la comida roja y verde pulsan suavemente usando `Math.sin(now / 280)`.
- **Glow de escudo activo**: mientras `ESCUDO` esta activo, la cabeza de la serpiente muestra un anillo cyan pulsante.
- **Game Over ampliado**: se agrego tiempo de partida (`go-time-played`), delta vs record (`go-delta-score` con color verde/rojo) y boton `Compartir` (usa `navigator.share` o copia al portapapeles).
- **Power-up en isCellFree**: la generacion de obstaculos, comida y power-ups ahora evita superponerse entre si.
- **Orbs de fondo animados**: `bg-orb-left` y `bg-orb-right` tienen animacion CSS `orbFloat` / `orbFloatR` con ciclos de 9 y 11 s respectivamente. Deshabilitada con `prefers-reduced-motion`.
- **Reglas actualizadas**: el modal de reglas documenta el combo y los power-ups.

---

Para mas detalle sobre seguridad y datos, ver [SECURITY.md](SECURITY.md).
