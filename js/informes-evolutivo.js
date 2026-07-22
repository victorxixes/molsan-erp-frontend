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

            // ⭐ %Total
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

        // ⭐ %Total general
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
        // 5) TOTAL HASTA ÚLTIMO MES REAL
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

        const pctHasta = [];
        for (let i = 1; i < totalesHasta.length; i++) {
            const prev = totalesHasta[i-1];
            const act  = totalesHasta[i];
            pctHasta.push(prev ? ((act - prev) / prev * 100) : 0);
        }

        // ⭐ %Total hasta último mes
        const pctTotalHasta = totalesHasta[0]
            ? ((totalesHasta[totalesHasta.length-1] - totalesHasta[0]) / totalesHasta[0] * 100)
            : 0;

        const filaHasta = document.createElement("tr");
        filaHasta.classList.add("fila-total");

        filaHasta.innerHTML = `
            <td><strong>Hasta ${ultimoMesReal}</strong></td>
            ${totalesHasta.map(t => `<td class="center"><strong>${t}</strong></td>`).join("")}
            <td></td>
            ${pctHasta.map(p => `<td class="center"><strong>${p.toFixed(2)}%</strong></td>`).join("")}
            <td class="center"><strong>${pctTotalHasta.toFixed(2)}%</strong></td>
        `;

        tabla.appendChild(filaHasta);

        // ============================================================
        // 6) RESUMEN
        // ============================================================

        resumen.textContent = `Evolución total: ${pctTotalHasta.toFixed(2)}%`;

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
