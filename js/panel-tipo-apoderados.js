/* ============================================================
   PANEL APODERADOS — GLASS LUXE 2027
============================================================ */

let PAPO_DATOS = [];
let PAPO_POR_APODERADO = {};
let PAPO_CHARTS = {};

async function initPanelApoderados() {
    console.log("🧑‍💼 initPanelApoderados() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PAPO_DATOS = datos;

    // Agrupar por apoderado
    PAPO_POR_APODERADO = papo_groupByApoderado(PAPO_DATOS);

    // Rellenar selector
    papo_fillSelect();

    // Seleccionar primer apoderado
    papo_onChangeApoderado();
}

/* Agrupar datos por apoderado */
function papo_groupByApoderado(datos) {
    const map = {};

    for (const f of datos) {
        const ap = f.apoderado || "Sin apoderado";

        if (!map[ap]) {
            map[ap] = {
                firmas: [],
                oficinas: {},
                circuitos: {},
                tipoFirma: {},
                tipoGestion: {},
                mensual: {}
            };
        }

        const m = map[ap];

        m.firmas.push(f);

        // Oficina
        m.oficinas[f.oficina] = (m.oficinas[f.oficina] || 0) + 1;

        // Circuito
        m.circuitos[f.circuito] = (m.circuitos[f.circuito] || 0) + 1;

        // Tipo firma
        m.tipoFirma[f.tipo_firma] = (m.tipoFirma[f.tipo_firma] || 0) + 1;

        // Tipo gestión
        m.tipoGestion[f.tipo_gestion] = (m.tipoGestion[f.tipo_gestion] || 0) + 1;

        // Mensual
        const claveMes = `${f.anio}-${f.mes}`;
        m.mensual[claveMes] = (m.mensual[claveMes] || 0) + 1;
    }

    return map;
}

/* Rellenar selector */
function papo_fillSelect() {
    const sel = document.getElementById("pa-select-apoderado");
    sel.innerHTML = "";

    const aps = Object.keys(PAPO_POR_APODERADO).sort();

    for (const ap of aps) {
        const opt = document.createElement("option");
        opt.value = ap;
        opt.textContent = ap;
        sel.appendChild(opt);
    }
}

/* Cambio de apoderado */
function papo_onChangeApoderado() {
    const sel = document.getElementById("pa-select-apoderado");
    const ap = sel.value;

    const info = PAPO_POR_APODERADO[ap];
    if (!info) return;

    papo_renderKpis(ap, info);
    papo_renderCharts(ap, info);
}

/* Render KPIs */
function papo_renderKpis(ap, info) {
    const total = info.firmas.length;

    // SLA
    const dias = info.firmas.map(f => Number(f.dias) || 0).filter(d => d > 0);
    const sla = dias.length ? (dias.reduce((a,b)=>a+b,0) / dias.length).toFixed(1) : "0";

    // VC
    const vc = info.tipoFirma["VideoConferencia"] || 0;
    const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";

    // Con provisión
    const conProv = Object.entries(info.tipoGestion)
        .filter(([k]) => k.toLowerCase().includes("con provisión"))
        .reduce((a, [_, v]) => a + v, 0);

    const pctProv = total ? ((conProv / total) * 100).toFixed(1) + "%" : "0%";

    // Oficina dominante
    const topOf = papo_getTop(info.oficinas);

    // Circuito dominante
    const topCi = papo_getTop(info.circuitos);

    document.getElementById("papo-kpi-total").textContent = total;
    document.getElementById("papo-kpi-sla").textContent = sla;
    document.getElementById("papo-kpi-vc").textContent = pctVC;
    document.getElementById("papo-kpi-prov").textContent = pctProv;
    document.getElementById("papo-kpi-oficina").textContent = topOf;
    document.getElementById("papo-kpi-circuito").textContent = topCi;
}

/* Render charts */
function papo_renderCharts(ap, info) {
    // Destruir charts previos
    for (const k in PAPO_CHARTS) {
        PAPO_CHARTS[k].destroy();
    }

    // Mensual
    PAPO_CHARTS.mensual = papo_chart(
        "papo-chart-mensual",
        "line",
        Object.keys(info.mensual),
        Object.values(info.mensual),
        "Evolución mensual"
    );

    // Tipo firma
    PAPO_CHARTS.tipoFirma = papo_chart(
        "papo-chart-tipo-firma",
        "doughnut",
        Object.keys(info.tipoFirma),
        Object.values(info.tipoFirma),
        "Tipo de firma"
    );

    // Tipo gestión
    PAPO_CHARTS.tipoGestion = papo_chart(
        "papo-chart-tipo-gestion",
        "doughnut",
        Object.keys(info.tipoGestion),
        Object.values(info.tipoGestion),
        "Tipo de gestión"
    );

    // Oficinas
    PAPO_CHARTS.oficinas = papo_chart(
        "papo-chart-oficinas",
        "bar",
        Object.keys(info.oficinas),
        Object.values(info.oficinas),
        "Oficinas"
    );

    // Circuitos
    PAPO_CHARTS.circuitos = papo_chart(
        "papo-chart-circuitos",
        "bar",
        Object.keys(info.circuitos),
        Object.values(info.circuitos),
        "Circuitos"
    );
}

/* Crear chart */
function papo_chart(id, tipo, labels, data, label) {
    const ctx = document.getElementById(id);
    return new Chart(ctx, {
        type: tipo,
        data: {
            labels,
            datasets: [{
                label,
                data,
                backgroundColor: [
                    "rgba(80,200,255,0.4)",
                    "rgba(255,150,80,0.4)",
                    "rgba(150,255,80,0.4)",
                    "rgba(255,80,200,0.4)"
                ],
                borderColor: "rgba(255,255,255,0.8)",
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#fff" } } },
            scales: {
                x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } }
            }
        }
    });
}

/* Obtener clave con mayor valor */
function papo_getTop(obj) {
    let top = "-";
    let max = -Infinity;
    for (const k in obj) {
        if (obj[k] > max) {
            max = obj[k];
            top = k;
        }
    }
    return top;
}
