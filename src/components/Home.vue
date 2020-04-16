<template>
    <div>
        <v-sheet
                :height="screenHeight"
                class="overflow-auto"
                style="position: relative;"
        >
            <!--Static main page-->
            <v-layout>
                <Welcome v-if="!dataEntered"
                         :d3="d3"
                         :cohortModel="cohortModel"
                         :welcomeWidth="screenWidth"
                         :welcomeHeight="screenHeight"
                         :navBarHeight="navBarHeight"
                         @upload-config="$emit('upload-config')"
                         @load-demo="$emit('load-demo')"
                         @launched="onLaunch">
                </Welcome>
                <div v-else-if="!globalMode">
<!--                    todo: will have panels in here depending on types of data we have- set off of cohortModel.hasDataType props?-->

                </div>

                <div v-else>
                    <v-flex xs5 md3>
                        <GlobalSidebar/>
                    <!--todo: only want to show filters tab if we don't have somatic only calls;-->
                    </v-flex>
                    <v-flex xs7 md9>
                        <GlobalGenome :d3="d3">
                        </GlobalGenome>
                    </v-flex>
                </div>
            </v-layout>

            <!--Dynamic drawer-->
            <v-navigation-drawer
                    v-model="displayEvidenceDrawer"
                    app
                    temporary
                    right
                    :width="overlayWidth"
            >
                <!--<EvidenceDrawer-->
                    <!--:drug="selectedDrug"-->
                    <!--:screenWidth="screenWidth"-->
                    <!--:screenHeight="screenHeight"-->
                    <!--:screenFile="SCREEN_FILE"-->
                    <!--:pdxIds="PDX_IDS">-->
                <!--</EvidenceDrawer>-->
            </v-navigation-drawer>
        </v-sheet>
        <v-overlay :value="displayLoader">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
        </v-overlay>
    </div>
</template>

<script>
    import GlobalSidebar from './GlobalSidebar.vue'
    import GlobalGenome from './GlobalGenome.vue'
    import Welcome from './Welcome.vue'

    export default {
        name: "Home.vue",
        components: {
            GlobalSidebar,
            GlobalGenome,
            Welcome
        },
        props: {
            d3: {
                type: Object,
                default: null
            },
            navBarHeight: {
                type: Number,
                default: 0
            },
            cohortModel: {
                type: Object,
                default: null
            }
        },
        data: () => {
            return {
                // todo: get rid of unused vars
                displayEvidenceDrawer: false,
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                displayDrawerWidth: 0,

                // view variables
                dataEntered: false,
                displayLoader: false,
                globalMode: false
            };
        },
        watch: {
            displayEvidenceDrawer: function () {
                if (this.displayEvidenceDrawer) {
                    this.displayDrawerWidth = window.innerWidth * 0.75;
                } else {
                    this.displayDrawerWidth = 0;
                }
            }
        },
        methods: {
            onLaunch: function(modelInfos, userGeneList) {
                this.dataEntered = true;
                this.displayLoader = true;
                this.cohortModel.promiseInit(modelInfos, userGeneList)
                    .then(() => {
                        let promises = [];
                        promises.push(this.cohortModel.promiseAnnotateGlobalSomatics());
                        // todo: then load top gene from list
                        // todo: return all promises
                    })
                    .catch(error => {
                        console.log('There was a problem initializing cohort model: ' + error);
                    })
                // todo: then hide loader and display list
            }
        },
        computed: {
            overlayWidth: function() {
                return this.screenWidth * 0.8;
            }
        }
    }
</script>

<style scoped>

</style>