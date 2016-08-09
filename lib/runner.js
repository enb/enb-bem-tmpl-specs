var vow = require('vow'),
    Mocha = require('mocha'),
    istanbul = require('istanbul'),
    minimatch = require('minimatch'),
    _ = require('lodash'),

    unmapCoverageObject = require('./unmap-coverage');

function Runner(opts) {
    this._opts = opts;
    this._mocha = new Mocha({
        ui: 'bdd',
        reporter: runReporters(opts.diffOpts),
        grep: parseRe(opts.grep),
        timeout: opts.timeout
    });
}

Runner.prototype.run = function (files, params) {
    params || (params = {});

    var defer = vow.defer(),
        mocha = this._mocha,
        opts = this._opts;

    mocha.files = files;
    mocha.run(function (failures) {
        function resolvePromise() {
            failures ? defer.reject(new Error('tmpl-specs: ' + failures + ' failing')) : defer.resolve();
        }

        if (params.needCoverage) {
            processCoverage(opts.coverage)
                .then(resolvePromise)
                .fail(function (err) {
                    defer.reject(err);
                });
        } else {
            resolvePromise();
        }
    });

    return defer.promise();
};

module.exports = Runner;

// Helper allow you to run the multiple reporters
function runReporters(diffOpts) {
    var reporters = getReporters();

    return function (runner) {
        reporters.forEach(function (Reporter) {
            Reporter && new Reporter(runner, diffOpts);
        });
    };
}

function getReporters() {
    // TMPL_SPECS_REPORTERS=spec,html,json
    var reporters = process.env.BEM_TMPL_SPECS_REPORTERS || 'spec';

    reporters = reporters
        .split(',')
        .map(function (reporter) {
            var mock = { options: {} },
                _reporter;

            try { _reporter = require('./reporters/' + reporter); } catch (err) {}
            if (!_reporter) _reporter = Mocha.prototype.reporter.apply(mock, [reporter])._reporter;

            return _reporter;
        });

    return reporters;
}

function processCoverage(coverageOpts) {
    var coverage = global.__coverage__;

    return coverage ? unmapCoverageObject(coverage)
        .then(function (unmapedCoverage) {
            return filterAndSaveCoverage(unmapedCoverage, coverageOpts);
        }) : vow.resolve();
}

function filterAndSaveCoverage(coverage, opts) {
    coverage = filterCoverage(coverage, opts.exclude);
    return saveCoverageReport(coverage, opts);
}

function filterCoverage(coverage, exclude) {
    return _.omitBy(coverage, function (value, fileName) {
        return exclude.some(function (pattern) {
            return minimatch(fileName, pattern, { matchBase: true });
        });
    });
}

function saveCoverageReport(coverage, opts) {
    var defer = vow.defer(),
        reporter = new istanbul.Reporter(null, opts.reportDirectory);
    reporter.addAll(opts.reporters);
    var collector = new istanbul.Collector();
    collector.add(coverage);
    reporter.write(collector, false, function () {
        defer.resolve();
    });
    return defer.promise();
}

var regexpRe = /^\/(.+)\/(i?)$/;
function parseRe(str) {
    if (typeof str !== 'string') {
        return str;
    }

    var m = regexpRe.exec(str);
    if (!m) {
        return str;
    }
    return new RegExp(m[1], m[2]);
}
