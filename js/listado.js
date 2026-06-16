/* ============================================================
   LISTADO — GLASS LUXE 2027 (IndexedDB + Filtros + Paginación)
============================================================ */

let listadoDatos = [];     // datos filtrados
let paginaActual = 1;
const filasPorPagina = 50;

/* ============================================================
   INICIALIZAR LISTADO
============================================================ */
async function initListado() {
    const datos = await obtenerFirmas(); // ← IndexedDB

    if (!datos || !datos.length) {
        renderTabla([]);
        return;
    }

    listadoDatos = datos;
    paginaActual = 1;
    renderTabla(paginar(listadoDatos));
}

/* ============================================================
   APLICAR FILTROS
============================================================ */
async function aplicarFiltrosListado() {
    const filtros = {
        mes: document.getElementById("filtroMes")?.value || "",
        anio: document.getElementById("filtroAnio")?.value || "",
        apoderado: document.getElementById("filtroApoderado")?.value || "",
        oficina: document.getElementById("filtroOficina")?.value || "",
        circuito: document.getElementById("filtroCircuito")?.value || "",
        tipoFirma: document.getElementById("filtroTipoFirma")?.value || "",
        tipoGestion: document.getElementById("filtroTipoGestion")?.value || ""
    };

    listadoDatos = await filtrarFirmas(filtros);
    paginaActual = 1;
    renderTabla(paginar(listadoDatos));
}

/* ============================================================
   PAGINACIÓN
============================================================ */
function paginar(datos) {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return datos.slice(inicio, inicio + filasPorPagina);
}

function siguientePagina() {
    if ((paginaActual * filasPorPagina) < listadoDatos.length) {
        paginaActual++;
        renderTabla(paginar(listadoDatos));
    }
}

function paginaAnterior() {
    if (paginaActual > 1) {
        paginaActual--;
        renderTabla(paginar(listadoDatos));
    }
}

/* ============================================================
   RENDER TABLA
============================================================ */
function renderTabla(datos) {
    const tbody = document.querySelector("#tablaListado tbody");
    const info = document.getElementById("infoPaginacion");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!datos.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="6">Sin datos.</td>`;
        tbody.appendChild(tr);
        if (info) info.textContent = "0 resultados";
        return;
    }

    datos.forEach(f => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${f.expediente || ""}</td>
            <td>${f.oficina || ""}</td>
            <td>${f.fecha_protocolo || ""}</td>
            <td>${f.nombre || ""}</td>
            <td>${f.tipo_firma || ""}</td>
            <td>${f.dias ?? ""}</td>
        `;
        tbody.appendChild(tr);
    });

    if (info) {
        info.textContent = `Página ${paginaActual} — ${datos.length} de ${listadoDatos.length} registros`;
    }
}
