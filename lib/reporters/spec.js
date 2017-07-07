var util = require('util'),
    deepDiff = require('deep-diff').diff,
    deepDiffHighlight = require('deep-diff-highlight'),
    HtmlDiffer = require('html-differ').HtmlDiffer,
    diffLogger = require('html-differ/lib/logger'),
    ms = require('mocha/lib/ms'),
    SpecReporter = require('mocha/lib/reporters/spec'),
    color = require('mocha/lib/reporters/base').color;

exports = module.exports = Reporter;

function Reporter(runner, diffOpts) {
    diffOpts || (diffOpts = {});

    diffOpts.preset || (diffOpts.preset = 'bem');

    this._htmlDiffer = new HtmlDiffer(diffOpts);
    this._strigifyIndent = diffOpts.stringifyIndent;

    SpecReporter.call(this, runner);
}

util.inherits(Reporter, SpecReporter);

Reporter.prototype.epilogue = function () {
    var stats = this.stats,
        fmt;

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
    var htmlDiffer = this._htmlDiffer,
        stringifyIndent = this._strigifyIndent,
        diffText;

    console.error();
    failures.forEach(function (test, i) {
        var fmt = color('error title', '  %s) %s:\n') + color('error message', '     %s\n'),
            err = test.err,
            message = err.message || '',
            actual = err.actual,
            expected = err.expected,
            title = test.fullTitle();

        if (typeof actual === 'string' && typeof expected === 'string') {
            var diff = htmlDiffer.diffHtml(actual, expected);
            diffText = diffLogger.getDiffText(diff);

            output(fmt, i, title, err, diffText);
        } else if (typeof actual === 'object' && typeof expected === 'object') {
            diffText = deepDiff(actual, expected)
                .reduce(function (acc, item) {
                    return acc + '...\n' +
                        deepDiffHighlight(item, {
                            indent: stringifyIndent
                        }) + '\n';
                }, '');

            output(fmt, i, title, err, diffText);
        } else {
            var stack = err.stack || message,
                index = stack.indexOf(message) + message.length,
                msg = stack.slice(0, index);

            stack = stack
                .slice(index ? index + 1 : index)
                .replace(/^/gm, '  ');
            fmt += color('error stack', '\n%s\n');

            console.error(fmt, (i + 1), title, msg, stack);
        }
    });
};

function output(fmt, i, title, err, diffText) {
    fmt += '     ' +
        color('diff added', '+ expected') + ' ' +
        color('diff removed', '- actual\n') + '%s\n';
    console.error(
        fmt, (i + 1), title, err.name + ':', diffText);
}
