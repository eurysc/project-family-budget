window.TransactionService=(function(){
const KEY='budget_transactions_v1';
const all=()=>JSON.parse(localStorage.getItem(KEY)||'[]');
const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
function add(type,amount,source,category){
 const tx={id:'tx_'+Date.now(),type,amount:Number(amount||0),source,category,createdAt:new Date().toISOString()};
 const list=all(); list.unshift(tx); save(list); return tx;
}
return {all,add};
})();