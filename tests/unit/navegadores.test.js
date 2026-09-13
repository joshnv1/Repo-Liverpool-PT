import test from 'node:test';
import assert from 'node:assert/strict';
import { crearProyectosNavegadores } from '../../src/navegadores.js';
import { crearConfiguracion } from '../datos-configuracion.js';

// Evita ejecuciones cruzadas y que un reporte de Firefox corresponda a Chrome.
test('distribuye PlayStation en Chrome y Xbox y Nintendo en Firefox', () => {
  assert.deepEqual(crearConfiguracion({}).casos.map(caso => caso.navegador), [0, 1, 1]);
  assert.deepEqual(crearConfiguracion({}).casos.map(caso => caso.claveNavegador), ['chrome', 'firefox', 'firefox']);
});
test('cada etiqueta selecciona exactamente un proyecto de navegador', () => {
  const proyectos = crearProyectosNavegadores();
  assert.deepEqual(proyectos.map(proyecto => proyecto.name), ['chrome', 'firefox']);
  for (const caso of crearConfiguracion({}).casos) {
    const seleccionados = proyectos.filter(proyecto => proyecto.grep.test(`prueba @navegador-${caso.claveNavegador}`));
    assert.deepEqual(seleccionados.map(proyecto => proyecto.name), [caso.claveNavegador]);
  }
});
test('Chrome conserva su canal y Firefox no hereda opciones de Chromium', () => {
  const [chrome, firefox] = crearProyectosNavegadores('argumentos');
  assert.equal(chrome.use.channel, 'chrome');
  assert.equal(firefox.use.browserName, 'firefox');
  assert.equal(firefox.use.channel, undefined);
  assert.equal(firefox.use.launchOptions, undefined);
  assert.equal(firefox.use.modoNavegador, 'estandar');
  assert.match(firefox.use.userAgent, /Firefox/);
});
test('el selector numérico permite elegir cualquier navegador y rechaza otros valores', () => {
  for (const numero of [0, 1]) {
    for (const valor of [numero, String(numero)]) {
      const caso = crearConfiguracion({ BUSQUEDA: 'teclado', NAVEGADOR_BUSQUEDA: valor }).casos[0];
      assert.equal(caso.navegador, numero);
      assert.equal(caso.claveNavegador, numero === 0 ? 'chrome' : 'firefox');
    }
  }
  for (const valor of [2, '2', '3', '', 'chrome', false]) {
    assert.throws(() => crearConfiguracion({ NAVEGADOR_BUSQUEDA: valor }), /NAVEGADOR_BUSQUEDA debe ser/);
  }
});
test('los términos personalizados conocidos conservan navegador y los nuevos usan Firefox', () => {
  assert.equal(crearConfiguracion({ BUSQUEDA: 'xbox series x' }).casos[0].navegador, 1);
  assert.equal(crearConfiguracion({ BUSQUEDA: 'teclado' }).casos[0].navegador, 1);
});
test('el modo Stealth no cambia Firefox y se rechaza una configuración ambigua antigua', () => {
  assert.equal(crearProyectosNavegadores('stealth')[1].use.modoNavegador, 'estandar');
  assert.throws(() => crearConfiguracion({ BROWSER_CHANNEL: 'chrome' }), /fue reemplazada/);
  assert.throws(() => crearProyectosNavegadores('otro'), /MODO_NAVEGADOR debe ser/);
});
