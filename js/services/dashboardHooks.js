window.BudgetDashboardHooks={
recalculate(){
 const tx=(window.TransactionService?TransactionService.all():[]);
 return {
   income: tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),
   expense: tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0),
   transactions: tx.length
 };
}
};