var path = require('path'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    naming = require('bem-naming'),
    _ = require('lodash'),
    scanner = require('enb-bem-pseudo-levels/lib/level-scanner'),
    configurator = require('./node-configurator'),
    runner = require('./runner'),
    deps = require('enb-bem-techs/lib/deps/deps'),
    XJST_PACKAGES = ['enb-xjst', 'enb-bemhtml', 'enb-bemxjst'],
    XJST_EXPORT_NAME = 'BEMHTML';

module.exports = function (helper) {
    return {
        configure: function (options) {
            var initedOptions = this._init(options);

            this._buildTargets(initedOptions);
            this._configureNodes(initedOptions);
            this._runSpecs(initedOptions);
        },

        _init: function (options) {
            var root = helper.getRootPath(),
                engines = options.engines;

            return {
                _options: options,
                root: root,
                destPath: options.destPath,
                levels: options.levels.map(function (levelPath) {
                    var level = (typeof levelPath === 'string') ? { path: levelPath } : levelPath;

                    level.path = path.resolve(root, level.path);

                    return level;
                }),
                engines: _.map(engines, function (engine, name) {
                    var techPath = engine.tech,
                        tech = require(techPath),
                        options = _.cloneDeep(engine.options || {}),
                        target = '?.' + name.toLowerCase() + '.js',
                        exportName = options && options.exportName;

                    // Задаём `exportName` по умолчанию для xjst-шаблонизаторов
                    if (!exportName && _.intersection(techPath.split(path.sep), XJST_PACKAGES).length) {
                        exportName = XJST_EXPORT_NAME;
                    }

                    options.target = target;

                    return {
                        name: name,
                        tech: tech,
                        target: target,
                        exportName: exportName,
                        options: options
                    };
                }),
                sourceLevels: options.sourceLevels || options.levels,
                referenceDirSuffixes: options.referenceDirSuffixes || ['tmpl-specs'],
                saveHtml: (typeof process.env.BEM_TMPL_SPECS_SAVE_HTML === 'undefined' ?
                    options.saveHtml :
                    process.env.BEM_TMPL_SPECS_SAVE_HTML) || false
            };
        },

        _buildTargets: function (options) {
            var _this = this,
                dstpath = path.resolve(options.root, options.destPath);

            helper.prebuild(function (magic) {
                return scanner.scan(options.levels)
                    .then(function (files) {
                        var nodes = {},
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
                            }
                        });

                        options.nodes = Object.keys(nodes);
                        options.nodesToRun = Object.keys(nodesToRun);

                        return vow.all(options.nodes.map(function (node) {
                            return _this._buildBemdecl(dstpath, node);
                        }));
                    });
            });
        },

        _configureNodes: function (options) {
            helper.configure(function (projectConfig) {
                configurator.configure(projectConfig, {
                    destPath: options.destPath,
                    sourceLevels: options.sourceLevels,
                    engines: options.engines,
                    saveHtml: options.saveHtml
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

            bemdeclSource = 'exports.blocks = ' + JSON.stringify(deps.toBemdecl([dep])) + ';';

            return vfs.makeDir(dirname)
                .then(function () {
                    return vfs.write(bemdeclFilename, bemdeclSource, 'utf-8');
                });
        },

        _runSpecs: function (options) {
            helper._projectConfig.task(helper.getTaskName(), function () {
                var filesToRun = options.nodesToRun.map(function (node) {
                    var basename = path.basename(node);

                    return path.join(options.root, node, basename + '.tmpl-spec.js');
                });

                return filesToRun.length && runner.run(filesToRun)
                    .fail(function (err) {
                        if (err.stack) {
                            console.error(err.stack);
                        }

                        process.exit(1);
                    });
            });
        }
    };
};
