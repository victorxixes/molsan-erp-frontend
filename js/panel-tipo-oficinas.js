/* ============================================================
   PANEL OFICINAS — PREMIUM 2027 (FORMATO 7 MESES)
============================================================ */

let POF_DATOS = [];
let POF_POR_ANIO = {};

async function initPanelOficinas() {

    console.log("🏢 initPanelOficinas() ejecutado");

    if (!document.getElementById("pof-select-anio")) return;

    let datos = await obtenerFirmas();
    datos = datos.map(f => aplicarReglas(f));

    POF_DATOS = datos;
    POF_POR_ANIO = pof_groupByAnio(datos);

    pof_fillSelectAnios();
    pof_selectUltimoAnio();

    document.getElementById("pof-select-anio")
        .addEventListener("change", cargarOficinas);

    cargarOficinas();
}

/* ============================================================
   AGRUPAR POR AÑO → OFICINA → MES (solo enero–junio)
============================================================ */
function pof_groupByAnio(datos) {

    const mesesValidos = ["enero","febrero","marzo","abril","mayo","junio"];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        const idxMes = mesesValidos.indexOf(mes);
        if (idxMes === -1) continue;

        const oficina = f.oficina || "Oficina";

        if (!map[anio]) map[anio] = {};

        if (!map[anio][oficina]) {
            map[anio][oficina] = {
                meses: Array(6).fill(0),
                total: 0
            };
        }

        const r = map[anio][oficina];

        r.meses[idxMes]++;
        r.total++;
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
}

/* ============================================================
   THEAD dinámico — Premium 2027 (enero–junio + Total + %mes + %Total)
============================================================ */
function pof_renderThead() {
    const theadRow = document.getElementById("pof-thead-row");
    if (!theadRow) return;

    const meses = ["enero","febrero","marzo","abril","mayo","junio"];

    theadRow.innerHTML = `
        ${meses.map(m => `<th>${m}</th>`).join("")}
        <th>Total</th>
        ${meses.map(m => `<th>%${m}</th>`).join("")}
        <th>%Total</th>
    `;
}

/* ============================================================
   TABLA DETALLE — Premium 2027 (enero–junio + Total + %Mes + %Total)
============================================================ */
function cargarOficinas() {

    const sel = document.getElementById("pof-select-anio");
    if (!sel) return;

    const anioSel = Number(sel.value);
    const info = POF_POR_ANIO[anioSel];
    if (!info) return;

    pof_renderThead();

    const tbody = document.querySelector("#pof-tabla-oficinas tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = ["enero","febrero","marzo","abril","mayo","junio"];

    const lista = Object.entries(info).map(([oficina, r]) => {

        const valoresMes = r.meses;
        const totalVisible = valoresMes.reduce((acc, v) => acc + v, 0);

        const porcentajesMes = valoresMes.map(v => {
            if (totalVisible === 0) return "";
            return ((v / totalVisible) * 100).toFixed(1) + "%";
        });

        return {
            oficina,
            valoresMes,
            totalVisible,
            porcentajesMes
        };
    });

    lista.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.oficina}</td>
            ${row.valoresMes.map(v => `<td>${v}</td>`).join("")}
            <td>${row.totalVisible}</td>
            ${row.porcentajesMes.map(p => `<td>${p}</td>`).join("")}
            <td>100%</td>
        `;

        tbody.appendChild(tr);
    });

    /* ============================================================
       FILA TOTAL
    ============================================================= */
    const totalesMes = mesesOrden.map((_, idx) =>
        lista.reduce((acc, row) => acc + row.valoresMes[idx], 0)
    );

    const totalGeneral = totalesMes.reduce((acc, v) => acc + v, 0);

    const porcentajesTotalesMes = totalesMes.map(v => {
        if (totalGeneral === 0) return "";
        return ((v / totalGeneral) * 100).toFixed(1) + "%";
    });

    const trTotal = document.createElement("tr");
    trTotal.classList.add("fila-sumatorio");

    trTotal.innerHTML = `
        <td><b>TOTAL</b></td>
        ${totalesMes.map(v => `<td><b>${v}</b></td>`).join("")}
        <td><b>${totalGeneral}</b></td>
        ${porcentajesTotalesMes.map(p => `<td><b>${p}</b></td>`).join("")}
        <td><b>100%</b></td>
    `;

    tbody.appendChild(trTotal);
}
