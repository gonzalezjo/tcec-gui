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
var _ = require('lodash');
var lastPgnTime = Date.now();

const pid = process.pid;

if (typeof process.argv[2] == 'undefined')
{
   portnum = 8080;
}
else
{
   portnum = process.argv[2];
}

console.log ("Port is " + portnum);

// first parameter is the mount point, second is the location in the file system
var app = express();
app.use(express.static(__dirname));
var server = require('http').createServer(app);  
server.listen(parseInt(portnum));
var listener = io.listen(server);                                                                                                                                                                                                             

var watcher = chokidar.watch('crosstable.json', {
      persistent: true,
      ignoreInitial: false,
      followSymlinks: true,
      disableGlobbing: false,
      usePolling: true,
      interval: 100,
      binaryInterval: 100,
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

var count = 0;
var socket = 0;
var totalCount = 0;

listener.sockets.on('connection', function(s){
   socket = s;
   count ++;
   if (totalCount < count)
   {
      totalCount = count;
   }
   socket.emit('users', {'count': totalCount});
   socket.broadcast.emit('users', {'count': totalCount});
   console.log ("coutn connected:" + count);

   socket.on('disconnect', function(){
       count--;
       socket.broadcast.emit('users', {'count': totalCount});
   });

   //recieve client data
   socket.on('getLastmovetime', function(data){
      socket.broadcast.emit('lastpgntime', lastPgnTime);
      process.stdout.write('req came' + lastPgnTime);
   });

});

var liveChartInterval = setInterval(function() { process.send({'workers': count}) }, 15000);

function broadCastData(socket, message, file, currData, prevData)
{
   var a = JSON.stringify(currData);
   var b = JSON.stringify(prevData);

   if (a == b)
   {
      console.log ("File "+ file + " did not change:");
      return;
   }
   socket.broadcast.emit(message, currData); 
}

function checkSend(currData, prevData)
{
   var a = JSON.stringify(currData);
   var b = JSON.stringify(prevData);

   if (a == b)
   {
      console.log ("File "+ file + " did not change:");
      return 0;
   }                    
   else
   {
      return 1;
   }
}

/* Deltapgn: Configure this to less value for less data */
var numMovesToSend = 4;

function getDeltaPgn(pgnX)
{
   var pgn = {};
   var count = 0;
   console.log ("came here");

   if (prevData && JSON.stringify(prevData.Headers) != JSON.stringify(pgnX.Headers))
   {
      pgnX.gameChanged = 1;
      return pgnX;
   }
   pgnX.gameChanged = 0;
   
   console.log ("Found prev data");

  var keys = _.keys(pgnX);
  _.each(keys, function(index, key) {
      if (index != "Moves")
      { 
         pgn[index] = pgnX[index];
      }
      else
      {
         console.log ("Noy copying moves");
      }
  });

   pgn.Moves = [];
   _.eachRight(pgnX.Moves, function(move, key) {
      pgn.Moves[key] = {};
      if (count <= numMovesToSend)
      {
         pgn.Moves[key]= pgnX.Moves[key];
         pgn.Moves[key].Moveno = key + 1;
         pgn.lastMoveLoaded = key;
         console.log ("Setting pgn.lastMoveLoaded to " + pgn.lastMoveLoaded);
      }
      else
      {
         pgn.Moves[key].Moveno = 0;
      }
      count = count + 1;
   });

   return pgn;
}


var prevData = 0;
var prevliveData = 0;
var prevevalData = 0;
watcher.on('change', (path, stats) => {
   console.log ("path changed:" + path + ",count is " + count);
   if (!socket)
   {
      return;
   }
   var content = fs.readFileSync(path, "utf8");
   try 
   {
      var data = JSON.parse(content);
      if (path.match(/data.json/))
      {
         broadCastData(socket, 'liveeval', path, data, prevliveData);
         prevliveData = data;
      }
      if (path.match(/liveeval.json/))
      {
         broadCastData(socket, 'livechart', path, data, prevevalData);
         prevevalData = data;
      }
      if (path.match(/live.json/))
      {
         console.log ("json changed");
         var delta = {};
         var changed = checkSend(data, prevData);
         if (changed)
         {
            delta = getDeltaPgn(data, prevData);
            //broadCastData(socket, 'pgn', path, delta, delta);
            socket.emit('pgn', delta); 
            socket.broadcast.emit('pgn', delta); 
            console.log ("Sent pgn data:" + JSON.stringify(delta).length + ",orig" + JSON.stringify(data).length + ",changed" + delta.gameChanged);
            lastPgnTime = Date.now(); 
         }
         prevData = data;
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
