/* ============================================================
   PANEL TIPO SLA — PREMIUM 2027
============================================================ */

let SLA_CHART_EVO = null;
let SLA_CHART_CONTRA = null;

/* ============================================================
   INIT
============================================================ */
async function initPanelSLA() {
    console.log("⏱️ initPanelSLA() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    // Normalizar / aplicar reglas si hace falta
    datos.forEach(aplicarReglas);

    const porAnio = sla_groupByAnioMes(datos);

    sla_initSelectAnio(porAnio);
    sla_renderTodo(porAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → MES
============================================================ */
function sla_groupByAnioMes(datos) {

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const mes  = (f.mes || "").toLowerCase().trim();
        const idx  = meses.indexOf(mes);

        if (!anio || idx === -1) continue;

        if (!map[anio]) {
            map[anio] = meses.map(() => ({
                total: 0,
                sla: 0,
                slaCon: 0,
                slaSin: 0,
                conCount: 0,
                sinCount: 0,
                presencial: 0,
                vc: 0
            }));
        }

        const row = map[anio][idx];

        // Total firmas
        row.total++;

        // SLA días (campo "dias" o similar)
        const dias = Number(f.dias) || 0;

        // Con / sin provisión (campo "tipo_provision" o similar)
        const tipoProv = (f.tipo_provision || "").toLowerCase().trim();
        const esCon = tipoProv.includes("con");
        const esSin = tipoProv.includes("sin");

        if (esCon) {
            row.conCount++;
            row.slaCon += dias;
        } else if (esSin) {
            row.sinCount++;
            row.slaSin += dias;
        }

        row.sla += dias;

        // Presencial / VC (campo "vc" o similar)
        const esVC = (f.vc || "").toLowerCase().includes("vc");
        if (esVC) {
            row.vc++;
        } else {
            row.presencial++;
        }
    }

    // Calcular medias
    for (const anio of Object.keys(map)) {
        map[anio].forEach(r => {
            if (!r.total) return;

            r.sla     = r.total ? r.sla / r.total : 0;
            r.slaCon  = r.conCount ? r.slaCon / r.conCount : 0;
            r.slaSin  = r.sinCount ? r.slaSin / r.sinCount : 0;
        });
    }

    return map;
}

/* ============================================================
   SELECT DE AÑO
============================================================ */
function sla_initSelectAnio(porAnio) {
    const sel = document.getElementById("sla-select-anio");
    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(porAnio).map(a => Number(a)).sort((a,b)=>a-b);

    anios.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        sel.appendChild(opt);
    });

    sel.onchange = () => sla_renderTodo(porAnio);
}

