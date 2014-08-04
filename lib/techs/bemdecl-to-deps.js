var inherit = require('inherit');
var vfs = require('enb/lib/fs/async-fs');
var deps = require('enb-bem/lib/deps/deps');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');
var asyncRequire = require('enb/lib/fs/async-require');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'bemdecl-to-deps';
    },

    configure: function () {
        this._source = this.node.unmaskTargetName(this.getRequiredOption('source'));
        this._target = this.node.unmaskTargetName(this.getRequiredOption('target'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var node = this.node;
        var target = this._target;
        var cache = node.getNodeCache(target);
        var bemdeclFilename = this.node.resolvePath(this._source);
        var depsFilename = this.node.resolvePath(target);

        if (cache.needRebuildFile('bemdecl-file', bemdeclFilename) ||
            cache.needRebuildFile('deps-file', depsFilename)
            ) {
            dropRequireCache(require, bemdeclFilename);
            return asyncRequire(bemdeclFilename)
                .then(function (result) {
                    var str = 'exports.deps = ' + JSON.stringify(deps.fromBemdecl(result.blocks)) + ';';

                    return vfs.write(depsFilename, str, 'utf8')
                        .then(function () {
                            cache.cacheFileInfo('bemdecl-file', bemdeclFilename);
                            cache.cacheFileInfo('deps-file', depsFilename);
                            node.resolveTarget(target, deps.fromBemdecl(result.blocks));
                        });
                });
        } else {
            node.isValidTarget(target);

            dropRequireCache(require, depsFilename);
            return asyncRequire(depsFilename)
                .then(function (result) {
                    node.resolveTarget(target, result.deps);
                });
        }
    },

    clean: function () {}
});
