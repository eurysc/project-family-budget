
(() => {
  const $ = id => document.getElementById(id);
  const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
  const KEY = "h55x_budget_s16_workspace";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const save = v => localStorage.setItem(KEY, JSON.stringify(v));
  const tx = () => window.TransactionService?.all?.() || [];

  function metrics() {
    const now = Date.now();
    const rows = tx();
    const in30 = rows.filter(t => ["income","Ingreso"].includes(t.type) && now - new Date(t.createdAt || now).getTime() <= 30*864e5)
      .reduce((s,t)=>s+Number(t.amount||0),0);
    const out30 = rows.filter(t => ["expense","Gasto"].includes(t.type) && now - new Date(t.createdAt || now).getTime() <= 30*864e5)
      .reduce((s,t)=>s+Number(t.amount||0),0);
    const out7 = rows.filter(t => ["expense","Gasto"].includes(t.type) && now - new Date(t.createdAt || now).getTime() <= 7*864e5)
      .reduce((s,t)=>s+Number(t.amount||0),0);
    const save30 = rows.filter(t => ["saving","Ahorro"].includes(t.type) && now - new Date(t.createdAt || now).getTime() <= 30*864e5)
      .reduce((s,t)=>s+Number(t.amount||0),0);
    const daily = out7 / 7;
    return {in30,out30,net30:in30-out30,out7,save30,daily,runway:daily?Math.round(3450000/daily):0,movements:rows.length};
  }

  function set(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function render() {
    const m = metrics();
    const st = read();
    set("s16BudgetNet", `COP ${Math.round(m.net30).toLocaleString("es-CO")}`);
    set("s16BudgetSpend", `COP ${Math.round(m.daily).toLocaleString("es-CO")}/día`);
    set("s16BudgetRunway", `${m.runway} días`);
    set("s16BudgetSavings", `${m.in30 ? Math.round(m.save30/m.in30*100) : 0}%`);
    set("s16BudgetMovements", String(m.movements));
    set("s16BudgetState", m.net30 >= 0 ? "ESTABLE" : "REVISAR");

    const checks = st.checks || [
      {id:"cash", label:"Revisar flujo neto", done:false},
      {id:"budget", label:"Revisar presión presupuestal", done:false},
      {id:"saving", label:"Confirmar ahorro protegido", done:false},
      {id:"payment", label:"Confirmar próximo pago", done:false}
    ];
    const list = $("s16BudgetChecklist");
    if (list) {
      list.innerHTML = checks.map(c =>
        `<label class="s16-check ${c.done?"done":""}"><input type="checkbox" data-s16-check="${c.id}" ${c.done?"checked":""}><span>${c.label}</span></label>`
      ).join("");
      qsa("[data-s16-check]", list).forEach(input => {
        input.addEventListener("change", () => {
          const current = read();
          current.checks = checks.map(c => c.id === input.dataset.s16Check ? {...c,done:input.checked} : c);
          save(current);
          render();
        });
      });
    }

    const snapshot = $("s16BudgetSnapshot");
    if (snapshot) {
      snapshot.innerHTML = [
        ["Liquidez", m.net30 >= 0 ? "Operativa" : "Revisar"],
        ["Flujo 30d", m.net30 >= 0 ? "Positivo" : "Negativo"],
        ["Reserva", m.runway >= 15 ? "Protegida" : "Vigilar"],
        ["Ahorro", m.save30 > 0 ? "Activo" : "Reforzar"]
      ].map(([a,b]) => `<div class="s16-mini"><span>${a}</span><strong>${b}</strong></div>`).join("");
    }
  }

  function route(view) {
    const map = {workspace:"s15-workspace", forecast:"forecast", operations:"operations"};
    const actual = map[view] || view;
    const target = document.getElementById(`view-${actual}`);
    if (!target) return false;
    qsa(".view").forEach(v => v.classList.toggle("active", v === target));
    qsa(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    qsa(".rail-chip").forEach(b => b.classList.toggle("active", b.dataset.action === view));
    localStorage.setItem("h55x_budget_view", actual);
    if (actual === "s15-workspace") render();
    window.scrollTo({top:0,behavior:"smooth"});
    return true;
  }

  function repairEncoding() {
    const fixes = {
      "OperaciÃ³n":"Operación","ConfiguraciÃ³n":"Configuración","NavegaciÃ³n":"Navegación",
      "CategorÃ­a":"Categoría","EjecuciÃ³n":"Ejecución","seÃ±ales":"señales",
      "revisiÃ³n":"revisión","PrÃ³ximo":"Próximo","proyecciÃ³n":"proyección",
      "PlanificaciÃ³n":"Planificación","â€¢":"•","â€“":"–","âˆ’":"−"
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      let v = n.nodeValue;
      Object.entries(fixes).forEach(([bad,good]) => { v = v.split(bad).join(good); });
      n.nodeValue = v;
    }
  }

  function boot() {
    const nav = document.querySelector(".menu");
    if (nav && !nav.querySelector('[data-view="workspace"]')) {
      nav.insertAdjacentHTML("beforeend", '<button type="button" class="nav-item" data-view="workspace">Workspace</button>');
    }

    document.addEventListener("click", e => {
      const btn = e.target.closest?.(".nav-item");
      if (!btn || !btn.dataset.view) return;
      if (route(btn.dataset.view)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    const workspace = document.getElementById("view-s15-workspace");
    if (workspace && !document.getElementById("s16-budget-stability")) {
      workspace.insertAdjacentHTML("beforeend", `
        <section id="s16-budget-stability" class="panel s16-panel">
          <div class="panel-head"><div><span class="eyebrow">S16 • Stability</span><h3>Daily Finance Control</h3></div><span id="s16BudgetState" class="pill">ESTABLE</span></div>
          <div class="s16-metrics">
            <article><span>Flujo 30d</span><strong id="s16BudgetNet">COP 0</strong></article>
            <article><span>Gasto diario</span><strong id="s16BudgetSpend">COP 0/día</strong></article>
            <article><span>Reserva</span><strong id="s16BudgetRunway">0 días</strong></article>
            <article><span>Ahorro</span><strong id="s16BudgetSavings">0%</strong></article>
            <article><span>Movimientos</span><strong id="s16BudgetMovements">0</strong></article>
          </div>
          <div class="s16-two">
            <div><span class="eyebrow">CHECK-IN</span><h4>Control de hoy</h4><div id="s16BudgetChecklist"></div></div>
            <div><span class="eyebrow">SNAPSHOT</span><h4>Lectura rápida</h4><div id="s16BudgetSnapshot" class="s16-snapshot"></div></div>
          </div>
        </section>
      `);
    }

    repairEncoding();
    const saved = localStorage.getItem("h55x_budget_view");
    if (saved) route(saved === "s15-workspace" ? "workspace" : saved);
    render();
    window.BudgetS16 = {metrics,route,render};
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
