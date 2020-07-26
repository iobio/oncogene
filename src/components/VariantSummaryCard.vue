<!-- Component populated with variant details on selection.
     SJG updated May2018 -->

<style lang="sass">
    #getStartedBlock
        position: absolute
        width: 100%
        height: 100%
        top: 30%
        left: 50%
        transform: translate(-50%, -50%)
        -ms-transform: translate(-50%, -50%)
        z-index: 1

    .getStartedText
        position: absolute
        border-radius: 25px
        width: 100%
        height: 50px
        padding-top: 8px
        top: 40%
        font-family: Poppins
        font-size: 22px
        background-color: $app-color
        text-align: center
        color: white
        -webkit-box-shadow: 6px 11px 48px -7px rgba(0, 0, 0, 0.60)
        box-shadow: 6px 11px 48px -7px rgba(0, 0, 0, 0.60)

    .summary-card
        filter: blur(1px)
        -webkit-filter: blur(1px)

    .summary-field-label
        color: #b4b3b3
        font-style: italic
        font-size: 12px
        padding-left: 2px
        text-align: left

    .summary-viz
        min-height: 100px
        max-height: 600px
        padding-top: 0px
        overflow-x: hidden
        filter: blur(1px)
        -webkit-filter: blur(1px)

        .content
            font-size: 12px
            padding-left: 10px
            margin-bottom: 0px
            float: left
            max-width: 350px
            min-width: 350px

        .field-label
            color: #b4b3b3
            font-style: italic
            padding-left: 6px
            text-align: right

        .field-label-header
            color: #7f7f7f
            font-style: italic
            padding-left: 2px
            text-align: left
            font-family: 'Quicksand'

        .subtitle-label
            color: #7f7f7f
            font-style: italic
            padding-left: 6px
            text-align: center

        .field-value
            padding-right: 25px
            padding-left: 5px
            word-break: break-word

        .summary-field-value
            font-size: 12px
            word-break: break-word
            padding-left: 1px
            padding-right: 1px
            color: #888888
            text-align: left

        .cohort-summary-field-value
            font-size: 12px
            word-break: break-word
            padding-left: 1px
            padding-right: 1px
            padding-top: 5px !important

            #inheritance
                height: 18px

            #coverage-svg
                float: left

                rect
                    &.alt-count
                        stroke: black !important

                    &.ref-count
                        stroke: black !important
                        fill: none !important

                    &.alt-count
                        fill: #6A9C2F !important

                    &.other-count
                        stroke: black !important
                        fill: rgb(132, 132, 132) !important

                text
                    font-size: 12px !important

                    &.alt-count
                        fill: white !important

                    &.alt-count-under
                        fill: $text-color !important

                    &.other-count
                        fill: white !important
                        font-style: italic !important

                    &.other-count-under
                        fill: $text-color !important
                        font-style: italic !important

                    &.ref-count
                        fill: $text-color !important

                .header-small
                    overflow-wrap: break-word
                    text-align: left
                    width: 85px
                    float: left
                    color: $tooltip-label-color
                    fill: $tooltip-label-color

                .allele-count-bar
                    text
                        font-size: 11px !important
                        fill: $text-color

                #allele-count-legend
                    padding-top: 0px

                .affected-symbol
                    font-size: 14px
                    color: $danger-color !important
                    float: right
                    padding-right: 2px

                .allele-count-bar
                    overflow-wrap: break-word
                    float: left
                    width: 120px
                    min-height: 25px

                .ped-info
                    width: 270px
                    clear: both
                    line-height: 13px !important

                .ped-label
                    padding-top: 0px
                    vertical-align: top
                    text-align: left
                    width: 69px
                    float: left
                    font-size: 12px
                    color: $text-color

                .ped-zygosity
                    width: 75px
                    float: left

                .zygosity
                    float: left
                    font-size: 9px
                    font-weight: normal !important
                    padding-top: 1px !important
                    padding-bottom: 0px !important
                    padding-right: 0px !important
                    padding-left: 0px !important
                    background-color: #D3D5D8 !important
                    margin-right: 2px
                    margin-top: 0px !important
                    width: 39px !important
                    color: black
                    border: solid thin rgba(0, 0, 0, 0.22)
                    cursor: none
                    pointer-events: none

                .zygosity
                    &.hom
                        background-color: rgba(165, 48, 48, 0.76) !important
                        color: white

                    &.homref
                        background-color: #5D809D !important
                        color: rgba(255, 255, 255, 1)

                    &.unknown
                        background-color: #b9edf3 !important

                    &.none
                        background-color: transparent !important
                        border: solid thin #5D809D !important
</style>

