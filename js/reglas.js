/* ============================================================
   REGLAS DE NORMALIZACIÓN — MOLSAN Glass Luxe 2027
   Adaptado EXACTAMENTE a tu Excel original
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

    // CENTRO (tu fórmula exacta)
    const centro = (Number(oficina) === 5316) ? "Cancela" : "Oficina";

    const tipoGestion = tipoProvision;
    const nombre = apoderado;
    const apellidos = "";
    const centroQueFirma = centro;

    // 3. Circuito notarial EXACTO según tu Excel
    const circuito = getCircuito(notarioOriginal);

    // 4. Tipo de firma EXACTO según tu Excel (N/S)
    const tipoFirma = getTipoFirma(vc);

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
   FECHAS — FORMATO ESPAÑOL DD/MM/AAAA
============================================================ */
function normalizarFecha(v) {
    const d = new Date(v);
    if (isNaN(d)) return "";

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();

    return `${dia}/${mes}/${anio}`;
}

/* ============================================================
   CIRCUITO NOTARIAL — EXACTO SEGÚN TU EXCEL
============================================================ */
function getCircuito(notario) {
    if (!notario) return "Circuito Externo";

    const n = String(notario).trim();

    // Circuito Península
    const peninsula = [
        "María Dolores Giménez Arbona",
        "Gonzalo Sauca Núñez de Prado",
        "Isabel Molinos Gil",
        "Raúl González Fuentes",
        "María Isabel Gabarró Miquel",
        "Javier Micó Giner",
        "Jesús Javier Benavides Lima",
        "Rosa María Pérez Paniagua",
        "María del Camino Quiroga Martínez",
        "Ana María Fortuny Subirats",
        "Miguel de Páramo Argüelles"
    ];

    // Circuito Canarias
    const canarias = [
        "David Gracia Fuentes",
        "José Manuel Jiménez Santoveña",
        "Guillermo José Croissier Naranjo",
        "José Ignacio Olmedo Castañeda",
        "Pedro Javier Viñuela Sandoval"
    ];

    if (peninsula.includes(n)) return "Circuito Península";
    if (canarias.includes(n)) return "Circuito Canarias";

    return "Circuito Externo";
}

/* ============================================================
   TIPO DE FIRMA — EXACTO SEGÚN TU EXCEL (N/S)
============================================================ */
function getTipoFirma(valor) {
    if (!valor) return "Desconocido";

    const v = String(valor).trim().toUpperCase();

    if (v === "N") return "Presencial";
    if (v === "S") return "VideoConferencia";

    return "Desconocido";
}
