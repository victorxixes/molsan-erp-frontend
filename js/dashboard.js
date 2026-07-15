/* ============================================================
   DASHBOARD — COMPARATIVA ANUAL 2027 (GLASS LUXE)
============================================================ */

let DASH_CHART = null;
/* ============================================================
   HELPERS PREMIUM
============================================================ */
function dash_safeSet(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
/* ============================================================
   DASHBOARD PREMIUM — KPIs + GRÁFICO
============================================================ */
async function initDashboardPremium() {
    console.log("📊 Dashboard Premium 2027 recalculado");

   // Mes actual del año en curso
const mesActual = new Date().getMonth() + 1; // 1–12

// Solo meses reales y hasta el mes actual
const labels = mesesOrden.slice(0, mesActual).filter(m => datosMes[m] !== undefined);

// Valores reales
const valores = labels.map(m => datosMes[m] || 0);


    /* ============================
       APODERADOS
    ============================ */
    const apAct = window.MP.porApoderado[yAct] || {};
    const apPrev = window.MP.porApoderado[yPrev] || {};

    const totalApAct = Object.values(apAct).reduce((a,b)=>a+b,0);
    const totalApPrev = Object.values(apPrev).reduce((a,b)=>a+b,0);

    const topAp = Object.entries(apAct).sort((a,b)=>b[1]-a[1])[0];

    dash_safeSet("dash-apod-total-2026", totalApAct);
    dash_safeSet("dash-apod-total-2025", totalApPrev);
    dash_safeSet("dash-apod-diff", diffPct(totalApAct, totalApPrev));
    dash_safeSet("dash-apod-top", topAp ? topAp[0] : "-");

    /* ============================
       TIPO FIRMA
    ============================ */
    const tfAct = window.MP.porTipoFirma[yAct] || {};
    const tfPrev = window.MP.porTipoFirma[yPrev] || {};

    const vcAct = tfAct["VideoConferencia"] || 0;
    const vcPrev = tfPrev["VideoConferencia"] || 0;

    const presAct = tfAct["Presencial"] || 0;
    const presPrev = tfPrev["Presencial"] || 0;

    const totalActTF = vcAct + presAct;
    const totalPrevTF = vcPrev + presPrev;

    const pctVCAct = totalActTF ? ((vcAct / totalActTF) * 100).toFixed(1) : "0";
    const pctVCPrev = totalPrevTF ? ((vcPrev / totalPrevTF) * 100).toFixed(1) : "0";

    dash_safeSet("dash-tf-vc-2026", vcAct);
    dash_safeSet("dash-tf-pres-2026", presAct);
    dash_safeSet("dash-tf-vc-pct-2026", pctVCAct + "%");
    dash_safeSet("dash-tf-vc-pct-diff", diffPct(Number(pctVCAct), Number(pctVCPrev)));

    /* ============================
       TIPO GESTIÓN
    ============================ */
    const tgAct = window.MP.porTipoGestion[yAct] || {};
    const tgPrev = window.MP.porTipoGestion[yPrev] || {};

    const conAct = tgAct["Con provisión"] || 0;
    const conPrev = tgPrev["Con provisión"] || 0;

    const sinAct = tgAct["Sin provisión"] || 0;

    dash_safeSet("dash-tg-con-2026", conAct);
    dash_safeSet("dash-tg-sin-2026", sinAct);
    dash_safeSet("dash-tg-ej-con", conAct);
    dash_safeSet("dash-tg-ej-con-diff", diffPct(conAct, conPrev));

    /* ============================
       OFICINAS
    ============================ */
    const ofAct = window.MP.porOficina[yAct] || {};
    const ofPrev = window.MP.porOficina[yPrev] || {};

    const totalOfAct = Object.values(ofAct).reduce((a,b)=>a+b,0);
    const totalOfPrev = Object.values(ofPrev).reduce((a,b)=>a+b,0);

    const topOf = Object.entries(ofAct).sort((a,b)=>b[1]-a[1])[0];

    dash_safeSet("dash-ofi-total-2026", totalOfAct);
    dash_safeSet("dash-ofi-total-2025", totalOfPrev);
    dash_safeSet("dash-ofi-diff", diffPct(totalOfAct, totalOfPrev));
    dash_safeSet("dash-ofi-top", topOf ? topOf[0] : "-");

    /* ============================
       CIRCUITO
    ============================ */
    const ciAct = window.MP.porCircuito[yAct] || {};
    const ciPrev = window.MP.porCircuito[yPrev] || {};

    const totalCiAct = Object.values(ciAct).reduce((a,b)=>a+b,0);
    const totalCiPrev = Object.values(ciPrev).reduce((a,b)=>a+b,0);

    const topCi = Object.entries(ciAct).sort((a,b)=>b[1]-a[1])[0];

    dash_safeSet("dash-circ-total-2026", totalCiAct);
    dash_safeSet("dash-circ-total-2025", totalCiPrev);
    dash_safeSet("dash-circ-diff", diffPct(totalCiAct, totalCiPrev));
    dash_safeSet("dash-circ-top", topCi ? topCi[0] : "-");

    /* ============================
       CENTRO QUE FIRMA
    ============================ */
    const ceAct = window.MP.porCentroQueFirma[yAct] || {};
    const cePrev = window.MP.porCentroQueFirma[yPrev] || {};

    const totalCeAct = Object.values(ceAct).reduce((a,b)=>a+b,0);
    const totalCePrev = Object.values(cePrev).reduce((a,b)=>a+b,0);

    const topCe = Object.entries(ceAct).sort((a,b)=>b[1]-a[1])[0];

    dash_safeSet("dash-centro-total-2026", totalCeAct);
    dash_safeSet("dash-centro-total-2025", totalCePrev);
    dash_safeSet("dash-centro-diff", diffPct(totalCeAct, totalCePrev));
    dash_safeSet("dash-centro-top", topCe ? topCe[0] : "-");

    /* ============================
       SLA
    ============================ */
    const slaActList = window.MP.slaPorAnio[yAct] || [];
    const slaPrevList = window.MP.slaPorAnio[yPrev] || [];

    const slaAct = slaActList.length ? (slaActList.reduce((a,b)=>a+b,0) / slaActList.length).toFixed(1) : "0";
    const slaPrev = slaPrevList.length ? (slaPrevList.reduce((a,b)=>a+b,0) / slaPrevList.length).toFixed(1) : "0";

    dash_safeSet("dash-sla-2026", slaAct);
    dash_safeSet("dash-sla-2025", slaPrev);
    dash_safeSet("dash-sla-diff", diffPct(Number(slaAct), Number(slaPrev)));

    /* ============================
       GRÁFICO — Evolución mensual
    ============================ */
    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const datosMes = window.MP.porMes[yAct] || {};
    const labels = mesesOrden.filter(m => datosMes[m]);
    const valores = labels.map(m => datosMes[m]);

    const ctx = document.getElementById("dp-chart-evolucion");
    if (window.dpChart) window.dpChart.destroy();

    window.dpChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Firmas",
                data: valores,
                borderColor: "#3B82F6",
                backgroundColor: "rgba(59,130,246,0.2)",
                borderWidth: 2,
                tension: 0.2
            }]
        },
        options: {
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}


