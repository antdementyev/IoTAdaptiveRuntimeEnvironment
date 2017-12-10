var Gpio = require('onoff').Gpio;       // onoff to interact with the GPIO
var pin4 = new Gpio(4, 'out');          // use a specified output pin
var pin17 = new Gpio(17, 'out');

function do1() {
    pin4.writeSync(1);
    console.info("do1");
}

function do2() {
    pin4.writeSync(0);
    console.info("do2");
}

function do3() {
    pin17.writeSync(1);
    console.info("do3");
}

function do4() {
    pin17.writeSync(0);
    console.info("do4");
}

function goToSafeState() {
    // Turn LED off
    pin4.writeSync(0);
    pin17.writeSync(0);
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
