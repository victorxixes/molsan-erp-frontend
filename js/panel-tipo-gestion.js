/* ============================================================
   PANEL TIPO GESTIÓN — PREMIUM 2027 (VERSIÓN FINAL)
============================================================ */

let PTG_DATOS = [];
let PTG_POR_ANIO = {};

/* ============================================================
   INIT
============================================================ */
async function initPanelTipoGestion() {
    console.log("📄 initPanelTipoGestion() ejecutado");

    if (!document.getElementById("ptg-select-anio")) {
        console.warn("⏳ Panel Tipo Gestión aún no está en el DOM.");
        return;
    }

    const datos = await obtenerFirmas();
    if (!datos || !datos.length) return;

    PTG_DATOS = datos;
    PTG_POR_ANIO = ptg_groupByAnio(PTG_DATOS);

    ptg_fillSelectAnios();
    ptg_selectUltimoAnio();

    document.getElementById("ptg-select-anio")
        .addEventListener("change", ptg_onChangeAnio);
}

/* ============================================================
   AGRUPAR POR AÑO → TIPO GESTIÓN → MES
============================================================ */
function ptg_groupByAnio(datos) {
    const map = {};

    const mesesValidos = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        const mes = (f.mes || "").toLowerCase().trim();
        const idxMes = mesesValidos.indexOf(mes);
        if (idxMes === -1) continue;

        if (anio === currentYear && idxMes > currentMonthIndex) continue;

        const tipo = f.tipo_gestion || "Con provisión";
        const dias = Number(f.dias);

        if (!map[anio]) map[anio] = {};

        if (!map[anio][tipo]) {
            map[anio][tipo] = {
                total: 0,
                con: 0,
                sin: 0,
                slaCon: { suma: 0, cuenta: 0 },
                slaSin: { suma: 0, cuenta: 0 },
                meses: {}
            };
        }

        const r = map[anio][tipo];

        if (!r.meses[mes]) {
            r.meses[mes] = { total: 0 };
        }

        r.total++;
        r.meses[mes].total++;

        if (tipo === "Con provisión") {
            r.con++;
            if (dias > 0) {
                r.slaCon.suma += dias;
                r.slaCon.cuenta++;
            }
        } else {
            r.sin++;
            if (dias > 0) {
                r.slaSin.suma += dias;
                r.slaSin.cuenta++;
            }
        }
    }

    return map;
}

/* ============================================================
   SELECT AÑOS
============================================================ */
function ptg_fillSelectAnios() {
    const sel = document.getElementById("ptg-select-anio");
    if (!sel) return;

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
    if (!sel || sel.options.length === 0) return;

    sel.value = sel.options[sel.options.length - 1].value;
    ptg_onChangeAnio();
}

/* ============================================================
   CAMBIO DE AÑO
============================================================ */
function ptg_onChangeAnio() {
    const sel = document.getElementById("ptg-select-anio");
    if (!sel) return;

    const anio = Number(sel.value);
    const info = PTG_POR_ANIO[anio];
    if (!info) return;

    ptg_renderKpis(info);
    ptg_renderTabla(info);
}

/* ============================================================
   KPIs
============================================================ */
function ptg_renderKpis(info) {
    let total = 0;
    let con = 0;
    let sin = 0;

    let slaCon = 0;
    let slaSin = 0;

    for (const tipo in info) {
        const r = info[tipo];

        total += r.total;
        con += r.con;
        sin += r.sin;

        if (r.slaCon.cuenta > 0) {
            slaCon += r.slaCon.suma / r.slaCon.cuenta;
        }
        if (r.slaSin.cuenta > 0) {
            slaSin += r.slaSin.suma / r.slaSin.cuenta;
        }
    }

    const pctCon = total ? ((con / total) * 100).toFixed(1) + "%" : "0%";
    const pctSin = total ? ((sin / total) * 100).toFixed(1) + "%" : "0%";

    document.getElementById("ptg-kpi-total").textContent = total;
    document.getElementById("ptg-kpi-con").textContent = pctCon;
    document.getElementById("ptg-kpi-sin").textContent = pctSin;
    document.getElementById("ptg-kpi-sla-con").textContent = slaCon.toFixed(1);
    document.getElementById("ptg-kpi-sla-sin").textContent = slaSin.toFixed(1);
}

/* ============================================================
   TABLA DETALLE (CON MESES)
============================================================ */
function ptg_renderTabla(info) {
    const tbody = document.querySelector("#ptg-tabla-gestion tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const mesesOrden = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const lista = Object.entries(info).map(([tipo, r]) => {

        const pctCon = r.total ? ((r.con / r.total) * 100).toFixed(1) + "%" : "0%";
        const pctSin = r.total ? ((r.sin / r.total) * 100).toFixed(1) + "%" : "0%";

        const slaCon = r.slaCon.cuenta ? (r.slaCon.suma / r.slaCon.cuenta).toFixed(1) : "0";
        const slaSin = r.slaSin.cuenta ? (r.slaSin.suma / r.slaSin.cuenta).toFixed(1) : "0";

        const meses = mesesOrden.map(m => {
            const mm = r.meses[m];
            return mm ? mm.total : 0;
        });

        return {
            tipo,
            total: r.total,
            con: r.con,
            sin: r.sin,
            pctCon,
            pctSin,
            slaCon,
            slaSin,
            meses
        };
    });

    lista.sort((a,b)=>b.total - a.total);

    for (const row of lista) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.tipo}</td>
            <td>${row.total}</td>
            <td>${row.con}</td>
            <td>${row.sin}</td>
            <td>${row.pctCon}</td>
            <td>${row.pctSin}</td>
            <td>${row.slaCon}</td>
            <td>${row.slaSin}</td>
            ${row.meses.map(v => `<td>${v}</td>`).join("")}
        `;

        tbody.appendChild(tr);
    }
}
