var naming = require('bem-naming');
var vfs = require('enb/lib/fs/async-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('deps-by-keeps')
    .target('target', '?.deps.js')
    .needRebuild(function () {
        return true;
    })
    .builder(function () {
        var target = this._target;
        var node = this.node;
        var dir = node.getDir();
        var deps = [];

        return vfs.listDir(dir)
            .then(function (list) {
                list.sort(function (filename1, filename2) {
                    var notation1 = naming.parse(filename1.split('.')[0]);
                    var notation2 = naming.parse(filename2.split('.')[0]);
                    var l1 = 0;
                    var l2 = 0;
                    var diff = 0;

                    Object.keys(notation1).forEach(function (key) {
                        if (key !== 'modVal' && notation1[key]) {
                            ++l1;
                        }
                    });

                    Object.keys(notation2).forEach(function (key) {
                        if (key !== 'modVal' && notation2[key]) {
                            ++l2;
                        }
                    });

                    diff = l1 - l2;

                    if (diff === 0) {
                        if (notation1.modName && notation2.elem) {
                            return -1;
                        }

                        if (notation1.elem && notation2.modName) {
                            return 1;
                        }
                    }

                    return diff;
                }).forEach(function (filename) {
                    var splited = filename.split('.');
                    var name = splited.shift();
                    var suffix = splited.join('.');

                    if (suffix === 'keep') {
                        var notation = naming.parse(name);
                        var dep = {
                            block: notation.block,
                            elem: notation.elem,
                            mod: notation.modName
                        };

                        if (notation.modVal !== true) {
                            dep.val = notation.modVal;
                        }

                        deps.push(dep);
                    }
                });

                node.resolveTarget(target, deps);

                return 'exports.deps = ' + JSON.stringify(deps) + ';';
            });
    })
    .createTech();
