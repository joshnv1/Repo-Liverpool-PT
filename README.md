# Liverpool: automatización en español

Proyecto de entrevista con JavaScript y Playwright. Busca productos, aplica un color, ordena por precio, imprime los primeros cinco resultados y compara identificador, nombre y precio con la respuesta real de red que consume la página.

## Estado de validación

**Configuración actual comprobada el 12 de septiembre de 2026:** `npm.cmd run pruebas` aprobó **55 pruebas unitarias y los tres recorridos en headless**, con **5/5 coincidencias cada uno**. PlayStation se ejecutó en Chrome; Xbox y Nintendo, en Firefox. La suite tardó 42.0 segundos con dos procesos simultáneos. Los adjuntos registran motor, versión, selector de navegador y visibilidad reales.

Nintendo pidió Blanco y utilizó Negro como alternativa, dejando la decisión en la evidencia. Chrome también validó un producto con intervalo de precios: se conservaron y compararon ambos extremos. La configuración actual ofrece únicamente `0 = Chrome` y `1 = Firefox`.

También se comprobó una copia del código sin dependencias ni navegadores descargados: `npm ci`, instalación oficial de Firefox en la carpeta del proyecto y las 53 unitarias más los tres recorridos aprobados (39.2 segundos de navegación). Chrome ya estaba instalado en el sistema. El repositorio de entrega es [Repo-Liverpool-PT](https://github.com/joshnv1/Repo-Liverpool-PT); la validación en GitHub Actions está en curso. Los detalles, límites y diagnósticos anteriores están en `VALIDACION.md`.

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

Los dos primeros casos conservan Blanco y Menor precio. El tercero es la ampliación configurable. Un término arbitrario puede no ofrecer filtro de color o cinco productos; esa falta se informa como fallo, sin inventar resultados.

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
| `npm.cmd run pruebas` | Ejecuta unitarias y después los recorridos sin ventana. |
| `npm.cmd run pruebas:unitarias` | Valida comparación, red, configuración y alternativas sin visitar la tienda. |
| `npm.cmd run pruebas:sin-ventana` | Ejecuta los recorridos sin mostrar el navegador. |
| `npm.cmd run pruebas:con-ventana` | Ejecuta los recorridos con el navegador visible. |
| `npm.cmd run pruebas:chrome` | Ejecuta los casos asignados a Chrome, sin ventana. |
| `npm.cmd run pruebas:firefox` | Ejecuta los casos asignados a Firefox, sin ventana. |
| `npm.cmd run pruebas:depurar` | Abre el inspector para avanzar por el código. |
| `npm.cmd run reporte` | Abre el último reporte HTML. |

Los comandos originales `test`, `test:unit`, `test:e2e`, `test:headed`, `test:debug` y `report` siguen disponibles. Los nombres de nuestras pruebas, pasos, mensajes, comentarios y comandos están en español; Playwright, npm y los campos originales de Liverpool conservan sus nombres técnicos. Los archivos JSON no admiten comentarios; su propósito se explica aquí.

La ejecución es **sin ventana de forma predeterminada**, con **hasta dos casos simultáneos**. Los proyectos `chrome` y `firefox` seleccionan los casos por sus etiquetas: tres búsquedas producen tres recorridos. Los comandos de ejecución respetan `modoVentanaPredeterminado` o `MODO_VENTANA`, salvo los que fuerzan la ventana mediante `--headed`. Cada caso utiliza un contexto nuevo para aislar su sesión.

Chrome utiliza el motor Chromium y Firefox utiliza su propio motor. Distribuir los casos no demuestra que cada término funcione en todos los navegadores ni garantiza evitar un bloqueo de Liverpool.

**Las tres búsquedas con Chrome:**

```powershell
$env:NAVEGADOR_BUSQUEDA = '0'
npm.cmd run pruebas:sin-ventana
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
npm.cmd run pruebas:sin-ventana
Remove-Item Env:BUSQUEDA, Env:COLOR_BUSQUEDA, Env:ORDEN_PRECIO, Env:NAVEGADOR_BUSQUEDA
```

Cambia `BUSQUEDA` por cualquier otro término. Cambia `ORDEN_PRECIO` a `'0'` para menor precio. En `NAVEGADOR_BUSQUEDA`, usa `'0'` para Chrome o `'1'` para Firefox. `COLOR_BUSQUEDA` evita interferencias con variables de color de la terminal. Las búsquedas personalizadas admiten la alternativa Negro/Blanco.

| Variable | Significado |
| --- | --- |
| `BUSQUEDA` | Ejecuta solo un término. |
| `BUSQUEDAS` | Ejecuta varios términos separados por `;`, por ejemplo `'nintendo switch;audífonos;teclado'`. |
| `SEARCH_TERM` | Nombre compatible con la primera versión, equivalente a `BUSQUEDA`. |
| `COLOR_BUSQUEDA` | Color del tercer caso flexible o de los términos personalizados. |
| `ORDEN_PRECIO` | `0` para menor precio o `1` para mayor precio, en casos flexibles. |
| `NAVEGADOR_BUSQUEDA` | Fuerza el navegador de todos los casos seleccionados: `0` Chrome o `1` Firefox. |
| `MODO_VENTANA` | `0`: headless; `1`: ventana visible. Tiene prioridad sobre el valor del archivo. |

Usa solo una entre `BUSQUEDA`, `BUSQUEDAS` y `SEARCH_TERM`. Los términos vacíos, duplicados y valores de orden o navegador inválidos se rechazan antes de abrir el navegador. Sin variables se ejecutan los tres casos de `src/casos.js`. Una búsqueda personalizada que coincide con un término predeterminado hereda su navegador; un término nuevo utiliza Firefox, salvo que indiques otro con `NAVEGADOR_BUSQUEDA`.

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
npm.cmd run pruebas:sin-ventana
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
| `tests/e2e/search.spec.js` | Recorrido reutilizable y evidencia de cada paso. |
| `tests/fixtures.js` | Creación del navegador y uso explícito de Stealth en Chromium cuando se solicita. |
| `tests/unit/` | Ejemplos controlados de éxito y fallos. |
| `scripts/ejecutar-playwright.js` | Ejecuta Playwright con la misma carpeta de navegadores al instalar y probar, conservando los argumentos recibidos. |
| `playwright.config.js` | Proyectos de navegadores, concurrencia, esperas, reportes y capturas. |
| `TEST_STRATEGY.md` | Decisiones y límites para explicar en la entrevista. |
| `.github/workflows/test.yml` | Instalación, ejecución sin ventana y artefactos de GitHub Actions. |

## GitHub Actions y entrega

El contenido de esta carpeta debe quedar en la raíz del repositorio para que GitHub encuentre `.github/workflows/test.yml`. El flujo instala Node.js 24, ejecuta `npm ci`, instala Chrome y Firefox con sus dependencias y ejecuta `npm test` con `MODO_VENTANA='0'`. Utiliza hasta dos procesos de prueba, un reintento en CI y un límite total de 15 minutos.

El artefacto `evidencia-playwright` conserva reportes y resultados durante 14 días, incluso si falla la ejecución. Si la instalación impide iniciar las pruebas, puede no existir reporte HTML; el error queda en el registro de GitHub Actions.

Repositorio: [joshnv1/Repo-Liverpool-PT](https://github.com/joshnv1/Repo-Liverpool-PT). El resultado de [GitHub Actions](https://github.com/joshnv1/Repo-Liverpool-PT/actions) se está comprobando; todavía no se acredita una ejecución aprobada en CI.

