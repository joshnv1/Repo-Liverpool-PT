import test from 'node:test';
import assert from 'node:assert/strict';
import { seleccionarColor } from '../../src/seleccion-color.js';

// Los casos controlados comprueban la prioridad solicitada sin depender del catálogo.
test('prefiere cualquier color solicitado si está disponible', () => {
  const resultado = seleccionarColor(' rojo ', ['Negro', 'Rojo', 'Blanco'], true);
  assert.equal(resultado.utilizado, 'Rojo');
  assert.equal(resultado.alternativo, false);
});
test('usa Negro antes de Blanco y registra por qué sustituyó el color', () => {
  const resultado = seleccionarColor('Azul', ['Blanco', 'Negro'], true);
  assert.equal(resultado.solicitado, 'Azul');
  assert.equal(resultado.utilizado, 'Negro');
  assert.equal(resultado.alternativo, true);
  assert.match(resultado.motivo, /no está disponible/);
});
test('usa Blanco si no existen el solicitado ni Negro', () => {
  assert.equal(seleccionarColor('Azul', ['Rojo', 'Blanco'], true).utilizado, 'Blanco');
});
test('falla si no están disponibles el color solicitado ni las alternativas', () => {
  assert.throws(() => seleccionarColor('Azul', ['Rojo'], true), /ni las alternativas Negro o Blanco/);
});
test('el caso estricto nunca sustituye el color pedido', () => {
  assert.throws(() => seleccionarColor('Blanco', ['Negro'], false), /No está disponible/);
});
test('rechaza datos de color inválidos', () => {
  assert.throws(() => seleccionarColor('', ['Negro']), /debe contener texto/);
  assert.throws(() => seleccionarColor('Negro', [null]), /lista de nombres/);
});
