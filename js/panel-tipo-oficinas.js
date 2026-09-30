/* ============================================================
   PANEL OFICINAS — PREMIUM 2027
   FORMATO:
   - Columnas centradas
   - Valores con separador de miles español
   - Porcentajes conservados
============================================================ */

let POF_DATOS = [];
let POF_POR_ANIO = {};

let POF_CHART_RANKING = null;
let POF_CHART_EVOLUCION = null;


/* ============================================================
   FORMATEAR NÚMEROS
   Ejemplo:
   3508  → 3.508
   21387 → 21.387
   24649 → 24.649
============================================================ */

function pof_formatNumber(valor) {

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return valor;
    }

    return new Intl.NumberFormat("es-ES", {
        maximumFractionDigits: 0
    }).format(numero);
}


/* ============================================================
   FORMATEAR PORCENTAJES
   Ejemplo:
   17.8 → 17,8%
============================================================ */

function pof_formatPercent(valor) {

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return valor;
    }

    return numero.toLocaleString("es-ES", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }) + "%";
}


/* ============================================================
   ESTILO CENTRALIZADO PARA CELDAS
============================================================ */

function pof_td(valor, bold = false) {

    return `
        <td style="
            text-align:center;
            vertical-align:middle;
            ${bold ? "font-weight:700;" : ""}
        ">
            ${valor}
        </td>
    `;
}


/* ============================================================
   ESTILO CENTRALIZADO PARA ENCABEZADOS
============================================================ */

function pof_th(valor) {

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
   INICIALIZACIÓN
============================================================ */

async function initPanelOficinas() {

    console.log("🏢 initPanelOficinas() ejecutado");

    if (!document.getElementById("pof-select-anio")) {
        console.warn("⏳ Panel Oficinas aún no está en el DOM.");
        return;
    }

    let datos = await obtenerFirmas();

    datos = datos.map(f => aplicarReglas(f));

    POF_DATOS = datos;

    POF_POR_ANIO = pof_groupByAnio(datos);

    pof_fillSelectAnios();

    pof_selectUltimoAnio();

    document.getElementById("pof-select-anio")
        .addEventListener("change", cargarOficinas);

    cargarOficinas();
}


/* ============================================================
   AGRUPAR POR AÑO → OFICINA → MES
   Solo enero–junio
============================================================ */

function pof_groupByAnio(datos) {

    const mesesValidos = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio"
    ];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);

        if (!anio) continue;

        const mes = (f.mes || "")
            .toLowerCase()
            .trim();

        const idxMes = mesesValidos.indexOf(mes);

        if (idxMes === -1) continue;


        /* ====================================================
           DETERMINAR OFICINA
        ==================================================== */

        let oficinaRaw = String(f.oficina || "").trim();

        let oficinaNum = oficinaRaw.replace(/[^0-9]/g, "");

        let oficina =
            (oficinaNum === "5316")
                ? "Cancela"
                : "Oficina";


        /* ====================================================
           CREAR ESTRUCTURA
        ==================================================== */

        if (!map[anio]) {
            map[anio] = {};
        }

        if (!map[anio][oficina]) {

            map[anio][oficina] = {

                meses: Array(6).fill(0),

                total: 0
            };
        }


        const r = map[anio][oficina];


        /* ====================================================
           ACUMULAR
        ==================================================== */

        r.meses[idxMes]++;

        r.total++;
    }

    return map;
}


/* ============================================================
   SELECT DE AÑOS
============================================================ */

function pof_fillSelectAnios() {

    const sel = document.getElementById("pof-select-anio");

    if (!sel) return;

    sel.innerHTML = "";


    const anios = Object.keys(POF_POR_ANIO)
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

function pof_selectUltimoAnio() {

    const sel = document.getElementById("pof-select-anio");

    if (!sel || sel.options.length === 0) return;

    sel.value =
        sel.options[sel.options.length - 1].value;
}


/* ============================================================
   THEAD DINÁMICO
   Todo centrado
============================================================ */

function pof_renderThead() {

    const theadRow =
        document.getElementById("pof-thead-row");

    if (!theadRow) return;


    const meses = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio"
    ];


    theadRow.innerHTML = `

        ${meses.map(m => pof_th(m)).join("")}

        ${pof_th("Total")}

        ${meses.map(m => pof_th("%" + m)).join("")}

        ${pof_th("%Total")}
    `;
}


/* ============================================================
   CARGAR OFICINAS
============================================================ */