/* ============================================================
   RESUMEN ANUAL
============================================================ */
function calcularResumenAnual(datos, año) {
    const filtrado = datos.filter(f => Number(f.anio) === año);

    let total = filtrado.length;
    let vc = 0;
    let presencial = 0;
    let sumaDias = 0;
    let cuentaDias = 0;

    filtrado.forEach(f => {
        if (f.tipo_firma === "VideoConferencia") vc++;
        else presencial++;

        const d = Number(f.dias);
        if (d > 0) {
            sumaDias += d;
            cuentaDias++;
        }
    });

    const sla   = cuentaDias ? (sumaDias / cuentaDias).toFixed(1) : "0";
    const pctVC = total ? ((vc / total) * 100).toFixed(1) : "0";

    return { total, vc, presencial, sla, pctVC };
}

/* ============================================================
   DIFERENCIA PORCENTUAL
============================================================ */
function diffPct(actual, anterior) {
    if (anterior === 0) return "-";
    return (((actual - anterior) / anterior) * 100).toFixed(1) + "%";
}

/* ============================================================
   DASHBOARD COMPARATIVO
============================================================ */
async function dashboardComparativa() {
    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const selActual   = document.getElementById("dash-anio-actual");
    const selAnterior = document.getElementById("dash-anio-anterior");

    if (!selActual || !selAnterior) return;

    const añoActual   = Number(selActual.value);
    const añoAnterior = Number(selAnterior.value);

    const A = calcularResumenAnual(datos, añoActual);
    const B = calcularResumenAnual(datos, añoAnterior);

    setText("dash-total-actual",   A.total);
    setText("dash-total-anterior", B.total);
    setText("dash-total-diff",     diffPct(A.total, B.total));

    setText("dash-sla-actual",   A.sla);
    setText("dash-sla-anterior", B.sla);
    setText("dash-sla-diff",     diffPct(Number(A.sla), Number(B.sla)));

    setText("dash-vc-actual",   A.pctVC + "%");
    setText("dash-vc-anterior", B.pctVC + "%");
    setText("dash-vc-diff",     diffPct(Number(A.pctVC), Number(B.pctVC)));

    generarGraficoComparativo(datos, añoActual, añoAnterior);
    generarTablaPaneles(datos, añoActual, añoAnterior);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
}

