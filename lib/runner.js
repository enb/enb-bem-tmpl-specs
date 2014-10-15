var vow = require('vow'),
    Mocha = require('mocha');

exports.run = function (files) {
    var defer = vow.defer(),
        mocha = new Mocha({
            ui: 'bdd',
            reporter: runReporters
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

// Helper allow you to run the multiple reporters
function runReporters(runner) {
    getReporters().forEach(function (Reporter) {
        Reporter && new Reporter(runner);
    });
}

function getReporters() {
    // TMPL_SPECS_REPORTERS=spec,html,json
    var reporters = process.env.BEM_TMPL_SPECS_REPORTERS || 'spec';

    reporters = reporters
        .split(',')
        .map(function (reporter) {
            try {
                return require('./reporters/' + reporter);
            } catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    throw new Error(
                        'Reporter (' + reporter + ') specified through ' +
                        'the "Environment Variables" was not found!'
                    );
                }
                throw e;
            }
        });

    return reporters;
}
