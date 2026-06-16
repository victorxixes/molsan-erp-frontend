/* ============================================================
   INFORMES PREMIUM — GLASS LUXE 2027
============================================================ */

async function initInformesPremium() {
    const cont = document.getElementById("informeContainer");
    if (!cont) return;

    const datos = await cargarHistorico();
    cont.innerHTML = `
        <p>Total de firmas en histórico: <strong>${datos.length}</strong></p>
        <pre style="font-size:11px;opacity:.6;">${JSON.stringify(datos.slice(0, 10), null, 2)}</pre>
    `;
}