<template>
    <v-card class="px-0 mx-1 my-1" outlined>
        <v-container class="summary-card">
            <v-row no-gutters flat style="font-family: Quicksand">
                <v-col cols="12" sm="12" xl="4" style="font-size: 22px">
                    Variant Details
                </v-col>
                <v-col v-if="variant" cols="12" sm="12" xl="8">
                    <v-chip outlined
                            small
                            color="appColor"
                            style="margin-top: 4px"
                            @input="summaryCardVariantDeselect()">
                        <span style="padding-right: 10px; font-size: 16px; text-align:center;"
                              v-bind:class="{hide: geneName === ''}">{{geneName}}</span>
                        <span style="padding-top: 1px; font-size: 14px; padding-right: 4px">{{selectedVariantLocation}}</span>
                    </v-chip>
                </v-col>
            </v-row>
            <v-container fluid grid-list-md style="overflow-y: scroll !important; padding-top: 0">
                <v-row wrap>
                    <div id="getStartedBlock">
                        <span class="getStartedText">Click on a variant for details</span>
                    </div>
                    <feature-viz id="loaded-feature-viz" class="summary-viz"
                                 ref="summaryFeatureViz"
                                 :effect="effect"
                                 :impactText="impactText"
                                 :impactColor="impactColor"
                                 :type="variantType"
                                 :refAlt="variantRefAlt"
                                 :aaText="variantAaChange"
                                 :clinVarText="clinVarText"
                                 :clinVarColor="clinVarColor"
                                 :cosmicText="cosmicText"
                                 :revelText="revelText"
                                 :somaticText="somaticText"
                                 :variantSelected="variantSelected">
                    </feature-viz>
                    <allele-frequency-viz id="loaded-freq-viz" class="summary-viz" style="padding-top: 10px"
                                          ref="summaryFrequencyViz"
                                          :sampleIds="sampleIds"
                                          :selectedSamples="selectedSamples"
                                          :selectedVariant="variant"
                                          :sampleMap="sampleReadsMap"
                                          :d3="d3">
                    </allele-frequency-viz>
                    <v-container>
                        <v-row no-gutters class="summary-viz" style="min-height: 0; padding-top: 10px">
                            <v-col sm="6" class="field-label-header">Raw Bam Counts</v-col>
                            <v-col sm="4"></v-col>
                            <v-col sm="2" style="float: right">
                                <v-tooltip left>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn v-show="variantSelected"
                                               fab
                                               dark
                                               small
                                               color="secondary"
                                               class="mx-2"
                                               v-bind="attrs"
                                               v-on="on"
                                               @click="onIgvClick">
                                            <v-icon>clear_all</v-icon>
                                        </v-btn>
                                    </template>
                                    <span>Display IGV Pileup</span>
                                </v-tooltip>
                            </v-col>
                        </v-row>
                    </v-container>

                    <bar-feature-viz v-if="hasRnaSeq" id="rnaseq-bar-feature-viz" class="summary-viz"
                                     style="padding-top: 10px"
                                     ref="rnaSeqBarFeatureViz"
                                     :counts="rnaSeqCounts"
                                     :bamtype="'rnaSeq'"
                                     :d3="d3">
                    </bar-feature-viz>
                    <bar-feature-viz v-if="hasAtacSeq" id="atacseq-bar-feature-viz" class="summary-viz"
                                     style="padding-top: 10px"
                                     ref="atacSeqBarFeatureViz"
                                     :counts="atacSeqCounts"
                                     :selectedVariant="variant"
                                     :bamType="'atacSeq'"
                                     :d3="d3">
                    </bar-feature-viz>
                </v-row>
            </v-container>
        </v-container>
    </v-card>
</template>


