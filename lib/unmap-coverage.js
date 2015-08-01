'use strict';
var vow = require('vow'),
    vowFs = require('vow-fs'),
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
        .then(mergeCoverage);
}

function unmapFile(fileName, fileObject, source) {
    var locator = new SourceLocator(fileName, source),
        result = new CoverageObject();

    Object.keys(fileObject.statementMap).forEach(function (key) {
        var statement = fileObject.statementMap[key];

        result.addStatement({
            start: locator.locate(statement.start.line, statement.start.column),
            end: locator.locate(statement.end.line, statement.end.column),
            skip: statement.skip
        }, fileObject.s[key]);
    });

    Object.keys(fileObject.fnMap).forEach(function (key) {
        var fn = fileObject.fnMap[key],
            loc = fn.loc;
        result.addFunction({
            name: fn.name,
            start: locator.locate(loc.start.line, loc.start.column),
            end: locator.locate(loc.end.line, loc.end.column),
            skip: fn.skip
        }, fileObject.f[key]);
    });

    Object.keys(fileObject.branchMap).forEach(function (key) {
        var branch = fileObject.branchMap[key];
        result.addBranch({
            type: branch.type,
            locations: branch.locations.map(function (loc) {
                return {
                    start: locator.locate(loc.start.line, loc.start.column),
                    end: locator.locate(loc.end.line, loc.end.column),
                    skip: loc.skip
                };
            })

        }, fileObject.b[key]);
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

function mergeCoverage(reports) {
    var collector = new istanbul.Collector();
    reports.forEach(function (report) {
        collector.add(report);
    });

    return collector.getFinalCoverage();
}

module.exports = unmapCoverageObject;
