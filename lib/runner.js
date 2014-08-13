var vow = require('vow');
var Mocha = require('mocha');
var reporter = require('./reporter');

exports.run = function (files) {
    var defer = vow.defer();
    var mocha = new Mocha({
        ui: 'bdd',
        reporter: reporter
    });

    mocha.files = files;
    mocha.run(function (failures) {
        failures ? defer.reject(failures) : defer.resolve();

        process.on('exit', function () {
            process.exit(failures);
        });
    });

    return defer.promise();
};
