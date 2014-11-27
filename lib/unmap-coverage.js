'use strict';
var vow = require('vow'),
    vowFs = require('vow-fs'),
    _ = require('lodash'),
    istanbul = require('istanbul'),
    SourceLocator = require('enb-source-map/lib/source-locator'),

    CoverageObject = require('./coverage-object');

function unmapCoverageObject(sourceObject) {
    var sources = Object.keys(sourceObject);
    return vow.all(sources.map(function (fileName) {
            return vowFs.read(fileName, 'utf8').then(function (source) {
                return unmapFile(fileName, sourceObject[fileName], source);
            });
        }))
        .then(function (coverageObjects) {
            return coverageObjects.reduce(mergeCoverage);
        });
}

function unmapFile(fileName, fileObject, source) {
    var locator = new SourceLocator(fileName, source),
        result = new CoverageObject();

    Object.keys(fileObject.statementMap).forEach(function (key) {
        var statement = fileObject.statementMap[key],
            originalStart = locator.locate(statement.start.line, statement.start.column),
            originalEnd = locator.locate(statement.end.line, statement.end.column);
        result.addStatement(originalStart, originalEnd, fileObject.s[key]);
    });

    Object.keys(fileObject.fnMap).forEach(function (key) {
        var fn = fileObject.fnMap[key],
            loc = fn.loc,
            originalStart = locator.locate(loc.start.line, loc.start.column),
            originalEnd = locator.locate(loc.end.line, loc.end.column);
        result.addFunction(fn.name, originalStart, originalEnd, fileObject.f[key]);
    });

    Object.keys(fileObject.branchMap).forEach(function (key) {
        var branch = fileObject.branchMap[key],
            locations = branch.locations.map(function (loc) {
                return {
                    start: locator.locate(loc.start.line, loc.start.column),
                    end: locator.locate(loc.end.line, loc.end.column)
                };
            });
        result.addBranch(
            branch.type,
            locations,
            fileObject.b[key]
        );
    });

    return tryToStripSource(result.coverage, fileName);
}

function tryToStripSource(coverage, source) {
    var keys = Object.keys(coverage);
    if (keys.length !== 1 || keys[0] !== source) {
        delete coverage[source];
    }
    return coverage;
}

function mergeCoverage(first, second) {
    var result = _.clone(first);
    _.each(second, function (value, key) {
        if (result[key]) {
            result[key] = istanbul.utils.mergeFileCoverage(result[key], value);
        } else {
            result[key] = value;
        }
    });
    return result;
}

module.exports = unmapCoverageObject;
