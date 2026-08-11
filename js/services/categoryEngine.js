window.CategoryEngine=(function(){
const DEFAULTS={Alimentacion:1200000,Transporte:600000,Entretenimiento:500000,Servicios:800000};
function budgets(){return JSON.parse(localStorage.getItem('budget_category_budgets')||JSON.stringify(DEFAULTS));}
function usage(transactions){
 const totals={};
 (transactions||[]).forEach(t=>{const c=t.category||'SinCategoria';totals[c]=(totals[c]||0)+Number(t.amount||0);});
 return totals;
}
return {budgets,usage};
})();