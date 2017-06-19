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
            prependFiles = [].concat(options.prependFiles).filter(Boolean),
            appendFiles = [].concat(options.appendFiles).filter(Boolean),
            coverageEngines = options.coverage.engines,
            engineTargets = [],
            specTargets = [],
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

        // Provide prepending and appending files if any.
        prependFiles.concat(appendFiles)
            .forEach(function (filepath) {
                nodeConfig.addTech([provide, { target: filepath }]);
            });

        // Add engines' techs and set needsCoverage flag
        engines.forEach(function (engine) {
            engine.hasOwnProperty('needsCoverage') || (engine.needsCoverage = _.includes(coverageEngines, engine.name));
            nodeConfig.addTech([engine.tech, engine.options]);
        });

        // For each lang including no-lang (false) and mock-lang (true)
        (Array.isArray(langs) ? langs : [langs && 'mock']).forEach(function (lang) {
            var isMock = lang === 'mock',
                isReal = !isMock && typeof lang === 'string',
                suffix = '.' + (lang || 'merged') + '.js';

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
                    destTarget = target,
                    sources = []
                        .concat(prependFiles)
                        .concat(lang && ('?.lang' + suffix))
                        .concat(target)
                        .concat(appendFiles)
                        .filter(Boolean);

                // Skip block for `langs: false`
                // or if we don't need prepending/appending files.
                if (lang || sources.length > 1) {
                    destTarget = target.replace('.js', suffix);

                    nodeConfig.addTech([mergeFile, {
                        sources: sources,
                        target: destTarget,
                        sourcemap: true
                    }]);
                }

                // Add instrumented tech if we need coverage
                if (engine.needsCoverage) {
                    target = destTarget;
                    destTarget = instrumentedTarget(destTarget);

                    nodeConfig.addTech([istanbul, { source: target, target: destTarget }]);
                }

                // For each engine and lang we have one target:
                nodeConfig.addTarget(destTarget);

                engineTargets.push(destTarget);
                specTargets.push({
                    target: destTarget,
                    engine: engine,
                    lang: { name: lang, isMock: isMock, isReal: isReal }
                });
            });
        });

        nodeConfig.addTechs([
            [references, {
                dirsTarget: '?.base.dirs',
                saveReferenceHtml: options.saveReferenceHtml
            }],
            [spec, {
                engineTargets: engineTargets,
                specTargets: specTargets,
                diffOpts: options.diffOpts,
                saveHtml: options.saveHtml,
                saveReferenceHtml: options.saveReferenceHtml,
                autoAddReference: options.autoAddReference,
                isCoverageBundle: isCoverageBundle
            }]
        ]);

        nodeConfig.addTarget('?.tmpl-spec.js');
    });
};
