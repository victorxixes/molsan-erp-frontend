/* ============================================================
   PANEL MENSUAL — PREMIUM 2027 (COMPATIBLE CON TU HTML)
============================================================ */

let PM_DATOS = [];
let PM_POR_ANIO = {};
let PM_CHART = null;

/* Helper seguro */
function pmSafeSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.textContent = value;
    return true;
}

async function initPanelMensual() {
    console.log("📅 initPanelMensual() ejecutado");

    if (!document.getElementById("pm-select-anio")) {
        console.warn("⏳ Panel Mensual aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PM_DATOS = datos;
    PM_POR_ANIO = pm_groupByAnioMes(PM_DATOS);

    pm_fillSelectAnios();
    pm_selectUltimoAnio();

    document.getElementById("pm-select-anio")
        .addEventListener("change", pm_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → MES
============================================================ */
function pm_groupByAnioMes(datos) {
    const map = {};

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        if (!mesesValidos.includes(mes)) continue;

        const dias = Number(f.dias);
        const esVC = (f.tipo_firma === "VideoConferencia");

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

/* ============================================================
   SELECT AÑOS
============================================================ */
function pm_fillSelectAnios() {
    const sel = document.getElementById("pm-select-anio");
    if (!sel) return;

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
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    pm_onChangeAnio();
}

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function pm_onChangeAnio() {
    const sel = document.getElementById("pm-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PM_POR_ANIO[anio];
    if (!info) return;

    pm_renderKpis(info);
    pm_renderTabla(info, anio);
    pm_renderChart(info, anio);
}

/* ============================================================
   KPIs
============================================================ */
function pm_renderKpis(info) {
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

    pmSafeSet("pm-kpi-total", total);
    pmSafeSet("pm-kpi-sla", sla);
    pmSafeSet("pm-kpi-vc", pctVC);
    pmSafeSet("pm-kpi-top-mes", topMes);
}

/* ============================================================
   TABLA MENSUAL (OCULTA MESES FUTUROS)
============================================================ */
function pm_renderTabla(info, anio) {
    const tbody = document.querySelector("#pm-tabla-meses tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    for (const mes of mesesOrden) {

        const idxMes = mesesOrden.indexOf(mes);

        // ❌ NO mostrar meses futuros del año en curso
        if (anio === currentYear && idxMes > currentMonthIndex) continue;

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

/* ============================================================
   GRÁFICO EVOLUCIÓN MENSUAL (OCULTA MESES FUTUROS)
============================================================ */
function pm_renderChart(info, anio) {
    const ctx = document.getElementById("pm-chart-mensual");
    if (!ctx) return;

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    const meses = mesesOrden.filter((m, idx) => {
        if (anio === currentYear && idx > currentMonthIndex) return false;
        return info[m];
    });

    const data = meses.map(m => info[m].total);

    if (PM_CHART) PM_CHART.destroy();

    PM_CHART = new Chart(ctx, {
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
