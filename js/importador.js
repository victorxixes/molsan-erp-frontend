/* ============================================================
   IMPORTADOR — GLASS LUXE 2027
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

                const normalizadas = filasRaw.map(aplicarReglas);

                await guardarHistorico(normalizadas);
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
