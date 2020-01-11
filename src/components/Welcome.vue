<template>
    <div :id="divId">
        <svg :width="welcomeWidth" :height="welcomeHeight">
            <g :transform="translation"></g>
        </svg>
        <v-overlay
                :absolute="absolute"
                :value="overlay"
                :opacity="opacity"
        >
            <v-card
                    elevation="24"
                    width="800"
                    class="mx-auto"
            >
                <!--<v-system-bar lights-out light></v-system-bar>-->
                <v-carousel light class="start-carousel"
                        :continuous="true"
                        :cycle="cycle"
                        :opactiy="1"
                >
                    <v-carousel-item
                            v-for="(slide, i) in slides"
                            :key="i"
                    >
                        <v-sheet
                                height="100%"
                                tile
                        >
                            <v-row
                                    class="fill-height"
                                    align="center"
                                    justify="center"
                            >
                                <div class="display-3">{{ slide }} Slide</div>
                            </v-row>
                        </v-sheet>
                    </v-carousel-item>
                </v-carousel>
                <!--<v-list two-line>-->
                    <!--<v-list-item>-->
                        <!--<v-list-item-avatar>-->
                            <!--<v-img src="https://cdn.vuetifyjs.com/images/john.png"></v-img>-->
                        <!--</v-list-item-avatar>-->
                        <!--<v-list-item-content>-->
                            <!--<v-list-item-title>John Leider</v-list-item-title>-->
                            <!--<v-list-item-subtitle>Author</v-list-item-subtitle>-->
                        <!--</v-list-item-content>-->
                        <!--<v-list-item-action>-->
                            <!--<v-switch-->
                                    <!--v-model="cycle"-->
                                    <!--label="Cycle Slides"-->
                                    <!--inset-->
                            <!--&gt;</v-switch>-->
                        <!--</v-list-item-action>-->
                    <!--</v-list-item>-->
                <!--</v-list>-->
            </v-card>
        </v-overlay>
    </div>
</template>

<script>
    import variantRainD3 from '../d3/VariantRain.d3.js'
    export default {
        name: "Welcome",
        props: {
            d3: {
                type: Object,
                default: null
            },
            welcomeWidth: {
                type: Number,
                default: 0
            },
            welcomeHeight: {
                type: Number,
                default: 0
            },
            navBarHeight: {
                type: Number,
                default: 0
            }
        },
        data: function () {
            return {
                divId: 'variantRainDiv',
                cycle: false,
                slides: [
                    'First',
                    'Second',
                    'Third',
                    'Fourth',
                    'Fifth',
                ],
                absolute: false,
                opacity: 0.1,
                overlay: true
            }
        },
        computed: {
            translation: function () {
                return'translate(20, 50)'
            }
        },
        methods: {
            makeItRain: function () {
                variantRainD3(this.d3, this.divId, this.welcomeWidth, this.welcomeHeight, this.navBarHeight);
            }
        },
        mounted: function () {
            this.makeItRain();
        }
    }
</script>

<style scoped lang="sass">
    .v-carousel
        .v-carousel__controls
                background: #7f1010 !important
</style>