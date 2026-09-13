import AxeBuilder from '@axe-core/playwright';
import { performance } from 'node:perf_hooks';
import { test, expect } from '../fixtures.js';
import { SearchPage } from '../../src/search-page.js';
import { leerLimiteBusqueda, validarDuracionBusqueda, crearReporteAccesibilidad } from '../../src/calidad.js';

// El escenario fijo permite revisar una referencia visual sin depender de los
// términos editables de la suite funcional. Estos extras se ejecutan en Chrome.
test.describe('Puntos extra sobre los resultados reales', () => {
  // Un segundo intento rápido no debe ocultar una medición lenta del primero.
  test.describe.configure({ retries: 0 });

  test('Calidad: rendimiento, informe axe y regresión visual de resultados',
    { tag: ['@navegador-chrome', '@calidad'] }, async ({ page, browser }, informacion) => {
    const limiteMs = leerLimiteBusqueda();
    const pagina = new SearchPage(page);
    // Chrome oculta barras nativas en headless. Cada modo compara su aspecto real,
    // sin alterar estilos de Liverpool ni ampliar la tolerancia de la imagen.
    const referenciaVisual = informacion.project.use.headless
      ? 'controles-resultados.png' : 'controles-resultados-con-ventana.png';
    await informacion.attach('entorno-de-calidad', { body: JSON.stringify({
      navegador: informacion.project.name, version: browser.version(), plataforma: process.platform,
      sinVentana: informacion.project.use.headless, viewport: informacion.project.use.viewport,
      caso: { termino: 'playstation 5', color: 'Blanco', orden: 'Menor precio' },
    }, null, 2), contentType: 'application/json' });

    await test.step('1. Abrir Liverpool y preparar la búsqueda fija', async () => {
      await pagina.open();
      await pagina.searchBox.fill('playstation 5');
    });

    await test.step(`2. Exigir cinco resultados legibles en menos de ${limiteMs} ms`, async () => {
      // El reloj de Node continúa aunque la página cambie de documento. Comienza
      // antes de Enter y termina al leer cinco nombres y precios reales.
      const inicio = performance.now();
      let resultadosListos = false;
      try {
        await pagina.searchBox.press('Enter');
        await expect.poll(() => new URL(page.url()).searchParams.get('s')).toBe('playstation 5');
        await pagina.firstProducts(5);
        resultadosListos = true;
      } finally {
        const duracionMs = performance.now() - inicio;
        await informacion.attach('rendimiento-busqueda', { body: JSON.stringify({
          duracionMs, limiteMs, resultadosListos,
          inicio: 'Antes de enviar Enter', fin: 'Cinco tarjetas visibles con ID, nombre y precio legibles',
          alcance: 'Tiempo de búsqueda percibido; no es LCP ni carga de todos los recursos secundarios.',
        }, null, 2), contentType: 'application/json' });
        console.log(`Rendimiento de búsqueda: ${duracionMs.toFixed(1)} ms; presupuesto: menos de ${limiteMs} ms.`);
        if (resultadosListos) validarDuracionBusqueda(duracionMs, limiteMs);
      }
    });

    await test.step('3. Aplicar Blanco y Menor precio a los resultados', async () => {
      const color = await pagina.filterColor('playstation 5', 'Blanco');
      await pagina.sortByPrice('playstation 5', 'Blanco', 'Menor precio', 'sortPrice|0', color.payload.data.encryptedFilters);
      await pagina.firstProducts(5);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.getByRole('heading', { name: 'Playstation 5', exact: true })).toBeVisible();
    });

    await test.step('4. Analizar accesibilidad con axe y reportar todos los hallazgos', async () => {
      // El sitio es externo: el reto exige ejecutar y reportar el análisis, no
      // ocultar sus defectos. No se excluyen elementos ni se desactivan reglas.
      const resultado = await new AxeBuilder({ page }).analyze();
      await informacion.attach('accesibilidad-axe-completa', { body: JSON.stringify(resultado, null, 2), contentType: 'application/json' });
      await informacion.attach('informe-accesibilidad', { body: crearReporteAccesibilidad(resultado), contentType: 'text/html' });
      expect(resultado.testEngine.name).toBe('axe-core');
      expect(resultado.passes.length + resultado.violations.length,
        'El análisis debe haber evaluado reglas aplicables.').toBeGreaterThan(0);
      console.table(resultado.violations.map(regla => ({ regla: regla.id, impacto: regla.impact, elementos: regla.nodes.length })));
      console.log(`Accesibilidad: ${resultado.violations.length} reglas con violaciones; ${resultado.incomplete.length} requieren revisión manual.`);
      if (resultado.violations.length) informacion.annotations.push({ type: 'Hallazgos de accesibilidad',
        description: `${resultado.violations.length} reglas presentan problemas en Liverpool; consultar informe. La suite no certifica ausencia de barreras.` });
    });

    await test.step('5. Comparar visualmente cabecera y controles de la página de resultados', async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      // Las fuentes deben estar listas; no esperamos imágenes del catálogo que
      // están fuera del recorte. El contador cambia y se enmascara explícitamente.
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      const opciones = {
        clip: { x: 0, y: 0, width: 1440, height: 312 },
        animations: 'disabled', caret: 'hide', scale: 'css',
        mask: [page.locator('p').filter({ hasText: /^\d+\s+artículos$/ }).filter({ visible: true })],
        maskColor: '#D5D9E0', maxDiffPixels: 100, threshold: 0.2,
      };
      await informacion.attach('alcance-visual', { body: JSON.stringify({
        region: opciones.clip, contadorEnmascarado: true,
        comprueba: 'Cabecera, buscador, título, filtro seleccionado, navegación y control de orden.',
        fueraDeAlcance: 'Imágenes, textos y precios variables de las tarjetas; se validan funcionalmente con la red.',
        referencia: informacion.snapshotPath(referenciaVisual),
      }, null, 2), contentType: 'application/json' });
      await informacion.attach('captura-visual-actual', { body: await page.screenshot(opciones), contentType: 'image/png' });
      // Una ejecución normal falla si falta la referencia o cambia el diseño.
      // Las referencias se generan expresamente y se revisan antes de versionarlas.
      await expect(page).toHaveScreenshot(referenciaVisual, opciones);
    });
  });
});
