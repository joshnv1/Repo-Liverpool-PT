import test from 'node:test';
import assert from 'node:assert/strict';
import { crearConfiguracion } from '../datos-configuracion.js';
import { crearConfiguracion as configurar } from '../../src/settings.js';

// Estas pruebas validan la parametrización antes de acceder al sitio público.
test('respeta datos editados y el modo visible sin depender de las búsquedas de ejemplo', () => {
  const configuracion = configurar({}, { modoVentana: 1, casos: [
    { termino: 'teclado', color: 'Rojo', ordenPrecio: 1, navegador: 0, permitirColorAlternativo: true },
  ] });
  assert.equal(configuracion.headless, false);
  assert.deepEqual(configuracion.busquedas, ['teclado']);
  assert.equal(configuracion.casos[0].claveNavegador, 'chrome');
  assert.equal(configuracion.casos[0].etiquetaOrden, 'Mayor precio');
  assert.equal(configuracion.casos[0].color, 'Rojo');
});

test('ejecuta sin ventana de forma predeterminada y permite alternar con 0 o 1', () => {
  assert.equal(crearConfiguracion({}).modoVentana, 0);
  assert.equal(crearConfiguracion({}).headless, true);
  for (const modo of [0, '0', 1, '1']) {
    const configuracion = crearConfiguracion({ MODO_VENTANA: modo });
    assert.equal(configuracion.modoVentana, Number(modo));
    assert.equal(configuracion.headless, Number(modo) === 0);
  }
});

test('rechaza un modo de ventana inválido antes de abrir el navegador', () => {
  for (const modo of [2, '2', '', 'headless', false, true]) {
    assert.throws(() => crearConfiguracion({ MODO_VENTANA: modo }), /MODO_VENTANA debe ser/);
  }
});

test('incluye PlayStation, Xbox y Nintendo Switch de forma predeterminada', () => {
  const configuracion = crearConfiguracion({});
  assert.deepEqual(configuracion.busquedas, ['playstation 5', 'xbox series x', 'nintendo switch']);
  assert.equal(configuracion.casos[0].color, 'Blanco');
  assert.equal(configuracion.cantidadResultados, 5);
  assert.equal(configuracion.coincidenciasMinimas, 3);
  assert.ok(Object.isFrozen(configuracion.busquedas));
});

test('permite buscar cualquier término sin modificar el recorrido', () => {
  assert.deepEqual(crearConfiguracion({ BUSQUEDA: '  audífonos Sony  ' }).busquedas, ['audífonos Sony']);
  assert.deepEqual(crearConfiguracion({ SEARCH_TERM: 'xbox series x' }).busquedas, ['xbox series x']);
});

test('permite elegir varias búsquedas separadas por punto y coma', () => {
  assert.deepEqual(crearConfiguracion({ BUSQUEDAS: ' nintendo switch ; audífonos ; teclado ' }).busquedas,
    ['nintendo switch', 'audífonos', 'teclado']);
});

test('rechaza variables de búsqueda incompatibles', () => {
  assert.throws(() => crearConfiguracion({ BUSQUEDA: 'teclado', SEARCH_TERM: 'ratón' }), /solamente una variable/);
  assert.throws(() => crearConfiguracion({ BUSQUEDA: 'teclado', BUSQUEDAS: 'ratón;monitor' }), /solamente una variable/);
});

test('rechaza términos vacíos y valores que no sean texto', () => {
  for (const entorno of [{ BUSQUEDA: '' }, { SEARCH_TERM: ' ' }, { BUSQUEDAS: 'teclado;;ratón' }, { BUSQUEDAS: 'teclado;' }]) {
    assert.throws(() => crearConfiguracion(entorno), /Cada búsqueda debe tener un término/);
  }
  assert.throws(() => crearConfiguracion({ BUSQUEDA: 123 }), /debe contener texto/);
});

test('rechaza términos repetidos para evitar ejecuciones duplicadas', () => {
  assert.throws(() => crearConfiguracion({ BUSQUEDAS: 'Nintendo Switch; nintendo switch' }), /no deben repetirse/);
});

test('configura color y mayor precio solo en el tercer caso flexible', () => {
  const { casos } = crearConfiguracion({ COLOR_BUSQUEDA: 'Azul', ORDEN_PRECIO: '1' });
  assert.deepEqual(casos.map(caso => caso.color), ['Blanco', 'Blanco', 'Azul']);
  assert.deepEqual(casos.map(caso => caso.opcionOrden), ['sortPrice|0', 'sortPrice|0', 'sortPrice|1']);
  assert.equal(casos[2].etiquetaOrden, 'Mayor precio');
});

test('las búsquedas personalizadas reutilizan color, alternativa y ambos órdenes', () => {
  for (const orden of ['0', '1']) {
    const { casos } = crearConfiguracion({ BUSQUEDA: 'teclado', COLOR_BUSQUEDA: 'Rojo', ORDEN_PRECIO: orden });
    assert.equal(casos[0].color, 'Rojo');
    assert.equal(casos[0].permitirColorAlternativo, true);
    assert.equal(casos[0].opcionOrden, `sortPrice|${orden}`);
  }
});

test('rechaza colores vacíos y órdenes distintos de cero o uno', () => {
  assert.throws(() => crearConfiguracion({ COLOR_BUSQUEDA: ' ' }), /COLOR_BUSQUEDA debe contener/);
  for (const orden of ['', '2', 'menor', false]) {
    assert.throws(() => crearConfiguracion({ ORDEN_PRECIO: orden }), /ORDEN_PRECIO debe ser 0/);
  }
});

