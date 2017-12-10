var fs = require('fs');
var rsasign = require('jsrsasign');
var KJUR = rsasign.KJUR;
var xml2js = require('xml2js');
var util = require('util');
var appConstants = require("../../../configuration/applicationConstants");

const docsToSingFolder = "../../../testDocuments/documentsToSign/";
const signedDocsFolder = "../../../testDocuments/";


// add a sign node to the root node for each file in folder
fs.readdirSync(docsToSingFolder).forEach( file => {

    var xmlToSign = fs.readFileSync(docsToSingFolder + file, "utf8");
    xml2js.parseString(xmlToSign, function(err, json) {
        if (err) {
            console.error(err);
            return;
        }

        // create script provider node with signature
        var scriptProvider = [];
        scriptProvider.push({
            "name": appConstants.SCRIPT_PROVIDER_NAME,
            "signature": createSignature(json.document.installationScript[0])
        });

        // add node at the root node
        json.document["scriptProvider"] = scriptProvider;

        // convert json back to xml and write file
        var xml = new xml2js.Builder()
            .buildObject(json);
        fs.writeFileSync(signedDocsFolder + file, xml);
    });
});

function createSignature(contentToSign) {
    // convert object to sign to String
    var contentToSignAsString = util.inspect(contentToSign, {showHidden: false, depth: null})

    // create signature
    var sig = new KJUR.crypto
        .Signature({"alg": "SHA1withRSA"});
    var rsaPrivateKey = fs.readFileSync("rsa.priv", 'utf8');
    sig.init(rsaPrivateKey);
    sig.updateString(contentToSignAsString);
    var sigValueHex = sig.sign();

    // return as base64
    return rsasign.hextob64(sigValueHex);
}
