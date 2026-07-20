/* ============================================================
   INFORME TIEMPOS — PREMIUM
============================================================ */
async function generarInformeTiempos() {

    const cont = document.getElementById("informeContainer");
    if (!cont) {
        console.warn("⏳ generarInformeTiempos() detenido: #informeContainer no existe.");
        return;
    }

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    let sumaCaixa = 0, cuentaCaixa = 0;
    let sumaOtra  = 0, cuentaOtra  = 0;

    datos.forEach(f => {
        const dias = Number(f.dias);
        if (dias <= 0) return;

        const ap = (f.apoderado || "").trim().toLowerCase();
        const esOtraEntidad = ap === "oficina otra entidad";
        const esCaixa = !esOtraEntidad;

        if (esCaixa) {
            sumaCaixa += dias;
            cuentaCaixa++;
        } else {
            sumaOtra += dias;
            cuentaOtra++;
        }
    });

    const slaCaixa = cuentaCaixa ? (sumaCaixa / cuentaCaixa).toFixed(1) : "0";
    const slaOtra  = cuentaOtra  ? (sumaOtra  / cuentaOtra ).toFixed(1) : "0";

    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">⏱️ Informe Tiempos — ${anioSel}</h2>

        <div class="card-glass mt-20">
            <p><strong>SLA CaixaBank:</strong> ${slaCaixa} días</p>
            <p><strong>SLA Otra Entidad:</strong> ${slaOtra} días</p>
        </div>

        <div class="card-glass mt-20">
            <canvas id="chartTiempos"></canvas>
        </div>
    `;

    resetChart();

    const ctx = document.getElementById("chartTiempos");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["CaixaBank", "Otra Entidad"],
            datasets: [{
                label: "SLA (días)",
                data: [slaCaixa, slaOtra],
                backgroundColor: ["#0EA5E9", "#10B981"]
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
