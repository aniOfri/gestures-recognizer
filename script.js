$(document).ready(function () {
    $("#submit").click(function () {
      sendCanvas();
    });
 });

 var video = document.querySelector("#videoElement");

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
       console.log(stream     )
      video.srcObject = stream;
    })
    .catch(function (err0r) {
      console.log("Something went wrong!");
    });
}

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

function intervalTimer() {
   ctx.clearRect(0,0,400,400);
   ctx.drawImage(video,0,0,400,400);
 
 }
 var myVar = setInterval(intervalTimer, 1000);


 function sendCanvas(){
      $.post("http://localhost:3000/request",
      {
         dataUrl: canvasData,
      },
      function (data, status) {
      });
  }
 
  //setInterval(sendCanvas, 1000);
 