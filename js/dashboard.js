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