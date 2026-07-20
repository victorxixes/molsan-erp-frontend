/* ============================================================
   INFORME GENERAL PREMIUM
============================================================ */
async function generarInformeGeneral() {

    const cont = document.getElementById("informeContainer");
    if (!cont) return;

    let datos = await obtenerFirmas();
    datos.forEach(aplicarReglas);

    const anioSel = inf_getAnioSeleccionado();
    datos = datos.filter(f => f.anio == anioSel);

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
    datos.forEach(f => mapaOfi[f.centro] = (mapaOfi[f.centro] || 0) + 1);

    const mapaCir = {};
    datos.forEach(f => mapaCir[f.circuito] = (mapaCir[f.circuito] || 0) + 1);

    let sumaCaixa = 0, cuentaCaixa = 0;
    let sumaOtra  = 0, cuentaOtra  = 0;

    datos.forEach(f => {
        const dias = Number(f.dias);
        if (dias <= 0) return;

        const esCaixa = (f.tipo_gestion || "").toLowerCase().includes("caixa");

        if (esCaixa) { sumaCaixa += dias; cuentaCaixa++; }
        else { sumaOtra += dias; cuentaOtra++; }
    });

    const slaCaixa = cuentaCaixa ? (sumaCaixa / cuentaCaixa).toFixed(1) : "0";
    const slaOtra  = cuentaOtra  ? (sumaOtra  / cuentaOtra ).toFixed(1) : "0";

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

    charts.push(new Chart(document.getElementById("chartGeneralVC"), {
        type: "pie",
        data: {
            labels: ["Presencial", "VC"],
            datasets: [{ data: [presencial, vc], backgroundColor: ["#3B82F6", "#10B981"] }]
        }
    }));

    charts.push(new Chart(document.getElementById("chartGeneralApo"), {
        type: "bar",
        data: {
            labels: topApo.map(x => x[0]),
            datasets: [{ label: "Firmas", data: topApo.map(x => x[1]), backgroundColor: "#0EA5E9" }]
        }
    }));

    charts.push(new Chart(document.getElementById("chartGeneralOfi"), {
        type: "bar",
        data: {
            labels: Object.keys(mapaOfi),
            datasets: [{ label: "Firmas", data: Object.values(mapaOfi), backgroundColor: "#6366F1" }]
        }
    }));

    charts.push(new Chart(document.getElementById("chartGeneralCir"), {
        type: "doughnut",
        data: {
            labels: Object.keys(mapaCir),
            datasets: [{ data: Object.values(mapaCir), backgroundColor: ["#0EA5E9","#10B981","#F59E0B"] }]
        }
    }));

    charts.push(new Chart(document.getElementById("chartGeneralSLA"), {
        type: "bar",
        data: {
            labels: ["CaixaBank", "Otra Entidad"],
            datasets: [{ label: "SLA (días)", data: [slaCaixa, slaOtra], backgroundColor: ["#0EA5E9","#10B981"] }]
        }
    }));
}
