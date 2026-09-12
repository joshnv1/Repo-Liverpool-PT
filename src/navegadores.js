import { devices } from '@playwright/test';

// Cada proyecto ejecuta exclusivamente las pruebas con su etiqueta de navegador.
// Así tres casos distribuidos entre dos navegadores producen tres ejecuciones.
export function crearProyectosNavegadores(modo) {
  if (modo !== undefined && !['estandar', 'argumentos', 'stealth'].includes(modo)) {
    throw new Error('MODO_NAVEGADOR debe ser estandar, argumentos o stealth.');
  }
  return ['chrome', 'firefox'].map(nombre => {
    const esFirefox = nombre === 'firefox';
    const modoReal = esFirefox ? 'estandar' : (modo || 'argumentos');
    const dispositivo = { chrome: 'Desktop Chrome', firefox: 'Desktop Firefox' }[nombre];
    const opciones = { ...devices[dispositivo], browserName: esFirefox ? 'firefox' : 'chromium',
      modoNavegador: modoReal, viewport: { width: 1440, height: 1000 } };
    // Chrome usa su canal oficial; Firefox conserva su propio motor y opciones.
    if (!esFirefox) opciones.channel = 'chrome';
    if (modoReal === 'argumentos') {
      opciones.launchOptions = { args: ['--disable-blink-features=AutomationControlled', '--disable-infobars'] };
      // Conserva la configuración de Chrome comprobada en la sesión anterior.
      opciones.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
    }
    return { name: nombre, grep: new RegExp(`@navegador-${nombre}(?:\\s|$)`),
      metadata: { navegador: nombre, modo: modoReal }, use: opciones };
  });
}
