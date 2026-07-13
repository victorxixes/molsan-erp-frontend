/* ============================================================
   PANEL OFICINAS — PREMIUM 2027 (VERSIÓN FINAL)
============================================================ */

let POF_DATOS = [];
let POF_POR_ANIO = {};
let POF_CHART = null;

/* ============================================================
   INIT
============================================================ */
async function initPanelOficinas() {
    console.log("🏢 initPanelOficinas() ejecutado");

    if (!document.getElementById("pof-select-anio")) {
        console.warn("⏳ Panel Oficinas aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    POF_DATOS = datos;
    POF_POR_ANIO = pof_groupByAnioOficina(POF_DATOS);

    pof_fillSelectAnios();
    pof_selectUltimoAnio();

    document.getElementById("pof-select-anio")
        .addEventListener("change", pof_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → OFICINA → MES
============================================================ */
function pof_groupByAnioOficina(datos) {
    const map = {};

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth(); // 0 = enero

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        const idxMes = mesesValidos.indexOf(mes);

        if (idxMes === -1) continue;

        // ❌ Mes futuro del año en curso → ignorar
        if (anio === currentYear && idxMes > currentMonthIndex) continue;

       // Normalizar oficina de forma robusta
let oficinaRaw = String(f.oficina || "").trim();

// Eliminar todo lo que no sea número (puntos, comas, espacios, decimales)
let oficinaNum = oficinaRaw.replace(/[^0-9]/g, "");

// Asignar centro real
let oficina = (oficinaNum === "5316") ? "Cancela" : "Oficina";

        const dias = Number(f.dias);
        const esVC = (f.tipo_firma === "VideoConferencia");

        if (!map[anio]) map[anio] = {};

        if (!map[anio][oficina]) {
            map[anio][oficina] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0,
                meses: {} // ← aquí guardamos los meses
            };
        }

        const r = map[anio][oficina];

        // Inicializar mes si no existe
        if (!r.meses[mes]) {
            r.meses[mes] = { total: 0, presencial: 0, vc: 0 };
        }

        const m = r.meses[mes];

        // Totales
        r.total++;
        m.total++;

        if (esVC) {
            r.vc++; m.vc++;
        } else {
            r.presencial++; m.presencial++;
        }

        if (dias > 0) {
            r.sumaDias += dias;
            r.cuentaDias++;
        }
    }

    return map;
}

/* ============================================================
   SELECT AÑOS
============================================================ */
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

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
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

/* ============================================================
   KPIs
============================================================ */
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

    document.getElementById("pof-kpi-total").textContent = total;
    document.getElementById("pof-kpi-sla").textContent = sla;
    document.getElementById("pof-kpi-vc").textContent = pctVC;
    document.getElementById("pof-kpi-oficina").textContent = oficinaTop;
}

/* ============================================================
   TABLA DETALLE (CON MESES)
============================================================ */
function pof_renderTabla(info) {
    const tbody = document.querySelector("#pof-tabla-oficinas tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const lista = Object.entries(info).map(([nombre, o]) => {

        const pctPres = o.total ? ((o.presencial / o.total) * 100).toFixed(1) + "%" : "0%";
        const pctVC = o.total ? ((o.vc / o.total) * 100).toFixed(1) + "%" : "0%";
        const sla = o.cuentaDias ? (o.sumaDias / o.cuentaDias).toFixed(1) : "0";

        const meses = mesesOrden.map(m => {
            const mm = o.meses[m];
            return mm ? mm.total : 0;
        });

        return {
            nombre,
            total: o.total,
            presencial: o.presencial,
            pctPres,
            vc: o.vc,
            pctVC,
            sla,
            meses
        };
    });

    lista.sort((a,b)=>b.total - a.total);

    for (const ofi of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${ofi.nombre}</td>
            <td>${ofi.total}</td>
            <td>${ofi.presencial}</td>
            <td>${ofi.pctPres}</td>
            <td>${ofi.vc}</td>
            <td>${ofi.pctVC}</td>
            <td>${ofi.sla}</td>
            ${ofi.meses.map(v => `<td>${v}</td>`).join("")}
        `;

        tbody.appendChild(tr);
    }
}

/* ============================================================
   GRÁFICO
============================================================ */
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

