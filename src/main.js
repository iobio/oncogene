import Vue from 'vue';
import vuetify from './plugins/vuetify';
import Util from './globals/Util.js';
import GlobalApp from './globals/GlobalApp.js';
import d3 from '@/assets/d3';
import '@/assets/sass/site.sass';
import '@/assets/css/siteVuetify.css';
import $ from 'jquery';
import VueGtag from "vue-gtag";
import VueRouter from "vue-router";
import App from './App.vue'
import qs from "qs";

// todo: can now just throw router into here and take out path specific tag pushes everywhere
Vue.use(VueGtag, {
    config: { id: "UA-47481907-15" }
});
Vue.use(VueRouter);

let routes = [
    {
        name: 'home',
        path: '/',
        component: App,
        beforeEnter: (to, from, next) => {
            console.log(to);
            let idx = to.fullPath.indexOf("?access_token");
            let start = 0;
            if (idx === 0) {
                let queryParams = qs.parse(to.fullPath.substring(1));
                // eslint-disable-next-line no-unused-vars
                let { access_token, expires_in, token_type, ...otherQueryParams } = queryParams;
                localStorage.setItem('mosaic-iobio-tkn', token_type + ' ' + access_token);
                next('/' + Qs.stringify(otherQueryParams, { addQueryPrefix: true, arrayFormat: 'brackets' }));
            } else {
                if (idx === 0) {
                    start = 3;
                } else {
                    idx = to.fullPath.indexOf("#\/");
                    if (idx === 0) {
                        start = 3;
                    } else {
                        idx = to.fullPath.indexOf("#");
                        if (idx === 0) {
                            start = 2;
                        }
                    }
                }
                if (idx === 0) {
                    let queryParams = Qs.parse(to.hash.substring(start));
                    next('/' + Qs.stringify(queryParams, { addQueryPrefix: true, arrayFormat: 'brackets' }));
                } else {
                    next();
                }
            }
        },
        props: (route) => ({
            launchSource: route.query.source,
            genes: route.query.genes
            // todo: what else do I need to pass here
        })
    },
    {
        name: 'mosaic-home',
        path: '/mosaic_launch',
        component: App
    }
]
const router = new VueRouter({
    mode: 'history',
    routes: routes
});

Vue.config.productionTip = false;

Vue.mixin({
    data: function () {
        return {
            utility: new Util($),
            globalApp: new GlobalApp($, d3)
        };
    },
    created: function () {
        this.utility.globalApp = this.globalApp;
        this.globalApp.utility = this.utility;
    }
});

new Vue({
    vuetify,
    router,
    render: h => h(App)
}).$mount('#app');
