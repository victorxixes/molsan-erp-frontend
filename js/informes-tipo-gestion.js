/* ============================================================
   INFORME TIPO DE GESTIÓN — PREMIUM
============================================================ */
async function generarInformeTipoGestion() {

    const cont = document.getElementById("informeContainer");
    if (!cont) {
        console.warn("⏳ generarInformeTipoGestion() detenido: #informeContainer no existe.");
        return;
    }

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        const gest = f.tipo_gestion || "Sin gestión";
        mapa[gest] = (mapa[gest] || 0) + 1;
    });

    const tipos = Object.keys(mapa);
    const totales = Object.values(mapa);

    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">📂 Informe por Tipo de Gestión — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartTipoGestion"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartTipoGestion");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: tipos,
            datasets: [{
                label: "Firmas",
                data: totales,
                backgroundColor: "#0EA5E9"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}