/* ============================================================
   GRÁFICO COMPARATIVO MENSUAL
============================================================ */
function generarGraficoComparativo(datos, añoActual, añoAnterior) {
    const mesesLabels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

    const porMes = (año) => {
        const arr = Array(12).fill(0);
        datos.forEach(f => {
            if (Number(f.anio) === año) {
                const m = Number(f.mes);
                if (m >= 1 && m <= 12) arr[m - 1]++;
            }
        });
        return arr;
    };

    const dataActual   = porMes(añoActual);
    const dataAnterior = porMes(añoAnterior);

    const ctx = document.getElementById("dash-chart-comparativa");
    if (!ctx) return;

    if (DASH_CHART) DASH_CHART.destroy();

    DASH_CHART = new Chart(ctx, {
        type: "bar",
        data: {
            labels: mesesLabels,
            datasets: [
                {
                    label: añoActual,
                    data: dataActual,
                    backgroundColor: "rgba(80,200,255,0.6)",
                    borderColor: "rgba(80,200,255,1)",
                    borderWidth: 1
                },
                {
                    label: añoAnterior,
                    data: dataAnterior,
                    backgroundColor: "rgba(200,200,200,0.4)",
                    borderColor: "rgba(150,150,150,1)",
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* ============================================================
   TABLA COMPARATIVA POR PANEL
============================================================ */
function generarTablaPaneles(datos, añoActual, añoAnterior) {
    const tbody = document.getElementById("dash-tabla-paneles");
    if (!tbody) return;

    tbody.innerHTML = "";

    const paneles = [
        { nombre: "Panel Anual (total firmas)",          fn: calcularPanelAnual },
        { nombre: "Panel Mensual (hasta mes actual)",    fn: calcularPanelMensual },
        { nombre: "Panel Apoderados (apoderados activos)", fn: calcularPanelApoderados },
        { nombre: "Panel Tipo Firma (VC %)",             fn: calcularPanelTipoFirma },
        { nombre: "Panel Tipo Gestión (Con provisión)",  fn: calcularPanelTipoGestion },
        { nombre: "Panel Oficinas (oficina dominante)",  fn: calcularPanelOficinas },
        { nombre: "Panel Circuito (circuito dominante)", fn: calcularPanelCircuito },
        { nombre: "Panel SLA (SLA medio)",               fn: calcularPanelSLA }
    ];

    paneles.forEach(p => {
        const valActual   = p.fn(datos, añoActual);
        const valAnterior = p.fn(datos, añoAnterior);

        let diff;
        if (typeof valActual === "number" && typeof valAnterior === "number") {
            diff = diffPct(valActual, valAnterior);
        } else {
            diff = "-";
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${valActual}</td>
            <td>${valAnterior}</td>
            <td>${diff}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* ============================================================
   MÉTRICAS POR PANEL
============================================================ */
function calcularPanelAnual(datos, año) {
    return datos.filter(f => Number(f.anio) === año).length;
}

function calcularPanelMensual(datos, año) {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;

    return datos.filter(f =>
        Number(f.anio) === año &&
        Number(f.mes) <= mesActual
    ).length;
}

function calcularPanelApoderados(datos, año) {
    const set = new Set(
        datos
            .filter(f => Number(f.anio) === año)
            .map(f => f.apoderado || "Sin apoderado")
    );
    return set.size;
}

function calcularPanelTipoFirma(datos, año) {
    const filtrado = datos.filter(f => Number(f.anio) === año);
    const total = filtrado.length;
    const vc = filtrado.filter(f => f.tipo_firma === "VideoConferencia").length;

    if (!total) return 0;

    return Number(((vc / total) * 100).toFixed(1));
}

function calcularPanelTipoGestion(datos, año) {
    return datos.filter(f =>
        Number(f.anio) === año &&
        (f.tipo_provision || "").toLowerCase().includes("con")
    ).length;
}

function calcularPanelOficinas(datos, año) {
    const filtrado = datos.filter(f => Number(f.anio) === año);

    const mapa = {};

    filtrado.forEach(f => {
        let oficina = f.oficina || "Sin oficina";

        if (oficina === "5316") {
            oficina = "Cancela";
        } else {
            oficina = "Oficina";
        }

        mapa[oficina] = (mapa[oficina] || 0) + 1;
    });

    let top = "-";
    let max = 0;

    Object.entries(mapa).forEach(([ofi, total]) => {
        if (total > max) {
            max = total;
            top = ofi;
        }
    });

    return top;
}

function calcularPanelCircuito(datos, año) {
    const filtrado = datos.filter(f => Number(f.anio) === año);

    const mapa = {};

    filtrado.forEach(f => {
        const circuito = f.circuito || "Externo";
        mapa[circuito] = (mapa[circuito] || 0) + 1;
    });

    let top = "-";
    let max = 0;

    Object.entries(mapa).forEach(([cir, total]) => {
        if (total > max) {
            max = total;
            top = cir;
        }
    });

    return top;
}

function calcularPanelSLA(datos, año) {
    const filtrado = datos.filter(f => Number(f.anio) === año);

    let suma = 0;
    let cuenta = 0;

    filtrado.forEach(f => {
        const d = Number(f.dias);
        if (d > 0) {
            suma += d;
            cuenta++;
        }
    });

    return cuenta ? Number((suma / cuenta).toFixed(1)) : 0;
}
