/* ============================================================
   PANEL APODERADOS — INIT (OBLIGATORIO)
============================================================ */

let PAP_DATOS = [];
let PAP_POR_ANIO = {};

async function initPanelApoderados() {
    console.log("👤 initPanelApoderados() ejecutado");

    const sel = document.getElementById("pap-select-anio");
    if (!sel) {
        console.warn("⏳ Panel Apoderados aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PAP_DATOS = datos;
    PAP_POR_ANIO = pap_groupByAnio(PAP_DATOS);

    pap_fillSelectAnios();
    pap_selectUltimoAnio();

    sel.addEventListener("change", pap_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → APODERADO → MESES
============================================================ */
function pap_groupByAnio(datos) {

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const map = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio || isNaN(anio)) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        if (!mesesValidos.includes(mes)) continue;

        const apoderado = f.apoderado || "Sin apoderado";

        if (!map[anio]) {
            map[anio] = {
                apoderados: {},
                mesesConDatos: new Set()
            };
        }

        const r = map[anio];

        if (!r.apoderados[apoderado]) {
            r.apoderados[apoderado] = {
                total: 0,
                meses: {}
            };

            mesesValidos.forEach(m => r.apoderados[apoderado].meses[m] = 0);
        }

        const a = r.apoderados[apoderado];

        a.total++;
        a.meses[mes]++;

        r.mesesConDatos.add(mes);
    }

    return map;
}

/* ============================================================
   SELECT AÑOS
============================================================ */
function pap_fillSelectAnios() {
    const sel = document.getElementById("pap-select-anio");
    if (!sel) return;

    sel.innerHTML = "";

    const anios = Object.keys(PAP_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function pap_selectUltimoAnio() {
    const sel = document.getElementById("pap-select-anio");
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    pap_onChangeAnio();
}

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function pap_onChangeAnio() {
    const sel = document.getElementById("pap-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PAP_POR_ANIO[anio];
    if (!info) return;

    info.anio = anio;

    pap_renderTablaApoderados(info);
}
