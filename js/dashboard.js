async function loadProgress(){

const token = localStorage.getItem("token")

const response = await fetch(
"http://localhost:5000/api/student/progress",
{

headers:{
Authorization:`Bearer ${token}`
}

})

const data = await response.json()

document.getElementById("progress").style.width =
data.progress + "%"

}

loadProgress()