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

  applyFilters();

  sendCanvas();
 }

 function applyFilters(){
  let src = cv.imread('canvas');
  let dst = new cv.Mat();
  let dsize = new cv.Size(70, 90);
  cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);
  cv.imshow('canvas', dst);
  src.delete(); dst.delete();

  src = cv.imread('canvas');
  dst = new cv.Mat();
  let low = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
  let high = new cv.Mat(src.rows, src.cols, src.type(), [150, 150, 150, 255]);
  cv.inRange(src, low, high, dst);
  cv.imshow('canvasFilters', dst);
  src.delete(); dst.delete(); low.delete(); high.delete();
  
 }

  setInterval(intervalTimer, 100);


 function sendCanvas(){
      var canvasData = canvasFilters.toDataURL();
      $.post("http://localhost:3000/request",
      {
         dataUrl: canvasData,
      },
      function (data, status) {
        console.log(data);
      });
  }
 

  //setInterval(sendCanvas, 1000);
 