<template>
    <v-app>
        <v-app-bar flat app dark color=appColor>
            <v-toolbar-title style="width: 300px" class="headline text-uppercase">
                <span id="title">Oncogene.iobio</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-chip v-if="numSomaticVars != null" class="var-chip" color="white" outlined> {{ numSomaticVars + ' Somatic Variants Found in ' + numSomaticGenes + ' Genes' }}
            </v-chip>
            <div class="text-center mx-2" v-if="displayUnmatchedGenesBtn">
                <v-menu bottom offset-y>
                    <template v-slot:activator="{ on: menu, attrs }">
                        <v-tooltip dark bottom>
                            <template v-slot:activator="{ on: tooltip }">
                                <v-btn
                                        color="secondary"
                                        dark
                                        v-bind="attrs"
                                        v-on="{ ...tooltip, ...menu }"
                                >
                                    Unmatched Genes
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </template>
                    <v-list>
                        <v-list-item
                                v-for="(gene, index) in unmatchedGenesList"
                                :key="index"
                                style="font-family: Quicksand"
                        >
                            <v-list-item-title>{{ gene }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>
            <div class="text-center mx-2" v-if="activeFilters.length > 0">
                <v-menu bottom offset-y>
                    <template v-slot:activator="{ on: menu, attrs }">
                        <v-tooltip dark bottom>
                            <template v-slot:activator="{ on: tooltip }">
                                <v-btn
                                        color="secondary"
                                        dark
                                        v-bind="attrs"
                                        v-on="{ ...tooltip, ...menu }"
                                >
                                    Active Filters
                                </v-btn>
                            </template>
<!--                            <span>Click to view filters used for currently called somatic variants</span>-->
                        </v-tooltip>
                    </template>
                    <v-list>
                        <v-list-item
                                v-for="(filter, index) in activeFilters"
                                :key="index"
                                style="font-family: Quicksand"
                        >
                            <v-list-item-title>{{ filter }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>
            <v-btn color="secondary" v-if="filesLoaded && !demoMode" @click="displayFilesCarousel">Files</v-btn>
          <v-btn color="secondary" class="mx-2" v-if="filesLoaded" @click="displayAbout">
            Docs
          </v-btn>
            <v-btn
                    text
                    href="http://iobio.io"
                    target="_blank"
            >
              <span class="mr-2 ml-2">an iobio project</span>
            </v-btn>
        </v-app-bar>
        <v-main style="background-color: #7f1010">
            <Home v-if="filterModel"
                  ref="homePanel"
                  :d3="globalApp.d3"
                  :$="globalApp.$"
                  :cohortModel="cohortModel"
                  :filterModel="filterModel"
                  :geneModel="geneModel"
                  :genomeBuildHelper="genomeBuildHelper"
                  :hoverTooltip="hoverTooltip"
                  :navbarHeight="navBarHeight"
                  :geneList="allGenes"
                  @gene-changed="onGeneChanged"
                  @set-global-display="setGlobalDisplay"
                  @set-filter-display="setFilterDisplay"
                  @display-unmatched-genes-btn="onUnmatchedGenes"
                  @hide-files-btn="demoMode = true"
            >
            </Home>
        </v-main>
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
                displayUnmatchedGenesBtn: false,
                unmatchedGenesList: [],
                demoMode: false,

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
                this.selectedGeneDisplay = geneDisplay;
                this.selectedBuild = this.genomeBuildHelper.currentBuild.name;
                this.dataLoaded = true;
            },
            setGlobalDisplay: function (globalData) {
                this.numSomaticVars = globalData.variantCount;
                this.numSomaticGenes = globalData.geneCount;
                this.filesLoaded = true;
                this.setFilterDisplay(globalData);
            },
            setFilterDisplay: function (globalData) {
                this.activeFilters = [];
                globalData.filters.forEach(filter => {
                    if (filter.type === 'slider') {
                        this.activeFilters.push(filter.display + ' ' + filter.currLogic + ' ' + filter.currVal + filter.labelSuffix);
                    } else {
                        this.activeFilters.push('No ' + filter.excludeName);
                    }
                });
            },
            displayFilesCarousel: function () {
                this.$refs.homePanel.toggleCarousel(true);
            },
            displayAbout: function() {
                this.$refs.homePanel.displayAbout();
            },
            onUnmatchedGenes: function(unmatchedGeneList) {
                this.unmatchedGenesList = unmatchedGeneList;
                this.displayUnmatchedGenesBtn = true;
            }
        },
        mounted: function () {
            const self = this;
            self.cardWidth = window.innerWidth;

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

                    self.filterModel = new FilterModel(translator, self.cohortModel, self.globalApp.$);
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
