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
            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.referenceDirSuffixes || (options.referenceDirSuffixes = ['tmpl-specs']);

            var config = helper.getProjectConfig();
            var root = config.getRootPath();
            var dstpath = path.resolve(root, options.destPath);
            var engines = options.engines;
            var levels = options.levels.map(function (level) {
                return (typeof level === 'string') ? { path: level } : level;
            });
            var nodes = {};

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

            helper.prebuild(function (magic) {
                return scanner.scan(levels)
                    .then(function (files) {
                        files.forEach(function (file) {
                            if (~options.referenceDirSuffixes.indexOf(file.suffix)) {
                                var bemname = file.name.split('.')[0];
                                var node = path.join(options.destPath, bemname);

                                if (magic.isRequiredNode(node)) {
                                    nodes[node] = true;
                                    magic.registerNode(node);
                                }
                            }
                        });

                        return vow.all(Object.keys(nodes).map(function (node) {
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

            config.task(helper.getTaskName(), function () {
                return runner.run(Object.keys(nodes).map(function (node) {
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
