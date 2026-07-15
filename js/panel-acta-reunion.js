/* ============================================================
   PANEL ACTA DE REUNIÓN — LÓGICA (GLASS LUXE 2027)
============================================================ */

async function initActaReunion() {
    // No hay nada que cargar, solo mostrar el panel
}

/* ============================================================
   LISTA AUTOMÁTICA DE PUNTOS
============================================================ */

let ar_puntos = [];

function ar_addPunto() {
    const input = document.getElementById("ar-punto-input");
    const texto = input.value.trim();

    if (!texto) return;

    ar_puntos.push(texto);
    input.value = "";

    ar_renderListaPuntos();
}

function ar_renderListaPuntos() {
    const ul = document.getElementById("ar-puntos-list");
    ul.innerHTML = ar_puntos
        .map(p => `<li>• ${p}</li>`)
        .join("");
}

function ar_formatearPuntos() {
    if (!ar_puntos.length) {
        return "<p>Sin puntos añadidos.</p>";
    }

    return `
        <ul>
            ${ar_puntos.map(p => `<li>${p}</li>`).join("")}
        </ul>
    `;
}

/* ============================================================
   GENERAR ACTA
============================================================ */

function ar_generarActa() {

    const fecha       = document.getElementById("ar-fecha").value;
    const horaInicio  = document.getElementById("ar-hora-inicio").value;
    const horaFin     = document.getElementById("ar-hora-fin").value;

    if (!fecha || !horaInicio || !horaFin) {
        alert("⚠️ Fecha y horas son obligatorias.");
        return;
    }

    const asistentes = [...document.querySelectorAll("#ar-asistentes tr")]
        .map(tr => {
            const tds = tr.querySelectorAll("td");
            return { nombre: tds[0].textContent, cargo: tds[1].textContent };
        });

    const actaHTML = `
        <p><strong>Molsan Gestión y Tramitación, SL.</strong><br>
        Cl. Felip II, 293 - Bxos<br>
        08016 Barcelona<br>
        Tel. 93.349.74.65<br>
        cancelaciones@molsan.es</p>

        <h3>ORDEN DEL DÍA – REUNIÓN ${fecha}</h3>

        <p>Se procede a realizar la reunión en las instalaciones del Grupo Sánchez Molina
        sita en Edificio Trade, Torre Sur, Gran Vía Carles III 5 pl. de Barcelona.</p>

        <p>Se inicia la reunión a las <strong>${horaInicio}</strong> siendo una duración máxima de 1h,
        con la correspondiente finalización de la reunión a las <strong>${horaFin}</strong>.</p>

        <h3>Asistentes</h3>
        <table class="table-premium">
            <thead><tr><th>Asistentes</th><th>Cargo</th></tr></thead>
            <tbody>
                ${asistentes.map(a => `
                    <tr><td>${a.nombre}</td><td>${a.cargo}</td></tr>
                `).join("")}
            </tbody>
        </table>

        <h3>Puntos de la reunión</h3>
        ${ar_formatearPuntos()}
    `;

    document.getElementById("ar-acta-contenido").innerHTML = actaHTML;
    document.getElementById("ar-acta-final").style.display = "block";
}

/* ============================================================
   PDF NORMAL (SOLO ACTA)
============================================================ */

function ar_imprimirActa() {

    const contenido = document.getElementById("ar-acta-contenido").innerHTML;

    const ventana = window.open("", "_blank");

    ventana.document.write(`
        <html>
        <head>
            <title>Acta de reunión</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    line-height: 1.6;
                    color: #111;
                }
                h1, h2, h3 {
                    margin-top: 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                table, th, td {
                    border: 1px solid #ccc;
                    padding: 8px;
                }
                strong {
                    font-weight: 600;
                }
            </style>
        </head>
        <body>

            ${contenido}

        </body>
        </html>
    `);

    ventana.document.close();
    ventana.onload = () => ventana.print();
}

/* ============================================================
   PDF COMPLETO (ACTA + INFORMES PREMIUM + EVOLUTIVO)
============================================================ */

async function ar_imprimirActaCompleta() {

    const acta = document.getElementById("ar-acta-contenido").innerHTML;

    const datos = JSON.parse(localStorage.getItem("molsan_firmas") || "[]");

    const tabla = (titulo, headers, filas) => `
        <h2>${titulo}</h2>
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
            <thead>
                <tr>${headers.map(h => `<th style="border:1px solid #ccc; padding:6px;">${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${filas.map(f => `
                    <tr>${f.map(v => `<td style="border:1px solid #ccc; padding:6px;">${v}</td>`).join("")}</tr>
                `).join("")}
            </tbody>
        </table>
    `;

    const agrupar = (campo) => {
        const mapa = {};
        datos.forEach(f => {
            const clave = f[campo] || "Sin dato";
            if (!mapa[clave]) mapa[clave] = 0;
            mapa[clave]++;
        });
        return mapa;
    };

    const informeApoderados = tabla("🧑‍💼 Informe por Apoderado", ["Apoderado", "Total"], Object.entries(agrupar("apoderado")));
    const informeOficinas   = tabla("🏢 Informe por Oficina", ["Oficina", "Total"], Object.entries(agrupar("oficina")));
    const informeCentros    = tabla("🏛️ Informe por Centro", ["Centro", "Total"], Object.entries(agrupar("centro")));
    const informeCircuito   = tabla("🛣️ Informe por Circuito", ["Circuito", "Total"], Object.entries(agrupar("circuito")));
    const informeTipoGestion= tabla("📄 Informe por Tipo Gestión", ["Tipo Gestión", "Total"], Object.entries(agrupar("tipo_gestion")));
    const informeTipoFirma  = tabla("✍️ Informe por Tipo Firma", ["Tipo Firma", "Total"], Object.entries(agrupar("tipo_firma")));
    const informeCanal      = tabla("🏢 Informe por Canal", ["Canal", "Total"], Object.entries(agrupar("centro_que_firma")));

    const evolutivo = (() => {
        const mapa = {};
        datos.forEach(f => {
            const a = f.anio || "Sin año";
            const m = Number(f.mes) || 0;
            if (!mapa[a]) mapa[a] = Array(12).fill(0);
            if (m >= 1 && m <= 12) mapa[a][m - 1]++;
        });

        const headers = ["Mes", ...Object.keys(mapa)];
        const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

        const filas = meses.map((mes, i) => {
            const row = [mes];
            Object.keys(mapa).forEach(a => row.push(mapa[a][i]));
            return row;
        });

        return tabla("📈 Informe Evolutivo", headers, filas);
    })();

    const ventana = window.open("", "_blank");

    ventana.document.write(`
        <html>
        <head>
            <title>Acta + Informes</title>
            <style>
                body { font-family: Arial; padding: 40px; line-height: 1.6; }
                h1, h2 { margin-top: 40px; }
                table { margin-bottom: 30px; }
            </style>
        </head>
        <body>

            <h1>📄 Acta de reunión</h1>
            ${acta}

            ${evolutivo}
            ${informeApoderados}
            ${informeOficinas}
            ${informeCentros}
            ${informeCircuito}
            ${informeTipoGestion}
            ${informeTipoFirma}
            ${informeCanal}

        </body>
        </html>
    `);

    ventana.document.close();
    ventana.onload = () => ventana.print();
}
