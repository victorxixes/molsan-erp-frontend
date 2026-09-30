/* ============================================================
   LISTADO — GLASS LUXE 2027
   IndexedDB + Filtros + Paginación + Modal Detalle
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

        listadoDatos = [];

        renderTabla([]);

        return;
    }

    listadoDatos = datos;

    paginaActual = 1;

    renderTabla(paginar(listadoDatos));

    /* Cargar años disponibles en el filtro */

    cargarAniosFiltro();
}


/* ============================================================
   CARGAR AÑOS EN EL SELECT
============================================================ */

function cargarAniosFiltro() {

    const select = document.getElementById("filtroAnio");

    if (!select) return;

    const años = [
        ...new Set(
            listadoDatos
                .map(f => Number(f.anio))
                .filter(a => a)
        )
    ].sort((a, b) => a - b);

    select.innerHTML = `<option value="">Año</option>`;

    años.forEach(año => {

        const option = document.createElement("option");

        option.value = año;
        option.textContent = año;

        select.appendChild(option);
    });
}


/* ============================================================
   APLICAR FILTROS
============================================================ */

async function aplicarFiltros() {

    console.log("🔎 Aplicando filtros…");

    const filtros = {

        expediente:
            document.getElementById("filtroExpediente")?.value || "",

        apoderado:
            document.getElementById("filtroApoderado")?.value || "",

        oficina:
            document.getElementById("filtroOficina")?.value || "",

        circuito:
            document.getElementById("filtroCircuito")?.value || "",

        tipoFirma:
            document.getElementById("filtroTipoFirma")?.value || "",

        mes:
            document.getElementById("filtroMes")?.value || "",

        anio:
            document.getElementById("filtroAnio")?.value || "",

        diasMin:
            document.getElementById("filtroDiasMin")?.value || "",

        diasMax:
            document.getElementById("filtroDiasMax")?.value || ""
    };


    const datos = await obtenerFirmas();


    listadoDatos = datos.filter(
        f => coincideFiltro(f, filtros)
    );


    paginaActual = 1;

    renderTabla(
        paginar(listadoDatos)
    );
}


/* ============================================================
   FUNCIÓN DE FILTRADO
============================================================ */

function coincideFiltro(f, filtros) {

    if (
        filtros.expediente &&
        !String(f.expediente)
            .includes(filtros.expediente)
    ) {
        return false;
    }


    if (
        filtros.apoderado &&
        !String(f.apoderado ?? "")
            .toLowerCase()
            .includes(
                filtros.apoderado.toLowerCase()
            )
    ) {
        return false;
    }


    if (
        filtros.oficina &&
        !String(f.oficina ?? "")
            .toLowerCase()
            .includes(
                filtros.oficina.toLowerCase()
            )
    ) {
        return false;
    }


    if (
        filtros.circuito &&
        !String(f.circuito ?? "")
            .toLowerCase()
            .includes(
                filtros.circuito.toLowerCase()
            )
    ) {
        return false;
    }


    if (
        filtros.tipoFirma &&
        !String(f.tipo_firma ?? "")
            .toLowerCase()
            .includes(
                filtros.tipoFirma.toLowerCase()
            )
    ) {
        return false;
    }


    if (
        filtros.mes &&
        String(f.mes) !== filtros.mes
    ) {
        return false;
    }


    if (
        filtros.anio &&
        String(f.anio) !== filtros.anio
    ) {
        return false;
    }


    if (
        filtros.diasMin &&
        Number(f.dias) < Number(filtros.diasMin)
    ) {
        return false;
    }


    if (
        filtros.diasMax &&
        Number(f.dias) > Number(filtros.diasMax)
    ) {
        return false;
    }


    return true;
}


/* ============================================================
   PAGINACIÓN
============================================================ */

function paginar(datos) {

    const inicio =
        (paginaActual - 1) * filasPorPagina;

    return datos.slice(
        inicio,
        inicio + filasPorPagina
    );
}


function siguientePagina() {

    if (
        (paginaActual * filasPorPagina)
        < listadoDatos.length
    ) {

        paginaActual++;

        renderTabla(
            paginar(listadoDatos)
        );
    }
}


function paginaAnterior() {

    if (paginaActual > 1) {

        paginaActual--;

        renderTabla(
            paginar(listadoDatos)
        );
    }
}


/* ============================================================
   RENDER TABLA
============================================================ */

