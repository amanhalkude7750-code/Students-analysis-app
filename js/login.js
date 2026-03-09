function login(){

const email = document.getElementById("email").value

if(email.includes("teacher"))
window.location = "teacher.html"
else
window.location = "dashboard.html"

}