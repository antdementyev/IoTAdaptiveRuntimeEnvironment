var http = require("http");
var applicationConstants = require("../configuration/applicationConstants");
var requestHandler = require("./requestHandler");


function start() {
    var port = applicationConstants.SERVER_PORT;
    http.createServer(onRequest).listen(port);
    console.log("Started server at port " + port);
}

function onRequest(request, response) {
    var handle = requestHandler.getHandler(request);
    if (typeof handle === 'function') {
        handle(response, request);
    } else {
        response.writeHead(404, {"Content-Type": "text/html"});
        response.write("404 Not found");
        response.end();
    }
}

exports.start = start;
