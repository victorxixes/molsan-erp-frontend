/* ============================================================
   INFORMES DINÁMICOS — GLASS LUXE 2027
============================================================ */

// Plantillas de informes dinámicos
const INFORMES_CONFIG = [
    {
        id: "general_mensual",
        nombre: "Informe General Mensual",
        tipo: "agrupado",
        groupBy: ["anio", "mes"]
    },
    {
        id: "por_oficina",
        nombre: "Informe por Oficina",
        tipo: "agrupado",
        groupBy: ["oficina"]
    },
    {
        id: "por_apoderado",
        nombre: "Informe por Apoderado",
        tipo: "agrupado",
        groupBy: ["apoderado"]
    },
    {
        id: "por_circuito",
        nombre: "Informe por Circuito Notarial",
        tipo: "agrupado",
        groupBy: ["circuito"]
    },
    {
        id: "por_tipo_firma",
        nombre: "Informe por Tipo de Firma",
        tipo: "agrupado",
        groupBy: ["tipo_firma"]
    },
    {
        id: "por_tipo_gestion",
        nombre: "Informe por Tipo de Gestión",
        tipo: "agrupado",
        groupBy: ["tipo_gestion"]
    },
    {
        id: "por_canal",
        nombre: "Informe por Canal",
        tipo: "agrupado",
        groupBy: ["canal"]
    },
    {
        id: "por_centro_que_firma",
        nombre: "Informe por Centro que Firma",
        tipo: "agrupado",
        groupBy: ["centro_que_firma"]
    }
];

/* ============================================================
   INIT DEL MÓDULO
============================================================ */

async function initInformesDinamicos() {
    console.log("📑 initInformesDinamicos() ejecutado");

    const select = document.getElementById("selectInforme");
    if (!select) return;

    // Rellenar selector
    select.innerHTML = "";
    INFORMES_CONFIG.forEach(cfg => {
        const opt = document.createElement("option");
        opt.value = cfg.id;
        opt.textContent = cfg.nombre;
        select.appendChild(opt);
    });

    // Generar informe inicial
    await generarInformeDinamico();
}

/* ============================================================
   GENERAR INFORME
============================================================ */

async function generarInformeDinamico() {
    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const idInforme = document.getElementById("selectInforme").value;
    const config = INFORMES_CONFIG.find(c => c.id === idInforme);

    const filtroAnio = document.getElementById("filtroAnioInforme").value.trim();
    const filtroMes = document.getElementById("filtroMesInforme").value.trim();

    let filtrados = datos;

    if (filtroAnio) filtrados = filtrados.filter(f => String(f.anio) === filtroAnio);
    if (filtroMes) filtrados = filtrados.filter(f => String(f.mes) === filtroMes);

    const agrupados = agruparDatos(filtrados, config.groupBy);

    renderTablaInforme(config, agrupados);

    document.getElementById("tituloInformeActual").textContent = config.nombre;
}

/* ============================================================
   AGRUPACIÓN
============================================================ */

function agruparDatos(datos, campos) {
    const mapa = new Map();

    datos.forEach(f => {
        const keyParts = campos.map(c => f[c] ?? "");
        const key = keyParts.join("||");

        if (!mapa.has(key)) mapa.set(key, { keyParts, total: 0 });

        mapa.get(key).total += 1;
    });

    return Array.from(mapa.values());
}

/* ============================================================
   RENDER TABLA
============================================================ */

function renderTablaInforme(config, filas) {
    const tabla = document.getElementById("tablaInformeDinamico");
    if (!tabla) return;

    if (!filas.length) {
        tabla.innerHTML = `<thead><tr><th>Sin datos</th></tr></thead><tbody></tbody>`;
        return;
    }

    const campos = config.groupBy;

    let thead = "<thead><tr>";
    campos.forEach(c => thead += `<th>${formatearCampo(c)}</th>`);
    thead += `<th>Total firmas</th></tr></thead>`;

    let tbody = "<tbody>";
    filas.forEach(f => {
        tbody += "<tr>";
        f.keyParts.forEach(v => tbody += `<td>${v || "-"}</td>`);
        tbody += `<td>${f.total.toLocaleString("es-ES")}</td>`;
        tbody += "</tr>";
    });
    tbody += "</tbody>";

    tabla.innerHTML = thead + tbody;
}

/* ============================================================
   UTILIDADES
============================================================ */

function formatearCampo(c) {
    const mapa = {
        anio: "Año",
        mes: "Mes",
        oficina: "Oficina",
        apoderado: "Apoderado",
        circuito: "Circuito",
        tipo_firma: "Tipo de Firma",
        tipo_gestion: "Tipo de Gestión",
        canal: "Canal",
        centro_que_firma: "Centro que Firma"
    };
    return mapa[c] || c;
}

/* ============================================================
   IMPRESIÓN
============================================================ */

function imprimirInformeDinamico() {
    window.print();
}
