const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) 
{
   const cpus = os.cpus().length;
   var count = 0;
   for (let i = 0; i<1; i++) 
   {
      console.log(`Forking for ${cpus} CPUs`);
      var worker = cluster.fork();
      count = 0;
      worker.on('message', function(msg) 
      {
         //console.log('Master ' + process.pid + ' received message from worker ' + msg.workers + ",count:" + count);
         if (typeof msg.workers != 'undefined')
         {
            count = parseInt(count) + parseInt(msg.workers);
         }
      });
   }
  
   function eachWorker(callback) 
   {
      for (const id in cluster.workers) 
      {
         console.log("Calling callback for id:" + id + ",count:" + count);
         //callback(cluster.workers[id]);
      }
   }

   const updateWorkers = () => {
     eachWorker(worker => {
       if (count > 0)
       {
          worker.send({'count':count});
       }
     });
     count = 0;
   };
   
   updateWorkers();
   setInterval(updateWorkers, 10000);

   cluster.on('exit', (worker, code, signal) => 
   {
      if (code !== 0 && !worker.exitedAfterDisconnect) 
      {
         console.log(`Worker ${worker.id} crashed. ` +
            'Starting a new worker...');
         cluster.fork();
      }
   });
} 
else 
{
   require('./server');
}

