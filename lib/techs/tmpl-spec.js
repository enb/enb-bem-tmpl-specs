var path = require('path'),
    vfs = require('enb/lib/fs/async-fs'),
    readAsset = vfs.read(path.join(__dirname, '..', 'assets', 'tmpl-spec.jst')),
    _ = require('lodash'),
    template = _.template,
    htmlDifferFilename = require.resolve('html-differ'),
    jsBeautifyFilename = require.resolve('js-beautify'),
    instrumentedTarget = require('../util').instrumentedTarget;

module.exports = require('enb/lib/build-flow').create()
    .name('tmpl-spec')
    .target('target', '?.tmpl-spec.js')
    .defineRequiredOption('engines')
    .defineOption('saveHtml', false)
    .defineOption('coverageEngines', [])
    .useSourceFilename('references', '?.references.js')
    .useSourceListFilenames('engineTargets', [])
    .needRebuild(function (cache) {
        return cache.get('saveHtml') !== this._saveHtml;
    })
    .saveCache(function (cache) {
        cache.set('saveHtml', this._saveHtml);
    })
    .builder(function (referencesFilename) {
        var node = this.node,
            nodePath = node.getPath(),
            nodeDirname = node.getDir(),
            references = require(referencesFilename),
            engines = this._engines,
            saveHtml = this._saveHtml,
            coverageEngines = this._coverageEngines,
            its = [];

        Object.keys(references).forEach(function (name) {
            var bemjson = references[name].bemjson,
                html = references[name].html;

            bemjson && html && its.push(name);
        });

        return readAsset.then(function (asset) {
            return template(asset, {
                describe: path.basename(nodePath) + ' (' + path.dirname(nodePath) + ')',
                its: its,
                engines: engines.map(function (engine) {
                    var target = _.contains(coverageEngines, engine.name) ?
                        instrumentedTarget(engine.target) : engine.target;
                    return {
                        name: engine.name,
                        target: node.unmaskTargetName(target),
                        exportName: engine.exportName
                    };
                }),
                paths: {
                    references: ['.', path.relative(nodeDirname, referencesFilename)].join(path.sep),
                    'html-differ': ['.', path.relative(nodeDirname, htmlDifferFilename)].join(path.sep),
                    'js-beautify': ['.', path.relative(nodeDirname, jsBeautifyFilename)].join(path.sep)
                },
                saveHtml: saveHtml
            });
        });
    })
    .createTech();
