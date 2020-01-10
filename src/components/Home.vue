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
                         :welcomeWidth="screenWidth"
                         :welcomeHeight="screenHeight"
                         :navBarHeight="navBarHeight"
                     @onLoad="onFilesUploaded">
                </Welcome>
                <div v-else>
                    <v-flex xs5 md3>
                        <GlobalSidebar/>
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
            }
        },
        data: () => {
            return {
                // TODO: get ridof unused variables
                SCORE_FILE: 'http://localhost:8000/tow19example.tsv',
                SCREEN_FILE: 'http://localhost:8000/drugScreenExample.tsv',
                DRUGS: ['Eribulin', 'Bevacizumab', 'Trastuzumab', 'Palbociclib', 'Ribociclib', 'Olaparib', 'Neratinib', 'Pertuzumab'],
                PDX_IDS: ['BCM5471', 'BCM4888', 'HCI-032', 'HCI-005', 'TOW19', 'HCI-019', 'HCI-003', 'HCI-012', 'HCI-016', 'HCI-001', 'TOW26', 'HCI-017', 'HCI-023', 'HCI-027', 'HCI-002', 'HCI-025', 'HCI-010', 'HCI-011', 'HCI-015'],
                displayEvidenceDrawer: false,
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                displayDrawerWidth: 0,
                selectedDrug: '',

                dataEntered: false
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
            onFilesUploaded: function() {
                // TODO:implement
                console.log('onFilesUploaded');
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