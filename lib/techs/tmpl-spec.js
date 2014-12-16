var path = require('path'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    assetsDirname = path.join(__dirname, '..', 'assets'),
    readAssets = vow.all([
        vfs.read(path.join(assetsDirname, 'tmpl-spec.jst'), 'utf-8'),
        vfs.read(path.join(assetsDirname, 'it.jst'), 'utf-8'),
        vfs.read(path.join(assetsDirname, 'it-i18n.jst'), 'utf-8')
    ]),
    lodash = require('lodash'),
    template = lodash.template,
    difference = lodash.difference,
    contains = lodash.contains,
    htmlDifferFilename = require.resolve('html-differ'),
    jsBeautifyFilename = require.resolve('js-beautify'),
    instrumentedTarget = require('../util').instrumentedTarget;

module.exports = require('enb/lib/build-flow').create()
    .name('tmpl-spec')
    .target('target', '?.tmpl-spec.js')
    .defineRequiredOption('engines')
    .defineOption('langs', [])
    .defineOption('saveHtml', false)
    .defineOption('coverageEngines', [])
    .defineOption('coverageBundle', false)
    .useSourceFilename('references', '?.references.js')
    .needRebuild(function (cache) {
        return cache.get('saveHtml') !== this._saveHtml ||
            difference(cache.get('langs'), this._langs);
    })
    .saveCache(function (cache) {
        cache.set('saveHtml', this._saveHtml);
        cache.set('langs', this._langs);
    })
    .builder(function (referencesFilename) {
        var node = this.node,
            nodePath = node.getPath(),
            nodeDirname = node.getDir(),
            references = require(referencesFilename),
            engines = this._engines,
            langs = this._langs,
            saveHtml = this._saveHtml,
            coverageEngines = this._coverageEngines,
            its = {};

        if (!this._coverageBundle) {
            if (langs.length > 0) {
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

        return readAssets.spread(function (asset, it, iti18n) {
            var templates = {
                    it: it,
                    'it-i18n': iti18n
                },
                data = {
                    describe: path.basename(nodePath) + ' (' + path.dirname(nodePath) + ')',
                    its: its,
                    engines: engines.map(function (engine) {
                        var target = contains(coverageEngines, engine.name) ?
                            instrumentedTarget(engine.target) : engine.target;

                        if (langs && !langs.length) {
                            target = target.replace('.js.instr.js', '.lang.js.instr.js');
                        }

                        return {
                            name: engine.name,
                            target: node.unmaskTargetName(target),
                            exportName: engine.exportName
                        };
                    }),
                    langs: langs,
                    paths: {
                        references: ['.', path.relative(nodeDirname, referencesFilename)].join(path.sep),
                        'html-differ': ['.', path.relative(nodeDirname, htmlDifferFilename)].join(path.sep),
                        'js-beautify': ['.', path.relative(nodeDirname, jsBeautifyFilename)].join(path.sep)
                    },
                    saveHtml: saveHtml
                };

            return template(asset, data, {
                imports: {
                    template: function (name, data) {
                        return template(templates[name], data);
                    }
                }
            });
        });
    })
    .createTech();
