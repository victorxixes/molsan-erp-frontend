/* ============================================================
   PANEL APODERADOS — PREMIUM 2027 (MEJORADO + MESES)
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

/* ============================================================
   AGRUPAR POR AÑO → APODERADO → MES
============================================================ */
function pap_groupByAnioApoderado(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const ap = f.apoderado || "Sin apoderado";
        const mes = f.mes || "";

        if (!anio || !mes) continue;

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
                cuentaDias: 0,
                meses: {}   // ← NUEVO
            };
        }

        const a = r.apoderados[ap];

        if (!a.meses[mes]) {
            a.meses[mes] = {
                total: 0,
                vc: 0,
                presencial: 0
            };
        }

        const m = a.meses[mes];

        // Totales globales
        r.total++;
        a.total++;
        m.total++;

        // Tipo firma
        if (f.tipo_firma === "VideoConferencia") {
            r.vc++; a.vc++; m.vc++;
        } else {
            r.presencial++; a.presencial++; m.presencial++;
        }

        // SLA
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

/* ============================================================
   SELECT AÑOS
============================================================ */
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

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function pap_onChangeAnio() {
    const sel = document.getElementById("pap-select-anio");
    const anio = Number(sel.value);

    const info = PAP_POR_ANIO[anio];
    if (!info) return;

    pap_renderKpis(info);
    pap_renderTablaApoderados(info);
    pap_renderChartApoderados(info);
}

/* ============================================================
   KPIs
============================================================ */
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

    document.getElementById("pap-kpi-total").textContent = total;
    document.getElementById("pap-kpi-sla").textContent = sla;
    document.getElementById("pap-kpi-vc").textContent = pctVC;
    document.getElementById("pap-kpi-apoderado").textContent = topAp;
}

/* ============================================================
   TABLA DETALLE APODERADOS (CON MESES)
============================================================ */
function pap_renderTablaApoderados(info) {
    const tbody = document.querySelector("#pap-tabla-apoderados tbody");
    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const lista = Object.entries(info.apoderados).map(([nombre, a]) => {
        const pctVC = a.total ? ((a.vc / a.total) * 100).toFixed(1) + "%" : "0%";
        const sla = a.cuentaDias ? (a.sumaDias / a.cuentaDias).toFixed(1) : "0";

        const meses = mesesOrden.map(m => {
            const mm = a.meses[m];
            return mm ? mm.total : 0;
        });

        return {
            nombre,
            total: a.total,
            presencial: a.presencial,
            vc: a.vc,
            pctVC,
            sla,
            meses
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
            ${ap.meses.map(v => `<td>${v}</td>`).join("")}
        `;

        tbody.appendChild(tr);
    }
}

/* ============================================================
   GRÁFICO RANKING APODERADOS
============================================================ */
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
