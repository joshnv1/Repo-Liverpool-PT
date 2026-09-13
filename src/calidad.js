// El presupuesto es independiente de los tiempos máximos de Playwright: define
// cuánto puede esperar la persona desde Enter hasta disponer de los resultados.
export function leerLimiteBusqueda(entorno = process.env) {
  const valor = entorno.LIMITE_BUSQUEDA_MS;
  if (valor === undefined) return 15_000;
  const formatoValido = typeof valor === 'number'
    || (typeof valor === 'string' && /^\d+$/.test(valor.trim()));
  const limite = formatoValido ? Number(valor) : NaN;
  if (!Number.isInteger(limite) || limite < 1_000 || limite > 60_000) {
    throw new Error('LIMITE_BUSQUEDA_MS debe ser un entero entre 1000 y 60000 milisegundos.');
  }
  return limite;
}

// La igualdad también falla porque el requisito exige estar por debajo del límite.
// No se convierten cadenas: una medición inválida no puede aprobar por coerción.
export function validarDuracionBusqueda(duracionMs, limiteMs) {
  if (!Number.isFinite(duracionMs) || duracionMs < 0) {
    throw new Error('La duración de la búsqueda debe ser un número finito de milisegundos mayor o igual a cero.');
  }
  if (!Number.isFinite(limiteMs) || limiteMs <= 0) {
    throw new Error('El límite de la búsqueda debe ser un número finito de milisegundos mayor que cero.');
  }
  if (duracionMs >= limiteMs) {
    throw new Error(`La búsqueda tardó ${duracionMs.toFixed(2)} ms; debe cargar en menos de ${limiteMs} ms.`);
  }
}

// Los textos vienen de una página externa. Se muestran como datos, incluyendo
// fragmentos HTML y selectores, y nunca se insertan como marcado ejecutable.
function escaparHtml(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[caracter]);
}

function enlaceSeguro(valor, etiqueta = valor) {
  try {
    const url = new URL(String(valor));
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return `<a href="${escaparHtml(url.href)}" rel="noreferrer">${escaparHtml(etiqueta)}</a>`;
    }
  } catch {
    // Una URL desconocida se conserva como texto para poder investigar el dato.
  }
  return escaparHtml(etiqueta);
}

function describirImpacto(impacto) {
  return ({ critical: 'Crítico', serious: 'Serio', moderate: 'Moderado', minor: 'Menor' })[impacto]
    ?? (impacto ? String(impacto) : 'No determinado');
}

function representarHallazgos(hallazgos, nombreVacio) {
  if (hallazgos.length === 0) return `<p>${escaparHtml(nombreVacio)}</p>`;
  return hallazgos.map(hallazgo => {
    const nodos = Array.isArray(hallazgo.nodes) ? hallazgo.nodes : [];
    return `<article>
      <h3>${escaparHtml(hallazgo.id)}: ${escaparHtml(hallazgo.help)}</h3>
      <p><strong>Impacto:</strong> ${escaparHtml(describirImpacto(hallazgo.impact))}. <strong>Nodos afectados:</strong> ${nodos.length}.</p>
      <p>${escaparHtml(hallazgo.description)}</p>
      <p><strong>Información de la regla:</strong> ${enlaceSeguro(hallazgo.helpUrl, hallazgo.helpUrl || 'No proporcionada')}</p>
      <ol>${nodos.map(nodo => `<li>
        <p><strong>Selector o recorrido de marcos:</strong></p>
        <pre>${escaparHtml(JSON.stringify(nodo.target ?? [], null, 2))}</pre>
        <p><strong>Fragmento HTML observado:</strong></p>
        <pre>${escaparHtml(nodo.html)}</pre>
        <p><strong>Detalle del hallazgo:</strong></p>
        <pre>${escaparHtml(nodo.failureSummary || 'axe no proporcionó un resumen para este nodo; consultar el JSON adjunto.')}</pre>
      </li>`).join('')}</ol>
    </article>`;
  }).join('\n');
}

