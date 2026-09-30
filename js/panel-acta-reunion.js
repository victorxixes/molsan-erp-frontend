/* ============================================================
   PANEL ACTA DE REUNIÓN — LÓGICA
   GLASS LUXE 2027

   Funcionalidades:
   - Generación del acta
   - Formato de fecha DD-MM-AAAA
   - Lista automática de puntos
   - Tabla de asistentes centrada
   - Diseño visual premium
   - Impresión / Guardar como PDF
============================================================ */


/* ============================================================
   INICIALIZAR PANEL
============================================================ */

async function initActaReunion() {

    console.log("📄 initActaReunion() ejecutado");

    // Reiniciar puntos al entrar en el módulo
    ar_puntos = [];

    const lista = document.getElementById("ar-puntos-list");

    if (lista) {
        lista.innerHTML = "";
    }

    // Limpiar acta anterior si existe
    const contenido = document.getElementById("ar-acta-contenido");

    if (contenido) {
        contenido.innerHTML = "";
    }

    const actaFinal = document.getElementById("ar-acta-final");

    if (actaFinal) {
        actaFinal.style.display = "none";
    }
}


/* ============================================================
   VARIABLES
============================================================ */

let ar_puntos = [];


/* ============================================================
   ESCAPAR HTML
   Evita que textos introducidos por el usuario rompan el HTML
============================================================ */

function ar_escapeHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ============================================================
   FORMATEAR FECHA
   De:
       2026-10-07

   A:
       07-10-2026
============================================================ */

function ar_formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }

    /*
       Si viene como YYYY-MM-DD
    */

    const partes = String(fecha).split("-");

    if (partes.length === 3) {

        const año = partes[0];
        const mes = partes[1];
        const dia = partes[2];

        if (
            año.length === 4 &&
            mes.length >= 1 &&
            dia.length >= 1
        ) {
            return `${dia.padStart(2, "0")}-${mes.padStart(2, "0")}-${año}`;
        }
    }

    /*
       Si por algún motivo viene como DD/MM/YYYY
    */

    const partesBarra = String(fecha).split("/");

    if (partesBarra.length === 3) {

        const dia = partesBarra[0].padStart(2, "0");
        const mes = partesBarra[1].padStart(2, "0");
        const año = partesBarra[2];

        return `${dia}-${mes}-${año}`;
    }

    return fecha;
}


/* ============================================================
   LISTA AUTOMÁTICA DE PUNTOS
============================================================ */

function ar_addPunto() {

    const input = document.getElementById("ar-punto-input");

    if (!input) {
        console.error("❌ No existe #ar-punto-input");
        return;
    }

    const texto = input.value.trim();

    if (!texto) {
        return;
    }

    ar_puntos.push(texto);

    input.value = "";

    ar_renderListaPuntos();
}


/* ============================================================
   RENDERIZAR LISTA DE PUNTOS
============================================================ */

function ar_renderListaPuntos() {

    const ul = document.getElementById("ar-puntos-list");

    if (!ul) {
        return;
    }

    ul.innerHTML = ar_puntos
        .map((p, index) => `
            <li>
                <span class="ar-punto-numero">${index + 1}</span>
                <span>${ar_escapeHTML(p)}</span>
            </li>
        `)
        .join("");
}


/* ============================================================
   FORMATEAR PUNTOS PARA EL ACTA
============================================================ */

function ar_formatearPuntos() {

    if (!ar_puntos.length) {

        return `
            <div class="ar-sin-puntos">
                No se han añadido puntos a la reunión.
            </div>
        `;
    }

    return `
        <div class="ar-puntos-documento">

            ${ar_puntos.map((p, index) => `
                <div class="ar-punto-documento">

                    <div class="ar-punto-numero-documento">
                        ${index + 1}
                    </div>

                    <div class="ar-punto-texto">
                        ${ar_escapeHTML(p)}
                    </div>

                </div>
            `).join("")}

        </div>
    `;
}


/* ============================================================
   OBTENER ASISTENTES
============================================================ */

function ar_obtenerAsistentes() {

    const filas = [
        ...document.querySelectorAll("#ar-asistentes tr")
    ];

    return filas
        .map(tr => {

            const tds = tr.querySelectorAll("td");

            if (tds.length < 2) {
                return null;
            }

            return {
                nombre: tds[0].textContent.trim(),
                cargo: tds[1].textContent.trim()
            };

        })
        .filter(Boolean);
}


/* ============================================================
   TABLA DE ASISTENTES
============================================================ */

