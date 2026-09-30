/* ============================================================
   DASHBOARD — MOLSAN ERP
   COMPARATIVA ANUAL + KPIs + GRÁFICOS
============================================================ */

let DASH_CHART_COMPARATIVA = null;
let DASH_CHART_MENSUAL = null;


/* ============================================================
   HELPERS
============================================================ */

function dashSet(id, value) {

    const el = document.getElementById(id);

    if (el) {
        el.textContent = value ?? "-";
    }
}


function dashNumero(valor) {

    const n = Number(valor);

    return Number.isFinite(n) ? n : 0;
}


function dashTexto(valor) {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return "-";
    }

    return String(valor);
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


    if (!Array.isArray(datos) || !datos.length) {

        console.warn(
            "⚠️ No hay datos para mostrar en Dashboard."
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
                .filter(a => Number.isFinite(a) && a > 0)
        )
    ].sort((a, b) => a - b);


    if (!anios.length) {

        console.warn(
            "⚠️ No se han encontrado años válidos."
        );

        return;
    }


    /* ========================================================
       RELLENAR SELECTORES
    ======================================================== */

    selActual.innerHTML = "";
    selAnterior.innerHTML = "";


    anios.forEach(anio => {

        const optActual =
            document.createElement("option");

        optActual.value = anio;
        optActual.textContent = anio;

        selActual.appendChild(optActual);


        const optAnterior =
            document.createElement("option");

        optAnterior.value = anio;
        optAnterior.textContent = anio;

        selAnterior.appendChild(optAnterior);

    });


    /* ========================================================
       SELECCIÓN AUTOMÁTICA
    ======================================================== */

    const añoActual =
        anios[anios.length - 1];

    const añoAnterior =
        anios.length > 1
            ? anios[anios.length - 2]
            : anios[anios.length - 1];


    selActual.value = añoActual;
    selAnterior.value = añoAnterior;


    /* ========================================================
       EVENTOS
    ======================================================== */

    selActual.onchange =
        dashboardActualizar;

    selAnterior.onchange =
        dashboardActualizar;


    /* ========================================================
       PRIMERA CARGA
    ======================================================== */

    await dashboardActualizar();
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

        "dash-top-oficina",
        "dash-top-circuito",
        "dash-top-gestion",
        "dash-top-apoderado",
        "dash-top-centro",

        "dash-top-mes-actual",
        "dash-top-mes-anterior",
        "dash-top-mes-diff",

        "dash-hl-mejor-mes",
        "dash-hl-peor-mes"

    ];


    ids.forEach(id => {

        dashSet(id, "-");

    });
}


/* ============================================================
   ACTUALIZAR DASHBOARD
============================================================ */

