/* ============================================================
   PANEL APODERADOS — PREMIUM 2027 (FORMATO 2026)
============================================================ */

let PAP_DATOS = [];
let PAP_POR_ANIO = {};

let PAP_CHART_RANKING = null;
let PAP_CHART_EVOLUCION = null;

/* ============================================================
   FORMATO MILES — FIX DEFINITIVO
============================================================ */
/* ============================================================
   FORMATO MILES — FORMATO ESPAÑOL ROBUSTO
   1078      → 1.078
   2345      → 2.345
   10000     → 10.000
   1.078     → 1.078
   1,078     → 1.078
   1.078,50  → 1.079
============================================================ */
function formatoMiles(n) {

    if (
        n === null ||
        n === undefined ||
        n === ""
    ) {
        return "-";
    }

    /* ---------------------------------------------
       Si ya es un número
    --------------------------------------------- */

    if (typeof n === "number") {

        if (!Number.isFinite(n)) {
            return "-";
        }

        return Math.round(n)
            .toLocaleString("es-ES");
    }


    /* ---------------------------------------------
       Convertimos a texto
    --------------------------------------------- */

    let valor =
        String(n)
            .trim();


    if (!valor) {
        return "-";
    }


    valor =
        valor.replace(/\s/g, "");


    let numero;


    /* ---------------------------------------------
       Formato español:

       1.078,50
       12.345,67
    --------------------------------------------- */

    if (
        valor.includes(".") &&
        valor.includes(",")
    ) {

        numero =
            Number(
                valor
                    .replace(/\./g, "")
                    .replace(",", ".")
            );
    }


    /* ---------------------------------------------
       Formato con coma decimal:

       1078,50
    --------------------------------------------- */

    else if (
        valor.includes(",")
    ) {

        numero =
            Number(
                valor.replace(",", ".")
            );
    }


    /* ---------------------------------------------
       Formato con punto de miles:

       1.078
       10.532
       100.000
    --------------------------------------------- */

    else if (
        /^\d{1,3}(\.\d{3})+$/.test(valor)
    ) {

        numero =
            Number(
                valor.replace(/\./g, "")
            );
    }


    /* ---------------------------------------------
       Número normal:

       1078
       1078.00
    --------------------------------------------- */

    else {

        numero =
            Number(valor);
    }


    /* ---------------------------------------------
       Comprobación final
    --------------------------------------------- */

    if (
        !Number.isFinite(numero)
    ) {
        return "-";
    }


    /* ---------------------------------------------
       Formato español con separador de miles
    --------------------------------------------- */

    return Math.round(numero)
        .toLocaleString("es-ES");
}

