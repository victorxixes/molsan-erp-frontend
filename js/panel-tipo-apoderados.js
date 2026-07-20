/* ============================================================
   TABLA DETALLE APODERADOS — FORMATO NUEVO 2026 (VERSIÓN PERFECTA)
============================================================ */
function pap_renderTablaApoderados(info) {
    const tbody = document.querySelector("#pap-tabla-apoderados tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    // 1) Meses con datos reales
    const mesesConDatos = mesesOrden.filter(m =>
        Object.values(info.apoderados).some(a => (a.meses[m] || 0) > 0)
    );

    // THEAD dinámico
    pap_renderThead(mesesConDatos);

    // 2) Totales por mes (solo meses válidos y numéricos)
    const totalesPorMes = mesesConDatos.map(m =>
        Object.values(info.apoderados).reduce((acc, a) => {
            const valor = a.meses[m] || 0;
            return acc + (typeof valor === "number" ? valor : 0);
        }, 0)
    );

    // 3) Construcción de lista por apoderado
    const lista = Object.entries(info.apoderados).map(([nombre, a]) => {

        const valoresMes = mesesConDatos.map(m => {
            const idx = mesesOrden.indexOf(m);

            // Mes futuro → NO se muestra
            if (info.anio === currentYear && idx > currentMonthIndex) return 0;

            return a.meses[m] || 0;
        });

        const totalVisible = valoresMes.reduce((acc, v) => acc + v, 0);

        // % por mes sobre el total de ese mes (columna)
        const porcentajesMes = valoresMes.map((v, i) => {
            const totalMes = totalesPorMes[i];
            if (totalMes === 0) return "";
            return ((v / totalMes) * 100).toFixed(1) + "%";
        });

        return {
            nombre,
            valoresMes,
            totalVisible,
            porcentajesMes
        };
    });

    // Ordenar por total visible
    lista.sort((a,b)=>b.totalVisible - a.totalVisible);

    // 4) Pintar filas
    for (const ap of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${ap.nombre}</td>
            ${ap.valoresMes.map(v => `<td>${v}</td>`).join("")}
            <td>${ap.totalVisible}</td>
            ${ap.porcentajesMes.map(p => `<td>${p}</td>`).join("")}
            <td>100%</td>
        `;

        tbody.appendChild(tr);
    }

    // 5) SUMATORIO FINAL
    const sumatorioTotal = totalesPorMes.reduce((acc, v) => acc + v, 0);

    const trSum = document.createElement("tr");
    trSum.classList.add("fila-sumatorio");

    trSum.innerHTML = `
        <td><b>TOTAL</b></td>
        ${totalesPorMes.map(v => `<td><b>${v}</b></td>`).join("")}
        <td><b>${sumatorioTotal}</b></td>
        ${totalesPorMes.map(v => {
            if (sumatorioTotal === 0) return "<td></td>";
            return `<td><b>${((v / sumatorioTotal) * 100).toFixed(1)}%</b></td>`;
        }).join("")}
        <td><b>100%</b></td>
    `;

    tbody.appendChild(trSum);
}

/* ============================================================
   THEAD DINÁMICO
============================================================ */
function pap_renderThead(mesesConDatos) {
    const theadRow = document.getElementById("pap-thead-row");
    if (!theadRow) return;

    theadRow.innerHTML = `
        <th>Apoderado</th>
        ${mesesConDatos.map(m => `<th>${m}</th>`).join("")}
        <th>Total</th>
        ${mesesConDatos.map(m => `<th>%${m}</th>`).join("")}
        <th>%Total</th>
    `;
}
