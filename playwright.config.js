import { defineConfig } from '@playwright/test';
import { crearProyectosNavegadores } from './src/navegadores.js';
import { configuracion } from './src/settings.js';

// Las opciones comunes se comparten; cada navegador conserva su motor y canal reales.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Cada sistema conserva su referencia. La ejecución normal nunca la actualiza.
  snapshotPathTemplate: '{testDir}/referencias/{projectName}/{platform}/{arg}{ext}',
  updateSnapshots: 'none',
  // Hasta dos recorridos en paralelo, cada uno en su propia sesión aislada.
  workers: 2,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/resultados.json' }]],
  use: {
    baseURL: 'https://www.liverpool.com.mx',
    // 0 mantiene headless; 1 muestra la ventana. --headed también permite verla.
    headless: configuracion.headless,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: crearProyectosNavegadores(process.env.MODO_NAVEGADOR),
});
