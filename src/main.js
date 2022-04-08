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
            // MOSAIC
            if (to.query.access_token && to.query.token_type) {
                localStorage.setItem('mosaic-iobio-tkn', to.query.token_type + ' ' + to.query.access_token);

                const otherQueryParams = Object.assign({}, to.query);
                delete otherQueryParams.access_token;
                delete otherQueryParams.token_type;
                delete otherQueryParams.expires_in;
                // Weirdly Mosaic is passing an empty '' parameter
                if (otherQueryParams['']) {
                    delete otherQueryParams[''];
                }

                next('/mosaic_launch?' + $.param(otherQueryParams));
            }
        },
        // props: (route) => ({
        //     launchSource: route.query.source,
        //     genes: route.query.genes,
        //     somaticOnly: route.query.somaticOnly,
        //     projectId: route.query.projectId
        // })
    },
    {
        name: 'mosaic-home',
        path: '/mosaic_launch',
        component: App,
        // props: (route) => ({
        //     launchSource: route.query.source,
        //     genes: route.query.genes,
        //     somaticOnly: route.query.somaticOnly,
        //     projectId: route.query.projectId
        // })
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
