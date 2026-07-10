/* ============================================================
   PANEL ANUAL — PREMIUM 2027 (COMPATIBLE CON TU HTML)
============================================================ */

let PA_DATOS = [];
let PA_POR_ANIO = {};
let PA_CHART = null;

/* Helper seguro */
function paSafeSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.textContent = value;
    return true;
}

async function initPanelAnual() {
    console.log("📆 initPanelAnual() ejecutado");

    // Si el panel no está en el DOM → detener
    if (!document.getElementById("pa-select-anio")) {
        console.warn("⏳ Panel Anual aún no está en el DOM. initPanelAnual() detenido.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PA_DATOS = datos;
    PA_POR_ANIO = pa_groupByAnioMes(PA_DATOS);

    pa_fillSelectAnios();
    pa_selectUltimoAnio();

    // Listener del selector de año
    document.getElementById("pa-select-anio")
        .addEventListener("change", pa_onChangeAnio);
}

/* Agrupar por año y mes */
function pa_groupByAnioMes(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const mes = f.mes;
        const dias = Number(f.dias);
        const esVC = (f.tipo_firma === "VideoConferencia");

        if (!anio || !mes) continue;

        if (!map[anio]) map[anio] = {};

        if (!map[anio][mes]) {
            map[anio][mes] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0
            };
        }

        const r = map[anio][mes];

        r.total++;

        if (esVC) r.vc++;
        else r.presencial++;

        if (dias > 0) {
            r.sumaDias += dias;
            r.cuentaDias++;
        }
    }

    return map;
}

/* Select años */
function pa_fillSelectAnios() {
    const sel = document.getElementById("pa-select-anio");
    if (!sel) return;

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
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    pa_onChangeAnio();
}

/* Cambio de año */
function pa_onChangeAnio() {
    const sel = document.getElementById("pa-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PA_POR_ANIO[anio];
    if (!info) return;

    pa_renderKpis(info);
    pa_renderTabla(info);
    pa_renderChart(info);
}

/* KPIs */
function pa_renderKpis(info) {
    let total = 0;
    let vc = 0;
    let sumaDias = 0;
    let cuentaDias = 0;

    let topMes = "-";
    let maxMes = 0;

    for (const mes in info) {
        const r = info[mes];

        total += r.total;
        vc += r.vc;

        sumaDias += r.sumaDias;
        cuentaDias += r.cuentaDias;

        if (r.total > maxMes) {
            maxMes = r.total;
            topMes = mes;
        }
    }

    const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";
    const sla = cuentaDias ? (sumaDias / cuentaDias).toFixed(1) : "0";

    paSafeSet("pa-kpi-total", total);
    paSafeSet("pa-kpi-sla", sla);
    paSafeSet("pa-kpi-vc", pctVC);
    paSafeSet("pa-kpi-top-mes", topMes);
}

/* Tabla mensual */
function pa_renderTabla(info) {
    const tbody = document.querySelector("#pa-tabla-meses tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const mes of mesesOrden) {
        const r = info[mes];
        if (!r) continue;

        const sla = r.cuentaDias ? (r.sumaDias / r.cuentaDias).toFixed(1) : "0";
        const pctVC = r.total ? ((r.vc / r.total) * 100).toFixed(1) + "%" : "0%";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>${r.total}</td>
            <td>${r.presencial}</td>
            <td>${r.vc}</td>
            <td>${pctVC}</td>
            <td>${sla}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico evolución anual */
function pa_renderChart(info) {
    const ctx = document.getElementById("pa-chart-anual");
    if (!ctx) return;

    const meses = Object.keys(info);
    const data = meses.map(m => info[m].total);

    if (PA_CHART) PA_CHART.destroy();

    PA_CHART = new Chart(ctx, {
        type: "line",
        data: {
            labels: meses,
            datasets: [{
                label: "Total firmas",
                data,
                borderColor: "rgba(80,200,255,1)",
                backgroundColor: "rgba(80,200,255,0.2)",
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
