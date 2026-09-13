# Liverpool: automatización en español

[![Pruebas de Liverpool](https://github.com/joshnv1/Repo-Liverpool-PT/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/joshnv1/Repo-Liverpool-PT/actions/workflows/test.yml)

Proyecto de entrevista con JavaScript y Playwright. Busca productos, aplica un color, ordena por precio, imprime los primeros cinco resultados y compara identificador, nombre y precio con la respuesta real de red que consume la página. Incluye los cinco extras del reto: datos parametrizables, paralelismo entre navegadores, comparación visual, análisis de accesibilidad con axe y presupuesto de rendimiento.

## Estado de validación

**Versión con los cinco extras aprobada en local y GitHub Actions el 13 de septiembre de 2026.** Pasaron **65 pruebas unitarias y cuatro escenarios de navegador**, sin reintentos ni omisiones. Las tres búsquedas consiguieron 5/5 coincidencias entre interfaz y red. La suite de navegador tardó **50.0 segundos en Windows** y **50.7 segundos en Linux/CI**. La búsqueda medida tardó **4368.8 ms localmente y 4765.0 ms en CI**, por debajo del presupuesto de 15000 ms. La comparación visual pasó contra referencias revisadas, sin actualizarlas durante la validación. El escenario de calidad también aprobó con ventana visible en Windows (18.5 segundos). Axe reportó **cinco reglas con violaciones y tres resultados incompletos** en ambos entornos: aprobar el análisis significa que produjo evidencia, no que Liverpool carezca de barreras. [Ejecución aprobada](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34786230822) · [Reporte descargable](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34786230822/artifacts/10326284570). Commit probado: `5ada12911550380a0e997b9015c33c9c5bb90e9a`. El commit posterior de cierre solo actualiza documentación.

**Evidencia histórica del 12 de septiembre de 2026, anterior a esta ampliación:** [ejecución 34732971333](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34732971333), commit `2528669`. Pasaron **56 pruebas unitarias y los tres recorridos en headless**, sin reintentos y con **5/5 coincidencias cada uno**. PlayStation se ejecutó en Chrome; Xbox y Nintendo, en Firefox, con dos procesos simultáneos. La suite de navegación duró 41.7 segundos y se publicó el artefacto `evidencia-playwright` con el reporte HTML. Este resultado acredita aquella versión, no los tres extras recién incorporados.

Aquella versión del código pasó localmente 56 unitarias y tres recorridos en 38.6 segundos. También se comprobó `MODO_VENTANA=1` en Chrome y Firefox con dos búsquedas aprobadas. Los adjuntos registran motor, versión, selector de navegador y visibilidad reales.

Nintendo pidió Blanco y utilizó Negro como alternativa, dejando la decisión en la evidencia. Chrome también validó un producto con intervalo de precios: se conservaron y compararon ambos extremos. La configuración actual ofrece únicamente `0 = Chrome` y `1 = Firefox`.

Una comprobación anterior desde otra carpeta sin dependencias ni navegadores descargados también aprobó la instalación y las pruebas. Los detalles históricos y diagnósticos están en `VALIDACION.md`; el alcance y la política de los nuevos extras se explican en [CALIDAD.md](CALIDAD.md).

## Qué puedes editar

Abre `src/casos.js`. Al inicio puedes alternar la visibilidad de ambos navegadores:

```javascript
export const modoVentanaPredeterminado = 0; // 0 = headless; 1 = ventana visible.
```

Ejecuta `npm.cmd run pruebas` después de guardar el cambio. El valor inicial es `0`. También puedes definir `MODO_VENTANA='0'` o `'1'` en la terminal; esa variable tiene prioridad sobre el archivo. `--headed` y `pruebas:con-ventana` fuerzan la ventana visible. GitHub Actions define `MODO_VENTANA='0'` para ejecutar siempre sin ventana.

Los casos predeterminados son:

| Búsqueda | Color solicitado | Orden | Navegador | Alternativa de color |
| --- | --- | --- | --- | --- |
| `playstation 5` | Blanco | `0`: Menor precio | `0`: Chrome | Desactivada, caso original |
| `xbox series x` | Blanco | `0`: Menor precio | `1`: Firefox | Desactivada |
| `nintendo switch` | Blanco | `0`: Menor precio | `1`: Firefox | Negro y después Blanco |

Para reutilizar el tercer caso, cambia sus datos:

```javascript
{
  termino: 'nintendo switch', // Cualquier producto o término que quieras buscar.
  color: 'Azul',             // Color que deseas intentar primero.
  ordenPrecio: 1,            // 0 = Menor precio; 1 = Mayor precio.
  navegador: 1,              // 0 = Chrome; 1 = Firefox.
  permitirColorAlternativo: true,
}
```

Se ejecuta **un solo orden y un solo navegador por caso**. Cambiar `ordenPrecio` de `0` a `1` selecciona Mayor precio y verifica importes de mayor a menor. Cambiar `navegador` elige dónde se ejecutará ese recorrido; no multiplica el caso por ambos navegadores.

La configuración predeterminada utiliza Chrome para PlayStation y Firefox para Xbox y Nintendo. Los selectores de navegador y ventana rechazan cualquier valor distinto de `0` y `1`.

Si el color pedido está disponible, se utiliza ese color. Si falta y el caso permite alternativas, se elige **Negro**; si tampoco existe, se intenta **Blanco**. Si no existe ninguno permitido, la prueba falla explicando los colores ofrecidos. El reporte registra el color solicitado, el utilizado, los colores disponibles y el motivo de la sustitución.

Los dos primeros casos conservan Blanco y Menor precio. El tercero es la ampliación configurable. Un término arbitrario puede no ofrecer filtro de color o cinco productos; esa falta se informa como fallo, sin inventar resultados. El cuarto escenario, `calidad.spec.js`, siempre utiliza PlayStation, Blanco, Menor precio y Chrome para conservar un estado visual comparable; editar estos tres casos no cambia ese escenario fijo.

## Preparación en VS Code

Abre esta carpeta y selecciona **Terminal → Nueva terminal**. Necesitas Node.js **24.x** y npm. Ejecuta desde la carpeta que contiene `package.json`:

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run navegadores:instalar
```

`npm ci` usa las versiones de `package-lock.json`. El comando de navegadores instala primero la versión de Firefox preparada para Playwright y después Chrome, en llamadas separadas. Así, detectar Chrome ya instalado no interrumpe la descarga de Firefox. Una instalación normal de Firefox no sustituye esa versión. Chrome puede necesitar permisos de instalación del sistema.

Los comandos del proyecto pasan por `scripts/ejecutar-playwright.js`, que utiliza la carpeta local `.navegadores/` para los binarios administrados por Playwright. Esa carpeta se excluye de Git. Así, instalación y ejecución usan la misma ubicación y no dependen de la caché de AppData que produjo errores de arranque en esta PC. Si defines `PLAYWRIGHT_BROWSERS_PATH`, se respeta tu ruta; úsala tanto al instalar como al ejecutar. Chrome utiliza su instalación de sistema.

En Windows, `npm.cmd` evita el problema de permisos de `npm.ps1`. En Linux o macOS utiliza `npm`. En Linux instala también las dependencias del sistema:

```bash
node scripts/ejecutar-playwright.js install --with-deps firefox
node scripts/ejecutar-playwright.js install --with-deps chrome
```

## Ejecutar las pruebas

| Comando de PowerShell | Función |
| --- | --- |
| `npm.cmd run pruebas` | Ejecuta las 65 unitarias y los cuatro escenarios predeterminados. |
| `npm.cmd run pruebas:unitarias` | Valida comparación, red, configuración, alternativas, presupuesto e informe sin visitar la tienda. |
| `npm.cmd run pruebas:busquedas` | Ejecuta solo las tres búsquedas funcionales o los términos personalizados. |
| `npm.cmd run pruebas:calidad` | Ejecuta el escenario fijo de rendimiento, axe y comparación visual en Chrome. |
| `npm.cmd run pruebas:sin-ventana` | Ejecuta búsquedas y calidad; headless con la configuración inicial `0`. |
| `npm.cmd run pruebas:con-ventana` | Ejecuta búsquedas y calidad con el navegador visible. |
| `npm.cmd run pruebas:chrome` | Ejecuta los casos asignados a Chrome y el escenario fijo de calidad. |
| `npm.cmd run pruebas:firefox` | Ejecuta los casos asignados a Firefox con el modo configurado. |
| `npm.cmd run pruebas:depurar` | Abre el inspector para avanzar por el código. |
| `npm.cmd run reporte` | Abre el último reporte HTML. |
| `npm.cmd run referencias:actualizar` | Genera referencias visuales candidatas; requiere revisión antes de versionarlas. |

Los comandos originales `test`, `test:unit`, `test:e2e`, `test:headed`, `test:debug` y `report` siguen disponibles. Los nombres de nuestras pruebas, pasos, mensajes, comentarios y comandos están en español; Playwright, npm y los campos originales de Liverpool conservan sus nombres técnicos. Los archivos JSON no admiten comentarios; su propósito se explica aquí.

La ejecución es **sin ventana de forma predeterminada**, con **hasta dos casos simultáneos**. Los proyectos `chrome` y `firefox` seleccionan los casos por sus etiquetas: tres búsquedas y un escenario de calidad producen cuatro recorridos. Los comandos de ejecución respetan `modoVentanaPredeterminado` o `MODO_VENTANA`, salvo los que fuerzan la ventana mediante `--headed`. Cada caso utiliza un contexto nuevo para aislar su sesión.

Las referencias visuales se separan por plataforma y modo de ventana. Windows conserva imágenes revisadas para ambos modos; Linux en CI utiliza headless. Una combinación no versionada requiere generar y revisar su referencia. Para inspeccionar solamente las búsquedas funcionales con ventanas, utiliza `npm.cmd run pruebas:busquedas -- --headed`.

Chrome utiliza el motor Chromium y Firefox utiliza su propio motor. Distribuir los casos no demuestra que cada término funcione en todos los navegadores ni garantiza evitar un bloqueo de Liverpool.

**Las tres búsquedas con Chrome:**

```powershell
$env:NAVEGADOR_BUSQUEDA = '0'
npm.cmd run pruebas:busquedas
Remove-Item Env:NAVEGADOR_BUSQUEDA
```

Los comandos `pruebas:chrome` y `pruebas:firefox` filtran los casos ya asignados; no cambian su navegador. Para enviar un caso a otro navegador, edita `navegador` o usa `NAVEGADOR_BUSQUEDA`. Agrega `-- --headed` a cualquiera de esos comandos para mostrar su ventana.

Con los datos predeterminados, `pruebas:firefox` ejecuta Xbox y Nintendo. Los argumentos posteriores a `--` llegan directamente a Playwright; por ejemplo, `npm.cmd run pruebas:sin-ventana -- --project=chrome` selecciona el proyecto Chrome. Utiliza los comandos del proyecto para conservar la ubicación de los navegadores descargados.

La variable antigua `BROWSER_CHANNEL` se reemplaza por `NAVEGADOR_BUSQUEDA`. Si quedó definida en tu terminal, elimínala antes de ejecutar:

```powershell
Remove-Item Env:BROWSER_CHANNEL -ErrorAction SilentlyContinue
```

## Reutilizar el recorrido desde la terminal

Este ejemplo ejecuta solamente Nintendo Switch en Firefox, intenta Multicolor y ordena por mayor precio:

```powershell
$env:BUSQUEDA = 'nintendo switch'
$env:COLOR_BUSQUEDA = 'Multicolor'
$env:ORDEN_PRECIO = '1'
$env:NAVEGADOR_BUSQUEDA = '1'
npm.cmd run pruebas:busquedas
Remove-Item Env:BUSQUEDA, Env:COLOR_BUSQUEDA, Env:ORDEN_PRECIO, Env:NAVEGADOR_BUSQUEDA
```

Cambia `BUSQUEDA` por cualquier otro término. Cambia `ORDEN_PRECIO` a `'0'` para menor precio. En `NAVEGADOR_BUSQUEDA`, usa `'0'` para Chrome o `'1'` para Firefox. `COLOR_BUSQUEDA` evita interferencias con variables de color de la terminal. Las búsquedas personalizadas admiten la alternativa Negro/Blanco.

| Variable | Significado |
| --- | --- |
| `BUSQUEDA` | Selecciona un término de la suite funcional. |
| `BUSQUEDAS` | Selecciona varios términos funcionales separados por `;`, por ejemplo `'nintendo switch;audífonos;teclado'`. |
| `SEARCH_TERM` | Nombre compatible con la primera versión, equivalente a `BUSQUEDA`. |
| `COLOR_BUSQUEDA` | Color del tercer caso flexible o de los términos personalizados. |
| `ORDEN_PRECIO` | `0` para menor precio o `1` para mayor precio, en casos flexibles. |
| `NAVEGADOR_BUSQUEDA` | Fuerza el navegador de los casos funcionales seleccionados: `0` Chrome o `1` Firefox. |
| `MODO_VENTANA` | `0`: headless; `1`: ventana visible. Tiene prioridad sobre el valor del archivo. |
| `LIMITE_BUSQUEDA_MS` | Presupuesto del escenario de calidad: entero entre `1000` y `60000`; predeterminado `15000`. |

Usa solo una entre `BUSQUEDA`, `BUSQUEDAS` y `SEARCH_TERM`. Los términos vacíos, duplicados y valores de orden o navegador inválidos se rechazan antes de abrir el navegador. Sin variables, la suite funcional selecciona los tres casos de `src/casos.js`. Una búsqueda personalizada que coincide con un término predeterminado hereda su navegador; un término nuevo utiliza Firefox, salvo que indiques otro con `NAVEGADOR_BUSQUEDA`. El comando `pruebas:busquedas` ejecuta únicamente esa selección. Los comandos generales añaden el escenario fijo de calidad en Chrome, que no cambia con esas variables.

## Regresión visual, accesibilidad y rendimiento

`tests/e2e/calidad.spec.js` añade un escenario con `playstation 5`, Blanco y Menor precio en Chrome. Conserva una sesión independiente, no tiene reintentos y no modifica las búsquedas parametrizables. Ejecuta:

1. **Rendimiento:** mide desde antes de Enter hasta leer cinco tarjetas con nombre y precio. Exige una duración estrictamente menor a 15 segundos de forma predeterminada. Se adjuntan la medición y el presupuesto; no se trata de LCP ni de esperar todos los recursos secundarios.
2. **Accesibilidad:** analiza la página completa con axe-core 4.13.0, sin exclusiones ni reglas desactivadas. Adjunta JSON e informe HTML con violaciones y resultados que requieren revisión manual. Los problemas del sitio se reportan, sin exigir cero violaciones ni afirmar conformidad.
3. **Regresión visual:** compara un recorte de `1440 × 312` píxeles de la página real: cabecera, buscador, título, filtro seleccionado y orden. Solo enmascara el contador variable de artículos. Los modos `0` y `1` utilizan referencias propias. Las tarjetas y fotografías quedan fuera del recorte; la suite funcional compara nombres y precios con la red.

```powershell
# Ejecutar los tres extras con la referencia visual existente
$env:MODO_VENTANA = '0'
npm.cmd run pruebas:calidad

# Ejemplo de un presupuesto explícito de 12 segundos
$env:LIMITE_BUSQUEDA_MS = '12000'
npm.cmd run pruebas:calidad
Remove-Item Env:LIMITE_BUSQUEDA_MS
```

Una falta de acceso, un presupuesto excedido, un fallo al ejecutar axe o una diferencia visual hacen fallar este escenario. Las violaciones de accesibilidad detectadas generan evidencia y una anotación en el reporte: el reto exige reportarlas. En la primera exploración se encontraron cinco reglas con problemas: `aria-dialog-name`, `button-name`, `color-contrast`, `heading-order` y `label`. Ese dato corresponde a esa ejecución y puede cambiar.

Las referencias se separan por `chrome/{platform}` y se revisan antes de guardarlas en Git. La configuración normal utiliza `updateSnapshots: 'none'`: una imagen ausente o diferente no se aprueba automáticamente. La tolerancia es `maxDiffPixels: 100` con `threshold: 0.2`. Consulta [CALIDAD.md](CALIDAD.md) para generar candidatos en Windows o Linux, revisar diferencias e interpretar los hallazgos.

Al comprobar el modo visible apareció una diferencia de 1412 píxeles en la barra lateral: Playwright añade `--hide-scrollbars` al ejecutar Chrome headless. Se revisaron ambas apariencias y se separaron sus referencias, sin modificar estilos ni aumentar tolerancia. La comparación visible posterior aprobó en 18.5 segundos. El detalle se documenta en `CALIDAD.md`.

## Paso a paso para hacerlo manualmente

1. Abre el navegador asignado al caso, entra a Liverpool y escribe el término en el buscador. Presiona Enter.
2. Revisa el filtro Color. Para PlayStation y Xbox selecciona Blanco. En el tercero intenta el color configurado; si falta, busca Negro y después Blanco. Anota cualquier cambio.
3. En Ordenar por, elige Menor precio si configuraste `0` o Mayor precio si configuraste `1`.
4. Mantente en la primera página. Lee los primeros cinco resultados de izquierda a derecha y de arriba abajo: código, nombre y precio de venta, sin tomar el precio tachado.
5. En las herramientas de desarrollo, abre Red antes de filtrar y ordenar. Localiza la petición POST `/api/plp/search` correspondiente a la última ordenación y revisa su respuesta.
6. Compara `productId`, `title` y el precio efectivo de `data.records` con los productos visibles: `priceInfo.promoPrice.price` para una promoción única, `promoPrice.minPrice` y `maxPrice` para un intervalo promocional, o `priceInfo.salePrice` si no hay promoción. Conserva capturas del filtro, el orden, los productos y cualquier discrepancia.
7. Repite el recorrido desde una sesión nueva y con el navegador asignado al siguiente caso.

Los resultados pueden incluir accesorios, juegos u otros artículos: se validan los primeros cinco que presenta el sitio. No se añade un filtro de consolas ni se buscan los SKU manuales para forzar una aprobación.

## Criterios de aprobación y evidencia

La prueba exige cinco productos identificables, precios en el orden elegido y una respuesta de red correspondiente a la búsqueda, color usado, orden y página 1. Deben coincidir **al menos tres identificadores distintos**. Se registran los faltantes. Una diferencia de nombre o precio en un producto identificado hace fallar el caso aunque se alcance el mínimo de coincidencias.

Los nombres se normalizan por espacios, mayúsculas y representación Unicode, conservando acentos, puntuación y modelos. Los importes se comparan en centavos. El código rechaza productos incompletos y duplicados contradictorios.

El reporte HTML se guarda en `playwright-report/`. El proyecto identifica el navegador utilizado en cada caso. Contiene los pasos numerados en español y los adjuntos:

- `navegador-utilizado`: motor, versión, modo, inicio y proceso de la ejecución real.
- `verificacion-inicio`: captura de la portada, incluso si falla el acceso.
- `colores-disponibles` y `decision-de-color-y-orden`: datos de la elección real.
- `color-aplicado`: captura del filtro seleccionado.
- `contexto-de-la-respuesta-de-red`: búsqueda, filtros, orden y página recibidos.
- `validacion-de-productos`: productos de ambas fuentes y diferencias.
- `productos-y-orden-final`: captura de los resultados.

El escenario adicional aporta `entorno-de-calidad`, `rendimiento-busqueda`, `accesibilidad-axe-completa`, `informe-accesibilidad`, `alcance-visual` y `captura-visual-actual`. Si la comparación visual falla, Playwright agrega la referencia esperada, la captura actual y la diferencia cuando están disponibles. El informe de axe se abre como HTML independiente y conserva los hallazgos, aunque el recorrido funcional esté aprobado.

Playwright conserva automáticamente capturas y trazas de los fallos en `test-results/`. Los reportes de cada diagnóstico deben guardarse antes de otra ejecución, porque el reporte normal se reemplaza. Los adjuntos de red seleccionan campos útiles y excluyen datos de visitante y atribución; las trazas automáticas conservan información de la sesión para diagnosticar fallos.

## Cómo se captura la red

Se observa la petición real **POST `https://www.liverpool.com.mx/api/plp/search`** disparada por la interfaz. Al filtrar se compara `appliedFilters` con el valor de la casilla. Al ordenar se verifican `query`, `sortOption` (`sortPrice|0` o `sortPrice|1`) y el `encryptedFilters` recibido tras aplicar el color. El contexto se obtiene en cada ejecución.

Se lee `data.records`: `productId`, `title` y el precio efectivo. Se usa `priceInfo.promoPrice.price` cuando existe, porque ese importe promocional coincide con el mostrado por las tarjetas observadas; en ausencia de promoción, se usa `priceInfo.salePrice`. Cuando la promoción es un intervalo, se leen `promoPrice.minPrice` y `promoPrice.maxPrice` y se comparan ambos extremos con el intervalo visible. Para verificar el orden se utiliza el extremo inferior mostrado por cada tarjeta. La evidencia incluye el texto visible y `campoPrecio` para identificar el origen. Se valida el esquema y no se utilizan precios de lista ni SKU de variante como sustitutos. La lectura de tarjetas se repite dentro de una aserción de hasta 15 segundos para esperar la actualización de la interfaz; no se repite la búsqueda ni se modifica la respuesta.

## Diagnóstico sin ventana

Chrome usa `argumentos` de forma predeterminada. Firefox siempre utiliza su motor real y el modo `estandar`, sin argumentos, canal ni agente de usuario de Chrome. No se cambia de navegador automáticamente cuando un caso falla.

Para los navegadores basados en Chromium puedes seleccionar `estandar`, `argumentos` o `stealth` mediante `MODO_NAVEGADOR`. `argumentos` reproduce las dos opciones de arranque y la cadena Chrome/117 propuesta para el diagnóstico; esa cadena no indica la versión real instalada. `stealth` utiliza `playwright-extra` y `puppeteer-extra-plugin-stealth`, con versiones fijadas. Esos métodos no convierten Firefox en Chromium.

```powershell
$env:BUSQUEDA = 'playstation 5'
$env:NAVEGADOR_BUSQUEDA = '0'
$env:MODO_NAVEGADOR = 'argumentos'
npm.cmd run pruebas:busquedas
Remove-Item Env:BUSQUEDA, Env:NAVEGADOR_BUSQUEDA, Env:MODO_NAVEGADOR
```

Para probar el otro método, cambia el valor a `'stealth'`. Opcionalmente, `VERIFICAR_DETECCION='1'` visita Sannysoft y adjunta una captura antes de Liverpool; elimina también esa variable después. Sus indicadores son diagnósticos: la aprobación requiere completar búsqueda, filtro, orden y comparación en Liverpool. Un HTTP 403 o CAPTCHA conserva su evidencia y sigue siendo un fallo.

Fuentes técnicas: [navegadores oficiales de Playwright](https://playwright.dev/docs/browsers), [opciones de Playwright](https://playwright.dev/docs/api/class-testoptions) y [documentación de playwright-extra y Stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra). Las versiones instaladas también incluyen su documentación en `node_modules`.

## Organización del código comentado

| Archivo | Qué explica y realiza |
| --- | --- |
| `src/casos.js` | Datos editables de término, color, orden y navegador. |
| `src/settings.js` | Lectura y validación de variables de configuración. |
| `src/seleccion-color.js` | Elección del color solicitado o de sus alternativas. |
| `src/search-page.js` | Acciones de la página y lectura de tarjetas. |
| `src/search-response.js` | Captura de red, contrato y estado final. |
| `src/products.js` | Comparación por identidad, nombre y precio. |
| `src/display-price.js` | Conversión del precio visible a un número. |
| `src/calidad.js` | Presupuesto de búsqueda e informe seguro de accesibilidad en español. |
| `tests/e2e/search.spec.js` | Recorrido reutilizable y evidencia de cada paso. |
| `tests/e2e/calidad.spec.js` | Escenario fijo de rendimiento, accesibilidad y regresión visual. |
| `tests/e2e/referencias/` | Referencias visuales revisadas y separadas por navegador y plataforma. |
| `tests/fixtures.js` | Creación del navegador y uso explícito de Stealth en Chromium cuando se solicita. |
| `tests/unit/` | Ejemplos controlados de éxito y fallos. |
| `scripts/ejecutar-playwright.js` | Ejecuta Playwright con la misma carpeta de navegadores al instalar y probar, conservando los argumentos recibidos. |
| `playwright.config.js` | Proyectos de navegadores, concurrencia, esperas, reportes y capturas. |
| `TEST_STRATEGY.md` | Decisiones y límites para explicar en la entrevista. |
| `CALIDAD.md` | Alcance, presupuesto, hallazgos de axe y mantenimiento de referencias. |
| `.github/workflows/test.yml` | Instalación, ejecución sin ventana y artefactos de GitHub Actions. |
| `.github/workflows/referencias-visuales.yml` | Generación manual de referencias candidatas; no valida ni publica cambios automáticamente. |

## GitHub Actions y entrega

El contenido de esta carpeta debe quedar en la raíz del repositorio para que GitHub encuentre `.github/workflows/test.yml`. El flujo instala Node.js 24, ejecuta `npm ci`, instala Chrome y Firefox con sus dependencias y ejecuta `npm test` con `MODO_VENTANA='0'`. Con los datos predeterminados son 65 unitarias y cuatro escenarios. Utiliza hasta dos procesos de prueba, un reintento para búsquedas funcionales en CI y un límite total de 15 minutos. El escenario de calidad no reintenta: una segunda medición rápida no debe ocultar una primera lenta.

Para ejecutarlo manualmente, abre **Actions → Pruebas de Liverpool con Playwright → Run workflow**, selecciona `main` y confirma. Al finalizar, abre la ejecución y descarga `evidencia-playwright` en **Artifacts**; extrae el ZIP completo y abre `playwright-report/index.html`.

El artefacto `evidencia-playwright` conserva reportes y resultados durante 14 días, incluso si falla la ejecución. Si la instalación impide iniciar las pruebas, puede no existir reporte HTML; el error queda en el registro de GitHub Actions.

El workflow `referencias-visuales.yml` se ejecuta únicamente de forma manual para producir candidatos Linux. Genera un artefacto, no hace commits y no acredita una regresión visual aprobada. Después de revisar e incorporar el PNG esperado, se ejecuta `test.yml` normalmente para comparar contra esa referencia.

Repositorio: [joshnv1/Repo-Liverpool-PT](https://github.com/joshnv1/Repo-Liverpool-PT). [Ejecución final con los cinco extras](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34786230822) y [reporte descargable](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34786230822/artifacts/10326284570). Los resultados históricos anteriores conservan su alcance en `VALIDACION.md`.
