/* ============================================================
   INFORME ANUAL — PREMIUM
============================================================ */
async function generarInformeAnual() {

    const cont = document.getElementById("informeContainer");
    if (!cont) {
        console.warn("⏳ generarInformeAnual() detenido: #informeContainer no existe.");
        return;
    }

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const meses = MESES_ORDEN;
    const mapa = {};

    meses.forEach(m => mapa[m] = 0);

    datos.forEach(f => {
        if (mapa[f.mes] !== undefined) mapa[f.mes]++;
    });

    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">📅 Informe Anual — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartAnual"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartAnual");
    chartActual = new Chart(ctx, {
        type: "line",
        data: {
            labels: meses,
            datasets: [{
                label: "Firmas",
                data: meses.map(m => mapa[m]),
                borderColor: "#10B981",
                borderWidth: 3,
                fill: false,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }}
        }
    });
}
