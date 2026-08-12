window.BudgetInsightEngine=(function(){
  const all=()=>window.TransactionService?.all?.()||[];
  const sum=(list)=>list.reduce((s,t)=>s+Number(t.amount||0),0);
  const calculate=()=>{
    const tx=all();
    const income=sum(tx.filter(t=>['Ingreso','income'].includes(t.type)));
    const expense=sum(tx.filter(t=>['Gasto','expense'].includes(t.type)));
    const saving=sum(tx.filter(t=>['Ahorro','saving'].includes(t.type)));
    const daily=tx.filter(t=>t.type==='Gasto'&&new Date(t.createdAt||Date.now()).toDateString()===new Date().toDateString());
    const dailySpend=sum(daily);
    const usage=Math.round(Math.min(100,expense/4000000*100));
    const risk=usage>80?'ALTO':usage>55?'VIGILAR':'VERDE';
    return{tx,income,expense,saving,net:income-expense,dailySpend,usage,risk};
  };
  const alerts=()=>{
    const k=calculate(), out=[];
    if(!k.tx.length) out.push({kind:'warning',text:'No hay movimientos en el servicio transaccional. Registra el primero para activar las métricas.'});
    if(k.dailySpend>185000) out.push({kind:'warning',text:`Gasto de hoy ${k.dailySpend.toLocaleString('es-CO')} supera el disponible operativo diario.`});
    if(k.usage>55) out.push({kind:'warning',text:`El uso de referencia del presupuesto está en ${k.usage}%. Revisa categorías antes del próximo pago.`});
    if(k.saving===0) out.push({kind:'warning',text:'No hay ahorro registrado en el periodo observado.'});
    if(!out.length) out.push({kind:'good',text:'La operación local está dentro de los umbrales configurados.'});
    return out;
  };
  return{calculate,alerts};
})();