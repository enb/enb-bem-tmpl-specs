var fs = require('fs'),
    path = require('path'),
    asset = fs.readFileSync(path.join(__dirname, '..', 'assets', 'tmpl-spec')),
    _ = require('lodash'),
    htmlDifferFilename = path.join(__dirname, '..', '..', 'node_modules', 'html-differ'),
    jsBeautifyFilename = path.join(__dirname, '..', '..', 'node_modules', 'js-beautify');

module.exports = require('enb/lib/build-flow').create()
    .name('tmpl-spec')
    .target('target', '?.tmpl-spec.js')
    .defineRequiredOption('engines')
    .defineOption('saveHtml', false)
    .useSourceFilename('references', '?.references.js')
    .useSourceListFilenames('engineTargets', [])
    .builder(function (referencesFilename) {
        var node = this.node,
            nodeDirname = node.getDir(),
            describe = path.basename(node.getDir()) + ' (' + path.dirname(node.getPath()) + ')',
            references = require(referencesFilename),
            engines = this._engines.map(function (engine) {
                var target = node.unmaskTargetName(engine.target),
                    filename = ['.', target].join(path.sep);

                return {
                    name: engine.name,
                    varname: engine.name.replace(/\W/gi, '_'),
                    path: filename,
                    filename: path.join(nodeDirname, target),
                    exportName: engine.exportName && '.' + engine.exportName
                };
            }),
            its = [];

        Object.keys(references).forEach(function (name) {
            var bemjson = references[name].bemjson,
                html = references[name].html;

            bemjson && html && its.push(name);
        });

        return _.template(asset, {
            describe: describe,
            htmlDifferFilename: ['.', path.relative(nodeDirname, htmlDifferFilename)].join(path.sep),
            referencesFilename: ['.', path.relative(nodeDirname, referencesFilename)].join(path.sep),
            jsBeautifyFilename: ['.', path.relative(nodeDirname, jsBeautifyFilename)].join(path.sep),
            its: its,
            engines: engines,
            nodeDirname: nodeDirname,
            saveHtml: this._saveHtml
        });
    })
    .createTech();
