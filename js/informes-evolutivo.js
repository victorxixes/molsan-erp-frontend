/* ============================================================
   INFORME EVOLUTIVO — TABLA COMPLETA 2020–2026 (VERSIÓN ESTABLE)
============================================================ */

console.log("🔥 informes-evolutivo.js cargado");

const MESES_ORDEN = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

async function initInformeEvolutivo() {

    console.log("🔥 initInformeEvolutivo ejecutado");

    // Protección contra recursión
    if (window.__EVO_RUNNING__) {
        console.warn("⛔ initInformeEvolutivo() ignorado: ya está ejecutándose.");
        return;
    }
    window.__EVO_RUNNING__ = true;

    try {
        const tabla = document.getElementById("evo-tabla");
        const resumen = document.getElementById("evo-resumen");
        const contenedorFinal = document.getElementById("evo-final");

        if (!tabla || !resumen || !contenedorFinal) {
            console.warn("⛔ Elementos del informe evolutivo no encontrados.");
            return;
        }

        tabla.innerHTML = "";

        // Obtener datos sin aplicar reglas (evita recursión con mapas/dashboard)
        const datos = await obtenerFirmas();
        console.log("🔥 datos obtenidos en evolutivo:", datos.length);

// ============================
// 1) AÑO MÁS RECIENTE (sin spread)
// ============================
const ultimoAnio = datos.reduce((max, f) => {
    const anio = Number(f.anio) || 0;
    return anio > max ? anio : max;
}, 0);

        // ============================
        // 2) MESES DEL ÚLTIMO AÑO (limpios)
        // ============================
        let mesesConDatos = datos
            .filter(f => f.anio === ultimoAnio)
            .map(f => f.mes)
            .filter(m => MESES_ORDEN.includes(m));   // ← protección total

        mesesConDatos = [...new Set(mesesConDatos)];

        mesesConDatos.sort((a,b) => MESES_ORDEN.indexOf(a) - MESES_ORDEN.indexOf(b));

        // ============================
        // 3) FILAS POR MES
        // ============================
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

        // ============================
        // 4) TOTAL POR AÑO
        // ============================
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

        // ============================
        // 5) TOTAL HASTA ÚLTIMO MES REAL
        // ============================
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