function ar_generarTablaAsistentes(asistentes) {

    if (!asistentes.length) {

        return `
            <div class="ar-sin-asistentes">
                No se han registrado asistentes.
            </div>
        `;
    }

    return `
        <table class="ar-tabla-asistentes">

            <thead>
                <tr>
                    <th>Asistentes</th>
                    <th>Cargo</th>
                </tr>
            </thead>

            <tbody>

                ${asistentes.map(a => `
                    <tr>
                        <td>${ar_escapeHTML(a.nombre)}</td>
                        <td>${ar_escapeHTML(a.cargo)}</td>
                    </tr>
                `).join("")}

            </tbody>

        </table>
    `;
}


/* ============================================================
   ESTILOS DEL ACTA
============================================================ */

function ar_estilosDocumento() {

    return `

        <style>

            /* ==================================================
               DOCUMENTO GENERAL
            ================================================== */

            .acta-documento {

                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;

                color: #193f67;

                background: #ffffff;

                max-width: 1100px;

                margin: 0 auto;

                padding: 35px 45px 45px;

                line-height: 1.55;

                box-sizing: border-box;
            }


            /* ==================================================
               CABECERA
            ================================================== */

            .acta-cabecera {

                display: flex;

                align-items: flex-start;

                justify-content: space-between;

                gap: 30px;

                padding-bottom: 22px;

                margin-bottom: 25px;

                border-bottom:
                    2px solid #d7e6f2;
            }


            .acta-empresa {

                flex: 1;

            }


            .acta-empresa-nombre {

                font-size: 20px;

                font-weight: 700;

                color: #123f68;

                margin-bottom: 7px;
            }


            .acta-empresa-datos {

                font-size: 14px;

                line-height: 1.7;

                color: #536b82;
            }


            .acta-badge {

                min-width: 180px;

                text-align: center;

                padding: 14px 18px;

                border-radius: 12px;

                background:
                    linear-gradient(
                        135deg,
                        #eef7ff,
                        #dceefb
                    );

                border:
                    1px solid #c6dceb;

                color: #174b75;

                font-weight: 700;

                font-size: 13px;

                letter-spacing: .5px;

                box-sizing: border-box;
            }


            .acta-badge-titulo {

                font-size: 15px;

                margin-bottom: 5px;
            }


            /* ==================================================
               TÍTULO
            ================================================== */

            .acta-titulo {

                margin: 0 0 18px;

                padding: 16px 20px;

                background:
                    linear-gradient(
                        135deg,
                        #e8f4fc,
                        #d8ecfa
                    );

                border-left:
                    5px solid #1c5d8f;

                border-radius: 8px;

                color: #123f68;

                font-size: 22px;

                font-weight: 700;

                letter-spacing: .2px;
            }


            /* ==================================================
               INFORMACIÓN DE REUNIÓN
            ================================================== */

            .acta-info-reunion {

                margin-bottom: 25px;

                font-size: 14px;

                color: #536b82;
            }


            .acta-info-reunion p {

                margin: 7px 0;
            }


            .acta-info-reunion strong {

                color: #163f63;
            }


            /* ==================================================
               SECCIONES
            ================================================== */

            .acta-seccion-titulo {

                display: flex;

                align-items: center;

                gap: 10px;

                margin: 28px 0 12px;

                padding-bottom: 8px;

                border-bottom:
                    1px solid #d7e6f2;

                color: #174b75;

                font-size: 17px;

                font-weight: 700;
            }


            .acta-seccion-titulo::before {

                content: "";

                width: 7px;

                height: 20px;

                border-radius: 4px;

                background: #1c5d8f;

                display: inline-block;
            }


            /* ==================================================
               TABLA DE ASISTENTES
            ================================================== */

            .ar-tabla-asistentes {

                width: 100%;

                border-collapse: separate;

                border-spacing: 0;

                margin-top: 12px;

                border:
                    1px solid #cbddea;

                border-radius: 9px;

                overflow: hidden;

                table-layout: fixed;

                font-size: 13px;
            }


            .ar-tabla-asistentes th {

                background:
                    linear-gradient(
                        135deg,
                        #dff0fb,
                        #cce6f6
                    );

                color: #16486f;

                font-weight: 700;

                padding: 11px 14px;

                text-align: center;

                border-bottom:
                    1px solid #bfd5e5;

                vertical-align: middle;
            }


            .ar-tabla-asistentes th:first-child {

                width: 45%;
            }


            .ar-tabla-asistentes th:last-child {

                width: 55%;
            }


            .ar-tabla-asistentes td {

                padding: 10px 14px;

                text-align: center;

                vertical-align: middle;

                color: #425d74;

                border-bottom:
                    1px solid #e1eaf1;

                background: #ffffff;
            }


            .ar-tabla-asistentes tr:nth-child(even) td {

                background: #f7fafc;
            }


            .ar-tabla-asistentes tr:last-child td {

                border-bottom: none;
            }


            /* ==================================================
               PUNTOS DE LA REUNIÓN
            ================================================== */

            .ar-puntos-documento {

                display: flex;

                flex-direction: column;

                gap: 9px;

                margin-top: 12px;
            }


            .ar-punto-documento {

                display: flex;

                align-items: flex-start;

                gap: 12px;

                padding: 11px 14px;

                border:
                    1px solid #dce8f1;

                border-radius: 8px;

                background: #f8fbfd;

                color: #425d74;
            }


            .ar-punto-numero-documento {

                flex: 0 0 27px;

                width: 27px;

                height: 27px;

                border-radius: 50%;

                display: flex;

                align-items: center;

                justify-content: center;

                background: #1c5d8f;

                color: white;

                font-weight: 700;

                font-size: 12px;
            }


            .ar-punto-texto {

                flex: 1;

                padding-top: 3px;
            }


            /* ==================================================
               SIN DATOS
            ================================================== */

            .ar-sin-puntos,
            .ar-sin-asistentes {

                padding: 15px;

                border-radius: 8px;

                background: #f6f8fa;

                border:
                    1px solid #e0e7ec;

                color: #71808e;

                text-align: center;

                font-size: 13px;
            }


            /* ==================================================
               PIE DEL DOCUMENTO
            ================================================== */

            .acta-pie {

                margin-top: 35px;

                padding-top: 15px;

                border-top:
                    1px solid #d7e6f2;

                text-align: center;

                font-size: 11px;

                color: #8293a1;
            }


            /* ==================================================
               IMPRESIÓN
            ================================================== */

            @media print {

                .acta-documento {

                    max-width: none;

                    margin: 0;

                    padding: 0;

                    color: #111;
                }


                .acta-cabecera {

                    page-break-inside: avoid;
                }


                .acta-titulo {

                    page-break-after: avoid;
                }


                .acta-seccion-titulo {

                    page-break-after: avoid;
                }


                .ar-tabla-asistentes {

                    page-break-inside: auto;
                }


                .ar-tabla-asistentes tr {

                    page-break-inside: avoid;

                    page-break-after: auto;
                }


                .ar-punto-documento {

                    page-break-inside: avoid;
                }
            }

        </style>

    `;
}


