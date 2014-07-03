var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');
var tmplSpecsSets = require(rootPath);

module.exports = function (config) {
    var tmplSpecs = tmplSpecsSets.create('tmpl-specs', config);

    tmplSpecs.configure({
        destPath: 'tmpl-specs',
        levels: getLevels(config),
        sourceLevels: getSourceLevels(config)
    });
};

function getLevels (config) {
    return [
        'blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}

function getSourceLevels (config) {
    return [
        { path: '../libs/bem-core/common.blocks', check: false },
        'blocks'
    ].map(function (level) {
        return config.resolvePath(level);
    });
}
