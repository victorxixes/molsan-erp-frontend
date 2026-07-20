/* ============================================================
   INFORME POR CIRCUITO — GLASS LUXE 2027
============================================================ */

async function generarInformeCircuito() {

    const cont = document.getElementById("informeContainer");
    if (!cont) return;

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => f.anio == anioSel);

    const mapa = {};
    datos.forEach(f => {
        const cir = f.circuito || "Sin circuito";
        mapa[cir] = (mapa[cir] || 0) + 1;
    });

    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🛣️ Informe por Circuito — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartCircuito"></canvas></div>
    `;

    resetChart();

    charts.push(new Chart(document.getElementById("chartCircuito"), {
        type: "doughnut",
        data: {
            labels: Object.keys(mapa),
            datasets: [{
                data: Object.values(mapa),
                backgroundColor: ["#0EA5E9","#10B981","#F59E0B"]
            }]
        }
    }));
}
