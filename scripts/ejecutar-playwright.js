import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Inicia la CLI con el caché definido antes de que Playwright cargue sus módulos.
// Una descarga oficial bajo Documents funciona en esta PC, mientras el caché de
// AppData presenta un fallo de activación de dependencias de Firefox en Windows.
// El directorio se genera al instalar y no se incluye en Git; no modifica el navegador.
const require = createRequire(import.meta.url);
const resultado = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || fileURLToPath(new URL('../.navegadores', import.meta.url)) },
});
if (resultado.error) {
  console.error(`No se pudo iniciar Playwright: ${resultado.error.message}`);
}
process.exitCode = resultado.status ?? 1;
