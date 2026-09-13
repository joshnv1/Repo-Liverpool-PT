# Extras de regresión visual, accesibilidad y rendimiento

Los tres extras se ejecutan en `tests/e2e/calidad.spec.js`, en un contexto nuevo de Chrome. El caso siempre utiliza `playstation 5`, Blanco y Menor precio. Mantener esos datos fijos permite comparar el mismo estado visual sin cambiar la flexibilidad de las tres búsquedas funcionales.

La suite predeterminada contiene 65 pruebas unitarias, tres escenarios funcionales y este escenario de calidad. Para ejecutar todo usa `npm.cmd run pruebas`; para ejecutar únicamente los extras, `npm.cmd run pruebas:calidad`. `npm.cmd run pruebas:busquedas` conserva solo los recorridos parametrizables.

**Versión con los cinco extras aprobada en local y GitHub Actions el 13 de septiembre de 2026.** Pasaron **65 pruebas unitarias y cuatro escenarios de navegador**, sin reintentos ni omisiones. Las tres búsquedas consiguieron 5/5 coincidencias entre interfaz y red. La suite de navegador tardó **50.0 segundos en Windows** y **50.7 segundos en Linux/CI**. La búsqueda medida tardó **4368.8 ms localmente y 4765.0 ms en CI**, por debajo del presupuesto de 15000 ms. La comparación visual pasó contra referencias revisadas, sin actualizarlas durante la validación. El escenario de calidad también aprobó con ventana visible en Windows (18.5 segundos). Axe reportó **cinco reglas con violaciones y tres resultados incompletos** en ambos entornos: aprobar el análisis significa que produjo evidencia, no que Liverpool carezca de barreras. [Ejecución aprobada](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34786230822) · [Reporte descargable](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34786230822/artifacts/10326284570). Commit probado: `5ada12911550380a0e997b9015c33c9c5bb90e9a`. El commit posterior de cierre solo actualiza documentación.

## Qué exige cada comprobación

| Comprobación | Criterio | Evidencia |
| --- | --- | --- |
| Rendimiento | Cinco tarjetas legibles antes de alcanzar el presupuesto; 15 segundos por defecto. | JSON con duración, límite, resultado de lectura y definición de inicio/fin. |
| Accesibilidad | axe debe ejecutar reglas aplicables y sus hallazgos deben quedar reportados. | JSON íntegro, HTML independiente y anotación de las violaciones. |
| Regresión visual | La captura actual debe coincidir con una referencia existente dentro de la tolerancia documentada. | Captura actual, alcance y comparación de Playwright. |

Una restricción de acceso, un error del análisis, una medición lenta o una diferencia visual hacen fallar el escenario. No hay reintentos para este caso: una segunda medición rápida no debe ocultar una primera lenta. Las violaciones detectadas en el sitio se reportan, porque el reto pide identificar y presentar esos problemas, sin exigir que podamos corregir Liverpool.

## Presupuesto de rendimiento

El reloj monotónico de Node comienza justo antes de enviar Enter en el buscador, después de abrir la tienda y escribir el término. Termina cuando la URL refleja la consulta y se pueden leer cinco tarjetas con identificador, nombre y precio. La medición incluye la espera de la búsqueda y su presentación útil; se realiza antes de aplicar filtros, tomar capturas y ejecutar axe.

El presupuesto predeterminado es **menos de 15 000 ms**, configurable mediante `LIMITE_BUSQUEDA_MS`. Acepta enteros entre 1000 y 60000. Una duración igual al límite falla. Valores vacíos, unidades añadidas, decimales o números fuera de rango se rechazan. Las mediciones deben ser finitas y no negativas.

```powershell
$env:MODO_VENTANA = '0'
$env:LIMITE_BUSQUEDA_MS = '12000'
npm.cmd run pruebas:calidad
Remove-Item Env:LIMITE_BUSQUEDA_MS
```

