var vow = require('vow');
var colors = require('colors');
var Mocha = require('mocha');
var Logger = require('enb/lib/logger');
var reporter = require('./reporter');
var logger = new Logger();
var mocha = new Mocha({
    ui: 'bdd',
    reporter: reporter
});

var oldFiles = [];

exports.run = function (files) {
    var defer = vow.defer();
    var needRun = false;

    files.forEach(function (file) {
        if (oldFiles.indexOf(file) === -1) {
            oldFiles.push(file);
            mocha.addFile(file);

            needRun = true;
        }
    });

    if (needRun) {
        var startTime = new Date();

        logger.log('specs run started');

        mocha.run(function (failures) {
            if (failures) {
                logger.log('specs run failed');

                defer.reject(failures);
            }

            logger.log('specs run finished - ' + colors.red((new Date() - startTime) + 'ms'));

            defer.resolve();

            process.on('exit', function () {
                process.exit(failures);
            });
        });
    }

    return defer.promise();
};
