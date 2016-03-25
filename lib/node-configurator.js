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

        // Add engines' techs
        engines.forEach(function (engine) {
            nodeConfig.addTech([engine.tech, engine.options]);
        });

        // For each lang including no-lang (false) and mock-lang (true)
        (Array.isArray(langs) ? langs : [langs && 'lang']).forEach(function (lang) {
            var suffix = '.' + lang + '.js',
                isMock = lang === 'lang',
                isReal = lang && !isMock;

            // Keyset and lang file for real langs:
            isReal && nodeConfig.addTechs([
                [keysets, { lang: lang }],
                [i18n, { lang: lang, exports: { globals: 'force' } }]
            ]);

            // Mock for mock-lang:
            isMock && nodeConfig.addTechs([
                [mockI18N, { target: '?.lang' + suffix, mock: options.mockI18N }]
            ]);

            engines.forEach(function (engine) {
                var target = engine.target,
                    destTarget = target;

                // Skip block for `langs: false`
                if (lang) {
                    destTarget = target.replace('.js', suffix);

                    nodeConfig.addTech([mergeFile, {
                        sources: ['?.lang' + suffix, target],
                        target: destTarget,
                        sourcemap: true
                    }]);
                }

                // Add instrumented tech if we need coverage
                if (_.contains(coverageEngines, engine.name)) {
                    target = destTarget;
                    destTarget = instrumentedTarget(destTarget);

                    nodeConfig.addTech([istanbul, { source: target, target: destTarget }]);
                }

                // For each engine and lang we have one target:
                engineTargets.push(destTarget);
                nodeConfig.addTarget(destTarget);
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
