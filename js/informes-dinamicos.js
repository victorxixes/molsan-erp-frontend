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
   GENERAR INFORME COMPLETO
============================================================ */

async function generarInformeDinamico() {
    const t0 = performance.now(); // medir tiempo

    inf_setLoading(true);
    inf_setSinResultados(false);

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) {
        inf_setLoading(false);
        inf_setSinResultados(true);
        return;
    }

    const idInforme = document.getElementById("selectInforme").value;
    const config = INFORMES_CONFIG.find(c => c.id === idInforme);

    const filtroAnio = document.getElementById("filtroAnioInforme").value.trim();
    const filtroMes = document.getElementById("filtroMesInforme").value.trim();

    let filtrados = datos;

    if (filtroAnio) filtrados = filtrados.filter(f => String(f.anio) === filtroAnio);
    if (filtroMes) filtrados = filtrados.filter(f => String(f.mes) === filtroMes);

    // Si no hay datos → mensaje
    if (!filtrados.length) {
        renderTablaInforme(config, []);
        inf_setLoading(false);
        inf_setSinResultados(true);
        return;
    }

    // Agrupación
    const agrupados = agruparDatos(filtrados, config.groupBy);

    // Render tabla
    renderTablaInforme(config, agrupados);

    // KPIs del informe dinámico
    const info = calcularKPIsInforme(filtrados);
    inf_actualizarKPIs(info);

    // Metadatos
    const t1 = performance.now();
    inf_actualizarMetadatos(filtrados.length, (t1 - t0).toFixed(0));

    // Descripción del informe
    document.getElementById("inf-descripcion").textContent =
        `Este informe muestra los datos agrupados por ${config.groupBy.join(", ")}.`;

    // Título
    document.getElementById("tituloInformeActual").textContent = config.nombre;

    inf_setLoading(false);
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
   KPIs DEL INFORME DINÁMICO
============================================================ */

function calcularKPIsInforme(datos) {
    let total = datos.length;
    let presencial = 0;
    let vc = 0;
    let sumaDias = 0;
    let cuentaDias = 0;

    datos.forEach(f => {
        if (f.tipo_firma === "VideoConferencia") vc++;
        else presencial++;

        const d = Number(f.dias);
        if (d > 0) {
            sumaDias += d;
            cuentaDias++;
        }
    });

    const sla = cuentaDias ? (sumaDias / cuentaDias).toFixed(1) : "0";

    return { total, presencial, vc, sla };
}

/* ============================================================
   ACCIONES Y ELEMENTOS PREMIUM
============================================================ */

function imprimirInformeDinamico() {
    window.print();
}

function inf_setLoading(state) {
    document.getElementById("inf-loading").classList.toggle("hidden", !state);
}

function inf_setSinResultados(state) {
    document.getElementById("inf-sin-resultados").classList.toggle("hidden", !state);
}

function inf_actualizarKPIs(info) {
    document.getElementById("inf-kpi-total").textContent = info.total;
    document.getElementById("inf-kpi-presencial").textContent = info.presencial;
    document.getElementById("inf-kpi-vc").textContent = info.vc;
    document.getElementById("inf-kpi-sla").textContent = info.sla;
}

function inf_mostrarParametros() {
    const box = document.getElementById("inf-parametros-box");
    const list = document.getElementById("inf-parametros-list");

    box.classList.remove("hidden");

    list.innerHTML = `
        <li>Tipo informe: ${document.getElementById("selectInforme").value}</li>
        <li>Año: ${document.getElementById("filtroAnioInforme").value || "Todos"}</li>
        <li>Mes: ${document.getElementById("filtroMesInforme").value || "Todos"}</li>
    `;
}

function inf_limpiarInforme() {
    document.getElementById("tablaInformeDinamico").innerHTML = "";
    inf_setSinResultados(false);
    inf_setLoading(false);
}

function inf_exportarExcel() {
    alert("📤 Exportación a Excel disponible en la versión PRO.");
}

function inf_actualizarMetadatos(total, tiempo) {
    document.getElementById("inf-meta-fecha").textContent = new Date().toLocaleString();
    document.getElementById("inf-meta-registros").textContent = total;
    document.getElementById("inf-meta-tiempo").textContent = tiempo + " ms";
}
