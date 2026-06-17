/* ============================================================
   UPLOADER — Importación de Excel (Glass Luxe 2027)
============================================================ */

function initUploader() {
    const input = document.getElementById("excelFile");
    const btn = document.getElementById("btnImportar");
    const barra = document.getElementById("progreso-barra");
    const texto = document.getElementById("progreso-texto");

    if (!input || !btn) {
        console.error("Uploader: faltan elementos en el DOM");
        return;
    }

    btn.onclick = async () => {
        if (!input.files || !input.files.length) {
            alert("Selecciona un fichero Excel primero.");
            return;
        }

        const file = input.files[0];

        barra.style.width = "0%";
        texto.textContent = "Procesando fichero...";

        try {
            // 1) Importar y guardar en IndexedDB
            const filas = await importarExcel(file, (porcentaje) => {
                barra.style.width = porcentaje + "%";
                texto.textContent = `Progreso: ${porcentaje}%`;
            });

            console.log("Importación completada. Filas:", filas.length);
            texto.textContent = `Importación completada. Filas: ${filas.length}`;

            // 2) Recalcular KPIs
            await recalcularKPIs();

            // 3) Cambiar de módulo al terminar → AQUÍ ESTABA EL PROBLEMA
            //    Antes llamabas a initDashboard() / initListado() directamente,
            //    pero sus templates no estaban montados.
            cargarModulo("dashboard");   // mostramos el dashboard ya con datos

        } catch (err) {
            console.error("Error importando Excel:", err);
            alert("Error importando el fichero. Revisa la consola.");
            texto.textContent = "Error en la importación.";
        }
    };
}
