document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'h55x_budget_movements_s06';
  const BOX_KEY = 'h55x_budget_boxes_s06';

  const $ = (id) => document.getElementById(id);
  const fmt = (value) => `COP ${Number(value || 0).toLocaleString('es-CO')}`;

  const state = {
    movements: load(STORAGE_KEY, []),
    boxes: load(BOX_KEY, [
      {id:'fondo-i5', name:'Fondo I5', amount:12300000, target:39500000, rate:'8.2% EA', months:18},
      {id:'seguridad', name:'Seguridad', amount:1850000, target:4000000, rate:'8.2% EA', months:7},
    ])
  };

  function load(key, fallback){
    try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}
  }
  function save(key, value){localStorage.setItem(key, JSON.stringify(value));}
  function todaySpent(){
    const day = new Date().toDateString();
    return state.movements.filter(m=>m.type==='Gasto' && new Date(m.date).toDateString()===day)
      .reduce((s,m)=>s+Number(m.amount||0),0);
  }
  function currentBalance(){
    const base=3450000;
    return base + state.movements.reduce((s,m)=>{
      if(m.type==='Ingreso') return s+Number(m.amount||0);
      if(m.type==='Gasto') return s-Number(m.amount||0);
      return s;
    },0);
  }
  function renderKPIs(){
    $('kpiLiquidity').textContent = fmt(currentBalance());
    $('kpiSavings').textContent = fmt(820000 + state.movements.filter(m=>m.type==='Ahorro').reduce((s,m)=>s+Number(m.amount||0),0));
    $('availableToday').textContent = fmt(Math.max(0,185000-todaySpent()));
    const spend = todaySpent();
    const stateEl = $('syncState');
    stateEl.textContent = spend > 185000 ? 'Atención: gasto alto' : 'Datos locales';
    stateEl.style.color = spend > 185000 ? '#fecaca' : '#9bd6ac';
    $('settingsState').textContent = `${state.movements.length} movimientos locales registrados.`;
  }
  function renderMovements(){
    const tbody=$('movementsBody');
    if(!tbody)return;
    const rows=state.movements.slice(0,10);
    tbody.innerHTML = rows.length ? rows.map(m=>{
      const date=new Date(m.date).toLocaleDateString('es-CO',{day:'2-digit',month:'short'});
      const sign=m.type==='Ingreso'?'+':'-';
      return `<tr><td>${date}</td><td>${escapeHtml(m.merchant||'Sin comercio')}</td><td>${escapeHtml(m.account||'Local')}</td><td>${escapeHtml(m.category||'Otros')}</td><td>${sign}${fmt(m.amount)}</td></tr>`;
    }).join('') : '<tr><td colspan="5" style="text-align:center;color:#8fa4bd">Sin movimientos todavía</td></tr>';
  }
  function renderBoxes(){
    const wrap=$('boxesGrid');
    wrap.innerHTML=state.boxes.map(b=>{
      const pct=Math.min(100,Math.round((b.amount/b.target)*100));
      return `<article class="box-card"><div class="box-top"><div><span class="eyebrow">Meta</span><strong>${escapeHtml(b.name)}</strong></div><span class="pill">${b.months} meses</span></div><div class="box-amount">${fmt(b.amount)}</div><div class="progress"><div style="width:${pct}%"></div></div><div style="display:flex;justify-content:space-between;gap:8px;margin-top:8px;color:#8fa4bd;font-size:11px"><span>${pct}% de la meta</span><span>Meta ${fmt(b.target)}</span></div><small style="display:block;color:#8fa4bd;margin-top:8px">${b.rate} • Progreso protegido</small></article>`;
    }).join('');
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

  function registerMovement(data){
    const amount=Number(data.amount||0);
    if(amount<=0){return false;}
    state.movements.unshift({
      id:`m_${Date.now()}`,
      date:new Date().toISOString(),
      type:data.type||'Gasto',
      amount,
      account:data.account||'BBVA Cuenta Principal',
      merchant:data.merchant||'Movimiento manual',
      category:data.category||'Otros',
      notes:data.notes||''
    });
    save(STORAGE_KEY,state.movements);
    renderAll();
    return true;
  }
  function renderAll(){renderKPIs();renderMovements();renderBoxes();}

  document.querySelectorAll('.nav-item').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const view=btn.dataset.view;
      document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x===btn));
      document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));
      localStorage.setItem('h55x_budget_view',view);
    });
  });

  const modal=$('registerModal');
  const open=()=>{modal.classList.remove('hidden');$('modalAmount').focus();};
  const close=()=>modal.classList.add('hidden');
  $('openRegister').addEventListener('click',open);
  $('heroRegister').addEventListener('click',open);
  $('closeRegister').addEventListener('click',close);
  $('cancelRegister').addEventListener('click',close);

  $('saveRegister').addEventListener('click',()=>{
    const ok=registerMovement({
      amount:$('modalAmount').value,type:$('modalType').value,account:$('modalAccount').value,
      merchant:$('modalMerchant').value,category:$('modalCategory').value,notes:$('modalNotes').value
    });
    $('registerFeedback').textContent=ok?'Movimiento guardado y KPIs actualizados.':'Ingresa un monto mayor que cero.';
    if(ok){['modalAmount','modalMerchant','modalNotes'].forEach(id=>$(id).value='');close();}
  });

  $('quickRegister').addEventListener('click',()=>{
    registerMovement({amount:$('quickAmount').value,type:$('quickType').value,account:'BBVA Cuenta Principal',merchant:'Registro rápido',category:'Otros'});
    $('quickAmount').value='';
  });

  $('inlineSubmit').addEventListener('click',()=>{
    const ok=registerMovement({amount:$('inlineAmount').value,type:'Gasto',account:'BBVA Cuenta Principal',merchant:$('inlineMerchant').value||'Registro directo',category:$('inlineCategory').value});
    $('registerFeedback').textContent=ok?'Guardado. El dashboard fue recalculado.':'Ingresa un monto válido.';
    if(ok){$('inlineAmount').value='';$('inlineMerchant').value='';}
  });

  document.querySelectorAll('.task-checkbox').forEach(cb=>cb.addEventListener('change',()=>{
    const boxes=[...document.querySelectorAll('.task-checkbox')];
    const complete=boxes.filter(x=>x.checked).length;
    const pct=Math.round(complete/boxes.length*100);
    $('taskProgressBar').style.width=`${pct}%`;
    $('taskProgressLabel').textContent=`${pct}%`;
    $('taskProgressCount').textContent=`${complete} de ${boxes.length} tareas completadas`;
    localStorage.setItem('h55x_budget_tasks_s06',JSON.stringify(boxes.map(x=>({id:x.dataset.task,checked:x.checked}))));
  }));

  const savedTasks=load('h55x_budget_tasks_s06',[]);
  document.querySelectorAll('.task-checkbox').forEach(cb=>{
    const found=savedTasks.find(x=>x.id===cb.dataset.task); if(found) cb.checked=found.checked;
  });

  $('newBox').addEventListener('click',()=>{
    const name=prompt('Nombre de la nueva cajita');
    if(!name)return;
    const target=Number(prompt('Meta en COP','1000000')||0);
    if(target<=0)return;
    state.boxes.push({id:`b_${Date.now()}`,name,amount:0,target,rate:'8.2% EA',months:12});
    save(BOX_KEY,state.boxes);renderBoxes();
  });

  $('densityToggle').addEventListener('click',()=>document.body.classList.toggle('compact-mode'));
  $('resetLocal').addEventListener('click',()=>{
    if(!confirm('¿Limpiar todos los movimientos locales?')) return;
    state.movements=[];save(STORAGE_KEY,[]);renderAll();
  });

  const savedView=localStorage.getItem('h55x_budget_view');
  if(savedView){
    const btn=document.querySelector(`.nav-item[data-view="${savedView}"]`);
    if(btn) btn.click();
  }
  renderAll();
});

