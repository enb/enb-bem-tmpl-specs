var vow = require('vow');
var vfs = require('enb/lib/fs/async-fs');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');
var requireOrEval = require('enb/lib/fs/require-or-eval');

module.exports = require('enb/lib/build-flow').create()
    .name('references')
    .target('target', '?.references.js')
    .useDirList('tmpl-specs')
    .builder(function (dirs) {
        var bemjsons = {};
        var htmls = {};

        dirs.forEach(function (dir) {
            dir.files.forEach(function (file) {
                var filename = file.name;
                var name = filename.split('.')[0];

                if (hasExt(filename, '.bemjson.js')) {
                    bemjsons[name] = file.fullname;
                } else if (hasExt(filename, '.html')) {
                    htmls[name] = file.fullname;
                }
            });
        });

        return vow.all([
            vow.all(Object.keys(bemjsons).map(function (name) {
                var filename = bemjsons[name];

                dropRequireCache(require, filename);

                return requireOrEval(filename)
                    .then(function (code) {
                        bemjsons[name] = code;
                    });
            })),
            vow.all(Object.keys(htmls).map(function (name) {
                var filename = htmls[name];

                return vfs.read(filename, 'utf-8')
                    .then(function (source) {
                        htmls[name] = source;
                    });
            }))
        ]).then(function () {
            return 'module.exports = ' + JSON.stringify({
                bemjsons: bemjsons,
                htmls: htmls
            }) + ';';
        });
    })
    .createTech();

function hasExt(filename, ext) {
    var index = filename.indexOf(ext);

    return index !== -1 && (index === filename.length - ext.length);
}
