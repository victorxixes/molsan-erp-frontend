/* ============================================================
   IMPORTADOR — GLASS LUXE 2027 (IndexedDB + Chunks + Progreso)
============================================================ */

async function procesarExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });

                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const filasRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                // Normalizar
                const normalizadas = filasRaw.map(aplicarReglas);

                // Borrar DB antes de importar
                await borrarFirmas();

                // Guardar en chunks de 500 registros
                const chunkSize = 500;
                let procesadas = 0;

                for (let i = 0; i < normalizadas.length; i += chunkSize) {
                    const chunk = normalizadas.slice(i, i + chunkSize);
                    await guardarFirmas(chunk);

                    procesadas += chunk.length;
                    actualizarProgreso(procesadas, normalizadas.length);
                }

                await recalcularKPIs();

                console.log("Importación completada. Filas:", normalizadas.length);
                resolve();
            } catch (err) {
                console.error("Error procesando Excel:", err);
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}

/* ============================================================
   PROGRESO VISUAL
============================================================ */

function actualizarProgreso(actual, total) {
    const barra = document.getElementById("progreso-barra");
    const texto = document.getElementById("progreso-texto");

    if (!barra || !texto) return;

    const pct = Math.round((actual / total) * 100);

    barra.style.width = pct + "%";
    texto.textContent = `Procesando ${actual} / ${total} (${pct}%)`;
}
