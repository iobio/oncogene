<template>
    <v-app>
        <v-app-bar flat app dark color=appColor>
            <v-toolbar-title style="width: 300px" class="headline text-uppercase">
                <span id="title">Oncogene.iobio</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-chip v-if="numSomaticVars != null" class="var-chip" color="white" outlined> {{ numSomaticVars + ' SomaticVariants Found in ' + numSomaticGenes + ' Genes' }}
            </v-chip>
            <v-select v-if="activeFilters.length > 0"
                      dense
                      :items="activeFilters"
                      label="Active Filters"
                      outlined
                      class="mt-6 pa-2"
                      style="width: 100px"
            ></v-select>
            <v-btn color="secondary" v-if="filesLoaded" @click="displayFilesCarousel">Files</v-btn>
            <v-btn
                    text
                    href="http://iobio.io"
                    target="_blank"
            >
                <span class="mr-2 ml-2">an iobio project</span>
            </v-btn>
        </v-app-bar>
        <v-content style="background-color: #7f1010">
            <Home v-if="filterModel"
                  ref="homePanel"
                  :d3="globalApp.d3"
                  :$="globalApp.$"
                  :cohortModel="cohortModel"
                  :filterModel="filterModel"
                  :hoverTooltip="hoverTooltip"
                  :navbarHeight="navBarHeight"
                  :geneList="allGenes"
                  @load-demo="onLoadDemo"
                  @gene-changed="onGeneChanged"
                  @set-global-display="setGlobalDisplay"
            >

            </Home>
        </v-content>
    </v-app>
</template>

<script>
    // vue components
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
        },
        data: () => {
            return {
                // views
                hoverTooltip: null,
                selectedGeneName: null,
                selectedGeneDisplay: null,
                selectedBuild: null,

                // models
                cohortModel: null,
                featureMatrixModel: null,
                filterModel: null,
                geneModel: null,
                genomeBuildHelper: null,

                // view props
                mainContentWidth: 0,
                navBarHeight: 0,
                dataLoaded: false,
                enteredGene: null,
                numSomaticVars: null,
                numSomaticGenes: null,
                activeFilters: [],
                filesLoaded: false,

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
            onLoadDemo: function () {
                alert('Load demo not implemented in app yet');
            },
            promiseInitCache: function () {
                let self = this;
                return new Promise(function (resolve, reject) {
                    self.cacheHelper = new CacheHelper(self.globalApp, self.forceLocalStorage);

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
            onGeneChanged: function (geneDisplay) {
                // todo: can get rid of this with redesign?
                this.selectedGeneDisplay = geneDisplay;
                this.selectedBuild = this.genomeBuildHelper.currentBuild.name;
                this.dataLoaded = true;
            },
            setGlobalDisplay: function (chipData) {
                this.numSomaticVars = chipData.variantCount;
                this.numSomaticGenes = chipData.geneCount;
                chipData.filters.forEach(filter => {
                    this.activeFilters.push(filter.display + ' ' + filter.currLogic + ' ' + filter.currVal);
                });
                this.filesLoaded = true;
            },
            displayFilesCarousel: function () {
                this.$refs.homePanel.toggleCarousel(true);
            }
        },
        mounted: function () {
            const self = this;
            // TODO: can probably get rid of this
            // self.selectedGene = 'fakeGene1';
            // self.selectedTranscript = 'fakeTranscript1';
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
                    let glyph = new Glyph(self.globalApp.d3, self.globalApp.$);
                    let translator = new Translator(self.globalApp, glyph, self.globalApp.utility);
                    glyph.translator = translator;
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
                        null, //new FreebayesSettings(),
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

                    // tipType = "click";
                    // self.clickTooltip = new VariantTooltip(
                    //     self.globalApp,
                    //     genericAnnotation,
                    //     glyph,
                    //     translator,
                    //     self.cohortModel.annotationScheme,
                    //     self.genomeBuildHelper,
                    //     tipType,
                    //     self);

                    self.filterModel = new FilterModel(translator, self.globalApp.$);
                    self.cohortModel.filterModel = self.filterModel;
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

    .app-toolbar-chip
        font-size: 14px
        font-family: Quicksand
        font-weight: bold
        margin-top: 10px
        margin-left: 10px

    #title
        font-family: Quicksand
        font-weight: 300
        padding-left: 20px

    #beta-title
        font-size: 14px
        margin-right: 5px
        margin-left: 0px
        padding-left: 2px

    #nav-chips
        .chip
            background: #965757
            color: white

    .filter-chip
        font-family: Quicksand
        font-size: 12px

    .var-chip
        font-family: Quicksand
        font-size: 14px
        margin-left: 150px

</style>
