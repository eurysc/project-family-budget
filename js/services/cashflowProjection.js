window.CashflowProjection={
project(transactions){
 let balance=0;
 (transactions||[]).forEach(t=>{balance += t.type==='income'?Number(t.amount||0):-Number(t.amount||0);});
 return {today:balance,week:balance,month:balance};
}
};