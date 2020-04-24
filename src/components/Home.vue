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
                <v-flex xs9 v-if="dataEntered">
                    <v-card outlined :height="700">
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
                                :width="screenWidth"
                                :height="screenHeight"
                                :showGeneViz="true"
                                :showDepthViz="model.id !== 'known-variants' && model.id !== 'cosmic-variants'"
                                :showVariantViz="(model.id !== 'known-variants' || showKnownVariantsCard) || (model.id !== 'cosmic-variants' || showCosmicVariantsCard)"
                                :geneVizShowXAxis="false"
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
                    </v-card>
                </v-flex>
                <v-flex xs3 v-if="dataEntered">
                    <v-card>
                        <v-tabs v-model="selectedTab">
                            <v-tabs-slider style="max-width: 120px" color="primary"></v-tabs-slider>
                            <v-tab href="#genes-tab">
                                Ranked Genes
                                <v-icon style="margin-bottom: 0; padding-left: 5px">line_weight</v-icon>
                            </v-tab>
                            <v-tab href="#summary-tab">
                                Summary
                                <v-icon style="margin-bottom: 0; padding-left: 5px">bar_chart</v-icon>
                            </v-tab>
                            <v-tab href="#filter-tab">
                                Filters
                                <v-icon style="margin-bottom: 0; padding-left: 5px">bubble_chart</v-icon>
                            </v-tab>
                            <v-tab href="#history-tab">
                                History
                                <v-icon style="margin-bottom: 0; padding-left: 5px">history</v-icon>
                            </v-tab>
                            <v-tab-item
                                    :key="'genesTab'"
                                    :id="'genes-tab'">
                                <v-container>
                                    <v-card>
                                        gene card
                                    </v-card>
