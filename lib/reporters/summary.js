var Base = require('./base'),
    inherits = require('util').inherits,
    totalStats = {
        suites: 0,
        tests: 0,
        passes: 0,
        pending: 0,
        failures: 0,
        skipped: 0
    };

module.exports =  Summary;
inherits(Summary, Base);

function Summary(runner) {
    Base.call(this, runner);

    var stats = this.stats;

    runner.on('end', function () {
        totalStats = Base.sum(stats, totalStats);
        totalStats.skipped += stats.tests - (stats.failures + stats.passes);
    });

    this.endProcess(function () {
        Base.saveFile('summary.json', JSON.stringify(totalStats, null, 2));
    });
}
