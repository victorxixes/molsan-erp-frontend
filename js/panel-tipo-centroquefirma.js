/* ============================================================
   PANEL CENTRO QUE FIRMA — PREMIUM 2027 (FORMATO 2026)
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
   AGRUPAR POR AÑO → CENTRO QUE FIRMA → MES
============================================================ */
function pcf_groupByAnio(datos) {

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

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
        const dias = Number(f.dias);

        let centro = "Molsan";
        if (ap === "oficina caixabank") centro = "Oficina CBK";
        else if (ap === "oficina otra entidad") centro = "Oficina OE";
        else if (COLABORADORES.includes(ap)) centro = "Colaboradores";

        if (!map[anio]) map[anio] = {};

        if (!map[anio][centro]) {
            map[anio][centro] = {
                total: 0,
                presencial: 0,
                vc: 0,
                slaSum: 0,
                slaCount: 0,
                meses: Array(12).fill(0)
            };
        }

        const r = map[anio][centro];

        r.total++;

        if (String(f.tipo_firma).toLowerCase() === "videoconferencia") r.vc++;
        else r.presencial++;

        if (dias > 0) {
            r.slaSum += dias;
            r.slaCount++;
        }

        r.meses[idxMes]++;
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
   THEAD DINÁMICO — Premium 2027 (Meses + Total + %Mes + %Total)
============================================================ */
function pcf_renderThead() {
    const theadRow = document.getElementById("pcf-thead-row");
    if (!theadRow) return;

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

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
            total: 0,
            presencial: 0,
            vc: 0,
            slaSum: 0,
            slaCount: 0,
            meses: Array(12).fill(0)
        };
    });

    datos.forEach(f => {

        const ap = (f.apoderado || "").trim().toLowerCase();
        const mesNombre = String(f.mes || "").toLowerCase().trim();
        const mesIdx = MESES_ORDEN.indexOf(mesNombre);
        const dias = Number(f.dias);

        let centro = "Molsan";
        if (ap === "oficina caixabank") centro = "Oficina CBK";
        else if (ap === "oficina otra entidad") centro = "Oficina OE";
        else if (COLABORADORES.includes(ap)) centro = "Colaboradores";

        mapa[centro].total++;

        if (String(f.tipo_firma).toLowerCase() === "videoconferencia") {
            mapa[centro].vc++;
        } else {
            mapa[centro].presencial++;
        }

        if (dias > 0) {
            mapa[centro].slaSum += dias;
            mapa[centro].slaCount++;
        }

        if (mesIdx >= 0) mapa[centro].meses[mesIdx]++;
    });

    /* ============================================================
       THEAD dinámico
    ============================================================= */
    pcf_renderThead();

    /* ============================================================
       TABLA Premium 2027 (Meses + Total + %Mes + %Total)
    ============================================================= */
    const tbody = document.querySelector("#pcf-tabla-meses tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const lista = centros.map(c => {
        const m = mapa[c];

        const sla = m.slaCount ? (m.slaSum / m.slaCount).toFixed(1) : "0";
        const vcPct = m.total ? ((m.vc / m.total) * 100).toFixed(1) + "%" : "0%";

        const valoresMes = m.meses;
        const totalVisible = valoresMes.reduce((acc, v) => acc + v, 0);

        const porcentajesMes = valoresMes.map(v => {
            if (totalVisible === 0) return "";
            return ((v / totalVisible) * 100).toFixed(1) + "%";
        });

        return {
            centro: c,
            total: m.total,
            presencial: m.presencial,
            vc: m.vc,
            vcPct,
            sla,
            valoresMes,
            totalVisible,
            porcentajesMes
        };
    });

    lista.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.centro}</td>
            <td>${row.total}</td>
            <td>${row.presencial}</td>
            <td>${row.vc}</td>
            <td>${row.vcPct}</td>
            <td>${row.sla}</td>

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
        <td><b>${lista.reduce((acc,r)=>acc+r.total,0)}</b></td>
        <td><b>${lista.reduce((acc,r)=>acc+r.presencial,0)}</b></td>
        <td><b>${lista.reduce((acc,r)=>acc+r.vc,0)}</b></td>
        <td><b>-</b></td>
        <td><b>-</b></td>

        ${totalesMes.map(v => `<td><b>${v}</b></td>`).join("")}
        <td><b>${totalGeneral}</b></td>
        ${porcentajesTotalesMes.map(p => `<td><b>${p}</b></td>`).join("")}
        <td><b>100%</b></td>
    `;

    tbody.appendChild(trTotal);

    /* ============================================================
       KPIs
    ============================================================= */
    const totalFirmas = datos.length;
    document.getElementById("pcf-kpi-total").textContent = totalFirmas;

    const centroTop = centros.reduce((a,b) => mapa[a].total > mapa[b].total ? a : b);
    document.getElementById("pcf-kpi-top").textContent = centroTop;

    const slaGlobal = (() => {
        const sum = centros.reduce((acc,c) => acc + mapa[c].slaSum, 0);
        const cnt = centros.reduce((acc,c) => acc + mapa[c].slaCount, 0);
        return cnt ? (sum / cnt).toFixed(1) : "0";
    })();
    document.getElementById("pcf-kpi-sla").textContent = slaGlobal;

    const vcGlobal = (() => {
        const vc = centros.reduce((acc,c) => acc + mapa[c].vc, 0);
        return totalFirmas ? ((vc / totalFirmas) * 100).toFixed(1) + "%" : "0%";
    })();
    document.getElementById("pcf-kpi-vc").textContent = vcGlobal;

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
                label: "Total firmas",
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
