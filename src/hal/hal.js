function do1() {
    console.log("do1");
}

function do2() {
    console.log("do2");
}

function getTemperature() {
    var max = 45;
    var min = 10;
    return Math.floor(Math.random() * (max - min)) + min;
}

exports.do1 = do1;
exports.do2 = do2;
exports.getTemperature = getTemperature;
