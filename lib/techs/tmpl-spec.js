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
                'var should = require(\'' + shouldDirname + '\');',
                'var htmlDiffer = require(\'' + htmlDifferDirname + '\');',
                'var references = require(\'' + referencesFilename + '\');',
                'var BEMHTML = require(\'' + bemhtmlFilename + '\').BEMHTML;',
                'var BH = require(\'' + bhFilename + '\');',
                'var itKeys = Object.keys(references).filter(function (name) {',
                '    return references[name].bemjson && references[name].html;',
                '});',
                '',
                'describe(\'' + nodename + '\', function() {',
                '    itKeys.forEach(function (name) {',
                '        var bemjson = references[name].bemjson;',
                '        var html = references[name].html;',
                '',
                '        it(\'should be equal `\' + name + \'` by BEMHTML\', function () {',
                '            htmlDiffer.isEqual(html, BEMHTML.apply(bemjson)).should.be.true();',
                '        });',
                '        it(\'should be equal `\' + name + \'` by BH\', function () {',
                '            htmlDiffer.isEqual(html, BH.apply(bemjson)).should.be.true();',
                '        });',
                '    });',
                '});'
            ].join('\n');
        }

        return pure;
    })
    .createTech();
