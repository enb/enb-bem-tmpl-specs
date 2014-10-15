var Base = require('./base'),
    inherits = require('util').inherits;

module.exports =  Summary;
inherits(Summary, Base);

function Summary(runner) {
    Base.call(this, runner);

    var _this = this,
        stats = this.stats;

    runner.on('end', function () {
        stats.skipped = stats.tests - (stats.failures + stats.passes);
        _this.saveFile('summary.json', JSON.stringify(stats, null, 2));
    });
}
