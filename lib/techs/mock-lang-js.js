var vfs = require('enb/lib/fs/async-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('mock-lang-js.js')
    .target('target', '?.js')
    .useSourceFilename('source', '?.lang.js')
    .builder(function (source) {
        return vfs.read(source, 'utf8')
            .then(function (content) {
                var mock = [
                        ';(function(global, bem_) {',
                        '    global.BEM = bem_;',
                        '    var i18n = bem_.I18N = function(keyset, key, param) {',
                        '       var result = key;',
                        '       if(param){',
                        '           result += ": " + JSON.stringify(param);',
                        '       }',
                        '       return result;',
                        '    };',
                        '    i18n.keyset = function() { return i18n }',
                        '    i18n.key = function(key) { return key }',
                        '    i18n.lang = function() { return }',
                        '}(this, typeof BEM === \'undefined\' ? {} : BEM));'
                    ].join('\n'),
                    mapIndex = content.lastIndexOf('//# sourceMappingURL='),
                    map;

                // if there is a #sourceMappingURL pragma append
                // the mock before it so the source map will be
                // valid. We can't insert it in the beginning because
                // source map locations will point to the wrong lines.
                if (mapIndex !== -1) {
                    map = content.substring(mapIndex);
                    content = content.substring(0, mapIndex);
                }

                return [content, mock, map].join('\n');
            });
    })
    .createTech();
