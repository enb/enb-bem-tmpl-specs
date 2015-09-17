module.exports = function(bh) {
    bh.match('image', function(ctx, json) {
        ctx
            .tag('img')
            .attrs({
                src : json.url,
                width : json.width,
                height : json.height,
                alt : json.alt,
                title : bh.lib.i18n ? bh.lib.i18n('image', 'title') : 'title-value'
            });
    });
};
