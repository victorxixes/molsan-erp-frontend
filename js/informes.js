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
   NORMALIZACIÓN GLASS LUXE 2027
============================================================ */
function aplicarNormalizacionPremium(datos) {
    for (const f of datos) {
        f.tipo_gestion = normalizarTipoGestion(f.tipo_gestion);
        f.circuito = getCircuito(f.notario);
        f.tipo_firma = getTipoFirma(f.vc);
        f.centro = String(f.oficina) === "5316" ? "Cancela" : "Oficina";
    }
    return datos;
}

/* ============================================================
   INFORME GENERAL — GLASS LUXE 2027
============================================================ */
async function generarInformeGeneral() {
    let firmas = await obtenerFirmas();
    firmas = aplicarNormalizacionPremium(firmas);

    const totalFirmas = firmas.length;

    const mediaDias = (
        firmas.reduce((acc, f) => acc + (Number(f.dias) || 0), 0) / totalFirmas
    ).toFixed(1);

    const totalVC = firmas.filter(f => f.tipo_firma === "VideoConferencia").length;
    const pctVC = ((totalVC / totalFirmas) * 100).toFixed(1);

    const totalConProvision = firmas.filter(f => f.tipo_gestion === "Con provisión").length;
    const pctProvision = ((totalConProvision / totalFirmas) * 100).toFixed(1);

    const oficinas = {};
    firmas.forEach(f => {
        oficinas[f.centro] = (oficinas[f.centro] || 0) + 1;
    });
    const oficinaTop = Object.entries(oficinas).sort((a,b)=>b[1]-a[1])[0][0];

    const circuitos = {};
    firmas.forEach(f => {
        circuitos[f.circuito] = (circuitos[f.circuito] || 0) + 1;
    });
    const circuitoTop = Object.entries(circuitos).sort((a,b)=>b[1]-a[1])[0][0];

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const firmasPorMes = mesesOrden.map(mes =>
        firmas.filter(f => f.mes === mes).length
    );

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">📘 Informe General</h2>

        <div class="kpi-box">
            <div class="kpi-item"><div class="kpi-label">Total firmas</div><div class="kpi-value">${totalFirmas}</div></div>
            <div class="kpi-item"><div class="kpi-label">Media días (SLA)</div><div class="kpi-value">${mediaDias}</div></div>
            <div class="kpi-item"><div class="kpi-label">% VC</div><div class="kpi-value">${pctVC}%</div></div>
            <div class="kpi-item"><div class="kpi-label">% Con provisión</div><div class="kpi-value">${pctProvision}%</div></div>
            <div class="kpi-item"><div class="kpi-label">Centro más activo</div><div class="kpi-value">${oficinaTop}</div></div>
            <div class="kpi-item"><div class="kpi-label">Circuito dominante</div><div class="kpi-value">${circuitoTop}</div></div>
        </div>

        <div class="card-glass" style="margin-top:20px;">
            <h3>📊 Firmas por mes</h3>
            <canvas id="graficoGeneralMeses" height="120"></canvas>
        </div>
    `;

    resetChart();

    const ctx = document.getElementById("graficoGeneralMeses").getContext("2d");

    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: mesesOrden,
            datasets: [{
                label: "Firmas",
                data: firmasPorMes,
                backgroundColor: "rgba(14,165,233,0.6)",
                borderColor: "rgba(14,165,233,1)",
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

/* ============================================================
   INFORME ANUAL
============================================================ */
async function generarInformeAnual() {
    const kpis = await obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">📅 Informe Anual</h2>
        <div class="card-glass mt-20"><canvas id="chartAnual"></canvas></div>
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
                borderWidth: 3,
                fill: false
            }]
        }
    });
}

/* ============================================================
   INFORME MENSUAL
============================================================ */
async function generarInformeMensual() {
    const kpis = await obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🗓️ Informe Mensual</h2>
        <div class="card-glass mt-20"><canvas id="chartMensual"></canvas></div>
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
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const mapa = {};
    datos.forEach(f => {
        const apo = f.apoderado || "Sin apoderado";
        mapa[apo] = (mapa[apo] || 0) + 1;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🧑‍💼 Informe por Apoderado</h2>
        <div class="card-glass mt-20"><canvas id="chartApo"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartApo");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(mapa),
            datasets: [{
                label: "Firmas",
                data: Object.values(mapa),
                backgroundColor: "#3b82f6"
            }]
        }
    });
}

/* ============================================================
   INFORME POR OFICINAS (CENTRO)
============================================================ */
async function generarInformeOficinas() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const mapa = {};
    datos.forEach(f => {
        mapa[f.centro] = (mapa[f.centro] || 0) + 1;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🏢 Informe por Centro</h2>
        <div class="card-glass mt-20"><canvas id="chartOfi"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartOfi");
    chartActual = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(mapa),
            datasets: [{
                data: Object.values(mapa),
                backgroundColor: ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"]
            }]
        }
    });
}

/* ============================================================
   INFORME POR CIRCUITO
============================================================ */
async function generarInformeCircuito() {
    const kpis = await obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🛣️ Informe por Circuito</h2>
        <div class="card-glass mt-20"><canvas id="chartCircuito"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartCircuito");
    chartActual = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(kpis.por_circuito),
            datasets: [{
                data: Object.values(kpis.por_circuito),
                backgroundColor: ["#6366f1", "#ec4899", "#22c55e"]
            }]
        }
    });
}

/* ============================================================
   INFORME POR TIPO DE FIRMA
============================================================ */
async function generarInformeTipoFirma() {
    const kpis = await obtenerKPIs();

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">✍️ Informe por Tipo de Firma</h2>
        <div class="card-glass mt-20"><canvas id="chartTipoFirma"></canvas></div>
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
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const mapa = {};

    datos.forEach(f => {
        const clave = `${f.apoderado || "Sin apoderado"} — ${f.tipo_gestion}`;
        if (!mapa[clave]) mapa[clave] = { total: 0, suma: 0 };
        mapa[clave].total++;
        mapa[clave].suma += Number(f.dias) || 0;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    let html = `
        <h2 class="titulo-modulo">⏱️ Tiempos Medios por Apoderado y Gestión</h2>
        <div class="card-glass mt-20">
        <table class="tabla-excel mt-20">
            <thead>
                <tr>
                    <th>Apoderado — Gestión</th>
                    <th>Media días</th>
                    <th>Total firmas</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.keys(mapa).forEach(k => {
        const m = mapa[k];
        const media = (m.suma / m.total).toFixed(2);
        html += `
            <tr>
                <td>${k}</td>
                <td>${media}</td>
                <td>${m.total}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;

    cont.innerHTML = html;
}
