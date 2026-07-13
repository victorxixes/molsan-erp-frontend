/* ============================================================
   PANEL APODERADOS — PREMIUM 2027 (VERSIÓN FINAL)
============================================================ */

let PAP_DATOS = [];
let PAP_POR_ANIO = {};
let PAP_CHART_APODERADOS = null;
let PAP_CHART_MENSUAL = null;

/* ============================================================
   INIT (con protección DOM)
============================================================ */
async function initPanelApoderados() {
    console.log("👤 initPanelApoderados() ejecutado");

    if (!document.getElementById("pap-select-anio")) {
        console.warn("⏳ Panel Apoderados aún no está en el DOM. initPanelApoderados() detenido.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PAP_DATOS = datos;

    PAP_POR_ANIO = pap_groupByAnioApoderado(PAP_DATOS);

    pap_fillSelectAnios();
    pap_selectUltimoAnio();
}

/* ============================================================
   AGRUPAR POR AÑO → APODERADO → MES (CORREGIDO)
============================================================ */
function pap_groupByAnioApoderado(datos) {
    const map = {};

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth(); // 0 = enero

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio || isNaN(anio)) continue;

        const ap = f.apoderado || "Sin apoderado";

        const mes = (f.mes || "").toLowerCase().trim();
        const idxMes = mesesValidos.indexOf(mes);
        if (idxMes === -1) continue;

        // ⛔ Si es el año en curso y el mes es posterior al actual → ignorar
        if (anio === currentYear && idxMes > currentMonthIndex) {
            continue;
        }

        if (!map[anio]) {
            map[anio] = {
                total: 0,
                vc: 0,
                presencial: 0,
                sumaDias: 0,
                cuentaDias: 0,
                apoderados: {},
                meses: {}
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
                meses: {}
            };
        }

        const a = r.apoderados[ap];

        if (!a.meses[mes]) {
            a.meses[mes] = { total: 0, vc: 0, presencial: 0 };
        }

        if (!r.meses[mes]) {
            r.meses[mes] = { total: 0, vc: 0, presencial: 0 };
        }

        const mAp = a.meses[mes];
        const mTot = r.meses[mes];

        r.total++;
        a.total++;
        mAp.total++;
        mTot.total++;

        if (f.tipo_firma === "VideoConferencia") {
            r.vc++; a.vc++; mAp.vc++; mTot.vc++;
        } else {
            r.presencial++; a.presencial++; mAp.presencial++; mTot.presencial++;
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

/* ============================================================
   SELECT AÑOS
============================================================ */
function pap_fillSelectAnios() {
    const sel = document.getElementById("pap-select-anio");
    if (!sel) return;

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
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    pap_onChangeAnio();
}

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function pap_onChangeAnio() {
    const sel = document.getElementById("pap-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PAP_POR_ANIO[anio];
    if (!info) return;

    info.anio = anio; // necesario para el gráfico mensual

    pap_renderKpis(info);
    pap_renderTablaApoderados(info);
    pap_renderChartApoderados(info);
    pap_renderChartMensual(info);
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
   TABLA DETALLE APODERADOS
============================================================ */
function pap_renderTablaApoderados(info) {
    const tbody = document.querySelector("#pap-tabla-apoderados tbody");
    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    const lista = Object.entries(info.apoderados).map(([nombre, a]) => {
        const pctPres = a.total ? ((a.presencial / a.total) * 100).toFixed(1) + "%" : "0%";
        const pctVC = a.total ? ((a.vc / a.total) * 100).toFixed(1) + "%" : "0%";
        const sla = a.cuentaDias ? (a.sumaDias / a.cuentaDias).toFixed(1) : "0";

        const meses = mesesOrden.map((m, idx) => {
            if (info.anio === currentYear && idx > currentMonthIndex) return ""; // no mostrar
            const mm = a.meses[m];
            return mm ? mm.total : 0;
        });

        return {
            nombre,
            total: a.total,
            presencial: a.presencial,
            pctPres,
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
            <td>${ap.pctPres}</td>
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
    if (!ctx) return;

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

/* ============================================================
   GRÁFICO MENSUAL GLOBAL (MESES FUTUROS NO SE MUESTRAN)
============================================================ */
function pap_renderChartMensual(info) {
    const ctx = document.getElementById("pap-chart-mensual");
    if (!ctx) return;

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    const meses = [];
    const pres = [];
    const vc = [];

    mesesOrden.forEach((m, idx) => {
        if (info.anio === currentYear && idx > currentMonthIndex) return;

        const mm = info.meses[m] || { presencial: 0, vc: 0 };
        meses.push(m);
        pres.push(mm.presencial);
        vc.push(mm.vc);
    });

    if (PAP_CHART_MENSUAL) PAP_CHART_MENSUAL.destroy();

    PAP_CHART_MENSUAL = new Chart(ctx, {
        type: "line",
        data: {
            labels: meses,
            datasets: [
                {
                    label: "Presencial",
                    data: pres,
                    borderColor: "rgba(150,255,80,1)",
                    backgroundColor: "rgba(150,255,80,0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                },
                {
                    label: "VC",
                    data: vc,
                    borderColor: "rgba(80,200,255,1)",
                    backgroundColor: "rgba(80,200,255,0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                }
            ]
        }
    });
}
