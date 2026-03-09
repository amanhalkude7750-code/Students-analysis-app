async function loadAnalytics(){

const token = localStorage.getItem("token")

const response = await fetch(
"http://localhost:5000/api/analytics/class-performance",
{
headers:{
Authorization:`Bearer ${token}`
}
})

const data = await response.json()

const ctx = document.getElementById("chart")

new Chart(ctx,{

type:"bar",

data:{
labels:data.students,
datasets:[{
label:"Scores",
data:data.scores
}]
}

})

}

loadAnalytics()