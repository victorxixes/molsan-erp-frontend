/* ============================================================
   IMPORTADOR — GLASS LUXE 2027 (IndexedDB + Chunks + Progreso)
============================================================ */

/* ============================================================
   MAPEO DE COLUMNAS DEL EXCEL → CAMPOS INTERNOS
============================================================ */
function mapearCamposExcel(f) {
    return {
        expediente: f["Expediente"] ?? "",
        oficina: f["Oficina"] ?? "",
        fecha_alta: f["Fecha Alta"] ?? "",
        contrato: f["Contrato"] ?? "",
        tipo_provision: f["Tipo Provisión"] ?? "",
        notario: f["Notario"] ?? "",
        provincia: f["Provincia"] ?? "",
        municipio: f["Municipio"] ?? "",
        comunidad: f["Comunidad"] ?? "",
        protocolo: f["Protocolo"] ?? "",
        fecha_protocolo: f["Fecha Protocolo"] ?? "",
        vc: f["V.C."] ?? "",
        apoderado: f["Apoderado"] ?? "",
        envio_notario: f["Envio Notario"] ?? "",
        dias: Number(f["Días"] ?? 0),

        // Campos generados por Excel
        nombre_completo: f["Nombre"] ?? "",
        centro_que_firma_raw: f["Centro que firma"] ?? "",

        // Campos que generaremos después
        mes: "",
        anio: "",
        centro: "",
        tipo_gestion: "",
        nombre: "",
        apellidos: "",
        centro_que_firma: "",
        contrato2: "",
        notario2: "",
        circuito: "",
        tipo_firma: ""
    };
}

/* ============================================================
   IMPORTAR EXCEL (API PÚBLICA)
============================================================ */
async function importarExcel(file, onProgress) {
    return procesarExcel(file, onProgress);
}

/* ============================================================
   PROCESAR EXCEL COMPLETO
============================================================ */
async function procesarExcel(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });

                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const filasRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                console.log("📥 Filas crudas:", filasRaw.length);

                /* ============================================================
                   1) MAPEAR CAMPOS DEL EXCEL
                ============================================================= */
                const mapeadas = filasRaw.map(mapearCamposExcel);

                /* ============================================================
                   2) APLICAR REGLAS
                ============================================================= */
                const normalizadas = mapeadas.map(aplicarReglas);

                console.log("📦 Filas normalizadas:", normalizadas.length);

                /* ============================================================
                   3) BORRAR DB ANTES DE IMPORTAR
                ============================================================= */
                await borrarFirmas();

                /* ============================================================
                   4) GUARDAR EN CHUNKS
                ============================================================= */
                const chunkSize = 500;
                let procesadas = 0;

                for (let i = 0; i < normalizadas.length; i += chunkSize) {
                    const chunk = normalizadas.slice(i, i + chunkSize);
                    await guardarFirmas(chunk);

                    procesadas += chunk.length;

                    if (onProgress) {
                        const pct = Math.round((procesadas / normalizadas.length) * 100);
                        onProgress(pct);
                    }
                }

                /* ============================================================
                   5) RECALCULAR KPIs
                ============================================================= */
                await recalcularKPIs();

                console.log("✅ Importación completada. Filas:", normalizadas.length);
                resolve(normalizadas);

            } catch (err) {
                console.error("❌ Error procesando Excel:", err);
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}
