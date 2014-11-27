var path = require('path'),
    fs = require('fs'),

    _ = require('lodash'),

    levels = require('enb-bem-techs/techs/levels'),
    files = require('enb-bem-techs/techs/files'),

    provide = require('enb/techs/file-provider'),
    depsByTechToBemdecl = require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'),
    deps = require('enb-bem-techs/techs/deps-old'),
    mergeBemdecl = require('enb-bem-techs/techs/merge-bemdecl'),

    references = require('./techs/references'),
    istanbul = require('./techs/istanbul'),
    spec = require('./techs/tmpl-spec'),
    instrumentedTarget = require('./util').instrumentedTarget;

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*'),
        sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var nodePath = nodeConfig.getNodePath(),
            sublevel = path.join(nodePath, 'blocks'),
            engines = options.engines,
            coverageEngines = options.coverage.engines,
            engineTargets = [];

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [provide, { target: '?.base.bemdecl.js' }],
            [depsByTechToBemdecl, {
                target: '?.tech.bemdecl.js',
                filesTarget: '?.base.files',
                sourceTech: 'tmpl-spec.js'
            }],
            [mergeBemdecl, { sources: ['?.base.bemdecl.js', '?.tech.bemdecl.js'] }],
            [deps],
            [files, {
                depsFile: '?.base.bemdecl.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        engines.forEach(function (engine) {
            nodeConfig.addTech([engine.tech, engine.options]);
            if (_.contains(coverageEngines, engine.name)) {
                var instrumented = instrumentedTarget(engine.target);
                nodeConfig.addTech([
                    istanbul,
                    { source: engine.target, target: instrumented }
                ]);
                engineTargets.push(instrumented);
            } else {
                engineTargets.push(engine.target);
            }
        });

        nodeConfig.addTechs([
            [references, { dirsTarget: '?.base.dirs' }],
            [spec, {
                engines: engines,
                engineTargets: engineTargets,
                saveHtml: options.saveHtml,
                coverageEngines: coverageEngines
            }]
        ]);

        nodeConfig.addTarget('?.tmpl-spec.js');
    });
};
