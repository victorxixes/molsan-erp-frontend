/* ============================================================
   PANEL SLA — PREMIUM 2027 (COMPATIBLE CON TU HTML)
============================================================ */

let SLA_DATOS = [];
let SLA_POR_ANIO = {};
let SLA_CHART = null;

/* Helper seguro */
function slaSafeSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.textContent = value;
    return true;
}

async function initPanelSLA() {
    console.log("⏱️ initPanelSLA() ejecutado");

    if (!document.getElementById("sla-select-anio")) {
        console.warn("⏳ Panel SLA aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    SLA_DATOS = datos;
    SLA_POR_ANIO = sla_groupByAnio(SLA_DATOS);

    sla_fillSelectAnios();
    sla_selectUltimoAnio();

    document.getElementById("sla-select-anio")
        .addEventListener("change", sla_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → MES → TIPO GESTIÓN
============================================================ */
function sla_groupByAnio(datos) {
    const map = {};

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        const idxMes = mesesValidos.indexOf(mes);
        if (idxMes === -1) continue;

        // ❌ Mes futuro del año en curso → ignorar
        if (anio === currentYear && idxMes > currentMonthIndex) continue;

        const dias = Number(f.dias);
        const tipo = f.tipo_gestion || "Con provisión";
        const esVC = (f.tipo_firma === "VideoConferencia");

        if (!map[anio]) map[anio] = {};

        if (!map[anio][mes]) {
            map[anio][mes] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0,
                con: { suma: 0, cuenta: 0 },
                sin: { suma: 0, cuenta: 0 }
            };
        }

        const r = map[anio][mes];

        r.total++;

        if (esVC) r.vc++;
        else r.presencial++;

        if (dias > 0) {
            r.sumaDias += dias;
            r.cuentaDias++;

            if (tipo === "Con provisión") {
                r.con.suma += dias;
                r.con.cuenta++;
            } else {
                r.sin.suma += dias;
                r.sin.cuenta++;
            }
        }
    }

    return map;
}

/* ============================================================
   SELECT AÑOS
============================================================ */
function sla_fillSelectAnios() {
    const sel = document.getElementById("sla-select-anio");
    if (!sel) return;

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
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    sla_onChangeAnio();
}

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function sla_onChangeAnio() {
    const sel = document.getElementById("sla-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = SLA_POR_ANIO[anio];
    if (!info) return;

    sla_renderKpis(info);
    sla_renderTabla(info);
    sla_renderChart(info);
}

/* ============================================================
   KPIs
============================================================ */
function sla_renderKpis(info) {
    let total = 0;
    let sumaDias = 0;
    let cuentaDias = 0;

    let sumaCon = 0;
    let cuentaCon = 0;

    let sumaSin = 0;
    let cuentaSin = 0;

    let vc = 0;

    for (const mes in info) {
        const r = info[mes];

        total += r.total;
        vc += r.vc;

        sumaDias += r.sumaDias;
        cuentaDias += r.cuentaDias;

        sumaCon += r.con.suma;
        cuentaCon += r.con.cuenta;

        sumaSin += r.sin.suma;
        cuentaSin += r.sin.cuenta;
    }

    const sla = cuentaDias ? (sumaDias / cuentaDias).toFixed(1) : "0";
    const slaCon = cuentaCon ? (sumaCon / cuentaCon).toFixed(1) : "0";
    const slaSin = cuentaSin ? (sumaSin / cuentaSin).toFixed(1) : "0";
    const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";

    slaSafeSet("sla-kpi-total", total);
    slaSafeSet("sla-kpi-sla", sla);
    slaSafeSet("sla-kpi-con", slaCon);
    slaSafeSet("sla-kpi-sin", slaSin);
    slaSafeSet("sla-kpi-vc", pctVC);
}

/* ============================================================
   TABLA DETALLE (CON MESES)
============================================================ */
function sla_renderTabla(info) {
    const tbody = document.querySelector("#sla-tabla-meses tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const mes of mesesOrden) {

        const r = info[mes];

        if (!r) {
            // Mes sin datos
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${mes}</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0%</td>
            `;
            tbody.appendChild(tr);
            continue;
        }

        const sla = r.cuentaDias ? (r.sumaDias / r.cuentaDias).toFixed(1) : "0";
        const slaCon = r.con.cuenta ? (r.con.suma / r.con.cuenta).toFixed(1) : "0";
        const slaSin = r.sin.cuenta ? (r.sin.suma / r.sin.cuenta).toFixed(1) : "0";
        const pctVC = r.total ? ((r.vc / r.total) * 100).toFixed(1) + "%" : "0%";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>${r.total}</td>
            <td>${sla}</td>
            <td>${slaCon}</td>
            <td>${slaSin}</td>
            <td>${r.presencial}</td>
            <td>${r.vc}</td>
            <td>${pctVC}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* ============================================================
   GRÁFICO EVOLUCIÓN SLA
============================================================ */
function sla_renderChart(info) {
    const ctx = document.getElementById("sla-chart-evolucion");
    if (!ctx) return;

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const labels = mesesOrden;
    const data = mesesOrden.map(m => {
        const r = info[m];
        return r && r.cuentaDias ? (r.sumaDias / r.cuentaDias).toFixed(1) : 0;
    });

    if (SLA_CHART) SLA_CHART.destroy();

    SLA_CHART = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "SLA mensual",
                data,
                borderColor: "rgba(80,200,255,1)",
                backgroundColor: "rgba(80,200,255,0.3)",
                borderWidth: 2,
                tension: 0.3
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
