/* ============================================================
   REGLAS DE NORMALIZACIÓN — GLASS LUXE 2027 (VERSIÓN EXCEL 1:1)
============================================================ */

function aplicarReglas(f) {

    /* ============================================================
       1) FECHAS → DD/MM/AAAA (incluye DD-MM-AAAA)
    ============================================================= */
    f.fecha_alta = normalizarFecha(f.fecha_alta);
    f.fecha_protocolo = normalizarFecha(f.fecha_protocolo);
    f.envio_notario = normalizarFecha(f.envio_notario);

    /* ============================================================
       2) MES (TEXTO) — Fórmula Excel: =TEXTO(K2;"mmmm")
    ============================================================= */
    f.mes = obtenerMesTexto(f.fecha_protocolo);

    /* ============================================================
       3) AÑO — Fórmula Excel: =AÑO(K2)
    ============================================================= */
    f.anio = obtenerAnio(f.fecha_protocolo);

    /* ============================================================
       4) CENTRO — Fórmula Excel: =SI(B2=5316;"Cancela";"Oficina")
    ============================================================= */
    f.centro = obtenerCentro(f.oficina);

    /* ============================================================
       5) TIPO GESTIÓN — Fórmula Excel exacta (18 condiciones)
    ============================================================= */
    f.tipo_gestion = obtenerTipoGestion(f.tipo_provision);

    /* ============================================================
       6) NOMBRE — Fórmula Excel exacta (18 condiciones)
    ============================================================= */
    f.nombre = obtenerNombre(f.apoderado);

    /* ============================================================
       7) APELLIDOS — Fórmula Excel exacta (17 condiciones)
    ============================================================= */
    f.apellidos = obtenerApellidos(f.nombre, f.apoderado, f.contrato);

    /* ============================================================
       8) CENTRO QUE FIRMA — Fórmula Excel exacta (17 condiciones)
    ============================================================= */
    f.centro_que_firma = obtenerCentroQueFirma(f.nombre);

    /* ============================================================
       9) CONTRATO CLASIFICADO — Fórmula Excel exacta (W2)
    ============================================================= */
    f.contrato = clasificarContrato(f.contrato);

    /* ============================================================
       10) NOTARIO — Fórmula Excel exacta (15 condiciones)
    ============================================================= */
    f.notario2 = clasificarNotario(f.notario);

    /* ============================================================
       11) CIRCUITO NOTARIAL — Fórmula Excel exacta (5 condiciones)
    ============================================================= */
    f.circuito = clasificarCircuito(f.notario2);

    /* ============================================================
       12) TIPO DE FIRMA — Fórmula Excel exacta
    ============================================================= */
    f.tipo_firma = obtenerTipoFirma(f.vc);

    return f;
}
function normalizarFecha(v) {
    if (!v) return "";

    // dd-mm-yyyy → dd/mm/yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
        const [d, m, y] = v.split("-");
        return `${d}/${m}/${y}`;
    }

    // dd/mm/yyyy ya correcto
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
        return v;
    }

    // Excel numérico
    if (typeof v === "number") {
        const d = new Date((v - 25569) * 86400 * 1000);
        if (!isNaN(d)) {
            const dia = String(d.getDate()).padStart(2, "0");
            const mes = String(d.getMonth() + 1).padStart(2, "0");
            const anio = d.getFullYear();
            return `${dia}/${mes}/${anio}`;
        }
    }

    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [y, m, d] = v.split("-");
        return `${d}/${m}/${y}`;
    }

    // fallback
    const d = new Date(v);
    if (isNaN(d)) return "";

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();

    return `${dia}/${mes}/${anio}`;
}
function obtenerMesTexto(fecha) {
    if (!fecha) return "";
    const [d, m, y] = fecha.split("/");
    const meses = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];
    return meses[Number(m) - 1] || "";
}

