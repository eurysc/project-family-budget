document.addEventListener("DOMContentLoaded", () => {
  // ============================
  // PIE CHART - PRESUPUESTO
  // ============================
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
        datasets: [
          {
            data: [26, 17, 15, 13, 5, 24],
            backgroundColor: [
              "#22c55e",
              "#3b82f6",
              "#f59e0b",
              "#8b5cf6",
              "#06b6d4",
              "#64748b"
            ],
            borderColor: "#0b1220",
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: 10
        },
        plugins: {
          // Eliminamos completamente la leyenda superior
          legend: {
            display: false
          },

          // Tooltip
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed || 0;
                return `${label}: ${value}%`;
              }
            }
          },

          // Etiquetas sobre cada porción
          datalabels: {
            color: "#ffffff",
            formatter: function (value, context) {
              const label = context.chart.data.labels[context.dataIndex];
              return `${label}\n${value}%`;
            },
            font: {
              weight: "bold",
              size: 12
            },
            textAlign: "center",
            anchor: "center",
            align: "center",
            clamp: true
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // ============================
  // PROYECCIÓN PATRIMONIAL
  // ============================
  const projectionCtx = document.getElementById("projectionChart");

  if (projectionCtx) {
    new Chart(projectionCtx, {
      type: "line",
      data: {
        labels: ["Hoy", "6m", "12m", "18m", "24m"],
        datasets: [
          {
            label: "Estimado",
            data: [12.3, 20.1, 29.8, 40.7, 52.8],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.15)",
            borderWidth: 3,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
          },
          {
            label: "Cumplimiento",
            data: [12.3, 18.5, 26.2, 34.8, 44.1],
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,0.15)",
            borderWidth: 3,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#e5e7eb",
              usePointStyle: true,
              pointStyle: "line"
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "#94a3b8"
            },
            grid: {
              color: "#243244"
            }
          },
          y: {
            ticks: {
              color: "#94a3b8",
              callback: function (value) {
                return "$" + value + "M";
              }
            },
            grid: {
              color: "#243244"
            }
          }
        }
      }
    });
  }
});