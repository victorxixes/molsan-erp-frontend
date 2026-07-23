/* ============================================================
   INFORME EVOLUTIVO — TABLA COMPLETA 2020–2026 (PREMIUM 2027)
============================================================ */

console.log("🔥 informes-evolutivo.js cargado");

const MESES_ORDEN = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

async function initInformeEvolutivo() {

    console.log("🔥 initInformeEvolutivo ejecutado");

    if (window.__EVO_RUNNING__) return;
    window.__EVO_RUNNING__ = true;

    try {
        const tabla = document.getElementById("evo-tabla");
        const resumen = document.getElementById("evo-resumen");
        const contenedorFinal = document.getElementById("evo-final");

        if (!tabla || !resumen || !contenedorFinal) return;

        tabla.innerHTML = "";

        // ⭐ Parche Premium — fuerza al navegador a respetar el THEAD
        const thead = tabla.parentElement.querySelector("thead");
        if (thead) thead.innerHTML = thead.innerHTML;

        const datos = await obtenerFirmas();

        const totalesPorMesYAnio = {};
        const totalesPorAnio = {};

        let ultimoAnio = 0;

        for (const f of datos) {

            const anio = Number(f.anio);
            const mes = f.mes;

            if (!MESES_ORDEN.includes(mes)) continue;

            if (anio > ultimoAnio) ultimoAnio = anio;

            totalesPorAnio[anio] = (totalesPorAnio[anio] || 0) + 1;

            if (!totalesPorMesYAnio[mes]) totalesPorMesYAnio[mes] = {};
            totalesPorMesYAnio[mes][anio] = (totalesPorMesYAnio[mes][anio] || 0) + 1;
        }

        let mesesConDatos = Object.keys(totalesPorMesYAnio)
            .filter(m => totalesPorMesYAnio[m][ultimoAnio] > 0)
            .sort((a,b) => MESES_ORDEN.indexOf(a) - MESES_ORDEN.indexOf(b));

        // ============================================================
        // 3) FILAS POR MES
        // ============================================================

        mesesConDatos.forEach(mes => {

            const fila = document.createElement("tr");

            const valores = [];
            const porcentajes = [];

            for (let anio = 2020; anio <= 2026; anio++) {
                valores.push(totalesPorMesYAnio[mes][anio] || 0);
            }

            const total = valores.reduce((a,b)=>a+b,0);

            for (let i = 1; i < valores.length; i++) {
                const prev = valores[i-1];
                const act  = valores[i];
                const pct  = prev ? ((act - prev) / prev * 100) : 0;
                porcentajes.push(pct);
            }

            const pctTotal = valores[0] ? ((valores[valores.length-1] - valores[0]) / valores[0] * 100) : 0;

            fila.innerHTML = `
                <td>${mes}</td>
                ${valores.map(v => `<td class="center">${v}</td>`).join("")}
                <td class="center">${total}</td>
                ${porcentajes.map(p => `<td class="center">${p.toFixed(2)}%</td>`).join("")}
                <td class="center">${pctTotal.toFixed(2)}%</td>
            `;

            tabla.appendChild(fila);
        });

        // ============================================================
        // 4) TOTAL POR AÑO
        // ============================================================

        const filaTotal = document.createElement("tr");
        filaTotal.classList.add("fila-total");

        const totalesAnioArray = [];
        for (let anio = 2020; anio <= 2026; anio++) {
            totalesAnioArray.push(totalesPorAnio[anio] || 0);
        }

        const totalGeneral = totalesAnioArray.reduce((a,b)=>a+b,0);

        const pctGeneral = [];
        for (let i = 1; i < totalesAnioArray.length; i++) {
            const prev = totalesAnioArray[i-1];
            const act  = totalesAnioArray[i];
            pctGeneral.push(prev ? ((act - prev) / prev * 100) : 0);
        }

        const pctTotalGeneral = totalesAnioArray[0]
            ? ((totalesAnioArray[totalesAnioArray.length-1] - totalesAnioArray[0]) / totalesAnioArray[0] * 100)
            : 0;

        filaTotal.innerHTML = `
            <td><strong>Total general</strong></td>
            ${totalesAnioArray.map(t => `<td class="center"><strong>${t}</strong></td>`).join("")}
            <td class="center"><strong>${totalGeneral}</strong></td>
            ${pctGeneral.map(p => `<td class="center"><strong>${p.toFixed(2)}%</strong></td>`).join("")}
            <td class="center"><strong>${pctTotalGeneral.toFixed(2)}%</strong></td>
        `;

        tabla.appendChild(filaTotal);

     // ============================================================
// 5) TOTAL HASTA ÚLTIMO MES REAL (SIN % TOTAL)
// ============================================================

const ultimoMesReal = mesesConDatos[mesesConDatos.length - 1];
const mesActualIdx = MESES_ORDEN.indexOf(ultimoMesReal);

const totalesHasta = [];

for (let anio = 2020; anio <= ultimoAnio; anio++) {

    let suma = 0;

    for (let i = 0; i <= mesActualIdx; i++) {
        const mes = MESES_ORDEN[i];
        suma += (totalesPorMesYAnio[mes]?.[anio] || 0);
    }

    totalesHasta.push(suma);
}

// % año a año (2021–2026)
const pctHasta = [];
for (let i = 1; i < totalesHasta.length; i++) {
    const prev = totalesHasta[i-1];
    const act  = totalesHasta[i];
    pctHasta.push(prev ? ((act - prev) / prev * 100) : 0);
}

// ❌ Eliminado: pctTotalHasta

const filaHasta = document.createElement("tr");
filaHasta.classList.add("fila-total");

filaHasta.innerHTML = `
    <td><strong>Hasta ${ultimoMesReal}</strong></td>
    ${totalesHasta.map(t => `<td class="center"><strong>${t}</strong></td>`).join("")}
    <td></td>
    ${pctHasta.map(p => `<td class="center"><strong>${p.toFixed(2)}%</strong></td>`).join("")}
`;

tabla.appendChild(filaHasta);

// ============================================================
// 6) RESUMEN (SIN % TOTAL)
// ============================================================

// ❌ Eliminado: resumen con pctTotalHasta
resumen.textContent = `Evolución año a año: ${pctHasta.map(p => p.toFixed(2) + "%").join(" | ")}`;

contenedorFinal.innerHTML = `
    <div class="card-glass mt-20">
        <strong>Hasta ${ultimoMesReal}</strong><br>
        ${totalesHasta.join(" | ")}<br><br>
        <strong>% Evolución año a año:</strong><br>
        ${pctHasta.map(p => p.toFixed(2) + "%").join(" | ")}
    </div>
`;

// ============================================================
// 7) GRÁFICOS PREMIUM 2027
// ============================================================

evo_renderGraficos(totalesPorMesYAnio, totalesPorAnio);

} finally {
    setTimeout(() => {
        window.__EVO_RUNNING__ = false;
    }, 500);
}
}

