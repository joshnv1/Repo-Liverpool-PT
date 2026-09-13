import { expect } from '@playwright/test';
import { captureSearchResponse } from './search-response.js';
import { parseDisplayPriceRange } from './display-price.js';

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Interacciones con la interfaz; el análisis de red y la comparación están en módulos separados. */
export class SearchPage {
  constructor(page) {
    // Se delimita el buscador al encabezado de escritorio y las tarjetas a su lista.
    this.page = page;
    this.searchBox = page.getByRole('navigation', { name: 'Header Navigation Desktop' })
      .getByRole('textbox', { name: 'Buscar por producto, categoría y más...' });
    this.cards = page.locator('#plp-page-card-product-list > a');
    this.sortButton = page.getByRole('button', { name: /^Ordenar por:/ });
  }

  colorCheckbox(color) {
    // La cantidad entre paréntesis cambia con el catálogo; el nombre del color no.
    return this.page.getByRole('checkbox', { name: new RegExp(`^${escapeRegExp(color)}\\s*\\(\\d+\\)$`) });
  }

  async open() {
    // Un acceso rechazado falla antes de intentar interactuar con una página de error.
    const response = await this.page.goto('/tienda/home', { waitUntil: 'domcontentloaded' });
    if (!response?.ok()) {
      throw new Error(`Falló el acceso a Liverpool: HTTP ${response?.status() ?? 'desconocido'} en ${this.page.url()}. La búsqueda real no se ejecutó. Revisa la captura de pantalla y la traza para identificar una restricción de acceso al sitio.`);
    }
    if (/Access Denied|CAPTCHA/i.test(await this.page.title())) {
      throw new Error('Se detectó una verificación de acceso de Liverpool. La búsqueda real no puede validarse en esta sesión.');
    }
    await expect(this.searchBox).toBeVisible();
  }

  async search(query) {
    // Se verifica la consulta de la URL y la presencia de resultados reales.
    if (!query) throw new Error('El término de búsqueda no debe estar vacío.');
    await this.searchBox.fill(query);
    await this.searchBox.press('Enter');
    // La URL puede ser correcta mientras siguen cargando recursos secundarios.
    // Comprobamos el parámetro real y después las tarjetas, sin esperar el evento load.
    await expect.poll(() => new URL(this.page.url()).searchParams.get('s'), {
      message: 'La URL debe contener exactamente la búsqueda solicitada.',
    }).toBe(query);
    await expect(this.cards.first()).toBeVisible();
  }

  async availableColors() {
    // Este identificador parcial pertenece al grupo de colores observado en Liverpool.
    // Si el acordeón está cerrado, se abre como lo haría una persona.
    const button = this.page.getByRole('button', { name: /^Color(?:\s*\(\d+\))?$/ });
    await expect(button, 'La búsqueda debe ofrecer un grupo de filtros de color.').toBeVisible();
    const group = this.page.locator('[data-testid$="-color-checkbox-group"]');
    if (!await group.isVisible()) await button.click();
    await expect(group).toBeVisible();
    return group.locator('label').evaluateAll(labels => labels.map(label => label.textContent.replace(/\s*\(\d+\)\s*$/, '').trim()));
  }

  async filterColor(query, color) {
    const checkbox = this.colorCheckbox(color);
    await expect(checkbox, `La búsqueda debe ofrecer el filtro de color ${color}.`).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    const appliedFilterId = await checkbox.getAttribute('value');
    if (!appliedFilterId) throw new Error('La casilla de color no tiene un valor de filtro.');
    // Liverpool actualiza esta casilla controlada después de la respuesta. click y una
    // aserción con reintentos automáticos evitan la comprobación inmediata de check().
    const response = await captureSearchResponse(this.page, { query, appliedFilterId }, () => checkbox.click());
    await expect(checkbox).toBeChecked();
    await expect(this.page.getByText('Filtros seleccionados', { exact: true })).toBeVisible();
    return response;
  }

  async sortByPrice(query, color, sortLabel, sortOption, encryptedFilters) {
    // El nombre visible y el valor enviado dependen de la opción 0 o 1 del caso.
    await this.sortButton.click();
    const response = await captureSearchResponse(this.page, { query, sortOption, encryptedFilters },
      () => this.page.getByText(sortLabel, { exact: true }).click());
    // La ordenación también se confirma por sus parámetros y controles visibles.
    await expect.poll(() => {
      const parametros = new URL(this.page.url()).searchParams;
      return { busqueda: parametros.get('s'), orden: parametros.get('sort') };
    }, { message: 'La URL debe conservar la búsqueda y el orden elegidos.' })
      .toEqual({ busqueda: query, orden: sortOption });
    await expect(this.sortButton).toHaveText(new RegExp(`Ordenar por:\\s*${escapeRegExp(sortLabel)}`));
    await expect(this.colorCheckbox(color)).toBeChecked();
    return response;
  }

  async firstProducts(count) {
    // Se toman las primeras tarjetas en orden y el precio de venta, no el tachado.
    await expect(this.cards.nth(count - 1), `Se requieren al menos ${count} tarjetas de producto.`).toBeVisible();
    const raw = await this.cards.evaluateAll((cards, limit) => cards.slice(0, limit).map(card => {
      const match = card.getAttribute('data-testid')?.match(/^(.+)-card-card-link$/);
      const id = match?.[1];
      const name = card.querySelector('h3')?.textContent?.trim();
      const priceContainer = id && card.querySelector(`[data-testid="${CSS.escape(id)}-price"]`);
      const salePrice = priceContainer?.querySelector('[data-testid="discounted"]') || priceContainer;
      if (!id || !name || !salePrice) throw new Error('Falta el ID, el nombre o el precio en una tarjeta de producto.');
      const url = new URL(card.getAttribute('href'), window.location.origin);
      if (url.pathname.split('/').filter(Boolean).at(-1) !== id) {
        throw new Error(`El ID de la tarjeta y el enlace del producto no coinciden: ${id}.`);
      }
      // En los intervalos Liverpool agrupa promoción y precio original en el mismo
      // contenedor. Se excluye el bloque original en una copia, sin cambiar la página.
      const copiaPrecio = salePrice.cloneNode(true);
      copiaPrecio.querySelectorAll('[data-testid$="-price-original-prices"]').forEach(elemento => elemento.remove());
      return { id, name, priceText: copiaPrecio.textContent, url: url.href };
    }), count);
    return raw.map(({ priceText, ...product }) => ({ ...product, priceText, ...parseDisplayPriceRange(priceText) }));
  }
}
