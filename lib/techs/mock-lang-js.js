var vfs = require('enb/lib/fs/async-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('mock-lang-js.js')
    .target('target', '?.js')
    .useSourceFilename('source', '?.lang.js')
    .builder(function (source) {
        return vfs.read(source, 'utf8')
            .then(function (content) {
                var mock = [
                    '(function(global, bem_) {',
                    '    if(bem_.I18N) return;',
                    '    global.BEM = bem_;',
                    '    var i18n = bem_.I18N = function(keyset, key) {',
                    '        return key;',
                    '    };',
                    '    i18n.keyset = function() { return i18n }',
                    '    i18n.key = function(key) { return key }',
                    '    i18n.lang = function() { return }',
                    '})(this, typeof BEM === \'undefined\' ? {} : BEM);'
                ].join('\n');

                return [mock, content].join('\n');
            });
    })
    .createTech();
