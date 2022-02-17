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
var canvasFilters = document.getElementById('canvasFilters');
var ctx = canvas.getContext('2d');

function intervalTimer() {
  canvas.width = video.videoWidth/2;
  canvas.height = video.videoHeight/2;
   ctx.clearRect(0,0,video.videoWidth,video.videoHeight);
   ctx.drawImage(video,0,0,video.videoWidth,video.videoHeight);
   ctx.save();
   ctx.scale(1, -1);
   ctx.drawImage(video,0,-video.videoHeight,video.videoWidth,video.videoHeight);
   ctx.restore();

   let src = cv.imread('canvas');
  let dst = new cv.Mat();
  let dsize = new cv.Size(70, 90);
  // You can try more different parameters
  cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);
  cv.imshow('canvas', dst);
  src.delete(); dst.delete();

  applyFilters();
 }

 function applyFilters(){
  let src = cv.imread('canvas');
  let dst = new cv.Mat();
  // You can try more different parameters
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
  cv.imshow('canvasFilters', dst);
  src.delete(); dst.delete();
 }

 var myVar = setInterval(intervalTimer, 2);


 function sendCanvas(){
      $.post("http://localhost:3000/request",
      {
         dataUrl: canvasData,
      },
      function (data, status) {
      });
  }
 

  //setInterval(sendCanvas, 1000);
 