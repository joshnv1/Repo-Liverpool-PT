// Se compara la escritura del color sin distinguir espacios exteriores ni mayúsculas.
const normalizar = valor => valor.trim().toLocaleLowerCase('es-MX');

// Decide únicamente entre colores observados en la interfaz. Nunca inventa un filtro.
export function seleccionarColor(solicitado, disponibles, permitirAlternativo = false) {
  if (typeof solicitado !== 'string' || !solicitado.trim()) throw new Error('El color solicitado debe contener texto.');
  if (!Array.isArray(disponibles) || disponibles.some(color => typeof color !== 'string' || !color.trim())) {
    throw new Error('Los colores disponibles deben ser una lista de nombres.');
  }
  const buscar = nombre => disponibles.find(color => normalizar(color) === normalizar(nombre));
  const coincidencia = buscar(solicitado);
  const utilizado = coincidencia || (permitirAlternativo && (buscar('Negro') || buscar('Blanco')));
  if (!utilizado) {
    throw new Error(`No está disponible el color «${solicitado}»${permitirAlternativo ? ' ni las alternativas Negro o Blanco' : ''}. Colores ofrecidos: ${disponibles.join(', ') || 'ninguno'}.`);
  }
  return { solicitado, utilizado, alternativo: !coincidencia, disponibles: [...disponibles],
    motivo: coincidencia ? 'El color solicitado está disponible.' : `El color solicitado no está disponible; se utiliza ${utilizado}, según la prioridad Negro y después Blanco.` };
}
