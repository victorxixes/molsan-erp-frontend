/* ============================================================
   PANEL TIPO GESTIÓN — PREMIUM 2027 (COMPATIBLE CON TU HTML)
============================================================ */

let PTG_DATOS = [];
let PTG_POR_ANIO = {};

async function initPanelTipoGestion() {
    console.log("📄 initPanelTipoGestion() ejecutado");

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PTG_DATOS = datos;

    PTG_POR_ANIO = ptg_groupByAnioTipoGestion(PTG_DATOS);

    ptg_fillSelectAnios();
    ptg_selectUltimoAnio();

    // Listener del selector de año
    document.getElementById("ptg-select-anio")
        .addEventListener("change", ptg_onChangeAnio);
}

/* Agrupar por año y tipo gestión */
function ptg_groupByAnioTipoGestion(datos) {
    const map = {};

    for (const f of datos) {
        const anio = Number(f.anio);
        const tipo = f.tipo_gestion || "Sin tipo";
        const dias = Number(f.dias);
        const conPro = (f.tipo_provision || "").toLowerCase().includes("con");

        if (!anio) continue;

        if (!map[anio]) map[anio] = {};

        if (!map[anio][tipo]) {
            map[anio][tipo] = {
                total: 0,
                con: 0,
                sin: 0,
                sumaDiasCon: 0,
                cuentaDiasCon: 0,
                sumaDiasSin: 0,
                cuentaDiasSin: 0
            };
        }

        const r = map[anio][tipo];

        r.total++;

        if (conPro) {
            r.con++;
            if (dias > 0) {
                r.sumaDiasCon += dias;
                r.cuentaDiasCon++;
            }
        } else {
            r.sin++;
            if (dias > 0) {
                r.sumaDiasSin += dias;
                r.cuentaDiasSin++;
            }
        }
    }

    return map;
}

/* Select años */
function ptg_fillSelectAnios() {
    const sel = document.getElementById("ptg-select-anio");
    sel.innerHTML = "";

    const anios = Object.keys(PTG_POR_ANIO).map(Number).sort((a,b)=>a-b);

    for (const anio of anios) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        sel.appendChild(opt);
    }
}

function ptg_selectUltimoAnio() {
    const sel = document.getElementById("ptg-select-anio");
    sel.value = sel.options[sel.options.length - 1].value;
    ptg_onChangeAnio();
}

/* Cambio de año */
function ptg_onChangeAnio() {
    const sel = document.getElementById("ptg-select-anio");
    const anio = Number(sel.value);

    const info = PTG_POR_ANIO[anio];
    if (!info) return;

    ptg_renderKpis(info);
    ptg_renderTabla(info);
}

/* KPIs */
function ptg_renderKpis(info) {
    let total = 0, con = 0, sin = 0;
    let sumaDiasCon = 0, cuentaDiasCon = 0;
    let sumaDiasSin = 0, cuentaDiasSin = 0;

    for (const tipo in info) {
        const r = info[tipo];
        total += r.total;
        con += r.con;
        sin += r.sin;
        sumaDiasCon += r.sumaDiasCon;
        cuentaDiasCon += r.cuentaDiasCon;
        sumaDiasSin += r.sumaDiasSin;
        cuentaDiasSin += r.cuentaDiasSin;
    }

    const pctCon = total ? ((con / total) * 100).toFixed(1) + "%" : "0%";
    const pctSin = total ? ((sin / total) * 100).toFixed(1) + "%" : "0%";

    const slaCon = cuentaDiasCon ? (sumaDiasCon / cuentaDiasCon).toFixed(1) : "0";
    const slaSin = cuentaDiasSin ? (sumaDiasSin / cuentaDiasSin).toFixed(1) : "0";

    document.getElementById("ptg-kpi-total").textContent = total;
    document.getElementById("ptg-kpi-con").textContent = pctCon;
    document.getElementById("ptg-kpi-sin").textContent = pctSin;
    document.getElementById("ptg-kpi-sla-con").textContent = slaCon;
    document.getElementById("ptg-kpi-sla-sin").textContent = slaSin;
}

/* Tabla por tipo de gestión */
function ptg_renderTabla(info) {
    const tbody = document.querySelector("#ptg-tabla-gestion tbody");
    tbody.innerHTML = "";

    for (const tipo in info) {
        const r = info[tipo];

        const pctCon = r.total ? ((r.con / r.total) * 100).toFixed(1) + "%" : "0%";
        const pctSin = r.total ? ((r.sin / r.total) * 100).toFixed(1) + "%" : "0%";

        const slaCon = r.cuentaDiasCon ? (r.sumaDiasCon / r.cuentaDiasCon).toFixed(1) : "0";
        const slaSin = r.cuentaDiasSin ? (r.sumaDiasSin / r.cuentaDiasSin).toFixed(1) : "0";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${tipo}</td>
            <td>${r.total}</td>
            <td>${r.con}</td>
            <td>${r.sin}</td>
            <td>${pctCon}</td>
            <td>${pctSin}</td>
            <td>${slaCon}</td>
            <td>${slaSin}</td>
        `;
        tbody.appendChild(tr);
    }
}
