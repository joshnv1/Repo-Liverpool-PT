import assert from 'node:assert/strict';
import test from 'node:test';
import { compareProducts, normalizeName } from '../../src/products.js';

test('compara el extremo superior de los intervalos aunque el mínimo coincida', () => {
  const producto = { id: 'intervalo', name: 'Producto con variantes', price: 99.6, maxPrice: 119.6 };
  assert.deepEqual(compareProducts([producto], [producto]).discrepancies, []);
  const resultado = compareProducts([producto], [{ ...producto, maxPrice: 120 }]);
  assert.deepEqual(resultado.discrepancies.map(diferencia => diferencia.field), ['maxPrice']);
  assert.throws(() => compareProducts([producto], [producto, { ...producto, maxPrice: 120 }]), /maxPrice/);
  assert.throws(() => compareProducts([{ ...producto, maxPrice: 98 }], [producto]), /maxPrice/);
});

// Ejemplos de la ejecución manual usados como datos de las pruebas unitarias.
// El catálogo real puede cambiar; estos datos no fijan los resultados esperados de la prueba en vivo.
const observedProducts = [
  { id: '1112561711', name: 'Control inalámbrico para playstation 3', price: 399 },
  { id: '1143667819', name: 'Cargador de control PS USB tipo C', price: 449 },
  { id: '1095620724', name: 'Black Clover Quartet Knights estándar para PS4', price: 539 },
  { id: '1081814640', name: 'Street Fighter V estándar para PS4', price: 559 },
  { id: '1095096286', name: 'Call Of Duty Ghosts estándar para PS3', price: 629 },
];

test('encuentra tres de los cinco productos en cualquier posición de la respuesta y conserva el orden de la interfaz', () => {
  const result = compareProducts(observedProducts, [
    { id: 'other', name: 'Otro resultado de búsqueda', price: 10 },
    observedProducts[4],
    observedProducts[2],
    observedProducts[0],
  ]);

  assert.equal(result.matchedCount, 3);
  assert.deepEqual(result.matches.map(({ id }) => id), ['1112561711', '1095620724', '1095096286']);
  assert.deepEqual(result.missing, [observedProducts[1], observedProducts[3]]);
  assert.deepEqual(result.discrepancies, []);
  assert.deepEqual(result.matches[0].uiProduct, observedProducts[0]);
  assert.deepEqual(result.matches[0].responseProduct, observedProducts[0]);
});

test('reporta diferencias reales de nombre y precio aunque coincida el identificador del producto', () => {
  const ui = { id: 'console', name: 'Consola PS5 1 TB', price: 14699 };
  const response = { id: 'console', name: 'Consola PS5 2 TB', price: 20599 };
  const result = compareProducts([ui], [response]);

  assert.equal(result.matchedCount, 1);
  assert.deepEqual(result.discrepancies, [
    { id: 'console', field: 'name', uiValue: ui.name, responseValue: response.name },
    { id: 'console', field: 'price', uiValue: 14699, responseValue: 20599 },
  ]);
});

test('normaliza NFC, espacios y mayúsculas, conservando los acentos y la puntuación', () => {
  assert.equal(normalizeName('  CONTROL\n  INALA\u0301MBRICO\u00a0PS5 '), 'control inalámbrico ps5');
  assert.notEqual(normalizeName('estándar'), normalizeName('estandar'));
  assert.notEqual(normalizeName('PS-5'), normalizeName('PS5'));
  const result = compareProducts(
    [{ id: '1', name: '  Control\nINALÁMBRICO ', price: 399 }],
    [{ id: '1', name: 'control inala\u0301mbrico', price: 399 }],
  );
  assert.deepEqual(result.discrepancies, []);
});

