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

### 9. Nuevas mecanicas y UI (implementacion actual)

- Se agrego comida verde aleatoria (`20%`) con indicador `x1/x2/x3`.
- La comida verde reduce la serpiente (sin bajar del minimo), no suma puntos y no genera obstaculos.
- Se agrego animacion de reduccion con disolucion de segmentos y texto flotante `-N`.
- Se anadieron contadores de partida en `Game Over`:
  - Circulos comidos (rojos + verdes).
  - Cuadros aleatorios generados.
- En movil ahora conviven ambos controles:
  - Swipe sobre canvas.
  - Botones tactiles `arriba/abajo/izquierda/derecha`.
- Se agrego soporte de logo configurable junto a `Snake JS` (`assets/logo.ico`) con fallback seguro si falta el archivo.
- Se actualizaron `README.md` y comentarios en bloques complejos de `js/game.js`.

---

Para mas detalle sobre seguridad y datos, ver [SECURITY.md](SECURITY.md).
