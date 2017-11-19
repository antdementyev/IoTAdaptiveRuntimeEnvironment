var fs = require('fs');
var path = require('path');

var xml2js = require('xml2js');
var hal = require("../hal/hal");

function start() {
    var filePath = "./tmp/script.xml";
    var fileDirectory = path.dirname(filePath);
    var fileName = path.basename(filePath);

    fs.watch(fileDirectory, function(eventType, changedFile) {
        if ((eventType === "rename" || eventType === "change")
                && changedFile === fileName && fs.existsSync(filePath)) {

            var content = fs.readFileSync(filePath);

            var parser = new xml2js.Parser();
            parser.parseString(content, function(err, result) {
                var scriptToCall = result.installationScript.script[0];
                console.dir(scriptToCall);
                eval(scriptToCall);
            });
        }
    });
}

exports.start = start;
