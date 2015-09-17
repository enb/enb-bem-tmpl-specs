var path = require('path'),
    _ = require('lodash'),
    rootPath = path.join(__dirname, '..', '..', '..'),
    engines = {
        bh: {
            tech: 'enb-bh/techs/bh-server-include',
            options: { sourcemap: true, jsAttrName: 'data-bem', jsAttrScheme: 'json' }
        },
        bemhtml: {
            tech: 'enb-bemxjst/techs/bemhtml-old',
            options: { devMode: true }
        }
    };

module.exports = function (config) {
    config.includeConfig(rootPath);

    var module = config.module('enb-bem-tmpl-specs'),
        helper = module.createConfigurator('tmpl-specs');

    declareSpec('no lang', {
        langs: false,
        coverage: false
        // levels: ['common.blocks'] by default
    });

    declareSpec('custom deps', {
        depsTech: 'deps',
        langs: false,
        coverage: false
        // levels: ['common.blocks'] by default
    });

    declareSpec('no lang with coverage', {
        langs: false,
        coverage: true
    });

    declareSpec('langs: true', {
        langs: true,
        coverage: false
    });
    
    declareSpec('langs: true with coverage', {
        langs: true,
        coverage: true
    });

    declareSpec('many langs', {
        langs: ['ru', 'en'],
        coverage: false,
        levels: ['i18n.blocks']
    });

    declareSpec('many langs with coverage', {
        langs: ['ru', 'en'],
        coverage: true,
        levels: ['i18n.blocks']
    });

    // helper
    function declareSpec(name, opts) {
        var destPath = name.replace(/[^\w\d]+/ig, '-') + '.tmpl-specs'; // sluggified

        opts.destPath = destPath;

        helper.configure(_.assign({}, {
            engines: {
                'BH': engines.bh,
                'BEMHTML dev': engines.bemhtml,
                'BEMHTML prod': _.assign({}, engines.bemhtml, { options: { devMode: true }})
            },
            // levels for specs
            levels: [
                'common.blocks'
            ],
            // sourceLevels for block sources
            sourceLevels: [].concat([
                '../libs/bem-core/common.blocks',
                '../blocks'
            ], opts.levels || 'common.blocks')
        }, opts));
    }

};
