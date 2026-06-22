/* ============================================================
   UPLOADER — GLASS LUXE 2027
============================================================ */

async function initUploader() {
    console.log("📂 initUploader() ejecutado");

    // Solo continuar si el módulo está visible
    if (!document.getElementById("excelFile")) {
        console.log("⏳ Uploader no está visible, cancelando initUploader()");
        return;
    }

    const fileInput = document.getElementById("excelFile");
    const btn = document.getElementById("btnImportar");
    const barra = document.getElementById("progreso-barra");
    const texto = document.getElementById("progreso-texto");

    if (!fileInput || !btn || !barra || !texto) {
        console.warn("❌ Uploader: elementos no encontrados");
        return;
    }

    console.log("✔ Uploader: elementos encontrados correctamente");

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
            barra.style.width = "100%";
            console.log("Importación completada.");

        } catch (err) {
            console.error("Error en importación:", err);
            texto.textContent = "Error en importación.";
        }

        btn.disabled = false;
    };
}
