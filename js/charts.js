document.addEventListener("DOMContentLoaded", () => {
  if(typeof Chart === "undefined") return;

  const budgetCtx=document.getElementById("budgetChart");
  const projectionCtx=document.getElementById("projectionChart");

  if(budgetCtx){
    new Chart(budgetCtx,{
      type:"doughnut",
      data:{labels:["Ahorro","Alimentación","Vivienda","Educación","Transporte","Otros"],datasets:[{data:[26,17,15,13,5,24],backgroundColor:["#22c55e","#3b82f6","#f59e0b","#8b5cf6","#06b6d4","#64748b"],borderColor:"#0f1b2e",borderWidth:3}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:"62%",plugins:{legend:{position:"bottom",labels:{color:"#b5c7dd",boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:c=>`${c.label}: ${c.parsed}%`}}}}
    });
  }

  if(projectionCtx){
    new Chart(projectionCtx,{
      type:"line",
      data:{labels:["Hoy","6m","12m","18m","24m"],datasets:[
        {label:"Base",data:[18.2,22.1,28.3,36.8,45.7],borderColor:"#60a5fa",backgroundColor:"rgba(96,165,250,.08)",fill:true,tension:.34,pointRadius:3},
        {label:"Acelerado",data:[18.2,24.5,32.7,42.5,55.1],borderColor:"#22c55e",backgroundColor:"rgba(34,197,94,.06)",fill:true,tension:.34,pointRadius:3},
        {label:"Protegido",data:[18.2,23.1,30.1,38.7,49.2],borderColor:"#f59e0b",backgroundColor:"rgba(245,158,11,.05)",fill:true,tension:.34,pointRadius:3}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top",labels:{color:"#b5c7dd",usePointStyle:true,font:{size:10}}}},scales:{x:{ticks:{color:"#7f97b3"},grid:{color:"#1a2a42"}},y:{ticks:{color:"#7f97b3",callback:v=>`$${v}M`},grid:{color:"#1a2a42"}}}}
    });
  }
});