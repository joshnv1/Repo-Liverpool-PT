import { test, expect } from '../fixtures.js';
import { SearchPage } from '../../src/search-page.js';
import { configuracion } from '../../src/settings.js';
import { compareProducts } from '../../src/products.js';
import { parseSearchProducts, assertFinalSearchState } from '../../src/search-response.js';
import { seleccionarColor } from '../../src/seleccion-color.js';

// Cada término crea una prueba independiente con una sesión nueva de navegador.
// Se reutiliza el recorrido completo; los productos se leen del catálogo actual.
for (const caso of configuracion.casos) {
  const { termino } = caso;
  test(`Liverpool: «${termino}», color ${caso.color}, ${caso.etiquetaOrden} y comparación con red`,
    { tag: `@navegador-${caso.claveNavegador}` }, async ({ page, browser, browserName, modoNavegador }, informacionPrueba) => {
    // Registra el motor, versión y horario reales para comprobar navegador y paralelismo.
    await informacionPrueba.attach('navegador-utilizado', { body: JSON.stringify({
      selector: caso.navegador, navegador: informacionPrueba.project.name, motor: browserName,
      version: browser.version(), modo: modoNavegador, sinVentana: informacionPrueba.project.use.headless,
      inicio: new Date().toISOString(), trabajador: informacionPrueba.workerIndex,
    }, null, 2), contentType: 'application/json' });
    const paginaBusqueda = new SearchPage(page);
    // Esta visita opcional es diagnóstica. Sus indicadores no aprueban Liverpool.
    if (process.env.VERIFICAR_DETECCION === '1') {
      await test.step('Diagnóstico: guardar indicadores del navegador en Sannysoft', async () => {
        await page.goto('https://bot.sannysoft.com/', { waitUntil: 'load' });
        await informacionPrueba.attach('indicadores-del-navegador', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      });
    }
    await test.step('1. Abrir la página de Liverpool', async () => {
      try { await paginaBusqueda.open(); }
      finally {
        // La captura también se conserva cuando la portada devuelve un error 403.
        await informacionPrueba.attach('verificacion-inicio', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });
    await test.step(`2. Buscar «${termino}»`, () => paginaBusqueda.search(termino));

    let decisionColor;
    const respuestaColor = await test.step(`3. Seleccionar ${caso.color}${caso.permitirColorAlternativo ? ' o la alternativa Negro/Blanco' : ''} y registrar la decisión`, async () => {
      const disponibles = await paginaBusqueda.availableColors();
      // Se adjunta lo observado incluso si no existe un color permitido y se falla.
      await informacionPrueba.attach('colores-disponibles', { body: JSON.stringify({ solicitado: caso.color, disponibles }, null, 2), contentType: 'application/json' });
      decisionColor = seleccionarColor(caso.color, disponibles, caso.permitirColorAlternativo);
      console.log(`Color solicitado: ${decisionColor.solicitado}. Color utilizado: ${decisionColor.utilizado}. ${decisionColor.motivo}`);
      await informacionPrueba.attach('decision-de-color-y-orden', { body: JSON.stringify({ ...decisionColor, ordenPrecio: caso.ordenPrecio, orden: caso.etiquetaOrden }, null, 2), contentType: 'application/json' });
      const respuesta = await paginaBusqueda.filterColor(termino, decisionColor.utilizado);
      await informacionPrueba.attach('color-aplicado', { body: await page.screenshot(), contentType: 'image/png' });
      return respuesta;
    });
    const filtrosCifrados = respuestaColor.payload.data.encryptedFilters;
    expect(typeof filtrosCifrados, 'La respuesta de color debe proporcionar el contexto actual de los filtros.').toBe('string');
    expect(filtrosCifrados.length, 'El contexto de los filtros no debe estar vacío.').toBeGreaterThan(0);

    const respuestaFinal = await test.step(`4. Ordenar por ${caso.etiquetaOrden} (${caso.ordenPrecio}) y capturar la respuesta correspondiente`,
      () => paginaBusqueda.sortByPrice(termino, decisionColor.utilizado, caso.etiquetaOrden, caso.opcionOrden, filtrosCifrados));

    await test.step('5. Comprobar búsqueda, color, orden y página en la respuesta de red', async () => {
      // Se conservan los nombres originales de los campos de Liverpool para poder
      // reconocerlos en las herramientas de desarrollo. Se excluyen datos de rastreo.
      await informacionPrueba.attach('contexto-de-la-respuesta-de-red', {
        body: JSON.stringify({ url: respuestaFinal.url, estadoHTTP: respuestaFinal.status, solicitud: respuestaFinal.request,
          meta: respuestaFinal.payload.meta, pageInfo: { currentPage: respuestaFinal.payload.data.pageInfo?.currentPage },
          filtersGroups: respuestaFinal.payload.data.filtersGroups, sortDisplayOptions: respuestaFinal.payload.data.sortDisplayOptions }, null, 2),
        contentType: 'application/json',
      });
      assertFinalSearchState(respuestaFinal.payload, { query: termino, color: decisionColor.utilizado, sortOption: caso.opcionOrden, encryptedFilters: filtrosCifrados });
    });

    await test.step('6. Leer los primeros cinco productos y validar identidad, nombre, precio y orden', async () => {
      const productosRed = parseSearchProducts(respuestaFinal.payload);
      let productosInterfaz = [];
      let comparacion;
      try {
        // La llegada del JSON puede preceder a la actualización de las tarjetas.
        // Se relee la interfaz hasta 15 segundos, sin repetir la búsqueda ni alterar
        // la respuesta capturada. Las diferencias persistentes hacen fallar la prueba.
        await expect(async () => {
          productosInterfaz = await paginaBusqueda.firstProducts(configuracion.cantidadResultados);
          comparacion = compareProducts(productosInterfaz, productosRed);
          expect(productosInterfaz, 'La interfaz debe mostrar cinco productos.').toHaveLength(configuracion.cantidadResultados);
          // Para intervalos, el valor de orden es el extremo inferior mostrado;
          // ambos extremos se comprueban por separado contra la respuesta de red.
          const centavos = productosInterfaz.map(producto => Math.round(producto.price * 100));
          const preciosOrdenados = [...centavos].sort((a, b) => caso.ordenPrecio === 0 ? a - b : b - a);
          expect(centavos, `Los precios de venta visibles deben respetar el orden ${caso.etiquetaOrden}.`).toEqual(preciosOrdenados);
          expect(comparacion.matchedCount, 'Al menos tres productos distintos de la interfaz deben aparecer en la respuesta de red.').toBeGreaterThanOrEqual(configuracion.coincidenciasMinimas);
          expect(comparacion.discrepancies, 'Los productos coincidentes deben tener el mismo nombre y precio de venta.').toEqual([]);
        }).toPass({ timeout: 15_000, intervals: [250, 500, 1000] });
      } finally {
        console.log(`Búsqueda: ${termino}`);
        console.table(productosInterfaz.map((producto, indice) => ({ posición: indice + 1, código: producto.id, nombre: producto.name,
          precioMXN: producto.maxPrice !== undefined ? `${producto.price.toFixed(2)} - ${producto.maxPrice.toFixed(2)}` : producto.price.toFixed(2) })));
        if (comparacion) {
          console.log(`Coincidencias: ${comparacion.matchedCount}/${configuracion.cantidadResultados} productos de la interfaz presentes en la respuesta de red.`);
          if (comparacion.missing.length) console.warn('Productos de la interfaz ausentes en la respuesta:', comparacion.missing);
          if (comparacion.discrepancies.length) console.warn('Diferencias de nombre o precio entre interfaz y red:', comparacion.discrepancies);
        }
        await informacionPrueba.attach('validacion-de-productos', {
          body: JSON.stringify({ busqueda: termino, decisionColor, orden: caso.etiquetaOrden, productosInterfaz, productosRed, comparacion }, null, 2), contentType: 'application/json',
        });
        await informacionPrueba.attach('productos-y-orden-final', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });
  });
}
