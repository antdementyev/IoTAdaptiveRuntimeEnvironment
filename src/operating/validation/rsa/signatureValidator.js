var fs = require('fs');
var util = require('util');
var rsasign = require('jsrsasign');
var KJUR = rsasign.KJUR;
var applicationConstants = require("../../../configuration/applicationConstants");


function validate(contentAsJson) {
    // check provider
    var scriptProviderInfo = contentAsJson.document
        .scriptProvider[0];
    var scriptProvider = scriptProviderInfo.name[0];
    if (applicationConstants.SCRIPT_PROVIDER_NAME !== scriptProvider) {
        return "Unknown script provider.";
    }

    // extract signature
    var signatureBase64 = scriptProviderInfo.signature[0]
        .toString("utf8")
        .trim();
    var signatureHex= rsasign.b64tohex(signatureBase64);

    // extract signed content
    var signedContent = contentAsJson.document
        .installationScript[0];
    signedContent = util.inspect(signedContent, {showHidden: false, depth: null});      // resolve objects as string

    // verify signature
    var sig = new KJUR.crypto
        .Signature({"alg": "SHA1withRSA"});
    const rsaPublicKey  = fs.readFileSync(applicationConstants.SCRIPT_PROVIDER_CERTIFICATE_PATH, 'utf8');
    sig.init(rsaPublicKey);
    sig.updateString(signedContent);
    var isValid = sig.verify(signatureHex);

    if (!isValid) {
        return "Invalid signature";
    }
}

exports.validate = validate;
