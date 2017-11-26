var fs = require('fs');
var path = require('path');
var libxmljs = require('libxmljs');
var xml2js = require('xml2js');
var exec = require("child_process").execSync;

var applicationConstants = require("../../configuration/applicationConstants");
var signatureValidator = require("./rsa/signatureValidator");


/**
 * Validates the given XML file and saves the contained script
 * or returns a possible validation error.
 */
function validateAndSaveScriptFrom(filePath) {
    try {
        // validate file type
        var validationError = validateFile(filePath);
        if (validationError) {
            return validationError;
        }

        // validate xml structure of file
        var fileContent = fs.readFileSync(filePath);
        validationError = validateXmlContent(fileContent);
        if (validationError) {
            return validationError;
        }

        // extract script form xml
        var parsedXml = parseXml(fileContent);
        var script = parsedXml.installationScript
            .script[0]
            .toString("utf8")
            .trim();

        // validate provider signature
        validationError = validateSignature(script, parsedXml)
        if (validationError) {
            return validationError;
        }

        // validate script syntax
        validationError = validateScriptSyntax(script);
        if (validationError) {
            return validationError;
        }

        // TODO check all hal functions are supported
        // TODO check script executing is safe for system

        // uploaded script is valid and can be executed -> save it
        var scriptName = parsedXml.installationScript
            .scriptName[0]
            .toString("utf8")
            .trim();
        var scriptPath = saveScript(applicationConstants.SCRIPTS_DIRECTORY, scriptName, script);
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

function parseXml(xml) {
    var xmlTree = null;
    var parser = new xml2js.Parser();
    parser.parseString(xml, function(error, result) {       // this call is sync
        if (error) {
            throw error;
        }
        xmlTree = result;
    });

    return xmlTree;
}

function validateSignature(script, parsedXml) {
    // check provider
    var scriptProviderInfo = parsedXml.installationScript
        .signatureProvider[0];
    var scriptProvider = scriptProviderInfo.providerName[0];
    if (applicationConstants.SCRIPT_PROVIDER_NAME !== scriptProvider) {
        return "Unknown script provider.";
    }

    // check signature
    var signature = scriptProviderInfo.signature[0];
    return signatureValidator.validate(script, signature);
}

function validateScriptSyntax(script) {
    // need to save script at first to be able to validate it with jshint
    var scriptPath = saveScript(applicationConstants.UPLOAD_DIRECTORY, "script", script);
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
}

function saveScript(directory, scriptName, scriptContent) {
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
