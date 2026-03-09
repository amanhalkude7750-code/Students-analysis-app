const video = document.getElementById("video")

function sendEvent(type){

const event = {

user_id:"1",
course_id:"python",
video_id:"lesson1",
event_type:type,
timestamp:Date.now(),
watch_duration:video.currentTime,
playback_speed:video.playbackRate

}

console.log(event)

}

video.addEventListener("play",()=>sendEvent("play"))
video.addEventListener("pause",()=>sendEvent("pause"))
video.addEventListener("ended",()=>sendEvent("complete"))