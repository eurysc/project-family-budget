
document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id), KEY='h55x_budget_bills_s11', LIMIT='h55x_budget_limit_s11';
 const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}}, save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
 const fmt=v=>`COP ${Number(v||0).toLocaleString('es-CO')}`, tx=()=>window.TransactionService?.all?.()||[];
 const expense=()=>tx().filter(t=>['expense','Gasto'].includes(t.type)), income=()=>tx().filter(t=>['income','Ingreso'].includes(t.type));
 const bills=()=>load(KEY,[{id:'rent',name:'Arriendo',amount:1000000,due:'1',kind:'fijo'},{id:'nu',name:'Nu Mastercard',amount:520000,due:'25',kind:'TDC'},{id:'etb',name:'ETB',amount:120000,due:'20',kind:'servicio'}]);
 function metrics(){
   const now=Date.now(), e=expense(), i=income();
   const e7=e.filter(t=>now-new Date(t.createdAt||now).getTime()<=7*864e5).reduce((s,t)=>s+Number(t.amount||0),0);
   const e30=e.filter(t=>now-new Date(t.createdAt||now).getTime()<=30*864e5).reduce((s,t)=>s+Number(t.amount||0),0);
   const i30=i.filter(t=>now-new Date(t.createdAt||now).getTime()<=30*864e5).reduce((s,t)=>s+Number(t.amount||0),0);
   const daily=e7/7, runway=daily?Math.round(3450000/daily):999, net=i30-e30, usage=Math.min(100,e30/4000000*100);
   const savings=i30?Math.max(0,Math.round(net/i30*100)):0, score=Math.max(0,Math.min(100,Math.round(100-usage*.45+savings*.35-(runway<10?20:0))));
   return {daily,runway,net,usage,savings,score};
 }
 function render(){
   const m=metrics();
   $('s11Net30').textContent=fmt(m.net); $('s11SpendRate').textContent=fmt(m.daily)+'/día'; $('s11Runway').textContent=m.runway>=999?'∞':m.runway+' días';
   $('s11HealthScore').textContent=m.score+'/100'; $('s11ControlHealth').textContent=m.score>=75?'SALUDABLE':m.score>=55?'VIGILAR':'ACCIÓN';
   const bars=[['Liquidez',Math.min(100,m.runway/30*100,m.runway<10?'warning':'good')],['Presupuesto',100-m.usage,m.usage>70?'warning':'good'],['Ahorro',m.savings,m.savings>=15?'good':'warning'],['Riesgo',100-m.score,m.score<55?'warning':'good']];
   $('s11HealthBars').innerHTML=bars.map(([n,v,c])=>`<div class="s11-health-row"><span>${n}</span><div class="s11-health-track"><i class="${c}" style="width:${Math.max(0,Math.min(100,v))}%"></i></div><b>${Math.round(v)}%</b></div>`).join('');
   $('s11Bills').innerHTML=bills().map(b=>`<div class="s11-bill"><span><strong>${b.name}</strong><small>Día ${b.due} • ${b.kind}</small></span><b>${fmt(b.amount)}</b><button data-rm-bill="${b.id}">×</button></div>`).join('');
   $('s11Bills').querySelectorAll('[data-rm-bill]').forEach(x=>x.onclick=()=>{save(KEY,bills().filter(b=>b.id!==x.dataset.rmBill));render()});
   const lim=Number(localStorage.getItem(LIMIT)||0), today=eDay(), rem=lim?Math.max(0,lim-today):0;
   $('s11Guardrails').innerHTML=`<div><span>Límite diario</span><strong>${lim?fmt(lim):'No definido'}</strong><small>${lim?`Disponible hoy ${fmt(rem)}`:'Define un límite para activar el guardrail.'}</small></div><div><span>Gasto hoy</span><strong>${fmt(today)}</strong><small class="${lim&&today>lim?'bad':'good'}">${lim?(today>lim?'Límite excedido':'Dentro del límite'):'Sin límite'}</small></div><div><span>Acción sugerida</span><strong>${m.score<55?'Reducir gasto discrecional':'Mantener disciplina'}</strong><small>Basado en señales actuales</small></div>`;
 }
 function eDay(){return expense().filter(t=>new Date(t.createdAt||Date.now()).toDateString()===new Date().toDateString()).reduce((s,t)=>s+Number(t.amount||0),0)}
 $('s11AddBill')?.addEventListener('click',()=>{const name=prompt('Nombre de obligación');if(!name)return;const amount=Number(prompt('Monto COP','100000')||0);if(amount<=0)return;const due=prompt('Día del mes','25')||'25';const list=bills();list.push({id:'b_'+Date.now(),name,amount,due,kind:'manual'});save(KEY,list);render()});
 $('s11SetLimit')?.addEventListener('click',()=>{const v=Number(prompt('Límite diario COP',localStorage.getItem(LIMIT)||'150000')||0);if(v>0)localStorage.setItem(LIMIT,String(v));render()});
 window.addEventListener('h55x:movement',render); window.BudgetS11={refresh:render,metrics}; render();
});
