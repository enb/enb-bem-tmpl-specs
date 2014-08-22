var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');

module.exports = function (config) {
    config.includeConfig(rootPath);

    var tmplSpecs = config.module('enb-bem-tmpl-specs').createConfigurator('tmpl-specs');

    tmplSpecs.configure({
        destPath: 'tmpl-specs',
        levels: getLevels(config),
        sourceLevels: getSourceLevels(config),
        engines: {
            bh: {
                tech: 'enb-bh/techs/bh-server',
                options: {
                    jsAttrName: 'data-bem',
                    jsAttrScheme: 'json'
                }
            },
            'bemhtml-dev': {
                tech: 'enb-bemxjst/techs/bemhtml-old',
                options: { devMode: true }
            },
            'bemhtml-prod': {
                tech: 'enb-bemxjst/techs/bemhtml-old',
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