// El reporte conserva todos los incumplimientos y resultados incompletos de axe.
// No aplica exclusiones ni convierte los problemas del sitio en una afirmación
// de conformidad. La ejecución de axe y su JSON íntegro se validan en la prueba.
export function crearReporteAccesibilidad(resultadoAxe) {
  if (!resultadoAxe || !['violations', 'passes', 'incomplete'].every(clave => Array.isArray(resultadoAxe[clave]))) {
    throw new Error('El resultado de axe debe incluir las listas violations, passes e incomplete.');
  }
  const { violations, passes, incomplete } = resultadoAxe;
  const cantidadNodos = hallazgos => hallazgos.reduce((total, hallazgo) => total + (hallazgo.nodes?.length ?? 0), 0);
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>Reporte de accesibilidad — Liverpool</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #202630; background: #f5f6f8; line-height: 1.55; margin: 0; }
    main { max-width: 1050px; margin: auto; padding: 28px; }
    h1, h2, h3 { line-height: 1.25; }
    article, .resumen, .alcance { background: white; border: 1px solid #d3d9e2; border-radius: 8px; padding: 20px; margin: 20px 0; }
    a { color: #0645ad; overflow-wrap: anywhere; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #eef1f5; padding: 12px; border-radius: 4px; }
    dt { font-weight: 700; } dd { margin: 0 0 12px; overflow-wrap: anywhere; }
    table { border-collapse: collapse; width: 100%; } th, td { text-align: left; border-bottom: 1px solid #d3d9e2; padding: 10px; }
  </style>
</head>
<body><main>
  <h1>Reporte de accesibilidad de los resultados de búsqueda</h1>
  <dl>
    <dt>Fecha del análisis</dt><dd>${escaparHtml(resultadoAxe.timestamp || 'No proporcionada')}</dd>
    <dt>Página analizada</dt><dd>${enlaceSeguro(resultadoAxe.url, resultadoAxe.url || 'No proporcionada')}</dd>
    <dt>Motor de análisis</dt><dd>${escaparHtml(resultadoAxe.testEngine?.name || 'axe-core')} ${escaparHtml(resultadoAxe.testEngine?.version || 'Versión no proporcionada')}</dd>
  </dl>
  <section class="alcance" aria-labelledby="alcance">
    <h2 id="alcance">Cómo interpretar este reporte</h2>
    <p>El reto solicita ejecutar axe y reportar sus hallazgos. Esta comprobación informa los problemas detectados en Liverpool; no exige cero violaciones para aprobar el recorrido funcional ni declara que el sitio sea accesible.</p>
    <p>Los resultados incompletos requieren revisión manual. Las reglas sin incumplimientos detectados tampoco demuestran conformidad completa: la evaluación automática debe complementarse con pruebas manuales de accesibilidad.</p>
    <p>Este reporte presenta todos los incumplimientos y resultados incompletos recibidos, sin eliminar reglas ni nodos. El JSON adjunto conserva el resultado completo, incluidos los controles que pasaron y los que no aplican.</p>
  </section>
  <section class="resumen" aria-labelledby="resumen">
    <h2 id="resumen">Resumen del análisis</h2>
    <table>
      <thead><tr><th scope="col">Resultado</th><th scope="col">Reglas</th><th scope="col">Nodos reportados</th></tr></thead>
      <tbody>
        <tr><th scope="row">Incumplimientos detectados</th><td>${violations.length}</td><td>${cantidadNodos(violations)}</td></tr>
        <tr><th scope="row">Sin incumplimientos detectados</th><td>${passes.length}</td><td>${cantidadNodos(passes)}</td></tr>
        <tr><th scope="row">Revisión manual pendiente</th><td>${incomplete.length}</td><td>${cantidadNodos(incomplete)}</td></tr>
      </tbody>
    </table>
    <p>Un nodo puede aparecer en varias reglas; estos totales no representan elementos únicos.</p>
  </section>
  <section aria-labelledby="incumplimientos">
    <h2 id="incumplimientos">Incumplimientos detectados</h2>
    ${representarHallazgos(violations, 'axe no detectó incumplimientos en este análisis automático.')}
  </section>
  <section aria-labelledby="incompletos">
    <h2 id="incompletos">Resultados incompletos: requieren revisión manual</h2>
    ${representarHallazgos(incomplete, 'axe no devolvió resultados incompletos.')}
  </section>
</main></body>
</html>`;
}
