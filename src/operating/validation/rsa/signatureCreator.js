var fs = require('fs');
var rsasign = require('jsrsasign');
var KJUR = rsasign.KJUR;


function createSignature(contentToSign) {
    var sig = new KJUR.crypto
        .Signature({"alg": "SHA1withRSA"});
    var rsaPrivateKey  = fs.readFileSync("./operating/validation/rsa/rsa.priv", 'utf8');
    sig.init(rsaPrivateKey);
    sig.updateString(contentToSign);
    var sigValueHex = sig.sign();
    return rsasign.hextob64(sigValueHex);
}

exports.createSignature = createSignature;
