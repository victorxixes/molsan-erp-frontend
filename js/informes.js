/* ============================================================
   INFORMES PREMIUM — GLASS LUXE 2027
============================================================ */

const MESES_ORDEN = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

function mesNumeroATexto(num) {
    return MESES_ORDEN[num - 1] || "";
}

let chartActual = null;

/* ============================================================
   SELECTOR DE AÑO — INFORMES PREMIUM
============================================================ */
function inf_getAnioSeleccionado() {
    return 2026;
}

async function initInformesPremium() {
    const sel = document.getElementById("inf-select-anio");
    if (!sel) return;

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const anios = [...new Set(
        datos
            .map(f => {
                if (f.fecha_protocolo && f.fecha_protocolo.includes("-")) {
                    const partes = f.fecha_protocolo.split("-");
                    return Number(partes[2]);
                }
                return 0;
            })
            .filter(a => a > 0)
    )].sort((a,b)=>a-b);

    sel.innerHTML = "";

    const targetYear = anios.includes(2026)
        ? 2026
        : (anios[anios.length - 1] || new Date().getFullYear());

    const opt = document.createElement("option");
    opt.value = targetYear;
    opt.textContent = targetYear;
    sel.appendChild(opt);

    sel.value = targetYear;

    const cont = document.getElementById("informeContainer");
    if (cont) {
        cont.style.display = "none";
        cont.innerHTML = "";
    }
}

/* ============================================================
   UTILIDAD — Destruir gráfico previo
============================================================ */
function resetChart() {
    if (chartActual) {
        chartActual.destroy();
        chartActual = null;
    }
}