/* ============================================================
   FUNCIÓN DE GRÁFICOS PREMIUM 2027
============================================================ */
function evo_renderGraficos(totalesPorMesYAnio, totalesPorAnio) {

    const meses = MESES_ORDEN;
    const anios = [2020,2021,2022,2023,2024,2025,2026];

    /* --------------------------------------------
       1) Evolución anual comparada (líneas)
    -------------------------------------------- */
    const ctxLine = document.getElementById("evo-chart-line");
    if (ctxLine) {
        const datasets = anios.map((a, idx) => ({
            label: a,
            data: meses.map(m => totalesPorMesYAnio[m]?.[a] || 0),
            borderColor: `hsl(${idx*50},70%,50%)`,
            backgroundColor: `hsla(${idx*50},70%,50%,0.2)`,
            borderWidth: 2,
            tension: 0.3
        }));

        new Chart(ctxLine, {
            type: "line",
            data: { labels: meses, datasets },
            options: { responsive: true, plugins: { legend: { position: "bottom" }} }
        });
    }

    /* --------------------------------------------
       2) Ranking anual total (barras)
    -------------------------------------------- */
    const ctxRank = document.getElementById("evo-chart-ranking");
    if (ctxRank) {
        const totales = anios.map(a => totalesPorAnio[a] || 0);

        new Chart(ctxRank, {
            type: "bar",
            data: {
                labels: anios,
                datasets: [{
                    label: "Total anual",
                    data: totales,
                    backgroundColor: "rgba(80,200,255,0.5)",
                    borderColor: "rgba(80,200,255,1)",
                    borderWidth: 1.5
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false }} }
        });
    }

    /* --------------------------------------------
       3) Heatmap mensual
    -------------------------------------------- */
    const ctxHeat = document.getElementById("evo-chart-heatmap");
    if (ctxHeat) {
        const datasets = anios.map((a, idx) => ({
            label: a,
            data: meses.map(m => totalesPorMesYAnio[m]?.[a] || 0),
            backgroundColor: meses.map(m => {
                const v = totalesPorMesYAnio[m]?.[a] || 0;
                const max = Math.max(...meses.map(mm => totalesPorMesYAnio[mm]?.[a] || 0));
                const pct = max ? v / max : 0;
                return `rgba(255,0,0,${pct})`;
            })
        }));

        new Chart(ctxHeat, {
            type: "bar",
            data: { labels: meses, datasets },
            options: { indexAxis: "y", responsive: true }
        });
    }

    /* --------------------------------------------
       4) % Evolutivo año a año
    -------------------------------------------- */
    const ctxPercent = document.getElementById("evo-chart-percent");
    if (ctxPercent) {
        const totales = anios.map(a => totalesPorAnio[a] || 0);
        const pct = [];

        for (let i = 1; i < totales.length; i++) {
            const prev = totales[i-1];
            const curr = totales[i];
            pct.push(prev ? ((curr - prev) / prev * 100).toFixed(1) : 0);
        }

        new Chart(ctxPercent, {
            type: "line",
            data: {
                labels: anios.slice(1),
                datasets: [{
                    label: "% Evolutivo",
                    data: pct,
                    borderColor: "rgba(255,120,80,1)",
                    backgroundColor: "rgba(255,120,80,0.3)",
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false }} }
        });
    }
}
