/* ============================================================
   PANEL OFICINAS — GLASS LUXE 2027
============================================================ */

let POF_DATOS = [];
let POF_POR_ANIO = {};
let POF_CHART_OFICINAS = null;
let POF_CHART_MENSUAL_TOP = null;

async function initPanelOficinas() {
    console.log("🏢 initPanelOficinas() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    POF_DATOS = datos;

    // Agrupar por año, oficina y mes
    POF_POR_ANIO = pof_groupByAnioOficinaMes(POF_DATOS);

    // Rellenar selector
    pof_fillSelectAnios();

    // Seleccionar último año
    pof_selectUltimoAnio();
}

/* Agrupar por año, oficina y mes */
function pof_groupByAnioOficinaMes(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio) || 0;
        if (!anio) continue;

        const oficina = f.oficina || "Sin oficina";
        const mes = f.mes || "";

        if (!map[anio]) {
            map[anio] = {
                total: 0,
                sumaDias: 0,
                cuentaDias: 0,
                vc: 0,
                oficinas: {}
            };
        }

        const r = map[anio];

        if (!r.oficinas[oficina]) {
            r.oficinas[oficina] = {
                total: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0,
                mensual: {}
            };
        }

        const o = r.oficinas[oficina];

        r.total++;
        o.total++;

        // VC
        if (f.tipo_firma === "VideoConferencia") {
            r.vc++;
            o.vc++;
        }

        // SLA
        const d = Number(f.dias) || 0;
        if (d > 0) {
            r.sumaDias += d;
            r.cuentaDias++;
            o.sumaDias += d;
            o.cuentaDias++;
        }

        // Mensual por oficina
        if (mes) {
            o.mensual[mes] = (o.mensual[mes] || 0) + 1;
        }
    }

    return map;
}

/* Rellenar selector de años */
function pof_fillSelectAnios() {
    const sel = document.getElementById("pof-select-anio");
    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(POF_POR_ANIO)
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
function pof_selectUltimoAnio() {
    const sel = document.getElementById("pof-select-anio");
    if (!sel || !sel.options.length) return;

    sel.value = sel.options[sel.options.length - 1].value;
    pof_onChangeAnio();
}

/* Cambio de año */
function pof_onChangeAnio() {
    const sel = document.getElementById("pof-select-anio");
    if (!sel) return;

    const anio = Number(sel.value) || 0;
    if (!anio) return;

    const info = POF_POR_ANIO[anio];
    if (!info) return;

    pof_renderKpis(info);
    const topOficina = pof_renderTablaOficinas(info);
    pof_renderChartOficinas(info);
    pof_renderChartMensualTop(info, topOficina);
}

/* KPIs */
function pof_renderKpis(info) {
    const total = info.total;
    const sla = info.cuentaDias ? (info.sumaDias / info.cuentaDias).toFixed(1) : "0";
    const pctVC = total ? ((info.vc / total) * 100).toFixed(1) + "%" : "0%";

    // Oficina más activa
    let topOf = "-";
    let max = -Infinity;
    for (const ofi in info.oficinas) {
        if (info.oficinas[ofi].total > max) {
            max = info.oficinas[ofi].total;
            topOf = ofi;
        }
    }

    document.getElementById("pof-kpi-total").textContent = total;
    document.getElementById("pof-kpi-sla").textContent = sla;
    document.getElementById("pof-kpi-vc").textContent = pctVC;
    document.getElementById("pof-kpi-top-oficina").textContent = topOf;
}

/* Tabla ranking oficinas (devuelve oficina top) */
function pof_renderTablaOficinas(info) {
    const tbody = document.querySelector("#pof-tabla-oficinas tbody");
    if (!tbody) return null;

    tbody.innerHTML = "";

    const lista = Object.entries(info.oficinas).map(([nombre, o]) => {
        const mediaDias = o.cuentaDias ? (o.sumaDias / o.cuentaDias).toFixed(1) : "0";
        const pctVC = o.total ? ((o.vc / o.total) * 100).toFixed(1) + "%" : "0%";
        return {
            nombre,
            total: o.total,
            mediaDias,
            pctVC
        };
    });

    lista.sort((a, b) => b.total - a.total);

    let topOficina = lista.length ? lista[0].nombre : null;

    for (const ofi of lista) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${ofi.nombre}</td>
            <td>${ofi.total}</td>
            <td>${ofi.mediaDias}</td>
            <td>${ofi.pctVC}</td>
        `;
        tbody.appendChild(tr);
    }

    return topOficina;
}

/* Gráfico firmas por oficina */
function pof_renderChartOficinas(info) {
    const ctx = document.getElementById("pof-chart-oficinas");
    if (!ctx) return;

    const labels = [];
    const data = [];

    const lista = Object.entries(info.oficinas)
        .map(([nombre, o]) => ({ nombre, total: o.total }))
        .sort((a, b) => b.total - a.total);

    for (const ofi of lista) {
        labels.push(ofi.nombre);
        data.push(ofi.total);
    }

    if (POF_CHART_OFICINAS) POF_CHART_OFICINAS.destroy();

    POF_CHART_OFICINAS = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Firmas por oficina",
                data,
                backgroundColor: "rgba(80, 200, 255, 0.4)",
                borderColor: "rgba(80, 200, 255, 1)",
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
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

/* Gráfico evolución mensual de la oficina top */
function pof_renderChartMensualTop(info, topOficina) {
    const ctx = document.getElementById("pof-chart-mensual-top");
    if (!ctx || !topOficina) return;

    const ofi = info.oficinas[topOficina];
    if (!ofi) return;

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const labels = [];
    const data = [];

    for (const mes of mesesOrden) {
        const v = ofi.mensual[mes] || 0;
        if (v > 0) {
            labels.push(mes);
            data.push(v);
        }
    }

    if (POF_CHART_MENSUAL_TOP) POF_CHART_MENSUAL_TOP.destroy();

    POF_CHART_MENSUAL_TOP = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: `Evolución mensual — ${topOficina}`,
                data,
                borderColor: "rgba(150, 255, 80, 1)",
                backgroundColor: "rgba(150, 255, 80, 0.2)",
                borderWidth: 1.5,
                tension: 0.2
            }]
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
