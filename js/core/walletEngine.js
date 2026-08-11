window.WalletEngine={totalLiquidity(){return HorizonLedger.all().reduce((s,t)=>{
if(t.type==='income') return s+Number(t.amount||0);
if(t.type==='expense' && !['Nu Mastercard','BBVA Visa'].includes(t.source)) return s-Number(t.amount||0);
return s;},0);}};