function obtenerAnio(fecha) {
    if (!fecha) return null;
    const [d, m, y] = fecha.split("/");
    return Number(y) || null;
}
function obtenerCentro(oficina) {
    return String(oficina) === "5316" ? "Cancela" : "Oficina";
}
function obtenerTipoGestion(v) {
    if (!v) return "";

    const valor = v.toString().trim().toLowerCase();

    const sin = [
        "cancelacion sin provision",
        "cancelación sin provisión"
    ];

    const con = [
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

    if (sin.includes(valor)) return "Sin provisión";
    if (con.includes(valor)) return "Con provisión";

    return "Con provisión";
}
function obtenerNombre(apoderado) {
    if (!apoderado) return "";

    const a = apoderado.trim();

    const mapa = {
        "Carlos Barbera García": "Carlos",
        "YARZA GESTION": "J.E. Yarza-Valencia",
        "ALBERTO LOPEZ RODRIGUEZ": "Alberto",
        "GASTON BEGUIRISTaIN AMORIN": "Gaston",
        "Colaborador Galicia Solo Firma": "M. Suarez-Galicia",
        "GESTCANARIAS": "G.Prieto-Canarias",
        "GESTORIA MAS": "Gest.Mas-Baleares",
        "CASTILLO 11": "I.Larriu-Navarra",
        "JULIO CUESTA": "J.J.Cuesta-Murcia",
        "Yolanda Vives Solsona": "Yolanda",
        "Pedro Pérez Sola": "Pedro",
        "VÍctor Tomás Castellsagué": "Victor",
        "GESGALICIA": "M.Suarez-Galicia",
        "Oficina Otra entidad": "Oficina OE",
        "Oficina CaixaBank": "Oficina CBK",
        "Colaborador": "Colaborador",
        "Ferran badia caralps": "Ferran",
        "Ana Cartagena Puerta": "Ana"
    };

    return mapa[a] || a;
}
function obtenerApellidos(nombre, apoderado, contratoClasificado) {
    const mapa = {
        "Carlos": "Barbera Garcia",
        "Juan Enrique": "Yarza Gimenez",
        "Alberto": "Lopez Rodriguez",
        "Gaston": "Beguiristain Amorin",
        "Maria": "Suarez Reboreda",
        "Gerardo": "Prieto Sanchez",
        "Maria Mercedes": "Antoli Riera",
        "Ignacio": "Larriu Chueca",
        "Jose Julio": "Cuesta Lorente",
        "Yolanda": "Vives Solsona",
        "Pedro": "Perez Sola",
        "Victor": "Tomas Castellsague",
        "Ana": "Cartagena Puerta",
        "Ferran": "Badia Caralps",
        "Colaborador": "Colaborador"
    };

    if (nombre in mapa) return mapa[nombre];

    if (contratoClasificado === "CaixaBank") return "Caixabank";
    if (contratoClasificado === "Externa") return "Otra Entidad";

    return "";
}
function obtenerCentroQueFirma(nombre) {
    const mapa = {
        "Carlos": "Molsan",
        "J.E. Yarza-Valencia": "Colaboradores",
        "Alberto": "Molsan",
        "Gaston": "Molsan",
        "M.Suarez-Galicia": "Colaboradores",
        "G.Prieto-Canarias": "Colaboradores",
        "Gest.Mas-Baleares": "Colaboradores",
        "I.Larriu-Navarra": "Colaboradores",
        "J.J.Cuesta-Murcia": "Colaboradores",
        "Yolanda": "Molsan",
        "Pedro": "Molsan",
        "Victor": "Molsan",
        "Oficina OE": "Oficina OE",
        "Oficina CBK": "Oficina CBK",
        "Colaborador": "Colaboradores",
        "Ana": "Molsan",
        "Ferran": "Molsan"
    };

    return mapa[nombre] || "";
}
function clasificarContrato(contrato) {
    if (!contrato) return "";

    const prefijo = String(contrato).substring(0, 4);
    const listaCaixa = ["9620", "9300", "9340", "9320", "9272"];

    return listaCaixa.includes(prefijo) ? "CaixaBank" : "Externa";
}
function clasificarNotario(n) {
    const mapa = {
        "María Dolores Giménez Arbona": "Circuito Península",
        "Gonzalo Sauca Núñez de Prado": "Circuito Península",
        "Isabel Molinos Gil": "Circuito Península",
        "Raúl González Fuentes": "Circuito Península",
        "Javier Micó Giner": "Circuito Península",
        "Rosa María Pérez Paniagua": "Circuito Península",
        "María del Camino Quiroga Martínez": "Circuito Península",
        "Ana María Fortuny Subirats": "Circuito Península",
        "David Gracia Fuentes": "Circuito Canarias",
        "José Manuel Jiménez Santoveña": "Circuito Canarias",
        "Guillermo José Croissier Naranjo": "Circuito Canarias",
        "José Ignacio Olmedo Castañeda": "Circuito Canarias",
        "Pedro Javier Viñuela Sandoval": "Circuito Canarias"
    };

    return mapa[n] || "FALSO";
}
function clasificarCircuito(valor) {
    if (valor === "FALSO") return "Circuito Externo";
    if (valor === "Circuito Península") return "Circuito Península";
    if (valor === "Circuito Canarias") return "Circuito Canarias";
    return "Circuito Externo";
}
function obtenerTipoFirma(vc) {
    if (vc === "N") return "Presencial";
    if (vc === "S") return "VideoConferencia";
    return "";
}
