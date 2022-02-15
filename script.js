$(document).ready(function () {
    $("#submit").click(function () {
      sendCanvas();
    });
 });


 function sendCanvas(){
      $.post("http://localhost:3000/request",
      {
         dataUrl: canvasData,
      },
      function (data, status) {
      });
  }
 
  setInterval(sendCanvas, 1000);
 