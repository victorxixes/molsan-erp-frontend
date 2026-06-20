/* ============================================================
   PANEL MENSUAL — PREMIUM 2027 (CORREGIDO)
============================================================ */

let PM_DATOS = [];
let PM_POR_ANIO = {};
let PM_CHART_MESES = null;

async function initPanelMensual() {
    console.log("📅 initPanelMensual() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PM_DATOS = datos;

    PM_POR_ANIO = pm_groupByAnioMes(PM_DATOS);

    pm_fillSelectAnios();
    pm_selectUltimoAnio();
}

/* Agrupar por año y mes */
function pm_groupByAnioMes(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const mes = f.mes;

        if (!anio || !mes) continue;

        if (!map[anio]) {
            map[anio] = {
                meses: {},
                total: 0,
                sumaDias: 0,
                cuentaDias: 0,
                vc: 0,
                presencial: 0
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
function pm_fillSelectAnios() {
    const sel = document.getElementById("pm-select-anio");
    sel.innerHTML = "";

    const anios = Object.keys(PM_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function pm_selectUltimoAnio() {
    const sel = document.getElementById("pm-select-anio");
    sel.value = sel.options[sel.options.length - 1].value;
    pm_onChangeAnio();
}

/* Cambio de año */
function pm_onChangeAnio() {
    const sel = document.getElementById("pm-select-anio");
    const anio = Number(sel.value);

    const info = PM_POR_ANIO[anio];
    if (!info) return;

    pm_renderKpis(info);
    pm_renderTablaMeses(info);
    pm_renderChartMeses(info);
}

/* KPIs */
function pm_renderKpis(info) {
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
    document.getElementById("pm-kpi-total").textContent = total;
    document.getElementById("pm-kpi-sla").textContent = sla;
    document.getElementById("pm-kpi-vc").textContent = pctVC;
    document.getElementById("pm-kpi-top-mes").textContent = topMes;
}

/* Tabla mensual */
function pm_renderTablaMeses(info) {
    const tbody = document.querySelector("#pm-tabla-meses tbody");
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

/* Gráfico mensual */
function pm_renderChartMeses(info) {
    const ctx = document.getElementById("pm-chart-meses");

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

    if (PM_CHART_MESES) PM_CHART_MESES.destroy();

    PM_CHART_MESES = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Firmas por mes",
                data,
                backgroundColor: "rgba(80, 200, 255, 0.4)",
                borderColor: "rgba(80, 200, 255, 1)",
                borderWidth: 1.5
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
