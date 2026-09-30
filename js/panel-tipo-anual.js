/* ============================================================
   PANEL ANUAL — PREMIUM 2027
   - Columnas centradas
   - Valores numéricos con separador de miles
   - Formato español: 3.508 / 31.755
   - Compatible con tu HTML actual
============================================================ */

let PA_DATOS = [];
let PA_POR_ANIO = {};
let PA_CHART = null;


/* ============================================================
   HELPER SEGURO
============================================================ */
function paSafeSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;

    el.textContent = value;
    return true;
}


/* ============================================================
   FORMATO DE MILES
   Ejemplos:
   3508  → 3.508
   4739  → 4.739
   31755 → 31.755
============================================================ */
function paMiles(n) {
    const numero = Number(n);

    if (!Number.isFinite(numero)) {
        return "0";
    }

    return numero.toLocaleString("es-ES");
}


/* ============================================================
   ESTILO PARA CELDAS NUMÉRICAS
============================================================ */
function paTd(valor, negrita = false) {

    return `
        <td style="
            text-align:center;
            vertical-align:middle;
            ${negrita ? "font-weight:700;" : ""}
        ">
            ${valor}
        </td>
    `;
}


/* ============================================================
   ESTILO PARA CABECERAS
============================================================ */
function paTh(valor) {

    return `
        <th style="
            text-align:center;
            vertical-align:middle;
        ">
            ${valor}
        </th>
    `;
}


