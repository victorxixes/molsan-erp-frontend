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

    /* ============================================================
       INFORME EVOLUTIVO — CORREGIDO
       Hasta el último mes con datos
       Comparativa correcta por años
    ============================================================ */

    const evolutivo = (() => {

        const mapa = {};
        datos.forEach(f => {
            const a = f.anio || "Sin año";
            const m = Number(f.mes) || 0;
            if (!mapa[a]) mapa[a] = Array(12).fill(0);
            if (m >= 1 && m <= 12) mapa[a][m - 1]++;
        });

        const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        const anios = Object.keys(mapa);

        /* Detectar último mes con datos */
        let ultimoMesIndex = -1;
        anios.forEach(a => {
            mapa[a].forEach((v, idx) => {
                if (v > 0 && idx > ultimoMesIndex) ultimoMesIndex = idx;
            });
        });

        if (ultimoMesIndex === -1) {
            return "<p>Sin datos evolutivos.</p>";
        }

        const nombreUltimoMes = meses[ultimoMesIndex];

        /* Construir tabla mensual */
        const headers = ["Mes", ...anios];

        const filas = meses.map((mes, i) => {
            const row = [mes];
            anios.forEach(a => row.push(mapa[a][i]));
            return row;
        });

        /* Totales hasta el último mes */
        const totalesHastaMes = {};
        anios.forEach(a => {
            totalesHastaMes[a] = mapa[a]
                .slice(0, ultimoMesIndex + 1)
                .reduce((s, v) => s + v, 0);
        });

        /* Fila resumen */
        const filaHastaMes = [
            `Hasta ${nombreUltimoMes}`,
            ...anios.map(a => totalesHastaMes[a])
        ];

        filas.push(filaHastaMes);

        const tablaEvolutivo = tabla("📈 Informe Evolutivo", headers, filas);

        /* Evolución % volumen de firmas */
        const anioActual = Math.max(...anios.map(a => Number(a)));
        const totalActual = totalesHastaMes[anioActual] || 0;

        const resumenEvolucion = anios
            .filter(a => Number(a) < anioActual)
            .map(a => {
                const totalPrev = totalesHastaMes[a] || 0;
                if (!totalPrev) return `${anioActual} vs ${a}: sin datos`;
                const pct = ((totalActual - totalPrev) / totalPrev) * 100;
                return `${anioActual} vs ${a}: ${pct.toFixed(2)}%`;
            })
            .join("<br>");

        const bloqueResumen = `
            <h3>📊 Evolución % volumen de firmas</h3>
            <p>${resumenEvolucion}</p>
        `;

        return tablaEvolutivo + bloqueResumen;
    })();

    /* ============================================================
       CONSTRUCCIÓN FINAL DEL PDF COMPLETO
    ============================================================ */

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
