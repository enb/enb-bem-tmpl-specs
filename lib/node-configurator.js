var path = require('path');
var fs = require('fs');

var levels = require('enb-bem/techs/levels');
var files = require('enb-bem/techs/files');

var provide = require('enb/techs/file-provider');
var bemdeckFromDepsByTech = require('enb-bem/techs/bemdecl-from-deps-by-tech');
var deps = require('enb-bem/techs/deps-old');
var bemdeclToDeps = require('./techs/bemdecl-to-deps');
var mergeBemdecl = require('enb-bem/techs/merge-bemdecl');

var references = require('./techs/references');
var spec = require('./techs/tmpl-spec');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*');
    var sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var nodePath = nodeConfig.getNodePath();
        var sublevel = path.join(nodePath, 'blocks');
        var engines = options.engines;
        var engineTargets = [];

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [provide, { target: '?.base.bemdecl.js' }],
            [bemdeckFromDepsByTech, {
                target: '?.tech.bemdecl.js',
                filesTarget: '?.base.files',
                sourceTech: 'tmpl-spec.js', destTech: 'bemhtml'
            }],
            [mergeBemdecl, { bemdeclSources: ['?.base.bemdecl.js', '?.tech.bemdecl.js'] }],
            [bemdeclToDeps, { source: '?.base.bemdecl.js', target: '?.base.deps.js' }],
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
            engineTargets.push(engine.target);
        });

        nodeConfig.addTechs([
            [references, { dirsTarget: '?.base.dirs' }],
            [spec, { engines: engines, engineTargets: engineTargets }]
        ]);

        nodeConfig.addTarget('?.tmpl-spec.js');
    });
};
