import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import VueAnalytics from 'vue-analytics'
import Util from './globals/Util.js'
import GlobalApp from './globals/GlobalApp.js'
import d3 from '@/assets/d3'
import '@/assets/sass/site.sass'
import '@/assets/css/siteVuetify.css'
import $ from 'jquery'

Vue.config.productionTip = false;

Vue.use(VueAnalytics, {
    id: 'UA-47481907-10'
})

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
    render: h => h(App)
}).$mount('#app');
