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
    },

    /* 🔥 NUEVO INFORME PREMIUM DE APODERADOS */
    {
        id: "apoderados_premium",
        nombre: "Informe Premium de Apoderados",
        tipo: "especial",
        groupBy: ["apoderado"]
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

    /* ============================================================
       🔥 INFORME ESPECIAL — APODERADOS PREMIUM
    ============================================================= */
    if (config.id === "apoderados_premium") {

        const tablaHTML = generarInformeApoderadosPremium(filtrados);
        document.getElementById("tablaInformeDinamico").innerHTML = tablaHTML;

        // KPIs
        const info = calcularKPIsInforme(filtrados);
        inf_actualizarKPIs(info);

        // Metadatos
        const t1 = performance.now();
        inf_actualizarMetadatos(filtrados.length, (t1 - t0).toFixed(0));

        // Descripción
        document.getElementById("inf-descripcion").textContent =
            "Informe premium con desglose mensual y porcentual por apoderado.";

        // Título
        document.getElementById("tituloInformeActual").textContent = config.nombre;

        inf_setLoading(false);
        return;
    }

    /* ============================================================
       INFORMES AGRUPADOS NORMALES
    ============================================================= */

    const agrupados = agruparDatos(filtrados, config.groupBy);

    renderTablaInforme(config, agrupados);

    const info = calcularKPIsInforme(filtrados);
    inf_actualizarKPIs(info);

    const t1 = performance.now();
    inf_actualizarMetadatos(filtrados.length, (t1 - t0).toFixed(0));

    document.getElementById("inf-descripcion").textContent =
        `Este informe muestra los datos agrupados por ${config.groupBy.join(", ")}.`;

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
   RENDER TABLA (GENÉRICA)
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
   INFORME PREMIUM DE APODERADOS (MESES + %)
============================================================ */

function generarInformeApoderadosPremium(datos) {

    const meses = ["enero","febrero","marzo","abril"];

    const mapa = {};

    datos.forEach(f => {
        const ap = f.apoderado || "Sin apoderado";
        const mes = f.mes;

        if (!meses.includes(mes)) return;

        if (!mapa[ap]) {
            mapa[ap] = {
                nombre: ap,
                meses: { enero:0, febrero:0, marzo:0, abril:0 },
                total: 0
            };
        }

        mapa[ap].meses[mes]++;
        mapa[ap].total++;
    });

    const lista = Object.values(mapa).sort((a,b)=>b.total - a.total);

    const totalGlobal = {
        enero:0, febrero:0, marzo:0, abril:0, total:0
    };

    lista.forEach(a => {
        totalGlobal.enero   += a.meses.enero;
        totalGlobal.febrero += a.meses.febrero;
        totalGlobal.marzo   += a.meses.marzo;
        totalGlobal.abril   += a.meses.abril;
        totalGlobal.total   += a.total;
    });

    let html = `
    <thead>
        <tr>
            <th>Apoderados</th>
            <th>Enero</th>
            <th>Febrero</th>
            <th>Marzo</th>
            <th>Abril</th>
            <th>Total</th>
            <th>% Enero</th>
            <th>% Febrero</th>
            <th>% Marzo</th>
            <th>% Abril</th>
            <th>% Total</th>
        </tr>
    </thead>
    <tbody>
    `;

    lista.forEach(a => {

        const pct = {
            enero:   ((a.meses.enero   / totalGlobal.enero)   * 100).toFixed(2) + "%",
            febrero: ((a.meses.febrero / totalGlobal.febrero) * 100).toFixed(2) + "%",
            marzo:   ((a.meses.marzo   / totalGlobal.marzo)   * 100).toFixed(2) + "%",
            abril:   ((a.meses.abril   / totalGlobal.abril)   * 100).toFixed(2) + "%",
            total:   ((a.total         / totalGlobal.total)   * 100).toFixed(2) + "%"
        };

        html += `
        <tr>
            <td>${a.nombre}</td>
            <td>${a.meses.enero}</td>
            <td>${a.meses.febrero}</td>
            <td>${a.meses.marzo}</td>
            <td>${a.meses.abril}</td>
            <td>${a.total}</td>
            <td>${pct.enero}</td>
            <td>${pct.febrero}</td>
            <td>${pct.marzo}</td>
            <td>${pct.abril}</td>
            <td>${pct.total}</td>
        </tr>`;
    });

    html += `
        <tr class="fila-total">
            <td><strong>Total</strong></td>
            <td><strong>${totalGlobal.enero}</strong></td>
            <td><strong>${totalGlobal.febrero}</strong></td>
            <td><strong>${totalGlobal.marzo}</strong></td>
            <td><strong>${totalGlobal.abril}</strong></td>
            <td><strong>${totalGlobal.total}</strong></td>
            <td><strong>100%</strong></td>
            <td><strong>100%</strong></td>
            <td><strong>100%</strong></td>
            <td><strong>100%</strong></td>
            <td><strong>100%</strong></td>
        </tr>
    </tbody>
    `;

    return html;
}
function agruparPorOficina(datos) {
    const map = {};

    for (const f of datos) {

        // 🔥 NORMALIZACIÓN GLASS LUXE 2027
        let oficina = f.oficina || "Sin oficina";

        if (oficina === "5316") {
            oficina = "Cancela";
        } else {
            oficina = "Oficina";
        }

        if (!map[oficina]) {
            map[oficina] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sla: 0,
                sumaDias: 0,
                cuentaDias: 0
            };
        }

        const o = map[oficina];

        o.total++;

        if (f.tipo_firma === "VideoConferencia") {
            o.vc++;
        } else {
            o.presencial++;
        }

        const d = Number(f.dias);
        if (d > 0) {
            o.sumaDias += d;
            o.cuentaDias++;
        }
    }

    // SLA medio
    for (const k in map) {
        const o = map[k];
        o.sla = o.cuentaDias > 0 ? (o.sumaDias / o.cuentaDias).toFixed(1) : 0;
    }

    return map;
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
