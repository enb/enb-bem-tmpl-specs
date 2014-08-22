var vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    requireOrEval = require('enb/lib/fs/require-or-eval');

module.exports = require('enb/lib/build-flow').create()
    .name('references')
    .target('target', '?.references.js')
    .useDirList('tmpl-specs')
    .builder(function (dirs) {
        var references = {},
            bemjsons = {},
            htmls = {};

        dirs.forEach(function (dir) {
            dir.files.forEach(function (file) {
                var filename = file.name,
                    name = filename.split('.')[0];

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
                        references[name] || (references[name] = {});
                        references[name].bemjson = code;
                    });
            })),
            vow.all(Object.keys(htmls).map(function (name) {
                var filename = htmls[name];

                return vfs.read(filename, 'utf-8')
                    .then(function (source) {
                        references[name] || (references[name] = {});
                        references[name].html = source;
                    });
            }))
        ]).then(function () {
            return 'module.exports = ' + JSON.stringify(references) + ';';
        });
    })
    .createTech();

function hasExt(filename, ext) {
    var index = filename.indexOf(ext);

    return index !== -1 && (index === filename.length - ext.length);
}