Este presupuesto pertenece a la prueba: no representa un SLA de Liverpool, LCP ni el tiempo hasta finalizar todos los recursos publicitarios o secundarios. Depende del equipo, red y carga de la ejecución. La evidencia permite revisar esas condiciones antes de cambiar el umbral; aumentar el límite para ocultar un fallo no demuestra una mejora del rendimiento.

## Accesibilidad con axe

Se usa `@axe-core/playwright` **4.13.0**, fijado en las dependencias. El análisis se ejecuta sobre la página completa de resultados después de aplicar Blanco y Menor precio, sin excluir elementos ni desactivar reglas. Corre antes de la captura con máscara; por tanto, analiza la interfaz original.

El adjunto `accesibilidad-axe-completa` conserva el JSON íntegro. `informe-accesibilidad` contiene un HTML independiente en español con fecha, URL, versión del motor, totales, reglas, impacto, nodos afectados, selectores, fragmentos HTML, detalle del problema y enlaces de ayuda. Presenta tanto `violations` como `incomplete`; los fragmentos de la tienda se escapan para mostrarlos como texto y solo se crean enlaces HTTP o HTTPS.

En la primera exploración de esta ampliación se observaron cinco reglas con problemas:

| Regla | Qué requiere revisar |
| --- | --- |
| `aria-dialog-name` | Nombre accesible de los cuadros de diálogo. |
| `button-name` | Nombre accesible de botones. |
| `color-contrast` | Contraste del contenido señalado. |
| `heading-order` | Orden de los niveles de encabezado. |
| `label` | Etiquetas asociadas a controles de formulario. |

Son resultados observados, no una lista permitida que suprima hallazgos futuros. Los números de nodos y las reglas pueden cambiar con el catálogo o la página. Las reglas predeterminadas incluyen buenas prácticas; cinco reglas reportadas no significan cinco incumplimientos distintos de WCAG.

Un resultado incompleto requiere revisión manual. Una regla aprobada por el motor tampoco demuestra ausencia de todas las barreras. El éxito de esta comprobación significa que el análisis se ejecutó y produjo evidencia; **no significa que Liverpool tenga cero problemas ni certifica conformidad de accesibilidad**. El reporte funcional muestra una anotación cuando hay violaciones.

## Alcance visual y referencias

La comparación utiliza un recorte real de **1440 × 312 píxeles**, desde la esquina superior izquierda con la página desplazada al inicio. Incluye cabecera, buscador, título, navegación, filtro seleccionado y control de orden. Solo se enmascara el contador variable de artículos. Las fotografías, nombres y precios de tarjetas quedan fuera de ese recorte; la comparación funcional con la red cubre identidad, nombre y precio.

Antes de capturar se esperan las fuentes, se retira el cursor de los controles, se oculta el caret y se desactivan animaciones durante la captura. No se sustituye el HTML de la tienda ni se modifican sus estilos. La tolerancia permite como máximo **100 píxeles diferentes**, con umbral de diferencia de color **0.2**. Una diferencia mayor o una referencia ausente falla.

### Diferencia entre ventana visible y headless

La comprobación adicional con `MODO_VENTANA=1` encontró **1412 píxeles diferentes** frente a la referencia aprobada en headless. La revisión de la captura actual, esperada y del mapa de diferencias localizó el cambio en la barra de desplazamiento del panel lateral, entre `x=353–367` e `y=139–311`. Ambas imágenes medían `1440 × 312`; los controles y el viewport coincidían.

El código instalado de Playwright añade `--hide-scrollbars` al arrancar Chrome headless. El modo visible conserva esa barra. Por ello cada modo utiliza una referencia revisada de su aspecto real: `controles-resultados.png` sin ventana y `controles-resultados-con-ventana.png` con ventana. La selección usa el modo efectivo de Playwright, incluyendo `--headed`. Se conserva la tolerancia original y no se ocultan las barras mediante estilos.

