/* ============================================================
   PANEL OFICINAS — PREMIUM 2027 (FORMATO 2026)
============================================================ */

let POF_DATOS = [];
let POF_POR_ANIO = {};

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
   AGRUPAR POR AÑO → OFICINA → MESES (FORMATO NUEVO)
============================================================ */
function pof_groupByAnioOficina(datos) {

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio || isNaN(anio)) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        if (!mesesValidos.includes(mes)) continue;

        // Normalizar oficina
        let oficinaRaw = String(f.oficina || "").trim();
        let oficinaNum = oficinaRaw.replace(/[^0-9]/g, "");
        let oficina = (oficinaNum === "5316") ? "Cancela" : "Oficina";

        if (!map[anio]) {
            map[anio] = {
                oficinas: {},
                mesesConDatos: new Set()
            };
        }

        const r = map[anio];

        if (!r.oficinas[oficina]) {
            r.oficinas[oficina] = {
                total: 0,
                meses: {}
            };

            mesesValidos.forEach(m => r.oficinas[oficina].meses[m] = 0);
        }

        const o = r.oficinas[oficina];

        o.total++;
        o.meses[mes]++;

        r.mesesConDatos.add(mes);
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

    info.anio = anio;

    pof_renderTabla(info);
}

/* ============================================================
   TABLA DETALLE OFICINAS — FORMATO NUEVO 2026 + SUMATORIO FINAL
============================================================ */
function pof_renderTabla(info) {
    const tbody = document.querySelector("#pof-tabla-oficinas tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    // 1) Meses con datos reales
    const mesesConDatos = mesesOrden.filter(m =>
        Object.values(info.oficinas).some(o => o.meses[m] > 0)
    );

    // ⭐ Encabezado dinámico
    pof_renderThead(mesesConDatos);

    // 2) Construcción de lista
    const lista = Object.entries(info.oficinas).map(([nombre, o]) => {

        const valoresMes = mesesConDatos.map(m => {
            const idx = mesesOrden.indexOf(m);
            if (info.anio === currentYear && idx > currentMonthIndex) return "";
            return o.meses[m] || 0;
        });

        const totalVisible = valoresMes.reduce((acc, v) => acc + (v || 0), 0);

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
    for (const row of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.nombre}</td>
            ${row.valoresMes.map(v => `<td>${v}</td>`).join("")}
            <td>${row.totalVisible}</td>
            ${row.porcentajesMes.map(p => `<td>${p}</td>`).join("")}
            <td>100%</td>
        `;

        tbody.appendChild(tr);
    }

    // ⭐ 4) SUMATORIO FINAL
    const sumatorioMeses = mesesConDatos.map(m =>
        lista.reduce((acc, row) => acc + (row.valoresMes[mesesConDatos.indexOf(m)] || 0), 0)
    );

    const sumatorioTotal = sumatorioMeses.reduce((acc, v) => acc + v, 0);

    const trSum = document.createElement("tr");
    trSum.classList.add("fila-sumatorio");

    trSum.innerHTML = `
        <td><b>TOTAL</b></td>
        ${sumatorioMeses.map(v => `<td><b>${v}</b></td>`).join("")}
        <td><b>${sumatorioTotal}</b></td>
        ${sumatorioMeses.map(v => {
            if (sumatorioTotal === 0) return "<td></td>";
            return `<td><b>${((v / sumatorioTotal) * 100).toFixed(1)}%</b></td>`;
        }).join("")}
        <td><b>100%</b></td>
    `;

    tbody.appendChild(trSum);
}

/* ============================================================
   THEAD DINÁMICO
============================================================ */
function pof_renderThead(mesesConDatos) {
    const theadRow = document.getElementById("pof-thead-row");
    if (!theadRow) return;

    theadRow.innerHTML = `
        <th>Oficina</th>
        ${mesesConDatos.map(m => `<th>${m}</th>`).join("")}
        <th>Total</th>
        ${mesesConDatos.map(m => `<th>%${m}</th>`).join("")}
        <th>%Total</th>
    `;
}
