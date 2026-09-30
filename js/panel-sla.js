/* ============================================================
   PANEL SLA — PREMIUM 2027 (COMPATIBLE CON TU HTML)
============================================================ */

let SLA_DATOS = [];
let SLA_POR_ANIO = {};
let SLA_CHART_EVOLUCION = null;
let SLA_CHART_CONTRA = null;


/* ============================================================
   HELPER SEGURO
============================================================ */
function slaSafeSet(id, value) {

    const el =
        document.getElementById(id);

    if (!el) return false;

    el.textContent = value;

    return true;
}


/* ============================================================
   FORMATO DE MILES
   1078  → 1.078
   3508  → 3.508
   31755 → 31.755
============================================================ */
function slaFormatoMiles(n) {

    if (
        n === null ||
        n === undefined ||
        n === ""
    ) {
        return "-";
    }


    const numero =
        Number(n);


    if (!Number.isFinite(numero)) {
        return "-";
    }


    return Math.round(numero)
        .toLocaleString("es-ES");
}


/* ============================================================
   ESTILOS — CENTRAR VALORES DE LAS COLUMNAS
============================================================ */
function slaInyectarEstilos() {

    if (
        document.getElementById(
            "sla-estilos-premium"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "sla-estilos-premium";


    style.textContent = `

        /* ================================================
           CABECERAS
        ================================================ */

        #sla-tabla-meses thead th {

            text-align: center !important;

            vertical-align: middle !important;
        }


        /* ================================================
           CELDAS
        ================================================ */

        #sla-tabla-meses tbody td {

            vertical-align: middle !important;
        }


        /* ================================================
           COLUMNA MES
        ================================================ */

        #sla-tabla-meses tbody td:first-child {

            text-align: left !important;
        }


        /* ================================================
           VALORES NUMÉRICOS
        ================================================ */

        #sla-tabla-meses tbody td:not(:first-child) {

            text-align: center !important;
        }


        /* ================================================
           FILA TOTAL
        ================================================ */

        #sla-total-row td {

            text-align: center !important;

            vertical-align: middle !important;
        }


        #sla-total-row td:first-child {

            text-align: left !important;
        }

    `;


    document.head.appendChild(
        style
    );
}


/* ============================================================
   INIT PANEL SLA
============================================================ */
async function initPanelSLA() {

    console.log(
        "⏱️ initPanelSLA() ejecutado"
    );


    /*
       Inyectamos los estilos antes
       de pintar la tabla.
    */

    slaInyectarEstilos();


    if (
        !document.getElementById(
            "sla-select-anio"
        )
    ) {

        console.warn(
            "⏳ Panel SLA aún no está en el DOM."
        );

        return;
    }


    const datos =
        await obtenerFirmas();


    if (
        !datos ||
        !datos.length
    ) {
        return;
    }


    SLA_DATOS =
        datos;


    SLA_POR_ANIO =
        sla_groupByAnioMes(
            SLA_DATOS
        );


    sla_fillSelectAnios();


    sla_selectUltimoAnio();


    const selector =
        document.getElementById(
            "sla-select-anio"
        );


    /*
       Evitamos registrar
       el evento varias veces.
    */

    if (
        selector &&
        !selector.dataset.slaChangeBound
    ) {

        selector.addEventListener(
            "change",
            sla_onChangeAnio
        );


        selector.dataset.slaChangeBound =
            "1";
    }
}


/* ============================================================
   AGRUPAR POR AÑO → MES
============================================================ */
function sla_groupByAnioMes(
    datos
) {

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


    for (
        const f of datos
    ) {

        const anio =
            Number(
                f.anio
            );


        if (!anio) {
            continue;
        }


        const mes =
            (
                f.mes ||
                ""
            )
            .toLowerCase()
            .trim();


        if (
            !mesesValidos.includes(
                mes
            )
        ) {
            continue;
        }


        const dias =
            Number(
                f.dias
            );


        const esVC =
            (
                f.tipo_firma ===
                "VideoConferencia"
            );


        const esCon =
            (
                f.tipo_provision ||
                ""
            )
            .toLowerCase()
            .includes(
                "con"
            );


        const esSin =
            (
                f.tipo_provision ||
                ""
            )
            .toLowerCase()
            .includes(
                "sin"
            );


        if (
            !map[anio]
        ) {

            map[anio] = {};
        }


        if (
            !map[anio][mes]
        ) {

            map[anio][mes] = {

                total: 0,

                sla: 0,

                sumaDias: 0,

                cuentaDias: 0,

                sumaCon: 0,

                cuentaCon: 0,

                sumaSin: 0,

                cuentaSin: 0,

                presencial: 0,

                vc: 0
            };
        }


        const r =
            map[anio][mes];


        r.total++;


        if (esVC) {

            r.vc++;

        } else {

            r.presencial++;
        }


        if (
            dias > 0
        ) {

            r.sumaDias +=
                dias;


            r.cuentaDias++;


            if (esCon) {

                r.sumaCon +=
                    dias;

                r.cuentaCon++;
            }


            if (esSin) {

                r.sumaSin +=
                    dias;

                r.cuentaSin++;
            }
        }
    }


    return map;
}


/* ============================================================
   SELECT AÑOS
============================================================ */
function sla_fillSelectAnios() {

    const sel =
        document.getElementById(
            "sla-select-anio"
        );


    if (!sel) {
        return;
    }


    sel.innerHTML = "";


    const anios =
        Object.keys(
            SLA_POR_ANIO
        )
        .map(Number)
        .sort(
            (a, b) =>
                a - b
        );


    for (
        const anio of anios
    ) {

        const opt =
            document.createElement(
                "option"
            );


        opt.value =
            anio;


        opt.textContent =
            anio;


        sel.appendChild(
            opt
        );
    }
}


/* ============================================================
   SELECCIONAR ÚLTIMO AÑO
============================================================ */
function sla_selectUltimoAnio() {

    const sel =
        document.getElementById(
            "sla-select-anio"
        );


    if (
        !sel ||
        sel.options.length === 0
    ) {
        return;
    }


    sel.value =
        sel.options[
            sel.options.length - 1
        ].value;


    sla_onChangeAnio();
}


/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function sla_onChangeAnio() {

    const sel =
        document.getElementById(
            "sla-select-anio"
        );


    if (!sel) {
        return;
    }


    const anio =
        Number(
            sel.value
        );


    const info =
        SLA_POR_ANIO[
            anio
        ];


    if (!info) {
        return;
    }


    sla_renderKpis(
        info
    );


    sla_renderTabla(
        info,
        anio
    );


    sla_renderChartEvolucion(
        info,
        anio
    );


    sla_renderChartContra(
        info,
        anio
    );
}


/* ============================================================
   KPIs
============================================================ */
function sla_renderKpis(
    info
) {

    let total = 0;

    let sumaDias = 0;
    let cuentaDias = 0;

    let sumaCon = 0;
    let cuentaCon = 0;

    let sumaSin = 0;
    let cuentaSin = 0;


    for (
        const mes in info
    ) {

        const r =
            info[mes];


        total +=
            r.total;


        sumaDias +=
            r.sumaDias;


        cuentaDias +=
            r.cuentaDias;


        sumaCon +=
            r.sumaCon;


        cuentaCon +=
            r.cuentaCon;


        sumaSin +=
            r.sumaSin;


        cuentaSin +=
            r.cuentaSin;
    }


    const sla =
        cuentaDias
            ? (
                sumaDias /
                cuentaDias
            ).toFixed(1)
            : "0";


    const slaCon =
        cuentaCon
            ? (
                sumaCon /
                cuentaCon
            ).toFixed(1)
            : "0";


    const slaSin =
        cuentaSin
            ? (
                sumaSin /
                cuentaSin
            ).toFixed(1)
            : "0";


    /*
       Total firmas con separador
       de miles.
    */

    slaSafeSet(
        "sla-kpi-total",
        slaFormatoMiles(
            total
        )
    );


    slaSafeSet(
        "sla-kpi-sla",
        sla
    );


    slaSafeSet(
        "sla-kpi-con",
        slaCon
    );


    slaSafeSet(
        "sla-kpi-sin",
        slaSin
    );
}


/* ============================================================
   OBTENER DATOS FILTRADOS DEL AÑO
============================================================ */
function sla_getDatosFiltradosDelAnio(
    anio
) {

    return SLA_DATOS.filter(
        f =>
            Number(
                f.anio
            ) === anio
    );
}


/* ============================================================
   TABLA MENSUAL + FILA DE TOTALES
============================================================ */
function sla_renderTabla(
    info,
    anio
) {

    const tbody =
        document.querySelector(
            "#sla-tabla-meses tbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        "";


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


    const currentYear =
        new Date()
            .getFullYear();


    const currentMonthIndex =
        new Date()
            .getMonth();


    for (
        const mes of mesesOrden
    ) {

        const idxMes =
            mesesOrden.indexOf(
                mes
            );


        /*
           Para el año actual
           no mostramos meses futuros.
        */

        if (
            anio === currentYear &&
            idxMes >
                currentMonthIndex
        ) {

            continue;
        }


        const r =
            info[mes];


        if (!r) {
            continue;
        }


        const sla =
            r.cuentaDias
                ? (
                    r.sumaDias /
                    r.cuentaDias
                ).toFixed(1)
                : "0";


        const slaCon =
            r.cuentaCon
                ? (
                    r.sumaCon /
                    r.cuentaCon
                ).toFixed(1)
                : "0";


        const slaSin =
            r.cuentaSin
                ? (
                    r.sumaSin /
                    r.cuentaSin
                ).toFixed(1)
                : "0";


        const pctPres =
            r.total
                ? (
                    (
                        r.presencial /
                        r.total
                    ) *
                    100
                ).toFixed(1) + "%"
                : "0%";


        const pctVC =
            r.total
                ? (
                    (
                        r.vc /
                        r.total
                    ) *
                    100
                ).toFixed(1) + "%"
                : "0%";


        const tr =
            document.createElement(
                "tr"
            );


        tr.innerHTML = `

            <td>
                ${mes}
            </td>

            <td>
                ${slaFormatoMiles(
                    r.total
                )}
            </td>

            <td>
                ${sla}
            </td>

            <td>
                ${slaCon}
            </td>

            <td>
                ${slaSin}
            </td>

            <td>
                ${slaFormatoMiles(
                    r.presencial
                )}
            </td>

            <td>
                ${slaFormatoMiles(
                    r.vc
                )}
            </td>

            <td>
                ${pctPres}
            </td>

            <td>
                ${pctVC}
            </td>
        `;


        tbody.appendChild(
            tr
        );
    }


    /*
       Generar totales del año.
    */

    sla_renderTotales(
        sla_getDatosFiltradosDelAnio(
            anio
        )
    );
}


/* ============================================================
   FILA DE TOTALES
============================================================ */
function sla_renderTotales(
    datosFiltrados
) {

    let total = 0;


    let sumaSLA = 0;
    let cuentaSLA = 0;


    let sumaCon = 0;
    let cuentaCon = 0;


    let sumaSin = 0;
    let cuentaSin = 0;


    let presencial = 0;
    let vc = 0;


    datosFiltrados.forEach(
        f => {

            total++;


            const d =
                Number(
                    f.dias
                );


            if (
                d > 0
            ) {

                sumaSLA +=
                    d;


                cuentaSLA++;


                if (
                    (
                        f.tipo_provision ||
                        ""
                    )
                    .toLowerCase()
                    .includes(
                        "con"
                    )
                ) {

                    sumaCon +=
                        d;

                    cuentaCon++;
                }


                if (
                    (
                        f.tipo_provision ||
                        ""
                    )
                    .toLowerCase()
                    .includes(
                        "sin"
                    )
                ) {

                    sumaSin +=
                        d;

                    cuentaSin++;
                }
            }


            if (
                f.tipo_firma ===
                "VideoConferencia"
            ) {

                vc++;

            } else {

                presencial++;
            }
        }
    );


    const sla =
        cuentaSLA
            ? (
                sumaSLA /
                cuentaSLA
            ).toFixed(1)
            : "0";


    const slaCon =
        cuentaCon
            ? (
                sumaCon /
                cuentaCon
            ).toFixed(1)
            : "0";


    const slaSin =
        cuentaSin
            ? (
                sumaSin /
                cuentaSin
            ).toFixed(1)
            : "0";


    const pctPres =
        total
            ? (
                (
                    presencial /
                    total
                ) *
                100
            ).toFixed(1) + "%"
            : "0%";


    const pctVC =
        total
            ? (
                (
                    vc /
                    total
                ) *
                100
            ).toFixed(1) + "%"
            : "0%";


    const tr =
        document.getElementById(
            "sla-total-row"
        );


    if (!tr) {
        return;
    }


    tr.innerHTML = `

        <td>
            <strong>
                Total
            </strong>
        </td>

        <td>
            <strong>
                ${slaFormatoMiles(
                    total
                )}
            </strong>
        </td>

        <td>
            <strong>
                ${sla}
            </strong>
        </td>

        <td>
            <strong>
                ${slaCon}
            </strong>
        </td>

        <td>
            <strong>
                ${slaSin}
            </strong>
        </td>

        <td>
            <strong>
                ${slaFormatoMiles(
                    presencial
                )}
            </strong>
        </td>

        <td>
            <strong>
                ${slaFormatoMiles(
                    vc
                )}
            </strong>
        </td>

        <td>
            <strong>
                ${pctPres}
            </strong>
        </td>

        <td>
            <strong>
                ${pctVC}
            </strong>
        </td>
    `;
}


/* ============================================================
   GRÁFICO EVOLUCIÓN SLA
============================================================ */
function sla_renderChartEvolucion(
    info,
    anio
) {

    const ctx =
        document.getElementById(
            "sla-chart-evolucion"
        );


    if (!ctx) {
        return;
    }


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


    const meses =
        mesesOrden.filter(
            m =>
                info[m]
        );


    const data =
        meses.map(
            m => {

                const r =
                    info[m];


                return r.cuentaDias
                    ? (
                        r.sumaDias /
                        r.cuentaDias
                    ).toFixed(1)
                    : 0;
            }
        );


    if (
        SLA_CHART_EVOLUCION
    ) {

        SLA_CHART_EVOLUCION
            .destroy();
    }


    SLA_CHART_EVOLUCION =
        new Chart(
            ctx,
            {

                type: "line",

                data: {

                    labels:
                        meses,

                    datasets: [

                        {

                            label:
                                "SLA mensual",

                            data,

                            borderColor:
                                "rgba(80,200,255,1)",

                            backgroundColor:
                                "rgba(80,200,255,0.2)",

                            borderWidth:
                                1.5,

                            tension:
                                0.2
                        }
                    ]
                },


                options: {

                    responsive:
                        true,


                    plugins: {

                        legend: {
                            display:
                                false
                        }
                    },


                    scales: {

                        x: {

                            ticks: {
                                color:
                                    "#111"
                            }
                        },


                        y: {

                            ticks: {
                                color:
                                    "#111"
                            }
                        }
                    }
                }
            }
        );
}


/* ============================================================
   GRÁFICO SLA CON VS SIN
============================================================ */
function sla_renderChartContra(
    info,
    anio
) {

    const ctx =
        document.getElementById(
            "sla-chart-contra"
        );


    if (!ctx) {
        return;
    }


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


    const meses =
        mesesOrden.filter(
            m =>
                info[m]
        );


    const dataCon =
        meses.map(
            m => {

                const r =
                    info[m];


                return r.cuentaCon
                    ? (
                        r.sumaCon /
                        r.cuentaCon
                    ).toFixed(1)
                    : 0;
            }
        );


    const dataSin =
        meses.map(
            m => {

                const r =
                    info[m];


                return r.cuentaSin
                    ? (
                        r.sumaSin /
                        r.cuentaSin
                    ).toFixed(1)
                    : 0;
            }
        );


    if (
        SLA_CHART_CONTRA
    ) {

        SLA_CHART_CONTRA
            .destroy();
    }


    SLA_CHART_CONTRA =
        new Chart(
            ctx,
            {

                type: "bar",

                data: {

                    labels:
                        meses,

                    datasets: [

                        {

                            label:
                                "SLA Con provisión",

                            data:
                                dataCon,

                            backgroundColor:
                                "rgba(80,200,255,0.6)",

                            borderColor:
                                "rgba(80,200,255,1)",

                            borderWidth:
                                1
                        },


                        {

                            label:
                                "SLA Sin provisión",

                            data:
                                dataSin,

                            backgroundColor:
                                "rgba(255,150,150,0.6)",

                            borderColor:
                                "rgba(255,100,100,1)",

                            borderWidth:
                                1
                        }
                    ]
                },


                options: {

                    responsive:
                        true,


                    plugins: {

                        legend: {
                            display:
                                true
                        }
                    },


                    scales: {

                        x: {

                            ticks: {
                                color:
                                    "#111"
                            }
                        },


                        y: {

                            ticks: {
                                color:
                                    "#111"
                            }
                        }
                    }
                }
            }
        );
}
