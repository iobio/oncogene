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
                    <variant-card
                            ref="variantCardRef"
                            v-for="model in sampleModels"
                            :key="model.order"
                            v-bind:class="[
                                { 'full-width': true, 'hide': Object.keys(selectedGene).length === 0 || !cohortModel  || cohortModel.inProgress.loadingDataSources
                                  || (model.id === 'known-variants' && showKnownVariantsCard === false) || (model.id === 'cosmic-variants' && showCosmicVariantsCard === false)
                                },
                                model.id
                                ]"
                            :globalAppProp="globalApp"
                            :sampleModel="model"
                            :canonicalSampleIds="canonicalSampleIds"
                            :classifyVariantSymbolFunc="model.classifyByImpact"
                            :hoverTooltip="hoverTooltip"
                            :clickTooltip="clickTooltip"
                            :selectedGene="selectedGene"
                            :selectedTranscript="analyzedTranscript"
                            :selectedVariant="selectedVariant"
                            :regionStart="geneRegionStart"
                            :regionEnd="geneRegionEnd"
                            :width="cardWidth"
                            :showGeneViz="true"
                            :showDepthViz="model.id !== 'known-variants' && model.id !== 'cosmic-variants'"
                            :showVariantViz="(model.id !== 'known-variants' || showKnownVariantsCard) || (model.id !== 'cosmic-variants' || showCosmicVariantsCard)"
                            :geneVizShowXAxis="model.id === 's0' || model.id === 'known-variants' || model.id === 'cosmic-variants'"
                            :annotationComplete="annotationComplete"
                            :d3="d3"
                            :$="$"
                            @cohort-variant-click="onCohortVariantClick"
                            @cohort-variant-hover="onCohortVariantHover"
                            @cohort-variant-hover-end="onCohortVariantHoverEnd"
                            @variants-viz-change="onVariantsVizChange"
                            @variants-filter-change="onVariantsFilterChange"
                            @show-coverage-cutoffs="showCoverageCutoffs = true"
                    >
                    </variant-card>
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
    import VariantCard from './VariantCard.vue'

    export default {
        name: "Home.vue",
        components: {
            GlobalSidebar,
            GlobalGenome,
            Welcome,
            VariantCard
        },
        props: {
            d3: {
                type: Object,
                default: null
            },
            $: {
                type: Function,
                default: null
            },
            navBarHeight: {
                type: Number,
                default: 0
            },
            cohortModel: {
                type: Object,
                default: null
            },
            hoverTooltip: {
                type: Object,
                default: null
            },
            clickTooltip: {
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

                // view state
                globalMode: false,
                dataEntered: false,
                displayLoader: false,
                showKnownVariantsCard: false,
                showCosmicVariantsCard: false,
                cardWidth: 0,
                annotationComplete: false,

                // selection state
                selectedGene: null,
                selectedTranscript: null,
                selectedVariant: null,
                analyzedTranscript: null,
                coverageDangerRegions: null,
                geneRegionStart: null,
                geneRegionEnd: null,

                // models & model data
                sampleModels: null,
            };
        },
        watch: {
            displayEvidenceDrawer: function () {
                if (this.displayEvidenceDrawer) {
                    this.displayDrawerWidth = window.innerWidth * 0.75;
                } else {
                    this.displayDrawerWidth = 0;
                }
            },
            'cohortModel.annotationComplete': function() {
                if (this.cohortModel && this.cohortModel.getNormalModel()) {
                    this.annotationComplete = !this.cohortModel.getNormalModel().inProgress.loadingVariants;
                } else {
                    this.annotationComplete = false;
                }
            }
        },
        methods: {
            onLaunch: function(modelInfos, userGeneList) {
                const self = this;
                self.dataEntered = true;
                self.displayLoader = true;
                self.cohortModel.promiseInit(modelInfos, userGeneList)
                    .then(() => {
                        self.sampleModels = self.cohortModel.sampleModels;
                        self.cohortModel.setTumorInfo(true);

                        // todo: for screenshot purposes, skipping this for now
                        // let promises = [];
                        //promises.push(this.cohortModel.promiseAnnotateGlobalSomatics());

                        // todo: then load top gene from list
                        let geneModel = self.cohortModel.geneModel;
                        self.selectedGene = Object.values(geneModel.geneObjects)[0];
                        self.selectedTranscript = geneModel.getCanonicalTranscript(self.selectedGene);
                        self.geneRegionStart = self.selectedGene.start;
                        self.geneRegionEnd = self.selectedGene.end;

                        self.promiseLoadData(self.selectedGene, self.selectedTranscript)
                            .then(() => {
                                self.displayLoader = true;
                                // todo: update view state and hide loader
                            })
                            .catch(error => {
                                Promise.reject('Could not load data: ' + error);
                            })
                    })
                    .catch(error => {
                        console.log('There was a problem initializing cohort model: ' + error);
                    })
            },
            promiseLoadData: function(selectedGene, selectedTranscript) {
                const self = this;

                return new Promise(function (resolve, reject) {
                    self.cardWidth = self.$('#genes-card').innerWidth();
                    let options = {'getKnownVariants': false};
                    options['getCosmicVariants'] = false;

                    self.cohortModel.promiseLoadData(selectedGene,
                        selectedTranscript,
                        options)
                        .then(function() {
                            self.cohortModel.promiseMarkCodingRegions(selectedGene, selectedTranscript)
                                .then(function (data) {
                                    self.analyzedTranscript = data.transcript;
                                    self.coverageDangerRegions = data.dangerRegions;
                                    //self.$refs.genesCardRef.determineFlaggedGenes();    // todo: this won't work
                                    console.log(data);
                                    resolve();
                                });
                        })
                        .catch(function (error) {
                            reject(error);
                        })
                });
            },

            /*
             * INTERACTIVITY
             */
            onCohortVariantClick: function (variant, sourceComponent, sampleModelId) {
                console.log(variant);
                console.log(sourceComponent);
                console.log(sampleModelId);
                // const self = this;
                // if (variant) {
                //     self.lastClickCard = sampleModelId;
                //     self.calcFeatureMatrixWidthPercent();
                //     self.selectedVariant = variant;
                //     self.selectedVariantParentSampleId = sampleModelId;
                //     self.selectedVariantNotes = variant.notes;
                //     self.selectedVariantInterpretation = variant.interpretation;
                //     self.activeGeneVariantTab = self.isBasicMode ? "feature-matrix-tab" : "var-detail-tab";
                //     self.showVariantExtraAnnots(sampleModelId, variant);
                //
                //     if (self.$refs.navRef && sourceComponent != self.$refs.navRef) {
                //         self.$refs.navRef.selectVariant(variant, 'current');
                //     }
                //     self.$refs.variantCardRef.forEach(function (variantCard) {
                //         if (sourceComponent == null || variantCard != sourceComponent) {
                //             variantCard.hideVariantCircle(true);
                //             variantCard.showVariantCircle(variant, true);
                //             variantCard.showCoverageCircle(variant);
                //         }
                //     });
                //     if (self.$refs.scrollButtonRefVariant) {
                //         self.$refs.scrollButtonRefVariant.showScrollButtons();
                //     }
                // } else {
                //     self.deselectVariant();
                // }
            },
            // TODO: maybe pass in source component id here?
            onCohortVariantHover: function (variant, sourceComponent) {
                console.log(variant);
                console.log(sourceComponent);
                // console.log('Hovering in home from source cmpnt: ' + sourceComponent.id);
                // const self = this;
                // self.$refs.variantCardRef.forEach(function (variantCard) {
                //     if (variantCard != sourceComponent) {
                //         variantCard.showVariantCircle(variant, false);
                //         variantCard.showCoverageCircle(variant);
                //     }
                // });
                // if (self.$refs.navRef != sourceComponent) {
                //     self.$refs.navRef.selectVariant(variant, 'highlight');
                // }
            },
            onCohortVariantHoverEnd: function () {
                // const self = this;
                // if (self.$refs.variantCardRef) {
                //     self.$refs.variantCardRef.forEach(function (variantCard) {
                //         variantCard.hideVariantCircle(false);
                //         variantCard.hideCoverageCircle();
                //     });
                //     self.$refs.navRef.selectVariant(null, 'highlight');
                // }
            },
            onVariantsVizChange: function (viz, trackId) {
                console.log(viz);
                console.log(trackId);
                // let self = this;
                // if (viz) {
                //     if (trackId === 'known-variants') {
                //         self.cohortModel.knownVariantViz = viz;
                //     } else if (trackId === 'cosmic-variants') {
                //         self.cohortModel.cosmicVariantViz = viz;
                //     }
                // }
                // if (self.showKnownVariantsCard && self.cohortModel && self.cohortModel.isLoaded
                //     && Object.keys(self.selectedGene).length > 0 && trackId === 'known-variants') {
                //     self.cohortModel.promiseLoadKnownVariants(self.selectedGene, self.selectedTranscript);
                // } else if (self.showCosmicVariantsCard && self.cohortModel && self.cohortModel.isLoaded
                //     && Object.keys(self.selectedGene).length > 0 && trackId === 'cosmic-variants') {
                //     self.cohortModel.promiseLoadCosmicVariants(self.selectedGene, self.selectedTranscript);
                // }
            },
            // FILTER TODO: I don't think this is ever used currently...
            onVariantsFilterChange: function (selectedCategories, trackId) {
                console.log(selectedCategories);
                console.log(trackId);
                // todo: will have to fetch somatic variants again here

                // let self = this;
                // if (trackId === 'known-variants') {
                //     self.filterModel.setModelFilter('known-variants', 'vepImpact', selectedCategories);
                //     self.cohortModel.setLoadedVariants(self.selectedGene, 'known-variants');
                // } else if (trackId === 'cosmic-variants') {
                //     self.filterModel.setModelFilter('cosmic-variants', 'vepImpact', selectedCategories);
                //     self.cohortModel.setLoadedVariants(self.selectedGene, 'cosmic-variants');
                // }
            },
        },
        computed: {
            overlayWidth: function() {
                return this.screenWidth * 0.8;
            },
            canonicalSampleIds: function() {
                if (this.cohortModel) {
                    let models = this.cohortModel.getCanonicalModels();
                    return models.filter(model => {
                        return model.id;
                    })
                }
                return [];
            }
        },
    }
</script>

<style scoped>

</style>