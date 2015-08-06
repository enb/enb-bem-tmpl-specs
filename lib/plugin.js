var path = require('path'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    naming = require('bem-naming'),
    _ = require('lodash'),
    scanner = require('enb-bem-pseudo-levels/lib/level-scanner'),
    configurator = require('./node-configurator'),
    Runner = require('./runner'),
    XJST_PACKAGES = ['enb-xjst', 'enb-bemhtml', 'enb-bemxjst'],
    XJST_EXPORT_NAME = 'BEMHTML';

module.exports = function (helper) {
    return {
        configure: function (options) {
            var initedOptions = this._init(options);

            this._runner = new Runner(initedOptions);
            this._buildTargets(initedOptions);
            this._configureNodes(initedOptions);
            this._runSpecs(initedOptions);
        },

        _init: function (options) {
            var root = helper.getRootPath(),
                engines = options.engines,
                coverage = options.coverage || {},
                diffOpts = options.htmlDiffer || {};

            diffOpts.preset || (diffOpts.preset = 'bem');

            if (coverage === true) {
                coverage = {
                    engines: Object.keys(engines)
                };
            }

            return {
                _options: options,
                root: root,
                destPath: options.destPath,
                levels: options.levels.map(function (levelPath) {
                    var level = (typeof levelPath === 'string') ? { path: levelPath } : levelPath;

                    level.path = path.resolve(root, level.path);

                    return level;
                }),
                langs: options.langs,
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
                    engines: [],
                    reportDirectory: 'coverage',
                    exclude: [
                        '**/node_modules/**',
                        '**/libs/**'
                    ],
                    reporters: process.env.BEM_TMPL_SPECS_COV_REPORTERS ?
                        process.env.BEM_TMPL_SPECS_COV_REPORTERS.split(',')
                        : ['lcov'],
                    completeBundle: ''
                }),
                referenceDirSuffixes: options.referenceDirSuffixes || ['tmpl-specs'],
                saveHtml: (typeof process.env.BEM_TMPL_SPECS_SAVE_HTML === 'undefined' ?
                    options.saveHtml :
                    process.env.BEM_TMPL_SPECS_SAVE_HTML) || false,
                grep: (typeof process.env.BEM_TMPL_SPECS_GREP === 'undefined' ?
                    options.grep :
                    process.env.BEM_TMPL_SPECS_GREP) || false,
                diffOpts: diffOpts,
                depsTech: options.depsTech
            };
        },

        _buildTargets: function (options) {
            var _this = this,
                dstpath = path.resolve(options.root, options.destPath);

            helper.prebuild(function (magic) {
                var completeBundleDirname;
                if (options.coverage.engines.length && options.coverage.completeBundle) {
                    completeBundleDirname = path.join(options.destPath, options.coverage.completeBundle);
                    magic.registerNode(completeBundleDirname);
                }

                return vow.all([
                    completeBundleDirname && vfs.makeDir(path.join(options.root, completeBundleDirname)),
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

                            var completeBundleNode = path.join(options.destPath, options.coverage.completeBundle);
                            options.nodesToRun = Object.keys(nodesToRun)
                                .concat(
                                    (completeBundleDirname && magic.isRequiredNode(completeBundleNode)) ?
                                        completeBundleNode :
                                        []
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
                    engines: options.engines,
                    saveHtml: options.saveHtml,
                    coverage: options.coverage,
                    sublevels: options.sublevels,
                    diffOpts: options.diffOpts
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
        },

        _runSpecs: function (options) {
            var runner = this._runner;

            helper._projectConfig.task(helper.getTaskName(), function () {
                var filesToRun = options.nodesToRun.map(function (node) {
                    var basename = path.basename(node);

                    return path.join(options.root, node, basename + '.tmpl-spec.js');
                });

                // В `pre` режиме magic-нод запускаем тесты только для таргета `?.tmpl-specs.js`
                if (helper.getMode() === 'pre' && filesToRun.length > 1) {
                    return;
                }

                return filesToRun.length && runner.run(filesToRun, options);
            });
        }
    };
};
