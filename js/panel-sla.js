/* ============================================================
   PANEL SLA — PREMIUM 2027 (CORREGIDO)
============================================================ */

let SLA_DATOS = [];
let SLA_POR_ANIO = {};
let SLA_CHART_MENSUAL = null;
let SLA_CHART_APODERADOS = null;
let SLA_CHART_OFICINAS = null;
let SLA_CHART_CIRCUITOS = null;

async function initPanelSLA() {
    console.log("⏱️ initPanelSLA() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    SLA_DATOS = datos;

    SLA_POR_ANIO = sla_groupByAnio(SLA_DATOS);

    sla_fillSelectAnios();
    sla_selectUltimoAnio();
}

/* Agrupar por año */
function sla_groupByAnio(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const mes = f.mes;
        const ap = f.apoderado || "Sin apoderado";
        const of = f.oficina || "Sin oficina";
        const ci = f.circuito || "Externo";
        const d = Number(f.dias);

        if (!anio || !mes) continue;

        if (!map[anio]) {
            map[anio] = {
                meses: {},
                apoderados: {},
                oficinas: {},
                circuitos: {}
            };
        }

        const r = map[anio];

        if (!r.meses[mes]) r.meses[mes] = { dias: [], total: 0 };
        r.meses[mes].dias.push(d);
        r.meses[mes].total++;

        if (!r.apoderados[ap]) r.apoderados[ap] = [];
        r.apoderados[ap].push(d);

        if (!r.oficinas[of]) r.oficinas[of] = [];
        r.oficinas[of].push(d);

        if (!r.circuitos[ci]) r.circuitos[ci] = [];
        r.circuitos[ci].push(d);
    }

    return map;
}

/* Select años */
function sla_fillSelectAnios() {
    const sel = document.getElementById("sla-select-anio");
    sel.innerHTML = "";

    const anios = Object.keys(SLA_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function sla_selectUltimoAnio() {
    const sel = document.getElementById("sla-select-anio");
    sel.value = sel.options[sel.options.length - 1].value;
    sla_onChangeAnio();
}

/* Cambio de año */
function sla_onChangeAnio() {
    const sel = document.getElementById("sla-select-anio");
    const anio = Number(sel.value);

    const info = SLA_POR_ANIO[anio];
    if (!info) return;

    sla_renderKpis(info);
    sla_renderTablaMeses(info);
    sla_renderChartMensual(info);
    sla_renderChartApoderados(info);
    sla_renderChartOficinas(info);
    sla_renderChartCircuitos(info);
}

/* KPIs */
function sla_renderKpis(info) {
    const todos = [];

    for (const mes in info.meses) {
        todos.push(...info.meses[mes].dias);
    }

    const media = todos.length ? (todos.reduce((a,b)=>a+b,0) / todos.length).toFixed(1) : "0";
    const min = todos.length ? Math.min(...todos) : 0;
    const max = todos.length ? Math.max(...todos) : 0;

    let topMes = "-";
    let mejor = Infinity;

    for (const mes in info.meses) {
        const arr = info.meses[mes].dias;
        if (!arr.length) continue;
        const m = arr.reduce((a,b)=>a+b,0) / arr.length;
        if (m < mejor) {
            mejor = m;
            topMes = mes;
        }
    }

    // 🔥 IDS CORREGIDOS
    document.getElementById("sla-kpi-media").textContent = media;
    document.getElementById("sla-kpi-min").textContent = min;
    document.getElementById("sla-kpi-max").textContent = max;
    document.getElementById("sla-kpi-top-mes").textContent = topMes;
}

/* Tabla mensual */
function sla_renderTablaMeses(info) {
    const tbody = document.querySelector("#sla-tabla-meses tbody");
    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const mes of mesesOrden) {
        const m = info.meses[mes];
        if (!m) continue;

        const arr = m.dias;
        const media = arr.length ? (arr.reduce((a,b)=>a+b,0) / arr.length).toFixed(1) : "0";
        const min = arr.length ? Math.min(...arr) : 0;
        const max = arr.length ? Math.max(...arr) : 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>${media}</td>
            <td>${min}</td>
            <td>${max}</td>
            <td>${m.total}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico mensual */
function sla_renderChartMensual(info) {
    const ctx = document.getElementById("sla-chart-mensual");

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const labels = [];
    const data = [];

    for (const mes of mesesOrden) {
        const m = info.meses[mes];
        if (!m) continue;
        const arr = m.dias;
        const media = arr.length ? (arr.reduce((a,b)=>a+b,0) / arr.length).toFixed(1) : 0;
        labels.push(mes);
        data.push(media);
    }

    if (SLA_CHART_MENSUAL) SLA_CHART_MENSUAL.destroy();

    SLA_CHART_MENSUAL = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "SLA mensual",
                data,
                borderColor: "rgba(80,200,255,1)",
                backgroundColor: "rgba(80,200,255,0.2)",
                borderWidth: 1.5,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#111" }}},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* SLA por apoderado */
function sla_renderChartApoderados(info) {
    const ctx = document.getElementById("sla-chart-apoderados");

    const labels = [];
    const data = [];

    for (const ap in info.apoderados) {
        const arr = info.apoderados[ap];
        if (!arr.length) continue;
        const media = arr.reduce((a,b)=>a+b,0) / arr.length;
        labels.push(ap);
        data.push(media.toFixed(1));
    }

    if (SLA_CHART_APODERADOS) SLA_CHART_APODERADOS.destroy();

    SLA_CHART_APODERADOS = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "SLA por apoderado",
                data,
                backgroundColor: "rgba(255,150,80,0.4)",
                borderColor: "rgba(255,150,80,1)",
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#111" }}},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* SLA por oficina */
function sla_renderChartOficinas(info) {
    const ctx = document.getElementById("sla-chart-oficinas");

    const labels = [];
    const data = [];

    for (const ofi in info.oficinas) {
        const arr = info.oficinas[ofi];
        if (!arr.length) continue;
        const media = arr.reduce((a,b)=>a+b,0) / arr.length;
        labels.push(ofi);
        data.push(media.toFixed(1));
    }

    if (SLA_CHART_OFICINAS) SLA_CHART_OFICINAS.destroy();

    SLA_CHART_OFICINAS = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "SLA por oficina",
                data,
                backgroundColor: "rgba(150,255,80,0.4)",
                borderColor: "rgba(150,255,80,1)",
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#111" }}},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* SLA por circuito */
function sla_renderChartCircuitos(info) {
    const ctx = document.getElementById("sla-chart-circuitos");

    const labels = [];
    const data = [];

    for (const ci in info.circuitos) {
        const arr = info.circuitos[ci];
        if (!arr.length) continue;
        const media = arr.reduce((a,b)=>a+b,0) / arr.length;
        labels.push(ci);
        data.push(media.toFixed(1));
    }

    if (SLA_CHART_CIRCUITOS) SLA_CHART_CIRCUITOS.destroy();

    SLA_CHART_CIRCUITOS = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "SLA por circuito",
                data,
                backgroundColor: "rgba(80,200,255,0.4)",
                borderColor: "rgba(80,200,255,1)",
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#111" }}},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}
