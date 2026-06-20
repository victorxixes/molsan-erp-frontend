/* ============================================================
   PANEL ANUAL — PREMIUM 2027 (CORREGIDO)
============================================================ */

let PA_DATOS = [];
let PA_POR_ANIO = {};
let PA_CHART_ANUAL = null;

async function initPanelAnual() {
    console.log("📆 initPanelAnual() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PA_DATOS = datos;

    PA_POR_ANIO = pa_groupByAnioMes(PA_DATOS);

    pa_fillSelectAnios();
    pa_selectUltimoAnio();
}

/* Agrupar por año y mes */
function pa_groupByAnioMes(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const mes = f.mes;

        if (!anio || !mes) continue;

        if (!map[anio]) {
            map[anio] = {
                meses: {},
                total: 0,
                vc: 0,
                presencial: 0,
                sumaDias: 0,
                cuentaDias: 0
            };
        }

        const r = map[anio];

        if (!r.meses[mes]) {
            r.meses[mes] = {
                total: 0,
                vc: 0,
                presencial: 0,
                sumaDias: 0,
                cuentaDias: 0
            };
        }

        const m = r.meses[mes];

        r.total++;
        m.total++;

        if (f.tipo_firma === "VideoConferencia") {
            r.vc++;
            m.vc++;
        } else {
            r.presencial++;
            m.presencial++;
        }

        const d = Number(f.dias);
        if (d > 0) {
            r.sumaDias += d;
            r.cuentaDias++;
            m.sumaDias += d;
            m.cuentaDias++;
        }
    }

    return map;
}

/* Select años */
function pa_fillSelectAnios() {
    const sel = document.getElementById("pa-select-anio");
    sel.innerHTML = "";

    const anios = Object.keys(PA_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function pa_selectUltimoAnio() {
    const sel = document.getElementById("pa-select-anio");
    sel.value = sel.options[sel.options.length - 1].value;
    pa_onChangeAnio();
}

/* Cambio de año */
function pa_onChangeAnio() {
    const sel = document.getElementById("pa-select-anio");
    const anio = Number(sel.value);

    const info = PA_POR_ANIO[anio];
    if (!info) return;

    pa_renderKpis(info);
    pa_renderTablaMeses(info);
    pa_renderChartAnual(info);
}

/* KPIs */
function pa_renderKpis(info) {
    const total = info.total;
    const sla = info.cuentaDias ? (info.sumaDias / info.cuentaDias).toFixed(1) : "0";
    const pctVC = total ? ((info.vc / total) * 100).toFixed(1) + "%" : "0%";

    let topMes = "-";
    let max = -Infinity;

    for (const mes in info.meses) {
        if (info.meses[mes].total > max) {
            max = info.meses[mes].total;
            topMes = mes;
        }
    }

    // 🔥 IDS CORREGIDOS
    document.getElementById("pa-kpi-total").textContent = total;
    document.getElementById("pa-kpi-sla").textContent = sla;
    document.getElementById("pa-kpi-vc").textContent = pctVC;
    document.getElementById("pa-kpi-top-mes").textContent = topMes;
}

/* Tabla mensual */
function pa_renderTablaMeses(info) {
    const tbody = document.querySelector("#pa-tabla-meses tbody");
    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const mes of mesesOrden) {
        const m = info.meses[mes];
        if (!m) continue;

        const total = m.total;
        const pctVC = total ? ((m.vc / total) * 100).toFixed(1) + "%" : "0%";
        const sla = m.cuentaDias ? (m.sumaDias / m.cuentaDias).toFixed(1) : "0";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>${total}</td>
            <td>${m.presencial}</td>
            <td>${m.vc}</td>
            <td>${pctVC}</td>
            <td>${sla}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico anual */
function pa_renderChartAnual(info) {
    const ctx = document.getElementById("pa-chart-anual");

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const labels = [];
    const data = [];

    for (const mes of mesesOrden) {
        const m = info.meses[mes];
        if (!m) continue;
        labels.push(mes);
        data.push(m.total);
    }

    if (PA_CHART_ANUAL) PA_CHART_ANUAL.destroy();

    PA_CHART_ANUAL = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Firmas por mes",
                data,
                borderColor: "rgba(80, 200, 255, 1)",
                backgroundColor: "rgba(80, 200, 255, 0.2)",
                borderWidth: 1.5,
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