/* ============================================================
   INFORME GENERAL PREMIUM
============================================================ */
async function generarInformeGeneral() {
    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const total = datos.length;
    const vc = datos.filter(f => f.tipo_firma === "VideoConferencia").length;
    const presencial = total - vc;

    const mapaApo = {};
    datos.forEach(f => {
        const apo = f.apoderado || "Sin apoderado";
        mapaApo[apo] = (mapaApo[apo] || 0) + 1;
    });
    const topApo = Object.entries(mapaApo)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,5);

    const mapaOfi = {};
    datos.forEach(f => {
        mapaOfi[f.centro] = (mapaOfi[f.centro] || 0) + 1;
    });

    const mapaCir = {};
    datos.forEach(f => {
        mapaCir[f.circuito] = (mapaCir[f.circuito] || 0) + 1;
    });

    let sumaCaixa = 0, cuentaCaixa = 0;
    let sumaOtra  = 0, cuentaOtra  = 0;

    datos.forEach(f => {
        const dias = Number(f.dias);
        if (dias <= 0) return;

        const esCaixa = (f.tipo_gestion || "").toLowerCase().includes("caixa");

        if (esCaixa) {
            sumaCaixa += dias;
            cuentaCaixa++;
        } else {
            sumaOtra += dias;
            cuentaOtra++;
        }
    });

    const slaCaixa = cuentaCaixa ? (sumaCaixa / cuentaCaixa).toFixed(1) : "0";
    const slaOtra  = cuentaOtra  ? (sumaOtra  / cuentaOtra ).toFixed(1) : "0";

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">📘 Informe General Premium — ${anioSel}</h2>

        <div class="card-glass mt-20">
            <p><strong>Total firmas:</strong> ${total}</p>
            <p><strong>Presencial:</strong> ${presencial}</p>
            <p><strong>VC:</strong> ${vc}</p>
        </div>

        <div class="card-glass mt-20"><canvas id="chartGeneralVC"></canvas></div>
        <div class="card-glass mt-20"><canvas id="chartGeneralApo"></canvas></div>
        <div class="card-glass mt-20"><canvas id="chartGeneralOfi"></canvas></div>
        <div class="card-glass mt-20"><canvas id="chartGeneralCir"></canvas></div>
        <div class="card-glass mt-20"><canvas id="chartGeneralSLA"></canvas></div>
    `;

    resetChart();

    new Chart(document.getElementById("chartGeneralVC"), {
        type: "pie",
        data: {
            labels: ["Presencial", "VC"],
            datasets: [{
                data: [presencial, vc],
                backgroundColor: ["#3B82F6", "#10B981"]
            }]
        }
    });

    new Chart(document.getElementById("chartGeneralApo"), {
        type: "bar",
        data: {
            labels: topApo.map(x => x[0]),
            datasets: [{
                label: "Firmas",
                data: topApo.map(x => x[1]),
                backgroundColor: "#0EA5E9"
            }]
        }
    });

    new Chart(document.getElementById("chartGeneralOfi"), {
        type: "bar",
        data: {
            labels: Object.keys(mapaOfi),
            datasets: [{
                label: "Firmas",
                data: Object.values(mapaOfi),
                backgroundColor: "#6366F1"
            }]
        }
    });

    new Chart(document.getElementById("chartGeneralCir"), {
        type: "doughnut",
        data: {
            labels: Object.keys(mapaCir),
            datasets: [{
                data: Object.values(mapaCir),
                backgroundColor: ["#0EA5E9", "#10B981", "#F59E0B"]
            }]
        }
    });

    new Chart(document.getElementById("chartGeneralSLA"), {
        type: "bar",
        data: {
            labels: ["CaixaBank", "Otra Entidad"],
            datasets: [{
                label: "SLA (días)",
                data: [slaCaixa, slaOtra],
                backgroundColor: ["#0EA5E9", "#10B981"]
            }]
        }
    });
}

/* ============================================================
   INFORME EVOLUTIVO — TABLA COMPLETA 2020–2026
============================================================ */
async function initInformeEvolutivo() {

    // Esperar a que el panel exista en el DOM
    const tabla = document.getElementById("evo-tabla");
    const resumen = document.getElementById("evo-resumen");
    const contenedorFinal = document.getElementById("evo-final");

    if (!tabla || !resumen || !contenedorFinal) {
        console.warn("⏳ initInformeEvolutivo() detenido: panel aún no está en el DOM.");
        return;
    }

    tabla.innerHTML = "";

    const datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const meses = MESES_ORDEN;

    /* ============================
       TABLA MENSUAL 2020–2026
    ============================= */
    meses.forEach(mes => {

        const fila = document.createElement("tr");

        const valores = [];
        const porcentajes = [];

        for (let anio = 2020; anio <= 2026; anio++) {
            const totalMes = datos.filter(d => d.anio == anio && d.mes == mes).length;
            valores.push(totalMes);
        }

        const total = valores.reduce((a,b) => a+b, 0);

        for (let i = 1; i < valores.length; i++) {
            const prev = valores[i-1];
            const act  = valores[i];
            const pct  = prev ? ((act - prev) / prev * 100) : 0;
            porcentajes.push(pct);
        }

        fila.innerHTML = `
            <td>${mes}</td>
            ${valores.map(v => `<td>${v.toLocaleString()}</td>`).join("")}
            <td>${total.toLocaleString()}</td>
            ${porcentajes.map(p => `<td>${p.toFixed(2)}%</td>`).join("")}
        `;

        tabla.appendChild(fila);
    });

    /* ============================
       TOTAL GENERAL
    ============================= */
    const filaTotal = document.createElement("tr");
    filaTotal.classList.add("fila-total");

    const totalesPorAnio = [];

    for (let anio = 2020; anio <= 2026; anio++) {
        const totalAnio = datos.filter(d => d.anio == anio).length;
        totalesPorAnio.push(totalAnio);
    }

    const totalGeneral = totalesPorAnio.reduce((a,b) => a+b, 0);

    const pctGeneral = [];
    for (let i = 1; i < totalesPorAnio.length; i++) {
        const prev = totalesPorAnio[i-1];
        const act  = totalesPorAnio[i];
        pctGeneral.push(prev ? ((act - prev) / prev * 100) : 0);
    }

    filaTotal.innerHTML = `
        <td><strong>Total general</strong></td>
        ${totalesPorAnio.map(t => `<td><strong>${t.toLocaleString()}</strong></td>`).join("")}
        <td><strong>${totalGeneral.toLocaleString()}</strong></td>
        ${pctGeneral.map(p => `<td><strong>${p.toFixed(2)}%</strong></td>`).join("")}
    `;

    tabla.appendChild(filaTotal);

    /* ============================================================
       FILA: HASTA MES ACTUAL
    ============================================================ */

    const hoy = new Date();
    const mesActualIdx = hoy.getMonth(); 
    const mesActualTexto = meses[mesActualIdx];

    const totalesHasta = [];

    for (let anio = 2020; anio <= 2026; anio++) {
        const totalHasta = datos.filter(f =>
            f.anio === anio &&
            meses.indexOf(f.mes) <= mesActualIdx
        ).length;

        totalesHasta.push(totalHasta);
    }

    const pctHasta = [];

    for (let i = 1; i < totalesHasta.length; i++) {
        const prev = totalesHasta[i-1];
        const act  = totalesHasta[i];
        const pct  = prev ? ((act - prev) / prev * 100) : 0;
        pctHasta.push(pct);
    }

    const filaHasta = document.createElement("tr");
    filaHasta.classList.add("fila-total");

    filaHasta.innerHTML = `
        <td><strong>Hasta ${mesActualTexto}</strong></td>
        ${totalesHasta.map(t => `<td><strong>${t.toLocaleString()}</strong></td>`).join("")}
        <td></td>
        ${pctHasta.map(p => `<td><strong>${p.toFixed(2)}%</strong></td>`).join("")}
    `;

    tabla.appendChild(filaHasta);

    /* ============================
       RESUMEN FINAL
    ============================= */
    const resumen = document.getElementById("evo-resumen");
    resumen.textContent = `
        Evolución total: ${pctHasta[pctHasta.length-1].toFixed(2)}%
    `;

    /* ============================================================
       BLOQUE FINAL PREMIUM — COMO EN TU IMAGEN
    ============================================================ */

    const contenedorFinal = document.getElementById("evo-final");

    if (contenedorFinal) {

        const filaAcum = totalesHasta.map(t => t.toLocaleString()).join(" | ");
        const filaPct = pctHasta.map(p => {
            const color = p >= 0 ? "#10B981" : "#EF4444";
            return `<span style="color:${color}; font-weight:600;">${p.toFixed(2)}%</span>`;
        }).join(" | ");

        contenedorFinal.innerHTML = `
            <div style="
                margin-top: 25px;
                padding: 18px;
                background: rgba(14,165,233,0.10);
                border-radius: 10px;
                border-left: 4px solid #0EA5E9;
                font-size: 15px;
                line-height: 1.6;
            ">
                <div style="font-weight:700; margin-bottom:6px;">
                    📌 Hasta ${mesActualTexto}
                </div>

                <div style="margin-bottom:12px;">
                    <strong>${filaAcum}</strong>
                </div>

                <div style="font-weight:700; margin-bottom:6px;">
                    📊 Evolución % volumen firmas
                </div>

                <div>
                    ${filaPct}
                </div>
            </div>
        `;
    }
}

/* ============================================================
   INFORME ANUAL
============================================================ */
async function generarInformeAnual() {
    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mesesReales = [...new Set(datos.map(f => f.mes))]
        .filter(m => m)
        .sort((a,b) => MESES_ORDEN.indexOf(a) - MESES_ORDEN.indexOf(b));

    const mapa = {};
    mesesReales.forEach(m => mapa[m] = 0);

    datos.forEach(f => {
        if (mapa.hasOwnProperty(f.mes)) mapa[f.mes]++;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">📅 Informe Anual — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartAnual"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartAnual");
    chartActual = new Chart(ctx, {
        type: "line",
        data: {
            labels: mesesReales,
            datasets: [{
                label: "Firmas",
                data: mesesReales.map(m => mapa[m]),
                borderColor: "#10b981",
                borderWidth: 3,
                fill: false,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* ============================================================
   INFORME MENSUAL
============================================================ */
async function generarInformeMensual() {
    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mesesReales = [...new Set(datos.map(f => f.mes))]
        .filter(m => m)
        .sort((a,b) => MESES_ORDEN.indexOf(a) - MESES_ORDEN.indexOf(b));

    const mapa = {};
    mesesReales.forEach(m => mapa[m] = 0);

    datos.forEach(f => {
        if (mapa.hasOwnProperty(f.mes)) mapa[f.mes]++;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🗓️ Informe Mensual — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartMensual"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartMensual");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: mesesReales,
            datasets: [{
                label: "Firmas",
                data: mesesReales.map(m => mapa[m]),
                backgroundColor: "#f59e0b"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* ============================================================
   INFORME POR APODERADO — PREMIUM CON PORCENTAJES
============================================================ */
async function generarInformeApoderados() {

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = 2026;
    const meses = MESES_ORDEN;

    const mesesConDatos = [...new Set(
        datos.filter(f => Number(f.anio) === anioSel).map(f => f.mes)
    )].sort((a,b) => meses.indexOf(a) - meses.indexOf(b));

    const mesesValidos = meses.slice(
        0,
        meses.indexOf(mesesConDatos[mesesConDatos.length - 1]) + 1
    );

    const mapa = {};

    datos.filter(f => Number(f.anio) === anioSel).forEach(f => {
        const apo = f.apoderado || "Sin apoderado";

        if (!mapa[apo]) {
            mapa[apo] = {
                total: 0,
                meses: Array(12).fill(0)
            };
        }

        mapa[apo].total++;
        const idx = meses.indexOf(f.mes);
        if (idx >= 0) mapa[apo].meses[idx]++;
    });

    const lista = Object.entries(mapa)
        .sort((a,b) => b[1].total - a[1].total);

    const totalesMes = mesesValidos.map(m => {
        return datos.filter(f => f.anio === anioSel && f.mes === m).length;
    });
    const totalGlobal = totalesMes.reduce((a,b)=>a+b,0);

    const cont = document.getElementById("informeContainer");
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
                        const valores = mesesValidos.map(m => {
                            const idx = meses.indexOf(m);
                            return d.meses[idx];
                        });
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
                            const color = pct < 0 ? "color:#EF4444;font-weight:600;" : "";
                            return `<td style="${color}">${pct.toFixed(2)}%</td>`;
                        });

                        const pctTotal = totalGlobal ? (d.total / totalGlobal * 100) : 0;
                        const colorTotal = pctTotal < 0 ? "color:#EF4444;font-weight:600;" : "";

                        return `
                            <tr>
                                <td><strong>${apo}</strong></td>
                                ${valores.join("")}
                                <td style="${colorTotal}"><strong>${pctTotal.toFixed(2)}%</strong></td>
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

