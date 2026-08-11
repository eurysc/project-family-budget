window.PaymentCalendar=(function(){
const KEY='budget_payment_calendar_v1';
const all=()=>JSON.parse(localStorage.getItem(KEY)||'[]');
const add=(item)=>{const list=all();list.push(item);localStorage.setItem(KEY,JSON.stringify(list));};
return {all,add};
})();