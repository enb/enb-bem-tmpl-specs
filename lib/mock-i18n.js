module.exports = function (global, bem_) {
    global.BEM = bem_;

    var i18n = bem_.I18N = function (keyset, key, param) {
        var result = keyset + ':' + key;
        if (param) {
            result += ':' + JSON.stringify(param);
        }
        return result;
    };

    i18n.keyset = function () { return i18n; };
    i18n.key = function (key) { return key; };
    i18n.lang = function () { return; };
};
