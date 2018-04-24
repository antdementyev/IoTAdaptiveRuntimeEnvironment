while (true) {
                hal.do1();
                sleep(1000);
                hal.do2();
                sleep(2000);
            }

            function sleep(milliSeconds) {
                var startTime = new Date().getTime();
                while (new Date().getTime() < startTime + milliSeconds);
            }