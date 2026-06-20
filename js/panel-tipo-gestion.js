/* ============================================================
   PANEL TIPO GESTIÓN — PREMIUM 2027 (CORREGIDO)
============================================================ */

let PTG_DATOS = [];
let PTG_POR_ANIO = {};
let PTG_CHART_ANUAL = null;
let PTG_CHART_MENSUAL = null;

async function initPanelTipoGestion() {
    console.log("📄 initPanelTipoGestion() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PTG_DATOS = datos;

    PTG_POR_ANIO = ptg_groupByAnioMesTipo(PTG_DATOS);

    ptg_fillSelectAnios();
    ptg_selectUltimoAnio();
}

/* Agrupar por año, mes y tipo gestión */
function ptg_groupByAnioMesTipo(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const mes = f.mes;
        const tipo = f.tipo_gestion || "Con provisión";

        if (!anio || !mes) continue;

        if (!map[anio]) {
            map[anio] = {
                total: 0,
                con: 0,
                sin: 0,
                sumaDiasCon: 0,
                cuentaDiasCon: 0,
                sumaDiasSin: 0,
                cuentaDiasSin: 0,
                meses: {}
            };
        }

        const r = map[anio];

        if (!r.meses[mes]) {
            r.meses[mes] = {
                total: 0,
                con: 0,
                sin: 0,
                sumaDiasCon: 0,
                cuentaDiasCon: 0,
                sumaDiasSin: 0,
                cuentaDiasSin: 0
            };
        }

        const m = r.meses[mes];

        r.total++;
        m.total++;

        const d = Number(f.dias);

        if (tipo.toLowerCase().includes("con provisión")) {
            r.con++;
            m.con++;
            if (d > 0) {
                r.sumaDiasCon += d;
                r.cuentaDiasCon++;
                m.sumaDiasCon += d;
                m.cuentaDiasCon++;
            }
        } else {
            r.sin++;
            m.sin++;
            if (d > 0) {
                r.sumaDiasSin += d;
                r.cuentaDiasSin++;
                m.sumaDiasSin += d;
                m.cuentaDiasSin++;
            }
        }
    }

    return map;
}

/* Select años */
function ptg_fillSelectAnios() {
    const sel = document.getElementById("ptg-select-anio");
    sel.innerHTML = "";

    const anios = Object.keys(PTG_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function ptg_selectUltimoAnio() {
    const sel = document.getElementById("ptg-select-anio");
    sel.value = sel.options[sel.options.length - 1].value;
    ptg_onChangeAnio();
}

/* Cambio de año */
function ptg_onChangeAnio() {
    const sel = document.getElementById("ptg-select-anio");
    const anio = Number(sel.value);

    const info = PTG_POR_ANIO[anio];
    if (!info) return;

    ptg_renderKpis(info);
    ptg_renderTablaMeses(info);
    ptg_renderChartAnual(info);
    ptg_renderChartMensual(info);
}

/* KPIs */
function ptg_renderKpis(info) {
    const total = info.total;

    const pctCon = total ? ((info.con / total) * 100).toFixed(1) + "%" : "0%";
    const pctSin = total ? ((info.sin / total) * 100).toFixed(1) + "%" : "0%";

    const slaCon = info.cuentaDiasCon ? (info.sumaDiasCon / info.cuentaDiasCon).toFixed(1) : "0";
    const slaSin = info.cuentaDiasSin ? (info.sumaDiasSin / info.cuentaDiasSin).toFixed(1) : "0";

    // 🔥 IDS CORREGIDOS
    document.getElementById("ptg-kpi-total").textContent = total;
    document.getElementById("ptg-kpi-con").textContent = pctCon;
    document.getElementById("ptg-kpi-sin").textContent = pctSin;
    document.getElementById("ptg-kpi-sla-con").textContent = slaCon;
    document.getElementById("ptg-kpi-sla-sin").textContent = slaSin;
}

/* Tabla mensual */
function ptg_renderTablaMeses(info) {
    const tbody = document.querySelector("#ptg-tabla-meses tbody");
    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const mes of mesesOrden) {
        const m = info.meses[mes];
        if (!m) continue;

        const total = m.total;
        const pctCon = total ? ((m.con / total) * 100).toFixed(1) + "%" : "0%";
        const slaCon = m.cuentaDiasCon ? (m.sumaDiasCon / m.cuentaDiasCon).toFixed(1) : "0";
        const slaSin = m.cuentaDiasSin ? (m.sumaDiasSin / m.cuentaDiasSin).toFixed(1) : "0";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>${total}</td>
            <td>${m.con}</td>
            <td>${m.sin}</td>
            <td>${pctCon}</td>
            <td>${slaCon}</td>
            <td>${slaSin}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico anual */
function ptg_renderChartAnual(info) {
    const ctx = document.getElementById("ptg-chart-anual");

    const labels = Object.keys(info.meses);
    const dataCon = labels.map(m => info.meses[m].con);
    const dataSin = labels.map(m => info.meses[m].sin);

    if (PTG_CHART_ANUAL) PTG_CHART_ANUAL.destroy();

    PTG_CHART_ANUAL = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Con provisión",
                    data: dataCon,
                    backgroundColor: "rgba(80,200,255,0.4)",
                    borderColor: "rgba(80,200,255,1)",
                    borderWidth: 1.5
                },
                {
                    label: "Sin provisión",
                    data: dataSin,
                    backgroundColor: "rgba(255,150,80,0.4)",
                    borderColor: "rgba(255,150,80,1)",
                    borderWidth: 1.5
                }
            ]
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

/* Gráfico mensual */
function ptg_renderChartMensual(info) {
    const ctx = document.getElementById("ptg-chart-mensual");

    const labels = Object.keys(info.meses);
    const dataCon = labels.map(m => info.meses[m].con);
    const dataSin = labels.map(m => info.meses[m].sin);

    if (PTG_CHART_MENSUAL) PTG_CHART_MENSUAL.destroy();

    PTG_CHART_MENSUAL = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Con provisión",
                    data: dataCon,
                    borderColor: "rgba(80,200,255,1)",
                    backgroundColor: "rgba(80,200,255,0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                },
                {
                    label: "Sin provisión",
                    data: dataSin,
                    borderColor: "rgba(255,150,80,1)",
                    backgroundColor: "rgba(255,150,80,0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                }
            ]
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
