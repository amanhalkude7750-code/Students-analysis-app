function login(){

const email = document.getElementById("email").value

if(email.includes("teacher"))
window.location="teacher-dashboard.html"
else
window.location="student-dashboard.html"

}

function signup(){

const role = document.getElementById("role").value

if(role === "teacher")
window.location="teacher-dashboard.html"
else
window.location="student-dashboard.html"

}