<!--                                    todo: import TDS gene card-->
<!--                                    <gene-list-card-->
<!--                                            ref="geneListCard"-->
<!--                                            :selectedGene="selectedGene.gene_name">-->
<!--                                    </gene-list-card>-->
                                </v-container>
                            </v-tab-item>
                            <v-tab-item
                                    :key="'summaryTab'"
                                    :id="'summary-tab'">
                                <v-container>
                                    <variant-summary-card
                                            ref="variantSummaryCardRef"
                                            :selectedGene="selectedGeneName"
                                            :variant="selectedVariant"
                                            :variantInfo="selectedVariantInfo"
                                            :$="globalApp.$"
                                            @summaryCardVariantDeselect="deselectVariant">
                                    </variant-summary-card>
                                </v-container>
                            </v-tab-item>
                            <v-tab-item
                                    :key="'filterTab'"
                                    :id="'filter-tab'">
                                <v-container>
                                    <filter-panel-menu
                                            v-if="filterModel"
                                            ref="filterSettingsMenuRef"
                                            :filterModel="filterModel"
                                            :showCoverageCutoffs="showCoverageCutoffs"
                                            :annotationComplete="annotationComplete"
                                            :applyFilters="applyFilters"
                                            @filter-change="onFilterChange">
                                    </filter-panel-menu>
                                </v-container>
                            </v-tab-item>
                            <v-tab-item
                                    :key="'historyTab'"
                                    :id="'history-tab'">
                                <v-container>
                                    <history-tab
                                            ref="historyTabRef"
                                            :geneHistoryList="geneHistoryList"
                                            @reload-gene-history="reloadGene">
                                    </history-tab>
                                </v-container>
                            </v-tab-item>
                        </v-tabs>
                    </v-card>
                </v-flex>
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
    // import GlobalSidebar from './GlobalSidebar.vue'
    // import GlobalGenome from './GlobalGenome.vue'
    import Welcome from './Welcome.vue'
    import VariantCard from './VariantCard.vue'
    import VariantSummaryCard from './VariantSummaryCard.vue'
    import FilterPanelMenu from './filter/FilterPanelMenu.vue'
    import HistoryTab from './HistoryTab.vue'
    import '@/assets/css/v-tooltip.css'

    export default {
        name: "Home.vue",
        components: {
            // GlobalSidebar,
            // GlobalGenome,
            Welcome,
            VariantCard,
            VariantSummaryCard,
            FilterPanelMenu,
            HistoryTab
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
            filterModel: {
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
                cardWidth: 500,
                annotationComplete: false,

                // selection state
                selectedGene: null,
                selectedTranscript: null,
                selectedVariant: null,
                analyzedTranscript: null,
                coverageDangerRegions: null,
                geneRegionStart: null,
                geneRegionEnd: null,
                lastClickCard: null,
                selectedTab: 'genes-tab',

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
                                self.displayLoader = false;
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
                    // self.cardWidth = self.$('#genes-card').innerWidth(); // todo: put this back in when we add genes card
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
                const self = this;
                if (variant) {
                    self.lastClickCard = sampleModelId;
                    // self.calcFeatureMatrixWidthPercent();
                    self.selectedVariant = variant;
                    self.selectedVariantParentSampleId = sampleModelId;
                    self.selectedVariantNotes = variant.notes;
                    self.selectedVariantInterpretation = variant.interpretation;
                    self.activeGeneVariantTab = self.isBasicMode ? "feature-matrix-tab" : "var-detail-tab";
                    self.showVariantExtraAnnots(sampleModelId, variant);

                    if (self.$refs.navRef && sourceComponent != self.$refs.navRef) {
                        self.$refs.navRef.selectVariant(variant, 'current');
                    }
                    self.$refs.variantCardRef.forEach(function (variantCard) {
                        if (sourceComponent == null || variantCard != sourceComponent) {
                            variantCard.hideVariantCircle(true);
                            variantCard.showVariantCircle(variant, true);
                            variantCard.showCoverageCircle(variant);
                        }
                    });
                    if (self.$refs.scrollButtonRefVariant) {
                        self.$refs.scrollButtonRefVariant.showScrollButtons();
                    }
                } else {
                    self.deselectVariant();
                }
            },
            onCohortVariantHover: function (variant, sourceComponent) {
                console.log('Hovering in home from source cmpnt: ' + sourceComponent.id);
                const self = this;
                self.$refs.variantCardRef.forEach(function (variantCard) {
                    if (variantCard != sourceComponent) {
                        variantCard.showVariantCircle(variant, false);
                        variantCard.showCoverageCircle(variant);
                    }
                });
                // if (self.$refs.navRef != sourceComponent) {
                //     self.$refs.navRef.selectVariant(variant, 'highlight');
                // }
            },
            onCohortVariantHoverEnd: function () {
                const self = this;
                if (self.$refs.variantCardRef) {
                    self.$refs.variantCardRef.forEach(function (variantCard) {
                        variantCard.hideVariantCircle(false);
                        variantCard.hideCoverageCircle();
                    });
                    // self.$refs.navRef.selectVariant(null, 'highlight');
                }
            },
            onVariantsVizChange: function (viz, trackId) {
                const self = this;
                if (viz) {
                    if (trackId === 'known-variants') {
                        self.cohortModel.knownVariantViz = viz;
                    } else if (trackId === 'cosmic-variants') {
                        self.cohortModel.cosmicVariantViz = viz;
                    }
                }
                if (self.showKnownVariantsCard && self.cohortModel && self.cohortModel.isLoaded
                    && Object.keys(self.selectedGene).length > 0 && trackId === 'known-variants') {
                    self.cohortModel.promiseLoadKnownVariants(self.selectedGene, self.selectedTranscript);
                } else if (self.showCosmicVariantsCard && self.cohortModel && self.cohortModel.isLoaded
                    && Object.keys(self.selectedGene).length > 0 && trackId === 'cosmic-variants') {
                    self.cohortModel.promiseLoadCosmicVariants(self.selectedGene, self.selectedTranscript);
                }
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
            deselectVariant: function () {
                const self = this;
                self.lastClickCard = null;
                self.selectedVariant = null;
                self.selectedVariantRelationship = null;
                self.activeGeneVariantTab = "feature-matrix-tab";
                if (self.$refs.variantCardRef) {
                    self.$refs.variantCardRef.forEach(function (variantCard) {
                        variantCard.hideVariantTooltip();
                        variantCard.hideVariantCircle(true);
                        variantCard.hideCoverageCircle();
                    })
                }
                // if (self.$refs.navRef) {
                //     self.$refs.navRef.selectVariant(null);
                // }
            },
            onExitClickTooltip: function() {
                const self = this;
                if (self.lastClickCard === 'featureMatrix') {
                    self.$refs.navRef.onVariantClick(null);
                } else if (self.lastClickCard) {
                    self.$refs.variantCardRef.forEach((cardRef) => {
                        if (self.lastClickCard === cardRef.sampleModel.id) {
                            cardRef.onVariantClick(null);
                        }
                    })
                }
            },
            showVariantExtraAnnots: function (parentSampleId, variant) {
                let self = this;
                if (!self.isEduMode && !self.cohortModel.getModel(parentSampleId).isAlignmentsOnly()) {
                    if (parentSampleId === 'known-variants') {
                        self.cohortModel
                            .getModel(parentSampleId)
                            .promiseGetVariantExtraAnnotations(self.selectedGene, self.selectedTranscript, self.selectedVariant)
                            .then(function (refreshedVariant) {
                                self.refreshVariantExtraAnnots(parentSampleId, variant, [refreshedVariant]);
                            })
                        // TODO: need to put else if cosmic-variants
                    } else {
                        self.cohortModel
                            .getModel(parentSampleId)
                            .promiseGetImpactfulVariantIds(self.selectedGene, self.selectedTranscript)
                            .then(function (annotatedVariants) {
                                // If the clicked variant is in the list of annotated variants, show the
                                // tooltip; otherwise, the callback will get the extra annots for this
                                // specific variant
                                self.refreshVariantExtraAnnots(parentSampleId, variant, annotatedVariants, function () {
                                    // The clicked variant wasn't annotated in the batch of variants.  Get the
                                    // extra annots for this specific variant.
                                    self.cohortModel
                                        .getModel(parentSampleId)
                                        .promiseGetVariantExtraAnnotations(self.selectedGene, self.selectedTranscript, self.selectedVariant)
                                        .then(function (refreshedVariant) {
                                            self.refreshVariantExtraAnnots(parentSampleId, variant, [refreshedVariant]);
                                        })
                                })
                            });
                    }
                }
            },
            refreshVariantExtraAnnots: function (sourceComponent, variant, annotatedVariants, callbackNotFound) {
                var targetVariants = annotatedVariants.filter(function (v) {
                    return variant &&
                        variant.start === v.start &&
                        variant.ref === v.ref &&
                        variant.alt === v.alt;
                });
                if (targetVariants.length > 0) {
                    var annotatedVariant = targetVariants[0];
                    annotatedVariant.screenX = variant.screenX;
                    annotatedVariant.screenY = variant.screenY;
                    annotatedVariant.screenXMatrix = variant.screenXMatrix;
                    annotatedVariant.screenYMatrix = variant.screenYMatrix;

                    variant.extraAnnot = true;
                    variant.vepHGVSc = annotatedVariant.vepHGVSc;
                    variant.vepHGVSp = annotatedVariant.vepHGVSp;
                    variant.vepVariationIds = annotatedVariant.vepVariationIds;
                } else {
                    if (callbackNotFound) {
                        callbackNotFound();
                    }
                }
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
            },
            selectedVariantInfo: function () {
                if (this.selectedVariant) {
                    return this.globalApp.utility.formatDisplay(this.selectedVariant, this.variantModel.translator)
                } else {
                    return null;
                }
            },
            selectedGeneName: function () {
                if (this.selectedGene) {
                    return this.selectedGene.gene_name;
                } else {
                    return null;
                }
            }
        },
    }
</script>

<style scoped>

</style>