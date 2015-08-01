var inherits = require('util').inherits,
    MochaBase = require('mocha/lib/reporters/base'),
    path = require('path'),
    fs = require('fs'),
    REPORTS_DIR = 'tmpl-specs-reports',
    REPORTS_PATH = path.join(process.cwd(), REPORTS_DIR),
    cbs = [];

inherits(Base, MochaBase);
module.exports = Base;

Base.prototype.endProcess = endProcess;

Base.saveFile = saveFile;
Base.sum = sum;

process.on('exit', function () {
    cbs.forEach(function (cb) {
        cb();
    });
});

function Base(runner) {
    MochaBase.call(this, runner);
}

function endProcess(cb) {
    cbs.push(cb);
}

function saveFile(fileName, content) {
    if (!fs.existsSync(REPORTS_PATH)) {
        fs.mkdirSync(REPORTS_PATH);
    }
    fs.writeFileSync(path.join(REPORTS_PATH, fileName), content);
}

/**
 * Adds objects field
 *
 * @param {Object} obj1 Source1
 * @param {Object} obj2 Source2
 * @returns {Number} Accumulator created by Source 2
 */
function sum(obj1, obj2) {
    var res = {};
    Object.keys(obj2)
        .forEach(function (key) {
            res[key] = (parseFloat(obj1[key]) || 0) + (parseFloat(obj2[key]) || 0);
        });

    return res;
}
