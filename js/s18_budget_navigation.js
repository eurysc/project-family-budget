
(() => {
  const $ = id => document.getElementById(id);
  const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
  const ALIAS = { workspace:"s15-workspace", "s15-workspace":"s15-workspace", forecast:"s15-workspace", operations:"s15-workspace" };
  const labels = { workspace:"Workspace", forecast:"Forecast Lab", operations:"Operaciones" };

  function canonicalize() {
    const menu = document.querySelector(".menu");
    if (!menu) return;
    const seen = new Set();
    qsa(".nav-item", menu).forEach(btn => {
      const raw = btn.dataset.view || "";
      const key = raw === "s15-workspace" ? "workspace" : raw;
      if (!key) return;
      if (seen.has(key)) { btn.remove(); return; }
      seen.add(key);
      btn.dataset.view = key;
      btn.type = "button";
    });
    if (!menu.querySelector('[data-view="workspace"]')) {
      menu.insertAdjacentHTML("beforeend", '<button type="button" class="nav-item" data-view="workspace">Workspace</button>');
    }
  }

  function setContext(view) {
    const section = $("view-s15-workspace");
    if (!section) return;
    const title = section.querySelector(".section-title h2");
    const eyebrow = section.querySelector(".section-title .eyebrow");
    const desc = section.querySelector(".section-title p");
    if (eyebrow) eyebrow.textContent = "S18 • Unified Workspace";
    if (title) title.textContent = labels[view] || "Workspace";
    if (desc) desc.textContent =
      view === "forecast"
        ? "Escenarios de liquidez y ahorro usando los datos existentes."
        : view === "operations"
          ? "Ejecución diaria, compromisos y acciones financieras."
          : "Centro único para operar sin duplicar módulos.";
  }

  function route(view) {
    const actual = ALIAS[view] || view;
    const target = document.getElementById(`view-${actual}`);
    if (!target) return false;
    qsa(".view").forEach(v => v.classList.toggle("active", v === target));
    qsa(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === (actual === "s15-workspace" ? "workspace" : view)));
    localStorage.setItem("h55x_budget_view", actual);
    setContext(view);
    if (actual === "s15-workspace") {
      window.BudgetS15R2?.render?.();
      window.BudgetS16?.render?.();
      window.BudgetS17?.render?.();
    }
    window.scrollTo({top:0,behavior:"smooth"});
    return true;
  }

  function bind() {
    canonicalize();
    document.addEventListener("click", event => {
      const btn = event.target.closest?.(".nav-item");
      if (!btn || !btn.dataset.view) return;
      if (route(btn.dataset.view)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function boot() {
    canonicalize();
    bind();
    const saved = localStorage.getItem("h55x_budget_view");
    const initial = saved === "s15-workspace" ? "workspace" : saved;
    if (initial && document.getElementById(`view-${ALIAS[initial] || initial}`)) route(initial);
    window.BudgetS18 = {route, canonicalize};
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
