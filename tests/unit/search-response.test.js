import assert from 'node:assert/strict';
import test from 'node:test';
import { assertFinalSearchState, captureSearchResponse, parseSearchProducts } from '../../src/search-response.js';

const endpoint = 'https://www.liverpool.com.mx/api/plp/search';

test('interpreta ambos extremos del intervalo promocional observado en la red', () => {
  const payload = makePayload();
  payload.data.records[0].priceInfo = { salePrice: 249, listPrice: { minPrice: 249, maxPrice: 299 }, promoPrice: { minPrice: 99.6, maxPrice: 119.6 } };
  const producto = parseSearchProducts(payload)[0];
  assert.equal(producto.price, 99.6);
  assert.equal(producto.maxPrice, 119.6);
});

test('rechaza intervalos incompletos, invertidos o mezclados con un precio único', () => {
  for (const promoPrice of [{ minPrice: 10 }, { maxPrice: 20 }, { minPrice: 20, maxPrice: 10 }, { price: 15, minPrice: 10, maxPrice: 20 }]) {
    const payload = makePayload();
    payload.data.records[0].priceInfo.promoPrice = promoPrice;
    assert.throws(() => parseSearchProducts(payload), /intervalo inválido o ambiguo/);
  }
});
// Los datos siguientes son sintéticos: estas pruebas no acceden a Liverpool.
const expected = {
  query: 'playstation 5',
  color: 'Blanco',
  sortOption: 'sortPrice|0',
  encryptedFilters: 'synthetic-color-context',
};

function makePayload() {
  // Reproduce los campos del contrato real con valores pequeños y controlados.
  return {
    meta: { status: 'OK', statusCode: 200 },
    data: {
      records: [
        { productId: 'product-1', title: 'Control inalámbrico', skuRepositoryId: 'variant-1', priceInfo: { salePrice: 399, listPrice: { price: 499 } } },
        { productId: 'product-2', title: 'Cargador', skuRepositoryId: 'variant-2', priceInfo: { salePrice: 449, promoPrice: { price: 440 } } },
      ],
      originalRequest: { search: { query: expected.query } },
      filtersGroups: [{ name: 'Color', filter: [
        { label: 'Blanco~~#ffffff', filterId: 'synthetic-white-filter', selected: true },
        { label: 'Negro~~#000000', filterId: 'synthetic-black-filter', selected: false },
      ] }],
      sortDisplayOptions: [
        { displayName: 'Menor precio', sortingId: expected.sortOption, selected: true },
        { displayName: 'Mayor precio', sortingId: 'sortPrice|1', selected: false },
      ],
      encryptedFilters: expected.encryptedFilters,
      pageInfo: { currentPage: 1 },
    },
  };
}

function makeResponse({
  url = endpoint,
  method = 'POST',
  status = 200,
  body = { query: expected.query, sortOption: expected.sortOption, encryptedFilters: expected.encryptedFilters },
  payload = makePayload(),
  jsonError,
  requestError,
} = {}) {
  // Imita únicamente los métodos de Response que necesita el adaptador.
  return {
    url: () => url,
    request: () => ({
      method: () => method,
      postDataJSON: () => {
        if (requestError) throw requestError;
        return body;
      },
    }),
    ok: () => status >= 200 && status < 300,
    status: () => status,
    json: async () => {
      if (jsonError) throw jsonError;
      return payload;
    },
  };
}

function makePage(responses) {
  // Comprueba que la escucha se registre antes de ejecutar la acción simulada.
  let predicate;
  let resolveResponse;
  let rejectResponse;
  return {
    waitForResponse(match, options) {
      assert.equal(options.timeout, 30_000);
      predicate = match;
      return new Promise((resolve, reject) => {
        resolveResponse = resolve;
        rejectResponse = reject;
      });
    },
    performAction() {
      assert.equal(typeof predicate, 'function', 'la escucha debe registrarse antes de la acción');
      for (const response of responses) {
        if (predicate(response)) {
          resolveResponse(response);
          return;
        }
      }
      rejectResponse(new Error('Ninguna respuesta coincide en esta prueba.'));
    },
  };
}

