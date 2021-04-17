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

Vue.use(VueGtag, {
    config: { id: "UA-47481907-15" }
});
Vue.use(VueRouter);

const routes = [{ path: '/', component: App }]
const router = new VueRouter({
    routes
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
