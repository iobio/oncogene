import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
      themes: {
        light: {
            primary: '#7f1010',
            ruby: '#9c1f1f',
            lightPrimary: '#965757',
            brightPrimary: '#cf7676',
            secondary: '#194d81',
            warning: '#d61b1b',
            gray: '#E9EAEC',
            appColor: "#7f1010",
            appHighlight: '#965757',
            appGray: "#888888",
            appLightGray: '#bdb9b9',
            appDarkGray: '#828282',
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
