/* ============================================================
   PANEL CENTRO QUE FIRMA — PREMIUM 2027
============================================================ */

let chartCentroFirma = null;
let PCF_DATOS = [];
let PCF_POR_ANIO = {};

/* ============================================================
   Inicialización del panel
============================================================ */
async function initPanelTipoCentroQueFirma() {

    console.log("🏛️ initPanelTipoCentroQueFirma() ejecutado");

    // Esperar a que el HTML esté cargado
    if (!document.getElementById("pcf-select-anio")) {
        console.warn("⏳ Panel Centro que Firma aún no está en el DOM.");
        return;
    }

    // 1) Cargar datos
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    if (!datos || !datos.length) return;

    // 2) Guardar datos globales
    PCF_DATOS = datos;
    PCF_POR_ANIO = pcf_groupByAnio(PCF_DATOS);

    // 3) Rellenar selector de años
    pcf_fillSelectAnios();
    pcf_selectUltimoAnio();

    // 4) Evento al cambiar año
    document.getElementById("pcf-select-anio")
        .addEventListener("change", cargarCentroQueFirma);

    // 5) Primera carga
    await cargarCentroQueFirma();
}
/* ============================================================
   AGRUPAR POR AÑO → CENTRO QUE FIRMA → MES
============================================================ */
function pcf_groupByAnio(datos) {

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const COLABORADORES = [
        "gestcanarias",
        "gestoria mas",
        "yarza gestion",
        "julio cuesta",
        "castillo 11",
        "gesgalicia"
    ];

    const centros = ["Molsan", "Colaboradores", "Oficina OE", "Oficina CBK"];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        const idxMes = mesesValidos.indexOf(mes);
        if (idxMes === -1) continue;

        const ap = (f.apoderado || "").trim().toLowerCase();
        const dias = Number(f.dias);

        let centro = "Molsan";

        if (ap === "oficina caixabank") centro = "Oficina CBK";
        else if (ap === "oficina otra entidad") centro = "Oficina OE";
        else if (COLABORADORES.includes(ap)) centro = "Colaboradores";

        if (!map[anio]) map[anio] = {};

        if (!map[anio][centro]) {
            map[anio][centro] = {
                total: 0,
                presencial: 0,
                vc: 0,
                slaSum: 0,
                slaCount: 0,
                meses: Array(12).fill(0)
            };
        }

        const r = map[anio][centro];

        r.total++;

        if (f.vc === "SI") r.vc++;
        else r.presencial++;

        if (dias > 0) {
            r.slaSum += dias;
            r.slaCount++;
        }

        if (idxMes >= 0) r.meses[idxMes]++;
    }

    return map;
}


/* ============================================================
   Cargar datos y generar informe
============================================================ */
async function cargarCentroQueFirma() {

    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = Number(document.getElementById("pcf-select-anio").value);
    datos = datos.filter(f => Number(f.anio) === anioSel);

    // Listas de clasificación
    const COLABORADORES = [
        "gestcanarias",
        "gestoria mas",
        "yarza gestion",
        "julio cuesta",
        "castillo 11",
        "gesgalicia"
    ];

    const centros = ["Molsan", "Colaboradores", "Oficina OE", "Oficina CBK"];

    // Estructura mensual + totales
    const mapa = {};
    centros.forEach(c => {
        mapa[c] = {
            total: 0,
            presencial: 0,
            vc: 0,
            slaSum: 0,
            slaCount: 0,
            meses: Array(12).fill(0)
        };
    });

    datos.forEach(f => {

        const ap = (f.apoderado || "").trim().toLowerCase();
        const mesIdx = MESES_ORDEN.indexOf(f.mes);
        const dias = Number(f.dias);

        let centro = "Molsan";

        if (ap === "oficina caixabank") centro = "Oficina CBK";
        else if (ap === "oficina otra entidad") centro = "Oficina OE";
        else if (COLABORADORES.includes(ap)) centro = "Colaboradores";

        mapa[centro].total++;
        if (f.vc === "SI") mapa[centro].vc++;
        else mapa[centro].presencial++;

        if (dias > 0) {
            mapa[centro].slaSum += dias;
            mapa[centro].slaCount++;
        }

        if (mesIdx >= 0) mapa[centro].meses[mesIdx]++;
    });

    /* ============================================================
       Rellenar tabla mensual
    ============================================================= */
    const tbody = document.querySelector("#pcf-tabla-meses tbody");

    tbody.innerHTML = centros.map(c => {
        const m = mapa[c];
        const sla = m.slaCount ? (m.slaSum / m.slaCount).toFixed(1) : "0";
        const vcPct = m.total ? ((m.vc / m.total) * 100).toFixed(1) + "%" : "0%";

        return `
            <tr>
                <td>${c}</td>
                <td>${m.total}</td>
                <td>${m.presencial}</td>
                <td>${m.vc}</td>
                <td>${vcPct}</td>
                <td>${sla}</td>
                ${m.meses.map(v => `<td>${v}</td>`).join("")}
            </tr>
        `;
    }).join("");

    /* ============================================================
       KPIs
    ============================================================= */
    const totalFirmas = datos.length;
    document.getElementById("pcf-kpi-total").textContent = totalFirmas;

    const centroTop = centros.reduce((a,b) => mapa[a].total > mapa[b].total ? a : b);
    document.getElementById("pcf-kpi-top").textContent = centroTop;

    const slaGlobal = (() => {
        const sum = centros.reduce((acc,c) => acc + mapa[c].slaSum, 0);
        const cnt = centros.reduce((acc,c) => acc + mapa[c].slaCount, 0);
        return cnt ? (sum / cnt).toFixed(1) : "0";
    })();
    document.getElementById("pcf-kpi-sla").textContent = slaGlobal;

    const vcGlobal = (() => {
        const vc = centros.reduce((acc,c) => acc + mapa[c].vc, 0);
        return totalFirmas ? ((vc / totalFirmas) * 100).toFixed(1) + "%" : "0%";
    })();
    document.getElementById("pcf-kpi-vc").textContent = vcGlobal;

    /* ============================================================
       Gráfico
    ============================================================= */
    if (chartCentroFirma) chartCentroFirma.destroy();

    const ctx = document.getElementById("pcf-chart-centro");
    chartCentroFirma = new Chart(ctx, {
        type: "bar",
        data: {
            labels: centros,
            datasets: [{
                label: "Total firmas",
                data: centros.map(c => mapa[c].total),
                backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#6366F1"]
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
