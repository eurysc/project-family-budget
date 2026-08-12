document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY='h55x_budget_movements_s06';
  const BOX_KEY='h55x_budget_boxes_s06';
  const $=id=>document.getElementById(id);
  const fmt=v=>`COP ${Number(v||0).toLocaleString('es-CO')}`;
  const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));

  const state={
    legacyMovements:load(STORAGE_KEY,[]),
    boxes:load(BOX_KEY,[
      {id:'fondo-i5',name:'Fondo I5',amount:12300000,target:39500000,rate:'8.2% EA',months:18},
      {id:'seguridad',name:'Seguridad',amount:1850000,target:4000000,rate:'8.2% EA',months:7}
    ])
  };

  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const service=()=>window.TransactionService?.all?.()||[];

  function migrateLegacy(){
    if(!window.TransactionService?.add || state.legacyMovements.length===0 || service().length>0) return;
    state.legacyMovements.slice().reverse().forEach(m=>{
      const map={Gasto:'expense',Ingreso:'income',Ahorro:'saving',Transferencia:'transfer'};
      window.TransactionService.add(map[m.type]||m.type,m.amount,m.account||m.source,m.category,m.merchant,m.notes);
    });
  }

  function kpis(){
    const tx=service();
    const base=3450000;
    const income=tx.filter(t=>['income','Ingreso'].includes(t.type)).reduce((s,t)=>s+Number(t.amount||0),0);
    const expense=tx.filter(t=>['expense','Gasto'].includes(t.type)).reduce((s,t)=>s+Number(t.amount||0),0);
    const saving=tx.filter(t=>['saving','Ahorro'].includes(t.type)).reduce((s,t)=>s+Number(t.amount||0),0);
    const today=tx.filter(t=>t.type==='expense'&&new Date(t.createdAt||Date.now()).toDateString()===new Date().toDateString()).reduce((s,t)=>s+Number(t.amount||0),0);
    const balance=base+income-expense;
    return{tx,income,expense,saving,today,balance,net:income-expense};
  }

  function renderKPIs(){
    const k=kpis();
    $('kpiLiquidity').textContent=fmt(k.balance);
    $('kpiSavings').textContent=fmt(820000+k.saving);
    $('availableToday').textContent=fmt(Math.max(0,185000-k.today));
    $('settingsState').textContent=`${k.tx.length} movimientos en el servicio transaccional.`;
    $('s08NetFlow').textContent=fmt(k.net);
    $('s08TodaySpend').textContent=fmt(k.today);
    const usage=Math.round(Math.min(100,k.expense/4000000*100));
    $('s08BudgetUse').textContent=`${usage}%`;
    const risk=usage>80?'ALTO':usage>55?'VIGILAR':'VERDE';
    $('s08Risk').textContent=risk;
    $('s08RiskText').textContent=risk==='VERDE'?'sin señales críticas':risk==='VIGILAR'?'revisión recomendada':'acción prioritaria';
    const sync=$('syncState');
    sync.textContent=k.tx.length?`${k.tx.length} movimientos locales`:'Datos locales';
    sync.style.color='#9bd6ac';
  }

  function renderMovements(){
    const rows=service().slice(0,10);
    const body=$('movementsBody'); if(body){
      body.innerHTML=rows.length?rows.map(m=>{
        const d=new Date(m.createdAt||Date.now()).toLocaleDateString('es-CO',{day:'2-digit',month:'short'});
        const sign=['income','Ingreso'].includes(m.type)?'+':'-';
        return `<tr><td>${d}</td><td>${escape(m.merchant||'Movimiento')}</td><td>${escape(m.source||m.account||'Local')}</td><td>${escape(m.category||'Otros')}</td><td>${sign}${fmt(m.amount)}</td></tr>`;
      }).join(''):'<tr><td colspan="5" style="text-align:center;color:#8fa4bd">Sin movimientos todavía</td></tr>';
    }
  }

  function renderBoxes(){
    const wrap=$('boxesGrid'); if(!wrap)return;
    wrap.innerHTML=state.boxes.map(b=>{
      const pct=Math.min(100,Math.round(b.amount/b.target*100));
      return `<article class="box-card"><div class="box-top"><div><span class="eyebrow">Meta</span><strong>${escape(b.name)}</strong></div><span class="pill">${b.months} meses</span></div><div class="box-amount">${fmt(b.amount)}</div><div class="progress"><div style="width:${pct}%"></div></div><div style="display:flex;justify-content:space-between;gap:8px;margin-top:8px;color:#8fa4bd;font-size:11px"><span>${pct}% de la meta</span><span>Meta ${fmt(b.target)}</span></div><small style="display:block;color:#8fa4bd;margin-top:8px">${b.rate} • Progreso protegido</small></article>`;
    }).join('');
  }

  function renderActivity(){
    const list=$('s08ActivityList'); if(!list)return;
    const q=($('s08ActivitySearch')?.value||'').toLowerCase();
    const type=$('s08ActivityType')?.value||'all';
    const rows=service().filter(t=>{
      const okType=type==='all'||t.type===type||({Gasto:'expense',Ingreso:'income',Ahorro:'saving'}[type]===t.type);
      const text=`${t.merchant||''} ${t.category||''} ${t.source||''}`.toLowerCase();
      return okType&&text.includes(q);
    }).slice(0,12);
    $('s08ActivityCount').textContent=`${rows.length} movimientos`;
    list.innerHTML=rows.length?rows.map(m=>{
      const d=new Date(m.createdAt||Date.now()).toLocaleDateString('es-CO',{day:'2-digit',month:'short'});
      const cls=['income','Ingreso'].includes(m.type)?'income':(['saving','Ahorro'].includes(m.type)?'saving':'expense');
      return `<div class="s08-activity-item"><span class="date">${d}</span><div><strong>${escape(m.merchant||'Movimiento')}</strong><span class="meta">${escape(m.category||'Otros')} • ${escape(m.source||m.account||'Local')}</span></div><span class="amount ${cls}">${['income','Ingreso'].includes(m.type)?'+':'-'}${fmt(m.amount)}</span><button class="delete" data-delete-tx="${m.id}">Eliminar</button></div>`;
    }).join(''):'<div class="s08-alert">No hay movimientos en este filtro.</div>';
    list.querySelectorAll('[data-delete-tx]').forEach(btn=>btn.onclick=()=>{
      window.TransactionService?.remove?.(btn.dataset.deleteTx);
      renderAll();
    });
  }

  function renderAlerts(){
    const wrap=$('s08Alerts'); if(!wrap || !window.BudgetInsightEngine)return;
    wrap.innerHTML=window.BudgetInsightEngine.alerts().map(a=>`<div class="s08-alert ${a.kind}">${escape(a.text)}</div>`).join('');
  }

  function renderAll(){
    renderKPIs();renderMovements();renderBoxes();renderActivity();renderAlerts();
    if(window.BudgetCommandCenter?.refresh) window.BudgetCommandCenter.refresh();
  }

  function openModal(){
    $('registerModal')?.classList.remove('hidden');
    $('modalAmount')?.focus();
  }
  function closeModal(){ $('registerModal')?.classList.add('hidden'); }

  function register(data){
    const amount=Number(data.amount||0);
    if(amount<=0){$('registerFeedback').textContent='Ingresa un monto mayor que cero.';return false;}
    const map={Gasto:'expense',Ingreso:'income',Transferencia:'transfer',Ahorro:'saving'};
    const tx=window.TransactionService?.add?.(map[data.type]||data.type,amount,data.account,data.category,data.merchant,data.notes);
    if(!tx)return false;
    window.dispatchEvent(new CustomEvent('h55x:movement',{detail:tx}));
    renderAll();
    return true;
  }

  function exportCSV(){
    const rows=service();
    const header=['Fecha','Tipo','Monto','Cuenta','Comercio','Categoría','Notas'];
    const csv=[header,...rows.map(t=>[
      new Date(t.createdAt||Date.now()).toISOString(),
      t.type,t.amount,t.source||'',t.merchant||'',t.category||'',t.notes||''
    ])].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url;a.download=`budget_movimientos_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
  }

  document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{
    const view=btn.dataset.view;
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));
    localStorage.setItem('h55x_budget_view',view);
    document.querySelectorAll('.rail-chip').forEach(x=>x.classList.toggle('active',x.dataset.action===view));
  }));

  document.querySelectorAll('.rail-chip').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.action==='register'){openModal();return;}
    document.querySelector(`.nav-item[data-view="${b.dataset.action}"]`)?.click();
  }));

  $('openRegister')?.addEventListener('click',openModal);
  $('heroRegister')?.addEventListener('click',openModal);
  $('closeRegister')?.addEventListener('click',closeModal);
  $('cancelRegister')?.addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openModal();}});
  $('saveRegister')?.addEventListener('click',()=>{
    const ok=register({amount:$('modalAmount').value,type:$('modalType').value,account:$('modalAccount').value,merchant:$('modalMerchant').value,category:$('modalCategory').value,notes:$('modalNotes').value});
    if(ok){['modalAmount','modalMerchant','modalNotes'].forEach(id=>$(id).value='');closeModal();$('registerFeedback').textContent='Movimiento guardado.';}
  });
  $('quickRegister')?.addEventListener('click',()=>{
    register({amount:$('quickAmount').value,type:$('quickType').value,account:'BBVA Cuenta Principal',merchant:'Registro rápido',category:'Otros'});
    $('quickAmount').value='';
  });
  $('inlineSubmit')?.addEventListener('click',()=>{
    const ok=register({amount:$('inlineAmount').value,type:'Gasto',account:'BBVA Cuenta Principal',merchant:$('inlineMerchant').value||'Registro directo',category:$('inlineCategory').value});
    if(ok){$('inlineAmount').value='';$('inlineMerchant').value='';}
  });

  document.querySelectorAll('.task-checkbox').forEach(c=>c.addEventListener('change',()=>{
    const boxes=[...document.querySelectorAll('.task-checkbox')],done=boxes.filter(x=>x.checked).length,pct=Math.round(done/boxes.length*100);
    $('taskProgressBar').style.width=`${pct}%`;$('taskProgressLabel').textContent=`${pct}%`;$('taskProgressCount').textContent=`${done} de ${boxes.length} tareas completadas`;
    localStorage.setItem('h55x_budget_tasks_s06',JSON.stringify(boxes.map(x=>({id:x.dataset.task,checked:x.checked}))));
  }));

  $('newBox')?.addEventListener('click',()=>{
    const name=prompt('Nombre de la nueva cajita');if(!name)return;
    const target=Number(prompt('Meta en COP','1000000')||0);if(target<=0)return;
    state.boxes.push({id:`b_${Date.now()}`,name,amount:0,target,rate:'8.2% EA',months:12});
    save(BOX_KEY,state.boxes);renderBoxes();
  });

  $('densityToggle')?.addEventListener('click',()=>document.body.classList.toggle('compact-mode'));
  $('resetLocal')?.addEventListener('click',()=>{
    if(!confirm('¿Limpiar todos los movimientos locales?'))return;
    window.TransactionService?.save?.([]);localStorage.removeItem(STORAGE_KEY);renderAll();
  });
  $('s08Export')?.addEventListener('click',exportCSV);
  ['s08ActivitySearch','s08ActivityType'].forEach(id=>$(id)?.addEventListener('input',renderActivity));
  $('s08Recalculate')?.addEventListener('click',renderAll);

  document.querySelectorAll('.nav-item').forEach(x=>{
    const view=localStorage.getItem('h55x_budget_view');
    if(view&&x.dataset.view===view)x.click();
  });

  migrateLegacy();
  renderAll();
});


/* H55X_S10_APP */
(function(){
  const $=id=>document.getElementById(id);
  const fmt=v=>`COP ${Number(v||0).toLocaleString('es-CO')}`;
  const service=()=>window.TransactionService?.all?.()||[];
  const fresh=t=>Date.now()-new Date(t.createdAt||Date.now()).getTime()<=30*86400000;
  function metrics(){const rows=service().filter(fresh);const income=rows.filter(t=>['income','Ingreso'].includes(t.type)).reduce((s,t)=>s+Number(t.amount||0),0);const expense=rows.filter(t=>['expense','Gasto'].includes(t.type)).reduce((s,t)=>s+Number(t.amount||0),0);const cats={};rows.filter(t=>['expense','Gasto'].includes(t.type)).forEach(t=>{const k=t.category||'Otros';cats[k]=(cats[k]||0)+Number(t.amount||0)});return{income,expense,net:income-expense,cats}};
  function render(){const m=metrics();if($('s10Income30'))$('s10Income30').textContent=fmt(m.income);if($('s10Expense30'))$('s10Expense30').textContent=fmt(m.expense);if($('s10Net30'))$('s10Net30').textContent=fmt(m.net);if($('s10CashflowHealth'))$('s10CashflowHealth').textContent=m.net>=0?'FLUJO POSITIVO':m.expense>m.income*1.25?'REVISIÓN':'VIGILAR';const cats=Object.entries(m.cats).sort((a,b)=>b[1]-a[1]).slice(0,6),max=cats[0]?.[1]||1;if($('s10CategoryCount'))$('s10CategoryCount').textContent=`${Object.keys(m.cats).length} categorías`;if($('s10CategoryBars'))$('s10CategoryBars').innerHTML=cats.length?cats.map(([k,v])=>`<div class="s10-bar-row"><span>${k}</span><div class="s10-bar-track"><i style="width:${Math.round(v/max*100)}%"></i></div><b>${fmt(v)}</b></div>`).join(''):'<div>Sin gastos registrados</div>';if($('s10Commitments'))$('s10Commitments').innerHTML=[['Nu Mastercard','3 días','prioridad alta'],['Internet ETB','7 días','servicio'],['Fondo I5','10 días','ahorro']].map(x=>`<div><span><strong>${x[0]}</strong><small>${x[2]}</small></span><b>${x[1]}</b></div>`).join('');const insights=[{tag:'Liquidez',title:m.net>=0?'Margen favorable':'Flujo negativo',text:m.net>=0?'Protege el excedente.':'Prioriza obligaciones y reduce gasto variable.',cls:m.net>=0?'good':'risk'},{tag:'Gasto',title:`Principal: ${cats[0]?.[0]||'Otros'}`,text:`La categoría principal concentra ${fmt(cats[0]?.[1]||0)}.`,cls:'watch'},{tag:'Ahorro',title:'Objetivo protegido',text:'Mantén las cajitas separadas del gasto operativo.',cls:'good'}];if($('s10InsightGrid'))$('s10InsightGrid').innerHTML=insights.map(i=>`<article class="s10-insight ${i.cls}"><span class="tag">${i.tag}</span><strong>${i.title}</strong><p>${i.text}</p></article>`).join('');const actions=[m.net<0?'Revisar gasto variable':'Mantener disciplina de gasto',m.expense>0?'Actualizar presupuesto por categoría':'Registrar presupuesto inicial','Revisar próximos pagos'];if($('s10ActionCount'))$('s10ActionCount').textContent=String(actions.length);if($('s10ActionList'))$('s10ActionList').innerHTML=actions.map((a,i)=>`<div><span><strong>${a}</strong><small>Acción S10 #${i+1}</small></span><button class="s10-action-btn" data-s10-action="${i}">Marcar</button></div>`).join('');document.querySelectorAll('[data-s10-action]').forEach(b=>b.onclick=()=>{b.textContent='Hecho';b.disabled=true})}
  document.addEventListener('click',e=>{const b=e.target.closest('.nav-item');if(b&&['cashflow','insights'].includes(b.dataset.view))setTimeout(render,0)});
  $('s10RefreshInsights')?.addEventListener('click',render);window.addEventListener('h55x:movement',render);window.BudgetInsightsS10={render,metrics};document.addEventListener('DOMContentLoaded',render);
})();

