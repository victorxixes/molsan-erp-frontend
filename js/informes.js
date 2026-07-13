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
   (FORZAMOS 2026 COMO AÑO ÚNICO DE TRABAJO)
============================================================ */
function inf_getAnioSeleccionado() {
    // Siempre trabajamos con 2026
    return 2026;
}

async function initInformesPremium() {
    const sel = document.getElementById("inf-select-anio");
    if (!sel) return;

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    // Solo mostramos 2026 si existe en los datos
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

    // Si 2026 existe en los datos, lo añadimos; si no, añadimos el último año disponible
    const targetYear = anios.includes(2026) ? 2026 : (anios[anios.length - 1] || new Date().getFullYear());

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
   NORMALIZACIÓN GLASS LUXE 2027 — FINAL
   (USANDO fecha_protocolo PARA AÑO Y MES)
============================================================ */
function aplicarNormalizacionPremium(datos) {

    for (const f of datos) {

        // EXTRAER AÑO Y MES DESDE fecha_protocolo (formato dd-mm-aaaa)
        if (f.fecha_protocolo && f.fecha_protocolo.includes("-")) {
            const partes = f.fecha_protocolo.split("-");
            const mesNum = Number(partes[1]);
            const anio = Number(partes[2]);

            f.anio = anio;
            if (mesNum >= 1 && mesNum <= 12) {
                f.mes = mesNumeroATexto(mesNum);
            }
        }

        // Si no se ha podido extraer, dejamos mes/anio como están o vacíos
        if (!f.mes) {
            f.mes = "";
        }
        if (!f.anio) {
            f.anio = 0;
        }

        // Validar mes
        if (!MESES_ORDEN.includes(f.mes)) f.mes = "";

        // Normalizaciones adicionales (si ya las tienes definidas en otro JS)
        f.tipo_gestion = normalizarTipoGestion(f.tipo_gestion);
        f.circuito     = getCircuito(f.notario);
        f.tipo_firma   = getTipoFirma(f.vc);
        f.centro       = String(f.oficina) === "5316" ? "Cancela" : "Oficina";
    }

    return datos;
}

/* ============================================================
   INFORME GENERAL PREMIUM — KPIs + GRÁFICOS
============================================================ */
async function generarInformeGeneral() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    // KPI 1: Totales
    const total = datos.length;
    const vc = datos.filter(f => f.tipo_firma === "VideoConferencia").length;
    const presencial = total - vc;

    // KPI 2: Top Apoderados
    const mapaApo = {};
    datos.forEach(f => {
        const apo = f.apoderado || "Sin apoderado";
        mapaApo[apo] = (mapaApo[apo] || 0) + 1;
    });
    const topApo = Object.entries(mapaApo)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,5);

    // KPI 3: Oficinas
    const mapaOfi = {};
    datos.forEach(f => {
        mapaOfi[f.centro] = (mapaOfi[f.centro] || 0) + 1;
    });

    // KPI 4: Circuito
    const mapaCir = {};
    datos.forEach(f => {
        mapaCir[f.circuito] = (mapaCir[f.circuito] || 0) + 1;
    });

    // KPI 5: SLA CaixaBank vs Otra Entidad
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

    // Render
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

    // Gráfico 1: VC vs Presencial
    const ctx1 = document.getElementById("chartGeneralVC");
    new Chart(ctx1, {
        type: "pie",
        data: {
            labels: ["Presencial", "VC"],
            datasets: [{
                data: [presencial, vc],
                backgroundColor: ["#3B82F6", "#10B981"]
            }]
        }
    });

    // Gráfico 2: Top Apoderados
    const ctx2 = document.getElementById("chartGeneralApo");
    new Chart(ctx2, {
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

    // Gráfico 3: Oficinas
    const ctx3 = document.getElementById("chartGeneralOfi");
    new Chart(ctx3, {
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

    // Gráfico 4: Circuito
    const ctx4 = document.getElementById("chartGeneralCir");
    new Chart(ctx4, {
        type: "doughnut",
        data: {
            labels: Object.keys(mapaCir),
            datasets: [{
                data: Object.values(mapaCir),
                backgroundColor: ["#0EA5E9", "#10B981", "#F59E0B"]
            }]
        }
    });

    // Gráfico 5: SLA CaixaBank vs Otra Entidad
    const ctx5 = document.getElementById("chartGeneralSLA");
    new Chart(ctx5, {
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
   INFORME ANUAL — SOLO MESES REALES DE 2026
============================================================ */
async function generarInformeAnual() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

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
   INFORME MENSUAL — SOLO MESES REALES DE 2026
============================================================ */
async function generarInformeMensual() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

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
   INFORME POR APODERADO — GRÁFICO
============================================================ */
async function generarInformeApoderados() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const mapa = {};
    datos.forEach(f => {
        const apo = f.apoderado || "Sin apoderado";
        mapa[apo] = (mapa[apo] || 0) + 1;
    });

    const apoderados = Object.keys(mapa);
    const totales = Object.values(mapa);

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";
    cont.innerHTML = `
        <h2 class="titulo-modulo">🧑‍💼 Informe por Apoderado — ${anioSel}</h2>
        <div class="card-glass mt-20"><canvas id="chartApoderados"></canvas></div>
    `;

    resetChart();

    const ctx = document.getElementById("chartApoderados");
    chartActual = new Chart(ctx, {
        type: "bar",
        data: {
            labels: apoderados,
            datasets: [{
                label: "Firmas",
                data: totales,
                backgroundColor: "#0EA5E9"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }},
            scales: { x: { ticks: { color: "#111" }}, y: { ticks: { color: "#111" }} }
        }
    });
}
/* ============================================================
   INFORME POR OFICINA — GRÁFICO
============================================================ */
async function generarInformeOficinas() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

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
            scales: { x: { ticks: { color: "#111" }}, y: { ticks: { color: "#111" }} }
        }
    });
}
/* ============================================================
   INFORME POR CIRCUITO — GRÁFICO
============================================================ */
async function generarInformeCircuito() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

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
   INFORME TIPO DE FIRMA — GRÁFICO MENSUAL
============================================================ */
async function generarInformeTipoFirma() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

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
            scales: { x: { ticks: { color: "#111" }}, y: { ticks: { color: "#111" }} }
        }
    });
}
/* ============================================================
   INFORME TIEMPOS — SLA CaixaBank vs Otra Entidad (Gráfico)
============================================================ */
async function generarInformeTiempos() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    // Estructuras SLA
    let sumaCaixa = 0, cuentaCaixa = 0;
    let sumaOtra  = 0, cuentaOtra  = 0;

    datos.forEach(f => {
        const dias = Number(f.dias);
        if (dias <= 0) return;

        const ap = (f.apoderado || "").trim().toLowerCase();

        // CLASIFICACIÓN REAL
        const esOtraEntidad = ap === "oficina otra entidad";
        const esCaixa = !esOtraEntidad; // TODO lo demás es CaixaBank

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
   INFORME CENTRO QUE FIRMA — Molsan / Colaboradores / OE / CBK
============================================================ */
async function generarInformeCentroQueFirma() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    // Listas de clasificación
    const COLABORADORES = [
        "gestcanarias",
        "gestoria mas",
        "yarza gestion",
        "julio cuesta",
        "castillo 11",
        "gesgalicia"
    ];

    // Contadores
    let molsan = 0;
    let colaboradores = 0;
    let oficinaOE = 0;
    let oficinaCBK = 0;

    datos.forEach(f => {
        const ap = (f.apoderado || "").trim().toLowerCase();

        if (ap === "oficina caixabank") {
            oficinaCBK++;
        }
        else if (ap === "oficina otra entidad") {
            oficinaOE++;
        }
        else if (COLABORADORES.includes(ap)) {
            colaboradores++;
        }
        else {
            molsan++;
        }
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