test('interpreta los resultados en orden y utiliza el precio promocional cuando existe', () => {
  assert.deepEqual(parseSearchProducts(makePayload()), [
    { id: 'product-1', name: 'Control inalámbrico', price: 399, campoPrecio: 'priceInfo.salePrice' },
    { id: 'product-2', name: 'Cargador', price: 440, campoPrecio: 'priceInfo.promoPrice.price' },
  ]);
});

test('reproduce la promoción observada en Nintendo y no compara con el precio anterior', () => {
  const payload = makePayload();
  payload.data.records[0].priceInfo = { salePrice: 13999, listPrice: { price: 13999 }, promoPrice: { price: 12879.08 } };
  assert.equal(parseSearchProducts(payload)[0].price, 12879.08);
});

test('rechaza promociones inválidas en lugar de esconderlas con el precio de venta', () => {
  for (const price of [null, '100', -1, NaN, Infinity]) {
    const payload = makePayload();
    payload.data.records[0].priceInfo.promoPrice = { price };
    assert.throws(() => parseSearchProducts(payload), /promoPrice.price/);
  }
});

test('rechaza estructuras de respuesta malformadas y metadatos de la API sin éxito', () => {
  for (const payload of [null, [], 'not a payload']) {
    assert.throws(() => parseSearchProducts(payload), /debe ser un objeto JSON/);
  }
  for (const meta of [undefined, { status: 'ERROR', statusCode: 200 }, { status: 'OK', statusCode: 500 }]) {
    const payload = makePayload();
    payload.meta = meta;
    assert.throws(() => parseSearchProducts(payload), /Error de la API de búsqueda de Liverpool/);
  }
  for (const data of [null, {}, { records: {} }]) {
    const payload = makePayload();
    payload.data = data;
    assert.throws(() => parseSearchProducts(payload), /data.records como un arreglo/);
  }
});

test('rechaza la ausencia de salePrice sin sustituirlo por listPrice ni promoPrice', () => {
  for (const price of [undefined, null, '399', NaN, Infinity, -1]) {
    const payload = makePayload();
    payload.data.records[0].priceInfo.salePrice = price;
    assert.throws(() => parseSearchProducts(payload), /data.records\[0\].priceInfo.salePrice/);
  }
});

test('rechaza identificadores y nombres inválidos sin sustituirlos por un SKU', () => {
  for (const id of [undefined, null, '', ' ', 123]) {
    const payload = makePayload();
    payload.data.records[0].productId = id;
    assert.throws(() => parseSearchProducts(payload), /data.records\[0\].productId/);
  }
  const payload = makePayload();
  payload.data.records[1].title = '  ';
  assert.throws(() => parseSearchProducts(payload), /data.records\[1\].title/);
});

test('acepta la etiqueta observada del color seleccionado con un código de color como sufijo', () => {
  assert.doesNotThrow(() => assertFinalSearchState(makePayload(), expected));
  const payload = makePayload();
  payload.data.filtersGroups[0].filter[0].label = 'Blanco';
  assert.doesNotThrow(() => assertFinalSearchState(payload, expected));
});

test('rechaza una respuesta de una consulta diferente', () => {
  const payload = makePayload();
  payload.data.originalRequest.search.query = 'other search';
  assert.throws(() => assertFinalSearchState(payload, expected), /consulta de búsqueda final no coincide/);
});

test('rechaza un color ausente, incorrecto o seleccionado junto con otro', () => {
  const missing = makePayload();
  missing.data.filtersGroups = [];
  assert.throws(() => assertFinalSearchState(missing, expected), /grupo de filtros Color/);

  const wrong = makePayload();
  wrong.data.filtersGroups[0].filter[0].selected = false;
  wrong.data.filtersGroups[0].filter[1].selected = true;
  assert.throws(() => assertFinalSearchState(wrong, expected), /seleccionado únicamente el color "Blanco"/);

  const additional = makePayload();
  additional.data.filtersGroups[0].filter[1].selected = true;
  assert.throws(() => assertFinalSearchState(additional, expected), /seleccionado únicamente el color "Blanco"/);
});

