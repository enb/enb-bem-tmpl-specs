var FileSystem = require('enb/lib/test/mocks/test-file-system');
var TestNode = require('enb/lib/test/mocks/test-node');
var depsByKeepsTech = require('../../lib/techs/deps-by-keeps');

describe('techs', function () {
    describe('deps-by-keeps', function () {
        var fileSystem;
        var bundles = {};
        var fsScheme = [
            { directory: 'block', items: [{ file: 'block.keep' }] },
            { directory: 'block-bool-mod', items: [{ file: 'block_mod.keep' }] },
            { directory: 'block-mod', items: [{ file: 'block_modName_modVal.keep' }] },
            { directory: 'elem', items: [{ file: 'block__elem.keep' }] },
            { directory: 'elem-bool-mod', items: [{ file: 'block__elem_mod.keep' }] },
            { directory: 'elem-mod', items: [{ file: 'block__elem_modName_modVal.keep' }] },
            { directory: 'fully', items: [
                { file: 'block__elem_mod.keep' },
                { file: 'block__elem.keep' },
                { file: 'block_mod.keep' },
                { file: 'block.keep' }
            ] }
        ];

        beforeEach(function () {
            fileSystem = new FileSystem(fsScheme);
            fileSystem.setup();

            fsScheme.forEach(function (bundle) {
                var name = bundle.directory;

                bundles[name] = new TestNode(name);
            });
        });

        afterEach(function () {
            fileSystem.teardown();
        });

        it('must detect block', function (done) {
            bundles.block.runTechAndRequire(depsByKeepsTech)
                .spread(function (res) {
                    res.deps.must.eql([{ block: 'block' }]);
                })
                .then(done, done);
        });

        it('must detect boolean mod of block', function (done) {
            bundles['block-bool-mod'].runTechAndRequire(depsByKeepsTech)
                .spread(function (res) {
                    res.deps.must.eql([
                        { block: 'block', mod: 'mod' }
                    ]);
                })
                .then(done, done);
        });

        it('must detect mod of block', function (done) {
            bundles['block-mod'].runTechAndRequire(depsByKeepsTech)
                .spread(function (res) {
                    res.deps.must.eql([
                        { block: 'block', mod: 'modName', val: 'modVal' }
                    ]);
                })
                .then(done, done);
        });

        it('must detect elem of block', function (done) {
            bundles.elem.runTechAndRequire(depsByKeepsTech)
                .spread(function (res) {
                    res.deps.must.eql([
                        { block: 'block', elem: 'elem' }
                    ]);
                })
                .then(done, done);
        });

        it('must detect bool mod of elem', function (done) {
            bundles['elem-bool-mod'].runTechAndRequire(depsByKeepsTech)
                .spread(function (res) {
                    res.deps.must.eql([
                        { block: 'block', elem: 'elem', mod: 'mod' }
                    ]);
                })
                .then(done, done);
        });

        it('must detect mod of elem', function (done) {
            bundles['elem-mod'].runTechAndRequire(depsByKeepsTech)
                .spread(function (res) {
                    res.deps.must.eql([
                        { block: 'block', elem: 'elem', mod: 'modName', val: 'modVal' }
                    ]);
                })
                .then(done, done);
        });

        it('must be bem order', function (done) {
            bundles.fully.runTechAndRequire(depsByKeepsTech)
                .spread(function (res) {
                    res.deps.must.eql([
                        { block: 'block' },
                        { block: 'block', mod: 'mod' },
                        { block: 'block', elem: 'elem' },
                        { block: 'block', elem: 'elem', mod: 'mod' }
                    ]);
                })
                .then(done, done);
        });
    });
});
