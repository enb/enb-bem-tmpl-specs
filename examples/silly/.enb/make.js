var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');

module.exports = function (config) {
    config.includeConfig(rootPath);

    var tmplSpecs = config.module('enb-bem-tmpl-specs').createConfigurator('tmpl-specs');

    tmplSpecs.configure({
        destPath: 'tmpl-specs',
        levels: ['blocks'],
        sourceLevels: [
            { path: '../libs/bem-core/common.blocks', check: false },
            { path: 'blocks', check: true }
        ],
        coverage: true,
        engines: {
            bh: {
                tech: 'enb-bh/techs/bh-server-include',
                options: {
                    sourcemap: true,
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
