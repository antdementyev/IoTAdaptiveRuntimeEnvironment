var fs = require('fs');
var cluster = require('cluster');
var util = require('util');

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
    console.info("Installed scripts: " + util.inspect(installedScripts));

    // setup running
    cluster.setupMaster({ exec: applicationConstants.SCRIPT_EXECUTER });

    // start script executer in new process
    var worker = cluster.fork();
    worker.on("online", () => {
        console.log("Start executing '" + scriptPath + "'");
    });

    worker.on("message", (msg) => {
        // worker finished, update list of scripts
        console.info("Script '" + scriptPath + "' finished.");
        updateScriptStatus(scriptPath, ScriptStatus.WAITING);
        worker.destroy();   // don't leave worker hanging
    });

    worker.on("exit", (code, signal) => {
        console.info("Finished script executing " + scriptPath);
        if (signal) {
            // ok, worker was killed by signal
        } else if (code !== 0) {
            // error while script executing
            console.error("Error while executing of script " + scriptPath);
            updateScriptStatus(scriptPath, ScriptStatus.ERROR);
        } else {
            // worker success
        }
        console.info("Installed scripts: " + util.inspect(installedScripts));
    });

    worker.send(scriptContent);
}

function stopRunningScripts() {
    for (var id in cluster.workers) {
        cluster.workers[id].process.kill();
        cluster.workers[id].kill();
    }

    // update list of scripts
    installedScripts.forEach(scriptEntry => {
        if (scriptEntry.status === ScriptStatus.RUNNING) {
            scriptEntry.status = ScriptStatus.WAITING;
        }
    });
}

function updateScriptStatus(scriptPath, status) {
    for (var i = 0; i < installedScripts.length; i++) {
        if (installedScripts[i].scriptPath === scriptPath) {
            installedScripts[i].status = status;
            break;
        }
    }
}

exports.installNewScript = installNewScript;
