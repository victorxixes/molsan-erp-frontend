/* ============================================================
   PANEL CIRCUITO — PREMIUM 2027 (FORMATO 2026)
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

    if (!document.getElementById("pci-select-anio")) {
        console.warn("⏳ Panel Circuito aún no está en el DOM.");
        return;
    }

    let datos = await obtenerFirmas();

    // ✔ Aplicar reglas.js para asegurar circuito correcto
    datos = datos.map(f => aplicarReglas(f));

    PCI_DATOS = datos;
    PCI_POR_ANIO = pci_groupByAnioCircuito(PCI_DATOS);

    pci_fillSelectAnios();
    pci_selectUltimoAnio();

    document.getElementById("pci-select-anio")
        .addEventListener("change", pci_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → CIRCUITO → MES
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
        const dias = Number(f.dias);
        const esVC = (String(f.tipo_firma).toLowerCase() === "videoconferencia");

        if (!map[anio]) map[anio] = {};

        if (!map[anio][circuito]) {
            map[anio][circuito] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0,
                meses: Array(12).fill(0)
            };
        }

        const r = map[anio][circuito];

        r.total++;
        r.meses[idxMes]++;

        if (esVC) r.vc++;
        else r.presencial++;

        if (dias > 0) {
            r.sumaDias += dias;
            r.cuentaDias++;
        }
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
    pci_renderChart(info);
}

/* ============================================================
   THEAD DINÁMICO — OPCIÓN A (Meses + Total + %Mes + %Total)
============================================================ */
function pci_renderThead() {
    const theadRow = document.getElementById("pci-thead-row");
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
   KPIs
============================================================ */
function pci_renderKpis(info) {
    let total = 0;
    let vc = 0;
    let sumaDias = 0;
    let cuentaDias = 0;

    let circuitoTop = "-";
    let maxCircuito = 0;

    for (const circuito in info) {
        const r = info[circuito];

        total += r.total;
        vc += r.vc;

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

/* ============================================================
   TABLA DETALLE — OPCIÓN A (Meses + Total + %Mes + %Total)
============================================================ */
function pci_renderTabla(info) {
    const tbody = document.querySelector("#pci-tabla-circuito tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const lista = Object.entries(info).map(([circuito, r]) => {

        const pctVC = r.total ? ((r.vc / r.total) * 100).toFixed(1) + "%" : "0%";
        const sla = r.cuentaDias ? (r.sumaDias / r.cuentaDias).toFixed(1) : "0";

        const valoresMes = r.meses;
        const totalVisible = valoresMes.reduce((acc, v) => acc + v, 0);

        const porcentajesMes = valoresMes.map(v => {
            if (totalVisible === 0) return "";
            return ((v / totalVisible) * 100).toFixed(1) + "%";
        });

        return {
            circuito,
            total: r.total,
            presencial: r.presencial,
            vc: r.vc,
            pctVC,
            sla,
            valoresMes,
            totalVisible,
            porcentajesMes
        };
    });

    lista.sort((a,b)=>b.total - a.total);

    for (const row of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.circuito}</td>
            <td>${row.total}</td>
            <td>${row.presencial}</td>
            <td>${row.vc}</td>
            <td>${row.pctVC}</td>
            <td>${row.sla}</td>

            ${row.valoresMes.map(v => `<td>${v}</td>`).join("")}
            <td>${row.totalVisible}</td>
            ${row.porcentajesMes.map(p => `<td>${p}</td>`).join("")}
            <td>100%</td>
        `;

        tbody.appendChild(tr);
    }

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
}

/* ============================================================
   GRÁFICO
============================================================ */
function pci_renderChart(info) {
    const ctx = document.getElementById("pci-chart-circuito");
    if (!ctx) return;

    const lista = Object.entries(info)
        .map(([circuito, r]) => ({ circuito, total: r.total }))
        .sort((a,b)=>b.total - a.total);

    const labels = lista.map(o => o.circuito);
    const data = lista.map(o => o.total);

    if (PCI_CHART) PCI_CHART.destroy();

    PCI_CHART = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Firmas por circuito",
                data,
                backgroundColor: "rgba(80, 200, 255, 0.4)",
                borderColor: "rgba(80, 200, 255, 1)",
                borderWidth: 1.5
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
