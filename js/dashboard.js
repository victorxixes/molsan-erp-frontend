/* ============================================================
   DASHBOARD — GLASS LUXE 2027 (IndexedDB + KPIs reales)
============================================================ */

async function initDashboard() {
    console.log("📊 initDashboard() ejecutado");

    // Verificar que el dashboard está realmente cargado en el DOM
    if (!document.getElementById("kpiTotal")) {
        console.warn("⏳ Dashboard no está visible, cancelando initDashboard()");
        return;
    }

    const datos = await obtenerFirmas(); // ← IndexedDB

    if (!datos || !datos.length) {
        console.warn("Dashboard: no hay datos cargados.");
        const dbg = document.getElementById("debugDashboard");
        if (dbg) dbg.textContent = "Sin datos en histórico.";
        return;
    }

    // Recalcular KPIs y obtenerlos
    await recalcularKPIs();
    const kpis = obtenerKPIs();

    actualizarKPIs(kpis, datos);

    // Evolutivo por año
    generarEvolutivo();
}

/* ============================================================
   PINTAR KPIS EN EL DASHBOARD
============================================================ */

function actualizarKPIs(kpis, datos) {

    const elTotal = document.getElementById("kpiTotal");
    const elHoy = document.getElementById("kpiHoy");
    const elMedia = document.getElementById("kpiMedia");
    const elVC = document.getElementById("kpiVC");
    const elPresencial = document.getElementById("kpiPresencial");

    if (!elTotal || !elHoy || !elMedia || !elVC || !elPresencial) {
        console.warn("❌ No se encontraron los elementos KPI en el HTML");
        return;
    }

    const total = kpis.total_registros || 0;
    const mediaDias = kpis.media_dias || 0;
    const vc = kpis.por_tipo_firma?.VideoConferencia ?? 0;
    const presencial = kpis.por_tipo_firma?.Presencial ?? 0;

    // Hoy en formato dd/mm/aaaa (como tus fechas normalizadas)
    const hoy = new Date();
    const d = String(hoy.getDate()).padStart(2, "0");
    const m = String(hoy.getMonth() + 1).padStart(2, "0");
    const y = hoy.getFullYear();
    const hoyES = `${d}/${m}/${y}`;

    const firmasHoy = datos.filter(f => f.fecha_protocolo === hoyES).length;

    elTotal.textContent = total.toLocaleString("es-ES");
    elMedia.textContent = mediaDias.toFixed(2);
    elVC.textContent = vc.toLocaleString("es-ES");
    elPresencial.textContent = presencial.toLocaleString("es-ES");
    elHoy.textContent = firmasHoy.toLocaleString("es-ES");

    const dbg = document.getElementById("debugDashboard");
    if (dbg) {
        dbg.textContent = "Muestras de datos:\n" + JSON.stringify(datos.slice(0, 5), null, 2);
    }

    // Gráficos premium
    crearChartFirmasMes(datos);
    crearChartTipoFirma(kpis);
}

/* ============================================================
   EVOLUTIVO POR AÑO — AUTOMÁTICO
============================================================ */

