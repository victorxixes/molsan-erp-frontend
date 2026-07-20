/* ============================================================
   INFORME POR OFICINA
============================================================ */
async function generarInformeOficinas() {

    const cont = document.getElementById("informeContainer");
    if (!cont) return;

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => f.anio == anioSel);

    const mapa = {};
    datos.forEach(f => mapa[f.centro] = (mapa[f.centro] || 0) + 1);

    const oficinas = Object.keys(mapa);
    const totales = Object.values(mapa);

    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🏢 Informe por Oficina — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartOficinas"></canvas></div>
    `;

    resetChart();

    charts.push(new Chart(document.getElementById("chartOficinas"), {
        type: "bar",
        data: {
            labels: oficinas,
            datasets:
