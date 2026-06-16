/* ============================================================
   LISTADO — GLASS LUXE 2027
============================================================ */

async function initListado() {
    const datos = await cargarHistorico();
    const tbody = document.querySelector("#tablaListado tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!datos || !datos.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6;
        td.textContent = "Sin datos.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    datos.forEach(f => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${f.expediente || ""}</td>
            <td>${f.oficina || ""}</td>
            <td>${f.fecha_protocolo || ""}</td>
            <td>${f.apoderado || ""}</td>
            <td>${f.tipo_firma || ""}</td>
            <td>${f.dias ?? ""}</td>
        `;
        tbody.appendChild(tr);
    });
}
