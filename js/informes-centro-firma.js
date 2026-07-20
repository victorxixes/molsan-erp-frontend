/* ============================================================
   INFORME CENTRO QUE FIRMA — GLASS LUXE 2027
============================================================ */
async function generarInformeCentroQueFirma() {

    const cont = document.getElementById("informeContainer");
    if (!cont) {
        console.warn("⏳ generarInformeCentroQueFirma() detenido: #informeContainer no existe.");
        return;
    }

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        const centro = f.centro_que_firma || "Sin dato";
        mapa[centro] = (mapa[centro] || 0) + 1;
    });

    const centros = Object.keys(mapa);
    const totales = Object.values(mapa);

    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🏛️ Informe Centro que Firma — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartCentroFirma"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartCentroFirma");
    chartActual = new Chart(ctx, {
        type: "pie",
        data: {
            labels: centros,
            datasets: [{
                data: totales,
                backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#EF4444"]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: "bottom" }}
        }
    });
}
