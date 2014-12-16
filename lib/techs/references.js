var path = require('path'),
    vow = require('vow'),
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
                var filename = bemjsons[name],
                    lang = getLang(filename);

                dropRequireCache(require, filename);

                return requireOrEval(filename)
                    .then(function (code) {
                        var reference = references[name] || (references[name] = {});

                        if (lang) {
                            reference[lang] || (reference[lang] = {});
                            reference[lang].bemjson = code;
                        } else {
                            reference.bemjson = code;
                        }
                    });
            })),
            vow.all(Object.keys(htmls).map(function (name) {
                var filename = htmls[name],
                    lang = getLang(filename);

                return vfs.read(filename, 'utf-8')
                    .then(function (source) {
                        var reference = references[name] || (references[name] = {});

                        if (lang) {
                            reference[lang] || (reference[lang] = {});
                            reference[lang].html = source;
                        } else {
                            reference.html = source;
                        }
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

function getLang(filename) {
    var splited = path.basename(filename).split('.');

    if (splited.length === 3 && splited[2] === 'html') {
        return splited[1];
    }

    if (splited.length === 4 && splited[3] === 'js' && splited[2] === 'bemjson') {
        return splited[1];
    }
}
