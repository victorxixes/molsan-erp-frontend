/* ============================================================
   PANEL TIPO GESTIÓN — PREMIUM 2027 (FORMATO 2026)
============================================================ */

let PTG_DATOS = [];
let PTG_POR_ANIO = {};

let PTG_CHART_RANKING = null;
let PTG_CHART_EVOLUCION = null;

/* INIT */
async function initPanelTipoGestion() {
    console.log("📄 initPanelTipoGestion() ejecutado");

    if (!document.getElementById("ptg-select-anio")) {
        console.warn("⏳ Panel Tipo Gestión aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PTG_DATOS = datos;
    PTG_POR_ANIO = ptg_groupByAnio(PTG_DATOS);

    ptg_fillSelectAnios();
    ptg_selectUltimoAnio();

    document.getElementById("ptg-select-anio")
        .addEventListener("change", ptg_onChangeAnio);
}

/* AGRUPAR POR AÑO → TIPO GESTIÓN → MESES */
function ptg_groupByAnio(datos) {

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio || isNaN(anio)) continue;

        const tipo = f.tipo_gestion || "Con provisión";
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

/* SELECT AÑOS */
function ptg_fillSelectAnios() {
    const sel = document.getElementById("ptg-select-anio");
    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(PTG_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function ptg_selectUltimoAnio() {
    const sel = document.getElementById("ptg-select-anio");
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    ptg_onChangeAnio();
}

/* CAMBIO DE AÑO */
function ptg_onChangeAnio() {
    const sel = document.getElementById("ptg-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PTG_POR_ANIO[anio];
    if (!info) return;

    info.anio = anio;

    ptg_renderTabla(info);
    ptg_renderGraficos(info);   // ⭐ AÑADIDO
}

/* TABLA DETALLE TIPO GESTIÓN */
function ptg_renderTabla(info) {
    const tbody = document.querySelector("#ptg-tabla-gestion tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    const mesesConDatos = mesesOrden.filter(m =>
        Object.values(info.tipos).some(t => t.meses[m] > 0)
    );

    ptg_renderThead(mesesConDatos);

    const lista = Object.entries(info.tipos).map(([tipo, t]) => {

        const valoresMes = mesesConDatos.map(m => {
            const idx = mesesOrden.indexOf(m);
            if (info.anio === currentYear && idx > currentMonthIndex) return "";
            return t.meses[m] || 0;
        });

        const totalVisible = valoresMes.reduce((acc, v) => acc + (v || 0), 0);

        const porcentajesMes = valoresMes.map(v => {
            if (v === "" || totalVisible === 0) return "";
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
            <td>${row.tipo}</td>
            ${row.valoresMes.map(v => `<td class="num">${v}</td>`).join("")}
            <td class="num">${row.totalVisible}</td>
            ${row.porcentajesMes.map(p => `<td>${p}</td>`).join("")}
            <td>100%</td>
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
        ${totalesMes.map(v => `<td class="num"><b>${v}</b></td>`).join("")}
        <td class="num"><b>${totalGeneral}</b></td>
        ${porcentajesTotalesMes.map(p => `<td><b>${p}</b></td>`).join("")}
        <td><b>100%</b></td>
    `;

    tbody.appendChild(trTotal);
}

/* THEAD DINÁMICO */
function ptg_renderThead(mesesConDatos) {
    const theadRow = document.getElementById("ptg-thead-row");
    if (!theadRow) return;

    theadRow.innerHTML = `
        ${mesesConDatos.map(m => `<th>${m}</th>`).join("")}
        <th>Total</th>
        ${mesesConDatos.map(m => `<th>%${m}</th>`).join("")}
        <th>%Total</th>
    `;
}

/* ============================================================
   GRÁFICOS PREMIUM 2027
============================================================ */
function ptg_renderGraficos(info) {

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const mesesConDatos = mesesOrden.filter(m =>
        Object.values(info.tipos).some(t => t.meses[m] > 0)
    );

    /* ============================
       1) Ranking Tipos de Gestión
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

    const ctxRanking = document.getElementById("ptg-chart-ranking");

    if (PTG_CHART_RANKING) PTG_CHART_RANKING.destroy();

    PTG_CHART_RANKING = new Chart(ctxRanking, {
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

    const ctxEvo = document.getElementById("ptg-chart-evolucion");

    if (PTG_CHART_EVOLUCION) PTG_CHART_EVOLUCION.destroy();

    PTG_CHART_EVOLUCION = new Chart(ctxEvo, {
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
