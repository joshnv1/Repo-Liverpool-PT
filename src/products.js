/**
 * Normaliza diferencias de presentación sin ocultar acentos, puntuación,
 * números de modelo u otras diferencias significativas en el nombre del producto.
 */
export function normalizeName(name) {
  if (typeof name !== 'string') {
    throw new TypeError('El nombre del producto debe ser una cadena de texto.');
  }

  return name.normalize('NFC').replace(/\s+/gu, ' ').trim().toLowerCase();
}

function priceInCents(price) {
  // Compensa la representación binaria de los decimales al redondear a centavos.
  return Math.round((price + Number.EPSILON * Math.max(1, price)) * 100);
}

function validateProduct(product, source, index) {
  // Incluye fuente y posición en el error para localizar el dato incompleto.
  const location = `${source}[${index}]`;

  if (!product || typeof product !== 'object' || Array.isArray(product)) {
    throw new TypeError(`${location}: se esperaba un objeto de producto.`);
  }
  if (typeof product.id !== 'string' || !product.id.trim()) {
    throw new TypeError(`${location}: id debe ser una cadena de texto no vacía.`);
  }
  if (typeof product.name !== 'string' || !normalizeName(product.name)) {
    throw new TypeError(`${location} (id ${product.id}): name debe ser una cadena de texto no vacía.`);
  }
  if (
    typeof product.price !== 'number'
    || !Number.isFinite(product.price)
    || product.price < 0
    || !Number.isSafeInteger(priceInCents(product.price))
  ) {
    throw new TypeError(`${location} (id ${product.id}): price debe ser un número finito, no negativo y representable en centavos.`);
  }

  if (product.maxPrice !== undefined && (typeof product.maxPrice !== 'number'
    || !Number.isFinite(product.maxPrice) || product.maxPrice < product.price
    || !Number.isSafeInteger(priceInCents(product.maxPrice)))) {
    throw new TypeError(`${location}: maxPrice debe ser un precio válido mayor o igual que price.`);
  }
  return { id: product.id.trim(), name: product.name, price: product.price,
    ...(product.maxPrice !== undefined ? { maxPrice: product.maxPrice } : {}) };
}

/**
 * Compara los productos de la interfaz con todos los de la respuesta de búsqueda correspondiente.
 * Los identificadores establecen la identidad; las diferencias de nombre y precio se reportan por separado.
 * Quien llama esta función define las reglas de aceptación, como exigir cinco productos
 * en la interfaz, al menos tres identificadores coincidentes y ninguna discrepancia.
 *
 * @param {{id: string, name: string, price: number}[]} uiProducts
 * @param {{id: string, name: string, price: number}[]} responseProducts
 * @returns {{matchedCount: number, missing: object[], discrepancies: object[], matches: object[]}}
 */
export function compareProducts(uiProducts, responseProducts) {
  if (!Array.isArray(uiProducts) || !Array.isArray(responseProducts)) {
    throw new TypeError('uiProducts y responseProducts deben ser arreglos.');
  }

  const ui = uiProducts.map((product, index) => validateProduct(product, 'uiProducts', index));
  const response = responseProducts.map((product, index) => validateProduct(product, 'responseProducts', index));
  const uiIds = new Set();
  const responseById = new Map();

  // Un mismo identificador visible no puede contar dos veces hacia el mínimo.
  for (const product of ui) {
    if (uiIds.has(product.id)) {
      throw new Error(`Identificador de producto duplicado en la interfaz: "${product.id}"; cada resultado debe identificar un producto distinto.`);
    }
    uiIds.add(product.id);
  }

  // El índice permite buscar por ID aunque la respuesta tenga más de cinco productos.
  // Duplicados equivalentes se unifican; duplicados contradictorios son un error.
  for (const product of response) {
    const existing = responseById.get(product.id);
    if (existing) {
      const inconsistentFields = [];
      if (normalizeName(existing.name) !== normalizeName(product.name)) {
        inconsistentFields.push('name');
      }
      if (priceInCents(existing.price) !== priceInCents(product.price)) {
        inconsistentFields.push('price');
      }
      if ((existing.maxPrice !== undefined || product.maxPrice !== undefined)
        && priceInCents(existing.maxPrice ?? existing.price) !== priceInCents(product.maxPrice ?? product.price)) {
        inconsistentFields.push('maxPrice');
      }
      if (inconsistentFields.length) {
        throw new Error(`Conflicto entre productos de la respuesta con id "${product.id}": valores distintos en ${inconsistentFields.join(' y ')}.`);
      }
      continue;
    }
    responseById.set(product.id, product);
  }

  const missing = [];
  const discrepancies = [];
  const matches = [];

  // Cada coincidencia conserva ambos registros para explicar cualquier diferencia.
  for (const uiProduct of ui) {
    const responseProduct = responseById.get(uiProduct.id);
    if (!responseProduct) {
      missing.push(uiProduct);
      continue;
    }

    matches.push({ id: uiProduct.id, uiProduct, responseProduct });
    if (normalizeName(uiProduct.name) !== normalizeName(responseProduct.name)) {
      discrepancies.push({ id: uiProduct.id, field: 'name', uiValue: uiProduct.name, responseValue: responseProduct.name });
    }
    if (priceInCents(uiProduct.price) !== priceInCents(responseProduct.price)) {
      discrepancies.push({ id: uiProduct.id, field: 'price', uiValue: uiProduct.price, responseValue: responseProduct.price });
    }
    // Un intervalo también debe coincidir en su extremo superior.
    if ((uiProduct.maxPrice !== undefined || responseProduct.maxPrice !== undefined)
      && priceInCents(uiProduct.maxPrice ?? uiProduct.price) !== priceInCents(responseProduct.maxPrice ?? responseProduct.price)) {
      discrepancies.push({ id: uiProduct.id, field: 'maxPrice', uiValue: uiProduct.maxPrice ?? uiProduct.price, responseValue: responseProduct.maxPrice ?? responseProduct.price });
    }
  }

  return { matchedCount: matches.length, missing, discrepancies, matches };
}
