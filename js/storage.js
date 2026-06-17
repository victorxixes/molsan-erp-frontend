/* ============================================================
   STORAGE — IndexedDB Profesional (Glass Luxe 2027)
============================================================ */

let db = null;

// Inicializar DB (solo se llama una vez desde main.js)
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("molsanDB", 1);

        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains("firmas")) {
                db.createObjectStore("firmas", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve();
        };

        request.onerror = (e) => reject(e);
    });
}

// Guardar registros masivamente
async function guardarFirmas(datos) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("firmas", "readwrite");
        const store = tx.objectStore("firmas");

        datos.forEach(reg => store.add(reg));

        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e);
    });
}

// Borrar todo
async function borrarFirmas() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("firmas", "readwrite");
        const store = tx.objectStore("firmas");

        const req = store.clear();

        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
    });
}

// Obtener todas las firmas
async function obtenerFirmas() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("firmas", "readonly");
        const store = tx.objectStore("firmas");

        const req = store.getAll();

        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
}

// Para compatibilidad con filtros.js
async function obtenerIndiceChunks() {
    const datos = await obtenerFirmas();
    return datos.length;
}
