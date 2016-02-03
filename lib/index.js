var plugin = require('./plugin');

function TmplSpecSets(config) {
    this._config = config;

    config.includeConfig(require.resolve('enb-magic-factory'));
}

TmplSpecSets.prototype.createConfigurator = function (taskName, options) {
    var factory = this._config.module('enb-magic-factory');

    return plugin(factory.createHelper(taskName), options);
};

module.exports = function (config) {
    config.registerModule('enb-bem-tmpl-specs', new TmplSpecSets(config));
};
