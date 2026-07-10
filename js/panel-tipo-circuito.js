/* ============================================================
   PANEL CIRCUITO — PREMIUM 2027 (COMPATIBLE CON TU HTML)
============================================================ */

let PCI_DATOS = [];
let PCI_POR_ANIO = {};
let PCI_CHART = null;

/* Helper seguro */
function pciSafeSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.textContent = value;
    return true;
}

async function initPanelCircuito() {
    console.log("🛣️ initPanelCircuito() ejecutado");

    // Si el panel no está en el DOM → detener
    if (!document.getElementById("pci-select-anio")) {
        console.warn("⏳ Panel Circuito aún no está en el DOM. initPanelCircuito() detenido.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PCI_DATOS = datos;
    PCI_POR_ANIO = pci_groupByAnioCircuito(PCI_DATOS);

    pci_fillSelectAnios();
    pci_selectUltimoAnio();

    // Listener del selector de año
    document.getElementById("pci-select-anio")
        .addEventListener("change", pci_onChangeAnio);
}

/* Agrupar por año y circuito */
function pci_groupByAnioCircuito(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const circuito = f.circuito || "Externo";
        const dias = Number(f.dias);
        const esVC = (f.vc || "").toLowerCase().includes("vc");

        if (!anio) continue;

        if (!map[anio]) map[anio] = {};

        if (!map[anio][circuito]) {
            map[anio][circuito] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0
            };
        }

        const r = map[anio][circuito];

        r.total++;

        if (esVC) r.vc++;
        else r.presencial++;

        if (dias > 0) {
            r.sumaDias += dias;
            r.cuentaDias++;
        }
    }

    return map;
}

/* Select años */
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

/* Cambio de año */
function pci_onChangeAnio() {
    const sel = document.getElementById("pci-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PCI_POR_ANIO[anio];
    if (!info) return;

    pci_renderKpis(info);
    pci_renderTabla(info);
    pci_renderChart(info);
}

/* KPIs */
function pci_renderKpis(info) {
    let total = 0;
    let vc = 0;
    let presencial = 0;
    let sumaDias = 0;
    let cuentaDias = 0;

    let circuitoTop = "-";
    let maxCircuito = 0;

    for (const circuito in info) {
        const r = info[circuito];

        total += r.total;
        vc += r.vc;
        presencial += r.presencial;

        sumaDias += r.sumaDias;
        cuentaDias += r.cuentaDias;

        if (r.total > maxCircuito) {
            maxCircuito = r.total;
            circuitoTop = circuito;
        }
    }

    const pctVC = total ? ((vc / total) * 100).toFixed(1) + "%" : "0%";
    const sla = cuentaDias ? (sumaDias / cuentaDias).toFixed(1) : "0";

    pciSafeSet("pci-kpi-total", total);
    pciSafeSet("pci-kpi-circuito", circuitoTop);
    pciSafeSet("pci-kpi-sla", sla);
    pciSafeSet("pci-kpi-vc", pctVC);
}

/* Tabla por circuito */
function pci_renderTabla(info) {
    const tbody = document.querySelector("#pci-tabla-circuito tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    for (const circuito in info) {
        const r = info[circuito];

        const pctVC = r.total ? ((r.vc / r.total) * 100).toFixed(1) + "%" : "0%";
        const sla = r.cuentaDias ? (r.sumaDias / r.cuentaDias).toFixed(1) : "0";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${circuito}</td>
            <td>${r.total}</td>
            <td>${r.presencial}</td>
            <td>${r.vc}</td>
            <td>${pctVC}</td>
            <td>${sla}</td>
        `;
        tbody.appendChild(tr);
    }
}

/* Gráfico por circuito */
function pci_renderChart(info) {
    const ctx = document.getElementById("pci-chart-circuito");
    if (!ctx) return;

    const labels = Object.keys(info);
    const dataVC = labels.map(c => info[c].vc);
    const dataPres = labels.map(c => info[c].presencial);

    if (PCI_CHART) PCI_CHART.destroy();

    PCI_CHART = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Presencial",
                    data: dataPres,
                    backgroundColor: "rgba(150,255,80,0.4)",
                    borderColor: "rgba(150,255,80,1)",
                    borderWidth: 1.5
                },
                {
                    label: "VC",
                    data: dataVC,
                    backgroundColor: "rgba(80,200,255,0.4)",
                    borderColor: "rgba(80,200,255,1)",
                    borderWidth: 1.5
                }
            ]
        }
    });
}
