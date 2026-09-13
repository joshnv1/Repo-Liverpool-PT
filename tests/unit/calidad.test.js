import test from 'node:test';
import assert from 'node:assert/strict';
import { leerLimiteBusqueda, validarDuracionBusqueda, crearReporteAccesibilidad } from '../../src/calidad.js';

// El presupuesto debe ser explícito y rechazar errores de configuración antes
// de navegar: números no finitos, unidades añadidas y conversiones ambiguas.
test('usa 15 segundos y admite los extremos configurables del presupuesto', () => {
  assert.equal(leerLimiteBusqueda({}), 15_000);
  for (const valor of [1000, '1000', 60000, '60000', ' 2500 ']) {
    assert.equal(leerLimiteBusqueda({ LIMITE_BUSQUEDA_MS: valor }), Number(valor));
  }
});

test('rechaza presupuestos vacíos, fuera de rango o que no sean enteros', () => {
  for (const valor of ['', ' ', null, true, false, [], {}, '15s', '1e4', '15000.5', 15000.5, 999, 60001, 0, -1000, Infinity, NaN]) {
    assert.throws(() => leerLimiteBusqueda({ LIMITE_BUSQUEDA_MS: valor }), /entero entre 1000 y 60000/);
  }
});

test('aprueba solo una duración estrictamente menor al presupuesto', () => {
  assert.doesNotThrow(() => validarDuracionBusqueda(0, 15_000));
  assert.doesNotThrow(() => validarDuracionBusqueda(14_999.99, 15_000));
  assert.throws(() => validarDuracionBusqueda(15_000, 15_000), /tardó 15000\.00 ms.*menos de 15000 ms/);
  assert.throws(() => validarDuracionBusqueda(16_120.5, 15_000), /tardó 16120\.50 ms/);
});

test('rechaza mediciones inválidas sin convertir cadenas a números', () => {
  for (const duracion of [-1, NaN, Infinity, -Infinity, '1000', null, undefined]) {
    assert.throws(() => validarDuracionBusqueda(duracion, 15_000), /duración.*número finito/);
  }
  for (const limite of [0, -1, NaN, Infinity, -Infinity, '15000', null, undefined]) {
    assert.throws(() => validarDuracionBusqueda(1000, limite), /límite.*número finito/);
  }
});

// Datos controlados que incluyen dos nodos de una regla y un resultado pendiente;
// permiten comprobar que el informe no oculta problemas para aparentar conformidad.
function resultadoEjemplo() {
  return {
    timestamp: '2026-09-13T12:00:00.000Z',
    url: 'https://www.liverpool.com.mx/tienda?s=playstation%205',
    testEngine: { name: 'axe-core', version: '4.11.0' },
    violations: [{
      id: 'button-name', impact: 'critical', help: 'Los botones necesitan un nombre',
      description: 'Un nombre permite identificar la acción.', helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/button-name',
      nodes: [
        { target: ['#boton-uno'], html: '<button id="boton-uno"></button>', failureSummary: 'Falta un nombre accesible.' },
        { target: ['#boton-dos'], html: '<button id="boton-dos"></button>', failureSummary: 'Falta una etiqueta.' },
      ],
    }],
    passes: [{ id: 'document-title', nodes: [{ target: ['html'] }] }],
    incomplete: [{
      id: 'color-contrast', impact: 'serious', help: 'Revisar contraste', description: 'Se requiere revisión visual.',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/color-contrast',
      nodes: [{ target: [['iframe', '.texto']], html: '<span>Texto</span>', failureSummary: 'No fue posible determinar el fondo.' }],
    }],
  };
}

test('el informe incluye metadatos, todos los nodos, incumplimientos y revisión pendiente', () => {
  const resultado = resultadoEjemplo();
  const previo = structuredClone(resultado);
  const html = crearReporteAccesibilidad(resultado);
  for (const esperado of ['lang="es"', resultado.timestamp, 'axe-core 4.11.0', 'button-name', '#boton-uno', '#boton-dos',
    'color-contrast', 'iframe', '.texto', 'Falta una etiqueta.', 'No fue posible determinar el fondo.',
    'Crítico', 'Serio', 'no exige cero violaciones', 'requieren revisión manual']) {
    assert.ok(html.includes(esperado), `El informe debe incluir: ${esperado}`);
  }
  assert.match(html, /Incumplimientos detectados<\/th><td>1<\/td><td>2<\/td>/);
  assert.match(html, /Sin incumplimientos detectados<\/th><td>1<\/td><td>1<\/td>/);
  assert.match(html, /Revisión manual pendiente<\/th><td>1<\/td><td>1<\/td>/);
  assert.deepEqual(resultado, previo, 'Presentar la evidencia no debe modificar el resultado original de axe.');
});

test('escapa marcado y atributos procedentes de la página en todos los campos', () => {
  const resultado = resultadoEjemplo();
  const malicioso = '<script>alert("x")</script><img src=x onerror=alert(1)> & \'dato\'';
  resultado.timestamp = malicioso;
  resultado.url = malicioso;
  resultado.testEngine = { name: malicioso, version: malicioso };
  for (const grupo of [resultado.violations, resultado.incomplete]) {
    Object.assign(grupo[0], { id: malicioso, help: malicioso, impact: malicioso, description: malicioso, helpUrl: malicioso });
    grupo[0].nodes = [{ target: [malicioso], html: malicioso, failureSummary: malicioso }];
  }
  const html = crearReporteAccesibilidad(resultado);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img '));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.ok(html.includes('&amp; &#39;dato&#39;'));
  assert.ok(!html.includes('<a href='), 'Las URL inválidas deben presentarse como texto, sin enlaces.');
});

test('solo crea enlaces HTTP y HTTPS y conserva como texto las otras URL', () => {
  const resultado = resultadoEjemplo();
  resultado.url = 'https://example.com/?a=1&b="dato"';
  resultado.violations[0].helpUrl = 'javascript:alert(1)';
  resultado.incomplete[0].helpUrl = 'data:text/html,<script>alert(1)</script>';
  let html = crearReporteAccesibilidad(resultado);
  assert.match(html, /href="https:\/\/example\.com\/\?a=1&amp;b=%22dato%22"/);
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('href="data:'));
  assert.ok(html.includes('javascript:alert(1)'));
  resultado.url = 'http://example.com/evidencia';
  html = crearReporteAccesibilidad(resultado);
  assert.ok(html.includes('href="http://example.com/evidencia"'));
});

test('distingue ausencia de hallazgos de una afirmación de accesibilidad completa', () => {
  const html = crearReporteAccesibilidad({ violations: [], passes: [], incomplete: [] });
  assert.ok(html.includes('axe no detectó incumplimientos en este análisis automático.'));
  assert.ok(html.includes('axe no devolvió resultados incompletos.'));
  assert.ok(html.includes('no declara') || html.includes('ni declara que el sitio sea accesible'));
  assert.ok(html.includes('Versión no proporcionada'));
});

test('un resultado incompleto del ejecutor no se transforma en un informe sin problemas', () => {
  for (const resultado of [undefined, null, {}, { violations: [], passes: [] }, { violations: {}, passes: [], incomplete: [] }]) {
    assert.throws(() => crearReporteAccesibilidad(resultado), /listas violations, passes e incomplete/);
  }
});
