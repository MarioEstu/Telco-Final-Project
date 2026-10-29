# Max-Pro2: conectividad para una planta solar

Sitio web interactivo del proyecto final de Telecomunicaciones, Universidad Mariano Gálvez de Guatemala (Facultad de Ingeniería en Sistemas de Información, plan sábados). Presenta la propuesta para el cliente ficticio Max-Pro2: enlace de fibra de 148 km entre zona 10 y San Manuel Chaparrón, enlace entre los dos edificios de la planta y red Wi-Fi 7 con estrategia DFS.

Es HTML, CSS y JavaScript puro, sin dependencias ni paso de compilación.

## Grupo 2

| Carné | Integrante | Rol |
|---|---|---|
| 0900-22-9412 | Mario Josue López Rodas | Desarrollador |
| 0900-22-18429 | Josue Wilfredo Estrada Recinos | Coordinador |
| 0900-21-1146 | Francisco Javier Barrios Saenz De Tejada | Desarrollador |

## Cómo verlo

- **Local:** abra `index.html` con doble clic. El audio del recorrido funciona desde el disco.
- **Con servidor local:** en esta carpeta ejecute `python -m http.server 8765` y abra `http://localhost:8765`.
- **Publicado en Vercel:** importe este repositorio con estos valores y no cambie nada más.

| Ajuste | Valor |
|---|---|
| Framework Preset | Other |
| Build Command | (vacío) |
| Output Directory | (vacío, la raíz del repositorio) |
| Install Command | (vacío) |

## Qué incluye

- **Recorrido narrado:** 16 capítulos (6.4 min) con voz, subtítulos palabra por palabra y un avatar guía que opera las visualizaciones.
- **Simuladores:** corte de fibra con respaldo IPsec, presupuesto óptico, regla de 100 m del cobre, capacidad por AP, cobertura con radio de celda ajustable y evento de radar DFS.
- **Planos reales** con los 19 access points, racks interactivos y presupuesto en USD o quetzales, con o sin IVA.
- Tema claro y oscuro, y se adapta a teléfono, tableta y escritorio.
- **Documento del proyecto** en PDF y Word dentro de `documento/`.

## Seguridad

El sitio es estático: no tiene servidor, base de datos, cuentas ni formularios que envíen datos, y no carga nada de otros dominios (fuentes, íconos, audio y planos están en el repositorio).

`vercel.json` añade cabeceras de seguridad a todas las respuestas:

- `Content-Security-Policy` estricta: scripts solo de este mismo origen (sin scripts en línea ni `eval`), sin objetos incrustados, sin formularios, sin carga desde otros dominios.
- `X-Content-Type-Options`, `X-Frame-Options` y `frame-ancestors` para impedir que otra página lo incruste.
- `Referrer-Policy`, `Permissions-Policy` (cámara, micrófono, ubicación y otros desactivados) y políticas de origen cruzado.

Si algún día se necesita incrustar el sitio en otra página (por ejemplo una plataforma del curso), hay que cambiar `frame-ancestors 'none'` y `X-Frame-Options` en `vercel.json`.

## Datos del grupo

Se editan en **`js/team.js`**: nombre, carné, rol, porcentaje de trabajo (`pct`, con `null` no se muestra), secciones, reseña personal y catedrático. Lo que esté vacío no aparece en la página.

## Estructura

```
index.html          estructura y textos
vercel.json         cabeceras de seguridad para Vercel
css/styles.css      estilos y tema claro/oscuro
js/theme.js         aplica el tema antes de pintar
js/data.js          datos del proyecto (generado desde el documento)
js/team.js          datos del grupo (editable)
js/route.js         medios, mapa de ruta, óptica, monitoreo
js/racks.js         racks y enlace entre edificios
js/wifi.js          espectro, capacidad, planos, equipos
js/dfs.js           simulador DFS
js/money.js         inversión, caso, conclusiones y grupo
js/tour.js          motor del recorrido narrado
js/tourdata.js      guion, tiempos por palabra y audio (generado)
assets/             fuentes, planos, íconos y audio MP3
documento/          PDF y Word del proyecto
```
