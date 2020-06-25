<template>
    <div>
        <v-sheet
                :height="screenHeight"
                class="overflow-auto"
                style="position: relative;"
        >
            <!--Static main page-->
            <v-layout>
                <v-flex xs3 v-if="dataEntered">
                    <v-navigation-drawer absolute left permanent>
                            <v-card class="px-0" style="overflow: scroll">
                                <!--todo: put in progress loading text here + glyph-->
                                <somatic-genes-card
                                        ref="somaticGenesCard"
                                        :rankedGeneList="rankedGeneList"
                                        :selectedGeneName="selectedGeneName"
                                        :totalSomaticVarCount="totalSomaticVarCount"
                                        @variant-hover="onCohortVariantHover"
                                        @variant-hover-exit="onCohortVariantHoverEnd"
                                        @variant-selected="onCohortVariantClick"
                                        @gene-selected-from-list="onGeneSelected">
                                </somatic-genes-card>
                            </v-card>
                    </v-navigation-drawer>
                </v-flex>
                <Welcome v-if="!dataEntered && !debugMode"
                         :d3="d3"
                         :cohortModel="cohortModel"
                         :welcomeWidth="screenWidth"
                         :welcomeHeight="screenHeight"
                         :navBarHeight="navBarHeight"
                         @load-demo="$emit('load-demo')"
                         @launched="onLaunch">
                </Welcome>
                <v-flex xs6 v-if="dataEntered || debugMode">
                    <v-card outlined :height="700">
                        <variant-card
                                ref="variantCardRef"
                                v-for="model in sampleModelsToDisplay"
                                :key="model.id"
                                v-bind:class="[ { 'full-width': true}, model.id ]"
                                :globalAppProp="globalApp"
                                :sampleModel="model"
                                :canonicalSampleIds="canonicalSampleIds"
                                :classifyVariantSymbolFunc="model.classifyByImpact"
                                :hoverTooltip="hoverTooltip"
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
                <v-flex xs3 v-if="dataEntered || debugMode">
                    <v-card class="px-0" style="overflow: scroll">
                        <v-tabs v-model="selectedTab" class="px-1">
                            <v-tabs-slider style="padding-left: 10px" color="primary"></v-tabs-slider>
<!--                            <v-tab href="#genes-tab">-->
<!--                                Ranked Genes-->
<!--                                <v-icon style="margin-bottom: 0; padding-left: 5px">line_weight</v-icon>-->
<!--                            </v-tab>-->
                            <v-tab href="#summary-tab">
                                Summary
                                <v-icon style="margin-bottom: 0; padding-left: 5px">bar_chart</v-icon>
                            </v-tab>
                            <v-tab href="#filter-tab">
                                Filters
                                <v-icon style="margin-bottom: 0; padding-left: 5px">bubble_chart</v-icon>
                            </v-tab>
<!--                            <v-tab href="#history-tab">-->
<!--                                History-->
<!--                                <v-icon style="margin-bottom: 0; padding-left: 5px">history</v-icon>-->
<!--                            </v-tab>-->
<!--                            <v-tab-item-->
<!--                                    :key="'genesTab'"-->
<!--                                    :id="'genes-tab'">-->
<!--                                <v-container>-->
<!--                                    <somatic-genes-card-->
<!--                                            ref="somaticGenesCard"-->
<!--                                            :rankedGeneList="rankedGeneList"-->
<!--                                            :selectedGeneName="selectedGeneName"-->
<!--                                            :totalSomaticVarCount="totalSomaticVarCount"-->
<!--                                            @variant-hover="onCohortVariantHover"-->
<!--                                            @variant-hover-exit="onCohortVariantHoverEnd"-->
<!--                                            @variant-selected="onCohortVariantClick"-->
<!--                                            @gene-selected-from-list="onGeneSelected">-->
<!--                                    </somatic-genes-card>-->
<!--                                </v-container>-->
<!--                            </v-tab-item>-->
                            <v-tab-item
                                    :key="'summaryTab'"
                                    :id="'summary-tab'">
                                <v-container>
                                    <variant-summary-card
                                            ref="variantSummaryCardRef"
                                            :sampleIds="sampleIds"
                                            :selectedSamples="selectedSamples"
                                            :selectedGene="selectedGeneName"
                                            :variant="selectedVariant"
                                            :variantInfo="selectedVariantInfo"
                                            :$="globalApp.$"
                                            :d3="globalApp.d3"
                                            :cohortModel="cohortModel"
                                            :hasRnaSeq="cohortModel.hasRnaSeqData"
                                            :hasAtacSeq="cohortModel.hasAtacSeqData"
                                            @fetch-reads="fetchSeqReads"
                                            @summary-mounted="onSummaryMounted"
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
                                            @recall-somatic-variants="callSomaticVariants"
                                            @filter-change="onFilterChange">
                                    </filter-panel-menu>
                                </v-container>
                            </v-tab-item>
