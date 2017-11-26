var fs = require('fs');
var path = require('path');
var libxmljs = require('libxmljs');
var xml2js = require('xml2js');
var exec = require("child_process").execSync;
var applicationConstants = require("../../configuration/applicationConstants");


/**
 * Validates the given XML file and saves the contained script
 * or returns a possible validation error.
 */
function validateAndSaveScriptFrom(filePath) {
    try {
        var validationError = validateFile(filePath);
        if (validationError) {
            return validationError;
        }

        var fileContent = fs.readFileSync(filePath);
        validationError = validateXmlContent(fileContent);
        if (validationError) {
            return validationError;
        }

        var script = extractScript(fileContent);
        validationError = validateScriptSyntax(script);
        if (validationError) {
            return validationError;
        }

        var scriptPath = saveScript(applicationConstants.SCRIPTS_DIRECTORY, script);
        console.info("Saved new script: " + scriptPath);

    } catch (error) {
        console.error("Exception while upload file validation: " + error);
        return error.message;
    }
}

function validateFile(filePath) {
    if ((typeof filePath === 'undefined') || !fs.existsSync(filePath)) {
        return "File does not exist.";
    }

    var extension = path.extname(filePath);
    if (applicationConstants.UPLOAD_ALLOWED_EXTENSIONS.indexOf(extension) == -1) {
        return "File type " + extension + " is not supported";
    }

    var fileSize = fs.statSync(filePath)["size"];
    if (isNaN(fileSize) || fileSize === 0 || fileSize > applicationConstants.UPLOAD_MAX_FILE_SIZE) {
        return "File with size " + fileSize + "B can not be handled.";
    }
}

function validateXmlContent(fileContent) {
    // check xml syntax
    var fileDoc;
    try {
        fileDoc = libxmljs.parseXml(fileContent);
    } catch (error) {
        return extractStringFirstLine(error);
    }

    // check xml structure with schema
    const schema = fs.readFileSync(applicationConstants.XSD_SCHEMA_PATH);
    var schemaDoc = libxmljs.parseXml(schema);
    if (!fileDoc.validate(schemaDoc)) {
        return extractStringFirstLine(fileDoc.validationErrors);
    }
}

function extractScript(fileContent) {
    var scriptName = null;
    var script = null;
    var parser = new xml2js.Parser();
    parser.parseString(fileContent, function(error, result) {       // this call is sync
        if (error) {
            throw error;
        }
        scriptName = result.installationScript.scriptName[0];
        script = result.installationScript.script[0];
    });

    return [scriptName, script];
}

function validateScriptSyntax(script) {
    // need to save script at first to be able to validate with it jshint
    var scriptPath = saveScript(applicationConstants.UPLOAD_DIRECTORY, script);
    var validationError = validateScript(scriptPath);
    if (validationError) {
        fs.unlinkSync(scriptPath);
        return validationError;
    }
}

function validateScript(scriptPath) {
    if ((typeof scriptPath === 'undefined') || !fs.existsSync(scriptPath)) {
        return "File " + scriptPath + " does not exist.";
    }
    if (path.extname(scriptPath) !== ".js") {
        return "File " + scriptPath + " is not a javascript file.";
    }

    // check syntax
    try {
        var bashCkeckSyntax = "jshint " + scriptPath + " --config " + applicationConstants.JSHINT_CONFIG_PATH;
        exec(bashCkeckSyntax);
    } catch (error) {
        return error.stdout
            .toString('utf8')
            .replace(/(\r\n|\n|\r)/gm, " ")      // output to one line
            .replace(/\s+/g, " ");               // remove double white spaces
    }

    // TODO check all hal functions are supported
}

function saveScript(directory, script) {
    var scriptName = script[0];
    var scriptContent = script[1];
    var scriptPath = directory + scriptName + ".js";
    fs.writeFileSync(scriptPath, scriptContent);
    return scriptPath;
}

function extractStringFirstLine(object) {
    return object.toString()
        .split('\n')[0];
}

exports.validateAndSaveScriptFrom = validateAndSaveScriptFrom;
exports.validateScript = validateScript;
