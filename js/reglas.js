/* ============================================================
   REGLAS DE NORMALIZACIÓN — GLASS LUXE 2027
============================================================ */

function aplicarReglas(f) {

    /* ============================================================
       1) FECHAS → dd/mm/yyyy
    ============================================================= */
    f.fecha_alta = normalizarFecha(f.fecha_alta);
    f.fecha_protocolo = normalizarFecha(f.fecha_protocolo);
    f.envio_notario = normalizarFecha(f.envio_notario);

    /* ============================================================
       2) MES / AÑO (de fecha protocolo)
    ============================================================= */
    if (f.fecha_protocolo) {
        const [d, m, y] = f.fecha_protocolo.split("/");
        f.mes = Number(m);
        f.anio = Number(y);
    } else {
        f.mes = "";
        f.anio = "";
    }

    /* ============================================================
       3) CENTRO (oficina original)
    ============================================================= */
    f.centro = f.oficina;

    /* ============================================================
       4) CENTRO QUE FIRMA (regla 5316)
    ============================================================= */
    f.centro_que_firma = (String(f.oficina) === "5316")
        ? "Cancela"
        : "Oficina";

    /* ============================================================
       5) TIPO GESTIÓN
    ============================================================= */
    f.tipo_gestion = f.tipo_provision;

    /* ============================================================
       6) NOMBRE / APELLIDOS (si vienen juntos)
    ============================================================= */
    if (f.nombre_completo) {
        const partes = f.nombre_completo.trim().split(" ");
        f.nombre = partes.shift();
        f.apellidos = partes.join(" ");
    }

    /* ============================================================
       7) TIPO FIRMA (N/S)
    ============================================================= */
    f.tipo_firma = getTipoFirma(f.vc);

    /* ============================================================
       8) CIRCUITO NOTARIAL
    ============================================================= */
    f.circuito = getCircuito(f.notario);

    /* ============================================================
       9) CAMPOS DUPLICADOS
    ============================================================= */
    f.contrato2 = f.contrato;
    f.notario2 = f.notario;

    return f;
}

/* ============================================================
   FECHAS — FORMATO ESPAÑOL DD/MM/AAAA
============================================================ */
function normalizarFecha(v) {
    if (!v) return "";

    // Excel numérico
    if (typeof v === "number") {
        const d = new Date((v - 25569) * 86400 * 1000);
        return d.toLocaleDateString("es-ES");
    }

    // yyyy-mm-dd
    if (v.includes("-")) {
        const [y, m, d] = v.split("-");
        return `${d}/${m}/${y}`;
    }

    // dd/mm/yyyy ya correcto
    return v;
}

/* ============================================================
   CIRCUITO NOTARIAL — EXACTO SEGÚN TU EXCEL
============================================================ */
function getCircuito(notario) {
    if (!notario) return "Circuito Externo";

    const n = String(notario).trim();

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
