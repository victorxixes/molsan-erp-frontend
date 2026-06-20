/* ============================================================
   PANEL TIPO FIRMA — PREMIUM 2027 (CORREGIDO)
============================================================ */

let PTF_DATOS = [];
let PTF_POR_ANIO = {};
let PTF_CHART_ANUAL = null;
let PTF_CHART_MENSUAL = null;

async function initPanelTipoFirma() {
    console.log("✍️ initPanelTipoFirma() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PTF_DATOS = datos;

    PTF_POR_ANIO = ptf_groupByAnioMesTipo(PTF_DATOS);

    ptf_fillSelectAnios();
    ptf_selectUltimoAnio();
}

/* Agrupar por año, mes y tipo firma */
function ptf_groupByAnioMesTipo(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const mes = f.mes;
        const tipo = f.tipo_firma || "Presencial";

        if (!anio || !mes) continue;

        if (!map[anio]) {
            map[anio] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDiasPres: 0,
                cuentaDiasPres: 0,
                sumaDiasVC: 0,
                cuentaDiasVC: 0,
                meses: {}
            };
        }

        const r = map[anio];

        if (!r.meses[mes]) {
            r.meses[mes] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDiasPres: 0,
                cuentaDiasPres: 0,
                sumaDiasVC: 0,
                cuentaDiasVC: 0
            };
        }

        const m = r.meses[mes];

        r.total++;
        m.total++;

        const d = Number(f.dias);

        if (tipo === "VideoConferencia") {
            r.vc++;
            m.vc++;
            if (d > 0) {
                r.sumaDiasVC += d;
                r.cuentaDiasVC++;
                m.sumaDiasVC += d;
                m.cuentaDiasVC++;
            }
        } else {
            r.presencial++;
            m.presencial++;
            if (d > 0) {
                r.sumaDiasPres += d;
                r.cuentaDiasPres++;
                m.sumaDiasPres += d;
                m.cuentaDiasPres++;
            }
        }
    }

    return map;
}

/* Select años */
function ptf_fillSelectAnios() {
    const sel = document.getElementById("ptf-select-anio");
    sel.innerHTML = "";

    const anios = Object.keys(PTF_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function ptf_selectUltimoAnio() {
    const sel = document.getElementById("ptf-select-anio");
    sel.value = sel.options[sel.options.length - 1].value;
    ptf_onChangeAnio();
}

/* Cambio de año */
function ptf_onChangeAnio() {
    const sel = document.getElementById("ptf-select-anio");
    const anio = Number(sel.value);

    const info = PTF_POR_ANIO[anio];
    if (!info) return;

    ptf_renderKpis(info);
    ptf_renderTablaMeses(info);
    ptf_renderChartAnual(info);
    ptf_renderChartMensual(info);
}

/* KPIs */
function ptf_renderKpis(info) {
    const total = info.total;

    const pctPres = total ? ((info.presencial / total) * 100).toFixed(1) + "%" : "0%";
    const pctVC = total ? ((info.vc / total) * 100).toFixed(1) + "%" : "0%";

    const slaPres = info.cuentaDiasPres ? (info.sumaDiasPres / info.cuentaDiasPres).toFixed(1) : "0";
    const slaVC = info.cuentaDiasVC ? (info.sumaDiasVC / info.cuentaDiasVC).toFixed(1) : "0";

    // 🔥 IDS CORREGIDOS
    document.getElementById("ptf-kpi-total").textContent = total;
    document.getElementById("ptf-kpi-pres").textContent = pctPres;
    document.getElementById("ptf-kpi-vc").textContent = pctVC;
    document.getElementById("ptf-kpi-sla-pres").textContent = slaPres;
    document.getElementById("ptf-kpi-sla-vc").textContent = slaVC;
}

/* Tabla mensual */
function ptf_renderTablaMeses(info) {
    const tbody = document.querySelector("#ptf-tabla-meses tbody");
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
        const slaPres = m.cuentaDiasPres ? (m.sumaDiasPres / m.cuentaDiasPres).toFixed(1) : "0";
        const slaVC = m.cuentaDiasVC ? (m.sumaDiasVC / m.cuentaDiasVC).toFixed(1) : "0";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>${total}</td>
            <td>${m.presencial}</td>
            <td>${m.vc}</td>
            <td>${pctVC}</td>
            <td>${slaPres}</td>
            <td>${slaVC}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico anual */
function ptf_renderChartAnual(info) {
    const ctx = document.getElementById("ptf-chart-anual");

    const labels = Object.keys(info.meses);
    const dataPres = labels.map(m => info.meses[m].presencial);
    const dataVC = labels.map(m => info.meses[m].vc);

    if (PTF_CHART_ANUAL) PTF_CHART_ANUAL.destroy();

    PTF_CHART_ANUAL = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Presencial",
                    data: dataPres,
                    backgroundColor: "rgba(150,255,80,0.4)",
                    borderColor: "rgba(150,255,80,1)",
                    borderWidth: 1.5
                },
                {
                    label: "VC",
                    data: dataVC,
                    backgroundColor: "rgba(80,200,255,0.4)",
                    borderColor: "rgba(80,200,255,1)",
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
function ptf_renderChartMensual(info) {
    const ctx = document.getElementById("ptf-chart-mensual");

    const labels = Object.keys(info.meses);
    const dataPres = labels.map(m => info.meses[m].presencial);
    const dataVC = labels.map(m => info.meses[m].vc);

    if (PTF_CHART_MENSUAL) PTF_CHART_MENSUAL.destroy();

    PTF_CHART_MENSUAL = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Presencial",
                    data: dataPres,
                    borderColor: "rgba(150,255,80,1)",
                    backgroundColor: "rgba(150,255,80,0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                },
                {
                    label: "VC",
                    data: dataVC,
                    borderColor: "rgba(80,200,255,1)",
                    backgroundColor: "rgba(80,200,255,0.2)",
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
