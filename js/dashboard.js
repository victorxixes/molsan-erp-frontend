/* ============================================================
   DASHBOARD — GLASS LUXE
   Comparativa anual + KPIs + gráficos + paneles
============================================================ */

let DASH_CHART_COMPARATIVA = null;
let DASH_CHART_MENSUAL = null;


/* ============================================================
   CONSTANTES
============================================================ */

const DASH_MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
];

const DASH_MESES_CORTOS = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic"
];


/* ============================================================
   HELPER SEGURO
============================================================ */

function dashSet(id, value) {

    const el = document.getElementById(id);

    if (el) {
        el.textContent = value ?? "-";
    }
}


/* ============================================================
   CONVERTIR MES
   Admite:
   1
   "1"
   "enero"
   "Enero"
   "ene"
   etc.
============================================================ */

function dashNumeroMes(valor) {

    if (valor === null || valor === undefined) {
        return 0;
    }

    const texto = String(valor)
        .trim()
        .toLowerCase();

    /* Número */

    const numero = Number(texto);

    if (!isNaN(numero) && numero >= 1 && numero <= 12) {
        return numero;
    }

    /* Texto */

    const meses = {
        enero: 1,
        ene: 1,

        febrero: 2,
        feb: 2,

        marzo: 3,
        mar: 3,

        abril: 4,
        abr: 4,

        mayo: 5,
        may: 5,

        junio: 6,
        jun: 6,

        julio: 7,
        jul: 7,

        agosto: 8,
        ago: 8,

        septiembre: 9,
        setiembre: 9,
        sep: 9,
        sept: 9,

        octubre: 10,
        oct: 10,

        noviembre: 11,
        nov: 11,

        diciembre: 12,
        dic: 12
    };

    return meses[texto] || 0;
}


/* ============================================================
   NOMBRE DEL MES
============================================================ */

function dashNombreMes(valor) {

    const mes = dashNumeroMes(valor);

    if (mes >= 1 && mes <= 12) {
        return DASH_MESES[mes - 1];
    }

    return "-";
}


/* ============================================================
   INIT DASHBOARD
============================================================ */

async function initDashboard() {

    console.log("📊 initDashboard() ejecutado");

    const selActual =
        document.getElementById("dash-anio-actual");

    const selAnterior =
        document.getElementById("dash-anio-anterior");


    if (!selActual || !selAnterior) {

        console.warn(
            "⚠️ Dashboard todavía no está en el DOM."
        );

        return;
    }


    const datos = await obtenerFirmas();


    if (!datos || !datos.length) {

        console.warn(
            "⚠️ No hay datos para mostrar en el dashboard."
        );

        limpiarDashboard();

        return;
    }


    /* ========================================================
       OBTENER AÑOS
    ======================================================== */

    const anios = [
        ...new Set(
            datos
                .map(f => Number(f.anio))
                .filter(a => !isNaN(a))
        )
    ].sort((a, b) => a - b);


    if (!anios.length) {

        console.warn(
            "⚠️ No se encontraron años válidos."
        );

        return;
    }


    /* ========================================================
       RELLENAR SELECTORES
    ======================================================== */

    selActual.innerHTML = "";
    selAnterior.innerHTML = "";


    anios.forEach(anio => {

        const optionActual =
            document.createElement("option");

        optionActual.value = anio;
        optionActual.textContent = anio;

        selActual.appendChild(optionActual);


        const optionAnterior =
            document.createElement("option");

        optionAnterior.value = anio;
        optionAnterior.textContent = anio;

        selAnterior.appendChild(optionAnterior);

    });


    /* ========================================================
       SELECCIÓN POR DEFECTO
    ======================================================== */

    const ultimo =
        anios[anios.length - 1];

    const anterior =
        anios.length > 1
            ? anios[anios.length - 2]
            : ultimo;


    selActual.value = ultimo;
    selAnterior.value = anterior;


    /* ========================================================
       EVENTOS
       Usamos onchange para evitar duplicados si el módulo
       se vuelve a cargar.
    ======================================================== */

    selActual.onchange = dashboardActualizar;
    selAnterior.onchange = dashboardActualizar;


    /* ========================================================
       PRIMERA CARGA
    ======================================================== */

    await dashboardActualizar();
}


