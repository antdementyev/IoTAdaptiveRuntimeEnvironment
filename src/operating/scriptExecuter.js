var fs = require('fs');
var hal = require("../hal/hal");
var validator = require("./validation/uploadFileValidator");
var applicationConstants = require("../configuration/applicationConstants");

function start() {
    var fileDirectory = applicationConstants.SCRIPTS_DIRECTORY;
    fs.watch(fileDirectory, function(eventType, changedFile) {

        var filePath = fileDirectory + changedFile;
        if ((eventType === "rename" || eventType === "change")
                && fs.existsSync(filePath)
                && changedFile === "script1.js"
                && !validator.validateScript(filePath)) {

            console.info("Execute '" + filePath + "'");
            var content = fs.readFileSync(fileDirectory + changedFile, 'utf8');
            eval(content);
        }
    });
}

exports.start = start;
