
(() => {
  const $ = id => document.getElementById(id);
  const txAll = () => window.TransactionService?.all?.() || (() => { try { return JSON.parse(localStorage.getItem("budget_transactions_v1")||"[]"); } catch { return []; }})();
  const billsKey = "budget_s12_bills_v1";
  const load = (k,f) => { try { return JSON.parse(localStorage.getItem(k)||"null") ?? f; } catch { return f; } };
  const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
  const fmt = n => `COP ${Math.round(Number(n||0)).toLocaleString("es-CO")}`;
  const daysAgo = d => Math.max(0, Math.floor((Date.now()-new Date(d).getTime())/86400000));
  const last14 = () => txAll().filter(t=>daysAgo(t.createdAt||t.date)<=14);
  const last30 = () => txAll().filter(t=>daysAgo(t.createdAt||t.date)<=30);

  function metrics(){
    const tx=last30(), net=tx.reduce((s,t)=>s+(t.type==="Ingreso"?1:-1)*Number(t.amount||0),0);
    const gastos=last14().filter(t=>t.type==="Gasto").reduce((s,t)=>s+Number(t.amount||0),0);
    const burn=gastos/14;
    const liquidity=3450000+net;
    const reserve=burn>0?Math.max(0,Math.floor(liquidity/burn)):30;
    let risk="VERDE",reason="flujo controlado";
    if(net<0 || reserve<12){risk="ÁMBAR";reason=reserve<12?"reserva corta":"flujo neto negativo";}
    if(net<-1500000 || reserve<7){risk="ROJO";reason=reserve<7?"menos de 7 días":"salida neta elevada";}
    if($("s12NetFlow")) $("s12NetFlow").textContent=fmt(net);
    if($("s12NetFlowState")) $("s12NetFlowState").textContent=net>=0?"positivo":"negativo";
    if($("s12BurnRate")) $("s12BurnRate").textContent=`${fmt(burn)}/día`;
    if($("s12ReserveDays")) $("s12ReserveDays").textContent=`${reserve} días`;
    if($("s12Risk")) $("s12Risk").textContent=risk;
    if($("s12RiskReason")) $("s12RiskReason").textContent=reason;
    renderSignals(net,burn,reserve,risk);
    renderActions(net,burn,reserve,risk);
  }
  function renderSignals(net,burn,reserve,risk){
    const data=[
      ["Flujo 30 días", net>=0?"POSITIVE":"WATCH", fmt(net)],
      ["Ritmo de gasto", burn<=185000?"POSITIVE":"WATCH", `${fmt(burn)}/día`],
      ["Reserva", reserve>=17?"POSITIVE":reserve>=10?"WATCH":"RISK", `${reserve} días`],
      ["Riesgo", risk==="VERDE"?"POSITIVE":risk==="ÁMBAR"?"WATCH":"RISK", risk]
    ];
    if($("s12Signals")) $("s12Signals").innerHTML=data.map(([a,b,c])=>`<div class="s12-signal"><div><strong>${a}</strong><small>${c}</small></div><b class="${b==="POSITIVE"?"s12-ok":b==="WATCH"?"s12-watch":"s12-risk"}">${b==="POSITIVE"?"OK":b}</b></div>`).join("");
  }
  function renderActions(net,burn,reserve,risk){
    const actions=[];
    if(risk!=="VERDE") actions.push(["Blindar liquidez","Revisar gastos variables","high"]);
    if(net<0) actions.push(["Cerrar flujo neto","Reducir salidas de 7 días","high"]);
    if(burn>185000) actions.push(["Bajar ritmo de gasto","Objetivo ≤ COP 185k/día","medium"]);
    actions.push(["Revisar próxima obligación","Confirmar calendario de pagos","medium"]);
    actions.push(["Actualizar presupuesto","Sincronizar categorías activas","low"]);
    $("s12ActionCount").textContent=actions.length;
    $("s12Actions").innerHTML=actions.map((x,i)=>`<div class="s12-action"><div><strong>${x[0]}</strong><small>${x[1]}</small></div><button data-s12-action="${i}">Hecho</button></div>`).join("");
    document.querySelectorAll("[data-s12-action]").forEach(b=>b.onclick=()=>{b.textContent="OK";b.disabled=true;});
  }
  function renderBills(){
    const bills=load(billsKey,[{id:"nu",name:"Nu Mastercard",amount:520000,due:3,priority:"Alta"},{id:"etb",name:"Internet ETB",amount:120000,due:6,priority:"Media"},{id:"arriendo",name:"Arriendo",amount:1000000,due:12,priority:"Alta"}]);
    save(billsKey,bills);
    $("s12Bills2").innerHTML=bills.map(b=>`<div class="s12-bill"><div><strong>${b.name}</strong><small>Vence en ${b.due} días • ${b.priority}</small></div><strong>${fmt(b.amount)}</strong></div>`).join("");
  }
  function renderActivity(){
    const filter=$("s12Filter").value, rows=txAll().filter(t=>filter==="all"||t.type===filter).slice(0,8);
    $("s12Activity").innerHTML=rows.length?rows.map(t=>`<div class="s12-activity-row"><div><strong>${t.merchant||"Movimiento"}</strong><small>${t.type} • ${t.category||"Otros"}</small></div><strong>${fmt(t.amount)}</strong></div>`).join(""):'<div class="s12-activity-row"><small>Sin actividad todavía.</small></div>';
  }
  function exportCsv(){
    const rows=txAll().map(t=>[t.createdAt||"",t.type||"",t.amount||0,t.merchant||"",t.category||"",t.source||""]);
    const csv=[["Fecha","Tipo","Monto","Comercio","Categoria","Cuenta"],...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="budget-s12-movimientos.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  document.addEventListener("DOMContentLoaded",()=>{
    metrics();renderBills();renderActivity();
    $("s12Refresh")?.addEventListener("click",()=>{metrics();renderBills();renderActivity();});
    $("s12Filter")?.addEventListener("change",renderActivity);
    $("s12Export")?.addEventListener("click",exportCsv);
    $("s12AddBill")?.addEventListener("click",()=>{
      const name=prompt("Nombre de obligación"); if(!name)return;
      const amount=Number(prompt("Monto en COP","100000")||0); if(!amount)return;
      const due=Number(prompt("Días hasta vencimiento","7")||7);
      const list=load(billsKey,[]);list.push({id:`b_${Date.now()}`,name,amount,due,priority:due<=3?"Alta":"Media"});save(billsKey,list);renderBills();
    });
    window.addEventListener("budget:transaction-added",()=>{metrics();renderActivity();});
    window.addEventListener("storage",()=>{metrics();renderActivity();});
  });
})();
