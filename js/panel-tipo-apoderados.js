/* ============================================================
   PANEL APODERADOS — PREMIUM 2027 (FORMATO 2026)
============================================================ */

let PAP_DATOS = [];
let PAP_POR_ANIO = {};

let PAP_CHART_RANKING = null;
let PAP_CHART_EVOLUCION = null;

/* ============================================================
   FORMATO MILES — FIX DEFINITIVO
============================================================ */
function formatoMiles(n) {
    if (n === null || n === undefined || n === "") return "-";
    n = String(n).replace(/[^\d]/g, "");
    const num = Number(n);
    if (isNaN(num)) return "-";
    return num.toLocaleString("es-ES");
}

/* ============================================================
   INIT
============================================================ */
async function initPanelApoderados() {
    const sel = document.getElementById("pap-select-anio");
    if (!sel) return;

    let datos = await obtenerFirmas();
    if (!datos.length) return;

    datos.forEach(aplicarReglas);

    PAP_DATOS = datos;
    PAP_POR_ANIO = pap_groupByAnio(PAP_DATOS);

    pap_fillSelectAnios();
    pap_selectUltimoAnio();

    sel.addEventListener("change", pap_onChangeAnio);

    initPanelApoderadosTipoFirma();   // ⭐ CARGA INICIAL DEL ACORDEÓN
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

    pap_renderTablaApoderados(info);
    pap_renderGraficos(info);

    initPanelApoderadosTipoFirma();   // ⭐ ACTUALIZAR ACORDEÓN AL CAMBIAR DE AÑO
}