test('compara los precios redondeados a centavos y reporta una diferencia de un centavo', () => {
  const product = { id: '1', name: 'Producto', price: 0.1 + 0.2 };
  assert.deepEqual(compareProducts([product], [{ ...product, price: 0.30 }]).discrepancies, []);
  assert.deepEqual(compareProducts([{ ...product, price: 1.005 }], [{ ...product, price: 1.01 }]).discrepancies, []);
  assert.deepEqual(compareProducts([{ ...product, price: 399.004 }], [{ ...product, price: 399 }]).discrepancies, []);
  assert.equal(compareProducts([{ ...product, price: 399 }], [{ ...product, price: 399.01 }]).discrepancies.length, 1);
});

test('descarta las coincidencias basadas solo en el nombre y deja el umbral de aceptación a quien lo llama', () => {
  const ui = observedProducts[0];
  const result = compareProducts([ui], [{ ...ui, id: 'different-id' }]);
  assert.equal(result.matchedCount, 0);
  assert.deepEqual(result.missing, [ui]);
  assert.deepEqual(result.discrepancies, []);
});

test('rechaza identificadores duplicados en la interfaz para evitar un conteo de coincidencias inflado', () => {
  const product = observedProducts[0];
  assert.throws(() => compareProducts([product, { ...product }], [product]), /Identificador de producto duplicado en la interfaz: "1112561711"/);
  assert.throws(() => compareProducts([product, { ...product, id: ` ${product.id} ` }], [product]), /Identificador de producto duplicado en la interfaz/);
});

test('elimina duplicados equivalentes de la respuesta sin alterar el conteo de coincidencias', () => {
  const product = observedProducts[0];
  const result = compareProducts([product], [product, { ...product, name: ` ${product.name.toUpperCase()} ` }]);
  assert.equal(result.matchedCount, 1);
  assert.equal(result.matches.length, 1);
  assert.deepEqual(result.discrepancies, []);
});

test('rechaza identificadores ambiguos en la respuesta que tienen nombres o precios distintos', () => {
  const product = observedProducts[0];
  assert.throws(
    () => compareProducts([product], [product, { ...product, name: 'Producto diferente' }]),
    /Conflicto entre productos de la respuesta con id "1112561711": valores distintos en name/,
  );
  assert.throws(
    () => compareProducts([product], [product, { ...product, price: 399.01 }]),
    /Conflicto entre productos de la respuesta.*valores distintos en price/,
  );
});

test('rechaza identificadores inválidos en cualquiera de las fuentes e indica su ubicación', () => {
  for (const id of ['', '   ', null, undefined, 1112561711]) {
    const invalid = { ...observedProducts[0], id };
    assert.throws(() => compareProducts([invalid], []), /uiProducts\[0\]: id debe ser una cadena de texto no vacía/);
    assert.throws(() => compareProducts([], [invalid]), /responseProducts\[0\]: id debe ser una cadena de texto no vacía/);
  }
});

test('rechaza productos incompletos, precios inválidos y colecciones inválidas', () => {
  const product = observedProducts[0];
  for (const name of ['', '\n ', null, 123]) {
    assert.throws(() => compareProducts([{ ...product, name }], []), /name debe ser una cadena de texto no vacía/);
  }
  for (const price of ['399.00', null, undefined, NaN, Infinity, -1, Number.MAX_VALUE]) {
    assert.throws(() => compareProducts([{ ...product, price }], []), /price debe ser un número finito, no negativo/);
  }
  assert.throws(() => compareProducts([null], []), /uiProducts\[0\]: se esperaba un objeto de producto/);
  assert.throws(() => compareProducts({}, []), /deben ser arreglos/);
  assert.throws(() => compareProducts([], null), /deben ser arreglos/);
});

test('conserva los datos de entrada y devuelve registros de productos independientes', () => {
  const ui = Object.freeze({ ...observedProducts[0] });
  const response = Object.freeze({ ...observedProducts[0] });
  const result = compareProducts(Object.freeze([ui]), Object.freeze([response]));
  result.matches[0].uiProduct.price = 999;
  result.matches[0].responseProduct.name = 'Salida modificada';
  assert.equal(ui.price, 399);
  assert.equal(response.name, observedProducts[0].name);
});
