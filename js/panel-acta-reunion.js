/* ============================================================
   PANEL ACTA DE REUNIÓN — LÓGICA (GLASS LUXE 2027)
============================================================ */

async function initActaReunion() {
    // No hay nada que cargar, solo mostrar el panel
}

/* ============================================================
   FORMATEAR FECHA DD-MM-AAAA
============================================================ */

function ar_formatearFecha(fecha) {

    if (!fecha) return "";

    // Si viene como YYYY-MM-DD
    const partes = String(fecha).split("-");

    if (partes.length === 3) {
        const [anio, mes, dia] = partes;

        return `${dia}-${mes}-${anio}`;
    }

    return fecha;
}


/* ============================================================
   LISTA AUTOMÁTICA DE PUNTOS
============================================================ */

let ar_puntos = [];

function ar_addPunto() {

    const input = document.getElementById("ar-punto-input");

    if (!input) return;

    const texto = input.value.trim();

    if (!texto) return;

    ar_puntos.push(texto);

    input.value = "";

    ar_renderListaPuntos();
}


function ar_renderListaPuntos() {

    const ul = document.getElementById("ar-puntos-list");

    if (!ul) return;

    ul.innerHTML = ar_puntos
        .map(p => `<li>${p}</li>`)
        .join("");
}


function ar_formatearPuntos() {

    if (!ar_puntos.length) {
        return "<p>Sin puntos añadidos.</p>";
    }

    return `
        <ul class="acta-puntos">
            ${ar_puntos.map(p => `<li>${p}</li>`).join("")}
        </ul>
    `;
}


/* ============================================================
   GENERAR ACTA
============================================================ */

function ar_generarActa() {

    const fecha = document.getElementById("ar-fecha")?.value;
    const horaInicio = document.getElementById("ar-hora-inicio")?.value;
    const horaFin = document.getElementById("ar-hora-fin")?.value;

    if (!fecha || !horaInicio || !horaFin) {

        alert("⚠️ Fecha y horas son obligatorias.");

        return;
    }

    /* --------------------------------------------------------
       FECHA EN FORMATO DD-MM-AAAA
    -------------------------------------------------------- */

    const fechaFormateada = ar_formatearFecha(fecha);


    /* --------------------------------------------------------
       ASISTENTES
    -------------------------------------------------------- */

    const asistentes = [
        ...document.querySelectorAll("#ar-asistentes tr")
    ]
        .map(tr => {

            const tds = tr.querySelectorAll("td");

            if (tds.length < 2) return null;

            return {
                nombre: tds[0].textContent.trim(),
                cargo: tds[1].textContent.trim()
            };

        })
        .filter(Boolean);


    /* --------------------------------------------------------
       HTML DEL ACTA
    -------------------------------------------------------- */

    const actaHTML = `

        <div class="acta-documento">

            <div class="acta-cabecera">

                <p>
                    <strong>Molsan Gestión y Tramitación, SL.</strong><br>
                    Cl. Felip II, 293 - Bxos<br>
                    08016 Barcelona<br>
                    Tel. 93.349.74.65<br>
                    cancelaciones@molsan.es
                </p>

            </div>


            <h3>
                ORDEN DEL DÍA – REUNIÓN ${fechaFormateada}
            </h3>


            <p>
                Se procede a realizar la reunión en las instalaciones
                del Grupo Sánchez Molina sita en Edificio Trade,
                Torre Sur, Gran Vía Carles III 5 pl. de Barcelona.
            </p>


            <p>
                Se inicia la reunión a las
                <strong>${horaInicio}</strong>
                siendo una duración máxima de 1h,
                con la correspondiente finalización de la reunión a las
                <strong>${horaFin}</strong>.
            </p>


            <h3>Asistentes</h3>


            <table class="table-premium acta-tabla-asistentes">

                <thead>

                    <tr>
                        <th>Asistentes</th>
                        <th>Cargo</th>
                    </tr>

                </thead>


                <tbody>

                    ${asistentes.map(a => `

                        <tr>
                            <td>${a.nombre}</td>
                            <td>${a.cargo}</td>
                        </tr>

                    `).join("")}

                </tbody>

            </table>


            <h3>Puntos de la reunión</h3>

            ${ar_formatearPuntos()}

        </div>

    `;


    /* --------------------------------------------------------
       MOSTRAR ACTA EN EL PANEL
    -------------------------------------------------------- */

    const contenido = document.getElementById("ar-acta-contenido");
    const final = document.getElementById("ar-acta-final");

    if (!contenido || !final) {

        console.error(
            "❌ No se encuentran #ar-acta-contenido o #ar-acta-final"
        );

        return;
    }

    contenido.innerHTML = actaHTML;

    final.style.display = "block";
}


