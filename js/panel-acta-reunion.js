/* ============================================================
   PANEL ACTA DE REUNIÓN — LÓGICA
============================================================ */

async function initActaReunion() {
    // No hay nada que cargar, solo mostrar el panel
}

function ar_generarActa() {

    const fecha       = document.getElementById("ar-fecha").value;
    const horaInicio  = document.getElementById("ar-hora-inicio").value;
    const horaFin     = document.getElementById("ar-hora-fin").value;
    const puntos      = document.getElementById("ar-puntos").value;

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
        <p>${puntos.replace(/\n/g, "<br>")}</p>
    `;

    document.getElementById("ar-acta-contenido").innerHTML = actaHTML;
    document.getElementById("ar-acta-final").style.display = "block";
}
