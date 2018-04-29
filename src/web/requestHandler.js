var fs = require("fs");
var formidable = require("formidable");
var url = require('url');

var uploadFileValidator = require("../operating/validation/uploadFileValidator");
var applicationConstants = require("../configuration/applicationConstants");
var scriptManager = require("../operating/scriptManager/scriptManager");


function getHandler(request) {
    if (request.url === "/" && request.method === 'GET') {
        return onStart;
    }
    if (request.url === "/upload" && request.method === 'POST') {
        return onUpload;
    }
    if (request.url === "/status" && request.method === 'GET') {
        return onStatus;
    }
    if (request.url.startsWith("/run") && request.method === 'GET') {
        return onRun;
    }
    if (request.url === "/hal" && request.method === 'GET') {
        return onHal;
    }
    if (request.url === "/stop" && request.method === 'GET') {
        return onStop;
    }

    return null;
}

function onStart(response) {
    console.info("Called start");
    fs.readFile("./web/html/start.html", function(error, html) {
        if (error) {
            writeResponse(response, 500, error.toString());
            console.error("Could not load the start page: " + error.toString());
        } else {
            writeResponse(response, 200, html);
        }
    });
}

function onStatus(response) {
    console.info("Called status");
    writeResponse(response, 200, scriptManager.getStatusInstalledScripts());
}

function onRun(response, request) {
    console.info("Called run");
    var scriptName = url.parse(request.url, true)
        .path
        .split("/")[2];
    var runErrors = scriptManager.runScriptByName(scriptName);
    if (runErrors) {
        writeResponse(response, 500, runErrors);
    } else {
        writeResponse(response, 200, scriptManager.getStatusInstalledScripts());
    }
}

function onStop(response) {
    console.info("Called stop");
    writeResponse(response, 200, scriptManager.stop());
}

function onUpload(response, request) {
    console.info("Called upload");

    // check content lenght
    var contentLength = request.headers['content-length'];
    if (isNaN(contentLength) || contentLength > applicationConstants.UPLOAD_MAX_FILE_SIZE) {
        console.warn("Aborted upload of content with lenght " + contentLength + "B");
        writeResponse(response, 413, "Uploaded content is too big.");
        return;
    }

    // parse uploaded file
    var form = new formidable.IncomingForm();
    var uploadDir = applicationConstants.UPLOAD_DIRECTORY;
    form.uploadDir = uploadDir;
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir);
    }
    form.keepExtensions = true;
    form.parse(request, function(error, fields, files) {
        if (error) {
            console.error("Error while upload parsing: " + error);
            writeResponse(response, 500, "Could not handle request.");
            return;
        }

        // validate and save script from file
        var uploadedFilePath = files.upload.path;
        var validationMessage = uploadFileValidator.validateAndSaveScriptFrom(uploadedFilePath);

        // if uploaded script is valid install it
        if (!validationMessage) {
            validationMessage = scriptManager.installNewScript(uploadedFilePath);
        }

        if (validationMessage) {
            var message = "Uploaded file is not valid: " + validationMessage;
            console.warn(message);
            writeResponse(response, 400, message);
        } else {
            var message = "Script successful uploaded. ";
            console.info(message);
            message += scriptManager.getStatusInstalledScripts();
            writeResponse(response, 200, message);
        }

        // remove uploaded file
        if (fs.existsSync(uploadedFilePath)) {
            fs.unlinkSync(uploadedFilePath);
        }
    });
}

function onHal(response) {
    console.info("Called hal");
    var supportedFunctions = fs.readFileSync(applicationConstants.SUPPORTED_HAL_PATH, 'utf8');
    writeResponse(response, 200, supportedFunctions);
}

function writeResponse(response, status, body) {
    response.writeHead(status, {
        "Content-Type": "text/html"
    });
    response.write(body);
    response.end();
}

exports.getHandler = getHandler;
