/* ============================================================
   INFORMES PREMIUM — GLASS LUXE 2027 (IndexedDB + KPIs + Charts)
============================================================ */

let chartActual = null;

/* ============================================================
   INICIALIZAR MÓDULO
============================================================ */
async function initInformesPremium() {
    console.log("📘 initInformesPremium() ejecutado");

    const cont = document.getElementById("informeContainer");
    if (cont) {
        cont.style.display = "none";
        cont.innerHTML = "";
    }
}

/* ============================================================
   UTILIDAD — Destruir gráfico previo
============================================================ */
function resetChart() {
    if (chartActual) {
        chartActual.destroy();
        chartActual = null;
    }
}

/* ============================================================
   INFORME GENERAL
============================================================ */
async function generarInformeGeneral() {
    const datos = await obtenerFirmas();
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h3>Informe General</h3>

        <div class="kpi-grid">
            <div class="kpi-box">Total firmas: ${kpis.total_registros}</div>
            <div class="kpi-box">Media días: ${kpis.media_dias}</div>
            <div class="kpi-box">Presenciales: ${kpis.por_tipo_firma?.Presencial ?? 0}</div>
            <div class="kpi-box">Videoconferencias: ${kpis.por_tipo_firma?.VideoConferencia ?? 0}</div>
        </div>

        <canvas id="chartGeneral" class="mt-20"></canvas>
    `;

    resetChart();

    const ctx = document.getElementById("chartGeneral");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(kpis.por_mes),
            datasets: [{
                label: "Firmas por mes",
                data: Object.values(kpis.por_mes),
                backgroundColor: "#0ea5e9"
            }]
        }
    });
}

/* ============================================================
   INFORME ANUAL
============================================================ */
async function generarInformeAnual() {
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h3>Informe Anual</h3>
        <canvas id="chartAnual"></canvas>
    `;

    resetChart();

    const ctx = document.getElementById("chartAnual");
    chartActual = new Chart(ctx, {
        type: "line",
        data: {
            labels: Object.keys(kpis.por_anio),
            datasets: [{
                label: "Firmas por año",
                data: Object.values(kpis.por_anio),
                borderColor: "#10b981",
                fill: false
            }]
        }
    });
}

/* ============================================================
   INFORME MENSUAL
============================================================ */
async function generarInformeMensual() {
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h3>Informe Mensual</h3>
        <canvas id="chartMensual"></canvas>
    `;

    resetChart();

    const ctx = document.getElementById("chartMensual");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(kpis.por_mes),
            datasets: [{
                label: "Firmas por mes",
                data: Object.values(kpis.por_mes),
                backgroundColor: "#f59e0b"
            }]
        }
    });
}

/* ============================================================
   INFORME POR APODERADOS
============================================================ */
async function generarInformeApoderados() {
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h3>Informe por Apoderado</h3>
        <canvas id="chartApo"></canvas>
    `;

    resetChart();

    const ctx = document.getElementById("chartApo");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(kpis.por_apoderado),
            datasets: [{
                label: "Firmas",
                data: Object.values(kpis.por_apoderado),
                backgroundColor: "#3b82f6"
            }]
        }
    });
}

/* ============================================================
   INFORME POR OFICINAS
============================================================ */
async function generarInformeOficinas() {
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h3>Informe por Oficina</h3>
        <canvas id="chartOfi"></canvas>
    `;

    resetChart();

    const ctx = document.getElementById("chartOfi");
    chartActual = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(kpis.por_oficina),
            datasets: [{
                data: Object.values(kpis.por_oficina),
                backgroundColor: ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"]
            }]
        }
    });
}

/* ============================================================
   INFORME POR CIRCUITO
============================================================ */
async function generarInformeCircuito() {
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h3>Informe por Circuito</h3>
        <canvas id="chartCircuito"></canvas>
    `;

    resetChart();

    const ctx = document.getElementById("chartCircuito");
    chartActual = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(kpis.por_circuito),
            datasets: [{
                data: Object.values(kpis.por_circuito),
                backgroundColor: ["#6366f1", "#ec4899", "#22c55e", "#eab308"]
            }]
        }
    });
}

/* ============================================================
   INFORME POR TIPO DE FIRMA
============================================================ */
async function generarInformeTipoFirma() {
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h3>Informe por Tipo de Firma</h3>
        <canvas id="chartTipoFirma"></canvas>
    `;

    resetChart();

    const ctx = document.getElementById("chartTipoFirma");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(kpis.por_tipo_firma),
            datasets: [{
                label: "Firmas",
                data: Object.values(kpis.por_tipo_firma),
                backgroundColor: "#8b5cf6"
            }]
        }
    });
}

/* ============================================================
   INFORME DE TIEMPOS MEDIOS
============================================================ */
async function generarInformeTiempos() {
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h3>Tiempos Medios de Gestión</h3>
        <p>Media de días: <strong>${kpis.media_dias}</strong></p>
    `;
}
