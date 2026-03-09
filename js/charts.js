const study = document.getElementById("studyChart")

if(study){

new Chart(study,{

type:"bar",

data:{
labels:["Mon","Tue","Wed","Thu","Fri"],
datasets:[{
label:"Study Hours",
data:[2,1,3,2,4],
backgroundColor:"#6366f1"
}]
}

})

}

const engage = document.getElementById("engagementChart")

if(engage){

new Chart(engage,{

type:"line",

data:{
labels:["0s","30s","60s","90s","120s"],
datasets:[{
label:"Students Watching",
data:[100,80,55,35,20],
borderColor:"#22c55e",
tension:0.4
}]
}

})

}

const perf = document.getElementById("performanceChart")

if(perf){

new Chart(perf,{

type:"pie",

data:{
labels:["High","Medium","Low"],
datasets:[{
data:[50,40,30],
backgroundColor:["#22c55e","#f59e0b","#ef4444"]
}]
}

})

}