/* ============================================================
   CSS PARA EL DOCUMENTO IMPRESO
============================================================ */

function ar_estilosImpresion() {

    return `

        * {
            box-sizing: border-box;
        }

        body {

            font-family: Arial, sans-serif;

            padding: 40px;

            line-height: 1.6;

            color: #111;

            font-size: 14px;
        }


        h3 {

            margin-top: 14px;

            margin-bottom: 8px;

        }


        p {

            margin-top: 8px;

            margin-bottom: 12px;

        }


        /* ====================================================
           TABLA DE ASISTENTES
        ==================================================== */

        .acta-tabla-asistentes {

            width: 100%;

            border-collapse: collapse;

            margin-top: 15px;

            margin-bottom: 20px;
        }


        .acta-tabla-asistentes th {

            text-align: center;

            font-weight: 700;

            padding: 9px;

            border: 1px solid #ccc;
        }


        .acta-tabla-asistentes td {

            text-align: center;

            vertical-align: middle;

            padding: 8px;

            border: 1px solid #ccc;
        }


        /* ====================================================
           ANCHURA DE COLUMNAS
        ==================================================== */

        .acta-tabla-asistentes th:first-child,
        .acta-tabla-asistentes td:first-child {

            width: 50%;

        }


        .acta-tabla-asistentes th:last-child,
        .acta-tabla-asistentes td:last-child {

            width: 50%;

        }


        /* ====================================================
           PUNTOS
        ==================================================== */

        .acta-puntos {

            margin-top: 5px;

            padding-left: 25px;
        }


        .acta-puntos li {

            margin-bottom: 5px;
        }


        strong {

            font-weight: 600;
        }

    `;
}


/* ============================================================
   PDF / IMPRESIÓN — SOLO ACTA
============================================================ */

function ar_imprimirActa() {

    const contenido =
        document.getElementById("ar-acta-contenido")?.innerHTML;

    if (!contenido) {

        alert("⚠️ Primero debes generar el acta.");

        return;
    }


    const ventana = window.open("", "_blank");

    if (!ventana) {

        alert("⚠️ El navegador ha bloqueado la ventana de impresión.");

        return;
    }


    ventana.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>Acta de reunión</title>

            <style>

                ${ar_estilosImpresion()}

            </style>

        </head>


        <body>

            ${contenido}

        </body>

        </html>

    `);


    ventana.document.close();


    ventana.onload = () => {

        ventana.focus();

        ventana.print();

    };
}


/* ============================================================
   PDF COMPLETO
============================================================ */

function ar_imprimirActaCompleta() {

    const contenido =
        document.getElementById("ar-acta-contenido");

    if (!contenido) {

        alert("⚠️ No se encuentra el contenido del acta.");

        return;
    }


    /* --------------------------------------------------------
       Si todavía no existe contenido, generar acta
    -------------------------------------------------------- */

    if (!contenido.innerHTML.trim()) {

        ar_generarActa();
    }


    const acta = contenido.innerHTML;


    if (!acta.trim()) {

        alert("⚠️ Primero debes generar el acta.");

        return;
    }


    const ventana = window.open("", "_blank");


    if (!ventana) {

        alert("⚠️ El navegador ha bloqueado la ventana de impresión.");

        return;
    }


    ventana.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>Acta de reunión</title>

            <style>

                ${ar_estilosImpresion()}

            </style>

        </head>


        <body>

            ${acta}

        </body>

        </html>

    `);


    ventana.document.close();


    ventana.onload = () => {

        ventana.focus();

        ventana.print();

    };
}
