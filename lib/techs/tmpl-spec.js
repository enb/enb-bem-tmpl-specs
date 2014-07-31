var fs = require('fs');
var path = require('path');
var nodeModulesDirname = path.join(__dirname, '..', '..', 'node_modules');
var htmlDifferDirname = path.join(nodeModulesDirname, 'html-differ');
var asset = fs.readFileSync(path.join(__dirname,'..', 'assets', 'tmpl-spec'));
var _ = require('lodash');

module.exports = require('enb/lib/build-flow').create()
    .name('tmpl-spec')
    .target('target', '?.tmpl-spec.js')
    .defineOption('engines', ['BEMHTML', 'BH'])
    .useSourceFilename('references', '?.references.js')
    .useSourceFilename('bemhtmlFile', '?.bemhtml.js')
    .useSourceFilename('bhFile', '?.bh.js')
    .builder(function (referencesFilename, bemhtmlFilename, bhFilename) {
        var nodepath = this.node.getPath();
        var dstpath = path.dirname(nodepath);
        var nodename = path.basename(this.node.getDir());
        var describe = nodename + '\u001b[' + 94 + 'm' + ' (' + dstpath + ')' + '\u001b[0m';
        var engines = this._engines.map(function (name) {
            var info = { name: name };

            if (name === 'BEMHTML') {
                info.filename = bemhtmlFilename;
                info.filed = '.BEMHTML';
            }

            if (name === 'BH') {
                info.filename = bhFilename;
            }

            return info;
        });
        var references = require(referencesFilename);
        var its = [];

        Object.keys(references).forEach(function (name) {
            var bemjson = references[name].bemjson;
            var html = references[name].html;

            bemjson && html && its.push(name);
        });

        return _.template(asset, {
            describe: describe,
            referencesFilename: referencesFilename,
            htmlDifferFilename: htmlDifferDirname,
            its: its,
            engines: engines
        });
    })
    .createTech();
