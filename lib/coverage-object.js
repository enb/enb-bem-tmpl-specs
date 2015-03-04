var _ = require('lodash'),
    inherit = require('inherit');

module.exports = inherit({
    __constructor: function () {
        this._indices = {
        };
        this.coverage = {
        };
    },

    addStatement: function (statement, counter) {
        var sourceName = statement.start.source,
            sourceObj = this._getFileObject(sourceName),
            idx = this._indices[sourceName].s++;
        sourceObj.statementMap[idx] = {
            start: getLocation(statement.start),
            end: getLocation(statement.end),
            skip: statement.skip
        };
        sourceObj.s[idx] = counter;
    },

    addFunction: function (fn, counter) {
        var sourceName = fn.start.source,
            sourceObj = this._getFileObject(sourceName),
            idx = this._indices[sourceName].f++;
        sourceObj.fnMap[idx] = {
            name: fn.name,
            line: fn.start.line,
            skip: fn.skip,
            loc: {
                start: getLocation(fn.start),
                end: getLocation(fn.end),
                skip: fn.skip
            }
        };

        sourceObj.f[idx] = counter;
    },

    addBranch: function (branch, counter) {
        var sourceName = branch.locations[0].start.source,
            sourceObj = this._getFileObject(sourceName),
            idx = this._indices[sourceName].b++;
        sourceObj.branchMap[idx] = {
            line: branch.locations[0].start.line,
            type: branch.type,
            locations: branch.locations.map(function (loc) {
                return {
                    start: getLocation(loc.start),
                    end: getLocation(loc.end),
                    skip: loc.skip
                };
            })
        };
        sourceObj.b[idx] = counter;
    },

    _getFileObject: function (sourceName) {
        var fileObject = this.coverage[sourceName];
        if (!fileObject) {
            fileObject = this.coverage[sourceName] = {
                path: sourceName,
                s: {},
                b: {},
                f: {},
                statementMap: {},
                fnMap: {},
                branchMap: {}
            };

            this._indices[sourceName] = {
                s: 1,
                b: 1,
                f: 1
            };
        }
        return fileObject;
    }
});

function getLocation(soureMapLocation) {
    return _.pick(soureMapLocation, 'line', 'column');
}
