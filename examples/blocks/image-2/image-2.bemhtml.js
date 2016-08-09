block('image')(
    tag()('img'),
    attrs()(function() {
        var ctx = this.ctx;
        return {
            src : ctx.url,
            width : ctx.width,
            height : ctx.height,
            alt : ctx.alt,
            title : (typeof BEM !== 'undefined' && BEM.I18N) ? BEM.I18N('image', 'title') : 'title-value'
        };
    })
);
