var path = require('path');
var fs = require('fs');

var levels = require('enb/techs/levels');
var files = require('enb/techs/files');

var bemdeckByKeeps = require('./techs/bemdecl-by-keeps');
var bemdeckFromDepsByTech = require('enb/techs/bemdecl-from-deps-by-tech');
var depsByKeeps = require('./techs/deps-by-keeps');
var deps = require('enb/techs/deps-old');
var mergeBemdecl = require('enb/techs/bemdecl-merge');

var references = require('./techs/references.js');
var js = require('enb/techs/js');
var spec = require('./techs/tmpl-spec');

var bemhtml;
var bh;
var bhFilename;
var fake = require('./techs/fake');

try {
    bemhtml = require('enb-bemxjst/techs/bemhtml-old');
} catch (err) {}

try {
    bemhtml = require('enb-xjst/techs/bemhtml');
} catch (err) {}

try {
    bh = require('enb-bh/techs/bh-server');
    bhFilename = path.join(require.resolve('bh'), '..', 'lib', 'bh.js');
} catch (err) {}

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*');
    var sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var root = config.getRootPath();
        var nodePath = nodeConfig.getNodePath();
        var sublevel = path.join(nodePath, 'blocks');
        var engines = [];

        if (bemhtml) {
            engines.push('bemhtml');
        }

        if (bh) {
            engines.push('bh');
        }

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [bemdeckByKeeps, { target: '?.keep.bemdecl.js' }],
            [bemdeckFromDepsByTech, {
                target: '?.tech.bemdecl.js',
                filesTarget: '?.base.files',
                sourceTech: 'tmpl-spec.js', destTech: 'bemhtml'
            }],
            [mergeBemdecl, { bemdeclSources: ['?.keep.bemdecl.js', '?.tech.bemdecl.js'] }],
            [depsByKeeps, { target: '?.base.deps.js' }],
            [deps]
        ]);

        // Files
        nodeConfig.addTechs([
            [files, {
                depsTarget: '?.base.deps.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        // BEMHTML
        if (bemhtml) {
            nodeConfig.addTechs([
                [bemhtml, {
                    target: '?.prod.bemhtml.js',
                    devMode: false
                }],
                [bemhtml, {
                    target: '?.dev.bemhtml.js',
                    devMode: true
                }]
            ]);
        } else {
            nodeConfig.addTechs([
                [fake, { target: '?.prod.bemhtml.js' }],
                [fake, { target: '?.dev.bemhtml.js' }]
            ]);
        }

        // BH
        if (bh) {
            nodeConfig.addTechs([
                [bh, {
                    bhFile: path.relative(root, bhFilename),
                    jsAttrName: 'data-bem',
                    jsAttrScheme: 'json'
                }]
            ]);
        } else {
            nodeConfig.addTech([fake, { target: '?.bh.js' }]);
        }

        nodeConfig.addTechs([
            [references, {
                dirsTarget: '?.base.dirs'
            }],
            [js, {
                target: '?.pure.tmpl-spec.js',
                sourceSuffixes: ['tmpl-spec.js'],
                filesTarget: '?.base.files'
            }],
            [spec, { engines: engines, bemhtmlFile: '?.prod.bemhtml.js' }]
        ]);

        nodeConfig.addTargets([
            '?.tmpl-spec.js'
        ]);
    });
};
