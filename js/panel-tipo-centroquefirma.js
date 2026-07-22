/* ============================================================
   PANEL CENTRO QUE FIRMA — PREMIUM 2027 (FORMATO 7 MESES)
============================================================ */

let chartCentroFirma = null;
let PCF_DATOS = [];
let PCF_POR_ANIO = {};

/* ============================================================
   Inicialización del panel
============================================================ */
async function initPanelTipoCentroQueFirma() {

    console.log("🏛️ initPanelTipoCentroQueFirma() ejecutado");

    if (!document.getElementById("pcf-select-anio")) {
        console.warn("⏳ Panel Centro que Firma aún no está en el DOM.");
        return;
    }

    let datos = await obtenerFirmas();
    datos = datos.map(f => aplicarReglas(f));

    if (!datos || !datos.length) return;

    PCF_DATOS = datos;
    PCF_POR_ANIO = pcf_groupByAnio(PCF_DATOS);

    pcf_fillSelectAnios();
    pcf_selectUltimoAnio();

    document.getElementById("pcf-select-anio")
        .addEventListener("change", cargarCentroQueFirma);

    await cargarCentroQueFirma();
}

/* ============================================================
   AGRUPAR POR AÑO → CENTRO QUE FIRMA → MES (solo enero–junio)
============================================================ */
function pcf_groupByAnio(datos) {

    const mesesValidos = ["enero","febrero","marzo","abril","mayo","junio"];

    const COLABORADORES = [
        "gestcanarias","gestoria mas","yarza gestion",
        "julio cuesta","castillo 11","gesgalicia"
    ];

    const centros = ["Molsan", "Colaboradores", "Oficina OE", "Oficina CBK"];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = String(f.mes || "").toLowerCase().trim();
        const idxMes = mesesValidos.indexOf(mes);
        if (idxMes === -1) continue;

        const ap = (f.apoderado || "").trim().toLowerCase();

        let centro = "Molsan";
        if (ap === "oficina caixabank") centro = "Oficina CBK";
        else if (ap === "oficina otra entidad") centro = "Oficina OE";
        else if (COLABORADORES.includes(ap)) centro = "Colaboradores";

        if (!map[anio]) map[anio] = {};

        if (!map[anio][centro]) {
            map[anio][centro] = {
                meses: Array(6).fill(0),
                total: 0
            };
        }

        const r = map[anio][centro];

        r.meses[idxMes]++;
        r.total++;
    }

    return map;
}

/* ============================================================
   SELECT AÑOS
============================================================ */
function pcf_fillSelectAnios() {
    const sel = document.getElementById("pcf-select-anio");
    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(PCF_POR_ANIO)
        .map(Number)
        .sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function pcf_selectUltimoAnio() {
    const sel = document.getElementById("pcf-select-anio");
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
}

/* ============================================================
   THEAD DINÁMICO — Premium 2027 (enero–junio + Total + %mes + %Total)
============================================================ */
function pcf_renderThead() {
    const theadRow = document.getElementById("pcf-thead-row");
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
   Cargar datos y generar informe
============================================================ */
async function cargarCentroQueFirma() {

    const sel = document.getElementById("pcf-select-anio");
    if (!sel) return;

    const anioSel = Number(sel.value);

    const datos = PCF_DATOS.filter(f => Number(f.anio) === anioSel);

    const COLABORADORES = [
        "gestcanarias","gestoria mas","yarza gestion",
        "julio cuesta","castillo 11","gesgalicia"
    ];

    const centros = ["Molsan", "Colaboradores", "Oficina OE", "Oficina CBK"];

    const mapa = {};
    centros.forEach(c => {
        mapa[c] = {
            meses: Array(6).fill(0),
            total: 0
        };
    });

    datos.forEach(f => {

        const ap = (f.apoderado || "").trim().toLowerCase();
        const mesNombre = String(f.mes || "").toLowerCase().trim();
        const mesIdx = ["enero","febrero","marzo","abril","mayo","junio"].indexOf(mesNombre);

        let centro = "Molsan";
        if (ap === "oficina caixabank") centro = "Oficina CBK";
        else if (ap === "oficina otra entidad") centro = "Oficina OE";
        else if (COLABORADORES.includes(ap)) centro = "Colaboradores";

        if (mesIdx >= 0) mapa[centro].meses[mesIdx]++;
        mapa[centro].total++;
    });

    /* ============================================================
       THEAD dinámico
    ============================================================= */
    pcf_renderThead();

    /* ============================================================
       TABLA Premium 2027 (enero–junio + Total + %Mes + %Total)
    ============================================================= */
    const tbody = document.querySelector("#pcf-tabla-meses tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = ["enero","febrero","marzo","abril","mayo","junio"];

    const lista = centros.map(c => {
        const m = mapa[c];

        const valoresMes = m.meses;
        const totalVisible = valoresMes.reduce((acc, v) => acc + v, 0);

        const porcentajesMes = valoresMes.map(v => {
            if (totalVisible === 0) return "";
            return ((v / totalVisible) * 100).toFixed(1) + "%";
        });

        return {
            centro: c,
            valoresMes,
            totalVisible,
            porcentajesMes
        };
    });

    lista.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.centro}</td>
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

    /* ============================================================
       Gráfico
    ============================================================= */
    if (chartCentroFirma) chartCentroFirma.destroy();

    const ctx = document.getElementById("pcf-chart-centro");
    if (!ctx) return;

    chartCentroFirma = new Chart(ctx, {
        type: "bar",
        data: {
            labels: centros,
            datasets: [{
                label: "Firmas por centro",
                data: centros.map(c => mapa[c].total),
                backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#6366F1"]
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
