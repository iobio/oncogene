import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
      themes: {
        light: {
            primary: '#1b5e20'
        },
      },
      icons: {
          iconfont: 'mdi',
      },
    },
});
