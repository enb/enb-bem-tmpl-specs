var sets = require('enb-bem-sets');
var plugin = require('./plugin');

exports.create = function (taskName, config) {
    var maker = sets.create(taskName, config);

    return sets.use(plugin, maker);
};
