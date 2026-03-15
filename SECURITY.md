# Seguridad y assurance

Este documento describe las practicas de seguridad y assurance del proyecto **Snake - Juego clasico**, para que la aplicacion sea segura para quienes accedan a ella.

## Alcance

- La aplicacion es **100% cliente**: se ejecuta en el navegador del usuario. No existe backend propio ni envio de datos a servidores del proyecto.
- El objetivo de este documento es ofrecer **transparencia** sobre el uso de datos, la integridad del codigo y los recursos externos.

## Datos y privacidad

### Que se almacena

- Todo se almacena **solo en el navegador** del usuario (`localStorage`):
  - **Record de puntuacion** (clave: `snake-high-score`).
  - **Historial de partidas** (clave: `snake-game-stats`): array de las ultimas 100 partidas. Cada entrada incluye:
    - `score`, `playerName`, `date` (ISO), `duration` (segundos).

### Control sobre los datos almacenados

- La aplicacion incluye un reset manual desde el modal de estadisticas para borrar el historial y el record guardados en `localStorage`.
- El borrado requiere confirmacion explicita antes de ejecutarse.

### Que no se hace

- No se recopilan **datos personales** mas alla del nombre que el usuario escribe voluntariamente en la pantalla de inicio (y que solo se guarda en su dispositivo).
- No hay **cookies** de seguimiento, **analytics** ni envio de informacion a servidores externos.
- Todo permanece en el **dispositivo del usuario**.

## Integridad y uso seguro de datos

- Los datos mostrados en el menu de estadisticas provienen unicamente de `localStorage` y de estructuras controladas por la aplicacion (numeros, fechas, nombre de usuario).
- La lectura del historial esta protegida con `try/catch`: si los datos estan corruptos o manipulados, se usa un array vacio y la aplicacion no falla ni ejecuta codigo inyectado.
- No se inserta en el DOM contenido arbitrario desde el almacenamiento; las puntuaciones y el nombre se muestran mediante propiedades seguras (por ejemplo `textContent`), no con `innerHTML`.
- El nombre del jugador mostrado en el badge del header se reduce a una abreviacion visual, y el nombre completo se presenta mediante atributos/control visual del cliente sin evaluacion de codigo.

## Seguridad del codigo

- No se utiliza `eval()`, `new Function()` ni carga dinamica de scripts desde cadenas.
- Los unicos scripts de la aplicacion son los archivos locales referenciados en el HTML (`js/game.js`, `js/stats.js`). No se incluyen scripts de terceros; los unicos recursos externos son las fuentes de Google (CSS).

## Recursos externos

- **Google Fonts** (fuentes): se cargan por HTTPS desde `fonts.googleapis.com` y `fonts.gstatic.com`. Son hojas de estilo y fuentes; no tienen capacidad de ejecutar codigo en esta aplicacion.
- **Audio local**: los efectos de sonido se cargan desde archivos del proyecto bajo `audio/`, sin streaming ni dependencias remotas.
- **Logo local**: el icono del juego se carga desde un archivo local del proyecto (`imagenes/Snake.ico`), sin dependencias remotas adicionales.

## Recomendaciones para el usuario

- Ejecutar la aplicacion desde un **origen de confianza** (por ejemplo, el propio repositorio o un sitio que controle el usuario).
- Si se aloja en un servidor, usar **HTTPS** para evitar manipulacion en transito (aunque la app no envia datos al servidor).

## Mantenimiento del assurance

- Se recomienda revisar este documento cuando se anadan funcionalidades que afecten a datos, almacenamiento o recursos externos.
- Cualquier problema de seguridad puede reportarse mediante los canales habituales del proyecto (por ejemplo, issues del repositorio).
