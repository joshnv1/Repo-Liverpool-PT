import { defineConfig } from '@playwright/test';
import configuracionPrincipal from './playwright.config.js';

// Firefox utiliza su propio motor y el binario preparado por Playwright.
// Se excluyen el canal, los argumentos y el agente de usuario específicos de Chrome.

export default defineConfig({
  ...configuracionPrincipal,
  // Sus resultados se guardan aparte para conservar la evidencia de Chrome.
  outputDir: 'test-results/firefox',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/firefox', open: 'never' }]],
  metadata: { modoNavegador: 'estandar', navegador: 'Firefox de Playwright' },
  projects: configuracionPrincipal.projects.filter(proyecto => proyecto.name === 'firefox'),
});
