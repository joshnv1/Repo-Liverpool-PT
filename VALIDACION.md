# Validación — 12 de septiembre de 2026

## Configuración actual

Solo se admiten `navegador: 0` (Chrome) y `navegador: 1` (Firefox). PlayStation utiliza Chrome; Xbox y Nintendo utilizan Firefox. Cada etiqueta selecciona un único proyecto, con hasta dos pruebas simultáneas.

En `src/casos.js`, `modoVentanaPredeterminado = 0` activa headless; `1` muestra las ventanas. `MODO_VENTANA` permite sustituirlo desde la terminal. Los valores distintos de 0 y 1 se rechazan. GitHub Actions fija `MODO_VENTANA=0`; `--headed` conserva la opción explícita de ejecución visible local.

## Prueba local sin ventana

`npm.cmd run pruebas` aprobó **56 unitarias y 3 recorridos reales en headless**, con dos procesos, cero reintentos y 38.6 segundos de navegación.

| Búsqueda | Navegador | Color solicitado → usado | Resultado |
| --- | --- | --- | --- |
| PlayStation 5 | 0: Chrome | Blanco → Blanco | 5/5 coincidencias |
| Xbox Series X | 1: Firefox | Blanco → Blanco | 5/5 coincidencias |
| Nintendo Switch | 1: Firefox | Blanco → Negro | 5/5 coincidencias |

Los tres casos validaron Menor precio (`0`). Se compararon los primeros cinco resultados del sitio, sin sustituir productos por SKU manuales. Los adjuntos `navegador-utilizado` y los horarios del reporte acreditan la configuración real y la simultaneidad.

El selector de precio admite 0 (menor) y 1 (mayor). Las unitarias cubren ambos. El recorrido de Nintendo con Mayor precio y Multicolor se había comprobado en Chrome en una versión anterior; no se presenta como una nueva ejecución en Firefox.

## Prueba local con ventana

Se definió `MODO_VENTANA=1` y se ejecutaron PlayStation en Chrome y Nintendo en Firefox en paralelo, sin usar `--headed`. Ambos recorridos aprobaron con 5/5 coincidencias en 27.0 segundos. Los adjuntos registraron `sinVentana: false`, comprobando que el selector numérico llega a ambos navegadores. El archivo conserva el valor predeterminado 0.

## Instalación reproducible y diagnósticos anteriores

Antes de simplificar los selectores se comprobó una copia de los archivos de código sin dependencias, navegadores, reportes ni `.git`. `npm ci`, la descarga oficial de Firefox y la suite aprobaron 53 unitarias y los tres recorridos en 39.2 segundos. Chrome ya estaba instalado en el sistema. Fue otra carpeta de la misma PC, no un clon remoto ni una ejecución de CI.

Se separaron las instalaciones de Firefox y Chrome porque una llamada conjunta terminaba al detectar Chrome instalado y dejaba Firefox pendiente. Los comandos de npm y CI conservan esa corrección.

Firefox no arrancaba desde el caché de AppData y Windows registró un error SideBySide al resolver `mozglue`. La descarga oficial en una carpeta del proyecto sí funcionó. No se determinó la causa de fondo de la ubicación anterior. `scripts/ejecutar-playwright.js` establece la variable oficial `PLAYWRIGHT_BROWSERS_PATH` antes de cargar Playwright; `.navegadores/` se excluye de Git. No se modifican políticas, antivirus ni perfiles personales.

Una ejecución anterior observó el intervalo promocional `$99.60 - $119.60` frente al original tachado `$249.00 - $299.00`. La red devolvía `promoPrice.minPrice` y `maxPrice`. El adaptador compara ambos extremos y verifica el orden por el mínimo; las unitarias detectan intervalos incompletos, invertidos o máximos distintos.

## Entrega

Repositorio público: [joshnv1/Repo-Liverpool-PT](https://github.com/joshnv1/Repo-Liverpool-PT).

La [ejecución 34732971333 de GitHub Actions](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34732971333), commit `25286698b21e791c087c2d9383d3512d0206ff6f`, aprobó **56 unitarias y tres recorridos en headless**, con dos procesos y sin reintentos. Cada búsqueda tuvo **5/5 coincidencias**. La suite de navegación duró 41.7 segundos. También aprobaron instalación y subida del [artefacto del reporte](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34732971333/artifacts/10310071802), disponible durante 14 días. El commit posterior únicamente actualiza documentación con este resultado.

La primera ejecución remota había pasado PlayStation y Nintendo, pero Xbox agotó la espera de URL. Playwright esperaba el evento `load` aunque la URL ya coincidía. Se reprodujo el comportamiento con resultados visibles y una imagen pendiente en ambos navegadores. La corrección comprueba los parámetros actuales mediante `expect.poll` y después los resultados visibles; no aumenta el tiempo ni omite las validaciones de red. La segunda ejecución aprobada incluye esa corrección.

Las unitarias ahora usan datos propios para que editar el modo de ventana, término, color, orden o navegador del usuario no invalide las expectativas de sus ejemplos controlados.

El último reporte local se abre con `npm.cmd run reporte`. Las copias de evidencia se guardan en la carpeta hermana `validacion-liverpool`, fuera del código publicado.
