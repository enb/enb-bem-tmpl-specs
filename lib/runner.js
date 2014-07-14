var vow = require('vow');
var Mocha = require('mocha');
var reporter = require('./reporter');
var mocha = new Mocha({
    ui: 'bdd',
    reporter: reporter
});

var oldFiles = [];

exports.run = function (files) {
    var defer = vow.defer();
    var run = false;

    files.forEach(function (file) {
        if (oldFiles.indexOf(file) === -1) {
            oldFiles.push(file);
            mocha.addFile(file);

            run = true;
        }
    });

    if (run) {
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
    }

    return defer.promise();
};
