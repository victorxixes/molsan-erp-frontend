/* ============================================================
   REGLAS DE NORMALIZACIÓN — GLASS LUXE 2027 (VERSIÓN FINAL)
============================================================ */

function aplicarReglas(f) {

    /* ============================================================
       1) FECHAS → SIEMPRE DD/MM/AAAA
    ============================================================= */
    f.fecha_alta = normalizarFecha(f.fecha_alta);
    f.fecha_protocolo = normalizarFecha(f.fecha_protocolo);
    f.envio_notario = normalizarFecha(f.envio_notario);

    /* ============================================================
       2) MES (nombre) + AÑO (número)
    ============================================================= */
    if (f.fecha_protocolo) {
        const [d, m, y] = f.fecha_protocolo.split("/");

        const nombresMes = [
            "enero","febrero","marzo","abril","mayo","junio",
            "julio","agosto","septiembre","octubre","noviembre","diciembre"
        ];

        f.mes = nombresMes[Number(m) - 1] || "";
        f.anio = Number(y) || "";
    } else {
        f.mes = "";
        f.anio = "";
    }

    /* ============================================================
       3) CENTRO (regla exacta)
    ============================================================= */
    f.centro = String(f.oficina) === "5316" ? "Cancela" : "Oficina";

    /* ============================================================
       4) CENTRO QUE FIRMA (igual que centro)
    ============================================================= */
    f.centro_que_firma = f.centro;

    /* ============================================================
       5) TIPO GESTIÓN (ADAPTADO A TUS REGLAS DE EXCEL)
    ============================================================= */
    f.tipo_gestion = normalizarTipoGestion(f.tipo_provision);

    /* ============================================================
       6) NOMBRE / APELLIDOS (si vienen juntos)
    ============================================================= */
    if (f.nombre_completo) {
        const partes = f.nombre_completo.trim().split(" ");
        f.nombre = partes.shift();
        f.apellidos = partes.join(" ");
    }

    /* ============================================================
       6B) APODERADO — CAPITALIZAR (ADAPTADO A TU PETICIÓN)
    ============================================================= */
    f.apoderado = capitalizarNombre(f.apoderado);

    /* ============================================================
       7) TIPO FIRMA (N/S)
    ============================================================= */
    f.tipo_firma = getTipoFirma(f.vc);

    /* ============================================================
       8) CIRCUITO NOTARIAL
    ============================================================= */
    f.circuito = getCircuito(f.notario);

    /* ============================================================
       9) DUPLICADOS
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

    // ISO completo: 2024-06-18T00:00:00.000Z
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
        const d = new Date(v);
        return d.toLocaleDateString("es-ES");
    }

    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [y, m, d] = v.split("-");
        return `${d}/${m}/${y}`;
    }

    // dd/mm/yyyy ya correcto
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
        return v;
    }

    // fallback
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("es-ES");
    }

    return v;
}

/* ============================================================
   TIPO GESTIÓN — Reglas exactas del Excel
============================================================ */
function normalizarTipoGestion(valor) {
    if (!valor) return "";

    const v = valor.trim().toLowerCase();

    // Casos explícitos de "Sin provisión"
    if (v === "cancelacion sin provision" ||
        v === "cancelación sin provisión") {
        return "Sin provisión";
    }

    // Casos explícitos de "Con provisión"
    const conProvision = [
        "cancelacion con provision",
        "cancelación con provisión",
        "cancelación",
        "constitución",
        "subrogación",
        "novación",
        "cradon",
        "crandon",
        "credit agricole sud mediterranee",
        "gesticaixa",
        "gestinova 99 sl",
        "molsan gestion y tramitacion sl",
        "one pekig road sl",
        "otro doc. vinc gtg",
        "sanchez molina abogados",
        "sareb"
    ];

    if (conProvision.includes(v)) {
        return "Con provisión";
    }

    // Por defecto
    return "Con provisión";
}

/* ============================================================
   APODERADO — Capitalizar nombre
============================================================ */
function capitalizarNombre(nombre) {
    if (!nombre) return "";

    return nombre
        .toLowerCase()
        .split(" ")
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
}

/* ============================================================
   CIRCUITO NOTARIAL
============================================================ */
function getCircuito(notario) {
    if (!notario) return "Circuito Externo";

    const n = String(notario).trim();

    const peninsula = [
        "María Dolores Giménez Arbona",
        "Gonzalo Sauca Núñez de Prado",
        "Isabel Molinos Gil",
        "Raúl González Fuentes",        
        "Javier Micó Giner",
        "Jesús Javier Benavides Lima",
        "Rosa María Pérez Paniagua",
        "María del Camino Quiroga Martínez",
        "Ana María Fortuny Subirats",
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
   TIPO DE FIRMA (N/S)
============================================================ */
function getTipoFirma(valor) {
    if (!valor) return "Desconocido";

    const v = String(valor).trim().toUpperCase();

    if (v === "N") return "Presencial";
    if (v === "S") return "VideoConferencia";

    return "Desconocido";
}