/* ============================================================
   AGRUPAR POR AÑO → APODERADO → MESES
============================================================ */
function pap_groupByAnio(datos) {
    const meses = MESES_ORDEN;
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        const idxMes = meses.indexOf(mes);
        if (idxMes === -1) continue;

        const apoderado = f.apoderado || "Sin apoderado";

        if (!map[anio]) map[anio] = { apoderados: {} };

        if (!map[anio].apoderados[apoderado]) {
            map[anio].apoderados[apoderado] = {
                total: 0,
                meses: Array(12).fill(0)
            };
        }

        const a = map[anio].apoderados[apoderado];
        a.total++;
        a.meses[idxMes]++;
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
   OBTENER MESES CON DATOS
============================================================ */
function obtenerMesesConDatos(info) {
    const meses = MESES_ORDEN;

    return meses.filter((m, idx) => {
        const totalMes = Object.values(info.apoderados)
            .reduce((acc, a) => acc + Number(a.meses[idx] || 0), 0);

        return totalMes > 0;
    });
}

/* ============================================================
   TABLA DETALLE APODERADOS
============================================================ */
function pap_renderTablaApoderados(info) {
    const tbody = document.querySelector("#pap-tabla-apoderados tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const meses = MESES_ORDEN;
    const mesesValidos = obtenerMesesConDatos(info);

    pap_renderThead(mesesValidos);

    const totalesPorMes = mesesValidos.map(m => {
        const idxReal = meses.indexOf(m);
        return Object.values(info.apoderados)
            .reduce((acc, a) => acc + Number(a.meses[idxReal] || 0), 0);
    });

    const lista = Object.entries(info.apoderados).map(([nombre, a]) => {
        const valoresMes = mesesValidos.map(m => {
            const idxReal = meses.indexOf(m);
            return Number(a.meses[idxReal] || 0);
        });

        const totalVisible = valoresMes.reduce((acc, v) => acc + v, 0);

        const porcentajesMes = valoresMes.map((v, i) => {
            const totalMes = totalesPorMes[i];
            if (totalMes === 0) return "";
            return ((v / totalMes) * 100).toFixed(1) + "%";
        });

        return { nombre, valoresMes, totalVisible, porcentajesMes };
    });

    lista.sort((a,b)=>b.totalVisible - a.totalVisible);

    for (const ap of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${ap.nombre}</td>
            ${ap.valoresMes.map(v => `<td class="num">${formatoMiles(v)}</td>`).join("")}
            <td class="num">${formatoMiles(ap.totalVisible)}</td>
            ${ap.porcentajesMes.map(p => `<td>${p}</td>`).join("")}
            <td>100%</td>
        `;

        tbody.appendChild(tr);
    }

    const sumatorioTotal = totalesPorMes.reduce((acc, v) => acc + v, 0);

    const trSum = document.createElement("tr");
    trSum.classList.add("fila-sumatorio");

    trSum.innerHTML = `
        <td><b>TOTAL</b></td>
        ${totalesPorMes.map(v => `<td class="num"><b>${formatoMiles(v)}</b></td>`).join("")}
        <td class="num"><b>${formatoMiles(sumatorioTotal)}</b></td>
        ${totalesPorMes.map(() => `<td><b>100%</b></td>`).join("")}
        <td><b>100%</b></td>
    `;

    tbody.appendChild(trSum);
}

/* ============================================================
   THEAD DINÁMICO
============================================================ */
function pap_renderThead(mesesValidos) {
    const thead = document.getElementById("pap-thead");
    if (!thead) return;

    const fila1 = `
        <tr>
            <th rowspan="2">Apoderado</th>
            <th colspan="${mesesValidos.length + 1}" class="th-group">Firmas realizadas</th>
            <th colspan="${mesesValidos.length + 1}" class="th-group">% Firmas realizadas</th>
        </tr>
    `;

    const fila2 = `
        <tr>
            ${mesesValidos.map(m => `<th>${m}</th>`).join("")}
            <th>Total</th>
            ${mesesValidos.map(m => `<th>%${m}</th>`).join("")}
            <th>%Total</th>
        </tr>
    `;

    thead.innerHTML = fila1 + fila2;
}

/* ============================================================
   GRÁFICOS PREMIUM 2027
============================================================ */
function pap_renderGraficos(info) {

    const meses = MESES_ORDEN;
    const mesesValidos = obtenerMesesConDatos(info);

    /* ============================
       1) Ranking de Apoderados
    ============================ */

    const lista = Object.entries(info.apoderados).map(([nombre, a]) => {
        const valoresMes = mesesValidos.map(m => {
            const idxReal = meses.indexOf(m);
            return Number(a.meses[idxReal] || 0);
        });
        return {
            nombre,
            totalVisible: valoresMes.reduce((acc, v) => acc + v, 0),
            valoresMes
        };
    }).sort((a,b)=>b.totalVisible - a.totalVisible);

    const labelsRanking = lista.map(o => o.nombre);
    const dataRanking = lista.map(o => o.totalVisible);

    const ctxRanking = document.getElementById("pap-chart-ranking");

    if (PAP_CHART_RANKING) PAP_CHART_RANKING.destroy();

    PAP_CHART_RANKING = new Chart(ctxRanking, {
        type: "bar",
        data: {
            labels: labelsRanking,
            datasets: [{
                label: "Total firmas",
                data: dataRanking,
                backgroundColor: "rgba(80, 200, 255, 0.5)",
                borderColor: "rgba(80, 200, 255, 1)",
                borderWidth: 1.5
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });

    /* ============================
       2) Evolución mensual del total
    ============================ */

    const totalesMes = mesesValidos.map(m => {
        const idxReal = meses.indexOf(m);
        return lista.reduce((acc, row) => acc + row.valoresMes[idxReal], 0);
    });

    const ctxEvo = document.getElementById("pap-chart-evolucion");

    if (PAP_CHART_EVOLUCION) PAP_CHART_EVOLUCION.destroy();

    PAP_CHART_EVOLUCION = new Chart(ctxEvo, {
        type: "line",
        data: {
            labels: mesesValidos,
            datasets: [{
                label: "Total mensual",
                data: totalesMes,
                borderColor: "rgba(255, 120, 80, 1)",
                backgroundColor: "rgba(255, 120, 80, 0.3)",
                borderWidth: 2,
                tension: 0.3
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
   PANEL APODERADOS — ACORDEÓN POR TIPO DE FIRMA (MESES DINÁMICOS)
============================================================ */

async function initPanelApoderadosTipoFirma() {
    console.log("🧑‍⚖️ initPanelApoderadosTipoFirma() ejecutado");

    const tabla = document.getElementById("apo-tabla-tipo-firma");
    if (!tabla) return;

    const thead = tabla.querySelector("thead");
    const tbody = tabla.querySelector("tbody");
    if (!thead || !tbody) return;

    // ⭐ CABECERA DINÁMICA CORRECTA
    thead.innerHTML = `
        <tr>
            <th>Apoderado</th>
            <th>enero</th>
            <th>febrero</th>
            <th>marzo</th>
            <th>abril</th>
            <th>mayo</th>
            <th>junio</th>
            <th>Total</th>
            <th>%enero</th>
            <th>%febrero</th>
            <th>%marzo</th>
            <th>%abril</th>
            <th>%mayo</th>
            <th>%junio</th>
            <th>%Total</th>
        </tr>
    `;

    let datos = await obtenerFirmas();
    datos = datos.map(f => aplicarReglas(f));

    // ⭐ AÑO SELECCIONADO
    const sel = document.getElementById("pap-select-anio");
    const anioSeleccionado = Number(sel.value);

    // ⭐ MESES SOLO DEL AÑO SELECCIONADO
    const mesesValidos = obtenerMesesConDatos(PAP_POR_ANIO[anioSeleccionado]);

    // Agrupar por apoderado → tipoFirma → meses válidos
    const map = {};

    for (const f of datos) {
        const apoderado = (f.apoderado || "").trim();
        if (!apoderado) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        const idxMesReal = MESES_ORDEN.indexOf(mes);
        if (idxMesReal === -1) continue;

        const idxMes = mesesValidos.indexOf(mes);
        if (idxMes === -1) continue;

        const tipo = (f.tipo_firma || f.tipoFirma || "").trim();
        let tipoFirma = "Otros";

        if (/presencial/i.test(tipo)) tipoFirma = "Presencial";
        else if (/video/i.test(tipo)) tipoFirma = "VideoConferencia";

        if (!map[apoderado]) map[apoderado] = {
            totalMeses: Array(mesesValidos.length).fill(0),
            tipos: {
                Presencial: Array(mesesValidos.length).fill(0),
                VideoConferencia: Array(mesesValidos.length).fill(0),
                Otros: Array(mesesValidos.length).fill(0)
            }
        };

        map[apoderado].totalMeses[idxMes]++;
        map[apoderado].tipos[tipoFirma][idxMes]++;
    }

    // Construir lista ordenada por total
    const lista = Object.entries(map).map(([nombre, info]) => {
        const total = info.totalMeses.reduce((a,b)=>a+b,0);
        const pctMes = info.totalMeses.map(v => {
            if (!total) return "";
            return ((v / total) * 100).toFixed(1) + "%";
        });
        return { nombre, info, total, pctMes };
    }).sort((a,b)=>b.total - a.total);

    tbody.innerHTML = "";

    for (const row of lista) {
        const idRow = "apo-" + row.nombre.replace(/\s+/g,"-").toLowerCase();

        // Fila principal
        const trMain = document.createElement("tr");
        trMain.classList.add("apo-row-main");
        trMain.dataset.apoId = idRow;

        trMain.innerHTML = `
            <td class="center apo-toggle" style="cursor:pointer;">
                ▶ ${row.nombre}
            </td>
            ${row.info.totalMeses.map(v => `<td class="center">${v}</td>`).join("")}
            <td class="center">${row.total}</td>
            ${row.pctMes.map(p => `<td class="center">${p}</td>`).join("")}
            <td class="center">100%</td>
        `;

        // Fila detalle (acordeón)
        const trDetail = document.createElement("tr");
        trDetail.classList.add("apo-row-detail");
        trDetail.dataset.apoId = idRow;
        trDetail.style.display = "none";

        const detalleHTML = renderDetalleTipos(row.info, row.total, mesesValidos);

        trDetail.innerHTML = `
            <td colspan="${1 + mesesValidos.length + mesesValidos.length + 2}">
                ${detalleHTML}
            </td>
        `;

        tbody.appendChild(trMain);
        tbody.appendChild(trDetail);
    }

    // Evento acordeón (corregido)
    tbody.onclick = (ev) => {
        const tr = ev.target.closest(".apo-row-main");
        if (!tr) return;

        const id = tr.dataset.apoId;
        const detail = tbody.querySelector(`.apo-row-detail[data-apo-id="${id}"]`);
        if (!detail) return;

        const toggleCell = tr.querySelector(".apo-toggle");
        const isHidden = detail.style.display === "none";

        detail.style.display = isHidden ? "table-row" : "none";
        if (toggleCell) {
            toggleCell.textContent = (isHidden ? "▼ " : "▶ ") + toggleCell.textContent.replace(/^.[ ]/, "");
        }
    };
}

/* ============================================================
   RENDER DETALLE TIPOS DE FIRMA (Presencial / VC)
============================================================ */
function renderDetalleTipos(info, totalApoderado, mesesValidos) {

    const tipos = ["Presencial","VideoConferencia"];
    const rows = [];

    for (const tipo of tipos) {
        const valores = info.tipos[tipo];
        const totalTipo = valores.reduce((a,b)=>a+b,0);
        const pctTipo = totalApoderado ? ((totalTipo / totalApoderado) * 100).toFixed(1) + "%" : "";

        rows.push(`
            <tr>
                <td class="center"><b>${tipo}</b></td>
                ${mesesValidos.map((m, idx) => `<td class="center">${valores[idx]}</td>`).join("")}
                <td class="center"><b>${totalTipo}</b></td>
                <td class="center"><b>${pctTipo}</b></td>
            </tr>
        `);
    }

    return `
        <div class="card-glass mt-10">
            <div><b>Detalle por tipo de firma</b></div>
            <table class="table-premium tabla-excel mt-10">
                <thead>
                    <tr>
                        <th>Tipo firma</th>
                        ${mesesValidos.map(m => `<th class="center">${m}</th>`).join("")}
                        <th>Total</th>
                        <th>% sobre apoderado</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.join("")}
                </tbody>
            </table>
        </div>
    `;
}
