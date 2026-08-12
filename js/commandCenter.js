window.BudgetCommandCenter={
  tasks(){
    const spend=document.querySelector('#kpiLiquidity')?.textContent||'';
    return spend ? ['Revisar liquidez','Actualizar presupuesto','Revisar TDC'] : ['Registrar primer movimiento'];
  },
  summary(){
    return {available:185000,nextPayment:'Nu Mastercard',autonomyDays:17};
  }
};