const applicationConstants = require("../configuration/applicationConstants");

//The runner.js is ran in a separate process and just listens for the message which contains code to be executed
process.on('message', function(codeToRun) {

    codeToRun = require('fs').readFileSync("../scripts/script1.js");

    var vm = require("vm");

    var obj = { hal : require(applicationConstants.HAL_PATH) };
    var context = vm.createContext(obj);

    var script = vm.createScript(codeToRun);
    script.runInNewContext(context);

    process.send( "finished" ); //Send the finished message to the parent process
});
