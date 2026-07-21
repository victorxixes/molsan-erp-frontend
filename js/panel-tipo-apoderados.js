/* ============================================================
   PANEL APODERADOS — PREMIUM 2027 (FORMATO 2026)
============================================================ */

let PAP_DATOS = [];
let PAP_POR_ANIO = {};

/* ============================================================
   FORMATO MILES — FIX DEFINITIVO
============================================================ */
function formatoMiles(n) {
    if (n === null || n === undefined || n === "") return "-";

    // Elimina TODO lo que no sea dígito
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
   CAMBIO DE AÑO
============================================================ */
function pap_onChangeAnio() {
    const sel = document.getElementById("pap-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PAP_POR_ANIO[anio];
    if (!info) return;

    pap_renderTablaApoderados(info);
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
