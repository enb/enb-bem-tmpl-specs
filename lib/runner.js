var vow = require('vow'),
    Mocha = require('mocha'),
    reporter = require('./reporter');

exports.run = function (files) {
    var defer = vow.defer(),
        mocha = new Mocha({
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
