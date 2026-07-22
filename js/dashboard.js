/* ============================================================
   DASHBOARD — GLASS LUXE 2027 (COMPLETO)
============================================================ */

let DASH_CHART = null;
let DASH_CHART_MENSUAL = null;

/* ============================================================
   HELPERS
============================================================ */
function dash_safeSet(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function diffPct(actual, anterior) {
    if (anterior === 0) return "-";
    return (((actual - anterior) / anterior) * 100).toFixed(1) + "%";
}

/* ============================================================
   INIT DASHBOARD
============================================================ */
async function initDashboard() {
    console.log("📊 initDashboard() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const selActual   = document.getElementById("dash-anio-actual");
    const selAnterior = document.getElementById("dash-anio-anterior");

    if (!selActual || !selAnterior) return;

    const anios = [...new Set(datos.map(f => Number(f.anio)))].sort();

    selActual.innerHTML = "";
    selAnterior.innerHTML = "";

    anios.forEach(a => {
        selActual.innerHTML   += `<option value="${a}">${a}</option>`;
        selAnterior.innerHTML += `<option value="${a}">${a}</option>`;
    });

    selActual.value   = anios[anios.length - 1];
    selAnterior.value = anios[anios.length - 2] || anios[0];

    selActual.onchange   = dashboardActualizar;
    selAnterior.onchange = dashboardActualizar;

    dashboardActualizar();
}

/* ============================================================
   ACTUALIZAR DASHBOARD
============================================================ */
async function dashboardActualizar() {
    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const añoActual   = Number(document.getElementById("dash-anio-actual").value);
    const añoAnterior = Number(document.getElementById("dash-anio-anterior").value);

    const A = calcularResumenAnual(datos, añoActual);
    const B = calcularResumenAnual(datos, añoAnterior);

    actualizarKpisPrincipales(A, B);
    actualizarKpisSecundarios(datos, añoActual);
    generarGraficoComparativo(datos, añoActual, añoAnterior);
    generarGraficoMensual(datos, añoActual);
    generarTablaPaneles(datos, añoActual, añoAnterior);
    generarHighlights(datos, añoActual);
}

/* ============================================================
   RESUMEN ANUAL (YA LO TENÍAS)
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
   KPIS PRINCIPALES
============================================================ */
function actualizarKpisPrincipales(A, B) {
    setText("dash-total-actual",   A.total);
    setText("dash-total-anterior", B.total);
    setText("dash-total-diff",     diffPct(A.total, B.total));

    setText("dash-sla-actual",   A.sla);
    setText("dash-sla-anterior", B.sla);
    setText("dash-sla-diff",     diffPct(Number(A.sla), Number(B.sla)));

    setText("dash-vc-actual",   A.pctVC + "%");
    setText("dash-vc-anterior", B.pctVC + "%");
    setText("dash-vc-diff",     diffPct(Number(A.pctVC), Number(B.pctVC)));
}

/* ============================================================
   KPIS SECUNDARIOS (TOPS)
============================================================ */
function actualizarKpisSecundarios(datos, año) {

    // Top oficina
    const oficinas = {};
    datos.filter(f => Number(f.anio) === año).forEach(f => {
        const o = f.oficina || "Sin oficina";
        oficinas[o] = (oficinas[o] || 0) + 1;
    });
    setText("dash-top-oficina", Object.entries(oficinas).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-");

    // Top circuito
    const circuitos = {};
    datos.filter(f => Number(f.anio) === año).forEach(f => {
        const c = f.circuito || "Externo";
        circuitos[c] = (circuitos[c] || 0) + 1;
    });
    setText("dash-top-circuito", Object.entries(circuitos).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-");

    // Top gestión
    const gestiones = {};
    datos.filter(f => Number(f.anio) === año).forEach(f => {
        const g = f.tipo_provision || "Sin provisión";
        gestiones[g] = (gestiones[g] || 0) + 1;
    });
    setText("dash-top-gestion", Object.entries(gestiones).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-");

    // Top apoderado
    const apoderados = {};
    datos.filter(f => Number(f.anio) === año).forEach(f => {
        const a = f.apoderado || "Sin apoderado";
        apoderados[a] = (apoderados[a] || 0) + 1;
    });
    setText("dash-top-apoderado", Object.entries(apoderados).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-");

    // Top centro que firma
    const centros = {};
    datos.filter(f => Number(f.anio) === año).forEach(f => {
        const c = f.centro || "Sin centro";
        centros[c] = (centros[c] || 0) + 1;
    });
    setText("dash-top-centro", Object.entries(centros).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-");
}

/* ============================================================
   GRÁFICO COMPARATIVO MENSUAL (YA LO TENÍAS)
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
   GRÁFICO MENSUAL DEL AÑO ACTUAL
============================================================ */
function generarGraficoMensual(datos, añoActual) {
    const ctx = document.getElementById("dash-chart-mensual");
    if (!ctx) return;

    const mesesLabels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const arr = Array(12).fill(0);

    datos.forEach(f => {
        if (Number(f.anio) === añoActual) {
            const m = Number(f.mes);
            if (m >= 1 && m <= 12) arr[m - 1]++;
        }
    });

    if (DASH_CHART_MENSUAL) DASH_CHART_MENSUAL.destroy();

    DASH_CHART_MENSUAL = new Chart(ctx, {
        type: "line",
        data: {
            labels: mesesLabels,
            datasets: [{
                label: "Total mensual",
                data: arr,
                borderColor: "rgba(54,162,235,1)",
                backgroundColor: "rgba(54,162,235,0.2)",
                tension: 0.2
            }]
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
   TABLA POR PANEL (YA LA TENÍAS)
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
   HIGHLIGHTS
============================================================ */
function generarHighlights(datos, añoActual) {

    const filtrado = datos.filter(f => Number(f.anio) === añoActual);

    // Mejor mes
    const meses = {};
    filtrado.forEach(f => {
        const m = Number(f.mes);
        meses[m] = (meses[m] || 0) + 1;
    });

    const mejorMes = Object.entries(meses).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-";
    const peorMes  = Object.entries(meses).sort((a,b)=>a[1]-b[1])[0]?.[0] || "-";

    setText("dash-hl-mejor-mes", `🔥 Mejor mes: ${mejorMes}`);
    setText("dash-hl-peor-mes",  `📉 Peor mes: ${peorMes}`);

    // SLA alerta
    const sla = calcularPanelSLA(datos, añoActual);
    if (sla > 10) {
        setText("dash-hl-sla-alerta", `⏱️ SLA alto: ${sla} días`);
    } else {
        setText("dash-hl-sla-alerta", "");
    }

    // VC alerta
    const vcPct = calcularPanelTipoFirma(datos, añoActual);
    if (vcPct < 5) {
        setText("dash-hl-vc-alerta", `✍️ % VC bajo: ${vcPct}%`);
    } else {
        setText("dash-hl-vc-alerta", "");
    }
}

/* ============================================================
   MÉTRICAS POR PANEL (YA LAS TENÍAS)
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
