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
       2) MES (TEXTO)
    ============================================================= */
    f.mes = obtenerMesTexto(f.fecha_protocolo);

    /* ============================================================
       3) AÑO
    ============================================================= */
    f.anio = obtenerAnio(f.fecha_protocolo);

    /* ============================================================
       4) CENTRO
    ============================================================= */
    f.centro = obtenerCentro(f.oficina);

    /* ============================================================
       5) TIPO GESTIÓN
    ============================================================= */
    f.tipo_gestion = obtenerTipoGestion(f.tipo_provision);

    /* ============================================================
       6) NOMBRE
    ============================================================= */
    f.nombre = obtenerNombre(f.apoderado);

    /* ============================================================
       7) APELLIDOS
    ============================================================= */
    f.apellidos = obtenerApellidos(f.nombre, f.apoderado, f.contrato);

    /* ============================================================
       8) CENTRO QUE FIRMA
    ============================================================= */
    f.centro_que_firma = obtenerCentroQueFirma(f.nombre);

    /* ============================================================
       9) CONTRATO CLASIFICADO
    ============================================================= */
    f.contrato = clasificarContrato(f.contrato);

    /* ============================================================
       10) NOTARIO — NORMALIZACIÓN PREMIUM
    ============================================================= */
    f.notario2 = clasificarNotario(f.notario);

    /* ============================================================
       11) CIRCUITO NOTARIAL
    ============================================================= */
    f.circuito = clasificarCircuito(f.notario2);

    /* ============================================================
       12) TIPO DE FIRMA
    ============================================================= */
    f.tipo_firma = obtenerTipoFirma(f.vc);

    return f;
}

/* ============================================================
   FECHAS
============================================================ */
function normalizarFecha(v) {
    if (!v) return "";

    if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
        const [d, m, y] = v.split("-");
        return `${d}/${m}/${y}`;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;

    if (typeof v === "number") {
        const d = new Date((v - 25569) * 86400 * 1000);
        if (!isNaN(d)) {
            const dia = String(d.getDate()).padStart(2, "0");
            const mes = String(d.getMonth() + 1).padStart(2, "0");
            const anio = d.getFullYear();
            return `${dia}/${mes}/${anio}`;
        }
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [y, m, d] = v.split("-");
        return `${d}/${m}/${y}`;
    }

    const d = new Date(v);
    if (isNaN(d)) return "";

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

/* ============================================================
   MES / AÑO
============================================================ */
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

/* ============================================================
   CENTRO
============================================================ */
function obtenerCentro(oficina) {
    return String(oficina) === "5316" ? "Cancela" : "Oficina";
}

/* ============================================================
   TIPO GESTIÓN
============================================================ */
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

/* ============================================================
   NOMBRE / APELLIDOS / CENTRO QUE FIRMA
============================================================ */
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

/* ============================================================
   CONTRATO
============================================================ */
function clasificarContrato(contrato) {
    if (!contrato) return "";

    const prefijo = String(contrato).substring(0, 4);
    const listaCaixa = ["9620", "9300", "9340", "9320", "9272"];

    return listaCaixa.includes(prefijo) ? "CaixaBank" : "Externa";
}

/* ============================================================
   NORMALIZACIÓN PREMIUM DE NOTARIOS
============================================================ */

function normalizarTexto(str) {
    if (!str) return "";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

const MAPA_NOTARIOS = {
    "maria dolores gimenez arbona": "Circuito Península",
    "gonzalo sauca nunez de prado": "Circuito Península",
    "isabel molinos gil": "Circuito Península",
    "raul gonzalez fuentes": "Circuito Península",
    "javier mico giner": "Circuito Península",
    "rosa maria perez paniagua": "Circuito Península",
    "maria del camino quiroga martinez": "Circuito Península",
    "ana maria fortuny subirats": "Circuito Península",

    "david gracia fuentes": "Circuito Canarias",
    "jose manuel jimenez santovena": "Circuito Canarias",
    "guillermo jose croissier naranjo": "Circuito Canarias",
    "jose ignacio olmedo castaneda": "Circuito Canarias",
    "pedro javier vinuela sandoval": "Circuito Canarias"
};

function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = Math.min(
                matrix[i-1][j] + 1,
                matrix[i][j-1] + 1,
                matrix[i-1][j-1] + (b[i-1] === a[j-1] ? 0 : 1)
            );
        }
    }
    return matrix[b.length][a.length];
}

function fuzzyMatch(nombreNormalizado) {
    for (const clave in MAPA_NOTARIOS) {
        const distancia = levenshtein(nombreNormalizado, clave);
        if (distancia <= 3) return MAPA_NOTARIOS[clave];
    }
    return null;
}

function clasificarNotario(n) {
    const limpio = normalizarTexto(n);

    if (MAPA_NOTARIOS[limpio]) return MAPA_NOTARIOS[limpio];

    const fuzzy = fuzzyMatch(limpio);
    if (fuzzy) return fuzzy;

    return "FALSO";
}

/* ============================================================
   CIRCUITO NOTARIAL
============================================================ */
function clasificarCircuito(valor) {
    if (valor === "Circuito Península") return "Circuito Península";
    if (valor === "Circuito Canarias") return "Circuito Canarias";
    return "Circuito Externo";
}

/* ============================================================
   TIPO FIRMA
============================================================ */
function obtenerTipoFirma(vc) {
    if (vc === "N") return "Presencial";
    if (vc === "S") return "VideoConferencia";
    return "";
}
