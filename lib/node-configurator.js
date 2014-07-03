var path = require('path');
var fs = require('fs');

var levels = require('enb/techs/levels');
var files = require('enb/techs/files');

var bemdeckByKeeps = require('./techs/bemdecl-by-keeps');
var depsByKeeps = require('./techs/deps-by-keeps');
var deps = require('enb/techs/deps-old');

var bemhtml = require('enb-bemxjst/techs/bemhtml-old');
var bh = require('enb-bh/techs/bh-server');
var bhFilename = path.join(__dirname, '..', 'node_modules', 'bh', 'lib', 'bh.js');

var references = require('./techs/references.js');
var js = require('enb/techs/js');
var spec = require('./techs/tmpl-spec');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*');
    var sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var root = config.getRootPath();
        var nodePath = nodeConfig.getNodePath();
        var sublevel = path.join(nodePath, 'blocks');

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [bemdeckByKeeps, { target: '?.bemdecl.js' }],
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

        // BH
        nodeConfig.addTechs([
            [bh, {
                bhFile: path.relative(root, bhFilename),
                jsAttrName: 'data-bem',
                jsAttrScheme: 'json'
            }]
        ]);

        nodeConfig.addTechs([
            [references],
            [js, {
                target: '?.pure.tmpl-spec.js',
                sourceSuffixes: ['tmpl-spec.js'],
                filesTarget: '?.base.files'
            }],
            [spec, { bemhtmlFile: '?.prod.bemhtml.js' }]
        ]);

        nodeConfig.addTargets([
            '?.tmpl-spec.js'
        ]);
    });
};
