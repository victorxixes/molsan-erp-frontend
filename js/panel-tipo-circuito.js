/* ============================================================
   PANEL CIRCUITO — GLASS LUXE 2027
============================================================ */

let PCI_DATOS = [];
let PCI_POR_ANIO = {};
let PCI_CHART_ANUAL = null;
let PCI_CHART_MENSUAL = null;

async function initPanelCircuito() {
    console.log("🛣️ initPanelCircuito() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PCI_DATOS = datos;

    // Agrupar por año, mes y circuito
    PCI_POR_ANIO = pci_groupByAnioMesCircuito(PCI_DATOS);

    // Rellenar selector
    pci_fillSelectAnios();

    // Seleccionar último año
    pci_selectUltimoAnio();

    // Render gráfico anual global
    pci_renderChartAnualGlobal();
}

/* Agrupar por año, mes y circuito */
function pci_groupByAnioMesCircuito(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio) || 0;
        if (!anio) continue;

        const mes = f.mes || "";
        if (!mes) continue;

        const circuito = f.circuito || "Externo";

        if (!map[anio]) {
            map[anio] = {
                total: 0,
                peninsula: 0,
                canarias: 0,
                externo: 0,
                sumaDias: 0,
                cuentaDias: 0,
                meses: {}
            };
        }

        const r = map[anio];

        if (!r.meses[mes]) {
            r.meses[mes] = {
                total: 0,
                peninsula: 0,
                canarias: 0,
                externo: 0,
                sumaDias: 0,
                cuentaDias: 0
            };
        }

        const m = r.meses[mes];

        r.total++;
        m.total++;

        // Circuito
        if (circuito === "Circuito Península") {
            r.peninsula++;
            m.peninsula++;
        } else if (circuito === "Circuito Canarias") {
            r.canarias++;
            m.canarias++;
        } else {
            r.externo++;
            m.externo++;
        }

        // SLA
        const d = Number(f.dias) || 0;
        if (d > 0) {
            r.sumaDias += d;
            r.cuentaDias++;
            m.sumaDias += d;
            m.cuentaDias++;
        }
    }

    return map;
}

