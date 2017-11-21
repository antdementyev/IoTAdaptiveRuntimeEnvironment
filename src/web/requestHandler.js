var fs = require("fs");
var formidable = require("formidable");
var uploadFileValidator = require("../operating/validation/uploadFileValidator");
var applicationConstants = require("../configuration/applicationConstants");


function getHandler(request) {
    if (request.url == "/" && request.method == 'GET') {
        return onStart;
    }
    if (request.url == "/upload" && request.method == 'POST') {
        return onUpload;
    }
    return null;
}

function onStart(response) {
    console.info("Called start");
    fs.readFile("./web/html/start.html", function(error, html) {
        if (error) {
            writeResponse(response, 500, error);
            console.error("Could not load the start page.");
        } else {
            writeResponse(response, 200, html);
        }
    });
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
    form.uploadDir = applicationConstants.UPLOAD_DIRECTORY;
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
        if (validationMessage) {
            var message = "Uploaded file is not valid: " + validationMessage;
            console.warn(message);
            writeResponse(response, 400, message);
        } else {
            var message = "Script successful uploaded";
            console.info(message);
            writeResponse(response, 200, message);
        }

        // remove uploaded file
        if (fs.existsSync(uploadedFilePath)) {
            fs.unlinkSync(uploadedFilePath);
        }
    });
}

function writeResponse(response, status, body) {
    response.writeHead(status, {
        "Content-Type": "text/html"
    });
    response.write(body);
    response.end();
}

exports.getHandler = getHandler;
