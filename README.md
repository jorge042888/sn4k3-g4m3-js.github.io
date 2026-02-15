# Snake - Juego clasico

Juego de la serpiente en JavaScript (Canvas), con obstaculos dinamicos, estadisticas y menu de usuario.

## Como ejecutar

- Abre `index.html` en un navegador moderno, o
- Sirve la carpeta con un servidor local (por ejemplo `npx serve .`) y accede a la URL indicada.

## Controles

En escritorio:

| Tecla | Accion |
|-------|--------|
| **Flechas** o **W A S D** | Mover la serpiente |
| **Espacio** | Pausar / reanudar |
| **Esc** | Reiniciar (durante partida) |

En movil:

- **Swipe tactil** sobre el tablero.
- **Botones tactiles** en pantalla (`arriba`, `abajo`, `izquierda`, `derecha`).

## Funcionalidades

- **Nombre de usuario**: al iniciar partida se solicita el nombre; se muestra en el header y en la pantalla de Game Over. Por defecto: `Jugador`.
- **Comida roja (normal)**: suma `+10` puntos y hace crecer la serpiente.
- **Obstaculos**: cada vez que la serpiente come una comida roja, aparece un muro aleatorio de `1x1` celda en color brillante. Chocar con un muro termina la partida.
- **Comida verde (shrink)**: aparece aleatoriamente (`20%` de probabilidad por spawn), muestra indicador `x1`, `x2` o `x3`, y reduce la longitud de la serpiente segun ese valor (sin bajar del minimo jugable).
- **Animacion de reduccion**: al comer comida verde se renderiza una animacion de disolucion en los segmentos removidos y texto flotante `-N`.
- **Contadores de partida**: en `Game Over` se muestran:
  - `Circulos comidos` (rojos + verdes).
  - `Cuadros aleatorios` generados en la partida.
- **Estadisticas**: boton `Estadisticas` en el header. Muestra partidas jugadas, mejor puntuacion, puntuacion media, total de puntos, y dos graficas (puntuacion y duracion por partida) con numeros en barras y linea de tendencia.
- **Persistencia**: record e historial de partidas (ultimas 100) en `localStorage`; cada partida guarda puntuacion, nombre, fecha y duracion.
- **Mejor jugador**: en la pantalla de inicio se muestra automaticamente el nombre del jugador con mayor puntuacion registrada y se pre-rellena el campo de nombre con ese valor.
- **Ventana de reglas**: boton `Reglas del juego` en el pie de pagina.
- **Logo configurable**: junto al texto `Snake JS` se puede cargar un logo desde `assets/logo.ico`. Si el archivo no existe, el logo se oculta automaticamente.

## Estructura del proyecto

```text
snake-game-js/
|-- index.html
|-- css/
|   `-- styles.css
|-- js/
|   |-- game.js
|   `-- stats.js
|-- assets/
|   `-- .gitkeep
|-- README.md
|-- CHANGELOG.md
`-- SECURITY.md
```

## Tecnologias

- HTML5, CSS3, JavaScript (vanilla)
- Canvas API para el juego y las graficas
- `localStorage` para record e historial de partidas

## Documentacion complementaria

- [CHANGELOG.md](CHANGELOG.md) - Cambios realizados por version.
- [SECURITY.md](SECURITY.md) - Seguridad, privacidad y assurance de la aplicacion.
