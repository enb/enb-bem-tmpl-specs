var util = require('util');
var HtmlDiffer = require('html-differ').HtmlDiffer;
var htmlDiffer = new HtmlDiffer({ bem: true });
var diffLogger = require('html-differ/lib/diff-logger');
var ms = require('mocha/lib/ms');
var SpecReporter = require('mocha/lib/reporters/spec');
var color = require('mocha/lib/reporters/base').color;

exports = module.exports = Reporter;

function Reporter(runner) {
    SpecReporter.call(this, runner);
}

util.inherits(Reporter, SpecReporter);

Reporter.prototype.epilogue = function () {
    var stats = this.stats;
    var fmt;

    // passes
    fmt = color('bright pass', ' ') + color('green', ' %d passing') + color('light', ' (%s)');

    console.log(fmt, stats.passes || 0, ms(stats.duration));

    // pending
    if (stats.pending) {
        fmt = color('pending', ' ') + color('pending', ' %d pending');

        console.log(fmt, stats.pending);
    }

    // failures
    if (stats.failures) {
        fmt = color('fail', '  %d failing');

        console.error(fmt, stats.failures);

        this.list(this.failures);
        console.error();
    }

    console.log();
};

Reporter.prototype.list = function (failures) {
    console.error();
    failures.forEach(function (test, i) {
        var fmt = color('error title', '  %s) %s:\n') + color('error message', '     %s\n');
        var err = test.err;
        var message = err.message || '';
        var actual = err.actual;
        var expected = err.expected;
        var title = test.fullTitle();

        if (typeof actual === 'string' && typeof expected === 'string') {
            var diff = htmlDiffer.diffHtml(actual, expected);
            var diffText = diffLogger.getDiffText(diff);

            fmt += '     ' + color('diff added', '+ expected') + ' ' + color('diff removed', '- actual\n') + '%s\n';
            console.error(fmt, (i + 1), title, err.name + ':', diffText);
        } else {
            var stack = err.stack || message;
            var index = stack.indexOf(message) + message.length;
            var msg = stack.slice(0, index);

            stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
            fmt += color('error stack', '\n%s\n');

            console.error(fmt, (i + 1), title, msg, stack);
        }
    });
};
