var path = require('path'),
    vow = require('vow'),
    enb = require('enb'),
    vfs = enb.asyncFs || require('enb/lib/fs/async-fs'),
    naming = require('bem-naming'),
    _ = require('lodash'),
    scanner = require('enb-bem-pseudo-levels/lib/level-scanner'),
    configurator = require('./node-configurator'),
    Runner = require('./runner'),
    XJST_PACKAGES = ['enb-xjst', 'enb-bemhtml', 'enb-bemxjst'],
    XJST_EXPORT_NAME = 'BEMHTML';

module.exports = function (helper, commonOpts) {
    commonOpts = initCommonOpts(commonOpts);

    var needCoverage = Boolean(commonOpts.coverage),
        root = helper.getRootPath(),
        runner = new Runner(commonOpts),
        defer = vow.defer();

    // Подобное доопределение таска необходимо, чтобы он гарантировано выполнился до завершения всей сборки
    helper._projectConfig.task(helper.getTaskName(), function () { return defer.promise(); });

    helper.getEventChannel().on('build', function () {
        var filesToRun = helper._nodesToRun.map(function (node) {
            var basename = path.basename(node);

            return path.join(root, node, basename + '.tmpl-spec.js');
        });

        if (!filesToRun.length || helper.getMode() === 'pre') { // В `pre` режиме magic-нод запускаем тесты
            return defer.resolve();                             // только для таргета `?.tmpl-specs.js`
        }

        return runner.run(filesToRun, { needCoverage: needCoverage })
            .then(defer.resolve.bind(defer))
            .fail(defer.reject.bind(defer));
    });

    return {
        configure: function (options) {
            var initedOptions = this._init(options);

            this._buildTargets(initedOptions);
            this._configureNodes(initedOptions);
        },

        _init: function (options) {
            var engines = options.engines,
                enginesNames = Object.keys(engines),
                coverage = {};

            if (needCoverage) {
                var coverageEngines = commonOpts.coverage.engines;

                coverage.engines = coverageEngines ? _.intersection(coverageEngines, enginesNames) : enginesNames;
            }

            commonOpts.diffOpts.stringifyIndent =
                options.stringifyIndent || '  ';

            return {
                _options: options,
                destPath: options.destPath,
                levels: options.levels.map(function (levelPath) {
                    var level = (typeof levelPath === 'string') ? { path: levelPath } : levelPath;

                    level.path = path.resolve(root, level.path);

                    return level;
                }),
                langs: options.langs,
                mockI18N: options.mockI18N,
                prependFiles: options.prependFiles,
                appendFiles: options.appendFiles,
                engines: _.map(engines, function (engine, name) {
                    var techPath = engine.tech,
                        tech = require(techPath),
                        async = !!engine.async,
                        options = _.cloneDeep(engine.options || {}),
                        target = '?.' + name.toLowerCase().replace(' ', '-') + '.js',
                        exportName = options && options.exportName;

                    // Задаём `exportName` по умолчанию для xjst-шаблонизаторов
                    if (!exportName && _.intersection(techPath.split('/'), XJST_PACKAGES).length) {
                        exportName = XJST_EXPORT_NAME;
                    }

                    options.target = target;

                    return {
                        name: name,
                        target: target,
                        exportName: exportName,
                        tech: tech,
                        async: async,
                        options: options
                    };
                }),
                sourceLevels: options.sourceLevels || options.levels,
                coverage: _.defaults(coverage, {
                    engines: []
                }),
                completeBundle: options.completeBundle || '',
                referenceDirSuffixes: options.referenceDirSuffixes || ['tmpl-specs'],
                saveHtml: (typeof process.env.BEM_TMPL_SPECS_SAVE_HTML === 'undefined' ?
                    options.saveHtml :
                    process.env.BEM_TMPL_SPECS_SAVE_HTML) || false,
                saveReferenceHtml: (typeof process.env.BEM_TMPL_SPECS_SAVE_REFERENCE_HTML === 'undefined' ?
                    options.saveReferenceHtml :
                    process.env.BEM_TMPL_SPECS_SAVE_REFERENCE_HTML) || false,
                autoAddReference: options.autoAddReference || false,
                depsTech: options.depsTech
            };
        },

        _buildTargets: function (options) {
            var _this = this,
                dstpath = path.resolve(root, options.destPath);

            helper.prebuild(function (magic) {
                var completeBundleDirname;
                if (needCoverage && options.completeBundle) {
                    completeBundleDirname = path.join(options.destPath, options.completeBundle);
                    magic.registerNode(completeBundleDirname);
                }

                return vow.all([
                    completeBundleDirname && vfs.makeDir(path.join(root, completeBundleDirname)),
                    scanner.scan(options.levels)
                        .then(function (files) {
                            var sublevels = {},
                                nodes = {},
                                nodesToRun = {};

                            files.forEach(function (file) {
                                if (options.referenceDirSuffixes.indexOf(file.suffix) !== -1) {
                                    var bemname = file.name.split('.')[0],
                                        node = path.join(options.destPath, bemname),
                                        mainTarget = path.join(node, bemname + '.tmpl-spec.js');

                                    if (magic.isRequiredNode(node)) {
                                        nodes[node] = true;
                                        magic.registerNode(node);

                                        magic.isRequiredTarget(mainTarget) && (nodesToRun[node] = true);
                                    }

                                    file.files && file.files.forEach(function (dir) {
                                        if (dir.isDirectory && dir.name === 'blocks') {
                                            (sublevels[node] || (sublevels[node] = [])).push(dir.fullname);
                                        }
                                    });
                                }
                            });

                            options.sublevels = sublevels;
                            options.nodes = Object.keys(nodes);

                            var completeBundleNode = path.join(options.destPath, options.completeBundle);

                            helper._nodesToRun = (helper._nodesToRun || []).concat(
                                Object.keys(nodesToRun).concat(
                                    (completeBundleDirname && magic.isRequiredNode(completeBundleNode)) ?
                                        completeBundleNode :
                                        []
                                )
                            );

                            return vow.all(options.nodes.map(function (node) {
                                return _this._buildBemdecl(dstpath, node);
                            }));
                        })
                ]);
            });
        },

        _configureNodes: function (options) {
            helper.configure(function (projectConfig) {
                configurator.configure(projectConfig, {
                    destPath: options.destPath,
                    levels: options.levels,
                    sourceLevels: options.sourceLevels,
                    langs: options.langs,
                    mockI18N: options.mockI18N,
                    prependFiles: options.prependFiles,
                    appendFiles: options.appendFiles,
                    engines: options.engines,
                    saveHtml: options.saveHtml,
                    saveReferenceHtml: options.saveReferenceHtml,
                    autoAddReference: options.autoAddReference,
                    coverage: options.coverage,
                    sublevels: options.sublevels,
                    depsTech: options.depsTech,
                    completeBundle: options.completeBundle,
                    diffOpts: commonOpts.diffOpts
                });
            });
        },

        _buildBemdecl: function (dstpath, node) {
            var basename = path.basename(node),
                dirname = path.join(dstpath, basename),
                bemdeclFilename = path.join(dirname, basename + '.base.bemdecl.js'),
                notation = naming.parse(basename),
                dep = { block: notation.block },
                bemdeclSource;

            notation.elem && (dep.elem = notation.elem);

            if (notation.modName) {
                dep.mod = notation.modName;
                dep.val = notation.modVal;
            }

            bemdeclSource = 'exports.deps = ' + JSON.stringify([dep]) + ';';

            return vfs.makeDir(dirname)
                .then(function () {
                    return vfs.write(bemdeclFilename, bemdeclSource, 'utf-8');
                });
        }
    };
};

function initCommonOpts(opts) {
    opts || (opts = {});

    var covReporters = process.env.BEM_TMPL_SPECS_COV_REPORTERS,
        grep = process.env.BEM_TMPL_SPECS_GREP,
        timeout = process.env.BEM_TMPL_SPECS_TIMEOUT;

    return {
        coverage: opts.coverage && _.defaults(opts.coverage === true ? {} : opts.coverage, {
            reportDirectory: 'coverage',
            exclude: [
                '**/node_modules/**',
                '**/libs/**'
            ],
            reporters: covReporters ? covReporters.split(',') : ['lcov']
        }),
        timeout: timeout || opts.timeout || 2000,
        grep: (typeof grep === 'undefined' ? opts.grep : grep) || false,
        diffOpts: _.defaults(opts.htmlDiffer || {}, { preset: 'bem' })
    };
}
