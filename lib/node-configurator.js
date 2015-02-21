var path = require('path'),
    _ = require('lodash'),

    levels = require('enb-bem-techs/techs/levels'),
    levelsToBemdecl = require('enb-bem-techs/techs/levels-to-bemdecl'),
    files = require('enb-bem-techs/techs/files'),

    provide = require('enb/techs/file-provider'),
    depsByTechToBemdecl = require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'),
    deps = require('enb-bem-techs/techs/deps-old'),
    mergeDeps = require('enb-bem-techs/techs/merge-deps'),

    i18nMergeKeysets = require('enb-bem-i18n/techs/i18n-merge-keysets'),
    i18nLangJs = require('enb-bem-i18n/techs/i18n-lang-js'),
    mockI18N = require('./techs/mock-lang-js'),
    mergeFile = require('enb/techs/file-merge'),

    references = require('./techs/references'),
    istanbul = require('./techs/istanbul'),
    spec = require('./techs/tmpl-spec'),
    instrumentedTarget = require('./util').instrumentedTarget;

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*'),
        sourceLevels = [].concat(options.sourceLevels, options.sublevels),
        coverageRe = new RegExp('/' + options.coverage.completeBundle + '$');

    config.nodes(pattern, function (nodeConfig) {
        var langs = options.langs,
            engines = options.engines,
            coverageEngines = options.coverage.engines,
            engineTargets = [],
            isCoverageBundle = coverageRe.test(nodeConfig.getPath());

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [isCoverageBundle ? levelsToBemdecl : provide, {
                target: '?.base.bemdecl.js'
            }],
            [depsByTechToBemdecl, {
                target: '?.tech.bemdecl.js',
                filesTarget: '?.base.files',
                sourceTech: 'tmpl-spec.js'
            }],
            [mergeDeps, {
                target: '?.bemdecl.js',
                sources: ['?.base.bemdecl.js', '?.tech.bemdecl.js']
            }],
            [deps],
            [files, {
                depsFile: '?.base.bemdecl.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        if (langs) {
            nodeConfig.addTechs([
                [i18nMergeKeysets, { lang: 'all' }],
                [i18nLangJs, { lang: 'all' }]
            ]);

            engines.forEach(function (engine) {
                nodeConfig.addTech([engine.tech, engine.options]);
                nodeConfig.addTarget(engine.target);
            });

            if (langs.length > 0) {
                langs.forEach(function (lang) {
                    nodeConfig.addTechs([
                        [i18nMergeKeysets, { lang: lang }],
                        [i18nLangJs, { lang: lang }]
                    ]);

                    engines.forEach(function (engine) {
                        var target = engine.target.replace('.js', '.' + lang + '.js'),
                            langTarget = '?.lang.' + lang + '.js';

                        nodeConfig.addTech([mergeFile, {
                            sources: ['?.lang.all.js', langTarget, engine.target],
                            target: target
                        }]);

                        if (_.contains(coverageEngines, engine.name)) {
                            var instrumented = instrumentedTarget(target);

                            nodeConfig.addTech([
                                istanbul,
                                { source: target, target: instrumented }
                            ]);

                            engineTargets.push(instrumented);
                            nodeConfig.addTarget(instrumented);
                        } else {
                            engineTargets.push(target);
                            nodeConfig.addTarget(target);
                        }
                    });
                });
            } else {
                engines.forEach(function (engine) {
                    var target = engine.target.replace('.js', '.lang.js');

                    nodeConfig.addTech([mockI18N, {
                        source: engine.target,
                        target: target
                    }]);

                    if (_.contains(coverageEngines, engine.name)) {
                        var instrumented = instrumentedTarget(target);

                        nodeConfig.addTech([
                            istanbul,
                            { source: target, target: instrumented }
                        ]);

                        engineTargets.push(instrumented);
                        nodeConfig.addTarget(instrumented);
                    } else {
                        engineTargets.push(target);
                        nodeConfig.addTarget(target);
                    }
                });
            }
        } else {
            engines.forEach(function (engine) {
                nodeConfig.addTech([engine.tech, engine.options]);

                if (_.contains(coverageEngines, engine.name)) {
                    var instrumented = instrumentedTarget(engine.target);

                    nodeConfig.addTech([
                        istanbul,
                        { source: engine.target, target: instrumented }
                    ]);

                    engineTargets.push(instrumented);
                    nodeConfig.addTarget(instrumented);
                } else {
                    engineTargets.push(engine.target);
                    nodeConfig.addTarget(engine.target);
                }
            });
        }

        nodeConfig.addTechs([
            [references, { dirsTarget: '?.base.dirs' }],
            [spec, {
                engines: engines,
                langs: langs,
                diffOpts: options.diffOpts,
                engineTargets: engineTargets,
                saveHtml: options.saveHtml,
                coverageEngines: coverageEngines,
                coverageBundle: isCoverageBundle
            }]
        ]);

        nodeConfig.addTarget('?.tmpl-spec.js');
    });
};
