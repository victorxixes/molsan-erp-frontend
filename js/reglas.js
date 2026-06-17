/* ============================================================
   REGLAS DE NORMALIZACIÓN — MOLSAN Glass Luxe 2027
   Adaptado EXACTAMENTE a tu Excel original + columnas nuevas
============================================================ */

function aplicarReglas(f) {

    // 1. Mapeo EXACTO del Excel original
    const expediente = f["Expediente"] || "";
    const oficina = f["Oficina"] || "";
    const fechaAlta = f["Fecha Alta"] || "";
    const contratoOriginal = f["Contrato"] || "";
    const tipoProvision = f["Tipo Provisión"] || "";
    const notarioOriginal = f["Notario"] || "";
    const provincia = f["Provincia"] || "";
    const municipio = f["Municipio"] || "";
    const comunidad = f["Comunidad"] || "";
    const protocolo = f["Protocolo"] || "";
    const fechaProtocolo = f["Fecha Protocolo"] || "";
    const vc = f["V.C."] || "";
    const apoderado = f["Apoderado"] || "";
    const envioNotario = f["Envio Notario"] || "";
    const dias = Number(f["Días"] || 0);

    // 2. Campos calculados (antes eran fórmulas de Excel)
    const fecha = new Date(fechaProtocolo);

    const mes = isNaN(fecha) ? "" : fecha.getMonth() + 1;
    const anio = isNaN(fecha) ? "" : fecha.getFullYear();

    const centro = oficina; // igual que en tu Excel
    const tipoGestion = tipoProvision;
    const nombre = apoderado; // Excel no trae nombre separado
    const apellidos = ""; // Excel no trae apellidos separados
    const centroQueFirma = oficina;

    // 3. Circuito notarial (derivado del notario)
    let circuito = "Sin circuito";
    if (notarioOriginal) {
        const n = notarioOriginal.toLowerCase();
        if (n.includes("a")) circuito = "A";
        else if (n.includes("b")) circuito = "B";
        else if (n.includes("c")) circuito = "C";
        else circuito = "Otros";
    }

    // 4. Tipo de firma (derivado de V.C.)
    let tipoFirma = "Desconocido";
    if (vc) {
        const v = vc.toLowerCase();
        if (v.includes("vc") || v.includes("video") || v.includes("virtual")) tipoFirma = "VideoConferencia";
        else if (v.includes("pres")) tipoFirma = "Presencial";
    }

    // 5. Devolver objeto final COMPLETO
    return {
        // Originales
        expediente,
        oficina,
        fecha_alta: normalizarFecha(fechaAlta),
        contrato: contratoOriginal,
        tipo_provision: tipoProvision,
        notario: notarioOriginal,
        provincia,
        municipio,
        comunidad,
        protocolo,
        fecha_protocolo: normalizarFecha(fechaProtocolo),
        vc,
        apoderado,
        envio_notario,
        dias,

        // Calculados
        mes,
        anio,
        centro,
        tipo_gestion: tipoGestion,
        nombre,
        apellidos,
        centro_que_firma: centroQueFirma,

        // Duplicados (como en tu Excel con fórmulas)
        contrato2: contratoOriginal,
        notario2: notarioOriginal,

        // Derivados
        circuito,
        tipo_firma: tipoFirma
    };
}

/* ============================================================
   FECHAS
============================================================ */
function normalizarFecha(v) {
    const d = new Date(v);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
}

