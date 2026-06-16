/* ============================================================
   INFORMES PREMIUM — GLASS LUXE 2027 (IndexedDB + KPIs + Charts)
============================================================ */

async function initInformesPremium() {
    const cont = document.getElementById("informeContainer");
    if (!cont) return;

    cont.innerHTML = `
        <h2 class="titulo-modulo">Informes Premium — Glass Luxe 2027</h2>
        <p class="subtitulo">Selecciona un informe para generar:</p>

        <div class="grid-informes">
            <button class="btn-inf" onclick="generarInformeGeneral()">Informe General</button>
            <button class="btn-inf" onclick="generarInformeAnual()">Informe Anual</button>
            <button class="btn-inf" onclick="generarInformeMensual()">Informe Mensual</button>
            <button class="btn-inf" onclick="generarInformeApoderados()">Por Apoderado</button>
            <button class="btn-inf" onclick="generarInformeOficinas()">Por Oficina</button>
            <button class="btn-inf" onclick="generarInformeCircuito()">Por Circuito</button>
            <button class="btn-inf" onclick="generarInformeTipoFirma()">Por Tipo de Firma</button>
            <button class="btn-inf" onclick="generarInformeTiempos()">Tiempos Medios</button>
        </div>

        <div id="informeContenido" class="card-glass" style="margin-top:20px;"></div>
    `;
}

/* ============================================================
   INFORME GENERAL
============================================================ */
async function generarInformeGeneral() {
    const datos = await obtenerFirmas();
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContenido");
    cont.innerHTML = `
        <h3>Informe General</h3>
        <p>Total de firmas: <strong>${kpis.total_registros}</strong></p>
        <p>Media de días: <strong>${kpis.media_dias}</strong></p>

        <div class="kpi-grid">
            <div class="kpi-box">Presenciales: ${kpis.por_tipo_firma?.Presencial ?? 0}</div>
            <div class="kpi-box">Videoconferencias: ${kpis.por_tipo_firma?.VideoConferencia ?? 0}</div>
        </div>

        <canvas id="chartGeneral" style="margin-top:20px;"></canvas>
    `;

    // Gráfico por meses
    const ctx = document.getElementById("chartGeneral");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(kpis.por_mes),
            datasets: [{
                label: "Firmas por mes",
                data: Object.values(kpis.por_mes),
                backgroundColor: "#4f46e5"
            }]
        }
    });
}

/* ============================================================
   INFORME ANUAL
============================================================ */
async function generarInformeAnual() {
    const datos = await obtenerFirmas();
    const kpis = obtenerKPIs();

    const cont = document.getElementById("informeContenido");
    cont.innerHTML = `
        <h3>Informe Anual</h3>
        <canvas id="chartAnual"></canvas>
    `;

    const ctx = document.getElementById("chartAnual");
    new Chart(ctx, {
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

    const cont = document.getElementById("informeContenido");
    cont.innerHTML = `
        <h3>Informe Mensual</h3>
        <canvas id="chartMensual"></canvas>
    `;

    const ctx = document.getElementById("chartMensual");
    new Chart(ctx, {
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

    const cont = document.getElementById("informeContenido");
    cont.innerHTML = `
        <h3>Informe por Apoderado</h3>
        <canvas id="chartApo"></canvas>
    `;

    const ctx = document.getElementById("chartApo");
    new Chart(ctx, {
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

    const cont = document.getElementById("informeContenido");
    cont.innerHTML = `
        <h3>Informe por Oficina</h3>
        <canvas id="chartOfi"></canvas>
    `;

    const ctx = document.getElementById("chartOfi");
    new Chart(ctx, {
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

    const cont = document.getElementById("informeContenido");
    cont.innerHTML = `
        <h3>Informe por Circuito</h3>
        <canvas id="chartCircuito"></canvas>
    `;

    const ctx = document.getElementById("chartCircuito");
    new Chart(ctx, {
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

    const cont = document.getElementById("informeContenido");
    cont.innerHTML = `
        <h3>Informe por Tipo de Firma</h3>
        <canvas id="chartTipoFirma"></canvas>
    `;

    const ctx = document.getElementById("chartTipoFirma");
    new Chart(ctx, {
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

    const cont = document.getElementById("informeContenido");
    cont.innerHTML = `
        <h3>Tiempos Medios de Gestión</h3>
        <p>Media de días: <strong>${kpis.media_dias}</strong></p>
    `;
}
