var builder = require('./builder');
var configurator = require('./node-configurator');

module.exports = function (maker) {
    return {
        build: function (options) {
            options || (options = {});
            options.sourceLevels || (options.sourceLevels = options.levels);
            options.fileSuffixes || (options.fileSuffixes = ['tmpl-spec.js']);
            options.bundleSuffixes || (options.bundleSuffixes = ['tmpl-specs']);

            var resolve = builder({ suffixes: options.fileSuffixes });
            var config = maker._config;

            configurator.configure(config, options);

            maker._pseudoLevels.push({
                destPath: options.destPath,
                levels: options.levels,
                resolve: resolve
            });

            return maker._deferred.promise();
        }
    };
};
