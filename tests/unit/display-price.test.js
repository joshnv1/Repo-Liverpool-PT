import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDisplayPrice, parseDisplayPriceRange } from '../../src/display-price.js';

// Formatos reales de la tarjeta y entradas ambiguas que nunca deben aceptarse.
test('lee los pesos y centavos separados en el DOM sin multiplicar el precio', () => {
  assert.equal(parseDisplayPrice('$399.00'), 399);
  assert.equal(parseDisplayPrice('$ 1,010.40 '), 1010.4);
  assert.equal(parseDisplayPrice('$\u00a014,699.00'), 14699);
});

test('rechaza rangos de precios, precios originales y de oferta combinados e importes mal formados', () => {
  for (const value of ['$39900', '$399.00$499.00', '$399.00 - $499.00', '$1,01.00', 'Desde $399.00', '']) {
    assert.throws(() => parseDisplayPrice(value), /Precio de venta de la interfaz no compatible o ambiguo/);
  }
});

test('conserva ambos extremos de un intervalo y rechaza mezclar promoción y precio original', () => {
  assert.deepEqual(parseDisplayPriceRange('$99.60 - $119.60'), { price: 99.6, maxPrice: 119.6 });
  assert.deepEqual(parseDisplayPriceRange('$399.00'), { price: 399 });
  assert.throws(() => parseDisplayPriceRange('$99.60 - $119.60$249.00 - $299.00'), /exactamente dos precios/);
  assert.throws(() => parseDisplayPriceRange('$119.60 - $99.60'), /no puede ser menor/);
});
