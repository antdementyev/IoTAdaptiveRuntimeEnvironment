module.exports = {
    SERVER_PORT : 8080,

    // upload parameter
    UPLOAD_MAX_FILE_SIZE: 100 * 1024,   // 100 kB
    UPLOAD_ALLOWED_EXTENSIONS: [".xml"],
    UPLOAD_DIRECTORY : "./tmp/",

    // validation
    JSHINT_CONFIG_PATH : "./operating/validation/jshint_config.json",
    XSD_SCHEMA_PATH : "./operating/validation/uploadScriptSchema.xsd",

    SCRIPTS_DIRECTORY : "./scripts/"
}