test('rechaza un orden incorrecto o varias opciones de orden seleccionadas', () => {
  const wrong = makePayload();
  wrong.data.sortDisplayOptions[0].selected = false;
  wrong.data.sortDisplayOptions[1].selected = true;
  assert.throws(() => assertFinalSearchState(wrong, expected), /seleccionado únicamente el orden "sortPrice\|0"/);
  const multiple = makePayload();
  multiple.data.sortDisplayOptions[1].selected = true;
  assert.throws(() => assertFinalSearchState(multiple, expected), /seleccionado únicamente el orden/);
});

test('rechaza un contexto de filtros modificado o una página de resultados posterior', () => {
  const changed = makePayload();
  changed.data.encryptedFilters = 'different-synthetic-filter-context';
  assert.throws(() => assertFinalSearchState(changed, expected), /encryptedFilters de la búsqueda final cambió después de ordenar/);
  const laterPage = makePayload();
  laterPage.data.pageInfo.currentPage = 2;
  assert.throws(() => assertFinalSearchState(laterPage, expected), /debe estar en la página 1/);
});

test('captura únicamente la ruta exacta de la API, el método POST, la consulta, el orden y el contexto de filtros', async () => {
  const body = { query: expected.query, sortOption: expected.sortOption, encryptedFilters: expected.encryptedFilters };
  const correct = makeResponse({ body: { ...body, gbi_visitorId: 'synthetic-visitor-not-for-report', channel: 'WEB' } });
  const page = makePage([
    makeResponse({ url: 'https://unrelated.example/api/plp/search' }),
    makeResponse({ url: `${endpoint}/suggestions` }),
    makeResponse({ method: 'GET' }),
    makeResponse({ requestError: new Error('cuerpo malformado') }),
    makeResponse({ body: { ...body, query: 'different search' } }),
    makeResponse({ body: { ...body, sortOption: 'sortPrice|1' } }),
    makeResponse({ body: { ...body, encryptedFilters: 'previous-filter-context' } }),
    correct,
  ]);

  const result = await captureSearchResponse(page, body, () => page.performAction());
  assert.equal(result.url, endpoint);
  assert.equal(result.status, 200);
  assert.deepEqual(result.request, body);
  assert.deepEqual(result.payload, makePayload());
});

test('acepta únicamente el filtro de color aplicado solicitado', async () => {
  const body = { query: expected.query, appliedFilters: ['synthetic-white-filter'] };
  const page = makePage([
    makeResponse({ body: { query: expected.query } }),
    makeResponse({ body: { ...body, appliedFilters: ['synthetic-black-filter'] } }),
    makeResponse({ body: { ...body, appliedFilters: ['synthetic-white-filter', 'extra-filter'] } }),
    makeResponse({ body }),
  ]);
  const result = await captureSearchResponse(page, { query: expected.query, appliedFilterId: 'synthetic-white-filter' }, () => page.performAction());
  assert.deepEqual(result.request, body);
  assert.notEqual(result.request.appliedFilters, body.appliedFilters);
});

test('falla ante errores HTTP, respuestas que no son JSON y errores de la API', async () => {
  const errorPayload = makePayload();
  errorPayload.meta.status = 'ERROR';
  for (const [response, message] of [
    [makeResponse({ status: 403 }), /HTTP 403/],
    [makeResponse({ jsonError: new SyntaxError('HTML inesperado') }), /no es un JSON válido/],
    [makeResponse({ payload: errorPayload }), /Error de la API de búsqueda de Liverpool/],
  ]) {
    const page = makePage([response]);
    await assert.rejects(captureSearchResponse(page, { query: expected.query }, () => page.performAction()), message);
  }
});

test('observa los rechazos tanto de la espera de respuesta como de la acción', async () => {
  const page = { waitForResponse: () => Promise.reject(new Error('Falló la espera de respuesta')) };
  await assert.rejects(captureSearchResponse(page, { query: expected.query }, () => {
    throw new Error('Falló la acción');
  }), /Falló/);
});
