var Base = require('../base'),
    util = require('util'),
    HtmlDiffer = require('html-differ').HtmlDiffer,
    htmlDiffer = new HtmlDiffer('bem'),
    jade = require('jade'),
    suites = {},
    totalStats = {
        passes: 0,
        failures: 0,
        skipped: 0
    };

module.exports = Html;
util.inherits(Html, Base);

function Html(runner) {
    Base.call(this, runner);

    runner.on('pending', pushTest);
    runner.on('pass', pushTest);
    runner.on('fail', pushTest);

    var stats = this.stats;

    runner.on('end', function () {
        totalStats = Base.sum(stats, totalStats);
        totalStats.skipped += (stats.tests - (stats.passes + stats.failures));
    });

    this.endProcess(function () {
        var html = jade
            .renderFile(__dirname + '/html.jade', {
                data: suites,
                stats: totalStats
            });

        Base.saveFile('report.html', html);
    });
}

function pushTest(test) {
    var title = test.parent.fullTitle(),
        suite = suites[title] || { tests: [], name: title },
        failed = Boolean(test.err);

    if (failed) {
        test.htmlDiff = htmlDiffer.diffHtml(test.err.actual, test.err.expected);
    }

    suite.tests.push(test);
    suite.failed = suite.failed || failed;

    suites[title] = suite;
}
