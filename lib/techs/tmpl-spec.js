var path = require('path'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    assetsDirname = path.join(__dirname, '..', 'assets'),
    readAssets = vow.all([
        vfs.read(path.join(assetsDirname, 'tmpl-spec.jst'), 'utf-8'),
        vfs.read(path.join(assetsDirname, 'it.jst'), 'utf-8')
    ]),
    lodash = require('lodash'),
    template = lodash.template,
    contains = lodash.contains,
    htmlDifferFilename = require.resolve('html-differ'),
    jsBeautifyFilename = require.resolve('js-beautify'),
    instrumentedTarget = require('../util').instrumentedTarget,
    backSlash = new RegExp('\\\\', 'g');

module.exports = require('enb/lib/build-flow').create()
    .name('tmpl-spec')
    .target('target', '?.tmpl-spec.js')
    .defineRequiredOption('engines')
    .defineOption('langs', [])
    .defineOption('saveHtml', false)
    .defineOption('coverageEngines', [])
    .defineOption('coverageBundle', false)
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
            langs = this._langs,
            oneLang = langs === true,
            manyLangs = Array.isArray(langs) && langs.length > 0,
            saveHtml = this._saveHtml,
            coverageEngines = this._coverageEngines,
            coverageBundle = this._coverageBundle,
            its = {};

        if (!this._coverageBundle) {
            if (manyLangs) {
                Object.keys(references).forEach(function (name) {
                    langs.forEach(function (lang) {
                        var reference = references[name],
                            langReference = reference && reference[lang],
                            bemjson = langReference && langReference.bemjson,
                            html = langReference && langReference.html;

                        bemjson && html && (its[name] = true);
                    });
                });
            } else {
                Object.keys(references).forEach(function (name) {
                    var reference = references[name],
                        bemjson = reference && reference.bemjson,
                        html = reference && reference.html;

                    bemjson && html && (its[name] = true);
                });
            }
        }
        its = Object.keys(its);

        return readAssets.spread(function (asset, it) {
            var templates = {
                    it: it
                },
                data = {
                    describe: path.basename(nodePath) + ' (' + path.dirname(nodePath) + ')',
                    its: its,
                    engines: engines.map(function (engine) {
                        var target = contains(coverageEngines, engine.name) ?
                            instrumentedTarget(engine.target) : engine.target,

                            exportName = engine.exportName ? '.' + engine.exportName : '';

                        if (oneLang) {
                            target = coverageBundle ?
                                target.replace('.js.instr.js', '.lang.js.instr.js') :
                                target.replace('.js', '.lang.js');
                        }

                        target = './' + node.unmaskTargetName(target);

                        if (manyLangs) {
                            return {
                                name: engine.name,
                                langs: langs.map(function (lang) {
                                    var langTarget = target.replace('.js', '.' + lang + '.js');
                                    return {
                                        name: lang,
                                        async: engine.async,
                                        target: langTarget,
                                        exportName: exportName
                                    };
                                })
                            };
                        }

                        return {
                            name: engine.name,
                            async: engine.async,
                            target: target,
                            exportName: exportName
                        };
                    }),
                    langs: langs,
                    paths: {
                        references: [
                            '.', path.relative(nodeDirname, referencesFilename).replace(backSlash, '/')
                        ].join('/'),
                        'html-differ': [
                            '.', path.relative(nodeDirname, htmlDifferFilename).replace(backSlash, '/')
                        ].join('/'),
                        'js-beautify': [
                            '.', path.relative(nodeDirname, jsBeautifyFilename).replace(backSlash, '/')
                        ].join('/')
                    },
                    saveHtml: saveHtml
                },
                compiled = template(asset, {
                    imports: {
                        template: function (name, data) {
                            var compiled = template(templates[name]);

                            return compiled(data);
                        }
                    }
                });

            return compiled(data);
        });
    })
    .createTech();
