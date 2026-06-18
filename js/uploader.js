/* ============================================================
   UPLOADER — GLASS LUXE 2027
============================================================ */

async function initUploader() {
    console.log("📂 initUploader() ejecutado");

    const fileInput = document.getElementById("excelFile");
    const btn = document.getElementById("btnImportar");
    const barra = document.getElementById("progreso-barra");
    const texto = document.getElementById("progreso-texto");

    if (!fileInput || !btn) {
        console.warn("Uploader: elementos no encontrados");
        return;
    }

    btn.onclick = async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert("Selecciona un archivo Excel primero.");
            return;
        }

        btn.disabled = true;
        barra.style.width = "0%";
        texto.textContent = "Iniciando importación...";

        try {
            await importarExcel(file, (pct) => {
                barra.style.width = pct + "%";
                texto.textContent = `Progreso: ${pct}%`;
            });

            texto.textContent = "Importación completada.";
            console.log("Importación completada.");

        } catch (err) {
            console.error("Error en importación:", err);
            texto.textContent = "Error en importación.";
        }

        btn.disabled = false;
    };
}
