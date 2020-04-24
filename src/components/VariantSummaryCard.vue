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
                    <v-chip v-bind:class="{hide: variant == null}" v-bind:style="{margin: 0}" small outline
                            color="cohortDarkBlue"
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
                             :siftText="siftText"
                             :siftColor="siftColor"
                             :polyPhenText="polyPhenText"
                             :polyPhenColor="polyPhenColor"
                             :revelText="revelText"
                             :foldEnrichmentInfo="foldEnrichmentInfo"
                             :pValueInfo="pValueInfo"
                             :log10pValueInfo="log10pValueInfo"
                             :variantSelected="variantSelected">
                </feature-viz>
                <allele-frequency-viz id="loaded-freq-viz" class="summary-viz" style="padding-top: 10px"
                                      ref="summaryFrequencyViz"
                                      :selectedVariant="variant"
                                      :oneKGenomes="oneKGenomes"
                                      :gnomad="gnomad"
                                      :exAc="exAc"
                                      :totalProbandAlleleCount="totalProbandAlleleCount"
                                      :totalSubsetAlleleCount="totalSubsetAlleleCount"
                                      :affectedProbandAlleleCount="affectedProbandAlleleCount"
                                      :affectedSubsetAlleleCount="affectedSubsetAlleleCount">
                </allele-frequency-viz>
                <bar-feature-viz id="loaded-bar-feature-viz" class="summary-viz" style="padding-top: 10px"
                                 ref="summaryBarFeatureViz"
                                 :selectedVariant="variant"
                                 :probandZygMap="probandZygMap"
                                 :subsetZygMap="subsetZygMap"
                                 :affectedProbandCount="affectedProbandCount"
                                 :affectedSubsetCount="affectedSubsetCount"
                                 :totalProbandCount="totalProbandCount"
                                 :totalSubsetCount="totalSubsetCount"
                                 @zyg-bars-mounted="zygBarsMounted">
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
            variant: null,
            variantInfo: null,
            selectedGene: null,
            $: null
        },
        data() {
            return {
                cohortFieldsValid: true
            }
        },
        computed: {
            // NOTE: the following counts are number of SAMPLES not ALLELES
            totalProbandCount: function () {
                if (!this.cohortFieldsValid) {
                    return -1;
                } else if (this.variant != null)
                    return this.variant.totalProbandCount;
                return 0;
            },
            totalSubsetCount: function () {
                if (!this.cohortFieldsValid) {
                    return -1;
                } else if (this.variant != null)
                    return this.variant.totalSubsetCount;
                return 0;
            },
            affectedProbandCount: function () {
                if (this.variant != null)
                    return this.variant.affectedProbandCount;
                return 0;
            },
            affectedSubsetCount: function () {
                if (this.variant != null)
                    return this.variant.affectedSubsetCount;
                return 0;
            },
            //NOTE: the following counts are number of ALLELES not SAMPLES
            totalProbandAlleleCount: function() {
                if (this.variant != null && this.variant.probandZygCounts.length === 0)
                    return -1;
                else if (this.variant != null)
                    return (this.variant.probandZygCounts[0] * 2 + this.variant.probandZygCounts[1] * 2 + this.variant.probandZygCounts[2] * 2);
                return 0;
            },
            affectedProbandAlleleCount: function() {
                if (this.variant != null)
                    return (this.variant.probandZygCounts[1] + this.variant.probandZygCounts[2] * 2);
                return 0;
            },
            totalSubsetAlleleCount: function() {
                if (this.variant != null && this.variant.subsetZygCounts.length === 0)
                    return -1;
                else if (this.variant != null)
                    return (this.variant.subsetZygCounts[0] * 2 + this.variant.subsetZygCounts[1] * 2 + this.variant.subsetZygCounts[2] * 2);
                return 0;
            },
            affectedSubsetAlleleCount: function() {
                if (this.variant != null)
                    return (this.variant.subsetZygCounts[1] + this.variant.subsetZygCounts[2] * 2);
                return 0;
            },
            subsetDelta: function () {
                if (this.variant != null) {
                    let delta = this.variant.subsetDelta;
                    let roundedDelta = Math.round(this.variant.subsetDelta * 10) / 10;
                    if (delta <= 1.0)
                        return delta;
                    else
                        return roundedDelta;
                }
                return 1;
            },
            foldEnrichmentInfo: function () {
                // NOTE: not displaying for now
                if (this.variant != null) {
                    let delta = this.variant.subsetDelta;
                    let adjDelta = this.variant.subsetDelta;
                    if (delta < 1 && delta > 0) {
                        adjDelta = 1 / delta;
                    }
                    let foldEnrich = Math.round(adjDelta * 10) / 10;
                    if (!this.cohortFieldsValid) {
                        return "N/A";
                    }
                    else if (delta > 1) return (foldEnrich + "x" + " IN SUBSETS");
                    else if (delta < 1) return (foldEnrich + "x" + " IN PROBANDS");
                    else if (this.variant.totalSubsetCount > 0) return ("EQUAL FREQUENCY");
                    else return "PROBANDS ONLY";
                }
                return "-";
            },
            pValueInfo: function () {
                if (this.variant != null && !this.blacklistStatus) {
                    if (!this.cohortFieldsValid) {
                        return "N/A";
                    } else {
                        if (+this.variant.pVal === 1) {
                            return '1';
                        } else {
                            let pValText = (+this.variant.pVal) * 100 / 100;
                            return '' + pValText;
                        }
                    }
                }
                return "-";
            },
            log10pValueInfo: function () {
                if (this.variant != null && !this.blacklistStatus) {
                    if (!this.cohortFieldsValid) {
                        return "N/A";
                    } else {
                        return '' + ((+this.variant.adjustedLevel)).toFixed(2);
                    }
                }
                return "-";
            },
            enrichTextClass: function () {
                if (this.variant != null) {
                    if (this.variant.subsetDelta >= 2) return '.enrichment_subset_UP';
                    else if (this.variant.subsetDelta <= 0.5) return '.enrichment_subset_DOWN';
                }
                return "";
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
            siftText: function () {
                if (this.variantInfo != null)
                    return this.variantInfo.sift;
                return "";
            },
            siftColor: function () {
                if (this.variantInfo != null && this.variantInfo.sift != null) {
                    var clazz = this.variantInfo.sift.replace(" ", "_");
                    return "colorby_sift_" + clazz;
                }
                return "";
            },
            polyPhenText: function () {
                if (this.variantInfo != null)
                    return this.variantInfo.polyphen;
                return "";
            },
            polyPhenColor: function () {
                if (this.variantInfo != null) {
                    var phenText = this.variantInfo.polyphen;
                    phenText = phenText.replace(" ", "_");
                    return "colorby_polyphen_" + phenText;
                }
                return "";
            },
            revelText: function() {
                if (this.variantInfo != null) {
                    return this.variantInfo.revel;
                }
                return "";
            },
            oneKGenomes: function () {
                if (this.variant != null && this.variant.af1000G != null) {
                    if (this.variant.af1000G !== '.' && this.variant.af1000G !== '') {
                        return Math.round(this.variant.af1000G * 100) + "%";
                    }
                }
                return "-";
            },
            gnomad: function () {
                if (this.variant != null && this.variant.afgnomAD != null) {
                    if (this.variant.afgnomAD !== '.' && this.variant.afgnomAD !== '') {
                        return Math.round(this.variant.afgnomAD * 100) + "%";
                    }
                }
                return "-";
            },
            exAc: function () {
                if (this.variant != null && this.variant.afExAC != null) {
                    if (this.variant.afExAC !== '.' && this.variant.afExAC !== '') {
                        return Math.round(this.variant.afExAC * 100) + "%";
                    }
                }
                return "-";
            },
            probandZygMap: function () {
                let map = [];
                if (this.variant != null) {
                    let zygArr = this.variant.probandZygCounts;
                    map.push({label: "hom ref", value: zygArr[0]});
                    map.push({label: "het", value: zygArr[1]});
                    map.push({label: "hom alt", value: zygArr[2]});
                    map.push({label: "no call", value: zygArr[3]});
                }
                else {
                    map.push({label: "hom ref", value: 0});
                    map.push({label: "het", value: 0});
                    map.push({label: "hom alt", value: 0});
                    map.push({label: "no call", value: 0});
                }
                return map;
            },
            subsetZygMap: function () {
                let map = [];
                if (this.variant != null) {
                    let zygArr = this.variant.subsetZygCounts;
                    map.push({label: "hom ref", value: zygArr[0]});
                    map.push({label: "het", value: zygArr[1]});
                    map.push({label: "hom alt", value: zygArr[2]});
                    map.push({label: "no call", value: zygArr[3]});
                }
                else {
                    map.push({label: "hom ref", value: 0});
                    map.push({label: "het", value: 0});
                    map.push({label: "hom alt", value: 0});
                    map.push({label: "no call", value: 0});
                }
                return map;
            },
            statusMap: function () {
                var map = [];
                var affectedCount = 0, unaffectedCount = 0;
                if (this.variant != null && this.variant.genotypes != null) {
                    var gtObj = this.variant.genotypes;
                    for (var gt in gtObj) {
                        if (gtObj.hasOwnProperty(gt)) {
                            if (gtObj[gt].zygosity === 'HOM' || gtObj[gt].zygosity === 'HET')
                                affectedCount++;
                            else if (gtObj[gt].zygosity === 'HOMREF') {
                                unaffectedCount++;
                            }
                        }
                    }
                }
                map.push({label: "unaff", value: unaffectedCount});
                map.push({label: "aff", value: affectedCount});
                return map;
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
            assignBarChartValues: function (probandN, subsetN) {
                let self = this;
                if (self.$refs.summaryBarFeatureViz != null) {
                    self.$refs.summaryBarFeatureViz.drawCharts(probandN, subsetN);
                }
            },
            setCohortFieldsNotApplicable: function () {
                let self = this;
                self.cohortFieldsValid = false;
            },
            setCohortFieldsApplicable: function() {
                let self = this;
                self.cohortFieldsValid = true;
            },
            zygBarsMounted: function() {
                let self = this;
                self.$emit('zyg-bars-mounted');
            },
            hideGetStartedBanner: function() {
                this.$('#getStartedBlock').hide();
                this.$('.summary-viz').css({'filter': 'none', '-webkit-filter': 'none'});
            }
        }
    }
</script>