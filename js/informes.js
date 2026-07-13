/* ============================================================
   INFORMES PREMIUM — GLASS LUXE 2027 (IndexedDB + KPIs + Charts)
============================================================ */
const MESES_ORDEN = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

let chartActual = null;

/* ============================================================
   SELECTOR DE AÑO — INFORMES PREMIUM (DEBE IR ARRIBA DEL TODO)
============================================================ */

function inf_getAnioSeleccionado() {
    const sel = document.getElementById("inf-select-anio");
    if (!sel) {
        console.warn("inf_getAnioSeleccionado(): selector no encontrado, uso año actual.");
        return new Date().getFullYear();
    }
    return Number(sel.value);
}

async function initInformesPremium() {
    console.log("📘 initInformesPremium() ejecutado");

    const sel = document.getElementById("inf-select-anio");
    if (!sel) {
        console.warn("Selector inf-select-anio no está en el DOM todavía.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const anios = [...new Set(datos.map(f => Number(f.anio)).filter(a => a > 0))]
        .sort((a,b)=>a-b);

    sel.innerHTML = "";

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }

    const currentYear = new Date().getFullYear();
    sel.value = anios.includes(currentYear) ? currentYear : anios[anios.length - 1];

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
    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const f of datos) {
        f.mes = (f.mes || "").toLowerCase().trim();
        if (!mesesValidos.includes(f.mes)) f.mes = "";

        f.tipo_gestion = normalizarTipoGestion(f.tipo_gestion);
        f.circuito = getCircuito(f.notario);
        f.tipo_firma = getTipoFirma(f.vc);
        f.centro = String(f.oficina) === "5316" ? "Cancela" : "Oficina";
    }
    return datos;
}

/* ============================================================
   INFORME GENERAL — FILTRADO POR AÑO
============================================================ */
async function generarInformeGeneral() {
    let firmas = await obtenerFirmas();
    firmas = aplicarNormalizacionPremium(firmas);

    const anioSel = inf_getAnioSeleccionado();
    firmas = firmas.filter(f => Number(f.anio) === anioSel);

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
    const oficinaTop = Object.entries(oficinas).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-";

    const circuitos = {};
    firmas.forEach(f => {
        circuitos[f.circuito] = (circuitos[f.circuito] || 0) + 1;
    });
    const circuitoTop = Object.entries(circuitos).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-";

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
        <h2 class="titulo-modulo">📘 Informe General — ${anioSel}</h2>

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
   INFORME ANUAL — SOLO MESES CON DATOS REALES
============================================================ */
async function generarInformeAnual() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();

    // Filtrar por año
    datos = datos.filter(f => Number(f.anio) === anioSel);

    // Detectar meses reales del Excel
    const mesesReales = [...new Set(datos.map(f => f.mes))]
        .filter(m => m) // quitar vacíos
        .sort((a,b) => MESES_ORDEN.indexOf(a) - MESES_ORDEN.indexOf(b));

    // Contar firmas por mes real
    const mapa = {};
    mesesReales.forEach(m => mapa[m] = 0);

    datos.forEach(f => {
        if (mapa.hasOwnProperty(f.mes)) mapa[f.mes]++;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">📅 Informe Anual — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartAnual"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartAnual");
    chartActual = new Chart(ctx, {
        type: "line",
        data: {
            labels: mesesReales,
            datasets: [{
                label: "Firmas",
                data: mesesReales.map(m => mapa[m]),
                borderColor: "#10b981",
                borderWidth: 3,
                fill: false,
                tension: 0.2
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

/* ============================================================
   INFORME MENSUAL — SOLO MESES CON DATOS REALES
============================================================ */
async function generarInformeMensual() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();

    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mesesReales = [...new Set(datos.map(f => f.mes))]
        .filter(m => m)
        .sort((a,b) => MESES_ORDEN.indexOf(a) - MESES_ORDEN.indexOf(b));

    const mapa = {};
    mesesReales.forEach(m => mapa[m] = 0);

    datos.forEach(f => {
        if (mapa.hasOwnProperty(f.mes)) mapa[f.mes]++;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🗓️ Informe Mensual — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartMensual"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartMensual");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: mesesReales,
            datasets: [{
                label: "Firmas",
                data: mesesReales.map(m => mapa[m]),
                backgroundColor: "#f59e0b"
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


/* ============================================================
   INFORME POR APODERADOS — FILTRADO POR AÑO
============================================================ */
async function generarInformeApoderados() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        const apo = f.apoderado || "Sin apoderado";
        mapa[apo] = (mapa[apo] || 0) + 1;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🧑‍💼 Informe por Apoderado — ${anioSel}</h2>
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
   INFORME POR OFICINAS — FILTRADO POR AÑO
============================================================ */
async function generarInformeOficinas() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        mapa[f.centro] = (mapa[f.centro] || 0) + 1;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🏢 Informe por Centro — ${anioSel}</h2>
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
   INFORME POR CIRCUITO — FILTRADO POR AÑO
============================================================ */
async function generarInformeCircuito() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        mapa[f.circuito] = (mapa[f.circuito] || 0) + 1;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🛣️ Informe por Circuito — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartCircuito"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartCircuito");
    chartActual = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(mapa),
            datasets: [{
                data: Object.values(mapa),
                backgroundColor: ["#6366f1", "#ec4899", "#22c55e"]
            }]
        }
    });
}

/* ============================================================
   INFORME POR TIPO DE FIRMA — FILTRADO POR AÑO
============================================================ */
async function generarInformeTipoFirma() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        mapa[f.tipo_firma] = (mapa[f.tipo_firma] || 0) + 1;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">✍️ Informe por Tipo de Firma — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartTipoFirma"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartTipoFirma");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(mapa),
            datasets: [{
                label: "Firmas",
                data: Object.values(mapa),
                backgroundColor: "#8b5cf6"
            }]
        }
    });
}

/* ============================================================
   INFORME DE TIEMPOS MEDIOS — FILTRADO POR AÑO
============================================================ */
async function generarInformeTiempos() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

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
        <h2 class="titulo-modulo">⏱️ Tiempos Medios — ${anioSel}</h2>
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

