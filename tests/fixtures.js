import { test as pruebaBase, expect } from '@playwright/test';

// La opción pertenece a cada proyecto. Firefox siempre usa el navegador original;
// activar Stealth en un proyecto Chromium nunca sustituye otro motor por Chrome.
export const test = pruebaBase.extend({
  modoNavegador: ['estandar', { option: true, scope: 'worker' }],
  browser: [async ({ browser, browserName, headless, channel, launchOptions, modoNavegador }, usar) => {
    if (modoNavegador !== 'stealth') {
      await usar(browser);
      return;
    }
    if (browserName !== 'chromium') throw new Error('Stealth solo está configurado para proyectos Chromium.');
    const { chromium } = await import('playwright-extra');
    const { default: crearStealth } = await import('puppeteer-extra-plugin-stealth');
    chromium.use(crearStealth());
    const navegador = await chromium.launch({ ...launchOptions, headless, channel });
    // El navegador adicional se cierra aquí; Playwright cierra su navegador base.
    try { await usar(navegador); }
    finally { await navegador.close(); }
  }, { scope: 'worker' }],
});

export { expect };
