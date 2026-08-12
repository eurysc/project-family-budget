window.TransactionService=(function(){
const KEY='budget_transactions_v1';
const normalize=t=>({...t,amount:Number(t.amount||0),createdAt:t.createdAt||new Date().toISOString()});
const all=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]').map(normalize)}catch{return[]}};
const save=list=>localStorage.setItem(KEY,JSON.stringify(list));
const add=(type,amount,source,category,merchant,notes)=>{
 const tx=normalize({id:'tx_'+Date.now()+'_'+Math.random().toString(16).slice(2),type,amount,source,category,merchant,notes});
 const list=all();list.unshift(tx);save(list);window.HorizonBus?.emit?.('transaction.added',tx);return tx;
};
const remove=id=>save(all().filter(t=>t.id!==id));
const byType=type=>all().filter(t=>t.type===type);
const totals=()=>all().reduce((a,t)=>{const k=t.type||'other';a[k]=(a[k]||0)+t.amount;return a},{});
return{all,save,add,remove,byType,totals};
})();