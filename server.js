var http = require("http");
var url = require('url');
var fs = require('fs');
var io = require('socket.io');
var express = require('express');
var app = express();
var path = require('path');
const md5 = require('md5');
const axios = require('axios');
var chokidar = require('chokidar');

const pid = process.pid;

// first parameter is the mount point, second is the location in the file system
var app = express();
app.use(express.static(__dirname));

if (typeof process.argv[2] == 'undefined')
{
   portnum = 8080;
}
else
{
   portnum = process.argv[2];
}

console.log ("Port is " + portnum);

var server = require('http').createServer(app);  
server.listen(parseInt(portnum));
var listener = io.listen(server);

   //send data to client
var lastPgnTime = Date.now();

var watcher = chokidar.watch('json/crosstable.json', {
      persistent: true,
      ignoreInitial: false,
      followSymlinks: true,
      disableGlobbing: false,
      usePolling: true,
      interval: 1000,
      binaryInterval: 1000,
      alwaysStat: false,
      depth: 99,
      //awaitWriteFinish: {
        //stabilityThreshold: 2000,
        //pollInterval: 100
      //}
      //atomic: true // or a custom 'atomicity delay', in milliseconds (default 100)
});
var liveeval = 'json/data.json';
var ctable = 'json/crosstable.json';
watcher.add(liveeval);
watcher.add('json/live.json');
watcher.add('json/schedule.json');
watcher.add('json/liveeval.json');

var count = 0;
var socket = '';
var totalCount = 0;

listener.sockets.on('connection', function(s){
   socket = s;
   count ++;
   if (totalCount < count)
   {
      totalCount = count;
   }
   socket.broadcast.emit('users', {'count': totalCount});

   socket.on('disconnect', function(){
       count--;
       socket.broadcast.emit('users', {'count': totalCount});
   });

   //recieve client data
   socket.on('getLastmovetime', function(data){
      socket.emit('lastpgntime', lastPgnTime);
      process.stdout.write('req came' + lastPgnTime);
   });

});

var liveChartInterval = setInterval(function() { process.send({'workers': count}) }, 15000);

watcher.on('change', (path, stats) => {
   console.log ("path changed:" + path + ",count is " + count);
   var content = fs.readFileSync(path, "utf8");
   try 
   {
      var data = JSON.parse(content);
      if (path.match(/data/))
      {
         socket.broadcast.emit('liveeval', data);
      }
      if (path.match(/liveeval.json/))
      {
         socket.broadcast.emit('livechart', data);
      }
      if (path.match(/live.json/))
      {
         socket.broadcast.emit('pgn', data);
         lastPgnTime = Date.now(); 
      }
      if (path.match(/crosstable/))
      {
         socket.broadcast.emit('crosstable', data);
      }
      if (path.match(/schedule/))
      {
         socket.broadcast.emit('schedule', data);
      }
   }
   catch (error) 
   {
      console.log ("error: " + error);
      return;
   }
});

 process.on('message', function(msg) {
    //console.log('Worker ' + process.pid + ' received message from master.', JSON.stringify(msg));
    totalCount = parseInt(msg.count);
});
