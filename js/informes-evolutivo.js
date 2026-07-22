/* ============================================================
   INFORME EVOLUTIVO — TABLA COMPLETA 2020–2026 (ULTRA OPTIMIZADO)
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

        // Limpia el tbody
        tabla.innerHTML = "";

        // ⭐ PARCHE PREMIUM 2027 — Fuerza al navegador a respetar el THEAD del template
        const thead = tabla.parentElement.querySelector("thead");
        if (thead) {
            thead.innerHTML = thead.innerHTML;
        }

        const datos = await obtenerFirmas();
        console.log("🔥 datos obtenidos:", datos.length);

        // ============================
        // 1) PRECALCULAR TODO EN UN SOLO RECORRIDO
        // ============================

        const totalesPorMesYAnio = {};   // ej: totalesPorMesYAnio["enero"][2023] = 123
        const totalesPorAnio = {};       // ej: totalesPorAnio[2023] = 5000

        let ultimoAnio = 0;

        for (const f of datos) {

            const anio = Number(f.anio);
            const mes = f.mes;

            if (!MESES_ORDEN.includes(mes)) continue;

            if (anio > ultimoAnio) ultimoAnio = anio;

            // totales por año
            totalesPorAnio[anio] = (totalesPorAnio[anio] || 0) + 1;

            // totales por mes y año
            if (!totalesPorMesYAnio[mes]) totalesPorMesYAnio[mes] = {};
            totalesPorMesYAnio[mes][anio] = (totalesPorMesYAnio[mes][anio] || 0) + 1;
        }

        // ============================
        // 2) MESES DEL ÚLTIMO AÑO
        // ============================

        let mesesConDatos = Object.keys(totalesPorMesYAnio)
            .filter(m => totalesPorMesYAnio[m][ultimoAnio] > 0);

        mesesConDatos.sort((a,b) => MESES_ORDEN.indexOf(a) - MESES_ORDEN.indexOf(b));

        // ============================
        // 3) FILAS POR MES
        // ============================

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

            fila.innerHTML = `
                <td>${mes}</td>
                ${valores.map(v => `<td>${v}</td>`).join("")}
                <td>${total}</td>
                ${porcentajes.map(p => `<td>${p.toFixed(2)}%</td>`).join("")}
            `;

            tabla.appendChild(fila);
        });

        // ============================
        // 4) TOTAL POR AÑO
        // ============================

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

        filaTotal.innerHTML = `
            <td><strong>Total general</strong></td>
            ${totalesAnioArray.map(t => `<td><strong>${t}</strong></td>`).join("")}
            <td><strong>${totalGeneral}</strong></td>
            ${pctGeneral.map(p => `<td><strong>${p.toFixed(2)}%</strong></td>`).join("")}
        `;

        tabla.appendChild(filaTotal);

        // ============================
        // 5) TOTAL HASTA ÚLTIMO MES REAL
        // ============================

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

        const pctHasta = [];
        for (let i = 1; i < totalesHasta.length; i++) {
            const prev = totalesHasta[i-1];
            const act  = totalesHasta[i];
            pctHasta.push(prev ? ((act - prev) / prev * 100) : 0);
        }

        const filaHasta = document.createElement("tr");
        filaHasta.classList.add("fila-total");

        filaHasta.innerHTML = `
            <td><strong>Hasta ${ultimoMesReal}</strong></td>
            ${totalesHasta.map(t => `<td><strong>${t}</strong></td>`).join("")}
            <td></td>
            ${pctHasta.map(p => `<td><strong>${p.toFixed(2)}%</strong></td>`).join("")}
        `;

        tabla.appendChild(filaHasta);

        // ============================
        // 6) RESUMEN
        // ============================

        resumen.textContent = `Evolución total: ${pctHasta[pctHasta.length-1].toFixed(2)}%`;

        contenedorFinal.innerHTML = `
            <div class="card-glass mt-20">
                <strong>Hasta ${ultimoMesReal}</strong><br>
                ${totalesHasta.join(" | ")}<br><br>
                <strong>% Evolución:</strong><br>
                ${pctHasta.map(p => p.toFixed(2) + "%").join(" | ")}
            </div>
        `;

    } finally {
        setTimeout(() => {
            window.__EVO_RUNNING__ = false;
        }, 500);
    }
}