async function dashboardActualizar() {

    console.log("🔄 Actualizando Dashboard...");


    const datos =
        await obtenerFirmas();


    if (!Array.isArray(datos) || !datos.length) {

        limpiarDashboard();

        return;
    }


    const selActual =
        document.getElementById("dash-anio-actual");

    const selAnterior =
        document.getElementById("dash-anio-anterior");


    if (!selActual || !selAnterior) {
        return;
    }


    const añoActual =
        Number(selActual.value);

    const añoAnterior =
        Number(selAnterior.value);


    if (!Number.isFinite(añoActual)) {
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
       KPI — FIRMAS
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


    /* ========================================================
       KPI — SLA
    ======================================================== */

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


    /* ========================================================
       KPI — VIDEO CONFERENCIA
    ======================================================== */

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
       KPIs SECUNDARIOS
    ======================================================== */

    dashSet(
        "dash-top-oficina",
        obtenerDominante(
            datos,
            añoActual,
            "oficina"
        )
    );


    dashSet(
        "dash-top-circuito",
        obtenerDominante(
            datos,
            añoActual,
            "circuito"
        )
    );


    dashSet(
        "dash-top-gestion",
        obtenerDominante(
            datos,
            añoActual,
            "tipo_gestion"
        )
    );


    dashSet(
        "dash-top-apoderado",
        obtenerDominante(
            datos,
            añoActual,
            "apoderado"
        )
    );


    dashSet(
        "dash-top-centro",
        obtenerDominante(
            datos,
            añoActual,
            "centro_que_firma"
        )
    );


    /* ========================================================
       RESUMEN DE MEJORES MESES
    ======================================================== */

    dashSet(
        "dash-top-mes-actual",
        A.topMes
    );


    dashSet(
        "dash-top-mes-anterior",
        B.topMes
    );


    dashSet(
        "dash-top-mes-diff",
        diffPct(
            A.topMesTotal,
            B.topMesTotal
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
   FORMATEAR NÚMEROS
============================================================ */

function formatearNumero(numero) {

    return Number(numero || 0)
        .toLocaleString("es-ES");
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

    let sumaDias = 0;

    let cuentaDias = 0;

    const meses = {};


    filtrado.forEach(f => {

        if (
            String(f.tipo_firma)
                .toLowerCase()
                .includes("videoconferencia")
        ) {
            vc++;
        }


        const dias =
            Number(f.dias);


        if (
            Number.isFinite(dias) &&
            dias > 0
        ) {

            sumaDias += dias;
            cuentaDias++;

        }


        const mes =
            Number(f.mes);


        if (
            Number.isFinite(mes) &&
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


    let topMes = "-";
    let topMesTotal = 0;


    Object.entries(meses)
        .forEach(([mes, cantidad]) => {

            if (cantidad > topMesTotal) {

                topMesTotal = cantidad;

                topMes =
                    obtenerNombreMes(
                        Number(mes)
                    );

            }

        });


    return {

        total,

        vc,

        sla,

        pctVC,

        topMes,

        topMesTotal

    };

}


/* ============================================================
   NOMBRE MES
============================================================ */

function obtenerNombreMes(mes) {

    const meses = [

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


    return meses[mes - 1] || "-";
}


/* ============================================================
   DIFERENCIA %
============================================================ */

function diffPct(actual, anterior) {

    actual = Number(actual);
    anterior = Number(anterior);


    if (
        !Number.isFinite(actual) ||
        !Number.isFinite(anterior)
    ) {

        return "-";

    }


    if (anterior === 0) {

        return "-";

    }


    return (
        ((actual - anterior) / anterior) * 100
    ).toFixed(1) + "%";

}


/* ============================================================
   OBTENER DOMINANTE
============================================================ */

function obtenerDominante(
    datos,
    año,
    campo
) {

    const mapa = {};


    datos.forEach(f => {

        if (
            Number(f.anio) !== Number(año)
        ) {
            return;
        }


        const valor =
            dashTexto(f[campo]);


        if (valor === "-") {
            return;
        }


        mapa[valor] =
            (mapa[valor] || 0) + 1;

    });


    const lista =
        Object.entries(mapa)
            .sort(
                (a, b) => b[1] - a[1]
            );


    if (!lista.length) {
        return "-";
    }


    return lista[0][0];

}


/* ============================================================
   HIGHLIGHTS
============================================================ */

function generarHighlights(
    datos,
    año
) {

    const filtrado =
        datos.filter(
            f => Number(f.anio) === Number(año)
        );


    const meses = {};


    filtrado.forEach(f => {

        const mes =
            Number(f.mes);


        if (
            Number.isFinite(mes) &&
            mes >= 1 &&
            mes <= 12
        ) {

            meses[mes] =
                (meses[mes] || 0) + 1;

        }

    });


    const arr =
        Object.entries(meses);


    if (!arr.length) {

        dashSet(
            "dash-hl-mejor-mes",
            "🔥 Mejor mes: -"
        );


        dashSet(
            "dash-hl-peor-mes",
            "📉 Peor mes: -"
        );


        return;
    }


    const mejor =
        [...arr].sort(
            (a, b) => b[1] - a[1]
        )[0];


    const peor =
        [...arr].sort(
            (a, b) => a[1] - b[1]
        )[0];


    dashSet(
        "dash-hl-mejor-mes",
        `🔥 Mejor mes: ${
            obtenerNombreMes(Number(mejor[0]))
        } (${formatearNumero(mejor[1])} firmas)`
    );


    dashSet(
        "dash-hl-peor-mes",
        `📉 Peor mes: ${
            obtenerNombreMes(Number(peor[0]))
        } (${formatearNumero(peor[1])} firmas)`
    );


    /* ========================================================
       ALERTA SLA
    ======================================================== */

    const resumen =
        calcularResumenAnual(
            datos,
            año
        );


    if (Number(resumen.sla) > 15) {

        dashSet(
            "dash-hl-sla-alerta",
            `⚠️ SLA elevado: ${resumen.sla} días`
        );

    } else {

        dashSet(
            "dash-hl-sla-alerta",
            ""
        );

    }


    /* ========================================================
       ALERTA VC
    ======================================================== */

    if (Number(resumen.pctVC) >= 20) {

        dashSet(
            "dash-hl-vc-alerta",
            `🎥 VC: ${resumen.pctVC}%`
        );

    } else {

        dashSet(
            "dash-hl-vc-alerta",
            ""
        );

    }

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


    const labels = [

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


    function obtenerDatos(año) {

        const arr =
            Array(12).fill(0);


        datos.forEach(f => {

            if (
                Number(f.anio) !== Number(año)
            ) {
                return;
            }


            const mes =
                Number(f.mes);


            if (
                mes >= 1 &&
                mes <= 12
            ) {

                arr[mes - 1]++;

            }

        });


        return arr;

    }


    const actual =
        obtenerDatos(añoActual);


    const anterior =
        obtenerDatos(añoAnterior);


    if (DASH_CHART_COMPARATIVA) {

        DASH_CHART_COMPARATIVA.destroy();

    }


    DASH_CHART_COMPARATIVA =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels,

                    datasets: [

                        {
                            label: añoActual,

                            data: actual,

                            backgroundColor:
                                "rgba(80,200,255,0.65)",

                            borderColor:
                                "rgba(80,200,255,1)",

                            borderWidth: 1
                        },


                        {
                            label: añoAnterior,

                            data: anterior,

                            backgroundColor:
                                "rgba(180,180,180,0.45)",

                            borderColor:
                                "rgba(140,140,140,1)",

                            borderWidth: 1
                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: true
                        }

                    },


                    scales: {

                        x: {
                            ticks: {
                                color: "#0A3A67"
                            }
                        },

                        y: {

                            beginAtZero: true,

                            ticks: {
                                color: "#0A3A67"
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


    const labels = [

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


    const arr =
        Array(12).fill(0);


    datos.forEach(f => {

        if (
            Number(f.anio) !== Number(año)
        ) {
            return;
        }


        const mes =
            Number(f.mes);


        if (
            mes >= 1 &&
            mes <= 12
        ) {

            arr[mes - 1]++;

        }

    });


    if (DASH_CHART_MENSUAL) {

        DASH_CHART_MENSUAL.destroy();

    }


    DASH_CHART_MENSUAL =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels,

                    datasets: [

                        {

                            label: "Firmas",

                            data: arr,

                            borderColor:
                                "rgba(80,200,255,1)",

                            backgroundColor:
                                "rgba(80,200,255,0.18)",

                            borderWidth: 2,

                            tension: 0.25,

                            fill: true,

                            pointRadius: 3

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
                                color: "#0A3A67"
                            }

                        },


                        y: {

                            beginAtZero: true,

                            ticks: {
                                color: "#0A3A67"
                            }

                        }

                    }

                }

            }
        );

}


/* ============================================================
   TABLA COMPARATIVA POR PANEL
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
            nombre: "Panel Anual — total firmas",
            fn: calcularPanelAnual
        },

        {
            nombre: "Panel Mensual — actividad",
            fn: calcularPanelMensual
        },

        {
            nombre: "Panel Apoderados — apoderados activos",
            fn: calcularPanelApoderados
        },

        {
            nombre: "Panel Tipo Firma — VC %",
            fn: calcularPanelTipoFirma
        },

        {
            nombre: "Panel Tipo Gestión — Con provisión",
            fn: calcularPanelTipoGestion
        },

        {
            nombre: "Panel Oficinas — oficina dominante",
            fn: calcularPanelOficinas
        },

        {
            nombre: "Panel Circuito — circuito dominante",
            fn: calcularPanelCircuito
        },

        {
            nombre: "Panel SLA — SLA medio",
            fn: calcularPanelSLA
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
                ${panel.nombre}
            </td>

            <td>
                ${formatearValorPanel(actual)}
            </td>

            <td>
                ${formatearValorPanel(anterior)}
            </td>

            <td>
                ${diferencia}
            </td>

        `;


        tbody.appendChild(tr);

    });

}


/* ============================================================
   FUNCIONES TABLA
============================================================ */

function calcularPanelAnual(
    datos,
    año
) {

    return datos.filter(
        f => Number(f.anio) === Number(año)
    ).length;

}


function calcularPanelMensual(
    datos,
    año
) {

    const filtrado =
        datos.filter(
            f => Number(f.anio) === Number(año)
        );


    if (!filtrado.length) {
        return 0;
    }


    const meses =
        filtrado
            .map(f => Number(f.mes))
            .filter(
                m =>
                    Number.isFinite(m) &&
                    m >= 1 &&
                    m <= 12
            );


    if (!meses.length) {
        return 0;
    }


    const mesActual =
        Math.max(...meses);


    return filtrado.filter(
        f =>
            Number(f.mes) <= mesActual
    ).length;

}


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


function calcularPanelTipoFirma(
    datos,
    año
) {

    const total =
        datos.filter(
            f => Number(f.anio) === Number(año)
        ).length;


    const vc =
        datos.filter(

            f =>

                Number(f.anio) === Number(año) &&

                String(f.tipo_firma)
                    .toLowerCase()
                    .includes("videoconferencia")

        ).length;


    return total
        ? Number(((vc / total) * 100).toFixed(1))
        : 0;

}


function calcularPanelTipoGestion(
    datos,
    año
) {

    return datos.filter(

        f =>

            Number(f.anio) === Number(año) &&

            String(f.tipo_gestion)
                .toLowerCase()
                .includes("con provisión")

    ).length;

}


function calcularPanelOficinas(
    datos,
    año
) {

    return obtenerDominanteConCantidad(
        datos,
        año,
        "oficina"
    );

}


function calcularPanelCircuito(
    datos,
    año
) {

    return obtenerDominanteConCantidad(
        datos,
        año,
        "circuito"
    );

}


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
        (suma / arr.length).toFixed(1)
    );

}


/* ============================================================
   DOMINANTE + CANTIDAD
============================================================ */

function obtenerDominanteConCantidad(
    datos,
    año,
    campo
) {

    const mapa = {};


    datos.forEach(f => {

        if (
            Number(f.anio) !== Number(año)
        ) {
            return;
        }


        const valor =
            dashTexto(f[campo]);


        if (valor === "-") {
            return;
        }


        mapa[valor] =
            (mapa[valor] || 0) + 1;

    });


    const top =
        Object.entries(mapa)
            .sort(
                (a, b) => b[1] - a[1]
            )[0];


    if (!top) {
        return 0;
    }


    return top[1];

}


/* ============================================================
   FORMATEAR VALOR TABLA
============================================================ */

function formatearValorPanel(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return "-";

    }


    if (typeof valor === "number") {

        return valor.toLocaleString(
            "es-ES"
        );

    }


    return valor;

}
