var path = require('path');
var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var naming = require('bem-naming');
var _ = require('lodash');
var scanner = require('enb-bem-pseudo-levels/lib/level-scanner');
var configurator = require('./node-configurator');
var runner = require('./runner');
var deps = require('enb-bem/lib/deps/deps');

module.exports = function (helper) {
    return {
        configure: function (options) {
            var initedOptions = this._init(options);

            configurator.configure(initedOptions.projectConfig, {
                destPath: options.destPath,
                sourceLevels: initedOptions.sourceLevels,
                engines: initedOptions.engines,
                saveHtml: options.saveHtml || false
            });

            this._buildSet(initedOptions);
            this._runSpecs(initedOptions);
        },

        _init: function (options) {
            var projectConfig = helper.getProjectConfig();
            var root = projectConfig.getRootPath();
            var engines = options.engines;

            return {
                _options: options,
                projectConfig: projectConfig,
                root: root,
                destPath: options.destPath,
                levels: options.levels.map(function (level) {
                    return (typeof level === 'string') ? { path: level } : level;
                }),
                engines: Object.keys(engines).map(function (name) {
                    var engine = engines[name];
                    var tech = require(engine.tech);
                    var options = _.clone(engine.options || {});
                    var target = '?.' + name.toLowerCase() + '.js';
                    var splitedTech = engine.tech.split(path.sep);
                    var isXjst = splitedTech.indexOf('enb-xjst') !== -1 || splitedTech.indexOf('enb-bemxjst') !== -1;

                    options.target = target;

                    return {
                        name: name,
                        tech: tech,
                        target: target,
                        exportName: isXjst ? (engine.options && engine.options.exportName || 'BEMHTML') : undefined,
                        options: options
                    };
                }),
                sourceLevels: options.sourceLevels || options.levels,
                referenceDirSuffixes: options.referenceDirSuffixes || ['tmpl-specs']
            };
        },

        _buildSet: function (options) {
            var _this = this;
            var dstpath = path.resolve(options.root, options.destPath);

            helper.prebuild(function (magic) {
                return scanner.scan(options.levels)
                    .then(function (files) {
                        var nodes = {};
                        var nodesToRun = {};

                        files.forEach(function (file) {
                            if (~options.referenceDirSuffixes.indexOf(file.suffix)) {
                                var bemname = file.name.split('.')[0];
                                var node = path.join(options.destPath, bemname);
                                var mainTarget = path.join(node, bemname + '.tmpl-spec.js');

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

        _buildBemdecl: function (dstpath, node) {
            var basename = path.basename(node);
            var dirname = path.join(dstpath, basename);
            var bemdeclFilename = path.join(dirname, basename + '.base.bemdecl.js');
            var notation = naming.parse(basename);
            var dep = { block: notation.block };
            var bemdeclSource;

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
            options.projectConfig.task(helper.getTaskName(), function () {
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
