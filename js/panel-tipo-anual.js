/* ============================================================
   PANEL ANUAL — GLASS LUXE 2027
============================================================ */

let PA_DATOS = [];
let PA_RESUMEN_ANUAL = {};
let PA_CHART_ANUAL = null;

/* Inicializar Panel Anual (llámalo cuando cargues el módulo) */
async function initPanelAnual() {
    console.log("📈 initPanelAnual() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PA_DATOS = datos;

    // Construir resumen por año
    PA_RESUMEN_ANUAL = pa_buildResumenAnual(PA_DATOS);

    // Rellenar selector de años
    pa_fillSelectAnios();

    // Render tabla anual
    pa_renderTablaAnual();

    // Crear gráfico
    pa_renderChartAnual();

    // Seleccionar último año por defecto
    pa_selectUltimoAnio();
}

/* Construir resumen por año */
function pa_buildResumenAnual(datos) {
    const resumen = {};

    for (const f of datos) {
        const anio = Number(f.anio) || 0;
        if (!anio) continue;

        if (!resumen[anio]) {
            resumen[anio] = {
                anio,
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0,
                apoderados: {},
                oficinas: {},
                circuitos: {},
                tiposGestion: {}
            };
        }

        const r = resumen[anio];

        r.total++;

        // Tipo firma
        if (f.tipo_firma === "VideoConferencia") r.vc++;
        else r.presencial++;

        // SLA
        const d = Number(f.dias) || 0;
        if (d > 0) {
            r.sumaDias += d;
            r.cuentaDias++;
        }

        // Apoderados
        const ap = f.apoderado || "Sin apoderado";
        if (!r.apoderados[ap]) {
            r.apoderados[ap] = {
                firmas: 0,
                sumaDias: 0,
                cuentaDias: 0,
                vc: 0,
                conProvision: 0,
                totalGestion: 0
            };
        }
        const ra = r.apoderados[ap];
        ra.firmas++;
        if (d > 0) {
            ra.sumaDias += d;
            ra.cuentaDias++;
        }
        if (f.tipo_firma === "VideoConferencia") ra.vc++;

        // Tipo gestión
        const tg = f.tipo_gestion || "";
        if (tg) {
            ra.totalGestion++;
            if (tg.toLowerCase().includes("con provisión")) {
                ra.conProvision++;
            }
        }

        // Oficinas
        const of = f.oficina || "Sin oficina";
        r.oficinas[of] = (r.oficinas[of] || 0) + 1;

        // Circuitos
        const ci = f.circuito || "Sin circuito";
        r.circuitos[ci] = (r.circuitos[ci] || 0) + 1;

        // Tipos de gestión
        const tg2 = f.tipo_gestion || "Sin tipo";
        r.tiposGestion[tg2] = (r.tiposGestion[tg2] || 0) + 1;
    }

    return resumen;
}

/* Rellenar selector de años */
function pa_fillSelectAnios() {
    const sel = document.getElementById("pa-select-anio");
    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(PA_RESUMEN_ANUAL)
        .map(a => Number(a))
        .sort((a, b) => a - b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

/* Seleccionar último año y refrescar KPIs + ranking */
function pa_selectUltimoAnio() {
    const sel = document.getElementById("pa-select-anio");
    if (!sel || !sel.options.length) return;

    sel.value = sel.options[sel.options.length - 1].value;
    pa_onChangeAnio();
}

/* Cambio de año en selector */
function pa_onChangeAnio() {
    const sel = document.getElementById("pa-select-anio");
    if (!sel) return;

    const anio = Number(sel.value) || 0;
    if (!anio) return;

    pa_renderKpisAnio(anio);
    pa_renderRankingApoderados(anio);
}

/* Render tabla resumen anual */
function pa_renderTablaAnual() {
    const tbody = document.querySelector("#pa-tabla-anual tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const anios = Object.keys(PA_RESUMEN_ANUAL)
        .map(a => Number(a))
        .sort((a, b) => a - b);

    for (let i = 0; i < anios.length; i++) {
        const anio = anios[i];
        const r = PA_RESUMEN_ANUAL[anio];

        const total = r.total;
        const vc = r.vc;
        const presencial = r.presencial;
        const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";
        const mediaDias = r.cuentaDias ? (r.sumaDias / r.cuentaDias).toFixed(1) : "0";

        // Variación %
        let varPct = "-";
        if (i > 0) {
            const prev = PA_RESUMEN_ANUAL[anios[i - 1]].total || 0;
            if (prev > 0) {
                varPct = (((total - prev) / prev) * 100).toFixed(1) + "%";
            }
        }

        // Top apoderado
        const topAp = pa_getTopKey(r.apoderados, "firmas") || "-";

        // Top oficina
        const topOf = pa_getTopKey(r.oficinas) || "-";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${anio}</td>
            <td>${total}</td>
            <td>${presencial}</td>
            <td>${vc}</td>
            <td>${pctVC}</td>
            <td>${mediaDias}</td>
            <td>${varPct}</td>
            <td>${topAp}</td>
            <td>${topOf}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Render gráfico anual */
function pa_renderChartAnual() {
    const ctx = document.getElementById("pa-chart-anual");
    if (!ctx) return;

    const anios = Object.keys(PA_RESUMEN_ANUAL)
        .map(a => Number(a))
        .sort((a, b) => a - b);

    const datos = anios.map(a => PA_RESUMEN_ANUAL[a].total);

    if (PA_CHART_ANUAL) {
        PA_CHART_ANUAL.destroy();
    }

    PA_CHART_ANUAL = new Chart(ctx, {
        type: "bar",
        data: {
            labels: anios,
            datasets: [{
                label: "Firmas por año",
                data: datos,
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

/* Render KPIs del año seleccionado */
function pa_renderKpisAnio(anio) {
    const r = PA_RESUMEN_ANUAL[anio];
    if (!r) return;

    const anios = Object.keys(PA_RESUMEN_ANUAL)
        .map(a => Number(a))
        .sort((a, b) => a - b);

    const idx = anios.indexOf(anio);
    const total = r.total;
    const vc = r.vc;
    const presencial = r.presencial;
    const pctVC = total ? ((vc / total) * 100).toFixed(1) : 0;
    const pctPres = total ? ((presencial / total) * 100).toFixed(1) : 0;
    const mediaDias = r.cuentaDias ? (r.sumaDias / r.cuentaDias).toFixed(1) : "0";

    let varPct = "0%";
    if (idx > 0) {
        const prev = PA_RESUMEN_ANUAL[anios[idx - 1]].total || 0;
        if (prev > 0) {
            varPct = (((total - prev) / prev) * 100).toFixed(1) + "%";
        }
    }

    const topAp = pa_getTopKey(r.apoderados, "firmas") || "-";
    const topOf = pa_getTopKey(r.oficinas) || "-";
    const topCi = pa_getTopKey(r.circuitos) || "-";
    const topTg = pa_getTopKey(r.tiposGestion) || "-";

    document.getElementById("pa-kpi-total").textContent = total;
    document.getElementById("pa-kpi-var").textContent = varPct;
    document.getElementById("pa-kpi-sla").textContent = mediaDias;
    document.getElementById("pa-kpi-vc").textContent = `${pctVC}% / ${pctPres}%`;
    document.getElementById("pa-kpi-top-apoderado").textContent = topAp;
    document.getElementById("pa-kpi-top-oficina").textContent = topOf;
    document.getElementById("pa-kpi-top-circuito").textContent = topCi;
    document.getElementById("pa-kpi-top-gestion").textContent = topTg;
}

/* Render ranking de apoderados del año */
function pa_renderRankingApoderados(anio) {
    const tbody = document.querySelector("#pa-tabla-apoderados tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const r = PA_RESUMEN_ANUAL[anio];
    if (!r) return;

    const lista = Object.entries(r.apoderados).map(([nombre, info]) => {
        const mediaDias = info.cuentaDias ? (info.sumaDias / info.cuentaDias).toFixed(1) : "0";
        const pctVC = info.firmas ? ((info.vc / info.firmas) * 100).toFixed(1) + "%" : "0%";
        const pctConProv = info.totalGestion ? ((info.conProvision / info.totalGestion) * 100).toFixed(1) + "%" : "0%";

        return {
            nombre,
            firmas: info.firmas,
            mediaDias,
            pctVC,
            pctConProv
        };
    });

    lista.sort((a, b) => b.firmas - a.firmas);

    for (const ap of lista) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${ap.nombre}</td>
            <td>${ap.firmas}</td>
            <td>${ap.mediaDias}</td>
            <td>${ap.pctVC}</td>
            <td>${ap.pctConProv}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Utilidad: obtener clave con máximo valor */
function pa_getTopKey(obj, campo) {
    let topKey = null;
    let topVal = -Infinity;

    for (const k in obj) {
        const v = (campo && typeof obj[k] === "object") ? (obj[k][campo] || 0) : (obj[k] || 0);
        if (v > topVal) {
            topVal = v;
            topKey = k;
        }
    }

    return topKey;
}
