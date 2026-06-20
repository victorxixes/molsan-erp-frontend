/* ============================================================
   PANEL OFICINAS — PREMIUM 2027 (CORREGIDO)
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

    POF_POR_ANIO = pof_groupByAnioOficinaMes(POF_DATOS);

    pof_fillSelectAnios();
    pof_selectUltimoAnio();
}

/* Agrupar por año, oficina y mes */
function pof_groupByAnioOficinaMes(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const oficina = f.oficina || "Sin oficina";
        const mes = f.mes;

        if (!anio || !mes) continue;

        if (!map[anio]) {
            map[anio] = {
                total: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0,
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

        if (f.tipo_firma === "VideoConferencia") {
            r.vc++;
            o.vc++;
        }

        const d = Number(f.dias);
        if (d > 0) {
            r.sumaDias += d;
            r.cuentaDias++;
            o.sumaDias += d;
            o.cuentaDias++;
        }

        o.mensual[mes] = (o.mensual[mes] || 0) + 1;
    }

    return map;
}

/* Select años */
function pof_fillSelectAnios() {
    const sel = document.getElementById("pof-select-anio");
    sel.innerHTML = "";

    const anios = Object.keys(POF_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function pof_selectUltimoAnio() {
    const sel = document.getElementById("pof-select-anio");
    sel.value = sel.options[sel.options.length - 1].value;
    pof_onChangeAnio();
}

/* Cambio de año */
function pof_onChangeAnio() {
    const sel = document.getElementById("pof-select-anio");
    const anio = Number(sel.value);

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

    let topOf = "-";
    let max = -Infinity;

    for (const ofi in info.oficinas) {
        if (info.oficinas[ofi].total > max) {
            max = info.oficinas[ofi].total;
            topOf = ofi;
        }
    }

    // 🔥 IDS CORREGIDOS
    document.getElementById("pof-kpi-total").textContent = total;
    document.getElementById("pof-kpi-sla").textContent = sla;
    document.getElementById("pof-kpi-vc").textContent = pctVC;
    document.getElementById("pof-kpi-oficina").textContent = topOf;
}

/* Tabla oficinas */
function pof_renderTablaOficinas(info) {
    const tbody = document.querySelector("#pof-tabla-oficinas tbody");
    tbody.innerHTML = "";

    const lista = Object.entries(info.oficinas).map(([nombre, o]) => {
        const pctVC = o.total ? ((o.vc / o.total) * 100).toFixed(1) + "%" : "0%";
        const sla = o.cuentaDias ? (o.sumaDias / o.cuentaDias).toFixed(1) : "0";
        return { nombre, total: o.total, pctVC, sla };
    });

    lista.sort((a,b)=>b.total - a.total);

    for (const ofi of lista) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${ofi.nombre}</td>
            <td>${ofi.total}</td>
            <td>${ofi.sla}</td>
            <td>${ofi.pctVC}</td>
        `;
        tbody.appendChild(tr);
    }

    return lista.length ? lista[0].nombre : null;
}

/* Gráfico ranking oficinas */
function pof_renderChartOficinas(info) {
    const ctx = document.getElementById("pof-chart-oficinas");

    const lista = Object.entries(info.oficinas)
        .map(([nombre, o]) => ({ nombre, total: o.total }))
        .sort((a,b)=>b.total - a.total);

    const labels = lista.map(o => o.nombre);
    const data = lista.map(o => o.total);

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
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* Gráfico evolución mensual oficina top */
function pof_renderChartMensualTop(info, topOficina) {
    const ctx = document.getElementById("pof-chart-mensual-top");
    if (!topOficina) return;

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
        labels.push(mes);
        data.push(v);
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
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}
