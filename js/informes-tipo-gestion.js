/* ============================================================
   INFORME POR TIPO DE GESTIÓN — GLASS LUXE 2027
============================================================ */
async function generarInformeTipoGestion() {

    const cont = document.getElementById("informeContainer");
    if (!cont) return;

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => f.anio == anioSel);

    const mapa = {};
    datos.forEach(f => {
        const tipo = f.tipo_gestion || "Sin dato";
        mapa[tipo] = (mapa[tipo] || 0) + 1;
    });

    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">✍️ Informe por Tipo de Gestión — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartTipoGestion"></canvas></div>
    `;

    resetChart();

    charts.push(new Chart(document.getElementById("chartTipoGestion"), {
        type: "bar",
        data: {
            labels: Object.keys(mapa),
            datasets: [{
                label: "Firmas",
                data: Object.values(mapa),
                backgroundColor: "#10B981"
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
    }));
}
