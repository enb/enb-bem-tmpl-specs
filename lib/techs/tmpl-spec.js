var fs = require('fs');
var path = require('path');
var asset = fs.readFileSync(path.join(__dirname,'..', 'assets', 'tmpl-spec'));
var _ = require('lodash');

module.exports = require('enb/lib/build-flow').create()
    .name('tmpl-spec')
    .target('target', '?.tmpl-spec.js')
    .defineRequiredOption('engines')
    .useSourceFilename('references', '?.references.js')
    .builder(function (referencesFilename) {
        var node = this.node;
        var nodepath = node.getPath();
        var nodedir = node.getDir();
        var dstpath = path.dirname(nodepath);
        var nodename = path.basename(node.getDir());
        var describe = nodename + '\u001b[' + 94 + 'm' + ' (' + dstpath + ')' + '\u001b[0m';
        var references = require(referencesFilename);
        var engines = this._engines.map(function (engine) {
            var filename = ['.', node.unmaskTargetName(engine.target)].join(path.sep);

            return {
                name: engine.name,
                path: filename,
                exportName: engine.exportName && '.' + engine.exportName
            };
        });
        var its = [];

        Object.keys(references).forEach(function (name) {
            var bemjson = references[name].bemjson;
            var html = references[name].html;

            bemjson && html && its.push(name);
        });

        return _.template(asset, {
            describe: describe,
            referencesFilename: ['.', path.relative(nodedir, referencesFilename)].join(path.sep),
            its: its,
            engines: engines
        });
    })
    .createTech();
