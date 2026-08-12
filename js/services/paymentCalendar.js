window.PaymentCalendar=(function(){
const KEY='budget_payment_calendar_v1';
const all=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const add=item=>{const x={id:'p_'+Date.now(),status:'pending',...item};const list=all();list.push(x);localStorage.setItem(KEY,JSON.stringify(list));return x};
const complete=id=>{const list=all().map(x=>x.id===id?{...x,status:'paid',paidAt:new Date().toISOString()}:x);localStorage.setItem(KEY,JSON.stringify(list));return list};
const upcoming=()=>all().filter(x=>x.status!=='paid').sort((a,b)=>String(a.date).localeCompare(String(b.date)));
return{all,add,complete,upcoming};
})();