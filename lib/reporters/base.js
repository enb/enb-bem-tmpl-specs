var inherits = require('util').inherits,
    MochaBase = require('mocha/lib/reporters/base'),
    path = require('path'),
    fs = require('fs'),
    REPORTS_DIR = 'tmpl-specs-reports';

inherits(Base, MochaBase);
module.exports = Base;

function Base(runner) {
    MochaBase.call(this, runner);
}

Base.prototype._reportsPath = path.join(process.cwd(), REPORTS_DIR);

Base.prototype._prepare = function () {
    if (!fs.existsSync(this._reportsPath)) {
        fs.mkdirSync(this._reportsPath);
    }
};

Base.prototype.saveFile = function (fileName, content) {
    this._prepare();
    fs.writeFileSync(path.join(this._reportsPath, fileName), content);
};
