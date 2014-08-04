var path = require('path');
var _ = require('lodash');
var builder = require('./builder');
var configurator = require('./node-configurator');
var runner = require('./runner');

module.exports = function (maker) {
    return {
        configure: function (options) {
            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.fileSuffixes || (options.fileSuffixes = ['tmpl-spec.js']);
            options.bundleSuffixes || (options.bundleSuffixes = ['tmpl-specs']);

            var resolve = builder({ suffixes: [].concat(options.fileSuffixes, options.bundleSuffixes) });
            var config = maker._config;
            var cdir = config._rootPath;
            var buildDeferred = maker._buildDeferred;
            var deferred = maker._deferred;
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

            maker._pseudoLevels.push({
                destPath: options.destPath,
                levels: options.levels,
                resolve: resolve
            });

            buildDeferred.promise()
                .then(function (targets) {
                    return runner.run(targets.map(function (target) {
                        var basename = path.basename(target);

                        return path.join(cdir, target, basename + '.tmpl-spec.js');
                    }));
                })
                .then(function (res) {
                    deferred.resolve(res);
                })
                .fail(function (err) {
                    if (err.stack) {
                        console.error(err.stack);
                    }

                    deferred.reject(new Error('Fail template specs'));
                });
        }
    };
};
