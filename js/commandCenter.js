window.BudgetCommandCenter={
  tasks(){
    const spend=document.querySelector('#kpiLiquidity')?.textContent||'';
    return spend ? ['Revisar liquidez','Actualizar presupuesto','Revisar TDC'] : ['Registrar primer movimiento'];
  },
  summary(){
    return {available:185000,nextPayment:'Nu Mastercard',autonomyDays:17};
  }
};
/* S07 */
window.BudgetCommandCenter={
  tasks(){return[
    {id:'liquidity',label:'Revisar liquidez semanal',priority:'alta'},
    {id:'budget',label:'Actualizar presupuesto',priority:'media'},
    {id:'card',label:'Revisar TDC',priority:'alta'}
  ];},
  summary(){return{available:185000,nextPayment:'Nu Mastercard',autonomyDays:17};},
  score(){return 78;}
};
