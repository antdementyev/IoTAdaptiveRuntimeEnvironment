var fs = require('fs');
var cluster = require('cluster');

var applicationConstants = require("../../configuration/applicationConstants");


var ScriptStatus = {RUNNING : 1, WAITING : 0, ERROR : -1};

var installedScripts = [];


function installNewScript(scriptName, scriptContent) {
    var scriptPath = applicationConstants.SCRIPTS_DIRECTORY + scriptName + ".js";
    fs.writeFileSync(scriptPath, scriptContent);
    console.info("Saved new script: " + scriptPath);

    runScript(scriptPath, scriptContent);
}

function runScript(scriptPath, scriptContent) {

    if (!cluster.isMaster) {
        return;
    }

    stopRunningScripts();
    // update list of scripts
    installedScripts.unshift({ scriptPath : scriptPath, status : ScriptStatus.RUNNING });   // add to the first position

    // setup running
    cluster.setupMaster({
        exec: applicationConstants.SCRIPT_EXECUTER,
        // args: process.argv.slice(2),
        silent: false
    });

    //This will be fired when the forked process becomes online
    cluster.on("online", function(worker) {
        console.log("starte worker " + worker.process.pid);

        worker.on("message", function(msg) {
            console.log(msg);
            worker.destroy(); //Don't leave him hanging
        });

        worker.on('exit', (code, signal) => {
            console.log("worker is died " + worker.process.pid);
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
        worker.send(scriptContent);
    });

    cluster.fork();
}

function stopRunningScripts() {
    for (var id in cluster.workers) {
        cluster.workers[id].process.kill();
    }

    // update list of scripts
    installedScripts.forEach(scriptEntry => {
        if (scriptEntry.status === ScriptStatus.RUNNING) {
            scriptEntry.status = ScriptStatus.WAITING;
        }
    });
}

exports.installNewScript = installNewScript;
