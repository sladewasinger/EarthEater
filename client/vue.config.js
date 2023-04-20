module.exports = {
    transpileDependencies: ["vue-class-component", "vue-property-decorator"],
    chainWebpack: config => {
        config.module
            .rule("ts")
            .use("ts-loader")
            .loader("ts-loader")
            .tap(options => {
                options = Object.assign(options, { appendTsSuffixTo: [/\.vue$/] });
                return options;
            });
    }
};
