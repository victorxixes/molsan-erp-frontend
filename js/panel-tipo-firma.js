/* ============================================================
   PANEL TIPO FIRMA — PREMIUM 2027 (VERSIÓN FINAL)
============================================================ */

let PTF_DATOS = [];
let PTF_POR_ANIO = {};
let PTF_CHART = null;

/* ============================================================
   INIT
============================================================ */
async function initPanelTipoFirma() {
    console.log("✍️ initPanelTipoFirma() ejecutado");

    if (!document.getElementById("ptf-select-anio")) {
        console.warn("⏳ Panel Tipo Firma aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PTF_DATOS = datos;
    PTF_POR_ANIO = ptf_groupByAnio(PTF_DATOS);

    ptf_fillSelectAnios();
    ptf_selectUltimoAnio();

    document.getElementById("ptf-select-anio")
        .addEventListener("change", ptf_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → TIPO FIRMA → MES
============================================================ */
function ptf_groupByAnio(datos) {
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

        if (anio === currentYear && idxMes > currentMonthIndex) continue;

        const tipo = f.tipo_firma || "Desconocido";
        const dias = Number(f.dias);

        if (!map[anio]) map[anio] = {};

        if (!map[anio][tipo]) {
            map[anio][tipo] = {
                total: 0,
                presencial: 0,
                vc: 0,
                slaPres: { suma: 0, cuenta: 0 },
                slaVC: { suma: 0, cuenta: 0 },
                meses: {}
            };
        }

        const r = map[anio][tipo];

        if (!r.meses[mes]) {
            r.meses[mes] = { total: 0 };
        }

        r.total++;
        r.meses[mes].total++;

        if (tipo === "Presencial") {
            r.presencial++;
            if (dias > 0) {
                r.slaPres.suma += dias;
                r.slaPres.cuenta++;
            }
        } else if (tipo === "VideoConferencia") {
            r.vc++;
            if (dias > 0) {
                r.slaVC.suma += dias;
                r.slaVC.cuenta++;
            }
        }
    }

    return map;
}

/* ============================================================
   SELECT AÑOS
============================================================ */
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

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function ptf_onChangeAnio() {
    const sel = document.getElementById("ptf-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PTF_POR_ANIO[anio];
    if (!info) return;

    ptf_renderKpis(info);
    ptf_renderTabla(info);
    ptf_renderChart(info);
}

/* ============================================================
   KPIs
============================================================ */
function ptf_renderKpis(info) {
    let total = 0;
    let presencial = 0;
    let vc = 0;

    let topMes = "-";
    let maxMes = 0;

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const tipo in info) {
        const r = info[tipo];

        total += r.total;
        presencial += r.presencial;
        vc += r.vc;

        for (const mes in r.meses) {
            if (r.meses[mes].total > maxMes) {
                maxMes = r.meses[mes].total;
                topMes = mes;
            }
        }
    }

    const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";
    const pctPres = total ? ((presencial / total) * 100).toFixed(1) + "%" : "0%";

    document.getElementById("ptf-kpi-total").textContent = total;
    document.getElementById("ptf-kpi-vc").textContent = pctVC;
    document.getElementById("ptf-kpi-pres").textContent = pctPres;
    document.getElementById("ptf-kpi-top-mes").textContent = topMes;
}

/* ============================================================
   TABLA DETALLE (CON MESES)
============================================================ */
function ptf_renderTabla(info) {
    const tbody = document.querySelector("#ptf-tabla-meses tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const lista = Object.entries(info).map(([tipo, r]) => {

        const pctPres = r.total ? ((r.presencial / r.total) * 100).toFixed(1) + "%" : "0%";
        const pctVC = r.total ? ((r.vc / r.total) * 100).toFixed(1) + "%" : "0%";

        const slaPres = r.slaPres.cuenta ? (r.slaPres.suma / r.slaPres.cuenta).toFixed(1) : "0";
        const slaVC = r.slaVC.cuenta ? (r.slaVC.suma / r.slaVC.cuenta).toFixed(1) : "0";

        const meses = mesesOrden.map(m => {
            const mm = r.meses[m];
            return mm ? mm.total : 0;
        });

        return {
            tipo,
            total: r.total,
            presencial: r.presencial,
            vc: r.vc,
            pctPres,
            pctVC,
            slaPres,
            slaVC,
            meses
        };
    });

    lista.sort((a,b)=>b.total - a.total);

    for (const row of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.tipo}</td>
            <td>${row.total}</td>
            <td>${row.presencial}</td>
            <td>${row.vc}</td>
            <td>${row.pctPres}</td>
            <td>${row.pctVC}</td>
            <td>${row.slaPres}</td>
            <td>${row.slaVC}</td>
            ${row.meses.map(v => `<td>${v}</td>`).join("")}
        `;

        tbody.appendChild(tr);
    }
}

/* ============================================================
   GRÁFICO
============================================================ */
function ptf_renderChart(info) {
    const ctx = document.getElementById("ptf-chart-tipo-firma");
    if (!ctx) return;

    const lista = Object.entries(info)
        .map(([tipo, r]) => ({ tipo, total: r.total }))
        .sort((a,b)=>b.total - a.total);

    const labels = lista.map(o => o.tipo);
    const data = lista.map(o => o.total);

    if (PTF_CHART) PTF_CHART.destroy();

    PTF_CHART = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Firmas por tipo",
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
