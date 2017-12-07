const hal = require("../../hal/hal.js");
var assert = require("assert")

function run(test) {
    try {
        var vm = require("vm");

        var obj = {
            hal : hal,
            assert : assert
        };
        var context = vm.createContext(obj);

        var script = vm.createScript(test);
        script.runInNewContext(context);
    } catch (error) {
        return error.message;
    }
}

exports.run = run;
