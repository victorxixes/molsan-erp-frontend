/* ============================================================
   PANEL SLA — PREMIUM 2027
============================================================ */

let SLA_DATOS = [];
let SLA_POR_ANIO = {};

let SLA_CHART_EVOLUCION = null;
let SLA_CHART_CONTRA = null;

/* ============================================================
   INIT
============================================================ */
async function initPanelSLA() {
    console.log("⏱️ initPanelSLA() ejecutado");

    const sel = document.getElementById("sla-select-anio");
    if (!sel) {
        console.warn("⏳ Panel SLA aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    SLA_DATOS = datos;
    SLA_POR_ANIO = sla_groupByAnio(datos);

    sla_fillSelectAnios();
    sla_selectUltimoAnio();

    sel.addEventListener("change", sla_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → MES → TIPO GESTIÓN
============================================================ */
function sla_groupByAnio(datos) {

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const map = {};
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    for (const f of datos) {

        const anio = Number(f.anio);
        const mes = (f.mes || "").toLowerCase().trim();
        const idxMes = mesesValidos.indexOf(mes);

        if (!anio || idxMes === -1) continue;

        // Evitar meses futuros del año actual
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
        if (esVC) r.vc++; else r.presencial++;

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
    sla_renderGraficos(info);
}

/* ============================================================
   KPIs
============================================================ */
function sla_renderKpis(info) {

    let total = 0;
    let vc = 0;

    let sumaDias = 0;
    let cuentaDias = 0;

    let sumaCon = 0;
    let cuentaCon = 0;

    let sumaSin = 0;
    let cuentaSin = 0;

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

    slaSafeSet("sla-kpi-total", total);
    slaSafeSet("sla-kpi-sla", sla);
    slaSafeSet("sla-kpi-con", slaCon);
    slaSafeSet("sla-kpi-sin", slaSin);
}

/* Helper seguro */
function slaSafeSet(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/* ============================================================
   TABLA DETALLE
============================================================ */
function sla_renderTabla(info) {

    const tbody = document.querySelector("#sla-tabla-meses tbody");
    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const mes of mesesOrden) {

        const r = info[mes];

        if (!r) {
            tbody.innerHTML += `
                <tr>
                    <td>${mes}</td>
                    <td>0</td><td>0</td><td>0</td><td>0</td>
                    <td>0</td><td>0</td><td>0%</td>
                </tr>`;
            continue;
        }

        const sla = r.cuentaDias ? (r.sumaDias / r.cuentaDias).toFixed(1) : "0";
        const slaCon = r.con.cuenta ? (r.con.suma / r.con.cuenta).toFixed(1) : "0";
        const slaSin = r.sin.cuenta ? (r.sin.suma / r.sin.cuenta).toFixed(1) : "0";
        const pctVC = r.total ? ((r.vc / r.total) * 100).toFixed(1) + "%" : "0%";

        tbody.innerHTML += `
            <tr>
                <td>${mes}</td>
                <td>${r.total}</td>
                <td>${sla}</td>
                <td>${slaCon}</td>
                <td>${slaSin}</td>
                <td>${r.presencial}</td>
                <td>${r.vc}</td>
                <td>${pctVC}</td>
            </tr>`;
    }
}

/* ============================================================
   GRÁFICOS PREMIUM 2027
============================================================ */
function sla_renderGraficos(info) {

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    /* ------------------------------
       1) Evolución SLA (línea)
    ------------------------------ */
    const dataEvo = meses.map(m => {
        const r = info[m];
        return r && r.cuentaDias ? (r.sumaDias / r.cuentaDias).toFixed(1) : 0;
    });

    const ctxEvo = document.getElementById("sla-chart-evolucion");

    if (SLA_CHART_EVOLUCION) SLA_CHART_EVOLUCION.destroy();

    SLA_CHART_EVOLUCION = new Chart(ctxEvo, {
        type: "line",
        data: {
            labels: meses,
            datasets: [{
                label: "SLA mensual",
                data: dataEvo,
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

    /* ------------------------------
       2) SLA Con vs Sin (barras)
    ------------------------------ */
    const dataCon = meses.map(m => {
        const r = info[m];
        return r && r.con.cuenta ? (r.con.suma / r.con.cuenta).toFixed(1) : 0;
    });

    const dataSin = meses.map(m => {
        const r = info[m];
        return r && r.sin.cuenta ? (r.sin.suma / r.sin.cuenta).toFixed(1) : 0;
    });

    const ctxContra = document.getElementById("sla-chart-contra");

    if (SLA_CHART_CONTRA) SLA_CHART_CONTRA.destroy();

    SLA_CHART_CONTRA = new Chart(ctxContra, {
        type: "bar",
        data: {
            labels: meses,
            datasets: [
                {
                    label: "SLA Con provisión",
                    data: dataCon,
                    backgroundColor: "rgba(255,159,64,0.7)"
                },
                {
                    label: "SLA Sin provisión",
                    data: dataSin,
                    backgroundColor: "rgba(99,132,255,0.7)"
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true }},
            scales: {
                x: { stacked: true, ticks: { color: "#111" }},
                y: { stacked: true, ticks: { color: "#111" }}
            }
        }
    });
}

/* ============================================================
   HACER GLOBAL LA FUNCIÓN PARA main.js
============================================================ */
window.initPanelSLA = initPanelSLA;
