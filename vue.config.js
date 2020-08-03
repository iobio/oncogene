module.exports = {
    "transpileDependencies": [
        "vuetify",
    ],
    pluginOptions: {
        s3Deploy: {
          bucket: 'static.iobio.io',
          deployPath: '/dev/oncogene.iobio.io/',
          enableCloudfront: true,
          cloudfrontId: 'E3JJR7QP3DJYDS',
          registry: undefined,
          awsProfile: 'default',
          overrideEndpoint: false,
          endpoint: 's3',
          region: 'us-east-1',
          createBucket: false,
          staticHosting: false,
          assetPath: 'dist',
          assetMatch: '**',
          acl: 'public-read',
          pwa: false,
          cloudfrontMatchers: '/index.html,/service-worker.js,/manifest.json',
          pluginVersion: '4.0.0-rc3',
          uploadConcurrency: 5
        }
    },
    devServer: {
        disableHostCheck: true
    }
}
