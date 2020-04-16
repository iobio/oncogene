import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import Util from './globals/Util.js'
import GlobalApp from './globals/GlobalApp.js'
import d3 from '@/assets/d3'
import $ from 'jquery'

Vue.config.productionTip = false;

Vue.mixin({
    data: function () {
        return {
            utility: new Util(),
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
    render: h => h(App)
}).$mount('#app');
