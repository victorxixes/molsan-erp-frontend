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
    console.log("📄 initListado() ejecutado");

    const datos = await obtenerFirmas(); // ← IndexedDB

    console.log("Datos obtenidos:", datos?.length);

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
async function aplicarFiltros() {
    console.log("Aplicando filtros…");

    const filtros = {
        expediente: document.getElementById("filtroExpediente")?.value || "",
        apoderado: document.getElementById("filtroApoderado")?.value || "",
        oficina: document.getElementById("filtroOficina")?.value || "",
        circuito: document.getElementById("filtroCircuito")?.value || "",
        tipoFirma: document.getElementById("filtroTipoFirma")?.value || "",
        mes: document.getElementById("filtroMes")?.value || "",
        anio: document.getElementById("filtroAnio")?.value || "",
        diasMin: document.getElementById("filtroDiasMin")?.value || "",
        diasMax: document.getElementById("filtroDiasMax")?.value || ""
    };

    const datos = await obtenerFirmas();
    listadoDatos = datos.filter(f => coincideFiltro(f, filtros));

    paginaActual = 1;
    renderTabla(paginar(listadoDatos));
}

/* ============================================================
   FUNCIÓN DE FILTRADO
============================================================ */
function coincideFiltro(f, filtros) {
    if (filtros.expediente && !String(f.expediente).includes(filtros.expediente)) return false;
    if (filtros.apoderado && !String(f.nombre).toLowerCase().includes(filtros.apoderado.toLowerCase())) return false;
    if (filtros.oficina && !String(f.oficina).toLowerCase().includes(filtros.oficina.toLowerCase())) return false;
    if (filtros.circuito && !String(f.circuito).toLowerCase().includes(filtros.circuito.toLowerCase())) return false;
    if (filtros.tipoFirma && !String(f.tipo_firma).toLowerCase().includes(filtros.tipoFirma.toLowerCase())) return false;

    if (filtros.mes && String(f.mes) !== filtros.mes) return false;
    if (filtros.anio && String(f.anio) !== filtros.anio) return false;

    if (filtros.diasMin && f.dias < Number(filtros.diasMin)) return false;
    if (filtros.diasMax && f.dias > Number(filtros.diasMax)) return false;

    return true;
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
    const tbody = document.querySelector("#tabla-listado");  // ← CORREGIDO
    const info = document.getElementById("paginaActual");    // ← CORREGIDO

    if (!tbody) {
        console.error("❌ No se encontró #tabla-listado");
        return;
    }

    tbody.innerHTML = "";

    if (!datos.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="8">Sin datos.</td>`;
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
            <td>${f.centro || ""}</td>
            <td>${f.circuito || ""}</td>
            <td>${f.tipo_firma || ""}</td>
            <td>${f.dias ?? ""}</td>
        `;
        tbody.appendChild(tr);
    });

    if (info) {
        info.textContent = `Página ${paginaActual} — ${datos.length} de ${listadoDatos.length} registros`;
    }
}
