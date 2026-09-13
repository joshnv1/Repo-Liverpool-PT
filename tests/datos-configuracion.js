import { crearConfiguracion as configurar } from '../src/settings.js';

// Las unitarias usan sus propios datos. Editar los casos o el modo de ventana
// del usuario no debe romper comprobaciones que esperan una entrada concreta.
const datos = {
  modoVentana: 0,
  casos: [
    { termino: 'playstation 5', color: 'Blanco', ordenPrecio: 0, navegador: 0, permitirColorAlternativo: false },
    { termino: 'xbox series x', color: 'Blanco', ordenPrecio: 0, navegador: 1, permitirColorAlternativo: false },
    { termino: 'nintendo switch', color: 'Blanco', ordenPrecio: 0, navegador: 1, permitirColorAlternativo: true },
  ],
};

export const crearConfiguracion = entorno => configurar(entorno, datos);