/* ============================================================
   ACTUALIZAR DASHBOARD
============================================================ */

async function dashboardActualizar() {

    const datos = await obtenerFirmas();

    if (!datos || !datos.length) {
        limpiarDashboard();
        return;
    }


    const selectorActual =
        document.getElementById("dash-anio-actual");

    const selectorAnterior =
        document.getElementById("dash-anio-anterior");


    if (!selectorActual || !selectorAnterior) {
        return;
    }


    const añoActual =
        Number(selectorActual.value);

    const añoAnterior =
        Number(selectorAnterior.value);


    if (!añoActual) {
        return;
    }


    /* ========================================================
       RESÚMENES
    ======================================================== */

    const A =
        calcularResumenAnual(
            datos,
            añoActual
        );


    const B =
        calcularResumenAnual(
            datos,
            añoAnterior
        );


    /* ========================================================
       KPIs PRINCIPALES
    ======================================================== */

    dashSet(
        "dash-total-actual",
        formatearNumero(A.total)
    );

    dashSet(
        "dash-total-anterior",
        formatearNumero(B.total)
    );

    dashSet(
        "dash-total-diff",
        diffPct(A.total, B.total)
    );


    dashSet(
        "dash-sla-actual",
        A.sla
    );

    dashSet(
        "dash-sla-anterior",
        B.sla
    );

    dashSet(
        "dash-sla-diff",
        diffPct(
            Number(A.sla),
            Number(B.sla)
        )
    );


    dashSet(
        "dash-vc-actual",
        `${A.pctVC}%`
    );

    dashSet(
        "dash-vc-anterior",
        `${B.pctVC}%`
    );

    dashSet(
        "dash-vc-diff",
        diffPct(
            Number(A.pctVC),
            Number(B.pctVC)
        )
    );


    /* ========================================================
       MEJOR MES
    ======================================================== */

    dashSet(
        "dash-top-mes-actual",
        A.topMes
    );

    dashSet(
        "dash-top-mes-anterior",
        B.topMes
    );


    /* ========================================================
       INDICADORES SECUNDARIOS
    ======================================================== */

    dashSet(
        "dash-top-oficina",
        kpi_topOficina(
            datos,
            añoActual
        )
    );


    dashSet(
        "dash-top-circuito",
        kpi_topCircuito(
            datos,
            añoActual
        )
    );


    dashSet(
        "dash-top-gestion",
        kpi_topGestion(
            datos,
            añoActual
        )
    );


    dashSet(
        "dash-top-apoderado",
        kpi_topApoderado(
            datos,
            añoActual
        )
    );


    dashSet(
        "dash-top-centro",
        kpi_topCentro(
            datos,
            añoActual
        )
    );


    /* ========================================================
       HIGHLIGHTS
    ======================================================== */

    generarHighlights(
        datos,
        añoActual
    );


    /* ========================================================
       GRÁFICOS
    ======================================================== */

    generarGraficoComparativa(
        datos,
        añoActual,
        añoAnterior
    );


    generarGraficoMensual(
        datos,
        añoActual
    );


    /* ========================================================
       TABLA
    ======================================================== */

    generarTablaPaneles(
        datos,
        añoActual,
        añoAnterior
    );
}


/* ============================================================
   RESUMEN ANUAL
============================================================ */

