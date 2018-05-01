const hal = require("../../hal/hal.js");

//The script executer runs in a separate process and just listens for the message which contains code to be executed
process.on('message', function(codeToRun) {

    var vm = require("vm");

    var obj = { hal : hal, console };
    var context = vm.createContext(obj);

    var script = vm.createScript(codeToRun);
    script.runInNewContext(context);

    // let the parent process know if script is finished
    process.send("finished");
});
