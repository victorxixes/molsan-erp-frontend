/* ============================================================
   PANEL CIRCUITO — PREMIUM 2027 (FORMATO 7 MESES)
============================================================ */

let PCI_DATOS = [];
let PCI_POR_ANIO = {};

let PCI_CHART_RANKING = null;
let PCI_CHART_EVOLUCION = null;

/* Helper seguro */
function pciSafeSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.textContent = value;
    return true;
}

async function initPanelCircuito() {
    console.log("🛣️ initPanelCircuito() ejecutado");

    if (!document.getElementById("pci-select-anio")) {
        console.warn("⏳ Panel Circuito aún no está en el DOM.");
        return;
    }

    let datos = await obtenerFirmas();
    datos = datos.map(f => aplicarReglas(f));

    PCI_DATOS = datos;
    PCI_POR_ANIO = pci_groupByAnioCircuito(PCI_DATOS);

    pci_fillSelectAnios();
    pci_selectUltimoAnio();

    document.getElementById("pci-select-anio")
        .addEventListener("change", pci_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → CIRCUITO → MES (solo enero–junio)
============================================================ */
function pci_groupByAnioCircuito(datos) {

    const mesesValidos = ["enero","febrero","marzo","abril","mayo","junio"];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        const idxMes = mesesValidos.indexOf(mes);
        if (idxMes === -1) continue;

        const circuito = f.circuito || "Fuera del circuito";

        if (!map[anio]) map[anio] = {};

        if (!map[anio][circuito]) {
            map[anio][circuito] = {
                meses: Array(6).fill(0),
                total: 0
            };
        }

        const r = map[anio][circuito];

        r.meses[idxMes]++;
        r.total++;
    }

    return map;
}

/* ============================================================
   SELECT AÑOS
============================================================ */
function pci_fillSelectAnios() {
    const sel = document.getElementById("pci-select-anio");
    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(PCI_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function pci_selectUltimoAnio() {
    const sel = document.getElementById("pci-select-anio");
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    pci_onChangeAnio();
}

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function pci_onChangeAnio() {
    const sel = document.getElementById("pci-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PCI_POR_ANIO[anio];
    if (!info) return;

    pci_renderKpis(info);
    pci_renderThead();
    pci_renderTabla(info);
    pci_renderGraficos(info);   // ⭐ NUEVO
}

/* ============================================================
   THEAD DINÁMICO — Premium 2027
============================================================ */
function pci_renderThead() {
    const theadRow = document.getElementById("pci-thead-row");
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
   KPIs
============================================================ */
function pci_renderKpis(info) {
    let total = 0;
    let circuitoTop = "-";
    let maxCircuito = 0;

    for (const circuito in info) {
        const r = info[circuito];

        total += r.total;

        if (r.total > maxCircuito) {
            maxCircuito = r.total;
            circuitoTop = circuito;
        }
    }

    pciSafeSet("pci-kpi-total", total);
    pciSafeSet("pci-kpi-circuito", circuitoTop);
}

/* ============================================================
   TABLA DETALLE — Premium 2027
============================================================ */
function pci_renderTabla(info) {
    const tbody = document.querySelector("#pci-tabla-circuito tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = ["enero","febrero","marzo","abril","mayo","junio"];

    const lista = Object.entries(info).map(([circuito, r]) => {

        const valoresMes = r.meses;
        const totalVisible = valoresMes.reduce((acc, v) => acc + v, 0);

        const porcentajesMes = valoresMes.map(v => {
            if (totalVisible === 0) return "";
            return ((v / totalVisible) * 100).toFixed(1) + "%";
        });

        return {
            circuito,
            valoresMes,
            totalVisible,
            porcentajesMes
        };
    });

    lista.sort((a,b)=>b.totalVisible - a.totalVisible);

    for (const row of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.circuito}</td>
            ${row.valoresMes.map(v => `<td>${v}</td>`).join("")}
            <td>${row.totalVisible}</td>
            ${row.porcentajesMes.map(p => `<td>${p}</td>`).join("")}
            <td>100%</td>
        `;

        tbody.appendChild(tr);
    }

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

/* ============================================================
   GRÁFICOS — Premium 2027
============================================================ */
function pci_renderGraficos(info) {

    const mesesOrden = ["enero","febrero","marzo","abril","mayo","junio"];

    const lista = Object.entries(info).map(([circuito, r]) => ({
        circuito,
        valoresMes: r.meses,
        totalVisible: r.total
    })).sort((a,b)=>b.totalVisible - a.totalVisible);

    /* ============================
       1) Ranking Circuitos
    ============================ */

    const labelsRanking = lista.map(o => o.circuito);
    const dataRanking = lista.map(o => o.totalVisible);

    const ctxRanking = document.getElementById("pci-chart-ranking");

    if (PCI_CHART_RANKING) PCI_CHART_RANKING.destroy();

    PCI_CHART_RANKING = new Chart(ctxRanking, {
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

    const ctxEvo = document.getElementById("pci-chart-evolucion");

    if (PCI_CHART_EVOLUCION) PCI_CHART_EVOLUCION.destroy();

    PCI_CHART_EVOLUCION = new Chart(ctxEvo, {
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