/* Rellenar selector de años */
function pci_fillSelectAnios() {
    const sel = document.getElementById("pci-select-anio");
    sel.innerHTML = "";

    const anios = Object.keys(PCI_POR_ANIO)
        .map(a => Number(a))
        .sort((a, b) => a - b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

/* Seleccionar último año */
function pci_selectUltimoAnio() {
    const sel = document.getElementById("pci-select-anio");
    sel.value = sel.options[sel.options.length - 1].value;
    pci_onChangeAnio();
}

/* Cambio de año */
function pci_onChangeAnio() {
    const sel = document.getElementById("pci-select-anio");
    const anio = Number(sel.value) || 0;

    const info = PCI_POR_ANIO[anio];
    if (!info) return;

    pci_renderKpis(info);
    pci_renderTablaMeses(info);
    pci_renderChartMensual(info);
}

/* KPIs */
function pci_renderKpis(info) {
    const total = info.total;

    // Dominante
    const dom = [
        { n: "Península", v: info.peninsula },
        { n: "Canarias", v: info.canarias },
        { n: "Externo", v: info.externo }
    ].sort((a, b) => b.v - a.v)[0].n;

    const sla = info.cuentaDias ? (info.sumaDias / info.cuentaDias).toFixed(1) : "0";

    const vc = info.externo; // Externo suele tener más VC, pero usamos total VC real si lo quieres

    const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";

    document.getElementById("pci-kpi-total").textContent = total;
    document.getElementById("pci-kpi-top-circuito").textContent = dom;
    document.getElementById("pci-kpi-sla").textContent = sla;
    document.getElementById("pci-kpi-vc").textContent = pctVC;
}

/* Tabla mensual */
function pci_renderTablaMeses(info) {
    const tbody = document.querySelector("#pci-tabla-meses tbody");
    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    for (const mes of mesesOrden) {
        const m = info.meses[mes];
        if (!m) continue;

        const total = m.total;
        const pctPen = total ? ((m.peninsula / total) * 100).toFixed(1) + "%" : "0%";
        const pctCan = total ? ((m.canarias / total) * 100).toFixed(1) + "%" : "0%";
        const pctExt = total ? ((m.externo / total) * 100).toFixed(1) + "%" : "0%";

        const sla = m.cuentaDias ? (m.sumaDias / m.cuentaDias).toFixed(1) : "0";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${mes}</td>
            <td>${total}</td>
            <td>${m.peninsula}</td>
            <td>${m.canarias}</td>
            <td>${m.externo}</td>
            <td>${pctPen}</td>
            <td>${pctCan}</td>
            <td>${pctExt}</td>
            <td>${sla}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico anual global */
function pci_renderChartAnualGlobal() {
    const ctx = document.getElementById("pci-chart-anual");

    const anios = Object.keys(PCI_POR_ANIO)
        .map(a => Number(a))
        .sort((a, b) => a - b);

    const dataPen = anios.map(a => PCI_POR_ANIO[a].peninsula);
    const dataCan = anios.map(a => PCI_POR_ANIO[a].canarias);
    const dataExt = anios.map(a => PCI_POR_ANIO[a].externo);

    if (PCI_CHART_ANUAL) PCI_CHART_ANUAL.destroy();

    PCI_CHART_ANUAL = new Chart(ctx, {
        type: "bar",
        data: {
            labels: anios,
            datasets: [
                {
                    label: "Península",
                    data: dataPen,
                    backgroundColor: "rgba(80, 200, 255, 0.4)",
                    borderColor: "rgba(80, 200, 255, 1)",
                    borderWidth: 1.5
                },
                {
                    label: "Canarias",
                    data: dataCan,
                    backgroundColor: "rgba(255, 150, 80, 0.4)",
                    borderColor: "rgba(255, 150, 80, 1)",
                    borderWidth: 1.5
                },
                {
                    label: "Externo",
                    data: dataExt,
                    backgroundColor: "rgba(150, 255, 80, 0.4)",
                    borderColor: "rgba(150, 255, 80, 1)",
                    borderWidth: 1.5
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "#fff" } }
            },
            scales: {
                x: {
                    ticks: { color: "#fff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                },
                y: {
                    ticks: { color: "#fff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                }
            }
        }
    });
}

/* Gráfico mensual */
function pci_renderChartMensual(info) {
    const ctx = document.getElementById("pci-chart-mensual");

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const labels = [];
    const dataPen = [];
    const dataCan = [];
    const dataExt = [];

    for (const mes of mesesOrden) {
        const m = info.meses[mes];
        if (!m) continue;

        labels.push(mes);
        dataPen.push(m.peninsula);
        dataCan.push(m.canarias);
        dataExt.push(m.externo);
    }

    if (PCI_CHART_MENSUAL) PCI_CHART_MENSUAL.destroy();

    PCI_CHART_MENSUAL = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Península",
                    data: dataPen,
                    borderColor: "rgba(80, 200, 255, 1)",
                    backgroundColor: "rgba(80, 200, 255, 0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                },
                {
                    label: "Canarias",
                    data: dataCan,
                    borderColor: "rgba(255, 150, 80, 1)",
                    backgroundColor: "rgba(255, 150, 80, 0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                },
                {
                    label: "Externo",
                    data: dataExt,
                    borderColor: "rgba(150, 255, 80, 1)",
                    backgroundColor: "rgba(150, 255, 80, 0.2)",
                    borderWidth: 1.5,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "#fff" } }
            },
            scales: {
                x: {
                    ticks: { color: "#fff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                },
                y: {
                    ticks: { color: "#fff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                }
            }
        }
    });
}