<!--                            <v-tab-item-->
<!--                                    :key="'historyTab'"-->
<!--                                    :id="'history-tab'">-->
<!--                                <v-container>-->
<!--                                    <history-tab-->
<!--                                            ref="historyTabRef"-->
<!--                                            :geneHistoryList="geneHistoryList"-->
<!--                                            @reload-gene-history="reloadGene">-->
<!--                                    </history-tab>-->
<!--                                </v-container>-->
<!--                            </v-tab-item>-->
                        </v-tabs>
                    </v-card>
                </v-flex>
            </v-layout>
        </v-sheet>
        <v-overlay :value="displayLoader">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
        </v-overlay>
    </div>
</template>

<script>
    import Welcome from './Welcome.vue'
    import VariantCard from './VariantCard.vue'
    import VariantSummaryCard from './VariantSummaryCard.vue'
    import FilterPanelMenu from './filter/FilterPanelMenu.vue'
    // import HistoryTab from './HistoryTab.vue'
    import SomaticGenesCard from './SomaticGenesCard.vue'

    import '@/assets/css/v-tooltip.css'

    export default {
        name: "Home.vue",
        components: {
            Welcome,
            VariantCard,
            VariantSummaryCard,
            FilterPanelMenu,
            // HistoryTab,
            SomaticGenesCard
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
            }
        },
        data: () => {
            return {
                // todo: get rid of unused vars
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,

                // view state
                globalMode: false,
                dataEntered: false,
                displayLoader: false,
                showKnownVariantsCard: false,
                showCosmicVariantsCard: false,
                cardWidth: 500,
                annotationComplete: false,
                showCoverageCutoffs: false,
                applyFilters: false,

                // selection state
                selectedGene: null,
                selectedTranscript: null,
                selectedVariant: null,
                analyzedTranscript: null,
                coverageDangerRegions: null,
                geneRegionStart: null,
                geneRegionEnd: null,
                lastClickCard: null,
                selectedTab: 'summary-tab',
                totalSomaticVarCount: -1,

                // models & model data
                sampleIds: null,   // Sample ids for canonical sample models
                selectedSamples: null,  // NOTE: must be in same order as sampleIds
                sampleModels: null,
                geneHistoryList: [],
                rankedGeneList: [],

                debugMode: false
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
            },
            selectedGene: function() {
                let selectedGeneDisplay = this.selectedGene.gene_name + " " + this.selectedGene.chr;
                this.$emit('gene-changed', selectedGeneDisplay);
            }
        },
        methods: {
            // Point of entry for launch and filter changes
            onLaunch: function(modelInfos, userGeneList) {
                const self = this;
                self.dataEntered = true;
                self.displayLoader = true;
                self.cohortModel.promiseInit(modelInfos, userGeneList)
                    .then(() => {
                        self.sampleModels = self.cohortModel.sampleModels;
                        self.sampleIds = [];
                        self.selectedSamples = [];

                        let canonModels = self.cohortModel.getCanonicalModels();
                        canonModels.forEach(model => {
                            self.sampleIds.push(model.id);
                            self.selectedSamples.push(model.selectedSample);
                        });
                        self.callSomaticVariants();
                    }).catch(error => {
                        console.log('There was a problem initializing cohort model: ' + error);
                    })
            },
            callSomaticVariants: function() {
                const self = this;
                self.cohortModel.promiseAnnotateGlobalSomatics()
                    .then(rankObj => {
                        let totalSomaticVarCount = rankObj.count;
                        let topRankedGene = rankObj.gene;

                        let geneModel = self.cohortModel.geneModel;
                        self.totalSomaticVarCount = totalSomaticVarCount;

                        // Get rid of global loader
                        self.displayLoader = false;

                        // Turn on track loaders
                        self.cohortModel.setLoaders(true);

                        self.rankedGeneList = geneModel.rankedGeneList;
                        self.selectedGene = topRankedGene;
                        self.selectedTranscript = geneModel.getCanonicalTranscript(self.selectedGene);
                        self.geneRegionStart = self.selectedGene.start;
                        self.geneRegionEnd = self.selectedGene.end;

                        self.cohortModel.promiseGetCosmicVariantIds(self.selectedGene, self.selectedTranscript)
                            .then(() => {
                                self.promiseLoadData(self.selectedGene, self.selectedTranscript)
                                    .catch(error => {
                                        Promise.reject('Could not load data: ' + error);
                                    })
                            }).catch(error => {
                                Promise.reject('Problem getting cosmic variant IDS: ' + error);
                            })
                    }).catch(error => {
                    console.log('There was a problem calling global somatics: ' + error);
                });
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
                self.deselectVariant();
                // todo: make sure that variant object is the same here coming from ranked gene list
                if (variant) {
                    self.lastClickCard = sampleModelId;
                    // self.calcFeatureMatrixWidthPercent();
                    self.selectedVariant = variant;
                    self.selectedVariantParentSampleId = sampleModelId;
                    self.selectedVariantNotes = variant.notes;
                    self.selectedVariantInterpretation = variant.interpretation;

                    self.$refs.variantCardRef.forEach(function (variantCard) {
                        // if (sourceComponent == null || variantCard != sourceComponent) {
                            variantCard.hideVariantCircle(true);
                            variantCard.showVariantCircle(variant, true);
                            variantCard.showCoverageCircle(variant);
                        // }
                    });
                    // Tab to summary card
                    self.selectedTab = 'summary-tab';

                    // Hide banner
                    if (self.$refs.variantSummaryCardRef) {
                        self.$refs.variantSummaryCardRef.forEach(ref => {
                            ref.hideGetStartedBanner();
                        })
                    }
                }
            },
            onCohortVariantHover: function (variant, sourceComponent) {
                const self = this;
                self.$refs.variantCardRef.forEach(function (variantCard) {
                    if (variantCard != sourceComponent) {
                        variantCard.showVariantCircle(variant, false);
                        variantCard.showCoverageCircle(variant);
                    }
                });
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
            // FILTER
            onVariantsFilterChange: function (selectedCategories, trackId) {
                console.log(selectedCategories);
                console.log(trackId);

            },
            deselectVariant: function () {
                const self = this;
                self.lastClickCard = null;
                self.selectedVariant = null;
                self.selectedVariantRelationship = null;
                if (self.$refs.variantCardRef) {
                    self.$refs.variantCardRef.forEach(function (variantCard) {
                        // variantCard.hideVariantTooltip();
                        variantCard.hideVariantCircle(true);
                        variantCard.hideCoverageCircle();
                    })
                }
                if (self.$refs.somaticGenesCard) {
                    self.$refs.somaticGenesCard.deselectListVar();
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
            promiseLoadGene: function (geneName, theTranscript) {
                const self = this;
                const geneModel = self.cohortModel.geneModel;

                self.showWelcome = false;
                self.clearZoom = true;
                self.applyFilters = false;
                return new Promise(function (resolve, reject) {
                    if (self.cohortModel) {
                        self.cohortModel.clearLoadedData(geneName);
                        self.cohortModel.setLoaders(true);
                    }

                    let p = Promise.resolve();
                    let theGeneObject = geneModel.geneObjects[geneName];
                    if (!theGeneObject) {
                        p = geneModel.promiseAddGeneName(geneName)
                            .then(function () {
                                geneModel.promiseGetGeneObject(geneName)
                                    .then(geneObj => {
                                        theGeneObject = geneObj;
                                    })
                            }).catch(function (error) {
                                console.log(error);
                                geneModel.removeGene(geneName);
                                self.onShowSnackbar({
                                    message: 'Bypassing ' + geneName + '. Unable to find transcripts.',
                                    timeout: 60000
                                })
                            });
                    }
                    p.then(() => {
                            if (self.bringAttention === 'gene') {
                                self.bringAttention = null;
                            }
                            geneModel.adjustGeneRegion(theGeneObject);
                            self.geneRegionStart = theGeneObject.start;
                            self.geneRegionEnd = theGeneObject.end;
                            self.selectedGene = theGeneObject;

                            if (theTranscript) {
                                // If we have selected a flagged variant, we want to use the flagged
                                // variant's transcript
                                self.selectedTranscript = theTranscript;
                            } else {
                                // Determine the transcript that should be selected for this gene
                                // If the transcript wasn't previously selected for this gene,
                                // set it to the canonical transcript
                                let latestTranscript = geneModel.getLatestGeneTranscript(geneName);
                                if (latestTranscript == null) {
                                    self.selectedTranscript = geneModel.getCanonicalTranscript(self.selectedGene);
                                    geneModel.setLatestGeneTranscript(geneName, self.selectedTranscript);
                                } else {
                                    self.selectedTranscript = latestTranscript;
                                }
                            }

                            if (self.$refs.scrollButtonRefGene) {
                                self.$refs.scrollButtonRefGene.showScrollButtons();
                            }

                        if (self.cohortModel.isLoaded) {
                            self.cohortModel.promiseGetCosmicVariantIds(self.selectedGene, self.selectedTranscript)
                                .then(() => {
                                    self.promiseLoadData(self.selectedGene, self.selectedTranscript)
                                        .then(function () {
                                            self.clearZoom = false;
                                            self.showVarViz = true;
                                            self.applyFilters = true;
                                            resolve();
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                            reject(err);
                                        })
                                }).catch(error => {
                                Promise.reject('Problem getting cosmic variant IDS: ' + error);
                            })

                        } else {
                            resolve();
                        }
                    })
                })
            },
            onFilterChange: function() {
                const self = this;

                // Only annotate once we are guaranteed that our DOM update is done for all tracks
                self.cohortModel.promiseFilterVariants()
                    .then(() => {
                        // todo: this needs to change w/ global mode
                        self.filterModel.promiseAnnotateVariantInheritance(self.cohortModel.sampleMap)
                            .then((inheritanceObj) => {
                                self.cohortModel.setLoadedVariants(self.selectedGene);

                                // Turn loading flags off
                                self.cohortModel.getCanonicalModels().forEach((sampleModel) => {
                                    sampleModel.inProgress.loadingVariants = false;
                                });

                                self.cohortModel.allSomaticFeaturesLookup = inheritanceObj.somaticLookup;
                                self.cohortModel.allInheritedFeaturesLookup = inheritanceObj.inheritedLookup;

                                // Draw feature matrix after somatic field filled
                                // let allVariantsPassingFilters = self.cohortModel.getAllFilterPassingVariants();
                                // self.featureMatrixModel.promiseRankVariants(self.cohortModel.allUniqueFeaturesObj,
                                    // self.cohortModel.allSomaticFeaturesLookup, self.cohortModel.allInheritedFeaturesLookup, allVariantsPassingFilters);

                                // Then we need to update coloring for tumor tracks only
                                // TODO: we should be able to get rid of this once they're drawn post inheritance sorting
                                if (self.$refs.variantCardRef) {
                                    self.$refs.variantCardRef.forEach((cardRef) => {
                                        if (cardRef.sampleModel.isTumor === true) {
                                            cardRef.updateVariantClasses();
                                        }
                                    });
                                }
                            });
                    }).catch((err) => {
                    console.log('There was a problem applying variant filter: ' + err);
                });
            },
            // todo: this needs to be updated to work without navref
            reloadGene: function(geneToReload) {
                let self = this;
                if (geneToReload !== self.selectedGene.gene_name) {
                    // Load gene
                    self.onGeneSelected(geneToReload);
                    // Fill in text entry
                    //self.$refs.navRef.setSelectedGeneText(geneToReload);
                }
            },
            onGeneSelected: function (geneName) {
                const self = this;
                self.deselectVariant();
                self.promiseLoadGene(geneName, null, false);
                //self.activeGeneVariantTab = "feature-matrix-tab";
            },
            onSummaryMounted: function() {
                if (this.selectedVariant) {
                    this.$refs.variantSummaryCardRef.hideGetStartedBanner();
                }
            },
            fetchSeqReads: function(bamType) {
                const self = this;
                const isLoading = true;
                self.$refs.variantSummaryCardRef.markSeqChartsLoading(bamType, isLoading);
                if (self.selectedVariant) {
                    self.cohortModel.promiseFetchSeqReads(self.selectedVariant, bamType)
                        .then(() => {
                            self.$refs.variantSummaryCardRef.updateSeqCharts(bamType);
                        })
                }
            }
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
                    return this.globalApp.utility.formatDisplay(this.selectedVariant, this.cohortModel.translator)
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
            },
            sampleModelsToDisplay: function() {
                let filteredModels = [];
                if (this.sampleModels) {
                    this.sampleModels.forEach(model => {
                        if (this.showCosmicVariantsCard && model.id === 'cosmic-variants') {
                            filteredModels.push(model);
                        }
                        if (this.showKnownVariantsCard && model.id === 'known-variants') {
                            filteredModels.push(model);
                        }
                        if (model.id !== 'known-variants' && model.id !== 'cosmic-variants') {
                            filteredModels.push(model);
                        }
                    })
                }
                return filteredModels;
            }
        },
    }
</script>

<style scoped>

</style>