function cargarOficinas() {

    const sel =
        document.getElementById("pof-select-anio");

    if (!sel) return;


    const anioSel = Number(sel.value);

    const info = POF_POR_ANIO[anioSel];

    if (!info) return;


    /* ========================================================
       CABECERA
    ======================================================== */

    pof_renderThead();


    /* ========================================================
       TABLA
    ======================================================== */

    const tbody =
        document.querySelector("#pof-tabla-oficinas tbody");

    if (!tbody) return;

    tbody.innerHTML = "";


    const mesesOrden = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio"
    ];


    /* ========================================================
       PREPARAR DATOS
    ======================================================== */

    const lista = Object.entries(info).map(
        ([oficina, r]) => {

            const valoresMes = r.meses;

            const totalVisible =
                valoresMes.reduce(
                    (acc, v) => acc + v,
                    0
                );


            const porcentajesMes =
                valoresMes.map(v => {

                    if (totalVisible === 0) {
                        return "";
                    }

                    return (
                        (v / totalVisible) * 100
                    ).toFixed(1);
                });


            return {

                oficina,

                valoresMes,

                totalVisible,

                porcentajesMes
            };
        }
    );


    /* ========================================================
       FILAS DE OFICINAS
    ======================================================== */

    lista.forEach(row => {

        const tr = document.createElement("tr");


        tr.innerHTML = `

            ${pof_td(row.oficina)}

            ${row.valoresMes
                .map(v =>
                    pof_td(
                        pof_formatNumber(v)
                    )
                )
                .join("")
            }

            ${pof_td(
                pof_formatNumber(
                    row.totalVisible
                )
            )}

            ${row.porcentajesMes
                .map(p =>
                    pof_td(
                        pof_formatPercent(p)
                    )
                )
                .join("")
            }

            ${pof_td("100%")}
        `;


        tbody.appendChild(tr);
    });


    /* ========================================================
       FILA TOTAL
    ======================================================== */

    const totalesMes =
        mesesOrden.map((_, idx) =>

            lista.reduce(
                (acc, row) =>
                    acc + row.valoresMes[idx],
                0
            )
        );


    const totalGeneral =
        totalesMes.reduce(
            (acc, v) => acc + v,
            0
        );


    const porcentajesTotalesMes =
        totalesMes.map(v => {

            if (totalGeneral === 0) {
                return "";
            }

            return (
                (v / totalGeneral) * 100
            ).toFixed(1);
        });


    /* ========================================================
       CREAR TOTAL
    ======================================================== */

    const trTotal =
        document.createElement("tr");

    trTotal.classList.add(
        "fila-sumatorio"
    );


    trTotal.innerHTML = `

        ${pof_td("<b>TOTAL</b>", true)}

        ${totalesMes
            .map(v =>
                pof_td(
                    `<b>${pof_formatNumber(v)}</b>`,
                    true
                )
            )
            .join("")
        }

        ${pof_td(
            `<b>${pof_formatNumber(totalGeneral)}</b>`,
            true
        )}

        ${porcentajesTotalesMes
            .map(p =>
                pof_td(
                    `<b>${pof_formatPercent(p)}</b>`,
                    true
                )
            )
            .join("")
        }

        ${pof_td("<b>100%</b>", true)}
    `;


    tbody.appendChild(trTotal);


    /* ========================================================
       GRÁFICOS
    ======================================================== */

    pof_renderGraficos(
        lista,
        mesesOrden
    );
}


/* ============================================================
   GRÁFICOS — PREMIUM
============================================================ */

function pof_renderGraficos(
    lista,
    mesesOrden
) {


    /* ========================================================
       1) RANKING OFICINAS
    ======================================================== */

    const labelsRanking =
        lista.map(o => o.oficina);


    const dataRanking =
        lista.map(o => o.totalVisible);


    const ctxRanking =
        document.getElementById(
            "pof-chart-ranking"
        );


    if (POF_CHART_RANKING) {

        POF_CHART_RANKING.destroy();

        POF_CHART_RANKING = null;
    }


    if (ctxRanking) {

        POF_CHART_RANKING =
            new Chart(
                ctxRanking,
                {

                    type: "bar",

                    data: {

                        labels: labelsRanking,

                        datasets: [{

                            label: "Total firmas",

                            data: dataRanking,

                            backgroundColor:
                                "rgba(80, 200, 255, 0.5)",

                            borderColor:
                                "rgba(80, 200, 255, 1)",

                            borderWidth: 1.5
                        }]
                    },


                    options: {

                        indexAxis: "y",

                        responsive: true,


                        plugins: {

                            legend: {
                                display: false
                            },


                            tooltip: {

                                callbacks: {

                                    label: function(context) {

                                        return (
                                            "Total firmas: " +
                                            pof_formatNumber(
                                                context.raw
                                            )
                                        );
                                    }
                                }
                            }
                        },


                        scales: {

                            x: {

                                ticks: {

                                    color: "#111",

                                    callback: function(value) {

                                        return pof_formatNumber(
                                            value
                                        );
                                    }
                                }
                            },


                            y: {

                                ticks: {
                                    color: "#111"
                                }
                            }
                        }
                    }
                }
            );
    }


    /* ========================================================
       2) EVOLUCIÓN MENSUAL
    ======================================================== */

    const totalesMes =
        mesesOrden.map((_, idx) =>

            lista.reduce(
                (acc, row) =>
                    acc + row.valoresMes[idx],
                0
            )
        );


    const ctxEvo =
        document.getElementById(
            "pof-chart-evolucion"
        );


    if (POF_CHART_EVOLUCION) {

        POF_CHART_EVOLUCION.destroy();

        POF_CHART_EVOLUCION = null;
    }


    if (ctxEvo) {

        POF_CHART_EVOLUCION =
            new Chart(
                ctxEvo,
                {

                    type: "line",


                    data: {

                        labels: mesesOrden,

                        datasets: [{

                            label: "Total mensual",

                            data: totalesMes,

                            borderColor:
                                "rgba(255, 120, 80, 1)",

                            backgroundColor:
                                "rgba(255, 120, 80, 0.3)",

                            borderWidth: 2,

                            tension: 0.3
                        }]
                    },


                    options: {

                        responsive: true,


                        plugins: {

                            legend: {
                                display: false
                            },


                            tooltip: {

                                callbacks: {

                                    label: function(context) {

                                        return (
                                            "Total mensual: " +
                                            pof_formatNumber(
                                                context.raw
                                            )
                                        );
                                    }
                                }
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

                                    callback: function(value) {

                                        return pof_formatNumber(
                                            value
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            );
    }
}
