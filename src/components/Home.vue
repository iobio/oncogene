<template>
    <div>
        <v-sheet
                :height="screenHeight"
                class="overflow-auto"
                style="position: relative;"
        >
            <!--Static main page-->
            <v-layout fill-height>
                <v-flex md3 v-if="dataEntered || debugMode" :class="{ 'blur-content': displayCarousel }">
                    <v-card flat
                            tile
                            id="nav-card"
                            style="overflow: scroll; height: 100%; background: linear-gradient(rgba(127,16,16,1) 16%, rgba(156,31,31,1) 38%, rgba(150,87,87,1) 80%)">
                        <v-toolbar style="background-color: transparent" flat>
                            <v-toolbar-items class="justify-center">
                                <v-autocomplete v-model="lookupGene"
                                                @change="onGeneSelected"
                                                :items="geneList"
                                                :allow-overflow="false"
                                                :eager="true"
                                                :readonly="false"
                                                item-text="gene_name"
                                                item-value="gene_name"
                                                label="Enter gene..."
                                                prepend-icon="search"
                                                color="white"
                                                style="font-family: Quicksand"
                                                filled
                                                outlined
                                                dense
                                                single-line
                                                dark>
                                </v-autocomplete>
                            </v-toolbar-items>
                        </v-toolbar>
                        <v-tabs show-arrows
                                dark
                                optional
                                centered
                                icons-and-text
                                v-model="selectedTab"
                                style="padding-top: 5px"
                                background-color="transparent">
                            <v-tabs-slider></v-tabs-slider>
                            <v-tab href="#genes-tab" style="font-size: 10px">
                                <v-icon style="margin-bottom: 0; padding-left: 5px">line_weight</v-icon>
                            </v-tab>
                            <v-tab href="#filter-tab" style="font-size: 10px">
                                <v-icon style="margin-bottom: 0; padding-left: 5px">filter_alt</v-icon>
                            </v-tab>
                            <v-tab href="#history-tab" style="font-size: 10px">
                                <v-icon style="margin-bottom: 0; padding-left: 5px">history</v-icon>
                            </v-tab>
                            <v-tabs-items v-model="selectedTab" style="background-color: transparent">
                                <v-tab-item
                                        :key="'genesTab'"
                                        :id="'genes-tab'">
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
                                </v-tab-item>
                                <v-tab-item
                                        :key="'filterTab'"
                                        :id="'filter-tab'">
                                    <filter-panel-menu
                                            v-if="filterModel"
                                            ref="filterSettingsMenuRef"
                                            :filterModel="filterModel"
                                            :showCoverageCutoffs="showCoverageCutoffs"
                                            :annotationComplete="annotationComplete"
                                            :applyFilters="applyFilters"
                                            :somaticOnlyMode="cohortModel.onlySomaticCalls"
                                            @recall-somatic-variants="callSomaticVariants"
                                            @filter-change="onFilterChange">
                                    </filter-panel-menu>
                                </v-tab-item>
                                <v-tab-item
                                        :key="'historyTab'"
                                        :id="'history-tab'">
                                    <history-tab v-if="filterModel"
                                            ref="historyTabRef"
                                            :filterModel="filterModel"
                                            @reload-analysis-history="reloadAnalysis">
                                    </history-tab>
                                </v-tab-item>
                            </v-tabs-items>
                        </v-tabs>
                    </v-card>
                </v-flex>
                <Welcome v-show="!dataEntered && !debugMode || displayCarousel"
                         :d3="d3"
                         :cohortModel="cohortModel"
                         :welcomeWidth="screenWidth"
                         :welcomeHeight="screenHeight"
                         :navBarHeight="navBarHeight"
                         :firstLoadComplete="firstLoadComplete"
                         @toggle-carousel="toggleCarousel"
                         @load-demo="$emit('load-demo')"
                         @launched="onLaunch">
                </Welcome>
                <v-container v-if="dataEntered || debugMode" :height="700" class="pa-0"
                             :class="{ 'blur-content': displayCarousel }" style="overflow-y: scroll">
                    <v-row no-gutters>
                        <gene-card v-if="selectedGene"
                                   :selectedGene="selectedGene"
                                   :selectedTranscript="selectedTranscript"
                                   :geneRegionStart="geneRegionStart"
                                   :geneRegionEnd="geneRegionEnd"
                                   :geneModel="geneModel"
                                   :d3="d3"
                                   :$="$"
                                   @transcript-selected="onTranscriptSelected"
                                   @gene-source-selected="onGeneSourceSelected"
                                   @gene-region-buffer-change="onGeneRegionBufferChange"
                                   @gene-region-zoom="onGeneRegionZoom"
                                   @gene-region-zoom-reset="onGeneRegionZoomReset">
                        </gene-card>
                    </v-row>
                    <v-row no-gutters>
                        <v-col cols="8">
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
                                    @toggle-cnv-tooltip="toggleCnvTooltip"
                            >
                            </variant-card>
                        </v-col>
                        <v-col cols="4" class="summary-card">
                            <variant-summary-card
                                    v-if="selectedSamples"
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
                                    @clear-and-fetch-reads="clearFetchSeqReads"
                                    @summary-mounted="onSummaryMounted"
                                    @summaryCardVariantDeselect="deselectVariant"
                                    @show-pileup="onShowPileupForVariant">
                            </variant-summary-card>
                        </v-col>
                    </v-row>
                </v-container>
            </v-layout>
        </v-sheet>
        <v-dialog id="pileup-modal"
                  v-model="displayPileup"
                  width="75%"
                  height="75%"
                  style="z-index: 1033">
            <v-card class='full-width' style="overflow-y:auto;height:100%;z-index:1033">
                <pileup id="pileup-container"
                        :heading="pileupInfo.title"
                        :referenceURL="pileupInfo.referenceURL"
                        :tracks="pileupInfo.tracks"
                        :locus="pileupInfo.coord"
                        :visible="displayPileup"
                        :showLabels=true
                        :hasRnaSeq="cohortModel.hasRnaSeqData"
                        :hasAtacSeq="cohortModel.hasAtacSeqData"/>
            </v-card>
        </v-dialog>
        <v-dialog
                v-model="displayUnmatchedGenesWarning"
                width="40%"
                height="350"
                style="z-index: 1033">
            <v-card id="unmatched-genes-modal">
                <v-card-title class="unmatched-headline mb-3">Unmatched Gene Names Warning</v-card-title>
                <v-card-text>
                    The following gene targets contain somatic variants according to the current filtering criteria,
                    but could not be matched to the entered loci names. To view these targets, please search for gene
                    name
                    synonyms using Gene Cards and manually search for them within Oncogene.*
                    <v-list>
                        <v-list-item v-for="(gene, i) in unmatchedGenes"
                                     :key="i">
                            <v-list-item-content>
                                <v-list-item-title>{{gene}}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="secondary" @click="onAcknowledgeUnknownGenes">OK</v-btn>
                </v-card-actions>
                <v-footer style="font-size: 12px">
                    *Note: we're currently working to eliminate these mismatches
                </v-footer>
            </v-card>
        </v-dialog>
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
    import Pileup from './partials/Pileup.vue'
    import HistoryTab from './HistoryTab.vue'

    import SomaticGenesCard from './SomaticGenesCard.vue'
    import GeneCard from './GeneCard.vue'

    import '@/assets/css/v-tooltip.css'

    export default {
        name: "Home.vue",
        components: {
            Welcome,
            VariantCard,
            VariantSummaryCard,
            FilterPanelMenu,
            HistoryTab,
            GeneCard,
            SomaticGenesCard,
            Pileup
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
            geneModel: {
                type: Object,
                default: null
            },
            genomeBuildHelper: {
                type: Object,
                default: null
            },
            hoverTooltip: {
                type: Object,
                default: null
            },
            geneList: {
                type: Array,
                default: () => {
                    return [];
                }
            }
        },
        data: () => {
            return {
                // todo: get rid of unused vars
                screenWidth: (window.innerWidth * 0.5),
                screenHeight: window.innerHeight,

                // view state
                globalMode: false,
                dataEntered: false,
                displayCarousel: false,
                displayLoader: false,
                showKnownVariantsCard: false,
                showCosmicVariantsCard: false,
                cardWidth: 500,
                annotationComplete: false,
                showCoverageCutoffs: false,
                applyFilters: false,
                firstLoadComplete: false,

                // selection state
                selectedGene: null,
                selectedTranscript: null,
                selectedVariant: null,
                analyzedTranscript: null,
                coverageDangerRegions: null,
                geneRegionStart: null,
                geneRegionEnd: null,
                lastClickCard: null,
                selectedTab: '',
                totalSomaticVarCount: -1,
                pileupInfo: {
                    // This controls how many base pairs are displayed on either side of
                    // the center of the locus.
                    SPAN: 30,
                    // These are the reference URLs for the human genome builds currently supported
                    referenceURLs: {
                        'GRCh37': 'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg19/hg19.fasta',
                        'GRCh38': 'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg38/hg38.fa'
                    },
                    // Show the pileup dialog
                    show: false,
                    // Title in the pileup dialog
                    title: 'Pileup View',
                    // The coverage bam file
                    coverageBam: null,
                    coverageBai: null,
                    // The rnaseq bam file
                    rnaSeqBam: null,
                    rnaSeqBai: null,
                    // The atacseq bam file
                    atacSeqBam: null,
                    atacSeqBai: null,
                    // The vcf file
                    variantURL: null,
                    variantIndexURL: null,
                    // The reference URL (for the current genome build)
                    referenceURL: 'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg19/hg19.fasta',
                },
                displayPileup: false,
                displayUnmatchedGenesWarning: false,
                displayUnmatchedGenesChip: false,
                unmatchedGenes: [],

                // models & model data
                sampleIds: null,            // Sample ids for canonical sample models
                selectedSamples: null,      // NOTE: must be in same order as sampleIds
                sampleModels: null,
                analysisHistoryList: [],    // List of different calling criteria used in current session
                rankedGeneList: [],

                allGeneNames: ['test', 'moo', 'oink'],
                lookupGene: null,

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
            'cohortModel.annotationComplete': function () {
                if (this.cohortModel && this.cohortModel.getNormalModel()) {
                    this.annotationComplete = !this.cohortModel.getNormalModel().inProgress.loadingVariants;
                } else {
                    this.annotationComplete = false;
                }
            },
            selectedGene: function () {
                let selectedGeneDisplay = this.selectedGene.gene_name + " " + this.selectedGene.chr;
                this.$emit('gene-changed', selectedGeneDisplay);
                this.selectedTab = 'genes-tab';
            }
        },
        methods: {
            // Point of entry for launch
            onLaunch: function (modelInfos, userGeneList) {
                const self = this;
                self.dataEntered = true;
                self.displayCarousel = false;
                self.firstLoadComplete = true;
                self.displayLoader = true;
                self.analysisHistoryList = [];
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
                });
            },
            reloadAnalysis: function(filterSettings) {
                // Set filtering criteria in model
                this.filterModel.loadFilterSettings(filterSettings);
                this.callSomaticVariants();
            },
            callSomaticVariants: function () {
                const self = this;
                self.selectedVariant = null;
                self.displayLoader = true;
                // let showTracks = false;
                // if (self.$refs.variantCardRef) {
                //     self.$refs.variantCardRef.forEach(function (variantCard) {
                //         variantCard.toggleTracks(showTracks);
                //     })
                // }
                self.geneModel.clearGeneObjects();
                self.cohortModel.promiseAnnotateGlobalSomatics()
                    .then(rankObj => {
                        let totalSomaticVarCount = rankObj.count;
                        let totalSomaticGenes = rankObj.geneCount;
                        let topRankedGene = rankObj.gene;
                        self.unmatchedGenes = rankObj.unmatchedGenes;

                        let geneModel = self.cohortModel.geneModel;
                        self.totalSomaticVarCount = totalSomaticVarCount;
                        let chipInfo = {
                            'variantCount': totalSomaticVarCount,
                            'geneCount': totalSomaticGenes,
                            'filters': self.filterModel.getActiveImplementedFilters()
                        };
                        self.$emit('set-global-display', chipInfo);

                        // Turn on track loaders
                        self.cohortModel.setLoaders(true);

                        self.rankedGeneList = geneModel.rankedGeneList;
                        self.selectedGene = topRankedGene;
                        self.selectedTranscript = geneModel.getCanonicalTranscript(self.selectedGene);
                        self.geneRegionStart = self.selectedGene.start;
                        self.geneRegionEnd = self.selectedGene.end;

                        self.cohortModel.promiseGetCosmicVariantIds(self.selectedGene, self.selectedTranscript)
                            .then(() => {
                                const globalMode = true;
                                // Get rid of global loader
                                self.displayLoader = false;
                                // showTracks = true;
                                // if (self.$refs.variantCardRef) {
                                //     self.$refs.variantCardRef.forEach(function (variantCard) {
                                //         variantCard.toggleTracks(showTracks);
                                //     })
                                // }
                                self.promiseLoadData(self.selectedGene, self.selectedTranscript, false, globalMode)
                                    .then(() => {
                                        if (self.unmatchedGenes.length > 0) {
                                            self.displayUnmatchedGenesWarning = true;
                                        }
                                    })
                                    .catch(error => {
                                        Promise.reject('Could not load data: ' + error);
                                    })
                            }).catch(error => {
                            Promise.reject('Problem getting cosmic variant IDS: ' + error);
                        });
                        let rankedGeneNames = [];
                        self.geneModel.rankedGeneList.forEach(geneObj => {
                            rankedGeneNames.push(geneObj.gene_name);
                        });
                        self.filterModel.addFilterHistory(totalSomaticVarCount, totalSomaticGenes, rankedGeneNames);
                        if (self.$refs.historyTabRef) {
                            self.$refs.historyTabRef.refreshList();
                        }
                    }).catch(error => {
                    console.log('There was a problem calling global somatics: ' + error);
                });
            },
            promiseLoadData: function (selectedGene, selectedTranscript, transcriptChange, globalMode) {
                const self = this;

                return new Promise(function (resolve, reject) {
                    let options = {'getKnownVariants': false};
                    options['getCosmicVariants'] = false;
                    options['transcriptChange'] = transcriptChange;
                    options['globalMode'] = globalMode;
                    options['keepHomRefs'] = true;

                    self.cohortModel.promiseLoadData(selectedGene,
                        selectedTranscript,
                        options)
                        .then(function () {
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

                    // Hide banner
                    if (self.$refs.variantSummaryCardRef) {
                        self.$refs.variantSummaryCardRef.hideGetStartedBanner();
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
            promiseLoadGene: function (geneName, theTranscript, transcriptChange) {
                const self = this;
                const geneModel = self.cohortModel.geneModel;

                self.showWelcome = false;
                self.clearZoom = true;
                self.applyFilters = false;
                let showTracks = false;
                if (self.$refs.variantCardRef) {
                    self.$refs.variantCardRef.forEach(function (variantCard) {
                        variantCard.toggleTracks(showTracks);
                    })
                }
                return new Promise(function (resolve, reject) {
                    if (self.cohortModel) {
                        self.cohortModel.clearLoadedData(geneName);
                        self.cohortModel.setLoaders(true);
                    }

                    let theGeneObject = geneModel.geneObjects[geneName];
                    let geneObjP = theGeneObject ? Promise.resolve() : geneModel.promiseAddGeneName(geneName);
                    geneObjP.then(() => {
                        geneModel.promiseGetGeneObject(geneName)
                            .then(geneObj => {
                                theGeneObject = geneObj;
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
                                            self.promiseLoadData(self.selectedGene, self.selectedTranscript, transcriptChange, false)
                                                .then(function () {
                                                    self.clearZoom = false;
                                                    self.showVarViz = true;
                                                    self.applyFilters = true;
                                                    showTracks = true;
                                                    if (self.$refs.variantCardRef) {
                                                        self.$refs.variantCardRef.forEach(function (variantCard) {
                                                            variantCard.toggleTracks(showTracks);
                                                        })
                                                    }
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
                        }).catch(function (error) {
                            console.log(error);
                            geneModel.removeGene(geneName);
                            self.onShowSnackbar({
                                message: 'Bypassing ' + geneName + '. Unable to find transcripts.',
                                timeout: 60000
                            })
                        });
                })
            },
            // For local filters only, that does not affect somatic filters and recall variants (e.g. impact/type only)
            onFilterChange: function () {
                const self = this;
                self.selectedVariant = null;

                // Update drop down in app bar
                let globalData = {
                    'filters': self.filterModel.getActiveImplementedFilters()
                };
                self.$emit('set-filter-display', globalData);

                // Only annotate once we are guaranteed that our DOM update is done for all tracks
                self.cohortModel.promiseFilterVariants()
                    .then(() => {
                        self.filterModel.promiseAnnotateVariantInheritance(self.cohortModel.sampleMap)
                            .then((inheritanceObj) => {
                                self.cohortModel.setLoadedVariants(self.selectedGene);

                                // Turn loading flags off
                                self.cohortModel.getCanonicalModels().forEach((sampleModel) => {
                                    sampleModel.inProgress.loadingVariants = false;
                                });

                                self.cohortModel.allSomaticFeaturesLookup = inheritanceObj.somaticLookup;
                                self.cohortModel.allInheritedFeaturesLookup = inheritanceObj.inheritedLookup;
                            });
                    }).catch((err) => {
                    console.log('There was a problem applying variant filter: ' + err);
                });
            },
            reloadGene: function (geneToReload) {
                let self = this;
                if (geneToReload !== self.selectedGene.gene_name) {
                    // Load gene
                    self.onGeneSelected(geneToReload);
                    // Fill in text entry
                    //self.$refs.navRef.setSelectedGeneText(geneToReload);
                }
            },
            onGeneSelected: function (geneName, transcriptChange = false) {
                const self = this;
                let gene = geneName;
                if (!geneName) {
                    gene = self.lookupGene;
                }
                self.deselectVariant();
                self.promiseLoadGene(gene, null, transcriptChange);
            },
            onSummaryMounted: function () {
                if (this.selectedVariant) {
                    this.$refs.variantSummaryCardRef.hideGetStartedBanner();
                }
            },
            fetchSeqReads: function (bamType) {
                const self = this;
                const isLoading = true;
                self.$refs.variantSummaryCardRef.markSeqChartsLoading(bamType, isLoading);
                if (self.selectedVariant) {
                    self.cohortModel.promiseFetchSeqReads(self.selectedVariant, bamType)
                        .then(() => {
                            self.$refs.variantSummaryCardRef.updateSeqCharts(bamType);
                        })
                }
            },
            clearFetchSeqReads: function () {
                this.cohortModel.clearFetchedSeqReads();
                if (this.cohortModel.hasRnaSeqData && this.selectedVariant) {
                    this.fetchSeqReads(this.cohortModel.globalApp.RNASEQ_TYPE);
                }
                if (this.cohortModel.hasAtacSeqData && this.selectedVariant) {
                    this.fetchSeqReads(this.cohortModel.globalApp.ATACSEQ_TYPE);
                }
            },
            toggleCarousel: function (display) {
                this.displayCarousel = display;
            },
            onTranscriptIdSelected: function (transcriptId) {
                const self = this;
                let theTranscript = null;
                self.selectedGene.transcripts.filter(function (transcript) {
                    if (transcript.transcript_id.indexOf(transcriptId) == 0) {
                        theTranscript = transcript;
                    }
                })
                if (theTranscript != null) {
                    self.onTranscriptSelected(theTranscript);
                }
            },
            onTranscriptSelected: function (transcript) {
                const self = this;
                self.selectedTranscript = transcript;
                self.geneModel.setLatestGeneTranscript(self.selectedGene.gene_name, self.selectedTranscript);
                self.onGeneSelected(self.selectedGene.gene_name, true);
            },
            onGeneSourceSelected: function (theGeneSource) {
                const self = this;
                self.geneModel.geneSource = theGeneSource;
                this.onGeneSelected(this.selectedGene.gene_name);
            },
            onGeneRegionBufferChange: function (theGeneRegionBuffer) {
                const self = this;
                self.geneModel.geneRegionBuffer = theGeneRegionBuffer;
                // We have to clear the cache since the gene regions change
                // self.promiseClearCache()
                //     .then(function () {
                self.onGeneSelected(self.selectedGene.gene_name);
                // })
            },
            onGeneRegionZoom: function (theStart, theEnd) {
                const self = this;
                // Gene-viz watches these for updates to redraw track
                self.geneRegionStart = theStart;
                self.geneRegionEnd = theEnd;

                self.featureMatrixModel.setRankedVariants(self.geneRegionStart, self.geneRegionEnd);

                self.filterModel.regionStart = self.geneRegionStart;
                self.filterModel.regionEnd = self.geneRegionEnd;

                let start = Date.now();
                self.cohortModel.setLoadedVariants(self.selectedGene);
                let delta = Date.now() - start;
                console.log("Took " + delta + " ms to zoom region");
                self.cohortModel.setCoverage(self.geneRegionStart, self.geneRegionEnd);

            },
            onGeneRegionZoomReset: function (updateTrack = true) {
                const self = this;

                self.geneRegionStart = self.selectedGene.start;
                self.geneRegionEnd = self.selectedGene.end;

                self.filterModel.regionStart = null;
                self.filterModel.regionEnd = null;

                if (updateTrack) {
                    self.featureMatrixModel.setRankedVariants();
                    let start = Date.now();
                    self.cohortModel.setLoadedVariants(self.selectedGene);
                    let delta = Date.now() - start;
                    console.log("Took " + delta + " ms to RESET zoom region");
                    self.cohortModel.setCoverage();
                }
            },
            onShowPileupForVariant: function (variant) {
                let self = this;

                let theVariant = variant ? variant : this.selectedVariant;
                if (theVariant) {
                    let variantInfo = this.globalApp.utility.formatDisplay(theVariant, this.cohortModel.translator, this.isEduMode);
                    // Format the coordinate for the variant
                    const chrom = this.globalApp.utility.stripRefName(theVariant.chrom);
                    const start = theVariant.start - this.pileupInfo.SPAN;
                    const end = theVariant.start + this.pileupInfo.SPAN;
                    this.pileupInfo.coord = 'chr' + chrom + ':' + start + '-' + end;
                    this.pileupInfo.tracks = [];
                    // Set the bam, vcf, and references
                    this.cohortModel.getCanonicalModels().forEach(function (model) {
                        let currName = model.displayName !== '' ? model.displayName : '';
                        if (currName === '') {
                            currName = model.selectedSample;
                        } else {
                            currName += ' (' + model.selectedSample + ')';
                        }
                        let track = {name: currName};
                        track.variantURL = model.vcf.getVcfURL();
                        track.variantIndexURL = model.vcf.getTbiURL();
                        track.coverageBam = model.bam.coverageBam;
                        track.coverageBai = model.bam.coverageBai;
                        track.rnaSeqBam = model.bam.rnaSeqBam;
                        track.rnaSeqBai = model.bam.rnaSeqBai;
                        track.atacSeqBam = model.bam.atacSeqBam;
                        track.atacSeqBai = model.bam.atacSeqBai;
                        self.pileupInfo.tracks.push(track);
                    });
                    // Set the reference
                    this.pileupInfo.referenceURL = this.pileupInfo.referenceURLs[this.genomeBuildHelper.getCurrentBuild().name];
                    // set the title
                    const titleParts = [];
                    titleParts.push("Read Pileup");
                    titleParts.push(this.selectedGene.gene_name);
                    titleParts.push((theVariant.type ? theVariant.type.toUpperCase() + " " : "")
                        + theVariant.chrom + ":" + theVariant.start + " " + theVariant.ref + " -> " + theVariant.alt);
                    titleParts.push(variantInfo.HGVSpAbbrev);
                    this.pileupInfo.title = titleParts.join(' ');
                    this.displayPileup = true;
                } else {
                    return '';
                }
            },
            onAcknowledgeUnknownGenes: function () {
                this.displayUnmatchedGenesWarning = false;
                this.$emit('display-unmatched-genes-btn', this.unmatchedGenes);
            },
            toggleCnvTooltip: function(cnvInfo, mouseCoords) {
                const self = this;
                mouseCoords = self.d3.mouse(self.$el);
                if (cnvInfo) {
                    self.d3.select('#cnv-tooltip')
                        .html("Copy Number Event<br>" + self.selectedGene.chr + ":" + cnvInfo.start + "-" + cnvInfo.end + "<br>LCN: " + cnvInfo.lcn + "<br>TCN: " + cnvInfo.tcn)
                        .style("left", (mouseCoords[0]+10) + "px")
                        .style("top", (mouseCoords[1]+10) + "px")
                        .transition()
                        .duration(500)
                        .style('opacity', 1);
                } else {
                    self.d3.select('#cnv-tooltip')
                        .transition()
                        .duration(500)
                        .style('opacity', 0);
                }
            }
        },
        computed: {
            overlayWidth: function () {
                return this.screenWidth * 0.8;
            },
            canonicalSampleIds: function () {
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
            sampleModelsToDisplay: function () {
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
            },
            tabTitle: function () {
                if (this.selectedTab === 'genes-tab') {
                    return 'Ranked Genes';
                } else if (this.selectedTab === 'filter-tab') {
                    return 'Variant Filters';
                } else if (this.selectedTab === 'history-tab') {
                    return 'History';
                } else {
                    return '';
                }
            },
        }
    }
</script>

<style lang="sass">
    .summary-card
        padding-top: 15px
        font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif' !important

        .section-title
            font-family: 'Quicksand'
            color: white
            background-color: #7f1010
            padding-bottom: 5px

        .blur-content
            filter: blur(1px)
            -webkit-filter: blur(1px)

        #unmatched-genes-modal
            font-family: 'Open Sans'

            .unmatched-headline
                font-family: 'Quicksand'
                font-size: 18px
                background-color: #7f1010
                color: white
</style>