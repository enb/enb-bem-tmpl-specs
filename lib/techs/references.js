var path = require('path'),
    vow = require('vow'),
    enb = require('enb'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    vfs = enb.asyncFs || require('enb/lib/fs/async-fs'),
    clearRequire = require('clear-require'),
    stringifyObject = require('stringify-object'),
    requireOrEval = require('enb-require-or-eval');

module.exports = buildFlow.create()
    .name('references')
    .target('target', '?.references.js')
    .useDirList('tmpl-specs')
    .builder(function (dirs) {
        var bemjsons = [],
            htmls = [];

        dirs.forEach(function (dir) {
            dir.files.forEach(function (file) {
                var filename = file.name,
                    fullname = file.fullname,
                    name = filename.split('.')[0],
                    lang = getLang(fullname),
                    item = {
                        name: name,
                        fullname: fullname,
                        lang: lang
                    };

                [
                    {
                        type: 'bemjson',
                        ext: '.bemjson.js',
                        arr: bemjsons
                    },
                    { type: 'html', ext: '.html', arr: htmls },
                    { type: 'data', ext: '.data.js', arr: bemjsons },
                ].forEach(function (bind) {
                    if (!hasExt(filename, bind.ext)) return;

                    item.type = bind.type;
                    bind.arr.push(item);
                });
            });
        });

        return vow.all([
            vow.all(bemjsons.map(function (file) {
                var filename = file.fullname;

                clearRequire(filename);

                return requireOrEval(filename)
                    .then(function (code) {
                        return {
                            name: file.name,
                            lang: file.lang,
                            code: code,
                            type: file.type,
                            dir: path.dirname(filename)
                        };
                    });
            })),
            vow.all(htmls.map(function (file) {
                return vfs.read(file.fullname, 'utf-8')
                    .then(function (source) {
                        return {
                            name: file.name,
                            lang: file.lang,
                            type: file.type,
                            source: source
                        };
                    });
            }))
        ]).spread(function (bemjsons, htmls) {
            var references = {};

            bemjsons.forEach(function (bemjson) {
                var name = bemjson.name,
                    code = bemjson.code,
                    lang = bemjson.lang,
                    dir = bemjson.dir,
                    type = bemjson.type,
                    reference = references[name] || (references[name] = {});

                if (lang) {
                    reference = reference[lang] || (reference[lang] = {});
                }

                reference[type] = code;
                reference.name = name;
                reference.dir = dir;
            });

            htmls.forEach(function (html) {
                var name = html.name,
                    source = html.source,
                    lang = html.lang,
                    reference = references[name] || (references[name] = {});

                if (lang) {
                    reference = reference[lang] || (reference[lang] = {});
                }

                reference.html = source;
            });

            return 'module.exports = ' +
                stringifyObject(references, { indent: '    ' }) + ';';
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
