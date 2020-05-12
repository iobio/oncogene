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
            warning: '#d61b1b',
            gray: '#E9EAEC',
            appColor: "#7f1010",
            appHighlight: '#965757',
            appGray: "#888888",
            appLightGray: '#969696',
            appDarkGray: '#686868',
            altRowColor: "#c6c6c8",
            highColor: '#E0292B',
            moderColor: '#F49A73',
            lowColor: '#b5cf6a',
            modifColor: '#f9e4b5',
            somaticColor: '#7f107f'
        },
      },
      icons: {
          iconfont: 'mdi',
      },
    },
});