function calcularResumenAnual(datos, año) {

    const filtrado =
        datos.filter(
            f => Number(f.anio) === Number(año)
        );


    let total = filtrado.length;

    let vc = 0;

    let presencial = 0;

    let sumaDias = 0;

    let cuentaDias = 0;

    const meses = {};


    filtrado.forEach(f => {

        /* Tipo firma */

        if (
            String(f.tipo_firma || "")
                .toLowerCase()
                .includes("videoconferencia")
        ) {

            vc++;

        } else {

            presencial++;

        }


        /* SLA */

        const dias =
            Number(f.dias);

        if (
            !isNaN(dias) &&
            dias > 0
        ) {

            sumaDias += dias;

            cuentaDias++;

        }


        /* Mes */

        const mes =
            dashNumeroMes(f.mes);

        if (
            mes >= 1 &&
            mes <= 12
        ) {

            meses[mes] =
                (meses[mes] || 0) + 1;

        }

    });


    const sla =
        cuentaDias
            ? (sumaDias / cuentaDias).toFixed(1)
            : "0.0";


    const pctVC =
        total
            ? ((vc / total) * 100).toFixed(1)
            : "0.0";


    /* ========================================================
       MEJOR MES
    ======================================================== */

    let topMes = "-";

    let max = 0;


    Object.entries(meses)
        .forEach(([mes, cantidad]) => {

            if (cantidad > max) {

                max = cantidad;

                topMes =
                    `${DASH_MESES[Number(mes) - 1]} (${cantidad})`;

            }

        });


    return {

        total,
        vc,
        presencial,
        sla,
        pctVC,
        topMes

    };
}


/* ============================================================
   DIFERENCIA PORCENTUAL
============================================================ */

function diffPct(actual, anterior) {

    actual = Number(actual);
    anterior = Number(anterior);


    if (
        isNaN(actual) ||
        isNaN(anterior)
    ) {
        return "-";
    }


    if (anterior === 0) {

        if (actual === 0) {
            return "0.0%";
        }

        return "-";
    }


    return (
        ((actual - anterior) / anterior) * 100
    ).toFixed(1) + "%";
}


/* ============================================================
   FORMATEAR NÚMERO
============================================================ */

function formatearNumero(numero) {

    const n = Number(numero);

    if (isNaN(n)) {
        return "-";
    }

    return n.toLocaleString(
        "es-ES"
    );
}


/* ============================================================
   OBTENER VALOR DOMINANTE
============================================================ */

function obtenerDominante(datos, campo, año) {

    const mapa = {};


    datos.forEach(f => {

        if (
            Number(f.anio) !== Number(año)
        ) {
            return;
        }


        const valor =
            String(f[campo] ?? "")
                .trim();


        if (!valor) {
            return;
        }


        mapa[valor] =
            (mapa[valor] || 0) + 1;

    });


    const ordenado =
        Object.entries(mapa)
            .sort(
                (a, b) => b[1] - a[1]
            );


    if (!ordenado.length) {
        return "-";
    }


    return ordenado[0][0];
}


/* ============================================================
   OFICINA DOMINANTE
============================================================ */

function kpi_topOficina(datos, año) {

    return obtenerDominante(
        datos,
        "oficina",
        año
    );
}


/* ============================================================
   CIRCUITO DOMINANTE
============================================================ */

function kpi_topCircuito(datos, año) {

    return obtenerDominante(
        datos,
        "circuito",
        año
    );
}


/* ============================================================
   GESTIÓN DOMINANTE
============================================================ */

function kpi_topGestion(datos, año) {

    return obtenerDominante(
        datos,
        "tipo_gestion",
        año
    );
}


/* ============================================================
   APODERADO DOMINANTE
============================================================ */

function kpi_topApoderado(datos, año) {

    return obtenerDominante(
        datos,
        "apoderado",
        año
    );
}


/* ============================================================
   CENTRO DOMINANTE
============================================================ */

function kpi_topCentro(datos, año) {

    return obtenerDominante(
        datos,
        "centro_que_firma",
        año
    );
}


/* ============================================================
   HIGHLIGHTS
============================================================ */

