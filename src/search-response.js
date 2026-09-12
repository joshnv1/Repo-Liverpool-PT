// Ruta y esquema observados en las peticiones reales de las herramientas de desarrollo.
const SEARCH_ORIGIN = 'https://www.liverpool.com.mx';
const SEARCH_PATH = '/api/plp/search';
const RESPONSE_TIMEOUT_MS = 30_000;

function isObject(value) {
  // Un arreglo y null no representan los objetos exigidos por el contrato de red.
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireText(value, label) {
  // No se aceptan identificadores o criterios vacíos porque crearían falsas coincidencias.
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${label} debe ser una cadena de texto no vacía.`);
  }
}

function requireSuccessfulPayload(payload) {
  // Un HTTP 200 puede contener un error de aplicación; también se revisa meta.
  if (!isObject(payload)) {
    throw new Error('El contenido de la respuesta de búsqueda de Liverpool debe ser un objeto JSON.');
  }
  if (payload.meta?.status !== 'OK' || payload.meta?.statusCode !== 200) {
    throw new Error(`Error de la API de búsqueda de Liverpool: se esperaba meta.status="OK" y meta.statusCode=200; se recibió status=${String(payload.meta?.status)}, statusCode=${String(payload.meta?.statusCode)}.`);
  }
  if (!isObject(payload.data) || !Array.isArray(payload.data.records)) {
    throw new Error('El contenido de la respuesta de búsqueda de Liverpool debe incluir data.records como un arreglo.');
  }
  return payload.data;
}

function requestMatches(response, criteria) {
  // Ignora otras búsquedas, sugerencias y respuestas anteriores de esta misma página.
  try {
    const url = new URL(response.url());
    if (url.origin !== SEARCH_ORIGIN || url.pathname !== SEARCH_PATH) return false;
    const request = response.request();
    if (request.method() !== 'POST') return false;
    const body = request.postDataJSON();
    if (!isObject(body) || body.query !== criteria.query) return false;
    if (criteria.appliedFilterId !== undefined) {
      if (!Array.isArray(body.appliedFilters)
        || body.appliedFilters.length !== 1
        || body.appliedFilters[0] !== criteria.appliedFilterId) return false;
    }
    if (criteria.sortOption !== undefined && body.sortOption !== criteria.sortOption) return false;
    if (criteria.encryptedFilters !== undefined && body.encryptedFilters !== criteria.encryptedFilters) return false;
    return true;
  } catch {
    // Ignora el tráfico ajeno o malformado; solo acepta la búsqueda esperada.
    return false;
  }
}

function sanitizeRequest(body) {
  // Solo se adjuntan los campos útiles para verificar consulta, color y orden.
  const request = { query: body.query };
  if (body.appliedFilters !== undefined) {
    if (!Array.isArray(body.appliedFilters)
      || !body.appliedFilters.every((filter) => typeof filter === 'string')) {
      throw new Error('appliedFilters de la solicitud de búsqueda debe ser un arreglo de cadenas de texto.');
    }
    request.appliedFilters = [...body.appliedFilters];
  }
  for (const field of ['sortOption', 'encryptedFilters']) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string') {
        throw new Error(`${field} de la solicitud de búsqueda debe ser una cadena de texto.`);
      }
      request[field] = body[field];
    }
  }
  return request;
}

/**
 * Observa la búsqueda real generada por una acción, sin simular su respuesta.
 * Los criterios describen solo los campos esperados de la solicitud para este paso.
 * Los metadatos devueltos excluyen identificadores de visitantes y campos ajenos.
 */
export async function captureSearchResponse(page, criteria, action) {
  if (!isObject(criteria)) throw new TypeError('Los criterios de búsqueda deben ser un objeto.');
  requireText(criteria.query, 'El criterio de búsqueda criteria.query');
  for (const field of ['appliedFilterId', 'sortOption', 'encryptedFilters']) {
    if (criteria[field] !== undefined) requireText(criteria[field], `El criterio de búsqueda criteria.${field}`);
  }
  if (typeof action !== 'function') throw new TypeError('La acción de búsqueda debe ser una función.');

  // Registra primero la escucha. Promise.all observa el rechazo de cualquiera de
  // las operaciones, incluso si la acción falla de inmediato o la respuesta tarda demasiado.
  const responsePromise = page.waitForResponse(
    (response) => requestMatches(response, criteria),
    { timeout: RESPONSE_TIMEOUT_MS },
  );
  const [response] = await Promise.all([responsePromise, Promise.resolve().then(action)]);

  if (!response.ok()) {
    throw new Error(`La respuesta de búsqueda de Liverpool devolvió HTTP ${response.status()}.`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (cause) {
    throw new Error('La respuesta de búsqueda de Liverpool no es un JSON válido.', { cause });
  }
  requireSuccessfulPayload(payload);

  return {
    url: response.url(),
    status: response.status(),
    request: sanitizeRequest(response.request().postDataJSON()),
    payload,
  };
}

/** Adapta el esquema observado sin usar el precio de lista ni el ID de variante como sustitutos. */
export function parseSearchProducts(payload) {
  const data = requireSuccessfulPayload(payload);
  return data.records.map((record, index) => {
    const path = `data.records[${index}]`;
    if (!isObject(record)) throw new Error(`${path} debe ser un objeto de producto.`);
    requireText(record.productId, `${path}.productId`);
    requireText(record.title, `${path}.title`);
    const salePrice = record.priceInfo?.salePrice;
    if (typeof salePrice !== 'number' || !Number.isFinite(salePrice) || salePrice < 0
      || !Number.isSafeInteger(Math.round(salePrice * 100))) {
      throw new Error(`${path}.priceInfo.salePrice debe ser un número finito, no negativo y representable en centavos.`);
    }
    // La captura real de Nintendo mostró una promoción visible de 12879.08 frente
    // a salePrice=13999. promoPrice.price contiene ese importe promocional exacto.
    // Se compara la promoción cuando existe; el precio de lista nunca la sustituye.
    const promoPrice = record.priceInfo.promoPrice?.price;
    const promo = record.priceInfo.promoPrice;
    if (promo?.minPrice !== undefined || promo?.maxPrice !== undefined) {
      const valido = valor => typeof valor === 'number' && Number.isFinite(valor)
        && valor >= 0 && Number.isSafeInteger(Math.round(valor * 100));
      if (promoPrice !== undefined || !valido(promo.minPrice) || !valido(promo.maxPrice) || promo.maxPrice < promo.minPrice) {
        throw new Error(`${path}.priceInfo.promoPrice contiene un intervalo inválido o ambiguo.`);
      }
      // Esquema observado: una tarjeta muestra $99.60 - $119.60 y la red incluye
      // promoPrice.minPrice/maxPrice. Se validan ambos, sin sustituirlos por listPrice.
      return { id: record.productId.trim(), name: record.title, price: promo.minPrice, maxPrice: promo.maxPrice,
        campoPrecio: 'priceInfo.promoPrice.minPrice/maxPrice' };
    }
    if (promoPrice !== undefined && (typeof promoPrice !== 'number' || !Number.isFinite(promoPrice)
      || promoPrice < 0 || !Number.isSafeInteger(Math.round(promoPrice * 100)))) {
      throw new Error(`${path}.priceInfo.promoPrice.price debe ser un número finito, no negativo y representable en centavos.`);
    }
    return { id: record.productId.trim(), name: record.title, price: promoPrice ?? salePrice,
      campoPrecio: promoPrice !== undefined ? 'priceInfo.promoPrice.price' : 'priceInfo.salePrice' };
  });
}

/** Verifica que la respuesta represente la búsqueda, el color, el orden y la página finales. */
export function assertFinalSearchState(payload, expected) {
  if (!isObject(expected)) throw new TypeError('El estado final esperado de la búsqueda debe ser un objeto.');
  for (const field of ['query', 'color', 'sortOption', 'encryptedFilters']) {
    requireText(expected[field], `El campo ${field} esperado de la búsqueda final`);
  }
  const data = requireSuccessfulPayload(payload);
  if (data.originalRequest?.search?.query !== expected.query) {
    throw new Error(`La consulta de búsqueda final no coincide: se esperaba "${expected.query}" y se recibió "${String(data.originalRequest?.search?.query)}".`);
  }

  if (!Array.isArray(data.filtersGroups)) {
    throw new Error('Falta data.filtersGroups en la búsqueda final.');
  }
  const colorGroups = data.filtersGroups.filter((group) => group?.name === 'Color');
  if (colorGroups.length !== 1 || !Array.isArray(colorGroups[0].filter)) {
    throw new Error('La búsqueda final debe incluir exactamente un grupo de filtros Color.');
  }
  const selectedColors = colorGroups[0].filter.filter((filter) => filter?.selected === true);
  // La API observada agrega el código de color; por ejemplo, "Blanco~~#ffffff".
  const colorLabel = selectedColors[0]?.label;
  if (selectedColors.length !== 1 || typeof colorLabel !== 'string'
    || colorLabel.split('~~')[0].trim() !== expected.color) {
    throw new Error(`La búsqueda final debe tener seleccionado únicamente el color "${expected.color}".`);
  }

  if (!Array.isArray(data.sortDisplayOptions)) {
    throw new Error('Falta data.sortDisplayOptions en la búsqueda final.');
  }
  const selectedSorts = data.sortDisplayOptions.filter((option) => option?.selected === true);
  // La misma comprobación sirve para sortPrice|0 y sortPrice|1 según el caso.
  if (selectedSorts.length !== 1 || selectedSorts[0].sortingId !== expected.sortOption) {
    throw new Error(`La búsqueda final debe tener seleccionado únicamente el orden "${expected.sortOption}".`);
  }
  if (data.encryptedFilters !== expected.encryptedFilters) {
    throw new Error('encryptedFilters de la búsqueda final cambió después de ordenar; la respuesta capturada tiene un contexto de filtros diferente.');
  }
  if (data.pageInfo?.currentPage !== 1) {
    throw new Error(`La búsqueda final debe estar en la página 1; se recibió ${String(data.pageInfo?.currentPage)}.`);
  }
}
