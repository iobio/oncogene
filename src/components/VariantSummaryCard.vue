<!-- Component populated with variant details on selection.
     SJG updated May2018 -->

<style lang="sass">
    #getStartedBlock
        position: absolute
        width: 100%
        height: 100%
        top: 20%
        left: 50%
        transform: translate(-50%,-50%)
        -ms-transform: translate(-50%,-50%)
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
        padding-top: 15px
        font-family: Open Sans
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
        .summary-field-label
            color: #b4b3b3
            font-style: italic
            font-size: 12px
            padding-left: 2px
            text-align: right
        .field-label-header
            color: #7f7f7f
            font-style: italic
            padding-left: 6px
            text-align: right
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
    <v-container height="100%" class="summary-card">
        <v-flex xl9 offset-xl2 lg12>
            <div class='form-inline'>
                <div class='form-group'>
                    <v-chip v-if="variant" v-bind:style="{margin: 0}" small outlined
                            color="appColor"
                            @input="summaryCardVariantDeselect()">
                            <span style="padding-right: 10px; font-size: 14px; text-align:center;"
                                  v-bind:class="{hide: geneName === ''}">{{geneName}}</span>
                        <span style="padding-top: 1px; font-size: 12px; padding-right: 4px">{{selectedVariantLocation}}</span>
                    </v-chip>
                </div>
            </div>
        </v-flex>
        <v-container fluid grid-list-md style="overflow-y: scroll !important">
            <v-layout row wrap >
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
                <bar-feature-viz v-if="hasRnaSeq" id="rnaseq-bar-feature-viz" class="summary-viz" style="padding-top: 10px"
                                 ref="summaryBarFeatureViz"
                                 :counts="rnaSeqCounts"
                                 :bamtype="'rnaSeq'"
                                 :d3="d3">
                </bar-feature-viz>
                <bar-feature-viz v-if="hasAtacSeq" id="atacseq-bar-feature-viz" class="summary-viz" style="padding-top: 10px"
                                 ref="summaryBarFeatureViz"
                                 :counts="atacSeqCounts"
                                 :selectedVariant="variant"
                                 :bamType="'atacSeq'"
                                 :d3="d3">
                </bar-feature-viz>
            </v-layout>
        </v-container>
    </v-container>
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
                cohortFieldsValid: true
            }
        },
        computed: {
            sampleReadsMap: function() {
                // Get variant from each sample
                let map = {};
                if (this.cohortModel && this.variant) {
                    map = this.cohortModel.getMatchingVariants(this.variant.id);
                }
                return map;
            },
            rnaSeqCounts: function() {
                // Get rnaseq counts from each sample
                let map = {};
                if (this.cohortModel && this.cohortModel.hasRnaSeqData && this.variant) {
                    map = this.cohortModel.getMatchingVariants(this.variant.id);
                }
                for (var feat in map) {
                    map[feat] = map[feat].genernaSeqCoverage;
                }
                return map;
            },
            atacSeqCounts: function() {
                // Get atacseq counts from each sample
                let map = {};
                if (this.cohortModel && this.cohortModel.hasAtacSeqData && this.variant) {
                    map = this.cohortModel.getMatchingVariants(this.variant.id);
                }
                for (var feat in map) {
                    map[feat] = map[feat].geneatacSeqCoverage;
                }
                return map;
            },
            effect: function () {
                if (this.variantInfo != null)
                    return this.variantInfo.vepConsequence;
                return "-";
            },
            impactText: function () {
                if (this.variantInfo != null) {
                    return this.variantInfo.vepImpact;
                }
                return "-";
            },
            impactColor: function () {
                if (this.variantInfo != null && this.variant.vepImpact != null) {
                    var impactLevel = this.variantInfo.vepImpact.toUpperCase();
                    return "impact_" + impactLevel;
                }
                return "";
            },
            variantType: function () {
                if (this.variant != null)
                    return this.variant.type;
                return "-";
            },
            variantRefAlt: function() {
                if (this.variant != null) {
                    return this.variant.ref + '->' + this.variant.alt;
                }
                return "-";
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
            cosmicText: function() {
                if (this.variantInfo != null) {
                    return this.variantInfo.inCosmic ? 'Yes' : 'No';
                }
                return "";
            },
            revelText: function() {
                if (this.variantInfo != null) {
                    return this.variantInfo.revel;
                }
                return "";
            },
            somaticText: function() {
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
            }
        },
        methods: {
            summaryCardVariantDeselect: function () {
                let self = this;
                self.$refs.summaryFrequencyViz.clear();
                self.$emit("summaryCardVariantDeselect");
            },
            hideGetStartedBanner: function() {
                this.$('#getStartedBlock').hide();
                this.$('.summary-viz').css({'filter': 'none', '-webkit-filter': 'none'});
            }
        },
        mounted: function() {
            this.$emit('summary-mounted');
        }
    }
</script>