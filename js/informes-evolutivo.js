/* ============================================================
   INFORME EVOLUTIVO — TABLA COMPLETA 2020–2026
============================================================ */
async function initInformeEvolutivo() {
    console.log("🔥 initInformeEvolutivo ejecutado");

    if (window.__EVO_RUNNING__) {
        console.warn("⛔ initInformeEvolutivo() ignorado: ya está ejecutándose.");
        return;
    }
    window.__EVO_RUNNING__ = true;

    try {
        const tabla = document.getElementById("evo-tabla");
        const resumen = document.getElementById("evo-resumen");
        const contenedorFinal = document.getElementById("evo-final");

        if (!tabla || !resumen || !contenedorFinal) {
            console.warn("⛔ Elementos del informe evolutivo no encontrados.");
            return;
        }

        tabla.innerHTML = "";

        const datos = await obtenerFirmas();
        console.log("🔥 datos obtenidos en evolutivo:", datos.length);

        // ⛔ PARA LA PRUEBA: NO HACEMOS NADA MÁS
        return;

    } finally {
        setTimeout(() => {
            window.__EVO_RUNNING__ = false;
        }, 500);
    }
}
