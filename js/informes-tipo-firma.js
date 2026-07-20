/* ============================================================
   INFORME POR TIPO DE FIRMA — GLASS LUXE 2027
============================================================ */

console.log("✔ informes-tipo-firma.js cargado");

async function generarInformeTipoFirma() {

    const cont = document.getElementById("informeContainer");
    if (!cont) return;

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => f.anio == anioSel);

    const presencial = datos.filter(f => f.tipo_firma === "Presencial").length;
    const vc = datos.filter(f => f.tipo_firma === "VideoConferencia").length;

    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">✍️ Informe por Tipo de Firma — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartTipoFirma"></canvas></div>
    `;

    resetChart();

    charts.push(new Chart(document.getElementById("chartTipoFirma"), {
        type: "pie",
        data: {
            labels: ["Presencial", "VC"],
            datasets: [{
                data: [presencial, vc],
                backgroundColor: ["#3B82F6", "#10B981"]
            }]
        }
    }));
}
