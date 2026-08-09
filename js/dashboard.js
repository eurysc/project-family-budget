document.addEventListener("DOMContentLoaded", () => {
  console.log("HorizonOS Financial v0.6.2");

  const checkboxes = document.querySelectorAll(".task-checkbox");
  const progressBar = document.getElementById("taskProgressBar");
  const progressLabel = document.getElementById("taskProgressLabel");
  const progressCount = document.getElementById("taskProgressCount");

  // Si todavía no existe el nuevo Centro de Mando, no hacer nada
  if (!checkboxes.length) return;

  function updateProgress() {
    const total = checkboxes.length;
    const completed = [...checkboxes].filter(cb => cb.checked).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (progressBar) progressBar.style.width = percent + "%";
    if (progressLabel) progressLabel.textContent = percent + "%";
    if (progressCount) {
      progressCount.textContent = `${completed} de ${total} tareas completadas`;
    }

    // Guardar estado
    localStorage.setItem(
      "horizon_tasks",
      JSON.stringify(
        [...checkboxes].map(cb => ({
          id: cb.dataset.task,
          checked: cb.checked
        }))
      )
    );
  }

  // Restaurar estado guardado
  const saved = JSON.parse(localStorage.getItem("horizon_tasks") || "[]");

  checkboxes.forEach(cb => {
    const savedItem = saved.find(item => item.id === cb.dataset.task);
    if (savedItem) cb.checked = savedItem.checked;

    cb.addEventListener("change", updateProgress);
  });

  updateProgress();
});