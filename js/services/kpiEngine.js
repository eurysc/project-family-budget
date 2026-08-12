window.KPIEngine={
 calculate(list){
  list=list||window.TransactionService?.all?.()||[];
  const income=list.filter(t=>['income','Ingreso'].includes(t.type)).reduce((s,t)=>s+(+t.amount||0),0);
  const expense=list.filter(t=>['expense','Gasto'].includes(t.type)).reduce((s,t)=>s+(+t.amount||0),0);
  const saving=list.filter(t=>['saving','Ahorro'].includes(t.type)).reduce((s,t)=>s+(+t.amount||0),0);
  return{income,expense,saving,net:income-expense,count:list.length};
 },
 health(list){
  const k=this.calculate(list);
  const usage=k.expense/4000000*100;
  return{...k,usage:Math.round(usage),risk:usage>80?'ALTO':usage>55?'VIGILAR':'VERDE'};
 }
};