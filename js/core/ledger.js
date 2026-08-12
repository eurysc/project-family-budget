window.HorizonLedger=(function(){const K='horizon_ledger';
const all=()=>JSON.parse(localStorage.getItem(K)||'[]');
const save=x=>localStorage.setItem(K,JSON.stringify(x));
const add=t=>{const a=all();t.id='tx_'+Date.now();a.push(t);save(a);return t;};
return{all,add};})();