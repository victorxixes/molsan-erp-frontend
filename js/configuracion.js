/* ============================================================
   CONFIGURACIÓN — MOLSAN GLASS LUXE 2027
============================================================ */

function initConfiguracion() {

    // Mapas reales del ERP
    cargarMapa("apoderados", "mapaApoderados");
    cargarMapa("apellidos", "mapaApellidos");
    cargarMapa("centroFirma", "mapaCentroFirma");
    cargarMapa("notarios", "mapaNotarios");
    cargarMapa("tipoGestion", "mapaTipoGestion");
    cargarMapa("oficinas", "mapaOficinas");

    // Indicadores visuales
    activarIndicadoresGuardado();

    // Permisos
    aplicarPermisos();

    console.log("Configuración inicializada correctamente.");
}

/* ============================================================
   INDICADORES VISUALES
============================================================ */
function activarIndicadoresGuardado() {
    document.querySelectorAll(".config-textarea").forEach(area => {
        area.addEventListener("input", () => {
            area.classList.add("cambiado");
        });
    });
}

/* ============================================================
   CARGAR MAPA
============================================================ */
function cargarMapa(nombre, textareaId) {
    const mapa = JSON.parse(localStorage.getItem("molsan_mapa_" + nombre) || "[]");
    const textarea = document.getElementById(textareaId);
    if (textarea) textarea.value = mapa.join("\n");
}

/* ============================================================
   GUARDAR MAPA
============================================================ */
function guardarMapa(nombre) {
    const textarea = document.getElementById("mapa" + capitalizar(nombre));
    if (!textarea) return;

    const lineas = textarea.value
        .split("\n")
        .map(l => l.trim())
        .filter(l => l !== "");

    const errores = validarMapa(nombre, lineas);

    if (errores.length) {
        alert("Errores en el mapa:\n\n" + errores.join("\n"));
        return;
    }

    localStorage.setItem("molsan_mapa_" + nombre, JSON.stringify(lineas));

    textarea.classList.remove("cambiado");
    alert("Mapa guardado correctamente.");
}

/* ============================================================
   VALIDACIÓN DE MAPAS
============================================================ */
function validarMapa(nombre, lineas) {
    const errores = [];

    // Duplicados
    const duplicados = lineas.filter((v, i, a) => a.indexOf(v) !== i);
    if (duplicados.length) errores.push("Hay valores duplicados: " + duplicados.join(", "));

    // Vacíos
    if (lineas.some(l => l.trim() === "")) errores.push("Hay líneas vacías.");

    // Longitud mínima
    if (lineas.length === 0) errores.push("El mapa está vacío.");

    return errores;
}

/* ============================================================
   HELPERS
============================================================ */
function capitalizar(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
}
