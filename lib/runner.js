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
    var needRun = false;

    files.forEach(function (file) {
        if (oldFiles.indexOf(file) === -1) {
            oldFiles.push(file);
            mocha.addFile(file);

            needRun = true;
        }
    });

    if (needRun) {
        mocha.run(function (failures) {
            failures ? defer.reject(failures) : defer.resolve();

            process.on('exit', function () {
                process.exit(failures);
            });
        });
    }

    return defer.promise();
};
