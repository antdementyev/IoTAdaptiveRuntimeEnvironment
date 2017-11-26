var fs = require('fs');
var rsasign = require('jsrsasign');
var KJUR = rsasign.KJUR;
var applicationConstants = require("../../../configuration/applicationConstants");


function validate(content, signatureBase64) {

    var sig = new KJUR.crypto
        .Signature({"alg": "SHA1withRSA"});
    const rsaPublicKey  = fs.readFileSync(applicationConstants.SCRIPT_PROVIDER_CERTIFICATE_PATH, 'utf8');
    sig.init(rsaPublicKey);
    sig.updateString(content);

    // verify signature
    var signatureHex= rsasign.b64tohex(signatureBase64);
    var isValid = sig.verify(signatureHex);

    if (!isValid) {
        return "Invalid signature";
    }
}

exports.validate = validate;
