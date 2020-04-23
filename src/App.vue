<template>
    <v-app>
        <v-app-bar app dark color=appColor>
            <v-toolbar-title class="headline text-uppercase">
                <span id="title">Oncogene.iobio</span>
            </v-toolbar-title>
            <v-toolbar-title style="padding-bottom:15px">
                <span id="beta-title">v2</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <files-menu
                    v-if="cohortModel"
                    ref="fileMenuRef"
                    :cohortModel="cohortModel"
                    @update-samples="onUpdateSamples"
                    @on-files-loaded="onFilesLoaded"
                    @load-demo-data="onLoadDemoData"
            >
            </files-menu>
            <v-btn
                    text
                    href="http://iobio.io"
                    target="_blank"
            >
                <span class="mr-2 ml-2">an iobio project</span>
            </v-btn>
        </v-app-bar>
        <v-content>
            <Home v-if="cohortModel"
                  :d3="globalApp.d3"
                  :$="globalApp.$"
                  :cohortModel="cohortModel"
                  :hoverTooltip="hoverTooltip"
                  :clickTooltip="clickTooltip"
                  :navbarHeight="navBarHeight"
                  @upload-config="onUploadConfig"
                  @load-demo="onLoadDemo"
            >

            </Home>
        </v-content>
    </v-app>
</template>

