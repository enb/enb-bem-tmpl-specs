var path = require('path'),
    _ = require('lodash'),

    levels = require('enb-bem-techs/techs/levels'),
    levelsToBemdecl = require('enb-bem-techs/techs/levels-to-bemdecl'),
    files = require('enb-bem-techs/techs/files'),

    provide = require('enb/techs/file-provider'),
    depsByTechToBemdecl = require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'),
    deps = require('enb-bem-techs/techs/deps'),
    depsOld = require('enb-bem-techs/techs/deps-old'),
    mergeDeps = require('enb-bem-techs/techs/merge-deps'),

    keysets = require('enb-bem-i18n/techs/keysets'),
    i18n = require('enb-bem-i18n/techs/i18n'),
    mockI18N = require('./techs/mock-lang-js'),
    mergeFile = require('enb/techs/file-merge'),

    references = require('./techs/references'),
    istanbul = require('./techs/istanbul'),
    spec = require('./techs/tmpl-spec'),
    instrumentedTarget = require('./util').instrumentedTarget;

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*'),
        coverageRe = new RegExp('/' + options.completeBundle + '$'),
        depsTech;

    if (typeof options.depsTech === 'function') {
        depsTech = options.depsTech;
    } else if (options.depsTech === 'deps') {
        depsTech = deps;
    } else {
        depsTech = depsOld;
    }

    config.nodes(pattern, function (nodeConfig) {
        var langs = options.langs,
            engines = options.engines,
            coverageEngines = options.coverage.engines,
            engineTargets = [],
            nodePath = nodeConfig.getPath(),
            isCoverageBundle = coverageRe.test(nodePath),
            sourceLevels = [].concat(options.sourceLevels, options.sublevels[nodePath] || []);

        if (!langs) {
            // `null`-lang means no lang
            langs = [null];
        } else if (langs && !langs.length) {
            // `true`-lang means mock
            langs = ['mock'];
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [levels, { target: '?.base.levels', levels: options.levels }],
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
            [depsTech],
            [files, {
                levelsTarget: '?.base.levels',
                depsFile: '?.base.bemdecl.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        // Base lang techs
        if (langs[0] !== null) {
            engines.forEach(function (engine) {
                nodeConfig.addTech([engine.tech, engine.options]);
                nodeConfig.addTarget(engine.target);
            });
        }

        // For each lang (including `null`-lang and `mock/true`-lang)
        langs.forEach(function (lang) {
            var isReal = lang && lang !== 'mock';

            // Real langs need it:
            isReal && nodeConfig.addTechs([
                [keysets, { lang: lang }],
                [i18n, { lang: lang, exports: { globals: 'force' } }]
            ]);

            engines.forEach(function (engine) {
                var target = engine.target;

                if (isReal) {
                    // Real langs:
                    var langTarget = '?.lang.' + lang + '.js';
                    target = target.replace('.js', '.' + lang + '.js');

                    nodeConfig.addTech([mergeFile, {
                        sources: [langTarget, engine.target],
                        target: target,
                        sourcemap: true
                    }]);
                } else if (lang) {
                    // Mock lang:
                    target = target.replace('.js', '.lang.js');

                    nodeConfig.addTech([mockI18N, {
                        source: engine.target,
                        target: target,
                        mockFunction: options.mockI18N
                    }]);
                } else {
                    // No lang:
                    nodeConfig.addTech([engine.tech, engine.options]);
                }

                // common:
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
