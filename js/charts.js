document.addEventListener("DOMContentLoaded", () => {
  const budgetCtx = document.getElementById("budgetChart");
  if (budgetCtx) {
    new Chart(budgetCtx, {
      type: "pie",
      data: {
        labels: [
          "Ahorro",
          "Alimentación",
          "Vivienda",
          "Educación",
          "Transporte",
          "Otros"
        ],
        datasets: [{
          data: [26, 17, 15, 13, 5, 24],
          backgroundColor: [
            "#22c55e",
            "#3b82f6",
            "#f59e0b",
            "#8b5cf6",
            "#06b6d4",
            "#64748b"
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom", labels: { color: "#e5e7eb" } }
        }
      }
    });
  }

  const projectionCtx = document.getElementById("projectionChart");
  if (projectionCtx) {
    new Chart(projectionCtx, {
      data: {
        labels: ["Hoy", "6m", "12m", "18m", "24m"],
        datasets: [
          {
            type: "bar",
            label: "Patrimonio real",
            data: [12.3, 18.5, 26.2, 34.8, 44.1],
            backgroundColor: "#22c55e"
          },
          {
            type: "line",
            label: "Patrimonio estimado",
            data: [12.3, 20.1, 29.8, 40.7, 52.8],
            borderColor: "#3b82f6",
            borderWidth: 3,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#e5e7eb" } }
        },
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { color: "#243244" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "#243244" } }
        }
      }
    });
  }
});