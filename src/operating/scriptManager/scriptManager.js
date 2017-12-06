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

    // update list of scripts
    stopRunningScripts();
    setScriptToRun(scriptPath);

    console.info("Installed scripts: " + util.inspect(installedScripts));

    // setup running
    cluster.setupMaster({ exec: applicationConstants.SCRIPT_EXECUTER });

    // start script executer in new process
    var worker = cluster.fork();
    worker.on("online", () => {
        console.log("Start executing '" + scriptPath + "'");
    });

    worker.on("message", (msg) => {
        // worker finished, don't leave worker hanging
        worker.destroy();
    });

    worker.on("exit", (code, signal) => {
        var newScriptStatus;
        if (signal) {
            // ok, worker was killed by signal
            newScriptStatus = ScriptStatus.WAITING
        } else if (code !== 0) {
            // error while script executing
            console.error("Error while executing of script " + scriptPath);
            newScriptStatus = ScriptStatus.ERROR
        } else {
            // worker success
            newScriptStatus = ScriptStatus.WAITING
        }
        console.info("Finished script executing " + scriptPath);
        updateScriptStatus(scriptPath, newScriptStatus);
        console.info(getStatusInstalledScripts());
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

function setScriptToRun(scriptPath) {
    // update state if script is already known
    for (var i = 0; i < installedScripts.length; i++) {
        if (installedScripts[i].scriptPath === scriptPath) {
            installedScripts[i].status = ScriptStatus.RUNNING;
            return;
        }
    }

    // current script is new, add it to list
    installedScripts.unshift({ scriptPath : scriptPath, status : ScriptStatus.RUNNING });   // add to the first position
}

function updateScriptStatus(scriptPath, status) {
    for (var i = 0; i < installedScripts.length; i++) {
        if (installedScripts[i].scriptPath === scriptPath) {
            installedScripts[i].status = status;
            break;
        }
    }
}

function getStatusInstalledScripts() {
    return "Installed scripts: " + util.inspect(installedScripts).toString();
}

function runScriptByName(scriptNameToRun) {
    // check required script exists
    var scriptPath = null;
    for (var i = 0; i < installedScripts.length; i++) {
        var path = installedScripts[i].scriptPath
            .split("/");
        var scriptName = path[path.length - 1];
        if (scriptNameToRun === scriptName) {
            scriptPath = installedScripts[i].scriptPath;
            break;
        }
    }
    if (scriptPath === null) {
        return "Unknown script name.";
    }

    // run script
    var scriptContent = fs.readFileSync(scriptPath, "utf8");
    runScript(scriptPath, scriptContent);
    return "Run '" + scriptPath + "'. " + getStatusInstalledScripts();
}

function stop() {
    stopRunningScripts();
    var installedScriptsStatus = getStatusInstalledScripts();
    console.info(installedScriptsStatus);
    return installedScriptsStatus;
}

exports.installNewScript = installNewScript;
exports.getStatusInstalledScripts = getStatusInstalledScripts;
exports.runScriptByName = runScriptByName;
exports.stop = stop;
