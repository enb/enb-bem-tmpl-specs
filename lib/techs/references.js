var path = require('path'),
    vow = require('vow'),
    enb = require('enb'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    vfs = enb.asyncFs || require('enb/lib/fs/async-fs'),
    _ = require('lodash'),
    clearRequire = require('clear-require'),
    requireOrEval = require('enb-require-or-eval');

module.exports = buildFlow.create()
    .name('references')
    .target('target', '?.references.js')
    .defineOption('saveReferenceHtml', false)
    .useDirList('tmpl-specs')
    .builder(function (dirs) {
        var target = this._target,
            logger = this.node.getLogger(),
            bemjsons = [],
            htmls = [],
            saveReferenceHtml = this._saveReferenceHtml;

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

                clearRequire(filename);

                return requireOrEval(filename)
                    .then(function (code) {
                        return {
                            name: name,
                            lang: lang,
                            code: code,
                            dir: path.dirname(filename)
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
                    dir = bemjson.dir,
                    reference = references[name] || (references[name] = {});

                if (lang) {
                    reference = reference[lang] || (reference[lang] = {});
                }

                reference.bemjson = code;
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

            Object.keys(references).forEach(function (name) {
                var item = references[name],
                    noBemjson = !item.hasOwnProperty('bemjson'),
                    noHtml = !item.hasOwnProperty('html');

                if (noBemjson && noHtml) {
                    Object.keys(item).forEach(function (lang) {
                        var subitem = item[lang],
                            noBemjson = !subitem.hasOwnProperty('bemjson'),
                            noHtml = !subitem.hasOwnProperty('html');

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

                    if (noHtml && saveReferenceHtml) {
                        references[name].html = '';
                        return;
                    }

                    delete references[name];
                }
            });

            return 'module.exports = ' + JSON.stringify(references, null, 4) + ';';
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
