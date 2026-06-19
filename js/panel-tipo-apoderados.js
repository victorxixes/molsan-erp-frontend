/* ============================================================
   PANEL APODERADOS — PREMIUM 2027
============================================================ */

let PAP_DATOS = [];
let PAP_POR_ANIO = {};
let PAP_CHART_APODERADOS = null;

async function initPanelApoderados() {
    console.log("👤 initPanelApoderados() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PAP_DATOS = datos;

    PAP_POR_ANIO = pap_groupByAnioApoderado(PAP_DATOS);

    pap_fillSelectAnios();
    pap_selectUltimoAnio();
}

/* Agrupar por año y apoderado */
function pap_groupByAnioApoderado(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const ap = f.apoderado || "Sin apoderado";

        if (!anio) continue;

        if (!map[anio]) {
            map[anio] = {
                total: 0,
                vc: 0,
                presencial: 0,
                sumaDias: 0,
                cuentaDias: 0,
                apoderados: {}
            };
        }

        const r = map[anio];

        if (!r.apoderados[ap]) {
            r.apoderados[ap] = {
                total: 0,
                vc: 0,
                presencial: 0,
                sumaDias: 0,
                cuentaDias: 0
            };
        }

        const a = r.apoderados[ap];

        r.total++;
        a.total++;

        if (f.tipo_firma === "VideoConferencia") {
            r.vc++;
            a.vc++;
        } else {
            r.presencial++;
            a.presencial++;
        }

        const d = Number(f.dias);
        if (d > 0) {
            r.sumaDias += d;
            r.cuentaDias++;
            a.sumaDias += d;
            a.cuentaDias++;
        }
    }

    return map;
}

/* Select años */
function pap_fillSelectAnios() {
    const sel = document.getElementById("pap-select-anio");
    sel.innerHTML = "";

    const anios = Object.keys(PAP_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function pap_selectUltimoAnio() {
    const sel = document.getElementById("pap-select-anio");
    sel.value = sel.options[sel.options.length - 1].value;
    pap_onChangeAnio();
}

/* Cambio de año */
function pap_onChangeAnio() {
    const sel = document.getElementById("pap-select-anio");
    const anio = Number(sel.value);

    const info = PAP_POR_ANIO[anio];
    if (!info) return;

    pap_renderKpis(info);
    pap_renderTablaApoderados(info);
    pap_renderChartApoderados(info);
}

/* KPIs */
function pap_renderKpis(info) {
    const total = info.total;
    const sla = info.cuentaDias ? (info.sumaDias / info.cuentaDias).toFixed(1) : "0";
    const pctVC = total ? ((info.vc / total) * 100).toFixed(1) + "%" : "0%";

    let topAp = "-";
    let max = -Infinity;

    for (const ap in info.apoderados) {
        if (info.apoderados[ap].total > max) {
            max = info.apoderados[ap].total;
            topAp = ap;
        }
    }

    document.getElementById("kpi_total").textContent = total;
    document.getElementById("kpi_sla").textContent = sla;
    document.getElementById("kpi_vc").textContent = pctVC;
    document.getElementById("kpi_apoderado").textContent = topAp;
}

/* Tabla detalle apoderados */
function pap_renderTablaApoderados(info) {
    const tbody = document.querySelector("#pap-tabla-apoderados tbody");
    tbody.innerHTML = "";

    const lista = Object.entries(info.apoderados).map(([nombre, a]) => {
        const pctVC = a.total ? ((a.vc / a.total) * 100).toFixed(1) + "%" : "0%";
        const sla = a.cuentaDias ? (a.sumaDias / a.cuentaDias).toFixed(1) : "0";
        return {
            nombre,
            total: a.total,
            presencial: a.presencial,
            vc: a.vc,
            pctVC,
            sla
        };
    });

    lista.sort((a,b)=>b.total - a.total);

    for (const ap of lista) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${ap.nombre}</td>
            <td>${ap.total}</td>
            <td>${ap.presencial}</td>
            <td>${ap.vc}</td>
            <td>${ap.pctVC}</td>
            <td>${ap.sla}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico ranking apoderados */
function pap_renderChartApoderados(info) {
    const ctx = document.getElementById("pap-chart-apoderados");

    const lista = Object.entries(info.apoderados)
        .map(([nombre, a]) => ({ nombre, total: a.total }))
        .sort((a,b)=>b.total - a.total);

    const labels = lista.map(a => a.nombre);
    const data = lista.map(a => a.total);

    if (PAP_CHART_APODERADOS) PAP_CHART_APODERADOS.destroy();

    PAP_CHART_APODERADOS = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Firmas por apoderado",
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
