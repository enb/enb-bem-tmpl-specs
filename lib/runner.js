var vow = require('vow');
var Mocha = require('mocha');
var reporter = require('./reporter');
var mocha = new Mocha({
    ui: 'bdd',
    reporter: reporter
});

exports.run = function (files) {
    var defer = vow.defer();

    files.forEach(function (file) {
        mocha.addFile(file);
    });

    mocha.run(function (failures) {
        if (failures) {
            defer.reject(failures);
        } else {
            defer.resolve();
        }

        process.on('exit', function () {
            process.exit(failures);
        });
    });

    return defer.promise();
};