/* H55X_S13_RUNTIME */

(function(){
  const $=id=>document.getElementById(id);
  const fmt=v=>'COP '+Number(v||0).toLocaleString('es-CO');
  function scenario(balance,saving,expense,months,mult,label,cls){
    const net=(saving-expense)*mult;
    return {label,cls,net,future:balance+net*months};
  }
  function runForecast(){
    const b=Number($('s13Balance')?.value||0), s=Number($('s13Saving')?.value||0), e=Number($('s13Expense')?.value||0), m=Number($('s13Months')?.value||12);
    const rows=[
      scenario(b,s,e,m,1,'Base','base'),
      scenario(b,s*1.2,e*.95,m,1,'Acelerado','good'),
      scenario(b,s*.75,e*1.08,m,1,'Presión','risk')
    ];
    $('s13ScenarioCards').innerHTML=rows.map(r=>`<article class="s13-scenario ${r.cls}"><span>${r.label}</span><strong>${fmt(r.future)}</strong><small>Flujo mensual ${fmt(r.net)}</small></article>`).join('');
    const best=rows.slice().sort((a,b)=>b.future-a.future)[0], worst=rows.slice().sort((a,b)=>a.future-b.future)[0];
    $('s13ForecastNarrative').innerHTML=`<div class="s13-callout"><strong>${best.label}</strong><p>Con este ritmo llegarías a <b>${fmt(best.future)}</b> en ${m} meses.</p></div><div class="s13-callout warning"><strong>Riesgo</strong><p>El escenario de presión reduce el cierre a <b>${fmt(worst.future)}</b>. La diferencia frente al mejor escenario es <b>${fmt(best.future-worst.future)}</b>.</p></div>`;
    $('s13ForecastState').textContent=best.future>=b?'Positivo':'Revisar';
    $('s13ForecastFeedback').textContent='Simulación calculada localmente; no modifica saldos.';
    localStorage.setItem('budget_s13_forecast',JSON.stringify({b,s,e,m,rows}));
  }
  function renderOps(){
    const q=window.BudgetCommandCenter?.getActionQueue?.()||[];
    const done=JSON.parse(localStorage.getItem('budget_s13_ops_done')||'[]');
    const bills=window.PaymentCalendar?.upcoming?.()||[];
    $('s13OpsCount').textContent=String(q.length);
    $('s13OpsList').innerHTML=(q.length?q:[{id:'register',label:'Registrar un movimiento',priority:'Alta'}]).map(x=>`<div class="s13-op-row"><span><strong>${x.label}</strong><small>${x.priority||'Media'}</small></span><button class="btn btn-ghost" data-s13-op="${x.id}">${done.includes(x.id)?'Hecho':'Completar'}</button></div>`).join('');
    $('s13OpsBills').innerHTML=(bills.length?bills:[{id:'nu',name:'Nu Mastercard',date:'3 días',status:'pending'},{id:'etb',name:'Internet ETB',date:'7 días',status:'pending'}]).map(x=>`<div class="s13-op-row"><span><strong>${x.name||x.title}</strong><small>${x.date||'Próximo'} • ${x.status||'pending'}</small></span><span class="pill">${x.status==='paid'?'Pagado':'Pendiente'}</span></div>`).join('');
    document.querySelectorAll('[data-s13-op]').forEach(btn=>btn.onclick=()=>{const list=JSON.parse(localStorage.getItem('budget_s13_ops_done')||'[]');if(!list.includes(btn.dataset.s13Op))list.push(btn.dataset.s13Op);localStorage.setItem('budget_s13_ops_done',JSON.stringify(list));renderOps();});
  }
  function boot(){
    const nav=document.querySelector('.menu');
    if(nav&&!document.querySelector('[data-view="forecast"]')) nav.insertAdjacentHTML('beforeend','<button class="nav-item" data-view="forecast">Forecast Lab</button><button class="nav-item" data-view="operations">Operaciones</button>');
    const main=document.querySelector('.app-shell');
    if(main&&!document.getElementById('view-forecast')) main.insertAdjacentHTML('beforeend','\n<section id="view-forecast" class="view">\n  <div class="section-title">\n    <div><span class="eyebrow">Planificación</span><h2>Forecast Lab</h2><p>Prueba decisiones de ahorro, gasto y liquidez antes de ejecutarlas.</p></div>\n    <span class="pill">S13 • Simulación</span>\n  </div>\n  <div class="s13-forecast-grid">\n    <article class="panel">\n      <div class="panel-head"><div><span class="eyebrow">Variables</span><h3>Motor de proyección</h3></div></div>\n      <div class="s13-form-grid">\n        <label>Liquidez actual<input id="s13Balance" type="number" value="3450000"></label>\n        <label>Ahorro mensual<input id="s13Saving" type="number" value="820000"></label>\n        <label>Gasto mensual<input id="s13Expense" type="number" value="2020000"></label>\n        <label>Meses<input id="s13Months" type="number" value="12"></label>\n      </div>\n      <div class="s13-actions"><button id="s13RunForecast" class="btn btn-primary">Simular escenario</button><button id="s13ResetForecast" class="btn btn-ghost">Restablecer</button></div>\n      <p id="s13ForecastFeedback" class="feedback"></p>\n    </article>\n    <article class="panel">\n      <div class="panel-head"><div><span class="eyebrow">Salida</span><h3>Escenarios</h3></div><span id="s13ForecastState" class="pill">Listo</span></div>\n      <div id="s13ScenarioCards" class="s13-scenarios"></div>\n    </article>\n  </div>\n  <article class="panel">\n    <div class="panel-head"><div><span class="eyebrow">Lectura ejecutiva</span><h3>Impacto de una decisión</h3></div></div>\n    <div id="s13ForecastNarrative" class="s13-narrative"></div>\n  </article>\n</section>\n\n<section id="view-operations" class="view">\n  <div class="section-title">\n    <div><span class="eyebrow">Ejecución</span><h2>Operaciones</h2><p>Convierte señales financieras en acciones concretas.</p></div>\n    <button id="s13RefreshOps" class="btn btn-ghost">Actualizar</button>\n  </div>\n  <div class="s13-op-grid">\n    <article class="panel"><div class="panel-head"><div><span class="eyebrow">Prioridad</span><h3>Próximas acciones</h3></div><span id="s13OpsCount" class="pill">0</span></div><div id="s13OpsList" class="s13-ops-list"></div></article>\n    <article class="panel"><div class="panel-head"><div><span class="eyebrow">Calendario</span><h3>Obligaciones</h3></div></div><div id="s13OpsBills" class="s13-ops-list"></div></article>\n  </div>\n</section>\n');
    $('s13RunForecast')?.addEventListener('click',runForecast);
    $('s13ResetForecast')?.addEventListener('click',()=>{$('s13Balance').value=3450000;$('s13Saving').value=820000;$('s13Expense').value=2020000;$('s13Months').value=12;runForecast();});
    $('s13RefreshOps')?.addEventListener('click',renderOps);
    renderOps();runForecast();
  }
  window.BudgetS13={runForecast,renderOps};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