/* ============================================================
   UI — SELECTOR DE AÑO + ALINEACIÓN DE TABLAS
   Se genera desde JS para no depender de HTML externo.
============================================================ */
function pap_inyectarEstilos() {
    if (document.getElementById("pap-estilos-premium")) return;

    const style = document.createElement("style");
    style.id = "pap-estilos-premium";

    style.textContent = `
        /* =====================================================
           SELECTOR DE AÑO
        ===================================================== */

        .pap-year-selector {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            width: 100%;
            margin: 0 0 12px 0;
            box-sizing: border-box;
        }

        .pap-year-selector label {
            font-weight: 600;
            white-space: nowrap;
        }

        .pap-year-selector select,
        #pap-select-anio {
            min-width: 110px;
            height: 38px;
            padding: 0 34px 0 12px;
            border: 1px solid rgba(120, 150, 180, .35);
            border-radius: 10px;
            background: #fff;
            font-size: 14px;
            font-weight: 600;
            color: #244b72;
            cursor: pointer;
            box-sizing: border-box;
        }

        .pap-year-selector select:focus,
        #pap-select-anio:focus {
            outline: none;
            border-color: rgba(80, 150, 210, .65);
            box-shadow: 0 0 0 3px rgba(80, 150, 210, .12);
        }


        /* =====================================================
           TABLAS
        ===================================================== */

        #pap-tabla-apoderados,
        #apo-tabla-tipo-firma {
            width: 100%;
            table-layout: auto;
        }


        /* =====================================================
           CABECERAS CENTRADAS
        ===================================================== */

        #pap-tabla-apoderados thead th,
        #apo-tabla-tipo-firma thead th {
            text-align: center !important;
            vertical-align: middle !important;
            white-space: nowrap;
        }

        #pap-tabla-apoderados thead th:first-child,
        #apo-tabla-tipo-firma thead th:first-child {
            text-align: left !important;
        }

        #pap-tabla-apoderados .th-group {
            text-align: center !important;
            vertical-align: middle !important;
        }


        /* =====================================================
           CUERPO
        ===================================================== */

        #pap-tabla-apoderados tbody td,
        #apo-tabla-tipo-firma tbody td {
            vertical-align: middle;
        }

        #pap-tabla-apoderados tbody td:not(:first-child),
        #apo-tabla-tipo-firma tbody td:not(:first-child) {
            text-align: center;
        }

        #pap-tabla-apoderados tbody td:first-child {
            text-align: left;
        }


        /* =====================================================
           ANCHURA PRIMERA COLUMNA
        ===================================================== */

        #pap-tabla-apoderados thead th:first-child {
            min-width: 210px;
        }

        #apo-tabla-tipo-firma thead th:first-child {
            min-width: 210px;
        }


        /* =====================================================
           FILA DETALLE DEL ACORDEÓN
        ===================================================== */

        .apo-row-detail > td {
            text-align: left !important;
        }

        .apo-row-detail .tabla-excel {
            width: 100%;
        }

        .apo-row-detail .tabla-excel thead th {
            text-align: center !important;
            vertical-align: middle !important;
        }

        .apo-row-detail .tabla-excel thead th:first-child {
            text-align: left !important;
        }


        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 900px) {

            .pap-year-selector {
                justify-content: flex-start;
            }

            #pap-tabla-apoderados,
            #apo-tabla-tipo-firma {
                min-width: 900px;
            }
        }
    `;

    document.head.appendChild(style);
}


/* ============================================================
   ASEGURAR SELECTOR DE AÑO
============================================================ */
function pap_asegurarSelectorAnio() {

    pap_inyectarEstilos();

    const tabla = document.getElementById("pap-tabla-apoderados");

    if (!tabla) return null;

    let sel = document.getElementById("pap-select-anio");


    /* ========================================================
       SI NO EXISTE, LO CREAMOS
    ======================================================== */

    if (!sel) {

        const barra = document.createElement("div");
        barra.className = "pap-year-selector";

        const label = document.createElement("label");

        label.htmlFor = "pap-select-anio";
        label.textContent = "Año:";

        sel = document.createElement("select");

        sel.id = "pap-select-anio";

        sel.setAttribute(
            "aria-label",
            "Seleccionar año"
        );

        barra.appendChild(label);
        barra.appendChild(sel);

        tabla.parentNode.insertBefore(
            barra,
            tabla
        );

    } else {

        sel.classList.add(
            "pap-select-anio"
        );


        /* ====================================================
           SI YA EXISTE PERO NO ESTÁ EN NUESTRA BARRA
        ==================================================== */

        if (!sel.closest(".pap-year-selector")) {

            const barra =
                document.createElement("div");

            barra.className =
                "pap-year-selector";


            let label =
                document.querySelector(
                    'label[for="pap-select-anio"]'
                );


            if (!label) {

                label =
                    document.createElement("label");

                label.htmlFor =
                    "pap-select-anio";

                label.textContent =
                    "Año:";
            }


            barra.appendChild(label);
            barra.appendChild(sel);

            tabla.parentNode.insertBefore(
                barra,
                tabla
            );
        }
    }

    return sel;
}


/* ============================================================
   INIT
============================================================ */
async function initPanelApoderados() {

    const sel =
        pap_asegurarSelectorAnio();

    if (!sel) return;


    let datos =
        await obtenerFirmas();

    if (!datos.length) return;


    datos.forEach(aplicarReglas);


    PAP_DATOS =
        datos;

    PAP_POR_ANIO =
        pap_groupByAnio(PAP_DATOS);


    pap_fillSelectAnios();

    pap_selectUltimoAnio();


    if (!sel.dataset.papChangeBound) {

        sel.addEventListener(
            "change",
            pap_onChangeAnio
        );

        sel.dataset.papChangeBound = "1";
    }


    initPanelApoderadosTipoFirma();
}


