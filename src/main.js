import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import Util from './globals/Util.js'
import GlobalApp from './globals/GlobalApp.js'
import d3 from '@/assets/d3'
import '@/assets/sass/site.sass'
import '@/assets/css/siteVuetify.css'
import $ from 'jquery'

Vue.config.productionTip = false;

// Have to define rebind for v5 of d3
// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
    var d3_rebind = function(target, source, method) {
        var value = method.apply(source, arguments);
        return value === source ? target : value;
    };
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
};

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
