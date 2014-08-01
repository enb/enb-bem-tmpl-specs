var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');
var tmplSpecsSets = require(rootPath);

module.exports = function (config) {
    var tmplSpecs = tmplSpecsSets.create('tmpl-specs', config);

    tmplSpecs.configure({
        destPath: 'tmpl-specs',
        levels: getLevels(config),
        sourceLevels: getSourceLevels(config),
        engines: {
            bh: {
                tech: 'enb-bh/techs/bh-server',
                options: {
                    bhFile: '../../node_modules/bh/lib/bh.js',
                    jsAttrName: 'data-bem',
                    jsAttrScheme: 'json'
                }
            },
            bemhtmlDev: {
                tech: 'enb-bemxjst/techs/bemhtml-old',
                exportName: 'BEMHTML',
                options: { devMode: true }
            },
            bemhtmlProd: {
                tech: 'enb-bemxjst/techs/bemhtml-old',
                exportName: 'BEMHTML',
                options: { devMode: false }
            }
        }
    });
};

function getLevels (config) {
    return [
        'blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}

function getSourceLevels (config) {
    return [
        { path: '../libs/bem-core/common.blocks', check: false },
        'blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}
