import { casosPredeterminados, modoVentanaPredeterminado } from './casos.js';

// Convierte variables de terminal y datos editables en una configuración validada.
// Una entrada inválida falla antes de abrir el navegador para facilitar su corrección.
export function crearConfiguracion(entorno = process.env) {
  // Un solo valor controla la visibilidad de los dos navegadores. No se convierten
  // valores arbitrarios a booleano: únicamente 0 y 1 son modos válidos.
  const modo = entorno.MODO_VENTANA ?? modoVentanaPredeterminado;
  if (![0, 1, '0', '1'].includes(modo)) {
    throw new Error('MODO_VENTANA debe ser 0 (sin ventana) o 1 (ventana visible).');
  }
  const modoVentana = Number(modo);
  // Un único selector decide el navegador real y el nombre que mostrará el reporte.
  // La variable antigua podía cambiar el canal sin cambiar el nombre del navegador.
  if (entorno.BROWSER_CHANNEL !== undefined) {
    throw new Error('BROWSER_CHANNEL fue reemplazada: elimina esa variable y usa NAVEGADOR_BUSQUEDA (0 Chrome, 1 Firefox).');
  }
  // SEARCH_TERM se conserva para los comandos de la primera versión del proyecto.
  const variables = ['BUSQUEDA', 'BUSQUEDAS', 'SEARCH_TERM'].filter(nombre => entorno[nombre] !== undefined);
  if (variables.length > 1) {
    throw new Error('Usa solamente una variable: BUSQUEDA, BUSQUEDAS o SEARCH_TERM.');
  }
  const variable = variables[0];
  const valor = variable ? entorno[variable] : undefined;
  if (variable && typeof valor !== 'string') {
    throw new Error(`La variable ${variable} debe contener texto.`);
  }
  const busquedas = variable
    ? (variable === 'BUSQUEDAS' ? valor.split(';') : [valor]).map(termino => termino.trim())
    : casosPredeterminados.map(caso => caso.termino);
  if (busquedas.some(termino => !termino)) {
    throw new Error('Cada búsqueda debe tener un término. Separa las búsquedas múltiples con punto y coma (;).');
  }
  if (new Set(busquedas.map(termino => termino.toLocaleLowerCase('es-MX'))).size !== busquedas.length) {
    throw new Error('Las búsquedas no deben repetirse.');
  }
  // COLOR_BUSQUEDA y ORDEN_PRECIO afectan al caso flexible y a las búsquedas personalizadas.
  // PlayStation y Xbox predeterminados conservan los criterios del reto original.
  const casos = (variable ? busquedas.map(termino => ({ termino, color: 'Blanco', ordenPrecio: 0,
    navegador: casosPredeterminados.find(caso => caso.termino.toLowerCase() === termino.toLowerCase())?.navegador ?? 1,
    permitirColorAlternativo: true })) : casosPredeterminados)
    .map(caso => {
      const navegador = entorno.NAVEGADOR_BUSQUEDA ?? caso.navegador;
      if (![0, 1, '0', '1'].includes(navegador)) {
        throw new Error('NAVEGADOR_BUSQUEDA debe ser 0 (Chrome) o 1 (Firefox).');
      }
      const color = caso.permitirColorAlternativo && entorno.COLOR_BUSQUEDA !== undefined ? entorno.COLOR_BUSQUEDA : caso.color;
      const orden = caso.permitirColorAlternativo && entorno.ORDEN_PRECIO !== undefined ? entorno.ORDEN_PRECIO : caso.ordenPrecio;
      if (typeof color !== 'string' || !color.trim()) throw new Error('COLOR_BUSQUEDA debe contener el nombre de un color.');
      if (![0, 1, '0', '1'].includes(orden)) throw new Error('ORDEN_PRECIO debe ser 0 (Menor precio) o 1 (Mayor precio).');
      const ordenPrecio = Number(orden);
      return Object.freeze({ ...caso, navegador: Number(navegador), claveNavegador: ['chrome', 'firefox'][Number(navegador)], color: color.trim(), ordenPrecio,
        etiquetaOrden: ordenPrecio === 0 ? 'Menor precio' : 'Mayor precio', opcionOrden: `sortPrice|${ordenPrecio}` });
    });
  return Object.freeze({
    modoVentana,
    headless: modoVentana === 0,
    casos: Object.freeze(casos),
    busquedas: Object.freeze(busquedas),
    cantidadResultados: 5,
    coincidenciasMinimas: 3,
  });
}

export const configuracion = crearConfiguracion();

