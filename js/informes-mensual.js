/* ============================================================
   INFORME MENSUAL — PREMIUM
============================================================ */
async function generarInformeMensual() {

    const cont = document.getElementById("informeContainer");
    if (!cont) {
        console.warn("⏳ generarInformeMensual() detenido: #informeContainer no existe.");
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
        <h2 class="titulo-modulo">🗓️ Informe Mensual — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartMensual"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartMensual");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: meses,
            datasets: [{
                label: "Firmas",
                data: meses.map(m => mapa[m]),
                backgroundColor: "#F59E0B"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }}
        }
    });
}
