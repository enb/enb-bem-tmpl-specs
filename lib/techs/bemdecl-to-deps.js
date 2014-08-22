var inherit = require('inherit'),
    vfs = require('enb/lib/fs/async-fs'),
    deps = require('enb-bem/lib/deps/deps'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    asyncRequire = require('enb/lib/fs/async-require');

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
        var node = this.node,
            target = this._target,
            cache = node.getNodeCache(target),
            bemdeclFilename = this.node.resolvePath(this._source),
            depsFilename = this.node.resolvePath(target);

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
