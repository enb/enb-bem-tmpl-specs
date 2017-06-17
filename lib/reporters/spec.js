var util = require('util'),
    stringifyObject = require('stringify-object'),
    deepDiff = require('deep-diff').diff,
    HtmlDiffer = require('html-differ').HtmlDiffer,
    diffLogger = require('html-differ/lib/logger'),
    ms = require('mocha/lib/ms'),
    SpecReporter = require('mocha/lib/reporters/spec'),
    color = require('mocha/lib/reporters/base').color,
    chalk = require('chalk'),
    inverseGreen = chalk.green.inverse,
    inverseRed = chalk.red.inverse,
    grey = chalk.grey;

exports = module.exports = Reporter;

function Reporter(runner, diffOpts) {
    diffOpts || (diffOpts = {});

    diffOpts.preset || (diffOpts.preset = 'bem');

    this._htmlDiffer = new HtmlDiffer(diffOpts);

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

            fmt += '     ' +
                color('diff added', '+ expected') + ' ' +
                color('diff removed', '- actual\n') + '%s\n';
            console.error(fmt, (i + 1), title, err.name + ':', diffText);
        } else if (typeof actual === 'object' && typeof expected === 'object') {
            diffText = deepDiff(actual, expected)
                .reduce(function (acc, item) {
                    return acc + '...\n' +
                        new JSONDiff(item).getText() + '\n';
                }, '');

            fmt += '     ' +
                color('diff added', '+ expected') + ' ' +
                color('diff removed', '- actual\n') + '%s\n';

            console.error(
                fmt, (i + 1), title, err.name + ':', diffText);
        } else {
            var stack = err.stack || message,
                index = stack.indexOf(message) + message.length,
                msg = stack.slice(0, index);

            stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
            fmt += color('error stack', '\n%s\n');

            console.error(fmt, (i + 1), title, msg, stack);
        }
    });
};

function JSONDiff(diff) {
    this.data = diff;
}

JSONDiff.prototype.renders = {
    ND: function (diff, color, field) {
        var path = diff.data.path;

        if (!Array.isArray(path)) {
            return ' = ' + color(diff.getStringifyField(field));
        }

        var last = path.length - 1,
            owner = diff.getPath(path.slice(0, last));
        return grey(owner) + '.' + color(path[last]);
    },
    N: function (diff) {
        return this.ND(diff, inverseRed, 'rhs');
    },
    D: function (diff) {
        return this.ND(diff, inverseGreen, 'lhs');
    },
    E: function (diff) {
        return grey(diff.getPath()) + ' = ' +
            inverseGreen(diff.getStringifyField('rhs')) +
            inverseRed(diff.getStringifyField('lhs'));
    },
    A: function (diff) {
        return grey(diff.getPath() + '[' + diff.data.index + ']') +
            new JSONDiff(diff.data.item).getText();
    }
};

JSONDiff.prototype.getStringifyField = function (field) {
    return stringifyObject(this.data[field], { indent: '  ' });
};

JSONDiff.prototype.getText = function () {
    return this.renders[this.data.kind](this);
};

JSONDiff.prototype.getPath = function (path) {
    path = path || this.data.path;
    if (!Array.isArray(path)) return '';

    return path.reduce(function (acc, item) {
        return typeof item === 'number' ?
            acc + '[' + item + ']' :
            acc + '.' + item;
    }, 'obj');
};
