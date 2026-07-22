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
   DASHBOARD PREMIUM — DESACTIVADO COMPLETAMENTE
============================================================ */
async function initDashboardPremium() {
    console.log("📊 Dashboard Premium 2027 desactivado (Opción D)");
    return; // ← Esto elimina el bloque “derados” de todos los paneles
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
