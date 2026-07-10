/* ============================================================
   PANEL OFICINAS — PREMIUM 2027 (COMPATIBLE CON TU HTML)
============================================================ */

let POF_DATOS = [];
let POF_POR_ANIO = {};
let POF_CHART = null;

/* Helper seguro */
function pofSafeSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.textContent = value;
    return true;
}

async function initPanelOficinas() {
    console.log("🏢 initPanelOficinas() ejecutado");

    // Si el panel no está en el DOM → detener
    if (!document.getElementById("pof-select-anio")) {
        console.warn("⏳ Panel Oficinas aún no está en el DOM. initPanelOficinas() detenido.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    POF_DATOS = datos;
    POF_POR_ANIO = pof_groupByAnioOficina(POF_DATOS);

    pof_fillSelectAnios();
    pof_selectUltimoAnio();

    // Listener del selector de año
    document.getElementById("pof-select-anio")
        .addEventListener("change", pof_onChangeAnio);
}

/* Agrupar por año y oficina */
function pof_groupByAnioOficina(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const oficina = f.oficina || "Sin oficina";
        const dias = Number(f.dias);
        const esVC = (f.tipo_firma === "VideoConferencia");

        if (!anio) continue;

        if (!map[anio]) map[anio] = {};

        if (!map[anio][oficina]) {
            map[anio][oficina] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0
            };
        }

        const r = map[anio][oficina];

        r.total++;

        if (esVC) r.vc++;
        else r.presencial++;

        if (dias > 0) {
            r.sumaDias += dias;
            r.cuentaDias++;
        }
    }

    return map;
}

/* Select años */
function pof_fillSelectAnios() {
    const sel = document.getElementById("pof-select-anio");
    if (!sel) return;

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
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    pof_onChangeAnio();
}

/* Cambio de año */
function pof_onChangeAnio() {
    const sel = document.getElementById("pof-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = POF_POR_ANIO[anio];
    if (!info) return;

    pof_renderKpis(info);
    pof_renderTabla(info);
    pof_renderChart(info);
}

/* KPIs */
function pof_renderKpis(info) {
    let total = 0;
    let vc = 0;
    let sumaDias = 0;
    let cuentaDias = 0;

    let oficinaTop = "-";
    let maxOficina = 0;

    for (const oficina in info) {
        const r = info[oficina];

        total += r.total;
        vc += r.vc;

        sumaDias += r.sumaDias;
        cuentaDias += r.cuentaDias;

        if (r.total > maxOficina) {
            maxOficina = r.total;
            oficinaTop = oficina;
        }
    }

    const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";
    const sla = cuentaDias ? (sumaDias / cuentaDias).toFixed(1) : "0";

    pofSafeSet("pof-kpi-total", total);
    pofSafeSet("pof-kpi-sla", sla);
    pofSafeSet("pof-kpi-vc", pctVC);
    pofSafeSet("pof-kpi-oficina", oficinaTop);
}

/* Tabla por oficina */
function pof_renderTabla(info) {
    const tbody = document.querySelector("#pof-tabla-oficinas tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const lista = Object.entries(info)
        .map(([nombre, o]) => {
            const pctVC = o.total ? ((o.vc / o.total) * 100).toFixed(1) + "%" : "0%";
            const sla = o.cuentaDias ? (o.sumaDias / o.cuentaDias).toFixed(1) : "0";
            return { nombre, total: o.total, presencial: o.presencial, vc: o.vc, pctVC, sla };
        })
        .sort((a,b)=>b.total - a.total);

    for (const ofi of lista) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${ofi.nombre}</td>
            <td>${ofi.total}</td>
            <td>${ofi.presencial}</td>
            <td>${ofi.vc}</td>
            <td>${ofi.pctVC}</td>
            <td>${ofi.sla}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico por oficina */
function pof_renderChart(info) {
    const ctx = document.getElementById("pof-chart-oficinas");
    if (!ctx) return;

    const lista = Object.entries(info)
        .map(([nombre, o]) => ({ nombre, total: o.total }))
        .sort((a,b)=>b.total - a.total);

    const labels = lista.map(o => o.nombre);
    const data = lista.map(o => o.total);

    if (POF_CHART) POF_CHART.destroy();

    POF_CHART = new Chart(ctx, {
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
