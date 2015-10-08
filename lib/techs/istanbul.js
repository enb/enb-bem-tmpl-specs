var enb = require('enb'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    Instrumenter = require('istanbul').Instrumenter,
    fs = require('vow-fs');

module.exports = buildFlow.create()
    .name('istanbul')
    .target('target', '?.instrumented.js')
    .useSourceFilename('source', '?.js')
    .builder(function (source) {
        return fs.read(source, 'utf8')
            .then(function (content) {
                var instrumenter = new Instrumenter();
                return instrumenter.instrumentSync(content, source);
            });
    })
    .createTech();
