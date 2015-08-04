var vfs = require('enb/lib/fs/async-fs'),
    File = require('enb-source-map/lib/file'),
    EOL = require('os').EOL;

module.exports = require('enb/lib/build-flow').create()
    .name('mock-lang-js.js')
    .target('target', '?.js')
    .useSourceFilename('source', '?.lang.js')
    .builder(function (sourceFilename) {
        return vfs.read(sourceFilename, 'utf8')
            .then(function (contents) {
                var withSourceMaps = true,
                    file = new File(this._target, withSourceMaps),
                    mock = [
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
                    ].join(EOL);

                file.write(mock);
                file.writeFileContent(sourceFilename, contents);

                return file.render();
            });
    })
    .createTech();
