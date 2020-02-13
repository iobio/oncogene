import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
      themes: {
        light: {
            primary: '#7f1010',
            lightPrimary: '#965757',
            secondary: '#194d81',
            gray: '#E9EAEC',
            appColor: "#7f1010",
            appHighlight: '#965757',
            appGray: "#888888",
            appDarkGray: '#686868',
            altRowColor: "#c6c6c8"
        },
      },
      icons: {
          iconfont: 'mdi',
      },
    },
});
