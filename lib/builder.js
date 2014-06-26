var path = require('path');

function one(file) {
    var name = file.name.split('.')[0];

    return path.join(name, name + '.keep');
}

module.exports = function (options) {
    options || (options = {});

    var suffixes = options.suffixes || [];

    return function (file) {
        if (~suffixes.indexOf(file.suffix)) {
            return one(file);
        }

        return false;
    };
};
