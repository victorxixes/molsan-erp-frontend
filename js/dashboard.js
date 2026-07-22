/* ============================================================
   DASHBOARD — GLASS LUXE 2027 (VERSIÓN FINAL)
============================================================ */

let DASH_CHART_COMPARATIVA = null;
let DASH_CHART_MENSUAL = null;

/* Helper seguro */
function dashSet(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/* ============================================================
   INIT DASHBOARD
============================================================ */
async function initDashboard() {
    console.log("📊 initDashboard() ejecutado");

    const selActual = document.getElementById("dash-anio-actual");
    const selAnterior = document.getElementById("dash-anio-anterior");

    if (!selActual || !selAnterior) {
        console.warn("Dashboard no está en el DOM todavía.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const anios = [...new Set(datos.map(f => Number(f.anio)))].sort((a,b)=>a-b);

    selActual.innerHTML = "";
    selAnterior.innerHTML = "";

    anios.forEach(a => {
        const opt1 = document.createElement("option");
        opt1.value = a;
        opt1.textContent = a;
        selActual.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = a;
        opt2.textContent = a;
        selAnterior.appendChild(opt2);
    });

    selActual.value = anios[anios.length - 1];
    selAnterior.value = anios[anios.length - 2] || anios[0];

    selActual.addEventListener("change", dashboardActualizar);
    selAnterior.addEventListener("change", dashboardActualizar);

    dashboardActualizar();
}

/* ============================================================
   ACTUALIZAR DASHBOARD
============================================================ */
async function dashboardActualizar() {
    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const añoActual = Number(document.getElementById("dash-anio-actual").value);
    const añoAnterior = Number(document.getElementById("dash-anio-anterior").value);

    const A = calcularResumenAnual(datos, añoActual);
    const B = calcularResumenAnual(datos, añoAnterior);

    /* KPIs principales */
    dashSet("dash-total-actual", A.total);
    dashSet("dash-total-anterior", B.total);
    dashSet("dash-total-diff", diffPct(A.total, B.total));

    dashSet("dash-sla-actual", A.sla);
    dashSet("dash-sla-anterior", B.sla);
    dashSet("dash-sla-diff", diffPct(Number(A.sla), Number(B.sla)));

    dashSet("dash-vc-actual", A.pctVC + "%");
    dashSet("dash-vc-anterior", B.pctVC + "%");
    dashSet("dash-vc-diff", diffPct(Number(A.pctVC), Number(B.pctVC)));

    dashSet("dash-top-mes-actual", A.topMes);
    dashSet("dash-top-mes-anterior", B.topMes);
    dashSet("dash-top-mes-diff", "-");

    /* KPIs secundarios */
    dashSet("dash-top-oficina", kpi_topOficina(añoActual));
    dashSet("dash-top-circuito", kpi_topCircuito(añoActual));
    dashSet("dash-top-gestion", await kpi_topGestion(añoActual));
    dashSet("dash-top-apoderado", kpi_topApoderado());
    dashSet("dash-top-centro", kpi_topCentro(añoActual));

    /* Highlights */
    generarHighlights(datos, añoActual);

    /* Gráficos */
    generarGraficoComparativa(datos, añoActual, añoAnterior);
    generarGraficoMensual(datos, añoActual);

    /* Tabla paneles */
    generarTablaPaneles(datos, añoActual, añoAnterior);
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

    const meses = {};

    filtrado.forEach(f => {
        if (f.tipo_firma === "VideoConferencia") vc++;
        else presencial++;

        const d = Number(f.dias);
        if (d > 0) {
            sumaDias += d;
            cuentaDias++;
        }

        const m = Number(f.mes);
        if (!meses[m]) meses[m] = 0;
        meses[m]++;
    });

    const sla = cuentaDias ? (sumaDias / cuentaDias).toFixed(1) : "0";
    const pctVC = total ? ((vc / total) * 100).toFixed(1) : "0";

    let topMes = "-";
    let max = 0;
    Object.entries(meses).forEach(([mes, tot]) => {
        if (tot > max) {
            max = tot;
            topMes = mes;
        }
    });

    return { total, vc, presencial, sla, pctVC, topMes };
}

/* ============================================================
   DIFERENCIA PORCENTUAL
============================================================ */
function diffPct(actual, anterior) {
    if (anterior === 0) return "-";
    return (((actual - anterior) / anterior) * 100).toFixed(1) + "%";
}

/* ============================================================
   HIGHLIGHTS
============================================================ */
function generarHighlights(datos, año) {
    const filtrado = datos.filter(f => Number(f.anio) === año);

    const meses = {};
    filtrado.forEach(f => {
        const m = Number(f.mes);
        meses[m] = (meses[m] || 0) + 1;
    });

    const arr = Object.entries(meses);

    if (arr.length === 0) {
        dashSet("dash-hl-mejor-mes", "🔥 Mejor mes: -");
        dashSet("dash-hl-peor-mes", "📉 Peor mes: -");
        return;
    }

    const mejor = arr.sort((a,b)=>b[1]-a[1])[0];
    const peor = arr.sort((a,b)=>a[1]-b[1])[0];

    dashSet("dash-hl-mejor-mes", `🔥 Mejor mes: ${mejor[0]} (${mejor[1]} firmas)`);
    dashSet("dash-hl-peor-mes", `📉 Peor mes: ${peor[0]} (${peor[1]} firmas)`);

    dashSet("dash-hl-sla-alerta", "");
    dashSet("dash-hl-vc-alerta", "");
}

/* ============================================================
   GRÁFICO COMPARATIVA ANUAL
============================================================ */
function generarGraficoComparativa(datos, añoActual, añoAnterior) {
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

    const dataActual = porMes(añoActual);
    const dataAnterior = porMes(añoAnterior);

    const ctx = document.getElementById("dash-chart-comparativa");
    if (!ctx) return;

    if (DASH_CHART_COMPARATIVA) DASH_CHART_COMPARATIVA.destroy();

    DASH_CHART_COMPARATIVA = new Chart(ctx, {
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
   GRÁFICO MENSUAL
============================================================ */
function generarGraficoMensual(datos, año) {
    const mesesLabels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

    const arr = Array(12).fill(0);
    datos.forEach(f => {
        if (Number(f.anio) === año) {
            const m = Number(f.mes);
            if (m >= 1 && m <= 12) arr[m - 1]++;
        }
    });

    const ctx = document.getElementById("dash-chart-mensual");
    if (!ctx) return;

    if (DASH_CHART_MENSUAL) DASH_CHART_MENSUAL.destroy();

    DASH_CHART_MENSUAL = new Chart(ctx, {
        type: "line",
        data: {
            labels: mesesLabels,
            datasets: [{
                label: "Firmas",
                data: arr,
                borderColor: "rgba(80,200,255,1)",
                backgroundColor: "rgba(80,200,255,0.2)",
                borderWidth: 1.5,
                tension: 0.2
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

/* ============================================================
   TABLA COMPARATIVA POR PANEL
============================================================ */
function generarTablaPaneles(datos, añoActual, añoAnterior) {
    const tbody = document.getElementById("dash-tabla-paneles");
    if (!tbody) return;

    tbody.innerHTML = "";

    const paneles = [
        { nombre: "Panel Anual (total firmas)", fn: calcularPanelAnual },
        { nombre: "Panel Mensual (hasta mes actual)", fn: calcularPanelMensual },
        { nombre: "Panel Apoderados (apoderados activos)", fn: calcularPanelApoderados },
        { nombre: "Panel Tipo Firma (VC %)", fn: calcularPanelTipoFirma },
        { nombre: "Panel Tipo Gestión (Con provisión)", fn: calcularPanelTipoGestion },
        { nombre: "Panel Oficinas (oficina dominante)", fn: calcularPanelOficinas },
        { nombre: "Panel Circuito (circuito dominante)", fn: calcularPanelCircuito },
        { nombre: "Panel SLA (SLA medio)", fn: calcularPanelSLA }
    ];

    paneles.forEach(p => {
        const valActual = p.fn(datos, añoActual);
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
