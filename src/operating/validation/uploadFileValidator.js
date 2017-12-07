var fs = require('fs');
var path = require('path');
var libxmljs = require('libxmljs');
var xml2js = require('xml2js');
var exec = require("child_process").execSync;

var applicationConstants = require("../../configuration/applicationConstants");
var signatureValidator = require("./rsa/signatureValidator");
var scriptManager = require("../scriptManager/scriptManager");


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

        var contentAsJson = parseXml(fileContent);

        // validate provider signature
        validationError = signatureValidator.validate(contentAsJson);
        if (validationError) {
            return validationError;
        }

        // check all hal functions are supported
        validationError = validateRequiredHal(contentAsJson);
        if (validationError) {
            return validationError;
        }

        // extract script
        var script = contentAsJson.document
            .installationScript[0]
            .script[0]
            .toString("utf8")
            .trim();

        // validate script syntax
        validationError = validateScriptSyntax(script);
        if (validationError) {
            return validationError;
        }

        // uploaded script is valid and can be saved
        var installationError = scriptManager.installNewScript(filePath);
        if (installationError) {
            return installationError;
        }

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
        console.error(error);
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
    var contentAsJson = null;
    var parser = new xml2js.Parser();
    parser.parseString(xml, function(error, result) {       // this call is sync
        if (error) {
            throw error;
        }
        contentAsJson = result;
    });

    return contentAsJson;
}

function validateRequiredHal(contentAsJson) {
    var supportedFunctions = fs.readFileSync(applicationConstants.SUPPORTED_HAL_PATH, 'utf8')
        .trim()
        .split(/,\s*/);

    var unsupportedFunctions = [];

    contentAsJson.document
        .installationScript[0]
        .requiredHalFunctions[0]
        .function
        .forEach(requaredFunction => {
            if (supportedFunctions.indexOf(requaredFunction) === -1) {
                unsupportedFunctions.push(requaredFunction);
            }
        });

    if (unsupportedFunctions.length > 0) {
        return "Functions '" + unsupportedFunctions + "' are not supported.";
    }
}

function validateScriptSyntax(scriptContent) {
    // need to save script at first to be able to validate it with jshint
    var scriptPath = applicationConstants.UPLOAD_DIRECTORY + "script" + ".js";
    fs.writeFileSync(scriptPath, scriptContent);

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

function extractStringFirstLine(object) {
    return object.toString()
        .split('\n')[0];
}

exports.validateAndSaveScriptFrom = validateAndSaveScriptFrom;
exports.validateScript = validateScript;
