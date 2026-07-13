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
    const sel = document.getElementById("inf-select-anio");
    if (!sel) return new Date().getFullYear();
    return Number(sel.value);
}

async function initInformesPremium() {
    const sel = document.getElementById("inf-select-anio");
    if (!sel) return;

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    const anios = [...new Set(datos.map(f => Number(f.anio)).filter(a => a > 0))]
        .sort((a,b)=>a-b);

    sel.innerHTML = "";
    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }

    const currentYear = new Date().getFullYear();
    sel.value = anios.includes(currentYear) ? currentYear : anios[anios.length - 1];

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
============================================================ */
function aplicarNormalizacionPremium(datos) {

    for (const f of datos) {

        // MES: convertir número → texto
        if (Number(f.mes) >= 1 && Number(f.mes) <= 12) {
            f.mes = mesNumeroATexto(Number(f.mes));
        } else {
            f.mes = (f.mes || "").toLowerCase().trim();
        }

        // Validar mes
        if (!MESES_ORDEN.includes(f.mes)) f.mes = "";

        // Normalizaciones
        f.tipo_gestion = normalizarTipoGestion(f.tipo_gestion);
        f.circuito     = getCircuito(f.notario);
        f.tipo_firma   = getTipoFirma(f.vc);
        f.centro       = String(f.oficina) === "5316" ? "Cancela" : "Oficina";
    }

    return datos;
}

/* ============================================================
   INFORME GENERAL
============================================================ */
async function generarInformeGeneral() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const total = datos.length;
    const vc = datos.filter(f => f.tipo_firma === "VideoConferencia").length;
    const presencial = total - vc;

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">📘 Informe General — ${anioSel}</h2>
        <div class="card-glass mt-20">
            <p><strong>Total firmas:</strong> ${total}</p>
            <p><strong>Presencial:</strong> ${presencial}</p>
            <p><strong>VC:</strong> ${vc}</p>
        </div>
    `;
}

/* ============================================================
   INFORME ANUAL — SOLO MESES REALES
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
   INFORME MENSUAL — SOLO MESES REALES
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
   INFORME APODERADOS
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

    const ranking = Object.entries(mapa)
        .sort((a,b)=>b[1]-a[1])
        .map(([apo,total]) => `<tr><td>${apo}</td><td>${total}</td></tr>`)
        .join("");

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">🧑‍💼 Informe Apoderados — ${anioSel}</h2>
        <table class="table-premium mt-20">
            <thead><tr><th>Apoderado</th><th>Total</th></tr></thead>
            <tbody>${ranking}</tbody>
        </table>
    `;
}

/* ============================================================
   INFORME OFICINAS
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

    const filas = Object.entries(mapa)
        .map(([centro,total]) => `<tr><td>${centro}</td><td>${total}</td></tr>`)
        .join("");

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">🏢 Informe Oficinas — ${anioSel}</h2>
        <table class="table-premium mt-20">
            <thead><tr><th>Centro</th><th>Total</th></tr></thead>
            <tbody>${filas}</tbody>
        </table>
    `;
}

/* ============================================================
   INFORME CIRCUITO
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

    const filas = Object.entries(mapa)
        .map(([cir,total]) => `<tr><td>${cir}</td><td>${total}</td></tr>`)
        .join("");

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">🛣️ Informe Circuito — ${anioSel}</h2>
        <table class="table-premium mt-20">
            <thead><tr><th>Circuito</th><th>Total</th></tr></thead>
            <tbody>${filas}</tbody>
        </table>
    `;
}

/* ============================================================
   INFORME TIPO FIRMA
============================================================ */
async function generarInformeTipoFirma() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    const total = datos.length;
    const vc = datos.filter(f => f.tipo_firma === "VideoConferencia").length;
    const presencial = total - vc;

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">✍️ Informe Tipo Firma — ${anioSel}</h2>
        <div class="card-glass mt-20">
            <p><strong>Presencial:</strong> ${presencial}</p>
            <p><strong>VC:</strong> ${vc}</p>
        </div>
    `;
}

/* ============================================================
   INFORME TIEMPOS
============================================================ */
async function generarInformeTiempos() {
    let datos = await obtenerFirmas();
    datos = aplicarNormalizacionPremium(datos);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => Number(f.anio) === anioSel);

    let suma = 0;
    let cuenta = 0;

    datos.forEach(f => {
        const d = Number(f.dias);
        if (d > 0) {
            suma += d;
            cuenta++;
        }
    });

    const sla = cuenta ? (suma / cuenta).toFixed(1) : "0";

    const cont = document.getElementById("informeContainer");
    cont.style.display = "block";

    cont.innerHTML = `
        <h2 class="titulo-modulo">⏱️ Informe Tiempos — ${anioSel}</h2>
        <div class="card-glass mt-20">
            <p><strong>SLA medio:</strong> ${sla} días</p>
        </div>
    `;
}
