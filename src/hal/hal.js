function do1() {
    console.info("do1");
}

function do2() {
    console.info("do2");
}

function do3() {
    console.info("do3");
}

function do4() {
    console.info("do4");
}

function goToSafeState() {
    console.info("goToSafeState");
}

function getTemperature() {
    var max = 45;
    var min = 10;
    return Math.floor(Math.random() * (max - min)) + min;
}

exports.do1 = do1;
exports.do2 = do2;
exports.do3 = do3;
exports.do4 = do4;
exports.goToSafeState = goToSafeState;
exports.getTemperature = getTemperature;