<script>
    import FeatureViz from "./viz/FeatureViz.vue"
    import AlleleFrequencyViz from "./viz/AlleleFrequencyViz.vue"
    import BarFeatureViz from "./viz/BarFeatureViz.vue"

    export default {
        name: 'variant-summary-card',
        components: {
            FeatureViz,
            AlleleFrequencyViz,
            BarFeatureViz
        },
        props: {
            sampleIds: null,
            selectedSamples: null,  // NOTE: must be in same order as sampleIds
            variant: null,
            variantInfo: null,
            selectedGene: null,
            d3: null,
            $: null,
            cohortModel: null,
            hasRnaSeq: {
                type: Boolean,
                default: false
            },
            hasAtacSeq: {
                type: Boolean,
                default: false
            },
        },
        data() {
            return {
                cohortFieldsValid: true,
                coverageCounts: null,
                rnaSeqCounts: null,
                atacSeqCounts: null
            }
        },
        watch: {
            variant: function () {
                if (this.variant) {
                    //this.setCoverageCounts();

                    if (this.cohortModel.hasRnaSeqData) {
                        this.setRnaSeqCounts();
                    }
                    if (this.cohortModel.hasAtacSeqData) {
                        this.setAtacSeqCounts();
                    }
                } else {
                    this.$refs.coverageBarFeatureViz.clear();
                    if (this.cohortModel.hasRnaSeqData && this.$refs.rnaSeqBarFeatureViz) {
                        this.$refs.rnaSeqBarFeatureViz.clear();
                    }
                    if (this.cohortModel.hasAtacSeqData && this.$refs.atacSeqBarFeatureViz) {
                        this.$refs.atacSeqBarFeatureViz.clear();
                    }
                }
            }
        },
        computed: {
            sampleReadsMap: function () {
                // Get variant from each sample
                let map = {};
                if (this.cohortModel && this.variant) {
                    map = this.cohortModel.getMatchingVariants(this.variant.id);
                }
                return map;
            },
            effect: function () {
                if (this.variantInfo != null)
                    return this.variantInfo.vepConsequence;
                return "-";
            },
            impactText: function () {
                if (this.variant != null) {
                    return Object.keys(this.variant.highestImpactVep)[0].toLowerCase();
                }
                return "-";
            },
            impactColor: function () {
                if (this.variant != null) {
                    var impactLevel = Object.keys(this.variant.highestImpactVep)[0].toUpperCase();
                    return "impact_" + impactLevel;
                }
                return "";
            },
            variantType: function () {
                if (this.variant != null)
                    return this.variant.type;
                return "-";
            },
            variantRefAlt: function () {
                if (this.variant != null) {
                    return this.variant.ref + '->' + this.variant.alt;
                }
                return "-";
            },
            variantAaChange: function () {
                let aaChange = 'N/A';
                if (this.variant != null && this.variant.vepAminoAcids) {
                    let changeString = Object.values(this.variant.vepAminoAcids)[0];
                    if (changeString) {
                        let acids = changeString.split('/');
                        let expectAa = this.cohortModel.globalApp.convertAa(acids[0]);
                        let actualAa = this.cohortModel.globalApp.convertAa(acids[1]);
                        aaChange = expectAa + '->' + actualAa;
                    }
                }
                return aaChange;
            },
            clinVarText: function () {
                if (this.variantInfo != null && this.variantInfo.clinvarSig != null)
                    return this.variantInfo.clinvarSig;
                return "";
            },
            clinVarColor: function () {
                if (this.variant != null && this.variant.clinvar != null) {
                    var clazz = this.variant.clinvar;
                    return "colorby_" + clazz;
                }
                return "";
            },
            cosmicText: function () {
                if (this.variantInfo != null) {
                    return this.variantInfo.inCosmic ? 'Yes' : 'No';
                }
                return "";
            },
            revelText: function () {
                if (this.variantInfo != null) {
                    return this.variantInfo.revel;
                }
                return "";
            },
            somaticText: function () {
                if (this.variantInfo != null) {
                    return this.variantInfo.isInherited === true ? 'Inherited' : (this.variantInfo.isInherited === false ? 'Somatic' : 'Undet.');
                }
                return "";
            },
            geneName: function () {
                if (this.variant != null && this.selectedGene != null) {
                    return this.selectedGene;
                }
                return '';
            },
            selectedVariantLocation: function () {
                if (this.variant != null) {
                    let location = this.variant.chrom + ' ' + this.variant.start.toLocaleString() + ' - ' + this.variant.end.toLocaleString();
                    if (!location.startsWith('c')) {
                        location = 'chr' + location;
                    }
                    return location;
                }
                return '';
            },
            variantSelected: function () {
                let self = this;
                return self.variant != null;
            },
        },
        methods: {
            summaryCardVariantDeselect: function () {
                let self = this;
                self.$refs.summaryFrequencyViz.clear();
                self.$emit("summaryCardVariantDeselect");
            },
            hideGetStartedBanner: function () {
                this.$('#getStartedBlock').hide();
                this.$('.summary-viz').css({'filter': 'none', '-webkit-filter': 'none'});
                this.$('.summary-card').css({'filter': 'none', '-webkit-filter': 'none'});
            },
            updateSeqCharts: function (bamType) {
                if (bamType === this.cohortModel.globalApp.RNASEQ_TYPE) {
                    this.setRnaSeqCounts();
                } else if (bamType === this.cohortModel.globalApp.ATACSEQ_TYPE) {
                    this.setAtacSeqCounts();
                }
                //
                // else if (bamType === this.cohortModel.globalApp.COVERAGE_TYPE) {
                //     this.setCoverageCounts();
                // }
            },
            markSeqChartsLoading: function (bamType, isLoading) {
                if (bamType === this.cohortModel.globalApp.RNASEQ_TYPE) {
                    this.updateRnaSeqLoader(isLoading);
                } else if (bamType === this.cohortModel.globalApp.ATACSEQ_TYPE) {
                    this.updateAtacSeqLoader(isLoading);
                }

                // else if (bamType === this.cohortModel.globalApp.COVERAGE_TYPE) {
                //     this.updateCoverageLoader(isLoading);
                // }
            },
            setCoverageCounts: function () {
                // Get coverage counts from each sample
                let map = {};
                let countMap = {};
                if (this.cohortModel && this.variant) {
                    map = this.cohortModel.getMatchingVariants(this.variant.id);
                }

                let notFetched = 1;
                for (var feat in map) {
                    if (map[feat] && map[feat].readPtCov) {
                        notFetched &= map[feat].readPtCov < 0;
                        countMap[feat] = map[feat].readPtCov;
                    } else {
                        countMap[feat] = 0;
                    }
                }
                this.coverageCounts = countMap;

                // If we have marker values still here for our variant, signal to fetch reads from bam
                if (notFetched === 1) {
                    this.$emit('fetch-reads', this.cohortModel.globalApp.COVERAGE_TYPE);
                    this.$refs.coverageBarFeatureViz.clear();
                } else if (this.$refs.coverageBarFeatureViz) {
                    this.$refs.coverageBarFeatureViz.clear();
                    this.$refs.coverageBarFeatureViz.drawCharts(this.coverageCounts);
                }
            },
            setRnaSeqCounts: function () {
                // Get rnaseq counts from each sample
                let map = {};
                let countMap = {};
                if (this.cohortModel && this.cohortModel.hasRnaSeqData && this.variant) {
                    map = this.cohortModel.getMatchingVariants(this.variant.id);
                }

                let notFetched = 1;
                for (var feat in map) {
                    if (map[feat] && map[feat].rnaSeqPtCov) {
                        notFetched &= map[feat].rnaSeqPtCov < 0;
                        countMap[feat] = map[feat].rnaSeqPtCov;
                    } else {
                        countMap[feat] = 0;
                    }
                }
                this.rnaSeqCounts = countMap;

                // If we have marker values still here for our variant, signal to fetch reads from bam
                if (notFetched === 1) {
                    this.$emit('fetch-reads', this.cohortModel.globalApp.RNASEQ_TYPE);
                    this.$refs.rnaSeqBarFeatureViz.clear();
                } else if (this.$refs.rnaSeqBarFeatureViz) {
                    this.$refs.rnaSeqBarFeatureViz.clear();
                    this.$refs.rnaSeqBarFeatureViz.drawCharts(this.rnaSeqCounts);
                }
            },
            setAtacSeqCounts: function () {
                // Get atacseq counts from each sample
                let map = {};
                let countMap = {};

                if (this.cohortModel && this.cohortModel.hasAtacSeqData && this.variant) {
                    map = this.cohortModel.getMatchingVariants(this.variant.id);
                }
                let notFetched = 1;
                for (var feat in map) {
                    if (map[feat] && map[feat].atacSeqPtCov) {
                        notFetched &= map[feat].atacSeqPtCov < 0;
                        countMap[feat] = map[feat].atacSeqPtCov;
                    } else {
                        countMap[feat] = 0;
                    }
                }
                this.atacSeqCounts = countMap;

                // If we have marker values still here for our variant, signal to fetch reads from bam
                if (notFetched === 1) {
                    this.$emit('fetch-reads', this.cohortModel.globalApp.ATACSEQ_TYPE);
                    this.$refs.atacSeqBarFeatureViz.clear();
                } else if (this.$refs.atacSeqBarFeatureViz) {
                    this.$refs.atacSeqBarFeatureViz.clear();
                    this.$refs.atacSeqBarFeatureViz.drawCharts(this.atacSeqCounts);
                }
            },
            updateRnaSeqLoader: function (isLoading) {
                this.$refs.rnaSeqBarFeatureViz.setLoader(isLoading);
            },
            updateAtacSeqLoader: function (isLoading) {
                this.$refs.atacSeqBarFeatureViz.setLoader(isLoading);
            },
            updateCoverageLoader: function (isLoading) {
                this.$refs.coverageBarFeatureViz.setLoader(isLoading);
            },
            onIgvClick: function() {
                this.$emit('show-pileup');
            }
        },
        mounted: function () {
            this.$emit('summary-mounted');
            // this.setCoverageCounts();
            // if (this.cohortModel.hasRnaSeqData) {
            //     this.setRnaSeqCounts();
            // }
            // if (this.cohortModel.hasAtacSeqData) {
            //     this.setAtacSeqCounts();
            // }
        }
    }
</script>