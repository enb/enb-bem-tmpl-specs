var _ = require('lodash'),
    inherit = require('inherit');

module.exports = inherit({
    __constructor: function () {
        this._indices = {
        };
        this.coverage = {
        };
    },

    addStatement: function (start, end, counter) {
        var sourceName = start.source,
            sourceObj = this._getFileObject(sourceName),
            idx = this._indices[sourceName].s++;
        sourceObj.statementMap[idx] = {
            start: getLocation(start),
            end: getLocation(end)
        };
        sourceObj.s[idx] = counter;
    },

    addFunction: function (name, start, end, counter) {
        var sourceName = start.source,
            sourceObj = this._getFileObject(sourceName),
            idx = this._indices[sourceName].f++;
        sourceObj.fnMap[idx] = {
            name: name,
            line: start.line,
            loc: {
                start: getLocation(start),
                end: getLocation(end)
            }
        };

        sourceObj.f[idx] = counter;
    },

    addBranch: function (type, locations, counter) {
        var sourceName = locations[0].start.source,
            sourceObj = this._getFileObject(sourceName),
            idx = this._indices[sourceName].b++;
        sourceObj.branchMap[idx] = {
            line: locations[0].start.line,
            type: type,
            locations: locations.map(function (loc) {
                return {
                    start: getLocation(loc.start),
                    end: getLocation(loc.end)
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
