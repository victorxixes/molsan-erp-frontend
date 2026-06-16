/* ============================================================
   UPLOADER — Importación de Excel (Glass Luxe 2027)
============================================================ */

let archivoSeleccionado = null;

function initUploader() {

    setTimeout(() => {

        const btn = document.getElementById("btnImportar");
        const input = document.getElementById("excelFile");
        const barra = document.getElementById("progreso-barra");
        const texto = document.getElementById("progreso-texto");

        if (!btn || !input) {
            console.warn("Uploader no está listo");
            return;
        }

        /* ============================================================
           CAPTURA DEL ARCHIVO
        ============================================================= */
        input.addEventListener("change", (e) => {
            archivoSeleccionado = e.target.files[0];
        });

        /* ============================================================
           RESET UI
        ============================================================= */
        if (barra) barra.style.width = "0%";
        if (texto) texto.textContent = "";

        aplicarPermisos();

        /* ============================================================
           ACCIÓN PRINCIPAL
        ============================================================= */
        btn.onclick = async () => {

            if (!window.permitirImportar) {
                alert("No tienes permiso para importar datos.");
                return;
            }

            if (!input.files.length) {
                alert("Selecciona un fichero Excel primero");
                return;
            }

            const file = input.files[0];

            if (!validarExtension(file.name)) {
                alert("El archivo debe ser .xlsx o .xls");
                return;
            }

            // UI inicial
            if (texto) texto.textContent = "Procesando archivo (0%)";
            btn.disabled = true;
            input.disabled = true;

            try {
                /* ============================================================
                   IMPORTACIÓN REAL (IndexedDB + chunks + progreso)
                ============================================================= */
                await procesarExcel(file);

                // UI final
                if (barra) barra.style.width = "100%";
                if (texto) texto.textContent = "Importación completada ✔";

                // Refrescar módulos
                await initDashboard();
                await initListado();
                await initInformesPremium();

            } catch (err) {
                console.error(err);
                if (texto) texto.textContent = "❌ Error al procesar el archivo";

            } finally {
                btn.disabled = false;
                input.disabled = false;

                // Reset visual tras 1 segundo
                setTimeout(() => {
                    if (barra) barra.style.width = "0%";
                    if (texto) texto.textContent = "";
                }, 1000);
            }
        };

    }, 0);
}

function validarExtension(nombre) {
    return nombre.endsWith(".xlsx") || nombre.endsWith(".xls");
}
