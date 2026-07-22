/* ============================================================
   PANEL CIRCUITO — PREMIUM 2027 (MESES DINÁMICOS)
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
   AGRUPAR POR AÑO → CIRCUITO → MESES DINÁMICOS
============================================================ */
function pci_groupByAnioCircuito(datos) {

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

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
                meses: Array(12).fill(0),
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
    pci_renderThead(info);
    pci_renderTabla(info);
    pci_renderGraficos(info);
}

/* ============================================================
   THEAD DINÁMICO — SOLO MESES CON DATOS
============================================================ */
function pci_renderThead(info) {
    const theadRow = document.getElementById("pci-thead-row");
    if (!theadRow) return;

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const mesesConDatos = [];

    meses.forEach((m, idx) => {
        const totalMes = Object.values(info)
            .reduce((acc, r) => acc + r.meses[idx], 0);

        if (totalMes > 0) mesesConDatos.push(m);
    });

    theadRow.innerHTML = `
        ${mesesConDatos.map(m => `<th style="text-align:center;">${m}</th>`).join("")}
        <th>Total</th>
        ${mesesConDatos.map(m => `<th style="text-align:center;">%${m}</th>`).join("")}
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
   TABLA DETALLE — MESES DINÁMICOS + TOTAL
============================================================ */
function pci_renderTabla(info) {
    const tbody = document.querySelector("#pcf-tabla-meses tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const mesesConDatos = meses.filter((m, idx) =>
        Object.values(info).some(r => r.meses[idx] > 0)
    );

    const lista = Object.entries(info).map(([circuito, r]) => {

        const valoresMes = mesesConDatos.map((m, idx) => {
            const realIdx = meses.indexOf(m);
            return r.meses[realIdx];
        });

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
            <td style="text-align:center;">${row.circuito}</td>
            ${row.valoresMes.map(v => `<td style="text-align:center;">${v}</td>`).join("")}
            <td style="text-align:center;">${row.totalVisible}</td>
            ${row.porcentajesMes.map(p => `<td style="text-align:center;">${p}</td>`).join("")}
            <td style="text-align:center;">100%</td>
        `;

        tbody.appendChild(tr);
    }

    const totalesMes = mesesConDatos.map((m, idx) =>
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
        ${totalesMes.map(v => `<td style="text-align:center;"><b>${v}</b></td>`).join("")}
        <td style="text-align:center;"><b>${totalGeneral}</b></td>
        ${porcentajesTotalesMes.map(p => `<td style="text-align:center;"><b>${p}</b></td>`).join("")}
        <td style="text-align:center;"><b>100%</b></td>
    `;

    tbody.appendChild(trTotal);
}

/* ============================================================
   GRÁFICOS — MESES DINÁMICOS
============================================================ */
function pci_renderGraficos(info) {

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const mesesConDatos = meses.filter((m, idx) =>
        Object.values(info).some(r => r.meses[idx] > 0)
    );

    const lista = Object.entries(info).map(([circuito, r]) => ({
        circuito,
        valoresMes: mesesConDatos.map(m => r.meses[meses.indexOf(m)]),
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

    const totalesMes = mesesConDatos.map((m, idx) =>
        lista.reduce((acc, row) => acc + row.valoresMes[idx], 0)
    );

    const ctxEvo = document.getElementById("pci-chart-evolucion");

    if (PCI_CHART_EVOLUCION) PCI_CHART_EVOLUCION.destroy();

    PCI_CHART_EVOLUCION = new Chart(ctxEvo, {
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
