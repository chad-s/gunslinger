var app = require('express')();
var http = require('http').Server(app);   // This is the server object
var io = require('socket.io')(http);

var fs = require('fs');                   // For camera
var path = require('path');
var express = require('express');

var spawn = require('child_process').spawn;
var proc1;
var proc2;

var SERVO_PATH = '/dev/servoblaster';
var SERVO_MIN = 60;
var SERVO_MAX = 250;
var PAN_PIN = 0;
var TIL_PIN = 1;


var servoPan = 150;
var servoTil = 60;

app.use('/', express.static(path.join(__dirname, 'stream')));

// Send client index.html
app.get('/', function(req, res) {
   res.sendFile(__dirname + '/index.html');
});

// Do this when a client connects
io.on('connection', function(socket) {

   console.log('a user conected');

   // Stop things when users disconnect
   socket.on('disconnect', function() {
      stopStreaming();
      console.log('user disconnected');
   });

   // Receive and print gyro data
   socket.on('fromclient', function(data) {
      //servos.setServo(0, 100);
      console.log('Some data.......');
      console.log('Alpha: ' + data.alpha);
      console.log('Beta:  ' + data.beta);
      console.log('Gamma: ' + data.gamma);
   });

   socket.on('startStream', function() {
      startStreaming(io);
   });

});

// Listen for clients on http://localhost:3000
http.listen(3000, function() {
   console.log('listening on *:3000');
});


// Stop streaming an image
function stopStreaming()
{
   app.set('watchingFile', false);
   if (proc1) proc1.kill();
   if (proc2) proc2.kill();
   fs.unwatchFile('./stream/image_stream.jpg');
}

// Stream an image
function startStreaming(io)
{
 
   if (app.get('watchingFile'))
   {
      io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
      return;
   }
 
   //var args = ["-w", "568", "-h", "340", "-o", "./stream/image_stream.jpg", "-t", "999999999", "-tl", "2000", "-q", "30", "-vf", "-hf"];
   //proc1 = spawn('raspistill', args);
   proc2 = spawn('./servod');
 
   console.log('Watching for changes...');
 
   app.set('watchingFile', true);
 
   fs.watchFile('./stream/image_stream.jpg', function(current, previous) {
      io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
   });
 
}

function writeServo(cmd)
{
   var buffer = new Buffer(cmd + '\n');

   var fd = fs.open(SERVO_PATH, 'w', undefined, function(err, fd) {
      if (err) console.log('Error opening file:' + err);
      else
      {
         fs.write(fd, buffer, 0, buffer.length, -1, function(error, written, buffer) {
            if (error)
            {
               console.log("Error occured writing to " + PI_BLASTER_PATH + ": " + error);
            }
            else
            {
               fs.close(fd);
            }
         });
      }
   });
}

var servos = {
   setServo: function(pinNumber, value) {
      writeServo(pinNumber + '=' + value);
   }
};