/* ===== H55X S07 live operating layer ===== */
(function(){
  const $=id=>document.getElementById(id);
  const fmt=v=>`COP ${Number(v||0).toLocaleString('es-CO')}`;
  const txAll=()=>window.TransactionService?.all ? window.TransactionService.all() : [];
  const emit=()=>window.HorizonBus?.emit?.('budget.changed',{at:Date.now()});
  const ensureFeed=()=>{
    const list=$('s07FeedList'); if(!list)return;
    const q=($('s07Filter')?.value||'').toLowerCase().trim();
    const type=$('s07TypeFilter')?.value||'all';
    const items=txAll().filter(t=>(type==='all'||t.type===type)&&(`${t.source||''} ${t.category||''} ${t.merchant||''}`).toLowerCase().includes(q)).slice(0,12);
    list.innerHTML=items.length?items.map(t=>{
      const d=new Date(t.createdAt||Date.now()).toLocaleDateString('es-CO',{day:'2-digit',month:'short'});
      const cls=t.type==='Ingreso'?'income':(t.type==='Ahorro'?'saving':'expense');
      const sign=t.type==='Ingreso'?'+':'-';
      return `<div class="s07-feed-item"><span class="date">${d}</span><div><strong>${escape(t.merchant||t.source||'Movimiento')}</strong><span class="meta">${escape(t.category||'Otros')} • ${escape(t.source||'Local')}</span></div><span class="amount ${cls}">${sign}${fmt(t.amount)}</span></div>`;
    }).join(''):'<div class="s07-alert">No hay movimientos en este filtro. Registra uno para activar el feed.</div>';
  };
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const renderHealth=()=>{
    const tx=txAll();
    const income=tx.filter(t=>t.type==='Ingreso').reduce((s,t)=>s+Number(t.amount||0),0);
    const expense=tx.filter(t=>t.type==='Gasto').reduce((s,t)=>s+Number(t.amount||0),0);
    const saving=tx.filter(t=>t.type==='Ahorro').reduce((s,t)=>s+Number(t.amount||0),0);
    const usage=Math.min(100,Math.round(expense/4000000*100));
    const risk=usage>80?'ALTO':usage>55?'VIGILAR':'VERDE';
    const grid=$('s07HealthGrid'); if(!grid)return;
    grid.innerHTML=[
      ['Ingresos registrados',fmt(income),'flujo positivo'],
      ['Gastos registrados',fmt(expense),`${usage}% sobre cupo de referencia`],
      ['Ahorro registrado',fmt(saving),'protección acumulada'],
      ['Movimientos',tx.length,'actividad local']
    ].map(x=>`<div class="s07-health-card"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('');
    $('s07RiskPill').textContent=risk;
    $('s07RiskPill').style.color=risk==='VERDE'?'#86efac':risk==='VIGILAR'?'#fde68a':'#fca5a5';
    const alerts=[];
    if(expense>500000)alerts.push(['warning','Los gastos acumulados ya justifican revisar categorías.']);
    if(saving===0)alerts.push(['warning','No hay ahorro registrado aún en el servicio transaccional.']);
    if(!alerts.length)alerts.push(['good','El flujo local no muestra señales críticas.']);
    $('s07Alerts').innerHTML=alerts.map(a=>`<div class="s07-alert ${a[0]}">${a[1]}</div>`).join('');
  };
  const syncService=(movement)=>{
    if(!window.TransactionService?.add)return;
    const typeMap={Gasto:'expense',Ingreso:'income',Ahorro:'saving',Transferencia:'transfer'};
    const already=txAll().some(t=>t.id===movement.id);
    if(!already) window.TransactionService.add(typeMap[movement.type]||movement.type,movement.amount,movement.account||movement.source,movement.category);
  };
  const originalRegister=window.BudgetCommandCenter;
  window.BudgetCommandCenter={
    ...(originalRegister||{}),
    health:()=>({income:txAll().filter(t=>t.type==='Ingreso').length,expenses:txAll().filter(t=>t.type==='Gasto').length}),
    refresh(){renderHealth();ensureFeed();}
  };
  document.addEventListener('click',e=>{
    if(e.target.closest('#saveRegister')||e.target.closest('#quickRegister')||e.target.closest('#inlineSubmit'))setTimeout(()=>{renderHealth();ensureFeed();},60);
  });
  ['s07Filter','s07TypeFilter'].forEach(id=>$(id)?.addEventListener('input',ensureFeed));
  window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('openRegister')?.click()}});
  window.addEventListener('h55x:movement',e=>{syncService(e.detail);renderHealth();ensureFeed();});
  setTimeout(()=>{renderHealth();ensureFeed();},100);
})();
