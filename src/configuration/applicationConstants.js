module.exports = {
    SERVER_PORT : 8080,

    // upload parameter
    UPLOAD_MAX_FILE_SIZE: 100 * 1024,   // 100 kB
    UPLOAD_ALLOWED_EXTENSIONS: [".xml"],
    UPLOAD_DIRECTORY : "./tmp/",

    // validation
    JSHINT_CONFIG_PATH : "./operating/validation/jshint_config.json",
    XSD_SCHEMA_PATH : "./operating/validation/uploadScriptSchema.xsd",
    // ...signature
    SCRIPT_PROVIDER_NAME : "ScriptProvider",
    SCRIPT_PROVIDER_CERTIFICATE_PATH : "./operating/validation/rsa/rsa.pub",

    SCRIPTS_DIRECTORY : "./scripts/",

    // HAL
    SUPPORTED_HAL_PATH : "./hal/supportedFunctions",
    HAL_PATH : "./hal/hal.js",

    // scriptExecuter
    SCRIPT_EXECUTER : "./operating/scriptManager/scriptExecuter.js"
}
