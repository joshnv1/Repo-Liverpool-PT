/** Interpreta el precio del DOM, incluido el punto decimal que Liverpool oculta visualmente. */
export function parseDisplayPrice(text) {
  if (typeof text !== 'string') throw new TypeError('El precio de la interfaz debe ser texto.');
  const value = text.replace(/\s/gu, '');
  // Se exige un único importe con dos decimales; concatenar oferta y precio original
  // produciría un número falso. Primero se valida el formato y después se convierte.
  if (!/^\$(?:\d+|\d{1,3}(?:,\d{3})+)\.\d{2}$/.test(value)) {
    throw new Error(`Precio de venta de la interfaz no compatible o ambiguo: ${JSON.stringify(text)}. Se esperaba un solo precio con dos decimales.`);
  }
  return Number(value.replace(/[$,]/g, ''));
}

// Una tarjeta puede vender variantes y mostrar un intervalo. Se conservan ambos
// extremos: tomar solo el primer número ocultaría diferencias del precio máximo.
export function parseDisplayPriceRange(text) {
  if (typeof text !== 'string') throw new TypeError('El precio de la interfaz debe ser texto.');
  const partes = text.trim().split(/\s+-\s+/u);
  if (partes.length === 1) return { price: parseDisplayPrice(text) };
  if (partes.length !== 2) throw new Error('El intervalo debe contener exactamente dos precios.');
  const [price, maxPrice] = partes.map(parseDisplayPrice);
  if (maxPrice < price) throw new Error('El precio máximo del intervalo no puede ser menor que el mínimo.');
  return { price, maxPrice };
}
