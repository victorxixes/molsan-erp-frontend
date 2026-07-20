/* ============================================================
   INFORMES CORE — GLASS LUXE 2027
============================================================ */

window.MESES_ORDEN = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

function mesNumeroATexto(num) {
    return MESES_ORDEN[num - 1] || "";
}

function inf_getAnioSeleccionado() {
    const sel = document.getElementById("inf-select-anio");
    return sel ? Number(sel.value) : new Date().getFullYear();
}

let charts = [];

function resetChart() {
    charts.forEach(c => c.destroy());
    charts = [];
}

/* ============================================================
   INIT INFORMES PREMIUM
============================================================ */
async function initInformesPremium() {

    const sel = document.getElementById("inf-select-anio");
    if (!sel) return;

    const datos = await obtenerFirmas();
    if (!datos.length) return;

    const anios = [...new Set(
        datos.map(f => Number(f.anio)).filter(a => a > 0)
    )].sort((a,b)=>a-b);

    sel.innerHTML = "";
    anios.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        sel.appendChild(opt);
    });

    sel.value = anios.includes(2026) ? 2026 : anios[anios.length - 1];

    const cont = document.getElementById("informeContainer");
    if (cont) {
        cont.style.display = "none";
        cont.innerHTML = "";
    }
}

/* ============================================================
   STUB — generarMapasPremium
============================================================ */
async function generarMapasPremium() {
    return true;
}
