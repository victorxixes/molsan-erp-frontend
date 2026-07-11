/* ============================================================
   DASHBOARD — COMPARATIVA ANUAL 2027
============================================================ */

async function initDashboard() {
    console.log("📊 initDashboard() — Comparativa Anual");

    if (!document.getElementById("dash-anio-actual")) {
        console.warn("⏳ Dashboard comparativo no está en el DOM");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    // Obtener años disponibles
    const años = [...new Set(datos.map(f => Number(f.anio)))].sort((a,b)=>a-b);

    const selActual = document.getElementById("dash-anio-actual");
    const selAnterior = document.getElementById("dash-anio-anterior");

    selActual.innerHTML = "";
    selAnterior.innerHTML = "";

    años.forEach(a => {
        selActual.innerHTML += `<option value="${a}">${a}</option>`;
        selAnterior.innerHTML += `<option value="${a}">${a}</option>`;
    });

    // Seleccionar último año y el anterior
    selActual.value = años[años.length - 1];
    selAnterior.value = años[años.length - 2] ?? años[años.length - 1];

    selActual.addEventListener("change", dashboardComparativa);
    selAnterior.addEventListener("change", dashboardComparativa);

    dashboardComparativa();
}

/* ============================================================
   RESUMEN ANUAL
============================================================ */

function calcularResumenAnual(datos, año) {
    const filtrado = datos.filter(f => Number(f.anio) === año);

    let total = filtrado.length;
    let vc = filtrado.filter(f => f.tipo_firma === "VideoConferencia").length;
    let presencial = filtrado.filter(f => f.tipo_firma === "Presencial").length;

    let sumaDias = 0;
    let cuentaDias = 0;

    filtrado.forEach(f => {
        const d = Number(f.dias);
        if (d > 0) {
            sumaDias += d;
            cuentaDias++;
        }
    });

    const sla = cuentaDias ? (sumaDias / cuentaDias).toFixed(1) : "0";
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

    const añoActual = Number(document.getElementById("dash-anio-actual").value);
    const añoAnterior = Number(document.getElementById("dash-anio-anterior").value);

    const A = calcularResumenAnual(datos, añoActual);
    const B = calcularResumenAnual(datos, añoAnterior);

    // KPIs
    document.getElementById("dash-total-actual").textContent = A.total;
    document.getElementById("dash-total-anterior").textContent = B.total;
    document.getElementById("dash-total-diff").textContent = diffPct(A.total, B.total);

    document.getElementById("dash-sla-actual").textContent = A.sla;
    document.getElementById("dash-sla-anterior").textContent = B.sla;
    document.getElementById("dash-sla-diff").textContent = diffPct(A.sla, B.sla);

    document.getElementById("dash-vc-actual").textContent = A.pctVC + "%";
    document.getElementById("dash-vc-anterior").textContent = B.pctVC + "%";
    document.getElementById("dash-vc-diff").textContent = diffPct(A.pctVC, B.pctVC);

    // Gráfico comparativo
    generarGraficoComparativo(datos, añoActual, añoAnterior);

    // Tabla comparativa por panel
    generarTablaPaneles(datos, añoActual, añoAnterior);
}

/* ============================================================
   GRÁFICO COMPARATIVO
============================================================ */

function generarGraficoComparativo(datos, añoActual, añoAnterior) {
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

    const porMes = (año) => {
        const arr = Array(12).fill(0);
        datos.forEach(f => {
            if (Number(f.anio) === año) {
                arr[Number(f.mes)-1]++;
            }
        });
        return arr;
    };

    const A = porMes(añoActual);
    const B = porMes(añoAnterior);

    const ctx = document.getElementById("dash-chart-comparativa");
    if (!ctx) return;

    if (window.dashChart) window.dashChart.destroy();

    window.dashChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: meses,
            datasets: [
                {
                    label: añoActual,
                    data: A,
                    backgroundColor: "rgba(80,200,255,0.6)"
                },
                {
                    label: añoAnterior,
                    data: B,
                    backgroundColor: "rgba(200,200,200,0.4)"
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } }
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
        { nombre: "Anual", fn: calcularPanelAnual },
        { nombre: "Mensual", fn: calcularPanelMensual },
        { nombre: "Apoderados", fn: calcularPanelApoderados },
        { nombre: "Tipo Firma (VC%)", fn: calcularPanelTipoFirma },
        { nombre: "Tipo Gestión (Con provisión)", fn: calcularPanelTipoGestion },
        { nombre: "Oficinas", fn: calcularPanelOficinas },
        { nombre: "Circuito", fn: calcularPanelCircuito },
        { nombre: "SLA", fn: calcularPanelSLA }
    ];

    paneles.forEach(p => {
        const A = p.fn(datos, añoActual);
        const B = p.fn(datos, añoAnterior);
        const diff = diffPct(A, B);

        tbody.innerHTML += `
            <tr>
                <td>${p.nombre}</td>
                <td>${A}</td>
                <td>${B}</td>
                <td>${diff}</td>
            </tr>
        `;
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
    return datos.filter(f => Number(f.anio) === año).length;
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
    return datos.filter(f => Number(f.anio) === año).length;
}

function calcularPanelCircuito(datos, año) {
    return datos.filter(f => Number(f.anio) === año).length;
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
