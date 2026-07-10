/* ============================================================
   PANEL TIPO FIRMA — PREMIUM 2027 (COMPATIBLE CON TU HTML)
============================================================ */

let PTF_DATOS = [];
let PTF_POR_ANIO = {};
let PTF_CHART = null;

/* Helper seguro */
function safeSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.textContent = value;
    return true;
}

async function initPanelTipoFirma() {
    console.log("✍️ initPanelTipoFirma() ejecutado");

    // Si el panel no está en el DOM → detener
    if (!document.getElementById("ptf-select-anio")) {
        console.warn("⏳ Panel Tipo Firma aún no está en el DOM. initPanelTipoFirma() detenido.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PTF_DATOS = datos;
    PTF_POR_ANIO = ptf_groupByAnioMesTipo(PTF_DATOS);

    ptf_fillSelectAnios();
    ptf_selectUltimoAnio();

    // Listener del selector de año
    document.getElementById("ptf-select-anio")
        .addEventListener("change", ptf_onChangeAnio);
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
                meses: {}
            };
        }

        const r = map[anio];

        if (!r.meses[mes]) {
            r.meses[mes] = {
                total: 0,
                presencial: 0,
                vc: 0
            };
        }

        const m = r.meses[mes];

        r.total++;
        m.total++;

        if (tipo === "VideoConferencia") {
            r.vc++;
            m.vc++;
        } else {
            r.presencial++;
            m.presencial++;
        }
    }

    return map;
}

/* Select años */
function ptf_fillSelectAnios() {
    const sel = document.getElementById("ptf-select-anio");
    if (!sel) return;

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
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    ptf_onChangeAnio();
}

/* Cambio de año */
function ptf_onChangeAnio() {
    const sel = document.getElementById("ptf-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PTF_POR_ANIO[anio];
    if (!info) return;

    ptf_renderKpis(info);
    ptf_renderTablaMeses(info);
    ptf_renderChart(info);
}

/* KPIs */
function ptf_renderKpis(info) {
    const total = info.total;

    const pctPres = total ? ((info.presencial / total) * 100).toFixed(1) + "%" : "0%";
    const pctVC = total ? ((info.vc / total) * 100).toFixed(1) + "%" : "0%";

    safeSet("ptf-kpi-total", total);
    safeSet("ptf-kpi-pres", pctPres);
    safeSet("ptf-kpi-vc", pctVC);

    // Mes más fuerte
    let topMes = "-";
    let max = 0;

    for (const mes in info.meses) {
        if (info.meses[mes].total > max) {
            max = info.meses[mes].total;
            topMes = mes;
        }
    }

    safeSet("ptf-kpi-top-mes", topMes);
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
        const pctVC = total ? ((m.vc / total) * 100).toFixed(1) + "%" : "0%";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>${total}</td>
            <td>${m.presencial}</td>
            <td>${m.vc}</td>
            <td>${pctVC}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico tipo firma */
function ptf_renderChart(info) {
    const ctx = document.getElementById("ptf-chart-tipo-firma");
    if (!ctx) return;

    const labels = Object.keys(info.meses);
    const dataPres = labels.map(m => info.meses[m].presencial);
    const dataVC = labels.map(m => info.meses[m].vc);

    if (PTF_CHART) PTF_CHART.destroy();

    PTF_CHART = new Chart(ctx, {
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
        }
    });
}
