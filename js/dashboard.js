document.addEventListener("DOMContentLoaded", () => {

  const checkboxes = [...document.querySelectorAll(".task-checkbox")];

  const bar = document.getElementById("taskProgressBar");

  const label = document.getElementById("taskProgressLabel");

  const count = document.getElementById("taskProgressCount");

  if(!checkboxes.length || !bar || !label || !count) return;



  function update(){

    const done=checkboxes.filter(c=>c.checked).length;

    const total=checkboxes.length;

    const pct=total?Math.round(done/total*100):0;

    bar.style.width=pct+"%";

    label.textContent=pct+"%";

    count.textContent=`${done} de ${total} tareas completadas`;

    localStorage.setItem("h55x_budget_tasks_s06",JSON.stringify(checkboxes.map(c=>({id:c.dataset.task,checked:c.checked}))));

  }

  checkboxes.forEach(c=>c.addEventListener("change",update));

  update();

});
/* S07 task persistence + command signal */
window.H55XDashboard={
  completion(){
    const all=[...document.querySelectorAll('.task-checkbox')];
    return all.length?Math.round(all.filter(x=>x.checked).length/all.length*100):0;
  },
  focusTask(id){
    const el=document.querySelector(`.task-checkbox[data-task="${id}"]`);
    if(el){el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));}
  }
};

/* ===== S08 dashboard telemetry ===== */
(function(){
  const ready=()=>{
    const el=document.getElementById('taskProgressLabel');
    if(!el)return;
    const tasks=[...document.querySelectorAll('.task-checkbox')];
    const done=tasks.filter(t=>t.checked).length;
    const pct=tasks.length?Math.round(done/tasks.length*100):0;
    el.textContent=`${pct}%`;
  };
  document.addEventListener('change',e=>{if(e.target.matches('.task-checkbox'))ready();});
  setTimeout(ready,80);
})();