/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function pap_onChangeAnio() {

    const sel =
        pap_asegurarSelectorAnio();

    if (!sel) return;


    const anio =
        Number(sel.value);


    const info =
        PAP_POR_ANIO[anio];


    if (!info) return;


    pap_renderTablaApoderados(info);

    pap_renderGraficos(info);


    initPanelApoderadosTipoFirma();
}


/* ============================================================
   AGRUPAR POR AÑO → APODERADO → MESES
============================================================ */
function pap_groupByAnio(datos) {

    const meses =
        MESES_ORDEN;

    const map = {};


    for (const f of datos) {

        const anio =
            Number(f.anio);

        if (!anio) continue;


        const mes =
            (f.mes || "")
                .toLowerCase()
                .trim();


        const idxMes =
            meses.indexOf(mes);


        if (idxMes === -1) continue;


        const apoderado =
            f.apoderado ||
            "Sin apoderado";


        if (!map[anio]) {

            map[anio] = {
                apoderados: {}
            };
        }


        if (!map[anio].apoderados[apoderado]) {

            map[anio].apoderados[apoderado] = {

                total: 0,

                meses:
                    Array(12).fill(0)
            };
        }


        const a =
            map[anio]
                .apoderados[apoderado];


        a.total++;

        a.meses[idxMes]++;
    }


    return map;
}


/* ============================================================
   SELECT AÑOS
============================================================ */
function pap_fillSelectAnios() {

    const sel =
        document.getElementById(
            "pap-select-anio"
        );


    if (!sel) return;


    sel.innerHTML = "";


    const anios =
        Object.keys(PAP_POR_ANIO)
            .map(Number)
            .sort((a, b) => a - b);


    for (const anio of anios) {

        const opt =
            document.createElement(
                "option"
            );


        opt.value =
            anio;


        opt.textContent =
            anio;


        sel.appendChild(opt);
    }
}


