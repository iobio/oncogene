import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import Util from './globals/Util.js'
import GlobalApp from './globals/GlobalApp.js'
import VueAlertify from 'vue-alertify';
import d3 from '@/assets/d3'
import $ from 'jquery'

Vue.use(VueAlertify);
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
    methods: {
        success: function () {
            this.$alertify.success('success');
        },
        alert: function () {
            this.$alertify.alert('This is alert', () =>
                this.$alertify.warning('alert is closed')
            );
        },
        alertWithTitle: function () {
            this.$alertify.alert('alert title', 'This is alert', () =>
                this.$alertify.warning('alert is closed')
            );
        },
        confirm: function () {
            this.$alertify.confirm(
                'This is comfirm',
                () => this.$alertify.success('ok'),
                () => this.$alertify.error('cancel')
            );
        },
        confirmWithTitle: function () {
            this.$alertify.confirm(
                'confirm title',
                'This is comfirm',
                () => this.$alertify.success('ok'),
                () => this.$alertify.error('cancel')
            );
        },
        prompt: function () {
            this.$alertify.prompt(
                'This is prompt',
                'default value',
                (evt, value) => this.$alertify.success('ok: ' + value),
                () => this.$alertify.error('cancel')
            );
        },
        promptWithTitle: function () {
            this.$alertify.promptWithTitle(
                'prompt title',
                'This is prompt',
                'default value',
                (evt, value) => this.$alertify.success('ok: ' + value),
                () => this.$alertify.error('cancel')
            );
        },
        promptWithTypeColor: function () {
            this.$alertify
                .promptWithTitle(
                    'prompt title',
                    'This is prompt',
                    'default value',
                    (evt, value) => this.$alertify.success('ok: ' + value),
                    () => this.$alertify.error('cancel')
                )
                .set('type', 'color');
        },
    },
    vuetify,
    render: h => h(App)
}).$mount('#app');
