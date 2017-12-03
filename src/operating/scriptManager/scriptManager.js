var fs = require('fs');
var cluster = require('cluster');

var applicationConstants = require("../../configuration/applicationConstants");

var installedScripts;


function installNewScript(scriptName, scriptContent) {
    var scriptPath = applicationConstants.SCRIPTS_DIRECTORY + scriptName + ".js";
    fs.writeFileSync(scriptPath, scriptContent);
    console.info("Saved new script: " + scriptPath);

    runScript(scriptContent);
}

function runScript(script) {
    // stop all running scripts
    for (var id in cluster.workers) {
        cluster.workers[id].process.kill();
    }

    // setup running
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

        //Send the code to run for the worker
        worker.send(script);
    });

    cluster.fork();
}


exports.installNewScript = installNewScript;