async function generarEvolutivo() {
    const tabla = document.getElementById("tabla-evolutivo");
    if (!tabla) {
        console.warn("⏳ tabla-evolutivo no existe en el DOM, se omite generarEvolutivo()");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const estructura = {}; // { año: { mes: total } }

    datos.forEach(f => {
        const año = Number(f.anio);
        const mes = Number(f.mes);
        if (!año || !mes) return;

        if (!estructura[año]) estructura[año] = {};
        if (!estructura[año][mes]) estructura[año][mes] = 0;

        estructura[año][mes] += 1; // 1 fila = 1 firma
    });

    const años = Object.keys(estructura).map(Number).sort((a,b)=>a-b);

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    let html = `<thead><tr><th>Mes</th>`;

    años.forEach(a => html += `<th>${a}</th>`);
    html += `<th>Total</th>`;

    años.slice(1).forEach(a => html += `<th>% ${a}</th>`);
    html += `</tr></thead><tbody>`;

    const totalesAño = {};

    meses.forEach((mesNombre, i) => {
        const mesNum = i + 1;
        html += `<tr><td><b>${mesNombre}</b></td>`;

        let totalMes = 0;

        años.forEach(a => {
            const valor = estructura[a]?.[mesNum] || 0;
            totalMes += valor;

            if (!totalesAño[a]) totalesAño[a] = 0;
            totalesAño[a] += valor;

            html += `<td>${valor.toLocaleString("es-ES")}</td>`;
        });

        html += `<td><b>${totalMes.toLocaleString("es-ES")}</b></td>`;

        años.slice(1).forEach((a, idx) => {
            const prev = estructura[años[idx]]?.[mesNum] || 0;
            const curr = estructura[a]?.[mesNum] || 0;

            const diff = prev === 0 ? "-" :
                (((curr - prev) / prev) * 100).toFixed(2) + "%";

            html += `<td>${diff}</td>`;
        });

        html += `</tr>`;
    });

    html += `<tr><td><b>Total general</b></td>`;
    años.forEach(a => html += `<td><b>${totalesAño[a].toLocaleString("es-ES")}</b></td>`);

    const totalGlobal = Object.values(totalesAño).reduce((a,b)=>a+b,0);
    html += `<td><b>${totalGlobal.toLocaleString("es-ES")}</b></td>`;

    años.slice(1).forEach((a, idx) => {
        const prev = totalesAño[años[idx]];
        const curr = totalesAño[a];
        const diff = prev === 0 ? "-" :
            (((curr - prev) / prev) * 100).toFixed(2) + "%";
        html += `<td>${diff}</td>`;
    });

    html += `</tr></tbody>`;

    tabla.innerHTML = html;

    generarGraficosEvolutivo(años, estructura);
}

/* ============================================================
   GRÁFICOS EVOLUTIVO (Chart.js)
============================================================ */

function generarGraficosEvolutivo(años, estructura) {
    const canvasLineas = document.getElementById("graficoEvolutivoLineas");
    const canvasBarras = document.getElementById("graficoEvolutivoBarras");

    if (!canvasLineas || !canvasBarras) {
        console.warn("⏳ Canvas de gráficos evolutivos no encontrados, se omite generarGraficosEvolutivo()");
        return;
    }

    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

    const datasets = años.map(a => ({
        label: a,
        data: meses.map((_, i) => estructura[a]?.[i+1] || 0),
        borderWidth: 2,
        fill: false
    }));

    new Chart(canvasLineas, {
        type: "line",
        data: { labels: meses, datasets }
    });

    new Chart(canvasBarras, {
        type: "bar",
        data: { labels: meses, datasets }
    });
}

/* ============================================================
   EXPORTAR / IMPRIMIR
============================================================ */

function imprimirEvolutivo() {
    window.print();
}

function exportarEvolutivoCSV() {
    const tabla = document.getElementById("tabla-evolutivo");
    if (!tabla) return;

    const texto = tabla.innerText;
    const blob = new Blob([texto], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "evolutivo.csv";
    a.click();
}

/* ============================================================
   GRÁFICO: FIRMAS POR MES
============================================================ */

function crearChartFirmasMes(datos) {
    const ctx = document.getElementById("chartFirmasMes");
    if (!ctx) return;

    const estructura = {}; // { mes: total }
    datos.forEach(f => {
        const mes = Number(f.mes);
        if (!mes) return;
        if (!estructura[mes]) estructura[mes] = 0;
        estructura[mes] += 1;
    });

    const labels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const data = labels.map((_, i) => estructura[i+1] || 0);

    const gctx = ctx.getContext("2d");
    const gradient = gctx.createLinearGradient(0, 0, 0, ctx.height);
    gradient.addColorStop(0, "rgba(80,180,255,0.9)");
    gradient.addColorStop(1, "rgba(80,180,255,0.1)");

    new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Firmas por mes",
                data,
                borderColor: "rgba(80,180,255,1)",
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: "#FFFFFF" } },
                y: { ticks: { color: "#FFFFFF" } }
            }
        }
    });
}

/* ============================================================
   GRÁFICO: TIPO DE FIRMA
============================================================ */

function crearChartTipoFirma(kpis) {
    const ctx = document.getElementById("chartTipoFirma");
    if (!ctx) return;

    const vc = kpis.por_tipo_firma?.VideoConferencia ?? 0;
    const presencial = kpis.por_tipo_firma?.Presencial ?? 0;

    const gctx = ctx.getContext("2d");
    const gradientVC = gctx.createLinearGradient(0, 0, 0, ctx.height);
    gradientVC.addColorStop(0, "rgba(120,220,180,0.9)");
    gradientVC.addColorStop(1, "rgba(120,220,180,0.1)");

    const gradientPres = gctx.createLinearGradient(0, 0, 0, ctx.height);
    gradientPres.addColorStop(0, "rgba(255,180,80,0.9)");
    gradientPres.addColorStop(1, "rgba(255,180,80,0.1)");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Videoconferencia", "Presencial"],
            datasets: [{
                data: [vc, presencial],
                backgroundColor: [gradientVC, gradientPres],
                borderColor: ["rgba(120,220,180,1)", "rgba(255,180,80,1)"],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: "#FFFFFF" } },
                y: { ticks: { color: "#FFFFFF" } }
            }
        }
    });
}