<script>
    // vue components
    import FilesMenu from './components/FilesMenu'
    import Home from './components/Home';

    // js components
    import Glyph from './js/Glyph.js'
    import VariantTooltip from './js/VariantTooltip.js'

    // models
    import CacheHelper from "./models/CacheHelper";
    import CohortModel from './models/CohortModel.js'
    import EndpointCmd from './models/EndpointCmd.js'
    import FeatureMatrixModel from './models/FeatureMatrixModel.js'
    import FilterModel from './models/FilterModel.js'
    import FreebayesSettings from './models/FreebayesSettings.js'
    import GeneModel from './models/GeneModel.js'
    import GenericAnnotation from './models/GenericAnnotation.js'
    import GenomeBuildHelper from './models/GenomeBuildHelper.js'
    import Translator from './models/Translator.js'

    // static data
    import allGenesData from './data/genes.json'

    export default {
        name: 'App',
        components: {
            Home,
            FilesMenu
        },
        data: () => {
            return {
                // views
                clickTooltip: null,
                hoverTooltip: null,

                // models
                // todo: pass some of these through cohort model, may not need handle to them in component
                cohortModel: null,
                featureMatrixModel: null,
                filterModel: null,
                geneModel: null,
                genomeBuildHelper: null,

                // view props
                mainContentWidth: 0,
                navBarHeight: 0,

                // static data
                allGenes: allGenesData
            }
        },
        methods: {
            onLoadDemoData: function (loadAction) {
                this.$emit("load-demo-data", loadAction);
            },
            onFilesLoaded: function () {
                this.promiseLoadData();
            },
            onUpdateSamples: function () {
                this.$emit('update-samples');
            },
            onResize: function () {
                const self = this;
                self.mainContentWidth = self.globalApp.$('main.content .container').outerWidth();
                // self.calcFeatureMatrixWidthPercent();
                if (self.mainContentWidth > 905) {
                    self.globalApp.$('main.content .container').removeClass("small");
                } else {
                    self.globalApp.$('main.content .container').addClass("small");
                }
            },
            onUploadConfig: function () {
                alert('Upload config not implemented in app yet');
            },
            onLoadDemo: function () {
                alert('Load demo not implemented in app yet');
            },
            promiseInitFromUrl: function () {
                const self = this;
                return new Promise(function (resolve, reject) {
                    // Extract lists from collective params
                    let sampleNames = [];
                    let tumorStatuses = [];
                    let vcfs = [];
                    let tbis = [];
                    let bams = [];
                    let bais = [];

                    let modelInfos = [];
                    for (let i = 0; i < sampleNames.length; i++) {
                        let modelInfo = {'name': sampleNames[i]};
                        modelInfo.id = tumorStatuses[i] ? 'n' + i : 't' + (i - 1);
                        modelInfo.name = sampleNames[i];
                        modelInfo.isTumor = tumorStatuses[i];
                        modelInfo.vcf = vcfs[i];
                        modelInfo.tbi = tbis[i];
                        modelInfo.bam = bams[i];
                        modelInfo.bai = bais[i];
                        modelInfos.order = i;
                        modelInfos.push(modelInfo);
                    }

                    if (modelInfos.length > 0) {
                        self.cohortModel.promiseInit(modelInfos)
                            .then(function () {
                                resolve();
                            }).catch(function (error) {
                            reject(error);
                        })
                    } else {
                        resolve();
                    }
                })

            },
            promiseInitCache: function () {
                let self = this;
                return new Promise(function (resolve, reject) {
                    self.cacheHelper = new CacheHelper(self.globalApp, self.forceLocalStorage);

                    // todo: these require d3 rebind - implement or get rid of
                    // self.cacheHelper.on("geneAnalyzed", function (geneName) {
                    //     self.$refs.genesCardRef.determineFlaggedGenes();
                    //
                    //     if (self.selectedGene && self.selectedGene.hasOwnProperty("gene_name")
                    //         && geneName === self.selectedGene.gene_name) {
                    //         self.promiseLoadData();
                    //     }
                    // });
                    // self.cacheHelper.on("analyzeAllCompleted", function () {
                    //     if (!self.isEduMode) {
                    //         self.$refs.navRef.onShowFlaggedVariants();
                    //     }
                    //     if (self.launchedFromClin) {
                    //         self.onSendFiltersToClin();
                    //         self.onSendFlaggedVariantsToClin();
                    //     }
                    // });

                    self.globalApp.cacheHelper = self.cacheHelper;
                    window.globalCacheHelper = self.cacheHelper;

                    self.cacheHelper.promiseInit()
                        .then(function () {
                            self.cacheHelper.isolateSession(self.isEduMode);
                            resolve();
                        })
                        .catch(function (error) {
                            var msg = "A problem occurred in promiseInitCache(): " + error;
                            console.log(msg);
                            reject(msg);
                        })
                })
            },
            promiseLoadData: function () {
                let self = this;

                // TODO: this is how we get rolling for new setup...


                return new Promise(function (resolve, reject) {

                    if (self.cohortModel) {
                        self.cohortModel.promiseLoadSomaticVariants()
                            .then(() => {
                                resolve();
                            })
                            .catch((error) => {
                                reject(error);
                            })
                    }

                    // if (self.models && self.models.length > 0) {
                    //     // let cardWidthScale = self.isLeftDrawerOpen ? 1.0 : 0.65;
                    //     self.cardWidth = self.$('#genes-card').innerWidth();
                    //     var options = {'getKnownVariants': self.showKnownVariantsCard};
                    //     options['getCosmicVariants'] = self.showCosmicVariantsCard;
                    //     options['loadFromFlag'] = loadingFromFlagEvent;
                    //     options['loadFeatureMatrix'] = loadFeatureMatrix;
                    //
                    //     // TODO: promiseloadallsomatic
                    //
                    //     self.cohortModel.promiseLoadData(self.selectedGene,
                    //         self.selectedTranscript,
                    //         options)
                    //         .then(function() {
                    //             self.onUpdateSamples(); // TODO: do we still need to call this?
                    //
                    //             // Draw feature matrix after somatic field filled
                    //             self.calcFeatureMatrixWidthPercent();
                    //             let allVariantsPassingFilters = self.cohortModel.getAllFilterPassingVariants();
                    //             self.featureMatrixModel.promiseRankVariants(self.cohortModel.allUniqueFeaturesObj,
                    //                 self.cohortModel.allSomaticFeaturesLookup, self.cohortModel.allInheritedFeaturesLookup, allVariantsPassingFilters);
                    //
                    //             // TODO: should I populate somatic filters here?
                    //             // self.filterModel.populateEffectFilters(resultMap);
                    //             // self.filterModel.populateRecFilters(resultMap);
                    //
                    //             // TODO: doesn't work w/ intervals not even in 1
                    //             const nodeRange = 0.10;
                    //             self.cohortModel.varAfNodes = self.cohortModel.getVariantAFNodes(nodeRange);
                    //             self.cohortModel.varAfLinks = self.cohortModel.getVariantAFLinks(self.cohortModel.varAfNodes, nodeRange);
                    //
                    //             self.cohortModel.promiseMarkCodingRegions(self.selectedGene, self.selectedTranscript)
                    //                 .then(function (data) {
                    //                     self.analyzedTranscript = data.transcript;
                    //                     self.coverageDangerRegions = data.dangerRegions;
                    //                     self.$refs.genesCardRef.determineFlaggedGenes();
                    //                     resolve();
                    //                 });
                    //         })
                    //         .catch(function (error) {
                    //             reject(error);
                    //         })
                    // } else {
                    //     Promise.resolve();
                    // }
                })
            },
        },
        mounted: function () {
            const self = this;
            // TODO: can probably get rid of this
            self.selectedGene = 'fakeGene1';
            self.selectedTranscript = 'fakeTranscript1';
            self.cardWidth = window.innerWidth;

            // self.mainContentWidth = self.d3.select('main.content .container').outerWidth();
            self.globalApp.$(window).resize(function () {
                self.onResize();
            });

            document.addEventListener("visibilitychange", function () {
                if (!document.hidden) {
                    setTimeout(function () {
                        self.onResize();
                    }, 1000)
                }
            }, false);

            // Safari can't use IndexedDB in iframes, so in this situation, use
            // local storage instead.
            if (window != top && self.utility.detectSafari()) {
                self.forceLocalStorage = true;
            }
            // self.setAppMode();

            self.genomeBuildHelper = new GenomeBuildHelper(self.globalApp);
            self.genomeBuildHelper.promiseInit({DEFAULT_BUILD: 'GRCh37'})
                .then(function () {
                    return self.promiseInitCache();
                })
                .then(function () {
                    let glyph = new Glyph();
                    let translator = new Translator(self.globalApp, glyph, self.globalApp.utility);
                    let genericAnnotation = new GenericAnnotation(glyph, self.globalApp.d3);

                    self.geneModel = new GeneModel(self.globalApp, self.forceLocalStorage);
                    self.geneModel.geneSource = "gencode";
                    self.geneModel.genomeBuildHelper = self.genomeBuildHelper;
                    self.geneModel.setAllKnownGenes(self.allGenes);
                    self.geneModel.translator = translator;


                    // Instantiate helper class than encapsulates IOBIO commands
                    let endpoint = new EndpointCmd(self.globalApp,
                        //self.cacheHelper.launchTimestamp, TODO: fix this when add cache back and remove Date below
                        Date.now().valueOf(),
                        self.genomeBuildHelper,
                        self.globalApp.utility.getHumanRefNames);

                    // self.variantExporter = new VariantExporter(self.globalApp);

                    self.cohortModel = new CohortModel(
                        self.globalApp,
                        endpoint,
                        genericAnnotation,
                        translator,
                        self.geneModel,
                        self.genomeBuildHelper,
                        new FreebayesSettings(),
                        self.cacheHelper);

                    // self.geneModel.on("geneDangerSummarized", function (dangerSummary) {
                    //     self.cohortModel.captureFlaggedVariants(dangerSummary)
                    // });

                    self.cacheHelper.cohort = self.cohortModel;

                    // self.variantExporter.cohort = self.cohortModel;

                    self.inProgress = self.cohortModel.inProgress;


                    self.featureMatrixModel = new FeatureMatrixModel(self.globalApp, self.cohortModel, false, false, 0);
                    self.featureMatrixModel.init();
                    self.cohortModel.featureMatrixModel = self.featureMatrixModel;

                    let tipType = "hover";
                    self.hoverTooltip = new VariantTooltip(
                        self.globalApp,
                        genericAnnotation,
                        glyph,
                        translator,
                        self.cohortModel.annotationScheme,
                        self.genomeBuildHelper,
                        tipType,
                        null);

                    tipType = "click";
                    self.clickTooltip = new VariantTooltip(
                        self.globalApp,
                        genericAnnotation,
                        glyph,
                        translator,
                        self.cohortModel.annotationScheme,
                        self.genomeBuildHelper,
                        tipType,
                        self);


                    self.filterModel = new FilterModel(translator, self.globalApp.$);
                    self.cohortModel.filterModel = self.filterModel;

                    // self.promiseInitFromUrl()
                    //     .then(function () {
                    //         self.models = self.cohortModel.sampleModels;
                    //         if (self.selectedGene && Object.keys(self.selectedGene).length > 0) {
                    //             self.promiseLoadData();
                    //         } else {
                    //             if (self.launchedWithUrlParms && self.geneModel.sortedGeneNames.length === 0) {
                    //                 self.onShowSnackbar({
                    //                     message: 'Enter a gene name',
                    //                     timeout: 5000
                    //                 });
                    //                 self.bringAttention = 'gene';
                    //             }d
                    //         }
                    // })
                })
                .catch((error) => {
                    console.log("Probably not connected to the internet... ");
                    console.log(error);
                })
        },
    }
</script>
<style scoped lang="sass">
    @import ./assets/sass/_tooltip.sass

    #title
        font-family: Quicksand
        font-weight: 500

        #beta-title
            font-style: italic
            font-size: 16px
            margin-right: 5px
            margin-left: 0px
            color: yellow
</style>
