(() => {
  const $ = id => document.getElementById(id);
  const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
  const KEY = "h55x_budget_s17_daily";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)||"{}"); } catch { return {}; } };
  const save = v => localStorage.setItem(KEY, JSON.stringify(v));
  const tx = () => window.TransactionService?.all?.() || [];
  const money = v => `COP ${Math.round(Number(v||0)).toLocaleString("es-CO")}`;

  function metrics() {
    const now = Date.now();
    const rows = tx();
    const expense = rows.filter(t => ["expense","Gasto"].includes(t.type));
    const income = rows.filter(t => ["income","Ingreso"].includes(t.type));
    const saving = rows.filter(t => ["saving","Ahorro"].includes(t.type));
    const within = (t, days) => now - new Date(t.createdAt || now).getTime() <= days*864e5;
    const e7 = expense.filter(t => within(t,7)).reduce((s,t)=>s+Number(t.amount||0),0);
    const e30 = expense.filter(t => within(t,30)).reduce((s,t)=>s+Number(t.amount||0),0);
    const i30 = income.filter(t => within(t,30)).reduce((s,t)=>s+Number(t.amount||0),0);
    const s30 = saving.filter(t => within(t,30)).reduce((s,t)=>s+Number(t.amount||0),0);
    const byCat = {};
    expense.filter(t => within(t,30)).forEach(t => {
      const k=t.category||"Otros";
      byCat[k]=(byCat[k]||0)+Number(t.amount||0);
    });
    const cats = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return {net:i30-e30, avg7:e7/7, rate:i30?s30/i30:0, cats, movements:rows.length};
  }

  function render() {
    const m=metrics(), st=read();
    if ($("s17Net")) $("s17Net").textContent=money(m.net);
    if ($("s17Avg")) $("s17Avg").textContent=`${money(m.avg7)}/día`;
    if ($("s17Save")) $("s17Save").textContent=`${Math.round(m.rate*100)}%`;
    if ($("s17Moves")) $("s17Moves").textContent=String(m.movements);
    if ($("s17Top")) $("s17Top").textContent=m.cats[0]?.[0]||"Sin datos";
    if ($("s17Categories")) {
      $("s17Categories").innerHTML=m.cats.length
        ? m.cats.map(([k,v])=>`<div class="s17-bar-row"><span>${k}</span><b>${money(v)}</b><i><em style="width:${Math.min(100,Math.max(6,v/(m.cats[0][1]||1)*100))}%"></em></i></div>`).join("")
        : `<div class="s17-empty">Sin gastos registrados.</div>`;
    }
    const tasks=st.tasks||[
      {id:"cash",label:"Revisar flujo neto",done:false},
      {id:"top",label:"Revisar categoría de mayor presión",done:false},
      {id:"save",label:"Confirmar ahorro del mes",done:false},
      {id:"pay",label:"Confirmar próximo pago",done:false}
    ];
    const list=$("s17Tasks");
    if (list) {
      list.innerHTML=tasks.map(t=>`<label class="s17-task ${t.done?"done":""}"><input type="checkbox" data-s17-task="${t.id}" ${t.done?"checked":""}><span>${t.label}</span></label>`).join("");
      qsa("[data-s17-task]",list).forEach(input=>input.addEventListener("change",()=>{
        const current=read();
        current.tasks=tasks.map(t=>t.id===input.dataset.s17Task?{...t,done:input.checked}:t);
        save(current);
        render();
      }));
    }
    if ($("s17Status")) $("s17Status").textContent=m.net>=0?"CONTROLADO":"ATENCIÓN";
  }

  function route(view) {
    const actual=view==="daily"?"s17-daily":view;
    const target=document.getElementById(`view-${actual}`);
    if (!target) return false;
    qsa(".view").forEach(v=>v.classList.toggle("active",v===target));
    qsa(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    localStorage.setItem("h55x_budget_view",actual);
    if (actual==="s17-daily") render();
    window.scrollTo({top:0,behavior:"smooth"});
    return true;
  }

  function boot() {
    document.addEventListener("click",event=>{
      const btn=event.target.closest?.(".nav-item");
      if (!btn||!btn.dataset.view) return;
      if (route(btn.dataset.view)) { event.preventDefault(); event.stopPropagation(); }
    },true);

    const menu=document.querySelector(".menu");
    if (menu&&!menu.querySelector('[data-view="daily"]')) {
      menu.insertAdjacentHTML("beforeend",'<button type="button" class="nav-item" data-view="daily">Plan Diario</button>');
    }

    const target=$("view-s17-daily");
    if (target&&!$("s17DailyRuntime")) {
      target.insertAdjacentHTML("beforeend",`
        <div id="s17DailyRuntime" class="s17-runtime">
          <div class="s17-kpis">
            <article><span>Flujo 30d</span><strong id="s17Net">COP 0</strong></article>
            <article><span>Gasto medio</span><strong id="s17Avg">COP 0/día</strong></article>
            <article><span>Ahorro</span><strong id="s17Save">0%</strong></article>
            <article><span>Movimientos</span><strong id="s17Moves">0</strong></article>
            <article><span>Mayor presión</span><strong id="s17Top">—</strong></article>
          </div>
          <div class="s17-columns">
            <section class="panel">
              <div class="panel-head"><div><span class="eyebrow">Hoy</span><h3>Checklist financiero</h3></div><span id="s17Status" class="pill">CONTROLADO</span></div>
              <div id="s17Tasks"></div>
            </section>
            <section class="panel">
              <div class="panel-head"><div><span class="eyebrow">30 días</span><h3>Presión por categoría</h3></div></div>
              <div id="s17Categories"></div>
            </section>
          </div>
          <section class="panel">
            <div class="panel-head"><div><span class="eyebrow">Acciones</span><h3>Atajos</h3></div></div>
            <div class="s17-quick">
              <button type="button" class="btn btn-ghost" data-s17-route="dashboard">Ver resumen</button>
              <button type="button" class="btn btn-ghost" data-s17-route="control">Abrir control</button>
              <button type="button" class="btn btn-primary" data-s17-route="forecast">Simular</button>
            </div>
          </section>
        </div>
      `);
    }

    document.addEventListener("click",event=>{
      const btn=event.target.closest?.("[data-s17-route]");
      if (!btn) return;
      route(btn.dataset.s17Route);
    },true);

    render();
    window.BudgetS17={route,render,metrics};
  }

  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();