function generarHighlights(datos, año) {

    const filtrado =
        datos.filter(
            f => Number(f.anio) === Number(año)
        );


    const meses = {};


    filtrado.forEach(f => {

        const mes =
            dashNumeroMes(f.mes);


        if (
            mes >= 1 &&
            mes <= 12
        ) {

            meses[mes] =
                (meses[mes] || 0) + 1;

        }

    });


    const arr =
        Object.entries(meses)
            .map(
                ([mes, cantidad]) => ({
                    mes: Number(mes),
                    cantidad
                })
            );


    if (!arr.length) {

        dashSet(
            "dash-hl-mejor-mes",
            "🔥 Mejor mes: -"
        );

        dashSet(
            "dash-hl-peor-mes",
            "📉 Peor mes: -"
        );

        dashSet(
            "dash-hl-sla-alerta",
            ""
        );

        dashSet(
            "dash-hl-vc-alerta",
            ""
        );

        return;
    }


    /* Mejor */

    const mejor =
        [...arr].sort(
            (a, b) =>
                b.cantidad - a.cantidad
        )[0];


    /* Peor */

    const peor =
        [...arr].sort(
            (a, b) =>
                a.cantidad - b.cantidad
        )[0];


    dashSet(
        "dash-hl-mejor-mes",
        `🔥 Mejor mes: ${
            DASH_MESES[mejor.mes - 1]
        } (${formatearNumero(mejor.cantidad)} firmas)`
    );


    dashSet(
        "dash-hl-peor-mes",
        `📉 Peor mes: ${
            DASH_MESES[peor.mes - 1]
        } (${formatearNumero(peor.cantidad)} firmas)`
    );


    /* ========================================================
       ALERTA SLA
    ======================================================== */

    const resumen =
        calcularResumenAnual(
            datos,
            año
        );


    if (Number(resumen.sla) > 10) {

        dashSet(
            "dash-hl-sla-alerta",
            `⏱️ SLA medio elevado: ${resumen.sla} días`
        );

    } else {

        dashSet(
            "dash-hl-sla-alerta",
            `⏱️ SLA medio: ${resumen.sla} días`
        );

    }


    /* ========================================================
       ALERTA VC
    ======================================================== */

    if (Number(resumen.pctVC) > 20) {

        dashSet(
            "dash-hl-vc-alerta",
            `🎥 VideoConferencia: ${resumen.pctVC}%`
        );

    } else {

        dashSet(
            "dash-hl-vc-alerta",
            `🎥 VideoConferencia: ${resumen.pctVC}%`
        );

    }
}


/* ============================================================
   DATOS POR MES
============================================================ */

function obtenerDatosMensuales(datos, año) {

    const arr =
        Array(12).fill(0);


    datos.forEach(f => {

        if (
            Number(f.anio) !== Number(año)
        ) {
            return;
        }


        const mes =
            dashNumeroMes(f.mes);


        if (
            mes >= 1 &&
            mes <= 12
        ) {

            arr[mes - 1]++;

        }

    });


    return arr;
}


/* ============================================================
   GRÁFICO COMPARATIVA
============================================================ */

function generarGraficoComparativa(
    datos,
    añoActual,
    añoAnterior
) {

    const canvas =
        document.getElementById(
            "dash-chart-comparativa"
        );


    if (!canvas) {
        return;
    }


    if (
        typeof Chart === "undefined"
    ) {

        console.warn(
            "⚠️ Chart.js no está cargado."
        );

        return;
    }


    if (DASH_CHART_COMPARATIVA) {

        DASH_CHART_COMPARATIVA.destroy();

        DASH_CHART_COMPARATIVA = null;
    }


    const actual =
        obtenerDatosMensuales(
            datos,
            añoActual
        );


    const anterior =
        obtenerDatosMensuales(
            datos,
            añoAnterior
        );


    DASH_CHART_COMPARATIVA =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        DASH_MESES_CORTOS,

                    datasets: [

                        {
                            label:
                                String(añoActual),

                            data:
                                actual,

                            backgroundColor:
                                "rgba(80, 200, 255, 0.65)",

                            borderColor:
                                "rgba(80, 200, 255, 1)",

                            borderWidth: 1
                        },


                        {
                            label:
                                String(añoAnterior),

                            data:
                                anterior,

                            backgroundColor:
                                "rgba(180, 180, 180, 0.45)",

                            borderColor:
                                "rgba(130, 130, 130, 1)",

                            borderWidth: 1
                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {
                        mode: "index",
                        intersect: false
                    },

                    plugins: {

                        legend: {
                            display: true,
                            position: "top"
                        },

                        tooltip: {
                            callbacks: {

                                label:
                                    function(context) {

                                        return `${context.dataset.label}: ${formatearNumero(context.raw)} firmas`;

                                    }

                            }
                        }

                    },


                    scales: {

                        x: {
                            ticks: {
                                color: "#163f6b"
                            }
                        },

                        y: {

                            beginAtZero: true,

                            ticks: {

                                color: "#163f6b",

                                callback:
                                    function(value) {
                                        return formatearNumero(value);
                                    }

                            }

                        }

                    }

                }

            }
        );
}