/* ============================================================
   GENERAR ACTA
============================================================ */

function ar_generarActa() {

    const fechaInput = document.getElementById("ar-fecha");
    const horaInicioInput = document.getElementById("ar-hora-inicio");
    const horaFinInput = document.getElementById("ar-hora-fin");

    if (!fechaInput || !horaInicioInput || !horaFinInput) {

        console.error(
            "❌ Faltan elementos del formulario del acta."
        );

        return;
    }


    const fecha = fechaInput.value;
    const horaInicio = horaInicioInput.value;
    const horaFin = horaFinInput.value;


    /* ========================================================
       VALIDACIONES
    ======================================================== */

    if (!fecha || !horaInicio || !horaFin) {

        alert(
            "⚠️ Fecha y horas son obligatorias."
        );

        return;
    }


    /* ========================================================
       FECHA FORMATEADA
    ======================================================== */

    const fechaFormateada =
        ar_formatearFecha(fecha);


    /* ========================================================
       ASISTENTES
    ======================================================== */

    const asistentes =
        ar_obtenerAsistentes();


    /* ========================================================
       TABLA ASISTENTES
    ======================================================== */

    const tablaAsistentes =
        ar_generarTablaAsistentes(asistentes);


    /* ========================================================
       CONTENIDO DEL ACTA
    ======================================================== */

    const actaHTML = `

        ${ar_estilosDocumento()}

        <div class="acta-documento">


            <!-- ================================================
                 CABECERA
            ================================================= -->

            <div class="acta-cabecera">

                <div class="acta-empresa">

                    <div class="acta-empresa-nombre">
                        Molsan Gestión y Tramitación, SL.
                    </div>

                    <div class="acta-empresa-datos">

                        Cl. Felip II, 293 - Bxos<br>

                        08016 Barcelona<br>

                        Tel. 93.349.74.65<br>

                        cancelaciones@molsan.es

                    </div>

                </div>


                <div class="acta-badge">

                    <div class="acta-badge-titulo">
                        ACTA DE REUNIÓN
                    </div>

                    <div>
                        ${fechaFormateada}
                    </div>

                </div>

            </div>


            <!-- ================================================
                 INFORMACIÓN
            ================================================= -->

            <div class="acta-info-reunion">

                <p>

                    Se procede a realizar la reunión en las
                    instalaciones del Grupo Sánchez Molina sita
                    en Edificio Trade, Torre Sur, Gran Vía
                    Carles III 5 pl. de Barcelona.

                </p>


                <p>

                    Se inicia la reunión a las

                    <strong>${ar_escapeHTML(horaInicio)}</strong>

                    siendo una duración máxima de 1h,
                    con la correspondiente finalización
                    de la reunión a las

                    <strong>${ar_escapeHTML(horaFin)}</strong>.

                </p>

            </div>


            <!-- ================================================
                 ASISTENTES
            ================================================= -->

            <h2 class="acta-seccion-titulo">

                Asistentes

            </h2>


            ${tablaAsistentes}


            <!-- ================================================
                 PUNTOS
            ================================================= -->

            <h2 class="acta-seccion-titulo">

                Puntos de la reunión

            </h2>


            ${ar_formatearPuntos()}


            <!-- ================================================
                 PIE
            ================================================= -->

            <div class="acta-pie">

                Molsan Gestión y Tramitación, SL. ·
                Acta de reunión ·
                ${fechaFormateada}

            </div>


        </div>
    `;


    /* ========================================================
       MOSTRAR ACTA
    ======================================================== */

    const contenido =
        document.getElementById("ar-acta-contenido");

    const actaFinal =
        document.getElementById("ar-acta-final");


    if (!contenido) {

        console.error(
            "❌ No existe #ar-acta-contenido"
        );

        return;
    }


    contenido.innerHTML = actaHTML;


    if (actaFinal) {

        actaFinal.style.display = "block";

        /*
           Llevar al usuario hasta el acta generada
        */

        setTimeout(() => {

            actaFinal.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 100);

    }


    console.log(
        "✅ Acta generada correctamente:",
        fechaFormateada
    );
}


/* ============================================================
   CREAR DOCUMENTO PARA IMPRESIÓN
============================================================ */

function ar_generarDocumentoImpresion(contenido) {

    return `

        <!DOCTYPE html>

        <html lang="es">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>Acta de reunión</title>

            ${contenido}

        </head>

        <body>

        </body>

        </html>
    `;
}


/* ============================================================
   PDF NORMAL
   SOLO ACTA
============================================================ */

function ar_imprimirActa() {

    const elemento =
        document.getElementById("ar-acta-contenido");


    if (!elemento) {

        console.error(
            "❌ No existe #ar-acta-contenido"
        );

        return;
    }


    let contenido =
        elemento.innerHTML.trim();


    /* ========================================================
       SI NO EXISTE ACTA, GENERARLA
    ======================================================== */

    if (!contenido) {

        ar_generarActa();

        contenido =
            elemento.innerHTML.trim();
    }


    if (!contenido) {

        alert(
            "⚠️ Primero debes generar el acta."
        );

        return;
    }


    /* ========================================================
       ABRIR VENTANA
    ======================================================== */

    const ventana =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (!ventana) {

        alert(
            "⚠️ El navegador ha bloqueado la ventana de impresión. " +
            "Permite ventanas emergentes para este sitio."
        );

        return;
    }


    ventana.document.open();


    ventana.document.write(
        ar_generarDocumentoImpresion(contenido)
    );


    ventana.document.close();


    /* ========================================================
       IMPRIMIR CUANDO ESTÉ CARGADO
    ======================================================== */

    ventana.onload = () => {

        setTimeout(() => {

            ventana.focus();

            ventana.print();

        }, 300);

    };
}


/* ============================================================
   PDF COMPLETO
   ACTA COMPLETA
============================================================ */

function ar_imprimirActaCompleta() {

    const elemento =
        document.getElementById("ar-acta-contenido");


    if (!elemento) {

        console.error(
            "❌ No existe #ar-acta-contenido"
        );

        return;
    }


    /* ========================================================
       SI NO SE HA GENERADO EL ACTA
    ======================================================== */

    if (!elemento.innerHTML.trim()) {

        ar_generarActa();
    }


    const acta =
        elemento.innerHTML.trim();


    if (!acta) {

        alert(
            "⚠️ No hay ningún acta generada."
        );

        return;
    }


    /* ========================================================
       ABRIR VENTANA
    ======================================================== */

    const ventana =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (!ventana) {

        alert(
            "⚠️ El navegador ha bloqueado la ventana de impresión. " +
            "Permite ventanas emergentes para este sitio."
        );

        return;
    }


    ventana.document.open();


    ventana.document.write(
        ar_generarDocumentoImpresion(acta)
    );


    ventana.document.close();


    /* ========================================================
       IMPRIMIR
    ======================================================== */

    ventana.onload = () => {

        setTimeout(() => {

            ventana.focus();

            ventana.print();

        }, 300);

    };
}


/* ============================================================
   ATAJO — ENTER PARA AÑADIR PUNTO
============================================================ */

document.addEventListener(
    "keydown",
    function (event) {

        const input =
            document.getElementById("ar-punto-input");


        if (!input) {
            return;
        }


        if (
            document.activeElement === input &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            ar_addPunto();
        }

    }
);
