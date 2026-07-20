/* ============================================================
   INFORME DE TIEMPOS — GLASS LUXE 2027
============================================================ */
async function generarInformeTiempos() {

    const cont = document.getElementById("informeContainer");
    if (!cont) return;

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => f.anio == anioSel);

    const dias = datos.map(f => Number(f.dias)).filter(d => d > 0);

    const media = dias.length ? (dias.reduce((a,b)=>a+b,0) / dias.length).toFixed(1) : 0;

    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">⏱️ Informe de Tiempos — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartTiempos"></canvas></div>
    `;

    resetChart();

    charts.push(new Chart(document.getElementById("chartTiempos"), {
        type: "bar",
        data: {
            labels: ["Media de días"],
            datasets: [{
                label: "Días",
                data: [media],
                backgroundColor: "#F59E0B"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }},
            scales: {
                y: { ticks: { color: "#111" }}
            }
        }
    }));
}
