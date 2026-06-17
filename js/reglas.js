/* ============================================================
   REGLAS DE NORMALIZACIÓN — MOLSAN Glass Luxe 2027
   Adaptado EXACTAMENTE a tu Excel original
============================================================ */

function aplicarReglas(f) {

    // Mapeo EXACTO de tu Excel original
    const fila = {
        expediente: f["Expediente"] || "",
        oficina: f["Oficina"] || "",
        fecha_alta: f["Fecha Alta"] || "",
        contrato: f["Contrato"] || "",
        tipo_provision: f["Tipo Provisión"] || "",
        notario: f["Notario"] || "",
        provincia: f["Provincia"] || "",
        municipio: f["Municipio"] || "",
        comunidad: f["Comunidad"] || "",
        protocolo: f["Protocolo"] || "",
        fecha_protocolo: f["Fecha Protocolo"] || "",
        vc: f["V.C."] || "",
        apoderado: f["Apoderado"] || "",
        envio_notario: f["Envio Notario"] || "",
        dias: Number(f["Días"] || 0)
    };

    const fechaProtocolo = new Date(fila.fecha_protocolo);

    return {
        expediente: fila.expediente,
        oficina: fila.oficina,
        fecha_alta: normalizarFecha(fila.fecha_alta),
        contrato: fila.contrato,
        tipo_provision: fila.tipo_provision,
        notario: fila.notario,
        provincia: fila.provincia,
        municipio: fila.municipio,
        comunidad: fila.comunidad,
        protocolo: fila.protocolo,
        fecha_protocolo: normalizarFecha(fila.fecha_protocolo),
        vc: fila.vc,
        envio_notario: fila.envio_notario,
        dias: fila.dias,

        // Campos calculados (antes eran fórmulas de Excel)
        mes: getMesNumero(fechaProtocolo),
        anio: getAnio(fechaProtocolo),

        centro: fila.oficina,
        tipo_gestion: fila.tipo_provision,
        nombre: fila.apoderado,
        apellidos: "",
        centro_que_firma: fila.oficina,

        // Circuito notarial derivado del notario
        circuito: getCircuito(fila.notario),

        // Tipo de firma derivado de V.C.
        tipo_firma: getTipoFirma(fila.vc)
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

function getMesNumero(fecha) {
    if (!(fecha instanceof Date) || isNaN(fecha)) return "";
    return fecha.getMonth() + 1;
}

function getAnio(fecha) {
    if (!(fecha instanceof Date) || isNaN(fecha)) return "";
    return fecha.getFullYear();
}

/* ============================================================
   CIRCUITO NOTARIAL
============================================================ */
function getCircuito(valor) {
    if (!valor) return "Sin circuito";

    const v = String(valor).toLowerCase();

    if (v.includes("a")) return "A";
    if (v.includes("b")) return "B";
    if (v.includes("c")) return "C";

    return "Otros";
}

/* ============================================================
   TIPO DE FIRMA
============================================================ */
function getTipoFirma(valor) {
    if (!valor) return "Desconocido";

    const v = String(valor).toLowerCase();

    if (v.includes("vc") || v.includes("video") || v.includes("tele") || v.includes("virtual"))
        return "VideoConferencia";

    if (v.includes("pres"))
        return "Presencial";

    return "Desconocido";
}
