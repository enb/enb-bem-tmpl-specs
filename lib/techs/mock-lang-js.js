var enb = require('enb'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    vfs = enb.asyncFs || require('enb/lib/fs/async-fs'),
    File = require('enb-source-map/lib/file'),
    mock = require('../mock-i18n'),
    EOL = require('os').EOL;

module.exports = buildFlow.create()
    .name('mock-lang-js.js')
    .target('target', '?.js')
    .defineOption('mockFunction')
    .useSourceFilename('source', '?.lang.js')
    .builder(function (sourceFilename) {
        var mockFunction = this._mockFunction || mock;

        return vfs.read(sourceFilename, 'utf8')
            .then(function (contents) {
                var withSourceMaps = true,
                    file = new File(this._target, withSourceMaps),
                    mock = [
                        ';(' + mockFunction.toString() + '(this, typeof BEM === \'undefined\' ? {} : BEM));'
                    ].join(EOL);

                file.write(mock);
                file.writeFileContent(sourceFilename, contents);

                return file.render();
            });
    })
    .createTech();
