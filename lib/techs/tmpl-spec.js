var path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),

    enb = require('enb'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    vfs = enb.asyncFs || require('enb/lib/fs/async-fs'),

    assetsDirname = path.join(__dirname, '..', 'assets'),

    // Helpers for tests:
    clearRequireFilename = require.resolve('clear-require'),
    htmlDifferFilename = require.resolve('html-differ'),
    jsBeautifyFilename = require.resolve('js-beautify'),
    vowFilename = require.resolve('vow'),
    vowFsFilename = require.resolve('vow-fs'),
    relativePath = function (dirname, filename) {
        return './' + path.relative(dirname, filename).replace(/\\/g, '/');
    },

    readAssets = vow.all([
        vfs.read(path.join(assetsDirname, 'tmpl-spec.jst'), 'utf-8'),
        vfs.read(path.join(assetsDirname, 'it.jst'), 'utf-8')
    ]);

module.exports = buildFlow.create()
    .name('tmpl-spec')
    .target('target', '?.tmpl-spec.js')
    .defineRequiredOption('specTargets')
    .defineOption('diffOpts')
    .defineOption('saveHtml', false)
    .defineOption('saveReferenceHtml', false)
    .defineOption('autoAddReference', false)
    .defineOption('isCoverageBundle', false)
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

            specTargets = this._specTargets,
            diffOpts = this._diffOpts,
            saveHtml = this._saveHtml,
            saveReferenceHtml = this._saveReferenceHtml,
            autoAddReference = this._autoAddReference,

            references = require(referencesFilename),
            its = !this._isCoverageBundle ? Object.keys(references) : [],

            data = {
                describe: path.basename(nodePath) + ' (' + path.dirname(nodePath) + ')',
                its: its,
                references: references,
                engines: specTargets.map(function (specTarget) {
                    var target = specTarget.target,
                        engine = specTarget.engine,
                        exportName = engine.exportName;

                    target = './' + node.unmaskTargetName(target);

                    return {
                        name: engine.name,
                        async: engine.async,
                        lang: specTarget.lang,
                        target: target,
                        exportName: exportName
                    };
                }),
                paths: _.mapValues({
                    references: referencesFilename,
                    'clear-require': clearRequireFilename,
                    'html-differ': htmlDifferFilename,
                    'js-beautify': jsBeautifyFilename,
                    vow: vowFilename,
                    'vow-fs': vowFsFilename
                }, _.partial(relativePath, nodeDirname)),
                diffOpts: diffOpts,
                saveHtml: saveHtml,
                saveReferenceHtml: saveReferenceHtml,
                autoAddReference: autoAddReference
            };

        return readAssets.spread(function (asset, it) {
            var templates = { it: it },
                imports = {
                    template: function (name, data) {
                        return _.template(templates[name])(data);
                    }
                };

            return _.template(asset, { imports: imports })(data);
        });
    })
    .createTech();
