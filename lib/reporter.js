var util = require('util');
var htmlDiffer = require('html-differ');
var Base = require('mocha/lib/reporters/base');
var cursor = Base.cursor;
var color = Base.color;
var ms = require('mocha/lib/ms');

exports = module.exports = Reporter;

function logHtmlDiff(diff, options) {

    options = options || { showCharacters: 20 };

    var showCharacters = options.showCharacters;

    showCharacters = showCharacters > 0 ? showCharacters : 20;

    var output = '';

    if (diff.length === 1 && !diff[0].added && !diff[0].removed) {
        return output;
    }

    diff.forEach(function (part) {
        var clr = part.added ? 'green' :
                part.removed ? 'red' : 'grey';
        var indexOfPart = diff.indexOf(part);

        if (clr !== 'grey') {

            output += (!indexOfPart ? '\n' : '') + color(clr === 'red' ? 'diff removed' : 'diff added', part.value);

            return;
        }

        if (part.value.length < showCharacters * 2) {
            output += (indexOfPart ? '' : '\n') + color('diff gutter', part.value);
        } else {
            indexOfPart && (output += color('diff gutter', part.value.substr(0, showCharacters)));

            if (indexOfPart < diff.length - 1) {
                output += '\n...\n' + color('diff gutter', part.value.substr(part.value.length - showCharacters, showCharacters));
            }
        }
    });

    console.error('Differences:' + output);
}

function Reporter(runner) {
    Base.call(this, runner);

    var self = this;
    var indents = 0;
    var n = 0;

    function indent () {
        return Array(indents).join('  ');
    }

    runner.on('start', function () {
        console.log();
    });

    runner.on('suite', function (suite) {
        ++indents;
        console.log(color('suite', '%s%s'), indent(), suite.title);
    });

    runner.on('suite end', function () {
        --indents;
        if (1 === indents) {
            console.log();
        }
    });

    runner.on('pending', function (test) {
        var fmt = indent() + color('pending', '  - %s');
        console.log(fmt, test.title);
    });

    runner.on('pass', function (test) {
        var fmt;

        if ('fast' === test.speed) {
            fmt = indent() +
                color('checkmark', '  ' + Base.symbols.ok) +
                color('pass', ' %s ');
            cursor.CR();
            console.log(fmt, test.title);
        } else {
            fmt = indent() +
                color('checkmark', '  ' + Base.symbols.ok) +
                color('pass', ' %s ') +
                color(test.speed, '(%dms)');
            cursor.CR();
            console.log(fmt, test.title, test.duration);
        }
    });

    runner.on('fail', function (test) {
        cursor.CR();
        console.log(indent() + color('fail', '  %d) %s'), ++n, test.title);
    });

    runner.on('end', this.epilogue.bind(self));
}

util.inherits(Reporter, Base);

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
        // msg
        var err = test.err;
        var message = err.message || '';
        var  stack = err.stack || message;
        var index = stack.indexOf(message) + message.length;
        var actual = err.actual;
        var expected = err.expected;

        stack = stack.slice(index ? index + 1 : index)
            .replace(/^/gm, '  ');

        console.error(color('error title', '  %s) %s:\n'), (i + 1), test.fullTitle());

        logHtmlDiff(htmlDiffer.diffHtml(actual, expected, { ignoreHtmlAttrs: ['id', 'for'], compareHtmlAttrsAsJSON: ['data-bem'] }), 20);

        console.error(color('error stack', '\n%s\n'), stack);
    });
};