/* ============================================================
   GRÁFICO MENSUAL
============================================================ */

function generarGraficoMensual(
    datos,
    año
) {

    const canvas =
        document.getElementById(
            "dash-chart-mensual"
        );


    if (!canvas) {
        return;
    }


    if (
        typeof Chart === "undefined"
    ) {
        return;
    }


    if (DASH_CHART_MENSUAL) {

        DASH_CHART_MENSUAL.destroy();

        DASH_CHART_MENSUAL = null;
    }


    const valores =
        obtenerDatosMensuales(
            datos,
            año
        );


    DASH_CHART_MENSUAL =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        DASH_MESES_CORTOS,

                    datasets: [

                        {

                            label:
                                `Firmas ${año}`,

                            data:
                                valores,

                            borderColor:
                                "rgba(80, 200, 255, 1)",

                            backgroundColor:
                                "rgba(80, 200, 255, 0.15)",

                            borderWidth: 2,

                            tension: 0.25,

                            fill: true,

                            pointRadius: 4,

                            pointHoverRadius: 6

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },


                    scales: {

                        x: {

                            ticks: {
                                color: "#163f6b"
                            }

                        },


                        y: {

                            beginAtZero: true,

                            ticks: {

                                color: "#163f6b",

                                callback:
                                    function(value) {
                                        return formatearNumero(value);
                                    }

                            }

                        }

                    }

                }

            }
        );
}


/* ============================================================
   TABLA COMPARATIVA
============================================================ */

