# Validación final con los cinco extras — 13 de septiembre de 2026

**Versión con los cinco extras aprobada en local y GitHub Actions el 13 de septiembre de 2026.** Pasaron **65 pruebas unitarias y cuatro escenarios de navegador**, sin reintentos ni omisiones. Las tres búsquedas consiguieron 5/5 coincidencias entre interfaz y red. La suite de navegador tardó **50.0 segundos en Windows** y **50.7 segundos en Linux/CI**. La búsqueda medida tardó **4368.8 ms localmente y 4765.0 ms en CI**, por debajo del presupuesto de 15000 ms. La comparación visual pasó contra referencias revisadas, sin actualizarlas durante la validación. El escenario de calidad también aprobó con ventana visible en Windows (18.5 segundos). Axe reportó **cinco reglas con violaciones y tres resultados incompletos** en ambos entornos: aprobar el análisis significa que produjo evidencia, no que Liverpool carezca de barreras. [Ejecución aprobada](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34786230822) · [Reporte descargable](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34786230822/artifacts/10326284570). Commit probado: `5ada12911550380a0e997b9015c33c9c5bb90e9a`. El commit posterior de cierre solo actualiza documentación.

## Entornos y evidencia final

| Comprobación | Windows local | GitHub Actions/Linux |
| --- | --- | --- |
| Unitarias | 65 aprobadas | 65 aprobadas |
| Navegación | 4 aprobadas; 50.0 s | 4 aprobadas; 50.7 s |
| Búsqueda útil | 4368.8 ms < 15000 ms | 4765.0 ms < 15000 ms |
| Axe | 5 reglas con violaciones; 3 incompletas | 5 reglas con violaciones; 3 incompletas |
| Comparación visual | Referencia Windows revisada | Referencia Linux revisada |

Las búsquedas mantienen Chrome para PlayStation y Firefox para Xbox/Nintendo, con hasta dos procesos y sesiones aisladas. Los informes registran versiones, modo efectivo, resultados y mediciones. La referencia visual cubre cabecera y controles, con contador enmascarado; las tarjetas se comparan funcionalmente con la red. El escenario de calidad no tiene reintentos.

## Incidencias de esta ampliación y su resolución

- **Barras nativas en modo visible:** una comparación detectó 1412 píxeles diferentes. La revisión localizó exclusivamente la barra del panel de filtros: Chrome headless la oculta al arrancar. Se separaron las referencias por modo, conservando la interfaz y tolerancia. La comparación visible posterior aprobó en 18.5 s, con búsqueda de 2697.9 ms.
- **Dependencia ausente durante una publicación intermedia:** la ejecución [34785259579](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34785259579) utilizó el commit `33cc8b4`, que ya incluía el escenario pero todavía no el manifiesto actualizado. Falló al importar `@axe-core/playwright`. Se publicaron `package.json` y `package-lock.json` juntos; la instalación con `npm ci` y la suite final aprobaron con la dependencia fijada.
- **Referencia Linux inicialmente inexistente:** se preparó en un workflow manual, se revisó y se versionó antes de ejecutar la comparación estricta. No se renombró el PNG de Windows ni se autoaceptaron diferencias en la ejecución normal.
- **Hallazgos de accesibilidad del sitio externo:** se conservaron en HTML y JSON, con reglas, impacto y nodos afectados. No son defectos que podamos corregir en el sitio desde este repositorio y no se eliminaron del análisis para obtener un resultado limpio.

Las cuatro respuestas de estrategia están en `TEST_STRATEGY.md`; los comandos de VS Code y Actions están en `README.md`, y el alcance de los extras en `CALIDAD.md`.

---

## Historial anterior a la ampliación

### Validación — 12 de septiembre de 2026

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
