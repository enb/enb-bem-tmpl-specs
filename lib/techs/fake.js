module.exports = require('enb/lib/build-flow').create()
    .name('fake')
    .target('target', '?.bemhtml.js')
    .builder(function () {
        return;
    })
    .createTech();
