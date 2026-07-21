/* ============================================================
   PANEL APODERADOS — PREMIUM 2027 (FORMATO 2026)
============================================================ */

let PAP_DATOS = [];
let PAP_POR_ANIO = {};

/* ============================================================
   FORMATO MILES
============================================================ */
function formatoMiles(n) {
    if (n === null || n === undefined || n === "") return "-";

    if (typeof n === "string") {
        n = n.replace(/\./g, "");
        n = n.replace(/,/g, "");
        n = n.trim();
    }

    return Number(n).toLocaleString("es-ES");
}

/* ============================================================
   INIT
============================================================ */
async function initPanelApoderados() {
    const sel = document.getElementById("pap-select-anio");
    if (!sel) return;

    const datos = await obtenerFirmas();
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

    const mesesValidos = MESES_ORDEN;

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        if (!mesesValidos.includes(mes)) continue;

        const apoderado = f.apoderado || "Sin apoderado";

        if (!map[anio]) {
            map[anio] = {
                apoderados: {},
                mesesConDatos: new Set()
            };
        }

        const r = map[anio];

        if (!r.apoderados[apoderado]) {
            r.apoderados[apoderado] = {
                total: 0,
                meses: Array(12).fill(0)
            };
        }

        const a = r.apoderados[apoderado];

        a.total++;
        const idx = mesesValidos.indexOf(mes);
        if (idx >= 0) a.meses[idx]++;

        r.mesesConDatos.add(mes);
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
    if (!sel) return;

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

    info.anio = anio;

    pap_renderTablaApoderados(info);
}

/* ============================================================
   TABLA DETALLE APODERADOS — FORMATO 2026
============================================================ */
function pap_renderTablaApoderados(info) {
    const tbody = document.querySelector("#pap-tabla-apoderados tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const meses = MESES_ORDEN;
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    let mesesValidos;

    /* ============================================================
       1) MESES CORRECTOS (SOLUCIÓN DEFINITIVA)
    ============================================================= */

    if (info.anio === currentYear) {
        // Año actual → solo hasta el mes actual
        mesesValidos = meses.slice(0, currentMonthIndex + 1);
    } else {
        // Años cerrados → SIEMPRE 12 meses
        mesesValidos = [...meses];
    }

    /* ============================================================
       THEAD DINÁMICO
    ============================================================= */
    pap_renderThead(mesesValidos);

    /* ============================================================
       2) Totales por mes
    ============================================================= */
    const totalesPorMes = mesesValidos.map(m =>
        Object.values(info.apoderados).reduce((acc, a) => {
            const idx = meses.indexOf(m);
            return acc + Number(a.meses[idx] || 0);
        }, 0)
    );

    /* ============================================================
       3) Construcción de lista por apoderado
    ============================================================= */
    const lista = Object.entries(info.apoderados).map(([nombre, a]) => {

        const valoresMes = mesesValidos.map(m => {
            const idx = meses.indexOf(m);
            return Number(a.meses[idx] || 0);
        });

        const totalVisible = valoresMes.reduce((acc, v) => acc + v, 0);

        const porcentajesMes = valoresMes.map((v, i) => {
            const totalMes = totalesPorMes[i];
            if (totalMes === 0) return "";
            return ((v / totalMes) * 100).toFixed(1) + "%";
        });

        return {
            nombre,
            valoresMes,
            totalVisible,
            porcentajesMes
        };
    });

    lista.sort((a,b)=>b.totalVisible - a.totalVisible);

    /* ============================================================
       5) Pintar filas
    ============================================================= */
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

    /* ============================================================
       6) SUMATORIO FINAL
    ============================================================= */
    const sumatorioTotal = totalesPorMes.reduce((a,b)=>a+b,0);

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
   THEAD DINÁMICO — DOS FILAS
============================================================ */
function pap_renderThead(mesesValidos) {
    const theadRow = document.getElementById("pap-thead-row");
    if (!theadRow) return;

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

    theadRow.parentElement.innerHTML = fila1 + fila2;
}
