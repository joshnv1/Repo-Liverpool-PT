// Cambia el modo de todos los casos: 0 = sin ventana (headless); 1 = ventana visible.
// La variable MODO_VENTANA de la terminal permite sustituir este valor al ejecutar.
export const modoVentanaPredeterminado = 0;

// Cambia estos datos para preparar tus casos; no hace falta copiar la prueba.
// ordenPrecio: 0 = Menor precio; 1 = Mayor precio. Se ejecuta un orden por caso.
// navegador: 0 = Google Chrome; 1 = Firefox de Playwright.
// Los dos primeros casos mantienen los requisitos originales de color y orden.
export const casosPredeterminados = [
  { termino: 'playstation 5', color: 'Blanco', ordenPrecio: 0, navegador: 0, permitirColorAlternativo: false },
  { termino: 'xbox series x', color: 'Blanco', ordenPrecio: 0, navegador: 1, permitirColorAlternativo: false },
  // Este tercer caso admite cualquier término y color. Si falta el color pedido,
  // intenta Negro y después Blanco, y registra la decisión en la evidencia.
  { termino: 'nintendo switch', color: 'Blanco', ordenPrecio: 0, navegador: 1, permitirColorAlternativo: true },
];
