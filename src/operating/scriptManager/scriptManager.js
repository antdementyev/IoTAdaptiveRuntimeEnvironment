var fs = require('fs');
var cluster = require('cluster');
var util = require('util');
var xml2js = require('xml2js');

var applicationConstants = require("../../configuration/applicationConstants");
var testRunner = require("./testRunner");


var ScriptStatus = {RUNNING : 1, WAITING : 0, ERROR : -1};

var installedScripts = [];


function installNewScript(uploadedFilePath) {

    var nameTestScript = extractNameTestScript(uploadedFilePath);

    // save (copy) given script
    var pathToSave = applicationConstants.SCRIPTS_DIRECTORY + nameTestScript[0] + ".xml";
    fs.copyFileSync(uploadedFilePath, pathToSave);
    console.info("Saved new script: " + pathToSave);

    return runScript(nameTestScript);
}

/**
 *  Tests the given script and runs it if the test were successful.
 *  Otherwise returns test errors.
 */
function runScript(nameTestScript) {
    if (!cluster.isMaster) {
        return;
    }

    // run unit tests
    var scriptName = nameTestScript[0];
    var test = nameTestScript[1];
    var testErrors = runTest(scriptName, test);
    if (testErrors) {
        updateScriptStatus(scriptName, ScriptStatus.ERROR);
        return "Error while running test: " + testErrors;
    }

    // tests are successful. run script
    // update list of scripts
    stopRunningScripts();
    updateScriptStatus(scriptName, ScriptStatus.RUNNING);

    console.info("Run script '" + scriptName + "'");
    console.info(getStatusInstalledScripts());

    // setup running
    cluster.setupMaster({ exec: applicationConstants.SCRIPT_EXECUTER });

    // start script executer in new process
    var worker = cluster.fork();
    worker.on("online", () => {
        console.log("Start executing '" + scriptName + "'");
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
            console.error("Error while executing of script " + scriptName);
            newScriptStatus = ScriptStatus.ERROR
        } else {
            // worker success
            newScriptStatus = ScriptStatus.WAITING
        }
        console.info("Finished script executing " + scriptName);
        updateScriptStatus(scriptName, newScriptStatus);
        console.info(getStatusInstalledScripts());
    });

    worker.send(nameTestScript[2]);
}

function runTest(scriptName, test) {
    console.info("Running test for '" + scriptName + "'");
    if (test) {
        var testErrors = testRunner.run(test);
        if (testErrors) {
            var msg = "Error while running test: " + testErrors;
            console.error(msg);
            return testErrors;
        }
    }
    console.info("Test successful");
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

function updateScriptStatus(scriptName, status) {
    for (var i = 0; i < installedScripts.length; i++) {
        if (installedScripts[i].scriptName === scriptName) {
            installedScripts[i].status = status;
            return;
        }
    }

    // current script is new, add it to list
    installedScripts.unshift({ scriptName : scriptName, status : status });   // add to the first position
}

function getStatusInstalledScripts() {
    return "Installed scripts: " + util.inspect(installedScripts).toString();
}

function runScriptByName(scriptNameToRun) {
    // check required script exists
    var isScriptInstalled = false;
    for (var i = 0; i < installedScripts.length; i++) {
        var path = installedScripts[i].scriptName
            .split("/");
        var scriptName = path[path.length - 1]
            .split(".")[0];     // only name without extension
        if (scriptNameToRun === scriptName) {
            isScriptInstalled = true;
            break;
        }
    }
    if (!isScriptInstalled) {
        return "Unknown script name.";
    }

    // run script
    var scriptPath = applicationConstants.SCRIPTS_DIRECTORY + scriptNameToRun + ".xml";
    var nameTestScript = extractNameTestScript(scriptPath);
    var scriptContent = fs.readFileSync(scriptPath, "utf8");
    return runScript(nameTestScript);
}

function stop() {
    stopRunningScripts();
    var installedScriptsStatus = getStatusInstalledScripts();
    console.info(installedScriptsStatus);
    return installedScriptsStatus;
}

function extractNameTestScript(scriptXmlPath) {
    var fileContentXml = fs.readFileSync(scriptXmlPath);

    var contentAsJson = null;
    var parser = new xml2js.Parser();
    parser.parseString(fileContentXml, function(error, result) {       // this call is sync
        if (error) {
            throw error;
        }
        contentAsJson = result;
    });

    var installationScript = contentAsJson.document
        .installationScript[0];

    var scriptName = installationScript.scriptName[0]
        .toString("utf8")
        .trim();

    var test = installationScript.test[0]
        .toString("utf8")
        .trim();

    var script = installationScript.script[0]
        .toString("utf8")
        .trim();

    return [scriptName, test, script];
}

exports.installNewScript = installNewScript;
exports.getStatusInstalledScripts = getStatusInstalledScripts;
exports.runScriptByName = runScriptByName;
exports.stop = stop;
