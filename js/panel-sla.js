/* ============================================================
   PANEL EVOLUTIVO — PREMIUM 2027 (2020–2026)
============================================================ */

let EVO_CHART_LINE = null;
let EVO_CHART_RANKING = null;
let EVO_CHART_HEATMAP = null;
let EVO_CHART_PERCENT = null;

/* ============================================================
   INIT
============================================================ */
async function initInformeEvolutivo() {
    console.log("📈 initInformeEvolutivo() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const agrupado = evo_groupByAnio(datos);

    evo_renderTabla(agrupado);
    evo_renderGraficos(agrupado);
}

/* ============================================================
   AGRUPAR POR AÑO → MES → TOTAL
============================================================ */
function evo_groupByAnio(datos) {

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        const mes = (f.mes || "").toLowerCase().trim();
        const idx = meses.indexOf(mes);

        if (!anio || idx === -1) continue;

        if (!map[anio]) {
            map[anio] = meses.map(() => 0);
        }

        map[anio][idx]++;
    }

    return map;
}

/* ============================================================
   TABLA EVOLUTIVA 2020–2026
============================================================ */
function evo_renderTabla(map) {

    const tbody = document.getElementById("evo-tabla");
    tbody.innerHTML = "";

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const anios = [2020,2021,2022,2023,2024,2025,2026];

    for (let i = 0; i < meses.length; i++) {

        const fila = document.createElement("tr");

        const totalesAnio = anios.map(a => map[a] ? map[a][i] : 0);
        const totalMes = totalesAnio.reduce((acc,v)=>acc+v,0);

        const pct = [];
        for (let j = 1; j < anios.length; j++) {
            const prev = map[anios[j-1]] ? map[anios[j-1]][i] : 0;
            const curr = map[anios[j]] ? map[anios[j]][i] : 0;
            const p = prev ? ((curr - prev) / prev * 100).toFixed(1) + "%" : "0%";
            pct.push(p);
        }

        const pctTotal = totalMes ? ((totalMes / totalesAnio[0]) * 100).toFixed(1) + "%" : "0%";

        fila.innerHTML = `
            <td>${meses[i]}</td>
            ${totalesAnio.map(v => `<td>${v}</td>`).join("")}
            <td>${totalMes}</td>
            ${pct.map(p => `<td>${p}</td>`).join("")}
            <td>${pctTotal}</td>
        `;

        tbody.appendChild(fila);
    }
}

/* ============================================================
   GRÁFICOS PREMIUM 2027
============================================================ */
function evo_renderGraficos(map) {

    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const anios = [2020,2021,2022,2023,2024,2025,2026];

    /* ============================================================
       1️⃣ Evolución anual comparada (líneas)
    ============================================================= */

    const ctxLine = document.getElementById("evo-chart-line");

    if (EVO_CHART_LINE) EVO_CHART_LINE.destroy();

    EVO_CHART_LINE = new Chart(ctxLine, {
        type: "line",
        data: {
            labels: meses,
            datasets: anios.map((a, idx) => ({
                label: a,
                data: map[a] || meses.map(()=>0),
                borderColor: `hsl(${idx*50},70%,50%)`,
                backgroundColor: `hsla(${idx*50},70%,50%,0.2)`,
                borderWidth: 2,
                tension: 0.3
            }))
        },
        options: {
            responsive: true,
            plugins: { legend: { position: "bottom" }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });

    /* ============================================================
       2️⃣ Ranking anual total (barras)
    ============================================================= */

    const totalesAnio = anios.map(a =>
        map[a] ? map[a].reduce((acc,v)=>acc+v,0) : 0
    );

    const ctxRank = document.getElementById("evo-chart-ranking");

    if (EVO_CHART_RANKING) EVO_CHART_RANKING.destroy();

    EVO_CHART_RANKING = new Chart(ctxRank, {
        type: "bar",
        data: {
            labels: anios,
            datasets: [{
                label: "Total anual",
                data: totalesAnio,
                backgroundColor: "rgba(80,200,255,0.5)",
                borderColor: "rgba(80,200,255,1)",
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

    /* ============================================================
       3️⃣ Heatmap mensual (intensidad)
    ============================================================= */

    const ctxHeat = document.getElementById("evo-chart-heatmap");

    if (EVO_CHART_HEATMAP) EVO_CHART_HEATMAP.destroy();

    const heatData = {
        labels: meses,
        datasets: anios.map((a, idx) => ({
            label: a,
            data: map[a] || meses.map(()=>0),
            backgroundColor: map[a].map(v => {
                const pct = v / Math.max(...map[a]) || 0;
                return `rgba(255,0,0,${pct})`;
            }),
            borderWidth: 1
        }))
    };

    EVO_CHART_HEATMAP = new Chart(ctxHeat, {
        type: "bar",
        data: heatData,
        options: {
            indexAxis: "y",
            responsive: true,
            plugins: { legend: { position: "right" }},
            scales: {
                x: { stacked: true, ticks: { color: "#111" }},
                y: { stacked: true, ticks: { color: "#111" }}
            }
        }
    });

    /* ============================================================
       4️⃣ % Evolutivo año a año (línea)
    ============================================================= */

    const percentData = anios.slice(1).map((a, idx) => {
        const prev = anios[idx];
        const totalPrev = map[prev] ? map[prev].reduce((acc,v)=>acc+v,0) : 0;
        const totalCurr = map[a] ? map[a].reduce((acc,v)=>acc+v,0) : 0;
        return totalPrev ? ((totalCurr - totalPrev) / totalPrev * 100).toFixed(1) : 0;
    });

    const ctxPercent = document.getElementById("evo-chart-percent");

    if (EVO_CHART_PERCENT) EVO_CHART_PERCENT.destroy();

    EVO_CHART_PERCENT = new Chart(ctxPercent, {
        type: "line",
        data: {
            labels: anios.slice(1),
            datasets: [{
                label: "% Evolutivo",
                data: percentData,
                borderColor: "rgba(255,120,80,1)",
                backgroundColor: "rgba(255,120,80,0.3)",
                borderWidth: 2,
                tension: 0.3
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
* ============================================================
   HACER GLOBAL LA FUNCIÓN PARA main.js
============================================================ */
window.initPanelSLA = initPanelSLA;