/* ============================================================
   RENDER COMPLETO (KPIs + tabla + gráficos)
============================================================ */
function sla_renderTodo(porAnio) {
    const sel = document.getElementById("sla-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = porAnio[anio];
    if (!info) return;

    sla_renderKPIs(info);
    sla_renderTabla(info);
    sla_renderGraficos(info);
}

/* ============================================================
   KPIs
============================================================ */
function sla_renderKPIs(info) {

    let total = 0;
    let sumaSLA = 0;
    let sumaCon = 0;
    let sumaSin = 0;
    let countCon = 0;
    let countSin = 0;

    info.forEach(r => {
        total += r.total;
        sumaSLA += r.sla * r.total;

        sumaCon += r.slaCon * r.conCount;
        sumaSin += r.slaSin * r.sinCount;

        countCon += r.conCount;
        countSin += r.sinCount;
    });

    const slaMedio   = total ? (sumaSLA / total).toFixed(1) : "0.0";
    const slaConMed  = countCon ? (sumaCon / countCon).toFixed(1) : "0.0";
    const slaSinMed  = countSin ? (sumaSin / countSin).toFixed(1) : "0.0";

    slaSafeSet("sla-kpi-total", total);
    slaSafeSet("sla-kpi-sla", slaMedio);
    slaSafeSet("sla-kpi-con", slaConMed);
    slaSafeSet("sla-kpi-sin", slaSinMed);
}

function slaSafeSet(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/* ============================================================
   TABLA MENSUAL
============================================================ */
function sla_renderTabla(info) {

    const tbody = document.querySelector("#sla-tabla-meses tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (let i = 0; i < meses.length; i++) {
        const r = info[i];
        const mes = meses[i];

        if (!r || !r.total) {
            tbody.innerHTML += `
                <tr>
                    <td>${mes}</td>
                    <td>0</td><td>0</td><td>0</td><td>0</td>
                    <td>0</td><td>0</td><td>0%</td><td>0%</td>
                </tr>`;
            continue;
        }

        const sla     = r.sla.toFixed(1);
        const slaCon  = r.slaCon.toFixed(1);
        const slaSin  = r.slaSin.toFixed(1);

        const pctVC   = r.total ? ((r.vc / r.total) * 100).toFixed(1) + "%" : "0%";
        const pctPres = r.total ? ((r.presencial / r.total) * 100).toFixed(1) + "%" : "0%";

        tbody.innerHTML += `
            <tr>
                <td>${mes}</td>
                <td>${r.total}</td>
                <td>${sla}</td>
                <td>${slaCon}</td>
                <td>${slaSin}</td>
                <td>${r.presencial}</td>
                <td>${r.vc}</td>
                <td>${pctPres}</td>
                <td>${pctVC}</td>
            </tr>`;
    }
}

/* ============================================================
   GRÁFICOS
============================================================ */
function sla_renderGraficos(info) {

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const labels = meses;
    const dataSLA      = info.map(r => r.total ? Number(r.sla.toFixed(1)) : 0);
    const dataSLACon   = info.map(r => r.conCount ? Number(r.slaCon.toFixed(1)) : 0);
    const dataSLASin   = info.map(r => r.sinCount ? Number(r.slaSin.toFixed(1)) : 0);

    const dataVC       = info.map(r => r.total ? (r.vc / r.total * 100).toFixed(1) : 0);
    const dataPres     = info.map(r => r.total ? (r.presencial / r.total * 100).toFixed(1) : 0);

    /* Evolución SLA */
    const ctxEvo = document.getElementById("sla-chart-evolucion");
    if (ctxEvo) {
        if (SLA_CHART_EVO) SLA_CHART_EVO.destroy();

        SLA_CHART_EVO = new Chart(ctxEvo, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "SLA medio",
                        data: dataSLA,
                        borderColor: "rgba(80,200,255,1)",
                        backgroundColor: "rgba(80,200,255,0.2)",
                        borderWidth: 2,
                        tension: 0.3
                    },
                    {
                        label: "SLA Con provisión",
                        data: dataSLACon,
                        borderColor: "rgba(120,220,120,1)",
                        backgroundColor: "rgba(120,220,120,0.2)",
                        borderWidth: 2,
                        tension: 0.3
                    },
                    {
                        label: "SLA Sin provisión",
                        data: dataSLASin,
                        borderColor: "rgba(255,120,80,1)",
                        backgroundColor: "rgba(255,120,80,0.2)",
                        borderWidth: 2,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: "bottom" }},
                scales: {
                    x: { ticks: { color: "#111" }},
                    y: { ticks: { color: "#111" }}
                }
            }
        });
    }

    /* Con vs Sin / Presencial vs VC */
    const ctxContra = document.getElementById("sla-chart-contra");
    if (ctxContra) {
        if (SLA_CHART_CONTRA) SLA_CHART_CONTRA.destroy();

        SLA_CHART_CONTRA = new Chart(ctxContra, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "% Presencial",
                        data: dataPres,
                        backgroundColor: "rgba(80,200,120,0.6)",
                        borderColor: "rgba(80,200,120,1)",
                        borderWidth: 1
                    },
                    {
                        label: "% VC",
                        data: dataVC,
                        backgroundColor: "rgba(80,120,255,0.6)",
                        borderColor: "rgba(80,120,255,1)",
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: "bottom" }},
                scales: {
                    x: { stacked: false, ticks: { color: "#111" }},
                    y: { stacked: false, ticks: { color: "#111" }}
                }
            }
        });
    }
}

/* ============================================================
   HACER GLOBAL LA FUNCIÓN PARA main.js
============================================================ */
window.initPanelSLA = initPanelSLA;
