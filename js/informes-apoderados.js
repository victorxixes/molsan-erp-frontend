/* ============================================================
   INFORME POR APODERADO — PREMIUM
============================================================ */
async function generarInformeApoderados() {

    const cont = document.getElementById("informeContainer");
    if (!cont) return;

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    const meses = MESES_ORDEN;

    const mesesConDatos = [...new Set(
        datos.filter(f => f.anio == anioSel).map(f => f.mes)
    )].sort((a,b)=>meses.indexOf(a)-meses.indexOf(b));

    const mesesValidos = meses.slice(0, meses.indexOf(mesesConDatos.at(-1)) + 1);

    const mapa = {};

    datos.filter(f => f.anio == anioSel).forEach(f => {
        const apo = f.apoderado || "Sin apoderado";

        if (!mapa[apo]) mapa[apo] = { total: 0, meses: Array(12).fill(0) };

        mapa[apo].total++;
        const idx = meses.indexOf(f.mes);
        if (idx >= 0) mapa[apo].meses[idx]++;
    });

    const lista = Object.entries(mapa).sort((a,b)=>b[1].total - a[1].total);

    const totalesMes = mesesValidos.map(m =>
        datos.filter(f => f.anio == anioSel && f.mes == m).length
    );

    const totalGlobal = totalesMes.reduce((a,b)=>a+b,0);

    cont.style.display = "block";

    const tablaFirmas = `
        <h2 class="titulo-modulo">🧑‍💼 Informe por Apoderado — ${anioSel}</h2>
        <div class="card-glass mt-20 tabla-scroll-x">
            <table class="table-premium tabla-excel">
                <thead>
                    <tr>
                        <th>Apoderado</th>
                        ${mesesValidos.map(m => `<th>${m}</th>`).join("")}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${lista.map(([apo, d]) => {
                        const valores = mesesValidos.map(m => d.meses[meses.indexOf(m)]);
                        const total = valores.reduce((a,b)=>a+b,0);
                        return `
                            <tr>
                                <td><strong>${apo}</strong></td>
                                ${valores.map(v => `<td>${v}</td>`).join("")}
                                <td><strong>${total}</strong></td>
                            </tr>
                        `;
                    }).join("")}
                    <tr style="background:rgba(14,165,233,0.15);font-weight:700;">
                        <td>Total</td>
                        ${totalesMes.map(t => `<td>${t}</td>`).join("")}
                        <td>${totalGlobal}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    const tablaPorcentajes = `
        <div class="card-glass mt-30 tabla-scroll-x">
            <table class="table-premium tabla-excel">
                <thead>
                    <tr>
                        <th>%</th>
                        ${mesesValidos.map(m => `<th>${m}</th>`).join("")}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${lista.map(([apo, d]) => {

                        const valores = mesesValidos.map(m => {
                            const idx = meses.indexOf(m);
                            const totalMes = totalesMes[mesesValidos.indexOf(m)];
                            const pct = totalMes ? (d.meses[idx] / totalMes * 100) : 0;
                            return `<td>${pct.toFixed(2)}%</td>`;
                        });

                        const pctTotal = totalGlobal ? (d.total / totalGlobal * 100) : 0;

                        return `
                            <tr>
                                <td><strong>${apo}</strong></td>
                                ${valores.join("")}
                                <td><strong>${pctTotal.toFixed(2)}%</strong></td>
                            </tr>
                        `;
                    }).join("")}

                    <tr style="background:rgba(14,165,233,0.15);font-weight:700;">
                        <td>Total</td>
                        ${mesesValidos.map(() => `<td>100.00%</td>`).join("")}
                        <td>100.00%</td>
                    </tr>

                </tbody>
            </table>
        </div>
    `;

    cont.innerHTML = tablaFirmas + tablaPorcentajes;
}
