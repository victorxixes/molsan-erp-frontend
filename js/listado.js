/* ============================================================
   LISTADO — GLASS LUXE 2027 (IndexedDB + Filtros + Paginación)
============================================================ */

let listadoDatos = [];     
let paginaActual = 1;
const filasPorPagina = 50;

/* ============================================================
   FORMATEAR FECHA A DD/MM/AAAA
============================================================ */
function formatearFechaES(valor) {
    if (!valor) return "";

    const d = new Date(valor);
    if (isNaN(d.getTime())) return valor;

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const año = d.getFullYear();

    return `${dia}/${mes}/${año}`;
}

/* ============================================================
   INICIALIZAR LISTADO
============================================================ */
async function initListado() {
    console.log("📄 initListado() ejecutado");

    const datos = await obtenerFirmas();

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

    if (filtros.apoderado && !String(f.apoderado ?? "").toLowerCase().includes(filtros.apoderado.toLowerCase())) return false;

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
   RENDER TABLA — 27 COLUMNAS COMPLETAS
============================================================ */
function renderTabla(datos) {
    const tbody = document.querySelector("#tabla-listado");
    const info = document.getElementById("paginaActual");

    tbody.innerHTML = "";

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="27">Sin datos.</td></tr>`;
        if (info) info.textContent = "0 resultados";
        return;
    }

    datos.forEach(f => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${f.expediente}</td>
            <td>${f.oficina}</td>
            <td>${formatearFechaES(f.fecha_alta)}</td>
            <td>${f.contrato}</td>
            <td>${f.tipo_provision}</td>
            <td>${f.notario}</td>
            <td>${f.provincia}</td>
            <td>${f.municipio}</td>
            <td>${f.comunidad}</td>
            <td>${f.protocolo}</td>
            <td>${formatearFechaES(f.fecha_protocolo)}</td>
            <td>${f.vc}</td>
            <td>${f.apoderado}</td>
            <td>${formatearFechaES(f.envio_notario)}</td>
            <td>${f.dias}</td>

            <td>${f.mes}</td>
            <td>${f.anio}</td>
            <td>${f.centro}</td>
            <td>${f.tipo_gestion}</td>
            <td>${f.centro_que_firma}</td>

            <td class="${getClaseCircuito(f.circuito)}">${f.circuito}</td>
            <td class="${getClaseFirma(f.tipo_firma)}">${f.tipo_firma}</td>

            <td><button class="btn-detalle" onclick="verDetalle('${f.expediente}')">Ver</button></td>
        `;

        tbody.appendChild(tr);
    });

    if (info) {
        info.textContent = `Página ${paginaActual} — ${datos.length} de ${listadoDatos.length} registros`;
    }
}

/* ============================================================
   COLORES POR CIRCUITO Y TIPO DE FIRMA
============================================================ */
function getClaseCircuito(c) {
    if (c === "Circuito Península") return "circuito-peninsula";
    if (c === "Circuito Canarias") return "circuito-canarias";
    return "circuito-externo";
}

function getClaseFirma(t) {
    if (t === "Presencial") return "firma-presencial";
    if (t === "VideoConferencia") return "firma-vc";
    return "";
}

/* ============================================================
   DETALLE (MODAL)
============================================================ */
function verDetalle(expediente) {
    const f = listadoDatos.find(x => x.expediente == expediente);
    if (!f) return;

    document.getElementById("detalleTitulo").textContent =
        `Expediente ${f.expediente}`;

    document.getElementById("detalleContenido").innerHTML = `
        <table class="tabla-detalle">
            <tr><td><b>Expediente:</b></td><td>${f.expediente}</td></tr>
            <tr><td><b>Oficina:</b></td><td>${f.oficina}</td></tr>
            <tr><td><b>Fecha Alta:</b></td><td>${formatearFechaES(f.fecha_alta)}</td></tr>
            <tr><td><b>Contrato:</b></td><td>${f.contrato}</td></tr>
            <tr><td><b>Tipo Provisión:</b></td><td>${f.tipo_provision}</td></tr>
            <tr><td><b>Notario:</b></td><td>${f.notario}</td></tr>
            <tr><td><b>Provincia:</b></td><td>${f.provincia}</td></tr>
            <tr><td><b>Municipio:</b></td><td>${f.municipio}</td></tr>
            <tr><td><b>Comunidad:</b></td><td>${f.comunidad}</td></tr>
            <tr><td><b>Protocolo:</b></td><td>${f.protocolo}</td></tr>
            <tr><td><b>Fecha Protocolo:</b></td><td>${formatearFechaES(f.fecha_protocolo)}</td></tr>
            <tr><td><b>V.C.:</b></td><td>${f.vc}</td></tr>
            <tr><td><b>Apoderado:</b></td><td>${f.apoderado}</td></tr>
            <tr><td><b>Envio Notario:</b></td><td>${formatearFechaES(f.envio_notario)}</td></tr>
            <tr><td><b>Días:</b></td><td>${f.dias}</td></tr>
            <tr><td><b>Mes:</b></td><td>${f.mes}</td></tr>
            <tr><td><b>Año:</b></td><td>${f.anio}</td></tr>
            <tr><td><b>Centro:</b></td><td>${f.centro}</td></tr>
            <tr><td><b>Tipo Gestión:</b></td><td>${f.tipo_gestion}</td></tr>
            <tr><td><b>Centro que firma:</b></td><td>${f.centro_que_firma}</td></tr>
            <tr><td><b>Circuito:</b></td><td>${f.circuito}</td></tr>
            <tr><td><b>Tipo Firma:</b></td><td>${f.tipo_firma}</td></tr>
        </table>
    `;

    document.getElementById("modal-detalle").classList.remove("hidden");
}

function cerrarModalDetalle() {
    document.getElementById("modal-detalle").classList.add("hidden");
}

/* ============================================================
   ORDENACIÓN POR COLUMNAS
============================================================ */
let ordenActual = { campo: null, asc: true };

function ordenarPor(campo) {
    if (ordenActual.campo === campo) {
        ordenActual.asc = !ordenActual.asc;
    } else {
        ordenActual = { campo, asc: true };
    }

    listadoDatos.sort((a, b) => {

        let x = a[campo] ?? "";
        let y = b[campo] ?? "";

        // Si es fecha DD/MM/AAAA → convertir
        if (campo.includes("fecha")) {
            x = convertirFecha(x);
            y = convertirFecha(y);
        }

        if (x < y) return ordenActual.asc ? -1 : 1;
        if (x > y) return ordenActual.asc ? 1 : -1;
        return 0;
    });

    renderTabla(paginar(listadoDatos));
}

function convertirFecha(f) {
    if (!f) return 0;
    const [d, m, a] = f.split("/");
    return new Date(`${a}-${m}-${d}`).getTime();
}
