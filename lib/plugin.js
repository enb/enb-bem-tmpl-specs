var path = require('path');
var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var naming = require('bem-naming');
var _ = require('lodash');
var scanner = require('enb-bem-pseudo-levels/lib/level-scanner');
var configurator = require('./node-configurator');
var runner = require('./runner');
var deps = require('enb-bem/lib/deps/deps');

module.exports = function (taskConfigutator) {
    return {
        configure: function (options) {
            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.bundleSuffixes || (options.bundleSuffixes = ['tmpl-specs']);

            var config = taskConfigutator.getConfig();
            var root = config._rootPath;
            var dstpath = path.resolve(root, options.destPath);
            var levels = options.levels.map(function (level) {
                return (typeof level === 'string') ? { path: level } : level;
            });
            var engines = options.engines;

            engines = Object.keys(engines).map(function (name) {
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
            });

            configurator.configure(config, {
                destPath: options.destPath,
                sourceLevels: options.sourceLevels,
                engines: engines
            });

            taskConfigutator.prebuild(function (buildConfig) {
                return scanner.scan(levels)
                    .then(function (files) {
                        files.forEach(function (file) {
                            if (~options.bundleSuffixes.indexOf(file.suffix)) {
                                var bemname = file.name.split('.')[0];
                                var node = path.join(options.destPath, bemname);

                                buildConfig.addNode(node);
                            }
                        });

                        return vow.all(buildConfig.getNodes().map(function (node) {
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
                        }));
                    });
            });

            taskConfigutator.on('build', function (nodes) {
                return runner.run(nodes.map(function (node) {
                        var basename = path.basename(node);

                        return path.join(root, node, basename + '.tmpl-spec.js');
                    }))
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