/* ============================================================
   INIT PANEL ANUAL
============================================================ */
async function initPanelAnual() {

    console.log("📆 initPanelAnual() ejecutado");

    if (!document.getElementById("pa-select-anio")) {
        console.warn("⏳ Panel Anual aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();

    if (!datos || !datos.length) return;

    PA_DATOS = datos;
    PA_POR_ANIO = pa_groupByAnioMes(PA_DATOS);

    pa_fillSelectAnios();
    pa_selectUltimoAnio();

    const selector = document.getElementById("pa-select-anio");

    if (selector) {
        selector.addEventListener("change", pa_onChangeAnio);
    }
}


/* ============================================================
   AGRUPAR POR AÑO → MES
============================================================ */
function pa_groupByAnioMes(datos) {

    const map = {};

    const mesesValidos = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre"
    ];

    for (const f of datos) {

        const anio = Number(f.anio);

        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();

        if (!mesesValidos.includes(mes)) continue;

        const dias = Number(f.dias);

        const esVC = (
            String(f.tipo_firma || "").toLowerCase()
            === "videoconferencia"
        );

        if (!map[anio]) {
            map[anio] = {};
        }

        if (!map[anio][mes]) {

            map[anio][mes] = {
                total: 0,
                presencial: 0,
                vc: 0,
                sumaDias: 0,
                cuentaDias: 0
            };
        }

        const r = map[anio][mes];

        r.total++;

        if (esVC) {
            r.vc++;
        } else {
            r.presencial++;
        }

        if (dias > 0) {
            r.sumaDias += dias;
            r.cuentaDias++;
        }
    }

    return map;
}


/* ============================================================
   SELECT AÑOS
============================================================ */
function pa_fillSelectAnios() {

    const sel = document.getElementById("pa-select-anio");

    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(PA_POR_ANIO)
        .map(Number)
        .sort((a, b) => a - b);

    for (const anio of anios) {

        const opt = document.createElement("option");

        opt.value = anio;
        opt.textContent = anio;

        sel.appendChild(opt);
    }
}


/* ============================================================
   SELECCIONAR ÚLTIMO AÑO
============================================================ */
function pa_selectUltimoAnio() {

    const sel = document.getElementById("pa-select-anio");

    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;

    pa_onChangeAnio();
}


/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function pa_onChangeAnio() {

    const sel = document.getElementById("pa-select-anio");

    if (!sel) return;

    const anio = Number(sel.value);

    const info = PA_POR_ANIO[anio];

    if (!info) return;

    pa_renderKpis(info);
    pa_renderTabla(info, anio);
    pa_renderChart(info, anio);
}


/* ============================================================
   KPIs
============================================================ */
function pa_renderKpis(info) {

    let total = 0;
    let vc = 0;

    let sumaDias = 0;
    let cuentaDias = 0;

    let topMes = "-";
    let maxMes = 0;

    for (const mes in info) {

        const r = info[mes];

        total += r.total;
        vc += r.vc;

        sumaDias += r.sumaDias;
        cuentaDias += r.cuentaDias;

        if (r.total > maxMes) {

            maxMes = r.total;
            topMes = mes;
        }
    }

    const pctVC = total
        ? ((vc / total) * 100).toFixed(1) + "%"
        : "0%";

    const sla = cuentaDias
        ? (sumaDias / cuentaDias).toFixed(1)
        : "0";

    /* Total con miles */
    paSafeSet(
        "pa-kpi-total",
        paMiles(total)
    );

    paSafeSet(
        "pa-kpi-sla",
        sla
    );

    paSafeSet(
        "pa-kpi-vc",
        pctVC
    );

    paSafeSet(
        "pa-kpi-top-mes",
        topMes
    );
}


/* ============================================================
   OBTENER DATOS FILTRADOS DEL AÑO
============================================================ */
function pa_getDatosFiltradosDelAnio(anio) {

    return PA_DATOS.filter(
        f => Number(f.anio) === anio
    );
}


/* ============================================================
   TABLA MENSUAL + FILA DE TOTALES
============================================================ */
function pa_renderTabla(info, anio) {

    const tbody = document.querySelector(
        "#pa-tabla-meses tbody"
    );

    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();


    /* ========================================================
       FILAS MENSUALES
    ======================================================== */

    for (const mes of mesesOrden) {

        const idxMes = mesesOrden.indexOf(mes);

        /*
         * Si estamos en el año actual,
         * no mostramos meses futuros.
         */
        if (
            anio === currentYear &&
            idxMes > currentMonthIndex
        ) {
            continue;
        }

        const r = info[mes];

        if (!r) continue;

        const sla = r.cuentaDias
            ? (r.sumaDias / r.cuentaDias).toFixed(1)
            : "0";

        const pctVC = r.total
            ? ((r.vc / r.total) * 100).toFixed(1) + "%"
            : "0%";


        const tr = document.createElement("tr");


        /*
         * Primera columna:
         * nombre del mes.
         *
         * El resto:
         * centrado + miles.
         */
        tr.innerHTML = `

            <td style="
                text-align:left;
                vertical-align:middle;
            ">
                ${mes}
            </td>

            ${paTd(paMiles(r.total))}

            ${paTd(paMiles(r.presencial))}

            ${paTd(paMiles(r.vc))}

            ${paTd(pctVC)}

            ${paTd(sla)}

        `;

        tbody.appendChild(tr);
    }


    /* ========================================================
       TOTALES DEL AÑO
    ======================================================== */

    pa_renderTotales(
        pa_getDatosFiltradosDelAnio(anio)
    );
}


/* ============================================================
   FILA DE TOTALES
============================================================ */
function pa_renderTotales(datosFiltrados) {

    let total = 0;
    let presencial = 0;
    let vc = 0;

    let sumaSLA = 0;
    let cuentaSLA = 0;


    datosFiltrados.forEach(f => {

        total++;

        const tipoFirma = String(
            f.tipo_firma || ""
        ).toLowerCase();


        if (tipoFirma === "videoconferencia") {

            vc++;

        } else {

            presencial++;
        }


        const d = Number(f.dias);

        if (d > 0) {

            sumaSLA += d;
            cuentaSLA++;
        }
    });


    const pctVC = total
        ? ((vc / total) * 100).toFixed(1)
        : "0";

    const sla = cuentaSLA
        ? (sumaSLA / cuentaSLA).toFixed(1)
        : "0";


    const tr = document.getElementById(
        "pa-total-row"
    );

    if (!tr) return;


    /*
     * TODAS las columnas centradas
     * y cantidades con separador de miles.
     */
    tr.innerHTML = `

        <td style="
            text-align:left;
            vertical-align:middle;
        ">
            <strong>Total</strong>
        </td>

        ${paTd(
            `<strong>${paMiles(total)}</strong>`
        )}

        ${paTd(
            `<strong>${paMiles(presencial)}</strong>`
        )}

        ${paTd(
            `<strong>${paMiles(vc)}</strong>`
        )}

        ${paTd(
            `<strong>${pctVC}%</strong>`
        )}

        ${paTd(
            `<strong>${sla}</strong>`
        )}

    `;
}


/* ============================================================
   GRÁFICO EVOLUCIÓN ANUAL
============================================================ */
function pa_renderChart(info, anio) {

    const ctx = document.getElementById(
        "pa-chart-anual"
    );

    if (!ctx) return;


    const mesesOrden = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre"
    ];


    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();


    const meses = mesesOrden.filter((m, idx) => {

        if (
            anio === currentYear &&
            idx > currentMonthIndex
        ) {
            return false;
        }

        return info[m];
    });


    /*
     * IMPORTANTE:
     * Aquí mantenemos los números SIN formato
     * porque Chart.js necesita valores numéricos.
     */
    const data = meses.map(
        m => Number(info[m].total)
    );


    if (PA_CHART) {
        PA_CHART.destroy();
    }


    PA_CHART = new Chart(ctx, {

        type: "line",

        data: {

            labels: meses,

            datasets: [{

                label: "Total firmas",

                data,

                borderColor: "rgba(80,200,255,1)",

                backgroundColor:
                    "rgba(80,200,255,0.2)",

                borderWidth: 1.5,

                tension: 0.2
            }]
        },


        options: {

            responsive: true,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {

                x: {
                    ticks: {
                        color: "#111"
                    }
                },

                y: {

                    ticks: {

                        color: "#111",

                        /*
                         * También ponemos miles
                         * en el eje del gráfico.
                         */
                        callback: function(value) {
                            return paMiles(value);
                        }
                    }
                }
            }
        }
    });
}
