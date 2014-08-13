var plugin = require('./plugin');

var TmplSpecSets = function (config) {
    this._config = config;

    config.includeConfig('enb-magic-factory');
};

TmplSpecSets.prototype.createConfigurator = function (taskName) {
    var factory = this._config.module('enb-magic-factory');

    return plugin(factory.createHelper(taskName));
};

module.exports = function (config) {
    config.registerModule('enb-bem-tmpl-specs', new TmplSpecSets(config));
};
