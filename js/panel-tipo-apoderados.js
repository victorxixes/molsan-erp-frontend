/* ============================================================
   PANEL APODERADOS — PREMIUM 2027 (ADAPTADO FORMATO 2026)
============================================================ */

let PAP_DATOS = [];
let PAP_POR_ANIO = {};

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

    info.anio = anio;

    pap_renderTablaApoderados(info);
}
/* ============================================================
   AGRUPAR POR AÑO → APODERADO → MESES (FORMATO NUEVO)
============================================================ */
function pap_groupByAnioApoderado(datos) {

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio || isNaN(anio)) continue;

        const ap = f.apoderado || "Sin apoderado";

        const mes = (f.mes || "").toLowerCase().trim();
        if (!mesesValidos.includes(mes)) continue;

        if (!map[anio]) {
            map[anio] = {
                apoderados: {},
                mesesConDatos: new Set()
            };
        }

        const r = map[anio];

        if (!r.apoderados[ap]) {
            r.apoderados[ap] = {
                total: 0,
                meses: {}
            };

            mesesValidos.forEach(m => r.apoderados[ap].meses[m] = 0);
        }

        const a = r.apoderados[ap];

        a.total++;
        a.meses[mes]++;

        r.mesesConDatos.add(mes);
    }

    return map;
}
/* ============================================================
   TABLA DETALLE APODERADOS — FORMATO NUEVO 2026
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

    // 1) Meses con datos reales
    const mesesConDatos = mesesOrden.filter(m =>
        Object.values(info.apoderados).some(a => a.meses[m] > 0)
    );

    // 2) Construcción de lista
    const lista = Object.entries(info.apoderados).map(([nombre, a]) => {

        const valoresMes = mesesConDatos.map(m => {
            const idx = mesesOrden.indexOf(m);
            if (info.anio === currentYear && idx > currentMonthIndex) return "";
            return a.meses[m] || 0;
        });

        // TOTAL SOLO DE LOS MESES VISIBLES
        const totalVisible = valoresMes.reduce((acc, v) => acc + (v || 0), 0);

        // PORCENTAJES SOLO DE LOS MESES VISIBLES
        const porcentajesMes = valoresMes.map(v => {
            if (v === "" || totalVisible === 0) return "";
            return ((v / totalVisible) * 100).toFixed(1) + "%";
        });

        return {
            nombre,
            valoresMes,
            totalVisible,
            porcentajesMes
        };
    });

    lista.sort((a,b)=>b.totalVisible - a.totalVisible);

    // 3) Pintar filas
    for (const ap of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${ap.nombre}</td>
            ${ap.valoresMes.map(v => `<td>${v}</td>`).join("")}
            <td>${ap.totalVisible}</td>
            ${ap.porcentajesMes.map(p => `<td>${p}</td>`).join("")}
            <td>100%</td>
        `;

        tbody.appendChild(tr);
    }
}
function pap_renderThead(mesesConDatos) {
    const theadRow = document.getElementById("pap-thead-row");
    if (!theadRow) return;

    theadRow.innerHTML = `
        <th>Apoderado</th>
        ${mesesConDatos.map(m => `<th>${m}</th>`).join("")}
        <th>Total</th>
        ${mesesConDatos.map(m => `<th>%${m}</th>`).join("")}
        <th>%Total</th>
    `;
}
