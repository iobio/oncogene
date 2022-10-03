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
import _ from 'lodash'

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
                next('/external_launch?' + $.param(otherQueryParams));
            } else if (to.query.source === 'galaxy') {
                // Note: this is hardcoded for now but could be passed
                const GALAXY_CONFIG_LOCATION = 'config.json';
                const otherQueryParams = Object.assign({}, to.query);
                otherQueryParams['config'] = GALAXY_CONFIG_LOCATION;
                next('/external_launch?' + $.param(otherQueryParams));
            }
        },
    },
    {
        name: 'galaxy-home',
        path: '/external_launch',
        component: App,
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
            globalApp: new GlobalApp($, d3, _)
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
