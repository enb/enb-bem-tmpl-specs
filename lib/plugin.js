var path = require('path');
var _ = require('lodash');
var pseudo = require('enb-bem-pseudo-levels');
var builder = require('./builder');
var configurator = require('./node-configurator');
var runner = require('./runner');

module.exports = function (taskConfigutator) {
    return {
        configure: function (options) {
            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.fileSuffixes || (options.fileSuffixes = ['tmpl-spec.js']);
            options.bundleSuffixes || (options.bundleSuffixes = ['tmpl-specs']);

            var resolve = builder({ suffixes: [].concat(options.fileSuffixes, options.bundleSuffixes) });
            var config = taskConfigutator.getConfig();
            var root = config._rootPath;
            var dstpath = path.resolve(root, options.destPath);
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
                var dstargs = buildConfig._args.map(function (arg) {
                    return path.resolve(root, arg);
                });

                return pseudo(options.levels)
                    .addBuilder(dstpath, resolve)
                    .build(dstargs)
                    .then(function (filenames) {
                        var targets = filenames.map(function (filename) {
                            return path.relative(root, filename);
                        });

                        targets.forEach(function (target) {
                            var basename = path.basename(target);

                            if (basename !== '.blocks') {
                                buildConfig.addNode(path.dirname(target));
                            }
                        });
                    });
            });

            taskConfigutator.on('build', function (targets) {
                return runner.run(targets.map(function (target) {
                        var basename = path.basename(target);

                        return path.join(root, target, basename + '.tmpl-spec.js');
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