function generarTablaPaneles(
    datos,
    añoActual,
    añoAnterior
) {

    const tbody =
        document.getElementById(
            "dash-tabla-paneles"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const paneles = [

        {
            nombre:
                "Panel Anual — Total firmas",

            fn:
                calcularPanelAnual
        },


        {
            nombre:
                "Panel Mensual — Hasta mes disponible",

            fn:
                calcularPanelMensual
        },


        {
            nombre:
                "Panel Apoderados — Apoderados activos",

            fn:
                calcularPanelApoderados
        },


        {
            nombre:
                "Panel Tipo Firma — VideoConferencia %",

            fn:
                calcularPanelTipoFirma
        },


        {
            nombre:
                "Panel Tipo Gestión — Con provisión",

            fn:
                calcularPanelTipoGestion
        },


        {
            nombre:
                "Panel Oficinas — Oficina dominante",

            fn:
                calcularPanelOficinas
        },


        {
            nombre:
                "Panel Circuito — Circuito dominante",

            fn:
                calcularPanelCircuito
        },


        {
            nombre:
                "Panel SLA — SLA medio",

            fn:
                calcularPanelSLA
        }

    ];


    paneles.forEach(panel => {

        const actual =
            panel.fn(
                datos,
                añoActual
            );


        const anterior =
            panel.fn(
                datos,
                añoAnterior
            );


        let diferencia = "-";


        if (
            typeof actual === "number" &&
            typeof anterior === "number"
        ) {

            diferencia =
                diffPct(
                    actual,
                    anterior
                );

        }


        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${escapeHTML(panel.nombre)}
            </td>

            <td>
                ${escapeHTML(String(actual))}
            </td>

            <td>
                ${escapeHTML(String(anterior))}
            </td>

            <td>
                ${escapeHTML(String(diferencia))}
            </td>

        `;


        tbody.appendChild(tr);

    });
}


/* ============================================================
   PANEL ANUAL
============================================================ */

function calcularPanelAnual(
    datos,
    año
) {

    return datos.filter(
        f =>
            Number(f.anio) === Number(año)
    ).length;
}


/* ============================================================
   PANEL MENSUAL
============================================================ */

function calcularPanelMensual(
    datos,
    año
) {

    const datosAño =
        datos.filter(
            f =>
                Number(f.anio) === Number(año)
        );


    if (!datosAño.length) {
        return 0;
    }


    const meses =
        datosAño
            .map(
                f => dashNumeroMes(f.mes)
            )
            .filter(
                m => m >= 1 && m <= 12
            );


    if (!meses.length) {
        return 0;
    }


    const ultimoMes =
        Math.max(...meses);


    return datosAño.filter(
        f =>
            dashNumeroMes(f.mes) <= ultimoMes
    ).length;
}


/* ============================================================
   PANEL APODERADOS
============================================================ */

function calcularPanelApoderados(
    datos,
    año
) {

    const set =
        new Set();


    datos.forEach(f => {

        if (
            Number(f.anio) === Number(año) &&
            f.apoderado
        ) {

            set.add(
                String(f.apoderado).trim()
            );

        }

    });


    return set.size;
}


/* ============================================================
   PANEL TIPO FIRMA
============================================================ */

function calcularPanelTipoFirma(
    datos,
    año
) {

    const total =
        datos.filter(
            f =>
                Number(f.anio) === Number(año)
        ).length;


    const vc =
        datos.filter(
            f =>
                Number(f.anio) === Number(año) &&
                String(f.tipo_firma || "")
                    .toLowerCase()
                    .includes("videoconferencia")
        ).length;


    return total
        ? Number(
            ((vc / total) * 100)
                .toFixed(1)
        )
        : 0;
}


/* ============================================================
   PANEL TIPO GESTIÓN
============================================================ */

function calcularPanelTipoGestion(
    datos,
    año
) {

    return datos.filter(
        f =>
            Number(f.anio) === Number(año) &&
            String(f.tipo_gestion || "")
                .trim()
                .toLowerCase() ===
                "con provisión"
                .toLowerCase()
    ).length;
}


/* ============================================================
   PANEL OFICINAS
   Devuelve el nombre de la oficina dominante
============================================================ */

function calcularPanelOficinas(
    datos,
    año
) {

    return obtenerDominante(
        datos,
        "oficina",
        año
    );
}


/* ============================================================
   PANEL CIRCUITO
   Devuelve el circuito dominante
============================================================ */

function calcularPanelCircuito(
    datos,
    año
) {

    return obtenerDominante(
        datos,
        "circuito",
        año
    );
}


/* ============================================================
   PANEL SLA
============================================================ */

function calcularPanelSLA(
    datos,
    año
) {

    const arr =
        datos.filter(
            f =>
                Number(f.anio) === Number(año) &&
                Number(f.dias) > 0
        );


    if (!arr.length) {
        return 0;
    }


    const suma =
        arr.reduce(
            (acc, f) =>
                acc + Number(f.dias),
            0
        );


    return Number(
        (suma / arr.length)
            .toFixed(1)
    );
}


/* ============================================================
   ESCAPAR HTML
============================================================ */

function escapeHTML(valor) {

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ============================================================
   LIMPIAR DASHBOARD
============================================================ */

function limpiarDashboard() {

    const ids = [

        "dash-total-actual",
        "dash-total-anterior",
        "dash-total-diff",

        "dash-sla-actual",
        "dash-sla-anterior",
        "dash-sla-diff",

        "dash-vc-actual",
        "dash-vc-anterior",
        "dash-vc-diff",

        "dash-top-mes-actual",
        "dash-top-mes-anterior",

        "dash-top-oficina",
        "dash-top-circuito",
        "dash-top-gestion",
        "dash-top-apoderado",
        "dash-top-centro",

        "dash-hl-mejor-mes",
        "dash-hl-peor-mes",
        "dash-hl-sla-alerta",
        "dash-hl-vc-alerta"

    ];


    ids.forEach(
        id => dashSet(id, "-")
    );


    const tbody =
        document.getElementById(
            "dash-tabla-paneles"
        );


    if (tbody) {
        tbody.innerHTML = "";
    }


    if (DASH_CHART_COMPARATIVA) {

        DASH_CHART_COMPARATIVA.destroy();

        DASH_CHART_COMPARATIVA = null;

    }


    if (DASH_CHART_MENSUAL) {

        DASH_CHART_MENSUAL.destroy();

        DASH_CHART_MENSUAL = null;

    }
}
