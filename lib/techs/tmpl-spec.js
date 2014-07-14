var path = require('path');
var nodeModulesDirname = path.join(__dirname, '..', '..', 'node_modules');
var htmlDifferDirname = path.join(nodeModulesDirname, 'html-differ');
var shouldDirname = path.join(nodeModulesDirname, 'should');

module.exports = require('enb/lib/build-flow').create()
    .name('tmpl-spec')
    .target('target', '?.tmpl-spec.js')
    .useSourceText('pure', '?.pure.tmpl-spec.js')
    .useSourceFilename('references', '?.references.js')
    .useSourceFilename('bemhtmlFile', '?.bemhtml.js')
    .useSourceFilename('bhFile', '?.bh.js')
    .builder(function (pure, referencesFilename, bemhtmlFilename, bhFilename) {
        var nodename = path.basename(this.node.getDir());

        if (!pure) {
            return [
                'function dropRequireCache(requireFunc, filename) {',
                '    var module = requireFunc.cache[filename];',
                '    if (module) {',
                '        if (module.parent) {',
                '            if (module.parent.children) {',
                '                var moduleIndex = module.parent.children.indexOf(module);',
                '                if (moduleIndex !== -1) {',
                '                    module.parent.children.splice(moduleIndex, 1);',
                '                }',
                '            }',
                '            delete module.parent;',
                '        }',
                '        delete module.children;',
                '        delete requireFunc.cache[filename];',
                '    }',
                '};',
                '',
                'var assert = require(\'assert\');',
                'var should = require(\'' + shouldDirname + '\');',
                'var htmlDiffer = require(\'' + htmlDifferDirname + '\');',
                'var references = require(\'' + referencesFilename + '\');',
                'var BEMHTML = require(\'' + bemhtmlFilename + '\').BEMHTML;',
                'var BH = require(\'' + bhFilename + '\');',
                'var itKeys = Object.keys(references).filter(function (name) {',
                '    return references[name].bemjson && references[name].html;',
                '});',
                'var diffOptions = {',
                '    ignoreHtmlAttrs: [\'id\', \'for\'],',
                '    compareHtmlAttrsAsJSON: [\'data-bem\']',
                '};',
                '',
                'describe(\'' + nodename + '\', function() {',
                '    beforeEach(function () {',
                '        dropRequireCache(require, \'' + shouldDirname + '\');',
                '        dropRequireCache(require, \'' + htmlDifferDirname + '\');',
                '        dropRequireCache(require, \'' + referencesFilename + '\');',
                '        dropRequireCache(require, \'' + bemhtmlFilename + '\');',
                '        dropRequireCache(require, \'' + bhFilename + '\');',
                '',
                '        should = require(\'' + shouldDirname + '\');',
                '        htmlDiffer = require(\'' + htmlDifferDirname + '\');',
                '        references = require(\'' + referencesFilename + '\');',
                '        BEMHTML = require(\'' + bemhtmlFilename + '\').BEMHTML;',
                '        BH = require(\'' + bhFilename + '\');',
                '    });',
                '',
                '    itKeys.forEach(function (name) {',
                '        it(\'should be equal `\' + name + \'` by BEMHTML\', function () {',
                '            var bemjson = references[name].bemjson;',
                '            var expectedHtml = references[name].html;',
                '            var actualHtml = BEMHTML.apply(bemjson);',
                '',
                '            htmlDiffer.isEqual(expectedHtml, actualHtml, diffOptions) ?',
                '                assert.ok(expectedHtml) :',
                '                assert.fail(actualHtml, expectedHtml);',
                '        });',
                '        it(\'should be equal `\' + name + \'` by BH\', function () {',
                '            var bemjson = references[name].bemjson;',
                '            var expectedHtml = references[name].html;',
                '            var actualHtml = BH.apply(bemjson);',
                '',
                '            htmlDiffer.isEqual(expectedHtml, actualHtml, diffOptions) ?',
                '                assert.ok(expectedHtml) :',
                '                assert.fail(actualHtml, expectedHtml);',
                '        });',
                '    });',
                '});'
            ].join('\n');
        }

        return pure;
    })
    .createTech();
