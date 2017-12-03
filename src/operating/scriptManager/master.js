var cluster = require('cluster');

cluster.setupMaster({
    exec: "scriptExecuter.js",
    args: process.argv.slice(2),
    silent: false
});


//This will be fired when the forked process becomes online
cluster.on("online", function(worker) {
    var timer = 0;

    worker.on("message", function(msg) {
        clearTimeout(timer); //The worker responded in under 5 seconds, clear the timeout
        console.log(msg);
        worker.destroy(); //Don't leave him hanging

    });
    worker.on('exit', (code, signal) => {
        if (signal) {
            console.log(`worker was killed by signal: ${signal}`);
        } else if (code !== 0) {
            console.log(`worker exited with error code: ${code}`);
        } else {
            console.log('worker success!');
        }
        console.log(worker.isDead());
    });
    timer = setTimeout(function() {
        worker.process.kill()
        console.log("worker timed out");
        console.log(worker.isDead());
    }, 2000);

    worker.send('while(true){}'); //Send the code to run for the worker
});

cluster.fork();
