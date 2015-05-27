var path = require('path'),
    vow = require('vow'),
    vfs = require('enb/lib/fs/async-fs'),
    _ = require('lodash'),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),
    requireOrEval = require('enb/lib/fs/require-or-eval');

module.exports = require('enb/lib/build-flow').create()
    .name('references')
    .target('target', '?.references.js')
    .useDirList('tmpl-specs')
    .builder(function (dirs) {
        var target = this._target,
            logger = this.node.getLogger(),
            bemjsons = [],
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

                if (hasExt(filename, '.bemjson.js')) {
                    bemjsons.push(item);
                } else if (hasExt(filename, '.html')) {
                    htmls.push(item);
                }
            });
        });

        return vow.all([
            vow.all(bemjsons.map(function (file) {
                var name = file.name,
                    lang = file.lang,
                    filename = file.fullname;

                dropRequireCache(require, filename);

                return requireOrEval(filename)
                    .then(function (code) {
                        return {
                            name: name,
                            lang: lang,
                            code: code
                        };
                    });
            })),
            vow.all(htmls.map(function (file) {
                var name = file.name,
                    lang = file.lang;

                return vfs.read(file.fullname, 'utf-8')
                    .then(function (source) {
                        return {
                            name: name,
                            lang: lang,
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
                    reference = references[name] || (references[name] = {});

                if (lang) {
                    reference[lang] || (reference[lang] = {});
                    reference[lang].bemjson = code;
                } else {
                    reference.bemjson = code;
                }
            });

            htmls.forEach(function (html) {
                var name = html.name,
                    source = html.source,
                    lang = html.lang,
                    reference = references[name] || (references[name] = {});

                if (lang) {
                    reference[lang] || (reference[lang] = {});
                    reference[lang].html = source;
                } else {
                    reference.html = source;
                }
            });

            Object.keys(references).forEach(function (name) {
                var item = references[name],
                    noBemjson = !item.hasOwnProperty('bemjson'),
                    noHtml = !item.hasOwnProperty('html');

                if (noBemjson && noHtml) {
                    Object.keys(item).forEach(function (lang) {
                        var subitem = item[lang],
                            noBemjson = subitem.hasOwnProperty('bemjson'),
                            noHtml = subitem.hasOwnProperty('html');

                        if (noBemjson || noHtml) {
                            var message = 'There\'s no ' + (noBemjson ? 'BEMJSON' : 'HTML') +
                                ' file for `' + name + '` reference';

                            logger.logWarningAction('references', target, message);

                            delete item[lang];
                        }
                    });

                    if (_.isEmpty(item)) {
                        delete references[name];
                    }
                } else if (noBemjson || noHtml) {
                    var message = 'There\'s no ' + (noBemjson ? 'BEMJSON' : 'HTML') +
                        ' file for `' + name + '` reference';

                    logger.logWarningAction('references', target, message);

                    delete references[name];
                }
            });

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
