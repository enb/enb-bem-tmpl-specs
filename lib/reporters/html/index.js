var Base = require('../base'),
    util = require('util'),
    HtmlDiffer = require('html-differ').HtmlDiffer,
    htmlDiffer = new HtmlDiffer('bem');

module.exports = Html;
util.inherits(Html, Base);

function Html(runner) {
    Base.call(this, runner);

    var suites = {},
        _this = this;

    runner.on('pending', pushTest);
    runner.on('pass', pushTest);
    runner.on('fail', pushTest);
    runner.on('end', function () {
        var jade = require('jade'),
            stats = this.stats,
            html;

        stats.skipped = stats.tests - (stats.passes + stats.failures);

        html = jade.renderFile(__dirname + '/html.jade', {
            data: suites,
            stats: stats,
            pretty: true
        });

        _this.saveFile('report.html', html);
    });

    function pushTest(test) {
        if (test.err) {
            test.htmlDiff = htmlDiffer.diffHtml(test.err.actual, test.err.expected);
        }
        var title = test.parent.fullTitle(),
            suite = suites[title];

        if (!suite) {
            suites[title] = [test];
        } else {
            suite.push(test);
        }
    }
}
