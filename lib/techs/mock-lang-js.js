var enb = require('enb'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    mock = require('../mock-i18n');

module.exports = buildFlow.create()
    .name('mock-lang-js.js')
    .target('target', '?.mock.lang.js')
    .defineOption('mock')
    .builder(function () {
        var mockFunction = (this._mock || mock).toString();

        return ';(' + mockFunction + '(' +
            'typeof window !== "undefined" ? window : global,' +
            'typeof BEM === \'undefined\' ? {} : BEM' +
        '));';
    })
    .createTech();
