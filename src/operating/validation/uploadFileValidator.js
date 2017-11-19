var fs = require('fs');
var path = require('path');
var libxmljs = require('libxmljs');
var applicationConstants = require("../../configuration/applicationConstants");

const schema = fs.readFileSync('./operating/validation/uploadScriptSchema.xsd');

function validate(filePath) {
    if ((typeof filePath === 'undefined') || !fs.existsSync(filePath)) {
        return "File does not exist.";
    }

    var extension = path.extname(filePath);
    if (applicationConstants.UPLOAD_ALLOWED_EXTENSIONS.indexOf(extension) == -1) {
        return "File type " + extension + " is not supported";
    }

    var fileSize = fs.statSync(filePath)["size"];
    if (isNaN(fileSize) || fileSize == 0 || fileSize > applicationConstants.UPLOAD_MAX_FILE_SIZE) {
        return "File with size " + fileSize + "B can not be handled.";
    }

    // check xml syntax
    var fileContent = fs.readFileSync(filePath);
    try {
        var fileDoc = libxmljs.parseXml(fileContent);
    } catch (error) {
        return error.toString()
            .split('\n')[0];
    }

    // check with schema
    var schemaDoc = libxmljs.parseXml(schema);
    if (!fileDoc.validate(schemaDoc)) {
        return fileDoc.validationErrors
            .toString()
            .split('\n')[0];
    }

    // TODO correct syntax? Function(....)
    // TODO all hal functions are supported
}

exports.validate = validate;