/* ============================================================
   INFORME POR OFICINA
============================================================ */
async function generarInformeOficinas() {
    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        mapa[f.centro] = (mapa[f.centro] || 0) + 1;
    });

    const oficinas = Object.keys(mapa);
    const totales = Object.values(mapa);

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🏢 Informe por Oficina — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartOficinas"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartOficinas");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: oficinas,
            datasets: [{
                label: "Firmas",
                data: totales,
                backgroundColor: "#6366F1"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }},
            scales: { 
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* ============================================================
   INFORME POR CIRCUITO
============================================================ */
async function generarInformeCircuito() {
    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        mapa[f.circuito] = (mapa[f.circuito] || 0) + 1;
    });

    const circuitos = Object.keys(mapa);
    const totales = Object.values(mapa);

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🛣️ Informe por Circuito — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartCircuito"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartCircuito");
    chartActual = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: circuitos,
            datasets: [{
                data: totales,
                backgroundColor: ["#0EA5E9", "#10B981", "#F59E0B", "#6366F1"]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: "bottom" }}
        }
    });
}

/* ============================================================
   INFORME TIPO DE FIRMA
============================================================ */
async function generarInformeTipoFirma() {
    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mesesReales = [...new Set(datos.map(f => f.mes))]
        .filter(m => m)
        .sort((a,b) => MESES_ORDEN.indexOf(a) - MESES_ORDEN.indexOf(b));

    const mapa = {};
    mesesReales.forEach(m => mapa[m] = { presencial: 0, vc: 0 });

    datos.forEach(f => {
        if (!mapa[f.mes]) return;
        if (f.tipo_firma === "VideoConferencia") mapa[f.mes].vc++;
        else mapa[f.mes].presencial++;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">✍️ Tipo de Firma — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartTipoFirma"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartTipoFirma");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: mesesReales,
            datasets: [
                {
                    label: "Presencial",
                    data: mesesReales.map(m => mapa[m].presencial),
                    backgroundColor: "#3B82F6"
                },
                {
                    label: "VC",
                    data: mesesReales.map(m => mapa[m].vc),
                    backgroundColor: "#10B981"
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true }},
            scales: { 
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* ============================================================
   INFORME TIPO DE GESTIÓN
============================================================ */
async function generarInformeTipoGestion() {
    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        const gest = f.tipo_gestion || "Sin gestión";
        mapa[gest] = (mapa[gest] || 0) + 1;
    });

    const tipos = Object.keys(mapa);
    const totales = Object.values(mapa);

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">📂 Informe por Tipo de Gestión — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartTipoGestion"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartTipoGestion");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: tipos,
            datasets: [{
                label: "Firmas",
                data: totales,
                backgroundColor: "#0EA5E9"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* ============================================================
   INFORME TIEMPOS
============================================================ */
async function generarInformeTiempos() {
    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    let sumaCaixa = 0, cuentaCaixa = 0;
    let sumaOtra  = 0, cuentaOtra  = 0;

    datos.forEach(f => {
        const dias = Number(f.dias);
        if (dias <= 0) return;

        const ap = (f.apoderado || "").trim().toLowerCase();

        const esOtraEntidad = ap === "oficina otra entidad";
        const esCaixa = !esOtraEntidad;

        if (esCaixa) {
            sumaCaixa += dias;
            cuentaCaixa++;
        } else {
            sumaOtra += dias;
            cuentaOtra++;
        }
    });

    const slaCaixa = cuentaCaixa ? (sumaCaixa / cuentaCaixa).toFixed(1) : "0";
    const slaOtra  = cuentaOtra  ? (sumaOtra  / cuentaOtra ).toFixed(1) : "0";

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">⏱️ Informe Tiempos — ${anioSel}</h2>

        <div class="card-glass mt-20">
            <p><strong>SLA CaixaBank:</strong> ${slaCaixa} días</p>
            <p><strong>SLA Otra Entidad:</strong> ${slaOtra} días</p>
        </div>

        <div class="card-glass mt-20">
            <canvas id="chartTiempos"></canvas>
        </div>
    `;

    resetChart();

    const ctx = document.getElementById("chartTiempos");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["CaixaBank", "Otra Entidad"],
            datasets: [{
                label: "SLA (días)",
                data: [slaCaixa, slaOtra],
                backgroundColor: ["#0EA5E9", "#10B981"]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }},
            scales: {
                x: { ticks: { color: "#111" }},
                y: { ticks: { color: "#111" }}
            }
        }
    });
}

/* ============================================================
   INFORME CENTRO QUE FIRMA
============================================================ */
async function generarInformeCentroQueFirma() {
    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const COLABORADORES = [
        "gestcanarias",
        "gestoria mas",
        "yarza gestion",
        "julio cuesta",
        "castillo 11",
        "gesgalicia"
    ];

    let molsan = 0;
    let colaboradores = 0;
    let oficinaOE = 0;
    let oficinaCBK = 0;

    datos.forEach(f => {
        const ap = (f.apoderado || "").trim().toLowerCase();

        if (ap === "oficina caixabank") oficinaCBK++;
        else if (ap === "oficina otra entidad") oficinaOE++;
        else if (COLABORADORES.includes(ap)) colaboradores++;
        else molsan++;
    });

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">🏛️ Centro que Firma — ${anioSel}</h2>

        <div class="card-glass mt-20">
            <canvas id="chartCentroFirma"></canvas>
        </div>

        <table class="table-premium mt-20">
            <thead>
                <tr>
                    <th>Centro</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Molsan</td><td>${molsan}</td></tr>
                <tr><td>Colaboradores</td><td>${colaboradores}</td></tr>
                <tr><td>Oficina OE</td><td>${oficinaOE}</td></tr>
                <tr><td>Oficina CBK</td><td>${oficinaCBK}</td></tr>
            </tbody>
        </table>
    `;

    resetChart();

    const ctx = document.getElementById("chartCentroFirma");
    chartActual = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Molsan", "Colaboradores", "Oficina OE", "Oficina CBK"],
            datasets: [{
                data: [molsan, colaboradores, oficinaOE, oficinaCBK],
                backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#6366F1"]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: "bottom" }}
        }
    });
}

/* ============================================================
   COMPATIBILIDAD — generarMapasPremium (stub)
============================================================ */
async function generarMapasPremium(datos) {
    return true;
}
