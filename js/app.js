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
