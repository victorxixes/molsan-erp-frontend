/* ============================================================
   PANEL CENTRO QUE FIRMA — PREMIUM 2027 (FORMATO 7 MESES)
============================================================ */

let PCF_CHART_RANKING = null;
let PCF_CHART_EVOLUCION = null;

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
                total: 0,
                slaSum: 0,
                slaCount: 0,
                vc: 0
            };
        }

        const r = map[anio][centro];

        r.meses[idxMes]++;
        r.total++;

        if (Number(f.dias) > 0) {
            r.slaSum += Number(f.dias);
            r.slaCount++;
        }

        if (String(f.tipo_firma).toLowerCase() === "videoconferencia") {
            r.vc++;
        }
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
   THEAD DINÁMICO — Premium 2027
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
            total: 0,
            slaSum: 0,
            slaCount: 0,
            vc: 0
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

        if (Number(f.dias) > 0) {
            mapa[centro].slaSum += Number(f.dias);
            mapa[centro].slaCount++;
        }

        if (String(f.tipo_firma).toLowerCase() === "videoconferencia") {
            mapa[centro].vc++;
        }
    });

    /* ============================================================
       KPIs
    ============================================================= */
    let totalFirmas = 0;
    let centroTop = "-";
    let maxFirmas = 0;
    let slaGlobal = 0;
    let vcGlobal = 0;

    centros.forEach(c => {
        const r = mapa[c];
        totalFirmas += r.total;

        if (r.total > maxFirmas) {
            maxFirmas = r.total;
            centroTop = c;
        }

        slaGlobal += r.slaSum;
        vcGlobal += r.vc;
    });

    const slaMedio = slaGlobal > 0 ? (slaGlobal / (datos.length)).toFixed(1) : 0;
    const vcPorcentaje = totalFirmas > 0 ? ((vcGlobal / totalFirmas) * 100).toFixed(1) + "%" : "0%";

    document.getElementById("pcf-kpi-total").textContent = totalFirmas;
    document.getElementById("pcf-kpi-top").textContent = centroTop;
    document.getElementById("pcf-kpi-sla").textContent = slaMedio;
    document.getElementById("pcf-kpi-vc").textContent = vcPorcentaje;

    /* ============================================================
       THEAD dinámico
    ============================================================= */
    pcf_renderThead();

    /* ============================================================
       TABLA Premium 2027
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
       GRÁFICOS PREMIUM 2027
    ============================================================= */
    pcf_renderGraficos(lista, mesesOrden);
}

/* ============================================================
   GRÁFICOS — Premium 2027
============================================================ */
function pcf_renderGraficos(lista, mesesOrden) {

    /* ============================
       1) Ranking Centros
    ============================ */

    const labelsRanking = lista.map(o => o.centro);
    const dataRanking = lista.map(o => o.totalVisible);

    const ctxRanking = document.getElementById("pcf-chart-ranking");

    if (PCF_CHART_RANKING) PCF_CHART_RANKING.destroy();

    PCF_CHART_RANKING = new Chart(ctxRanking, {
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

    const totalesMes = mesesOrden.map((_, idx) =>
        lista.reduce((acc, row) => acc + row.valoresMes[idx], 0)
    );

    const ctxEvo = document.getElementById("pcf-chart-evolucion");

    if (PCF_CHART_EVOLUCION) PCF_CHART_EVOLUCION.destroy();

    PCF_CHART_EVOLUCION = new Chart(ctxEvo, {
        type: "line",
        data: {
            labels: mesesOrden,
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
