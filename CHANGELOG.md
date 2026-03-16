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

### 12. Rebranding y mejoras visuales recientes

- La marca visible del juego se actualizo de `Snake JS` a `Sn4k3 G4m3`.
- El `Game Over` simplifico sus metricas a `Comiste` y `Obstaculos`.
- Los obstaculos pasaron a renderizarse como hazard blocks mas evidentes, sin cambiar la mecanica.
- Los controles moviles se redisenaron como un D-pad compacto con mejor precision y uso de espacio.
- Se reemplazo el intento de fondo en video por una imagen estatica `imagenes/fondo1.jpg` con tratamiento visual tenue para mantener legibilidad.
- `README.md`, `CHANGELOG.md` y `SECURITY.md` se actualizaron para reflejar esta version activa.

---

Para mas detalle sobre seguridad y datos, ver [SECURITY.md](SECURITY.md).