function renderTabla(datos) {

    const tbody =
        document.querySelector("#tabla-listado");

    const info =
        document.getElementById("paginaActual");


    if (!tbody) {

        console.warn(
            "⚠️ No se encuentra #tabla-listado"
        );

        return;
    }


    tbody.innerHTML = "";


    if (!datos.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="27">
                    Sin datos.
                </td>
            </tr>
        `;

        if (info) {
            info.textContent = "0 resultados";
        }

        return;
    }


    datos.forEach(f => {

        const tr =
            document.createElement("tr");


        /*
           Usamos JSON.stringify para evitar
           problemas si el expediente contiene
           caracteres especiales.
        */

        const expedienteJS =
            JSON.stringify(String(f.expediente ?? ""));


        tr.innerHTML = `

            <td>${f.expediente ?? ""}</td>

            <td>${f.oficina ?? ""}</td>

            <td>
                ${formatearFechaES(f.fecha_alta)}
            </td>

            <td>${f.contrato ?? ""}</td>

            <td>${f.tipo_provision ?? ""}</td>

            <td>${f.notario ?? ""}</td>

            <td>${f.provincia ?? ""}</td>

            <td>${f.municipio ?? ""}</td>

            <td>${f.comunidad ?? ""}</td>

            <td>${f.protocolo ?? ""}</td>

            <td>
                ${formatearFechaES(f.fecha_protocolo)}
            </td>

            <td>${f.vc ?? ""}</td>

            <td>${f.apoderado ?? ""}</td>

            <td>
                ${formatearFechaES(f.envio_notario)}
            </td>

            <td>${f.dias ?? ""}</td>

            <td>${f.mes ?? ""}</td>

            <td>${f.anio ?? ""}</td>

            <td>${f.centro ?? ""}</td>

            <td>${f.tipo_gestion ?? ""}</td>

            <td>${f.centro_que_firma ?? ""}</td>

            <td class="${getClaseCircuito(f.circuito)}">
                ${f.circuito ?? ""}
            </td>

            <td class="${getClaseFirma(f.tipo_firma)}">
                ${f.tipo_firma ?? ""}
            </td>

            <td>
                <button
                    type="button"
                    class="btn-detalle"
                    onclick='verDetalle(${expedienteJS})'
                >
                    Ver
                </button>
            </td>

        `;


        tbody.appendChild(tr);
    });


    if (info) {

        info.textContent =
            `Página ${paginaActual} — ` +
            `${datos.length} de ` +
            `${listadoDatos.length} registros`;
    }
}


/* ============================================================
   COLORES POR CIRCUITO
============================================================ */

function getClaseCircuito(c) {

    if (c === "Circuito Península")
        return "circuito-peninsula";

    if (c === "Circuito Canarias")
        return "circuito-canarias";

    return "circuito-externo";
}


/* ============================================================
   COLORES POR TIPO DE FIRMA
============================================================ */

function getClaseFirma(t) {

    if (t === "Presencial")
        return "firma-presencial";

    if (t === "VideoConferencia")
        return "firma-vc";

    return "";
}


/* ============================================================
   CREAR MODAL SI NO EXISTE
============================================================ */

function asegurarModalDetalle() {

    let modal =
        document.getElementById("modal-detalle");


    /*
       Si el modal ya está en el DOM,
       no hacemos nada.
    */

    if (modal) return modal;


    console.warn(
        "⚠️ #modal-detalle no existe en el DOM."
    );

    console.log(
        "🛠️ Creando modal de detalle automáticamente..."
    );


    const modalHTML = `

        <div
            id="modal-detalle"
            class="modal-overlay hidden"
        >

            <div class="modal-detalle">

                <div class="modal-detalle-header">

                    <h3 id="detalleTitulo">
                        Detalle del expediente
                    </h3>

                    <button
                        type="button"
                        class="modal-close"
                        onclick="cerrarModalDetalle()"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>

                </div>


                <div
                    id="detalleContenido"
                    class="modal-detalle-content"
                >
                </div>


                <div class="modal-detalle-footer">

                    <button
                        type="button"
                        class="btn-secondary"
                        onclick="cerrarModalDetalle()"
                    >
                        Cerrar
                    </button>

                </div>

            </div>

        </div>
    `;


    document.body.insertAdjacentHTML(
        "beforeend",
        modalHTML
    );


    return document.getElementById(
        "modal-detalle"
    );
}


/* ============================================================
   DETALLE — MODAL
============================================================ */

function verDetalle(expediente) {

    console.log(
        "🔎 Abriendo detalle:",
        expediente
    );


    /*
       Buscar el expediente.
    */

    const f =
        listadoDatos.find(
            x =>
                String(x.expediente) ===
                String(expediente)
        );


    if (!f) {

        console.error(
            "❌ No se encontró el expediente:",
            expediente
        );

        return;
    }


    /*
       Asegurar que el modal existe.
    */

    const modal =
        asegurarModalDetalle();


    if (!modal) {

        console.error(
            "❌ No se pudo crear #modal-detalle"
        );

        return;
    }


    /*
       Buscar los elementos DESPUÉS
       de asegurar que existe el modal.
    */

    const titulo =
        document.getElementById(
            "detalleTitulo"
        );

    const contenido =
        document.getElementById(
            "detalleContenido"
        );


    if (!titulo) {

        console.error(
            "❌ No se pudo encontrar #detalleTitulo"
        );

        return;
    }


    if (!contenido) {

        console.error(
            "❌ No se pudo encontrar #detalleContenido"
        );

        return;
    }


    /* ========================================================
       TÍTULO
    ======================================================== */

    titulo.textContent =
        `Expediente ${f.expediente}`;


    /* ========================================================
       CONTENIDO
    ======================================================== */

    contenido.innerHTML = `

        <table class="tabla-detalle">

            <tr>
                <td><b>Expediente:</b></td>
                <td>${f.expediente ?? ""}</td>
            </tr>

            <tr>
                <td><b>Oficina:</b></td>
                <td>${f.oficina ?? ""}</td>
            </tr>

            <tr>
                <td><b>Fecha Alta:</b></td>
                <td>
                    ${formatearFechaES(f.fecha_alta)}
                </td>
            </tr>

            <tr>
                <td><b>Contrato:</b></td>
                <td>${f.contrato ?? ""}</td>
            </tr>

            <tr>
                <td><b>Tipo Provisión:</b></td>
                <td>${f.tipo_provision ?? ""}</td>
            </tr>

            <tr>
                <td><b>Notario:</b></td>
                <td>${f.notario ?? ""}</td>
            </tr>

            <tr>
                <td><b>Provincia:</b></td>
                <td>${f.provincia ?? ""}</td>
            </tr>

            <tr>
                <td><b>Municipio:</b></td>
                <td>${f.municipio ?? ""}</td>
            </tr>

            <tr>
                <td><b>Comunidad:</b></td>
                <td>${f.comunidad ?? ""}</td>
            </tr>

            <tr>
                <td><b>Protocolo:</b></td>
                <td>${f.protocolo ?? ""}</td>
            </tr>

            <tr>
                <td><b>Fecha Protocolo:</b></td>
                <td>
                    ${formatearFechaES(f.fecha_protocolo)}
                </td>
            </tr>

            <tr>
                <td><b>V.C.:</b></td>
                <td>${f.vc ?? ""}</td>
            </tr>

            <tr>
                <td><b>Apoderado:</b></td>
                <td>${f.apoderado ?? ""}</td>
            </tr>

            <tr>
                <td><b>Envío Notario:</b></td>
                <td>
                    ${formatearFechaES(f.envio_notario)}
                </td>
            </tr>

            <tr>
                <td><b>Días:</b></td>
                <td>${f.dias ?? ""}</td>
            </tr>

            <tr>
                <td><b>Mes:</b></td>
                <td>${f.mes ?? ""}</td>
            </tr>

            <tr>
                <td><b>Año:</b></td>
                <td>${f.anio ?? ""}</td>
            </tr>

            <tr>
                <td><b>Centro:</b></td>
                <td>${f.centro ?? ""}</td>
            </tr>

            <tr>
                <td><b>Tipo Gestión:</b></td>
                <td>${f.tipo_gestion ?? ""}</td>
            </tr>

            <tr>
                <td><b>Centro que firma:</b></td>
                <td>${f.centro_que_firma ?? ""}</td>
            </tr>

            <tr>
                <td><b>Circuito:</b></td>
                <td>${f.circuito ?? ""}</td>
            </tr>

            <tr>
                <td><b>Tipo Firma:</b></td>
                <td>${f.tipo_firma ?? ""}</td>
            </tr>

        </table>

    `;


    /* ========================================================
       MOSTRAR MODAL
    ======================================================== */

    modal.classList.remove("hidden");

    /*
       Aseguramos también que el modal
       quede visible aunque otra regla
       CSS haya dejado display:none.
    */

    modal.style.display = "flex";


    console.log(
        "✅ Modal de expediente abierto correctamente"
    );
}


/* ============================================================
   CERRAR MODAL
============================================================ */

function cerrarModalDetalle() {

    const modal =
        document.getElementById(
            "modal-detalle"
        );


    if (!modal) return;


    modal.classList.add("hidden");

    modal.style.display = "";


    console.log(
        "✖️ Modal de expediente cerrado"
    );
}


/* ============================================================
   ORDENACIÓN POR COLUMNAS
============================================================ */

let ordenActual = {
    campo: null,
    asc: true
};


function ordenarPor(campo) {

    if (
        ordenActual.campo === campo
    ) {

        ordenActual.asc =
            !ordenActual.asc;

    } else {

        ordenActual = {
            campo,
            asc: true
        };
    }


    listadoDatos.sort((a, b) => {

        let x =
            a[campo] ?? "";

        let y =
            b[campo] ?? "";


        /*
           Si es fecha DD/MM/AAAA
           convertir.
        */

        if (campo.includes("fecha")) {

            x = convertirFecha(x);
            y = convertirFecha(y);
        }


        if (x < y)
            return ordenActual.asc
                ? -1
                : 1;


        if (x > y)
            return ordenActual.asc
                ? 1
                : -1;


        return 0;
    });


    renderTabla(
        paginar(listadoDatos)
    );
}


/* ============================================================
   CONVERTIR FECHA
============================================================ */

function convertirFecha(f) {

    if (!f) return 0;

    const partes =
        String(f).split("/");


    if (partes.length !== 3)
        return 0;


    const [d, m, a] = partes;


    return new Date(
        `${a}-${m}-${d}`
    ).getTime();
}
