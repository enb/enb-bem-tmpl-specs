var path = require('path');
var fs = require('fs');

var levels = require('enb/techs/levels');
var files = require('enb/techs/files');

var bemdeckByKeeps = require('./techs/bemdecl-by-keeps');
var bemdeckFromDepsByTech = require('enb/techs/bemdecl-from-deps-by-tech');
var depsByKeeps = require('./techs/deps-by-keeps');
var deps = require('enb/techs/deps-old');
var mergeBemdecl = require('enb/techs/bemdecl-merge');

var references = require('./techs/references');
var spec = require('./techs/tmpl-spec');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*');
    var sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var nodePath = nodeConfig.getNodePath();
        var sublevel = path.join(nodePath, 'blocks');
        var engines = options.engines;

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
            [deps],
            [files, {
                depsTarget: '?.base.deps.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        engines.forEach(function (engine) {
            nodeConfig.addTech([engine.tech, engine.options]);
            nodeConfig.addTarget(engine.target);
        });

        nodeConfig.addTechs([
            [references, { dirsTarget: '?.base.dirs' }],
            [spec, { engines: engines }]
        ]);

        nodeConfig.addTarget('?.tmpl-spec.js');
    });
};