Tras revisar las imágenes, el escenario visible aprobó una comparación estricta contra su propia referencia Windows: 18.5 segundos totales y búsqueda en 2697.9 ms. La generación de una referencia y su aprobación son pasos separados.

Las referencias siguen esta estructura:

```text
tests/e2e/referencias/chrome/win32/controles-resultados.png
tests/e2e/referencias/chrome/win32/controles-resultados-con-ventana.png
tests/e2e/referencias/chrome/linux/controles-resultados.png
```

Windows y Linux pueden representar fuentes y controles de manera distinta. Cada referencia debe proceder de su plataforma y modo; renombrar una captura Windows como Linux no valida ese entorno. La versión real de Chrome, plataforma, modo de ventana y viewport se adjuntan en `entorno-de-calidad`. Windows conserva ambos modos y Linux en CI utiliza headless. Otra combinación, como Linux visible o macOS, requiere generar y revisar su referencia. Para ello selecciona el modo deseado antes de ejecutar `referencias:actualizar`. Para una inspección funcional con ventanas usa `npm.cmd run pruebas:busquedas -- --headed`; para incluir también calidad usa `npm.cmd run pruebas:con-ventana`.

### Preparar una referencia local

```powershell
$env:MODO_VENTANA = '0'
npm.cmd run referencias:actualizar
```

Este comando genera o sustituye un candidato de la plataforma actual. Revisa la captura, sus controles, el filtro y el orden contra la página esperada. Si ya existía una referencia, revisa el cambio en Git y conserva la anterior si el nuevo diseño no es intencional. Solo después incorpora el PNG revisado al repositorio y ejecuta `npm.cmd run pruebas:calidad` sin actualizar referencias.

La configuración normal establece `updateSnapshots: 'none'`. Una ejecución que actualiza su propio esperado sirve para preparar evidencia, no para acreditar una comparación aprobada.

### Preparar una referencia Linux desde GitHub

1. Abre **Actions → Preparar candidatos de referencia visual → Run workflow**.
2. Selecciona la rama con el código que vas a revisar y ejecuta el workflow manual.
3. Descarga y extrae `candidatos-visuales-linux`. Contiene las imágenes y el reporte de esa preparación.
4. Revisa la imagen Linux y el adjunto de entorno. Incorpora únicamente la referencia aprobada en su carpeta `linux`.
5. Ejecuta el workflow normal **Pruebas de Liverpool con Playwright**. Esta ejecución compara contra el PNG versionado y publica `evidencia-playwright`.

El workflow de candidatos no realiza commits ni modifica el repositorio. Que termine correctamente indica que produjo un candidato; **la ejecución normal posterior es la que verifica la regresión**.

## Cómo revisar un fallo

Abre el reporte HTML y el paso que falló. Para rendimiento revisa `rendimiento-busqueda`; para axe, su informe y JSON; para visual, la referencia esperada, la captura actual y el mapa de diferencias. Playwright conserva automáticamente captura y traza de los fallos. Un cambio del sitio, una fuente distinta o una actualización de Chrome debe investigarse antes de aceptar una referencia nueva.

Fuentes: [comparaciones visuales de Playwright](https://playwright.dev/docs/test-snapshots), [análisis de accesibilidad](https://playwright.dev/docs/accessibility-testing) y [configuración de actualizaciones de referencias](https://playwright.dev/docs/api/class-testconfig#test-config-update-snapshots).

## Trazabilidad de las referencias revisadas

Windows conserva PNG propios de headless y ventana visible, revisados antes de sus comparaciones estrictas. La referencia Linux se generó expresamente en la [preparación 34786033576](https://github.com/joshnv1/Repo-Liverpool-PT/actions/runs/34786033576), con Chrome 153.0.8010.36, y se revisó antes de incorporarla. Su SHA-256 es `305c20a923fb47f5c744442b61069e694e7a0cd62c822b6c5b8dd8629c498058`. La ejecución final posterior comparó contra ese archivo versionado sin actualización de referencias.
