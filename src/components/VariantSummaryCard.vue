<!-- Component populated with variant details on selection.
     SJG updated May2018 -->

<style lang="sass">
#raw-bam-dialog
  font-family: Quicksand

  .raw-bam-headline
    font-size: 20px
    background-color: #7f1010
    color: white

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
  top: 55%
  font-family: Poppins
  font-size: 22px
  background-color: $app-color
  text-align: center
  color: white


.summary-card
  height: 100%

.summary-field-label
  color: #b4b3b3
  font-style: italic
  font-size: 12px
  padding-left: 2px
  text-align: left

.summary-viz
  min-height: 20px
  max-height: 600px
  padding-top: 5px
  padding-bottom: 0
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
  <v-card class="px-0 mx-1 my-1" flat>
    <v-expansion-panels v-model="openState" style="width: 100%" multiple>
      <v-expansion-panel id="variant-card" :key="0">
        <v-expansion-panel-header class="pt-2 pb-1 pl-2 pr-2" style="min-height: 50px">
          <v-container class="summary-card">
            <v-row no-gutters flat style="font-family: Quicksand">
              <v-col cols="12" style="font-size: 22px">
                Variant Details
              </v-col>
            </v-row>
          </v-container>
        </v-expansion-panel-header>
        <v-expansion-panel-content :value="openState">
          <v-container class="summary-card" style="padding-top: 0">
            <div id="getStartedBlock">
              <span class="getStartedText">Click on a variant for details</span>
            </div>
            <v-container fluid grid-list-md style="overflow-y: scroll !important; padding-top: 0">
              <v-row wrap>
                <v-container class="summary-viz">
                  <v-row dense>
                    <v-col md="3" class="summary-field-label">Gene:</v-col>
                    <v-col md="9" class="summary-field-value">
                      <span>{{ geneName }}</span>
                    </v-col>
                    <v-col md="3" class="summary-field-label">Transcript:</v-col>
                    <v-col md=9 class="summary-field-value">
                      <span v-if="variantSelected">
                          {{ selectedTranscript.transcript_id }}
                      </span>
                      <v-chip v-if="variantSelected && !selectedTranscript.isCanonical" x-small class="ml-1" color="#eed202">Non-Canonical</v-chip>
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col md="3" class="summary-field-label">Position:</v-col>
                    <v-col md="9" class="summary-field-value">
                      <span>{{ selectedVariantLocation }}</span>
                    </v-col>
                  </v-row>
                </v-container>
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
                             :cosmicLink="cosmicLink"
                             :revelText="revelText"
                             :somaticText="somaticText"
                             :variantSelected="variantSelected"
                             :chrom="variant ? variant.chrom : ''"
                             :cnvInfo="cnvInfo">
                </feature-viz>
                <allele-frequency-viz id="loaded-freq-viz" class="summary-viz" style="padding-top: 10px"
                                      ref="summaryFrequencyViz"
                                      :sampleIds="sampleIds"
                                      :selectedSamples="selectedSamples"
                                      :selectedVariant="variant"
                                      :sampleMap="sampleReadsMap"
                                      :d3="d3">
                </allele-frequency-viz>
                <v-container v-if="hasCoverageData">
                  <v-row no-gutters class="summary-viz">
                    <v-col sm="7" class="field-label-header">
                      Raw Read Counts
                      <v-dialog v-model="rawBamDialog" persistent max-width="500px">
                        <template v-slot:activator="{ on, attrs }">
                          <v-btn v-if="hasAtacSeq || hasRnaSeq"
                                 x-small
                                 text
                                 fab
                                 color="transparent"
                                 v-bind="attrs"
                                 v-on="on">
                            <v-icon small color="secondary" class="pb-1">
                              info_outline
                            </v-icon>
                          </v-btn>
                        </template>
                        <v-card id="raw-bam-dialog">
                          <v-card-title class="raw-bam-headline">
                            <span>Raw Read Counts</span>
                          </v-card-title>
                          <v-card-text class="pt-3">
                            <div>
                              Raw counts are sourced from the provided bam files to populate the displayed
                              bar charts for RNA-Seq. The counts covering a specific location may differ slightly from
                              those in 'Alternate Allele Frequencies', as they are filtered based on mapping quality
                              (MAPQ).
                              Advanced users may change the filtering criteria below, and only reads with MAPQ values
                              greater
                              than or equal to the provided number will be included in the bar chart counts.
                            </div>
                            <v-container>
                              <v-row>
                                <v-col cols="4"></v-col>
                                <v-col cols="4">
                                  <v-text-field class="quality-input"
                                                v-model="qualityCutoff"
                                                dense
                                                single-line
                                                :rules="[rules.numericRule]"
                                                persistent-hint
                                  ></v-text-field>
                                </v-col>
                                <v-col cols="4"></v-col>
                              </v-row>
                            </v-container>
                          </v-card-text>
                          <v-card-actions class="px-3">
                            <v-spacer></v-spacer>
                            <v-btn @click="rawBamDialog = false">Close</v-btn>
                            <v-btn :disabled="!validQualityCutoff" color="secondary" @click="updateBamReadQuality">Save
                            </v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-dialog>
                    </v-col>
                    <v-col sm="3"></v-col>
                    <v-col sm="2" style="float: right">
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                          <v-btn v-show="variantSelected"
                                 fab
                                 dark
                                 small
                                 elevation="3"
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
                                 :bamType="'rnaSeq'"
                                 :d3="d3">
                </bar-feature-viz>
                <!--                    <bar-feature-viz v-if="hasAtacSeq" id="atacseq-bar-feature-viz" class="summary-viz"-->
                <!--                                     style="padding-top: 10px"-->
                <!--                                     ref="atacSeqBarFeatureViz"-->
                <!--                                     :counts="atacSeqCounts"-->
                <!--                                     :selectedVariant="variant"-->
                <!--                                     :bamType="'atacSeq'"-->
                <!--                                     :d3="d3">-->
                <!--                    </bar-feature-viz>-->
              </v-row>
            </v-container>
          </v-container>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
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
    BarFeatureViz,
  },
  props: {
    sampleIds: null,
    selectedSamples: null,  // NOTE: must be in same order as sampleIds
    variant: null,
    variantInfo: null,
    selectedGene: null,
    selectedTranscript: null,
    d3: null,
    $: null,
    cohortModel: null,
    hasCoverageData: {
      type: Boolean,
      default: false
    },
    hasCnvData: {
      type: Boolean,
      default: false
    },
    hasRnaSeq: {
      type: Boolean,
      default: false
    },
    hasAtacSeq: {
      type: Boolean,
      default: false
    },
    useVEP: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      cohortFieldsValid: true,
      coverageCounts: null,
      cnvInfo: null,
      rnaSeqCounts: null,
      atacSeqCounts: null,
      rawBamDialog: false,
      rules: {
        numericRule: value => (!isNaN(value)) && parseInt(value) >= 0 || 'Must be a positive integer',
      },
      qualityCutoff: 10,
      openState: [0]
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
        // this.$refs.coverageBarFeatureViz.clear();
        if (this.cohortModel.hasRnaSeqData && this.$refs.rnaSeqBarFeatureViz) {
          this.$refs.rnaSeqBarFeatureViz.clear();
        }
        if (this.cohortModel.hasAtacSeqData && this.$refs.atacSeqBarFeatureViz) {
          this.$refs.atacSeqBarFeatureViz.clear();
        }
      }
    },
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
        if (this.useVEP) {
          return this.variantInfo.vepConsequence;
        } else {
          return this.variantInfo.bcsqConsequence ? this.variantInfo.bcsqConsequence : 'none for transcript';
        }
      return "-";
    },
    impactText: function () {
      if (this.variant != null && this.variantInfo != null) {
        if (this.useVEP) {
          return Object.keys(this.variant.highestImpactVep)[0].toLowerCase();
        } else {
          return this.variantInfo.bcsqImpact ? this.variantInfo.bcsqImpact.toLowerCase() : 'none for transcript';
        }
      }
      return "-";
    },
    impactColor: function () {
      if (this.variant != null) {
        if (this.useVEP) {
          let impactLevel = Object.keys(this.variant.highestImpactVep)[0].toUpperCase();
          return "impact_" + impactLevel;
        } else {
          let impactLevel = this.variantInfo.bcsqImpact ? this.variantInfo.bcsqImpact.toUpperCase() : '';
          impactLevel = impactLevel !== "" ? impactLevel : 'none';
          return "impact_" + impactLevel;
        }
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
      let aaChange = '-';
      if (this.variant != null) {
        aaChange = 'N/A';

        if (this.useVEP && this.variant.vepAminoAcids) {
          let changeString = Object.values(this.variant.vepAminoAcids)[0];
          if (changeString) {
            let acids = changeString.split('/');
            let expectAa = this.cohortModel.globalApp.convertAa(acids[0]);
            let actualAa = null;
            if (acids[1]) {
              actualAa = this.cohortModel.globalApp.convertAa(acids[1]);
            } else {
              // For synonymous variants, we don't have a second AA in the array
              actualAa = this.cohortModel.globalApp.convertAa(acids[0]);
            }
            let posDelim = this.variant.vepAminoAcids['position'] ? this.variant.vepAminoAcids['position'] : '->';
            aaChange = expectAa + posDelim + actualAa;
          }
        } else if (this.variantInfo.bcsqAAChange) {
          // todo: split this into formatted string
          return this.variantInfo.bcsqAAChange;
        }
      }
      return aaChange;
    },
    clinVarText: function () {
      if (this.variantInfo != null) {
        if (this.variantInfo.clinvarSig === '' || this.variantInfo.clinvarSig === 'not provided') {
          return 'not present';
        } else {
          return this.variantInfo.clinvarSig;
        }
      } else {
        return "";
      }
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
        return this.variantInfo.inCosmic ? 'present' : 'not present';
      }
      return "";
    },
    cosmicLink: function () {
      // if it's in dictionary and has value besides true, it's the cosmic ID we need for link
      if (this.variantInfo != null && this.variantInfo.inCosmic) {
        return this.variantInfo.cosmicUrl;
      }
      return null;
    },
    revelText: function () {
      if (this.variantInfo != null) {
        return this.variantInfo.revel;
      }
      return "";
    },
    somaticText: function () {
      if (this.variantInfo != null) {
        return this.variantInfo.isInherited === true ? 'Inherited' : (this.variantInfo.isInherited === false ? 'somatic' : 'undet.');
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
    validQualityCutoff: function () {
      return (!isNaN(this.qualityCutoff)) && parseInt(this.qualityCutoff) >= 0
    },
    smallScreen: function () {
      return this.$vuetify.breakpoint.width < 1750;
    }
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
      // todo: fix this
      // Get coverage counts from each sample
      // let map = {};
      // let countMap = {};
      // if (this.cohortModel && this.variant) {
      //     map = this.cohortModel.getMatchingVariants(this.variant.id);
      // }

      // let notFetched = 1;
      // for (var feat in map) {
      //     if (map[feat] && map[feat].readPtCov >= 0) {
      //         notFetched &= map[feat].readPtCov < 0;
      //         countMap[feat] = map[feat].readPtCov;
      //     }
      // }
      // this.coverageCounts = countMap;

      // If we have marker values still here for our variant, signal to fetch reads from bam
      // if (notFetched === 1) {
      this.$emit('fetch-reads', this.cohortModel.globalApp.COVERAGE_TYPE);
      this.$refs.coverageBarFeatureViz.clear();
      // } else if (this.$refs.coverageBarFeatureViz) {
      //     this.$refs.coverageBarFeatureViz.clear();
      //     this.$refs.coverageBarFeatureViz.drawCharts(this.coverageCounts);
      // }
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
        if (map[feat]) {
          notFetched &= map[feat].rnaSeqPtCov < 0;
          countMap[feat] = map[feat].rnaSeqPtCov;
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
        if (map[feat]) {
          notFetched &= map[feat].atacSeqPtCov < 0;
          countMap[feat] = map[feat].atacSeqPtCov;
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
    setCnvInfo: function (sampleModelId, variant) {
      if (sampleModelId) {
        this.cnvInfo = this.cohortModel.getCnvInfo(sampleModelId, {
          chr: variant.chrom,
          start: variant.start,
          end: variant.end
        });
      } else {
        this.cnvInfo = null;
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
    onIgvClick: function () {
      this.$emit('show-pileup');
    },
    updateBamReadQuality: function () {
      if (this.cohortModel.rawBamReadsQualityCutoff !== this.qualityCutoff) {
        this.cohortModel.rawBamReadsQualityCutoff = this.qualityCutoff;
        if (this.hasRnaSeq || this.hasAtacSeq)
          this.$emit('clear-and-fetch-reads', this.cohortModel.globalApp.RNASEQ_TYPE);
      }
      this.rawBamDialog = false;
    }
  },
  mounted: function () {
    this.$emit('summary-mounted');
  }
}
</script>