/* ============================================================
   SELECCIONAR ÚLTIMO AÑO
============================================================ */
function pap_selectUltimoAnio() {

    const sel =
        document.getElementById(
            "pap-select-anio"
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


    pap_onChangeAnio();
}


/* ============================================================
   OBTENER MESES CON DATOS
============================================================ */
function obtenerMesesConDatos(info) {

    const meses =
        MESES_ORDEN;


    if (
        !info ||
        !info.apoderados
    ) {
        return [];
    }


    return meses.filter(
        (m, idx) => {

            const totalMes =
                Object.values(
                    info.apoderados
                ).reduce(
                    (acc, a) =>
                        acc +
                        Number(
                            a.meses[idx] || 0
                        ),
                    0
                );


            return totalMes > 0;
        }
    );
}


/* ============================================================
   TABLA DETALLE APODERADOS
============================================================ */
function pap_renderTablaApoderados(info) {

    const tbody =
        document.querySelector(
            "#pap-tabla-apoderados tbody"
        );


    if (!tbody) return;


    tbody.innerHTML = "";


    const meses =
        MESES_ORDEN;


    const mesesValidos =
        obtenerMesesConDatos(info);


    pap_renderThead(
        mesesValidos
    );


    const totalesPorMes =
        mesesValidos.map(m => {

            const idxReal =
                meses.indexOf(m);


            return Object.values(
                info.apoderados
            ).reduce(
                (acc, a) =>
                    acc +
                    Number(
                        a.meses[idxReal] || 0
                    ),
                0
            );
        });


    const lista =
        Object.entries(
            info.apoderados
        ).map(
            ([nombre, a]) => {

                const valoresMes =
                    mesesValidos.map(
                        m => {

                            const idxReal =
                                meses.indexOf(m);

                            return Number(
                                a.meses[
                                    idxReal
                                ] || 0
                            );
                        }
                    );


                const totalVisible =
                    valoresMes.reduce(
                        (acc, v) =>
                            acc + v,
                        0
                    );


                const porcentajesMes =
                    valoresMes.map(
                        (v, i) => {

                            const totalMes =
                                totalesPorMes[i];


                            if (
                                totalMes === 0
                            ) {
                                return "";
                            }


                            return (
                                (
                                    (v /
                                        totalMes) *
                                    100
                                ).toFixed(1)
                                + "%"
                            );
                        }
                    );


                return {
                    nombre,
                    valoresMes,
                    totalVisible,
                    porcentajesMes
                };
            }
        );


    lista.sort(
        (a, b) =>
            b.totalVisible -
            a.totalVisible
    );


    /* ========================================================
       FILAS APODERADOS
    ======================================================== */

    for (const ap of lista) {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${ap.nombre}
            </td>

            ${ap.valoresMes
                .map(
                    v =>
                        `<td class="num">
                            ${formatoMiles(v)}
                        </td>`
                )
                .join("")}

            <td class="num">
                ${formatoMiles(
                    ap.totalVisible
                )}
            </td>

            ${ap.porcentajesMes
                .map(
                    p =>
                        `<td>
                            ${p}
                        </td>`
                )
                .join("")}

            <td>
                100%
            </td>
        `;


        tbody.appendChild(tr);
    }


    /* ========================================================
       FILA TOTAL
    ======================================================== */

    const sumatorioTotal =
        totalesPorMes.reduce(
            (acc, v) =>
                acc + v,
            0
        );


    const trSum =
        document.createElement("tr");


    trSum.classList.add(
        "fila-sumatorio"
    );


    trSum.innerHTML = `

        <td>
            <b>TOTAL</b>
        </td>

        ${totalesPorMes
            .map(
                v =>
                    `<td class="num">
                        <b>
                            ${formatoMiles(v)}
                        </b>
                    </td>`
            )
            .join("")}

        <td class="num">
            <b>
                ${formatoMiles(
                    sumatorioTotal
                )}
            </b>
        </td>

        ${totalesPorMes
            .map(
                () =>
                    `<td>
                        <b>100%</b>
                    </td>`
            )
            .join("")}

        <td>
            <b>100%</b>
        </td>
    `;


    tbody.appendChild(
        trSum
    );
}


/* ============================================================
   THEAD DINÁMICO
============================================================ */
function pap_renderThead(
    mesesValidos
) {

    const thead =
        document.getElementById(
            "pap-thead"
        );


    if (!thead) return;


    const fila1 = `

        <tr>

            <th
                rowspan="2"
                class="pap-th-apoderado"
            >
                Apoderado
            </th>

            <th
                colspan="${mesesValidos.length + 1}"
                class="th-group"
            >
                Firmas realizadas
            </th>

            <th
                colspan="${mesesValidos.length + 1}"
                class="th-group"
            >
                % Firmas realizadas
            </th>

        </tr>
    `;


    const fila2 = `

        <tr>

            ${mesesValidos
                .map(
                    m =>
                        `<th class="pap-th-mes">
                            ${m}
                        </th>`
                )
                .join("")}

            <th class="pap-th-total">
                Total
            </th>

            ${mesesValidos
                .map(
                    m =>
                        `<th class="pap-th-pct">
                            %${m}
                        </th>`
                )
                .join("")}

            <th class="pap-th-total">
                %Total
            </th>

        </tr>
    `;


    thead.innerHTML =
        fila1 + fila2;
}


/* ============================================================
   GRÁFICOS PREMIUM 2027
============================================================ */
function pap_renderGraficos(info) {

    const meses =
        MESES_ORDEN;


    const mesesValidos =
        obtenerMesesConDatos(info);


    /* ========================================================
       1) RANKING DE APODERADOS
    ======================================================== */

    const lista =
        Object.entries(
            info.apoderados
        )
        .map(
            ([nombre, a]) => {

                const valoresMes =
                    mesesValidos.map(
                        m => {

                            const idxReal =
                                meses.indexOf(m);


                            return Number(
                                a.meses[
                                    idxReal
                                ] || 0
                            );
                        }
                    );


                return {

                    nombre,

                    totalVisible:
                        valoresMes.reduce(
                            (acc, v) =>
                                acc + v,
                            0
                        ),

                    valoresMes
                };
            }
        )
        .sort(
            (a, b) =>
                b.totalVisible -
                a.totalVisible
        );


    const labelsRanking =
        lista.map(
            o => o.nombre
        );


    const dataRanking =
        lista.map(
            o => o.totalVisible
        );


    const ctxRanking =
        document.getElementById(
            "pap-chart-ranking"
        );


    if (
        PAP_CHART_RANKING
    ) {
        PAP_CHART_RANKING.destroy();
    }


    if (ctxRanking) {

        PAP_CHART_RANKING =
            new Chart(
                ctxRanking,
                {

                    type: "bar",

                    data: {

                        labels:
                            labelsRanking,

                        datasets: [

                            {

                                label:
                                    "Total firmas",

                                data:
                                    dataRanking,

                                backgroundColor:
                                    "rgba(80, 200, 255, 0.5)",

                                borderColor:
                                    "rgba(80, 200, 255, 1)",

                                borderWidth:
                                    1.5
                            }
                        ]
                    },

                    options: {

                        indexAxis:
                            "y",

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


    /* ========================================================
       2) EVOLUCIÓN MENSUAL
    ======================================================== */

    const totalesMes =
        mesesValidos.map(
            (m, idxMesValido) => {

                return lista.reduce(
                    (acc, row) =>
                        acc +
                        Number(
                            row.valoresMes[
                                idxMesValido
                            ] || 0
                        ),
                    0
                );
            }
        );


    const ctxEvo =
        document.getElementById(
            "pap-chart-evolucion"
        );


    if (
        PAP_CHART_EVOLUCION
    ) {
        PAP_CHART_EVOLUCION.destroy();
    }


    if (ctxEvo) {

        PAP_CHART_EVOLUCION =
            new Chart(
                ctxEvo,
                {

                    type: "line",

                    data: {

                        labels:
                            mesesValidos,

                        datasets: [

                            {

                                label:
                                    "Total mensual",

                                data:
                                    totalesMes,

                                borderColor:
                                    "rgba(255, 120, 80, 1)",

                                backgroundColor:
                                    "rgba(255, 120, 80, 0.3)",

                                borderWidth:
                                    2,

                                tension:
                                    0.3
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
}


/* ============================================================
   PANEL APODERADOS — ACORDEÓN POR TIPO DE FIRMA
   MESES DINÁMICOS
============================================================ */

async function initPanelApoderadosTipoFirma() {

    console.log(
        "🧑‍⚖️ initPanelApoderadosTipoFirma() ejecutado"
    );


    pap_inyectarEstilos();


    const tabla =
        document.getElementById(
            "apo-tabla-tipo-firma"
        );


    if (!tabla) return;


    const thead =
        tabla.querySelector(
            "thead"
        );


    const tbody =
        tabla.querySelector(
            "tbody"
        );


    if (
        !thead ||
        !tbody
    ) {
        return;
    }


    /* ========================================================
       AÑO SELECCIONADO
    ======================================================== */

    const sel =
        pap_asegurarSelectorAnio();


    if (!sel) return;


    const anioSeleccionado =
        Number(sel.value);


    const infoAnio =
        PAP_POR_ANIO[
            anioSeleccionado
        ];


    if (!infoAnio) {

        thead.innerHTML = "";

        tbody.innerHTML = "";

        return;
    }


    /* ========================================================
       MESES DEL AÑO SELECCIONADO
    ======================================================== */

    const mesesValidos =
        obtenerMesesConDatos(
            infoAnio
        );


    /* ========================================================
       CABECERA DINÁMICA
       EXACTAMENTE IGUAL QUE LA TABLA PRINCIPAL
    ======================================================== */

    thead.innerHTML = `

        <tr>

            <th>
                Apoderado
            </th>

            ${mesesValidos
                .map(
                    m =>
                        `<th>
                            ${m}
                        </th>`
                )
                .join("")}

            <th>
                Total
            </th>

            ${mesesValidos
                .map(
                    m =>
                        `<th>
                            %${m}
                        </th>`
                )
                .join("")}

            <th>
                %Total
            </th>

        </tr>
    `;


    /* ========================================================
       DATOS
    ======================================================== */

    let datos =
        Array.isArray(PAP_DATOS) &&
        PAP_DATOS.length
            ? PAP_DATOS
            : await obtenerFirmas();


    datos =
        datos.map(
            f => aplicarReglas(f)
        );


    /* ========================================================
       AGRUPAR POR APODERADO
       → TIPO FIRMA
       → MESES
    ======================================================== */

    const map = {};


    for (const f of datos) {

        /* ---------------------------------------------
           FILTRO POR AÑO
        --------------------------------------------- */

        const anioFirma =
            Number(f.anio);


        if (
            anioFirma !==
            anioSeleccionado
        ) {
            continue;
        }


        /* ---------------------------------------------
           APODERADO
        --------------------------------------------- */

        const apoderado =
            (f.apoderado || "")
                .trim();


        if (!apoderado) {
            continue;
        }


        /* ---------------------------------------------
           MES
        --------------------------------------------- */

        const mes =
            (f.mes || "")
                .toLowerCase()
                .trim();


        const idxMes =
            mesesValidos.indexOf(
                mes
            );


        if (idxMes === -1) {
            continue;
        }


        /* ---------------------------------------------
           TIPO DE FIRMA
        --------------------------------------------- */

        const tipo =
            (
                f.tipo_firma ||
                f.tipoFirma ||
                ""
            ).trim();


        let tipoFirma =
            "Otros";


        if (
            /presencial/i.test(tipo)
        ) {

            tipoFirma =
                "Presencial";

        } else if (
            /video/i.test(tipo)
        ) {

            tipoFirma =
                "VideoConferencia";
        }


        /* ---------------------------------------------
           CREAR APODERADO
        --------------------------------------------- */

        if (
            !map[apoderado]
        ) {

            map[apoderado] = {

                totalMeses:
                    Array(
                        mesesValidos.length
                    ).fill(0),

                tipos: {

                    Presencial:
                        Array(
                            mesesValidos.length
                        ).fill(0),

                    VideoConferencia:
                        Array(
                            mesesValidos.length
                        ).fill(0),

                    Otros:
                        Array(
                            mesesValidos.length
                        ).fill(0)
                }
            };
        }


        /* ---------------------------------------------
           ACUMULAR
        --------------------------------------------- */

        map[
            apoderado
        ].totalMeses[
            idxMes
        ]++;


        map[
            apoderado
        ].tipos[
            tipoFirma
        ][
            idxMes
        ]++;
    }


    /* ========================================================
       LISTA ORDENADA POR TOTAL
    ======================================================== */

    const lista =
        Object.entries(
            map
        )
        .map(
            ([nombre, info]) => {

                const total =
                    info.totalMeses.reduce(
                        (a, b) =>
                            a + b,
                        0
                    );


                const pctMes =
                    info.totalMeses.map(
                        v => {

                            if (!total) {
                                return "";
                            }


                            return (
                                (
                                    (v /
                                        total) *
                                    100
                                ).toFixed(1)
                                + "%"
                            );
                        }
                    );


                return {
                    nombre,
                    info,
                    total,
                    pctMes
                };
            }
        )
        .sort(
            (a, b) =>
                b.total -
                a.total
        );


    tbody.innerHTML = "";


    /* ========================================================
       CREAR FILAS
    ======================================================== */

    for (const row of lista) {

        const idBase =
            row.nombre
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                )
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    "-"
                )
                .replace(
                    /-+/g,
                    "-"
                )
                .toLowerCase();


        const idRow =
            "apo-" +
            idBase;


        /* ====================================================
           FILA PRINCIPAL
        ==================================================== */

        const trMain =
            document.createElement(
                "tr"
            );


        trMain.classList.add(
            "apo-row-main"
        );


        trMain.dataset.apoId =
            idRow;


        trMain.innerHTML = `

            <td
                class="apo-toggle"
                style="
                    cursor:pointer;
                    text-align:left;
                "
            >

                <span
                    class="apo-arrow"
                >
                    ▶
                </span>

                ${row.nombre}

            </td>


            ${row.info.totalMeses
                .map(
                    v =>
                        `<td class="center">
                            ${formatoMiles(v)}
                        </td>`
                )
                .join("")}


            <td class="center">

                <b>
                    ${formatoMiles(
                        row.total
                    )}
                </b>

            </td>


            ${row.pctMes
                .map(
                    p =>
                        `<td class="center">
                            ${p}
                        </td>`
                )
                .join("")}


            <td class="center">
                100%
            </td>
        `;


        /* ====================================================
           FILA DETALLE
        ==================================================== */

        const trDetail =
            document.createElement(
                "tr"
            );


        trDetail.classList.add(
            "apo-row-detail"
        );


        trDetail.dataset.apoId =
            idRow;


        trDetail.style.display =
            "none";


        const detalleHTML =
            renderDetalleTipos(
                row.info,
                row.total,
                mesesValidos
            );


        const totalColumnas =
            1 +
            mesesValidos.length +
            1 +
            mesesValidos.length +
            1;


        trDetail.innerHTML = `

            <td
                colspan="${totalColumnas}"
            >

                ${detalleHTML}

            </td>
        `;


        tbody.appendChild(
            trMain
        );


        tbody.appendChild(
            trDetail
        );
    }


    /* ========================================================
       EVENTO ACORDEÓN
    ======================================================== */

    tbody.onclick =
        (ev) => {

            const tr =
                ev.target.closest(
                    ".apo-row-main"
                );


            if (!tr) return;


            const id =
                tr.dataset.apoId;


            const detail =
                tbody.querySelector(
                    `.apo-row-detail[data-apo-id="${id}"]`
                );


            if (!detail) {
                return;
            }


            const toggleCell =
                tr.querySelector(
                    ".apo-toggle"
                );


            const arrow =
                toggleCell
                    ? toggleCell.querySelector(
                        ".apo-arrow"
                    )
                    : null;


            const isHidden =
                detail.style.display ===
                "none";


            detail.style.display =
                isHidden
                    ? "table-row"
                    : "none";


            if (arrow) {

                arrow.textContent =
                    isHidden
                        ? "▼"
                        : "▶";
            }
        };
}


/* ============================================================
   RENDER DETALLE TIPOS DE FIRMA
   Presencial / VideoConferencia
============================================================ */
function renderDetalleTipos(
    info,
    totalApoderado,
    mesesValidos
) {

    const tipos = [
        "Presencial",
        "VideoConferencia"
    ];


    const rows = [];


    for (const tipo of tipos) {

        const valores =
            info.tipos[tipo];


        const totalTipo =
            valores.reduce(
                (a, b) =>
                    a + b,
                0
            );


        const pctTipo =
            totalApoderado
                ? (
                    (
                        totalTipo /
                        totalApoderado
                    ) *
                    100
                ).toFixed(1) + "%"
                : "";


        rows.push(`

            <tr>

                <td
                    class="center"
                >

                    <b>
                        ${tipo}
                    </b>

                </td>


                ${mesesValidos
                    .map(
                        (
                            m,
                            idx
                        ) =>
                            `<td class="center">
                                ${formatoMiles(
                                    valores[idx]
                                )}
                            </td>`
                    )
                    .join("")}


                <td
                    class="center"
                >

                    <b>
                        ${formatoMiles(
                            totalTipo
                        )}
                    </b>

                </td>


                <td
                    class="center"
                >

                    <b>
                        ${pctTipo}
                    </b>

                </td>

            </tr>
        `);
    }


    return `

        <div
            class="card-glass mt-10"
        >

            <div>
                <b>
                    Detalle por tipo de firma
                </b>
            </div>


            <table
                class="table-premium tabla-excel mt-10"
            >

                <thead>

                    <tr>

                        <th>
                            Tipo firma
                        </th>


                        ${mesesValidos
                            .map(
                                m =>
                                    `<th class="center">
                                        ${m}
                                    </th>`
                            )
                            .join("")}


                        <th class="center">
                            Total
                        </th>


                        <th class="center">
                            % sobre apoderado
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${rows.join("")}

                </tbody>

            </table>

        </div>
    `;
}
