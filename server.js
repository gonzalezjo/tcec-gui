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

function updateCrosstable()
{
   var content = fs.readFileSync("crosstable.json");
   return content;
}

var server = require('http').createServer(app);  
server.listen(3001);
var listener = io.listen(server);
console.log ("__dirname:" + __dirname);

   //send data to client
var lastPgnTime = Date.now();

var count = 0;
listener.sockets.on('connection', function(socket){
   count ++;
   socket.broadcast.emit('users', { count: count });

   socket.on('disconnect', function(){
       count--;
       socket.broadcast.emit('users', { count: count });
   });
   console.log ("__dirname:" + count);
   var callback = function(err, contents) {
      console.log(contents);
      return contents;
   }

   var watcher = chokidar.watch('crosstable.json', {
      persistent: true,
      ignoreInitial: false,
      followSymlinks: true,
      disableGlobbing: false,
      usePolling: true,
      interval: 100,
      binaryInterval: 300,
      alwaysStat: false,
      depth: 99,
      //awaitWriteFinish: {
        //stabilityThreshold: 2000,
        //pollInterval: 100
      //}
      //atomic: true // or a custom 'atomicity delay', in milliseconds (default 100)
   });

   var liveeval = 'data.json';
   var ctable = 'crosstable.json';
   watcher.add(liveeval);
   watcher.add('live.json');
   watcher.add('schedule.json');
   watcher.add('liveeval.json');
   var log = console.log.bind(console);

   watcher.on('change', (path, stats) => {
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
            //console.log ("path changed:" + path);
            socket.broadcast.emit('livechart', data);
         }
         if (path.match(/live.json/))
         {
            //console.log ("path changed:" + path);
            socket.broadcast.emit('pgn', data);
            lastPgnTime = Date.now(); 
         }
         if (path.match(/crosstable/))
         {
            //console.log ("cross path changed:" + path);
            socket.broadcast.emit('crosstable', data);
         }
         if (path.match(/schedule/))
         {
            //console.log ("sched path changed:" + path);
            socket.broadcast.emit('schedule', data);
         }
      }
      catch (error) 
      {
         console.log ("error: " + error);
         return;
      }
   });

   //recieve client data
   socket.on('getLastmovetime', function(data){
      //socket.emit('lastpgntime', lastPgnTime);
      process.stdout.write('req came' + lastPgnTime);
   });
});

