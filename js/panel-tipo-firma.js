/* ============================================================
   PANEL TIPO FIRMA — GLASS LUXE 2027
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

    // Agrupar por año y mes + tipo firma
    PTF_POR_ANIO = ptf_groupByAnioMesTipo(PTF_DATOS);

    // Rellenar selector de años
    ptf_fillSelectAnios();

    // Seleccionar último año
    ptf_selectUltimoAnio();

    // Render gráfico anual global
    ptf_renderChartAnualGlobal();
}

/* Agrupar por año, mes y tipo firma */
function ptf_groupByAnioMesTipo(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio) || 0;
        if (!anio) continue;

        const mes = f.mes || "";
        if (!mes) continue;

        const tipo = f.tipo_firma || "Presencial";

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

        const d = Number(f.dias) || 0;

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

/* Rellenar selector de años */
function ptf_fillSelectAnios() {
    const sel = document.getElementById("ptf-select-anio");
    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(PTF_POR_ANIO)
        .map(a => Number(a))
        .sort((a, b) => a - b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

/* Seleccionar último año */
function ptf_selectUltimoAnio() {
    const sel = document.getElementById("ptf-select-anio");
    if (!sel || !sel.options.length) return;

    sel.value = sel.options[sel.options.length - 1].value;
    ptf_onChangeAnio();
}

/* Cambio de año */
function ptf_onChangeAnio() {
    const sel = document.getElementById("ptf-select-anio");
    if (!sel) return;

    const anio = Number(sel.value) || 0;
    if (!anio) return;

    const info = PTF_POR_ANIO[anio];
    if (!info) return;

    ptf_renderKpis(info);
    ptf_renderTablaMeses(info);
    ptf_renderChartMensual(info);
}

/* KPIs del año */
function ptf_renderKpis(info) {
    const total = info.total;
    const pres = info.presencial;
    const vc = info.vc;

    const pctPres = total ? ((pres / total) * 100).toFixed(1) + "%" : "0%";
    const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";

    const slaPres = info.cuentaDiasPres ? (info.sumaDiasPres / info.cuentaDiasPres).toFixed(1) : "0";
    const slaVC = info.cuentaDiasVC ? (info.sumaDiasVC / info.cuentaDiasVC).toFixed(1) : "0";

    document.getElementById("ptf-kpi-total").textContent = total;
    document.getElementById("ptf-kpi-pres").textContent = pctPres;
    document.getElementById("ptf-kpi-vc").textContent = pctVC;
    document.getElementById("ptf-kpi-sla-pres").textContent = slaPres;
    document.getElementById("ptf-kpi-sla-vc").textContent = slaVC;
}

/* Tabla mensual */
function ptf_renderTablaMeses(info) {
    const tbody = document.querySelector("#ptf-tabla-meses tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const mes of mesesOrden) {
        const m = info.meses[mes];
        if (!m) continue;

        const total = m.total;
        const pres = m.presencial;
        const vc = m.vc;
        const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";

        const slaPres = m.cuentaDiasPres ? (m.sumaDiasPres / m.cuentaDiasPres).toFixed(1) : "0";
        const slaVC = m.cuentaDiasVC ? (m.sumaDiasVC / m.cuentaDiasVC).toFixed(1) : "0";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>${total}</td>
            <td>${pres}</td>
            <td>${vc}</td>
            <td>${pctVC}</td>
            <td>${slaPres}</td>
            <td>${slaVC}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico anual global (todos los años) */
function ptf_renderChartAnualGlobal() {
    const ctx = document.getElementById("ptf-chart-anual");
    if (!ctx) return;

    const anios = Object.keys(PTF_POR_ANIO)
        .map(a => Number(a))
        .sort((a, b) => a - b);

    const dataPres = anios.map(a => PTF_POR_ANIO[a].presencial);
    const dataVC = anios.map(a => PTF_POR_ANIO[a].vc);

    if (PTF_CHART_ANUAL) {
        PTF_CHART_ANUAL.destroy();
    }

    PTF_CHART_ANUAL = new Chart(ctx, {
        type: "bar",
        data: {
            labels: anios,
            datasets: [
                {
                    label: "Presencial",
                    data: dataPres,
                    backgroundColor: "rgba(150, 255, 80, 0.4)",
                    borderColor: "rgba(150, 255, 80, 1)",
                    borderWidth: 1.5
                },
                {
                    label: "VC",
                    data: dataVC,
                    backgroundColor: "rgba(80, 200, 255, 0.4)",
                    borderColor: "rgba(80, 200, 255, 1)",
                    borderWidth: 1.5
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "#fff" } }
            },
            scales: {
                x: {
                    ticks: { color: "#fff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                },
                y: {
                    ticks: { color: "#fff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                }
            }
        }
    });
}

/* Gráfico mensual por tipo de firma (año seleccionado) */
function ptf_renderChartMensual(info) {
    const ctx = document.getElementById("ptf-chart-mensual");
    if (!ctx) return;

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const labels = [];
    const dataPres = [];
    const dataVC = [];

    for (const mes of mesesOrden) {
        const m = info.meses[mes];
        if (!m) continue;
        labels.push(mes);
        dataPres.push(m.presencial);
        dataVC.push(m.vc);
    }

    if (PTF_CHART_MENSUAL) {
        PTF_CHART_MENSUAL.destroy();
    }

    PTF_CHART_MENSUAL = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Presencial",
                    data: dataPres,
                    borderColor: "rgba(150, 255, 80, 1)",
                    backgroundColor: "rgba(150, 255, 80, 0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                },
                {
                    label: "VC",
                    data: dataVC,
                    borderColor: "rgba(80, 200, 255, 1)",
                    backgroundColor: "rgba(80, 200, 255, 0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "#fff" } }
            },
            scales: {
                x: {
                    ticks: { color: "#fff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                },
                y: {
                    ticks: { color: "#fff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                }
            }
        }
    });
}
