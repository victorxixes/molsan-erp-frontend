/* ============================================================
   PANEL TIPO FIRMA — PREMIUM 2027 (MESES DINÁMICOS)
============================================================ */

let PTF_DATOS = [];
let PTF_POR_ANIO = {};

let PTF_CHART_RANKING = null;
let PTF_CHART_EVOLUCION = null;

/* ============================================================
   INIT
============================================================ */
async function initPanelTipoFirma() {
    console.log("✍️ initPanelTipoFirma() ejecutado");

    if (!document.getElementById("ptf-select-anio")) {
        console.warn("⏳ Panel Tipo Firma aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PTF_DATOS = datos;
    PTF_POR_ANIO = ptf_groupByAnio(PTF_DATOS);

    ptf_fillSelectAnios();
    ptf_selectUltimoAnio();

    document.getElementById("ptf-select-anio")
        .addEventListener("change", ptf_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → TIPO FIRMA → MESES DINÁMICOS
============================================================ */
function ptf_groupByAnio(datos) {

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio || isNaN(anio)) continue;

        const tipo = f.tipo_firma || "Desconocido";
        const mes = (f.mes || "").toLowerCase().trim();
        if (!mesesValidos.includes(mes)) continue;

        if (!map[anio]) {
            map[anio] = {
                tipos: {},
                mesesConDatos: new Set()
            };
        }

        const r = map[anio];

        if (!r.tipos[tipo]) {
            r.tipos[tipo] = {
                total: 0,
                meses: {}
            };

            mesesValidos.forEach(m => r.tipos[tipo].meses[m] = 0);
        }

        const t = r.tipos[tipo];

        t.total++;
        t.meses[mes]++;

        r.mesesConDatos.add(mes);
    }

    return map;
}

/* ============================================================
   SELECT AÑOS
============================================================ */
function ptf_fillSelectAnios() {
    const sel = document.getElementById("ptf-select-anio");
    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(PTF_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function ptf_selectUltimoAnio() {
    const sel = document.getElementById("ptf-select-anio");
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    ptf_onChangeAnio();
}

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function ptf_onChangeAnio() {
    const sel = document.getElementById("ptf-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PTF_POR_ANIO[anio];
    if (!info) return;

    info.anio = anio;

    ptf_renderTabla(info);
    ptf_renderGraficos(info);
}

/* ============================================================
   THEAD DINÁMICO — SOLO MESES CON DATOS
============================================================ */
function ptf_renderThead(mesesConDatos) {
    const theadRow = document.getElementById("ptf-thead-row");
    if (!theadRow) return;

    theadRow.innerHTML = `
        ${mesesConDatos.map(m => `<th style="text-align:center;">${m}</th>`).join("")}
        <th>Total</th>
        ${mesesConDatos.map(m => `<th style="text-align:center;">%${m}</th>`).join("")}
        <th>%Total</th>
    `;
}

/* ============================================================
   TABLA DETALLE TIPO FIRMA — MESES DINÁMICOS + TOTAL
============================================================ */
function ptf_renderTabla(info) {
    const tbody = document.querySelector("#ptf-tabla-meses tbody");
    const tfoot = document.querySelector("#ptf-tabla-meses tfoot");
    if (!tbody || !tfoot) return;

    tbody.innerHTML = "";
    tfoot.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const mesesConDatos = mesesOrden.filter(m =>
        Object.values(info.tipos).some(t => t.meses[m] > 0)
    );

    ptf_renderThead(mesesConDatos);

    const lista = Object.entries(info.tipos).map(([tipo, t]) => {

        const valoresMes = mesesConDatos.map(m => t.meses[m] || 0);

        const totalVisible = valoresMes.reduce((acc, v) => acc + v, 0);

        const porcentajesMes = valoresMes.map(v => {
            if (totalVisible === 0) return "";
            return ((v / totalVisible) * 100).toFixed(1) + "%";
        });

        return {
            tipo,
            valoresMes,
            totalVisible,
            porcentajesMes
        };
    });

    lista.sort((a,b)=>b.totalVisible - a.totalVisible);

    for (const row of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td style="text-align:center;">${row.tipo}</td>
            ${row.valoresMes.map(v => `<td style="text-align:center;">${v}</td>`).join("")}
            <td style="text-align:center;">${row.totalVisible}</td>
            ${row.porcentajesMes.map(p => `<td style="text-align:center;">${p}</td>`).join("")}
            <td style="text-align:center;">100%</td>
        `;

        tbody.appendChild(tr);
    }

    const totalesMes = mesesConDatos.map(m =>
        Object.values(info.tipos).reduce((acc, t) => acc + (t.meses[m] || 0), 0)
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
        ${totalesMes.map(v => `<td style="text-align:center;"><b>${v}</b></td>`).join("")}
        <td style="text-align:center;"><b>${totalGeneral}</b></td>
        ${porcentajesTotalesMes.map(p => `<td style="text-align:center;"><b>${p}</b></td>`).join("")}
        <td style="text-align:center;"><b>100%</b></td>
    `;

    tfoot.appendChild(trTotal);
}

/* ============================================================
   GRÁFICOS PREMIUM 2027 — MESES DINÁMICOS
============================================================ */
function ptf_renderGraficos(info) {

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const mesesConDatos = mesesOrden.filter(m =>
        Object.values(info.tipos).some(t => t.meses[m] > 0)
    );

    /* ============================
       1) Ranking Tipos de Firma
    ============================ */

    const lista = Object.entries(info.tipos).map(([tipo, t]) => {
        const valoresMes = mesesConDatos.map(m => t.meses[m] || 0);
        return {
            tipo,
            totalVisible: valoresMes.reduce((acc, v) => acc + v, 0),
            valoresMes
        };
    }).sort((a,b)=>b.totalVisible - a.totalVisible);

    const labelsRanking = lista.map(o => o.tipo);
    const dataRanking = lista.map(o => o.totalVisible);

    const ctxRanking = document.getElementById("ptf-chart-ranking");

    if (PTF_CHART_RANKING) PTF_CHART_RANKING.destroy();

    PTF_CHART_RANKING = new Chart(ctxRanking, {
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

    const totalesMes = mesesConDatos.map(m =>
        Object.values(info.tipos).reduce((acc, t) => acc + (t.meses[m] || 0), 0)
    );

    const ctxEvo = document.getElementById("ptf-chart-evolucion");

    if (PTF_CHART_EVOLUCION) PTF_CHART_EVOLUCION.destroy();

    PTF_CHART_EVOLUCION = new Chart(ctxEvo, {
        type: "line",
        data: {
            labels: mesesConDatos,
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
