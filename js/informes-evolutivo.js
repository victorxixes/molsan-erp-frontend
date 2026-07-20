/* ============================================================
   INFORME EVOLUTIVO — TABLA COMPLETA 2020–2026
============================================================ */
async function initInformeEvolutivo() {

    // ✔ Protección inmediata contra recursividad
    if (window.__EVO_RUNNING__) return;
    window.__EVO_RUNNING__ = true;

    try {
        const tabla = document.getElementById("evo-tabla");
        const resumen = document.getElementById("evo-resumen");
        const contenedorFinal = document.getElementById("evo-final");

        if (!tabla || !resumen || !contenedorFinal) return;

        tabla.innerHTML = "";

        const datos = await obtenerFirmas();
        datos.forEach(aplicarReglas);

        const ultimoAnio = Math.max(...datos.map(f => f.anio));

        const mesesConDatos = [...new Set(
            datos.filter(f => f.anio === ultimoAnio).map(f => f.mes)
        )].sort((a,b) => MESES_ORDEN.indexOf(a) - MESES_ORDEN.indexOf(b));

        mesesConDatos.forEach(mes => {

            const fila = document.createElement("tr");

            const valores = [];
            const porcentajes = [];

            for (let anio = 2020; anio <= 2026; anio++) {
                const totalMes = datos.filter(d => d.anio == anio && d.mes == mes).length;
                valores.push(totalMes);
            }

            const total = valores.reduce((a,b) => a+b, 0);

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

        const totalesPorAnio = [];
        for (let anio = 2020; anio <= 2026; anio++) {
            totalesPorAnio.push(datos.filter(d => d.anio == anio).length);
        }

        const filaTotal = document.createElement("tr");
        filaTotal.classList.add("fila-total");

        const totalGeneral = totalesPorAnio.reduce((a,b)=>a+b,0);

        const pctGeneral = [];
        for (let i = 1; i < totalesPorAnio.length; i++) {
            const prev = totalesPorAnio[i-1];
            const act  = totalesPorAnio[i];
            pctGeneral.push(prev ? ((act - prev) / prev * 100) : 0);
        }

        filaTotal.innerHTML = `
            <td><strong>Total general</strong></td>
            ${totalesPorAnio.map(t => `<td><strong>${t}</strong></td>`).join("")}
            <td><strong>${totalGeneral}</strong></td>
            ${pctGeneral.map(p => `<td><strong>${p.toFixed(2)}%</strong></td>`).join("")}
        `;

        tabla.appendChild(filaTotal);

        const ultimoMesReal = mesesConDatos[mesesConDatos.length - 1];
        const mesActualIdx = MESES_ORDEN.indexOf(ultimoMesReal);

        const totalesHasta = [];

        for (let anio = 2020; anio <= ultimoAnio; anio++) {
            totalesHasta.push(
                datos.filter(f => f.anio === anio && MESES_ORDEN.indexOf(f.mes) <= mesActualIdx).length
            );
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
        // ✔ Liberamos la bandera cuando el DOM ya está completamente renderizado
        setTimeout(() => {
            window.__EVO_RUNNING__ = false;
        }, 150);
    }
}
