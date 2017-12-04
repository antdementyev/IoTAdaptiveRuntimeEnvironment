const hal = require("../../hal/hal.js");

//The runner.js is ran in a separate process and just listens for the message which contains code to be executed
process.on('message', function(codeToRun) {

    var vm = require("vm");

    var obj = { hal : hal };
    var context = vm.createContext(obj);

    var script = vm.createScript(codeToRun);
    script.runInNewContext(context);

    process.send("finished"); //Send the finished message to the parent process
});
