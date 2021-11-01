module.exports = {
    "transpileDependencies": [
        "vuetify",
    ],
    devServer: {
        disableHostCheck: true
    },
    chainWebpack: config => {
        config.module
            .rule('csv')
            .test(/\.csv$/)
            .use('csv-loader')
            .loader('csv-loader')
            .options('dynamicTyping', true)
            .options('header', true)
            .options('skipEmptyLines', true)
            .end()
    }
}
