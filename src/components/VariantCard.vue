<style lang="sass">
    @import ../assets/sass/variables
    #bam-track
        margin-top: -5px

    .loader-label
        font-family: Quicksand
        color: #888888
        font-size: 16px
        padding-bottom: 2px

    #variant-card
        .sample
            font-size: 24px !important

        .variant-chip
            font-size: 12px
            margin-top: 0
            margin-left: 10px
            margin-right: 10px

        #sample-label
            max-width: 200px
            color: $text-color
            font-size: 22px
            padding-top: 5px
            font-family: 'Quicksand'
            &.known-variants
                min-width: 100px
                max-width: 100px
        #gene-viz, #gene-viz-zoom
            .axis
                padding-left: 0px
                padding-right: 0px
                margin-top: -10px
                margin-bottom: 0px
                padding-bottom: 0px
                text
                    font-size: 11px
                    fill: rgb(120, 120, 120)
                line, path
                    fill: none
                    stroke: lightgrey
                    shape-rendering: crispEdges
                    stroke-width: 1px
                &.x
                    .tick
                        line
                            transform: translateY(-14px)
                        text
                            transform: translateY(6px)
                    path
                        transform: translateY(-20px)
                        display: none
        .chart-label
            font-size: 11px

        #gene-viz-zoom
            .current
                outline: none
            .cds, .exon, .utr
                fill: rgba(159, 159, 159, 0.63)
                stroke: rgb(159, 159, 159)
        .badge
            background-color: white !important
            color: $text-color !important
            font-weight: normal

            &.called
                padding: 4px 7px
                vertical-align: top
                .badge__badge
                    background-color: $light-badge-color !important
            &.loaded
                padding: 4px 7px
                vertical-align: top
                .badge__badge
                    background-color: $light-badge-color !important
            &.coverage-problem
                padding: 3px 7px
                vertical-align: top
                .badge__badge
                    background-color: $coverage-problem-color !important
            &.tumor
                .badge__badge
                    padding: 0px
                    font-weight: bold
                    background-color: $app-color !important
            .badge__badge
                padding: 0px
                font-size: 11px
                font-weight: normal
                width: 24px
                top: -3px
        #known-variants-chart
            padding: 0px
            margin-top: 0px
            margin-bottom: 0px
            svg
                vertical-align: bottom
                .axis
                    text
                        font-size: 12px !important
                    &.axis--x
                        .tick
                            visibility: hidden
                .layer.benign
                    .stacked-element
                        fill: rgba(156, 194, 49, 1)
                        stroke: $text-color
                        stroke-width: .5px
                .layer.path
                    .stacked-element
                        fill: #ad494A
                        stroke: $text-color
                        stroke-width: .5px
                .layer.other
                    .stacked-element
                        fill: rgba(231, 186, 82, 1)
                        stroke: $text-color
                        stroke-width: .5px
                .layer.unknown
                    .stacked-element
                        fill: rgb(189, 189, 189)
                        stroke: $text-color
                        stroke-width: .5px
                .layer.low
                    .stacked-element
                        fill: $low-impact-color
                        stroke: $text-color
                        stroke-width: .5px
                .layer.modifier
                    .stacked-element
                        fill: $modifier-impact-color
                        stroke: $text-color
                        stroke-width: .5px
                .layer.moderate
                    .stacked-element
                        fill: $moderate-impact-color
                        stroke: $text-color
                        stroke-width: .5px
                .layer.high
                    .stacked-element
                        fill: $high-impact-color
                        stroke: $text-color
                        stroke-width: .5px


        .expansion-panel__header
            padding: 10px 10px !important
            pointer-events: none
            cursor: default
            i
                vertical-align: top
            .header__icon
                pointer-events: auto
                cursor: pointer

</style>

<template>
    <v-card outlined class="my-1">
        <v-expansion-panels v-model="openState" multiple>
            <v-expansion-panel class="app-card" id="variant-card" :key="0">
                <v-expansion-panel-header class="pt-2 pb-1" style="min-height: 50px">
                    <div>
                        <div class="text-center d-inline">
                            <v-avatar v-if="sampleModel.isCosmic" color="primary" size="28" class="mr-1 mb-1">
                                <span class="white--text">C</span>
                            </v-avatar>
                            <v-avatar v-else-if="sampleModel.isTumor" color="primary" size="28" class="mr-1 mb-1">
                                <span class="white--text" style="font-size: 18px">T</span>
                            </v-avatar>
                            <v-avatar v-else-if="!sampleModel.isTumor" color="primary" size="28" class="mr-1 mb-1">
                                <span class="white--text" style="font-size: 18px">N</span>
                            </v-avatar>
                        </div>
                        <div id="sample-label" class="d-inline">
                            {{ sampleLabel }}
                        </div>
                        <div class="text-center d-inline">
                            <v-chip v-if="annotationComplete && sampleModel.loadedVariants && showChip"
                                    small
                                    outlined
                                    color="appColor"
                                    class="mb-2 ml-2"
                                    style="font-size: 14px; font-family: 'Raleway'">
                                {{ sampleModel.loadedVariants.features.length + (sampleModel.loadedVariants.features.length !== 1 ? ' Variants' : ' Variant') }}
                            </v-chip>
                        </div>
                        <v-badge v-if="sampleModel.loadedVariants && coverageDangerRegions.length > 0"
                                 class="ml-4 mr-4 mt-1 coverage-problem">
                            <span slot="badge"> {{ coverageDangerRegions.length }} </span>
                            Exons with insufficient coverage
                        </v-badge>
                        <!--                    <known-variants-toolbar-->
                        <!--                            v-if="sampleModel.isCosmic"-->
                        <!--                            :id="sampleModel.id"-->
                        <!--                            :annotationType="'vep'"-->
                        <!--                            @variantsVizChange="onVariantsVizChange"-->
                        <!--                            @variantsFilterChange="onVariantsFilterChange"-->
                        <!--                    >-->
                        <!--                    </known-variants-toolbar>-->
                        <!--                    todo: add these <div class="text-center d-inline" style="float: right;" id="cnv-ideo"></div>-->
                        <!--                    <div class="text-center d-inline" style="float: right;" id="loh-ideo"></div>-->
                    </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content :value="openState">
                    <v-card outlined :style="{padding: '5px 10px'}" id="card-viz">
                        <!--                    <stacked-bar-chart-viz-->
                        <!--                            id="known-variants-chart"-->
                        <!--                            style="width:100%"-->
                        <!--                            v-if="(sampleModel.id === 'known-variants' && knownVariantsViz !== 'variants') || (sampleModel.id === 'cosmic-variants' && cosmicVariantsViz !== 'variants')"-->
                        <!--                            :data="sampleModel.variantHistoData"-->
                        <!--                            :width="width"-->
                        <!--                            :xStart="selectedGene.start"-->
                        <!--                            :xEnd="selectedGene.end"-->
                        <!--                            :regionStart="regionStart"-->
                        <!--                            :regionEnd="regionEnd"-->
                        <!--                            :categories="getCategories(sampleModel.id)"-->
                        <!--                            :d3="d3"-->
                        <!--                            :$="$"-->
                        <!--                    >-->
                        <!--                    </stacked-bar-chart-viz>-->
                        <div style="width:100%">
                            <div style="text-align: center; clear: both">
                                <div v-show="loadingVars" class="loader vcfloader"
                                     style="display: inline-block;padding-bottom:10px">
                                    <span class="loader-label">Analyzing variants</span>
                                    <img src="../assets/images/wheel.gif">
                                </div>
                                <div v-show="callingVars" class="loader fbloader"
                                     style="display: inline-block; padding-left: 20px; padding-bottom:10px">
                                    <span class="loader-label">Calling variants</span>
                                    <img src="../assets/images/wheel.gif">
                                </div>
                                <div v-show="loadingCov" class="loader covloader"
                                     style="display: inline-block; padding-left: 20px; padding-bottom:10px">
                                    <span class="loader-label">Analyzing gene coverage</span>
                                    <img src="../assets/images/wheel.gif">
                                </div>
                                <div v-show="loadingRnaSeq" class="loader covloader"
                                     style="display: inline-block; padding-left: 20px; padding-bottom:10px">
                                    <span class="loader-label">Analyzing RNA-Seq coverage</span>
                                    <img src="../assets/images/wheel.gif">
                                </div>
                                <div v-show="loadingAtacSeq" class="loader covloader"
                                     style="display: inline-block; padding-left: 20px; padding-bottom:10px">
                                    <span class="loader-label">Analyzing ATAC-Seq coverage</span>
                                    <img src="../assets/images/wheel.gif">
                                </div>
                            </div>
                        </div>

                        <div style="width:100%" id="viz-div">
                            <div class="chart-label"
                                 v-show="showVariantViz && sampleModel.loadedVariants && sampleModel.loadedVariants.features && sampleModel.id !== 'known-variants'"
                            >
                                all variants
                            </div>
                            <variant-viz id="loaded-variant-viz"
                                         ref="variantVizRef"
                                         v-show="showVariantViz"
                                         :modelId="sampleModel.getId()"
                                         :model="sampleModel"
                                         :regionStart="regionStart"
                                         :regionEnd="regionEnd"
                                         :annotationScheme="annotationScheme"
                                         :width="width"
                                         :margin="variantVizMargin"
                                         :variantHeight="variantSymbolHeight"
                                         :variantPadding="variantSymbolPadding"
                                         :showBrush="false"
                                         :showXAxis="true"
                                         :classifySymbolFunc="classifyVariantSymbolFunc"
                                         :isTumorTrack="sampleModel.isTumor"
                                         :isKnownOrCosmicTrack="isKnownOrCosmicTrack"
                                         :d3="d3"
                                         @variantClick="onVariantClick"
                                         @variantHover="onVariantHover"
                                         @variantHoverEnd="onVariantHoverEnd"
                                         @apply-active-filters="applyActiveFilters"
                                         @var-chart-rendered="onVarVizRendered">
                            </variant-viz>
                            <div class="chart-label"
                                 v-show="showCnvViz && sampleModel.cnvsInGene && sampleModel.cnvUrlEntered">
                                cnv
                            </div>
                            <cnv-viz id="cnv-viz"
                                     ref="cnvVizRef"
                                     v-show="showCnvViz"
                                     :model="sampleModel"
                                     :regionStart="regionStart"
                                     :regionEnd="regionEnd"
                                     :showTransition="true"
                                     :width="width"
                                     :margin="cnvVizMargin"
                                     :d3="d3">
                            </cnv-viz>
                            <div class="chart-label" v-show="showDepthViz && sampleModel.coverage && sampleModel.coverage.length > 1">
                                coverage
                            </div>
                            <div id="bam-track">
                                <depth-viz
                                        v-show="showDepthViz"
                                        ref="depthVizRef"
                                        :type="globalAppProp.COVERAGE_TYPE"
                                        :coverage="sampleModel.coverage"
                                        :coverageMedian="geneCoverageMedian"
                                        :coverageDangerRegions="coverageDangerRegions"
                                        :currentPoint="coveragePoint"
                                        :maxDepth="sampleModel.cohort.maxDepth"
                                        :regionStart="regionStart"
                                        :regionEnd="regionEnd"
                                        :width="width"
                                        :margin="depthVizMargin"
                                        :height="60"
                                        :showTooltip="false"
                                        :showXAxis="false"
                                        :regionGlyph="depthVizRegionGlyph"
                                        :d3="d3"
                                        :$="$"
                                        @region-selected="showExonTooltip"
                                >
                                </depth-viz>
                            </div>
                            <div class="chart-label" v-show="showDepthViz && sampleModel.rnaSeqCoverage && sampleModel.rnaSeqCoverage.length > 1">
                                rna-seq
                            </div>
                            <div id="rna-bam-track" v-show="sampleModel.rnaSeqUrlEntered">
                                <depth-viz
                                        v-show="showDepthViz"
                                        ref="depthVizRef"
                                        :type="globalAppProp.RNASEQ_TYPE"
                                        :coverage="sampleModel.rnaSeqCoverage"
                                        :coverageMedian="geneCoverageMedian"
                                        :coverageDangerRegions="coverageDangerRegions"
                                        :currentPoint="coveragePoint"
                                        :maxDepth="sampleModel.cohort.maxRnaSeqDepth"
                                        :regionStart="regionStart"
                                        :regionEnd="regionEnd"
                                        :width="width"
                                        :margin="depthVizMargin"
                                        :height="60"
                                        :showTooltip="false"
                                        :showXAxis="false"
                                        :regionGlyph="depthVizRegionGlyph"
                                        :d3="d3"
                                        :$="$"
                                        @region-selected="showExonTooltip"
                                >
                                </depth-viz>
                            </div>
                            <div class="chart-label" v-show="showDepthViz && sampleModel.atacSeqCoverage && sampleModel.atacSeqCoverage.length > 1">
                                atac-seq
                            </div>
                            <div id="atac-bam-track" v-show="sampleModel.atacSeqUrlEntered">
                                <depth-viz
                                        v-show="showDepthViz"
                                        ref="depthVizRef"
                                        :type="globalAppProp.ATACSEQ_TYPE"
                                        :coverage="sampleModel.atacSeqCoverage"
                                        :coverageMedian="geneCoverageMedian"
                                        :coverageDangerRegions="coverageDangerRegions"
                                        :currentPoint="coveragePoint"
                                        :maxDepth="sampleModel.cohort.maxAtacSeqDepth"
                                        :regionStart="regionStart"
                                        :regionEnd="regionEnd"
                                        :width="width"
                                        :margin="depthVizMargin"
                                        :height="60"
                                        :showTooltip="false"
                                        :showXAxis="false"
                                        :regionGlyph="depthVizRegionGlyph"
                                        :d3="d3"
                                        :$="$"
                                        @region-selected="showExonTooltip"
                                >
                                </depth-viz>
                            </div>
<!--                            <gene-viz id="gene-viz"-->
<!--                                      v-bind:class="{ hide: !showGeneViz }"-->
<!--                                      :data="[selectedTranscript]"-->
<!--                                      :margin="geneVizMargin"-->
<!--                                      :width="width"-->
<!--                                      :height="80"-->
<!--                                      :trackHeight="geneVizTrackHeight"-->
<!--                                      :cdsHeight="geneVizCdsHeight"-->
<!--                                      :regionStart="regionStart"-->
<!--                                      :regionEnd="regionEnd"-->
<!--                                      :showXAxis="geneVizShowXAxis"-->
<!--                                      :featureClass="getExonClass"-->
<!--                                      :isZoomTrack="false"-->
<!--                                      :$="$"-->
<!--                                      :d3="d3"-->
<!--                                      @feature-selected="showExonTooltip"-->
<!--                            >-->
<!--                            </gene-viz>-->
                        </div>
                    </v-card>
                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-card>
</template>

<script>
    import VariantViz from "./viz/VariantViz.vue"
    import DepthViz from "./viz/DepthViz.vue"
    import CnvViz from "./viz/CnvViz.vue"

    export default {
        name: 'variant-card',
        components: {
            VariantViz,
            CnvViz,
            DepthViz
        },
        props: {
            globalAppProp: null,  //For some reason, global mixin not working on variant card.  possible cause for-item?
            clearZoom: null,
            sampleModel: null,
            canonicalSampleIds: null,
            annotationScheme: null,
            classifyVariantSymbolFunc: null,
            hoverTooltip: null,
            clickTooltip: null,
            selectedGene: {},
            selectedTranscript: {},
            selectedVariant: null,
            regionStart: {
                type: Number,
                default: 0
            },
            regionEnd: {
                type: Number,
                default: 0
            },
            width: {
                type: Number,
                default: 0
            },
            // showVariantViz: {
            //     type: Boolean,
            //     default: true
            // },
            showGeneViz: {
                type: Boolean,
                default: true
            },
            // showDepthViz: {
            //     type: Boolean,
            //     default: true
            // },
            geneVizShowXAxis: {
                type: Boolean,
                default: false
            },
            annotationComplete: {
                type: Boolean,
                default: false
            },
            d3: null,
            $: null
        },
        data() {
            const self = this;
            return {
                margin: {
                    top:  20,
                    right:  2,
                    bottom: 18,
                    left:  4
                },
                variantVizMargin: {
                    top: 0,
                    right: 2,
                    bottom: 5,
                    left: 4
                },
                variantSymbolHeight: 12,
                variantSymbolPadding: 4,
                geneVizMargin: {
                    top: 0,
                    right: 2,
                    bottom: self.geneVizShowXAxis ? 18 : 0,
                    left: 4
                },
                geneVizTrackHeight: 16,
                geneVizCdsHeight: 12,

                geneZoomVizMargin: {
                    top: 10,
                    right: 2,
                    bottom: 10,
                    left: 4
                },
                cnvVizMargin: {
                    top: 0,
                    right: 2,
                    bottom: 10,
                    left: 4
                },
                depthVizMargin: {
                    top: 22,
                    right: 2,
                    bottom: 0,
                    left: 4
                },
                depthVizYTickFormatFunc: null,
                coveragePoint: null,
                id: null,
                selectedExon: null,
                knownVariantsViz: null,
                cosmicVariantsViz: null,
                openState: [0],      // Array which controls expansion panel open/close - want open on load
                numFilteredVariants: 0,
                loadingVars: false,
                callingVars: false,
                loadingCov: false,
                loadingRnaSeq: false,
                loadingAtacSeq: false,
                showChip: false,
                showVariantViz: true,
                showCnvViz: true,
                showDepthViz: true
            }
        },
        methods: {
            onVarVizRendered: function(trackDisplayed) {
                this.showChip = trackDisplayed;
                this.loadingVars = !trackDisplayed;
            },
            depthVizYTickFormat: function (val) {
                if (val === 0) {
                    return "";
                } else {
                    return val + "x";
                }
            },
            // TODO: this is where we hook in to displaying low coverage for somatic vars w/ 0 coverage in normal
            depthVizRegionGlyph: function (exon, regionGroup, regionX) {
                let exonId = 'exon' + exon.exon_number.replace("/", "-");
                if (regionGroup.select("g#" + exonId).empty()) {
                    regionGroup.append('g')
                        .attr("id", exonId)
                        .attr('class', 'region-glyph coverage-problem-glyph')
                        .attr('transform', 'translate(' + (regionX - 12) + ',-16)')
                        .data([exon])
                        .append('use')
                        .attr('height', '22')
                        .attr('width', '22')
                        .attr('href', '#long-arrow-down-symbol')
                        .attr('xlink', 'http://www.w3.org/1999/xlink')
                        .data([exon]);
                }
            },
            onVariantClick: function (variant) {
                if (this.showDepthViz) {
                    if (variant) {
                        this.showCoverageCircle(variant);
                    }
                }
                if (this.showVariantViz) {
                    if (variant) {
                        this.hideVariantCircle(true);
                        this.showVariantCircle(variant, true);
                    }
                }
                this.$emit('cohort-variant-click', variant, this, this.sampleModel.id);
            },
            onVariantHover: function (variant) {
                if (this.showDepthViz) {
                    this.showCoverageCircle(variant);
                }
                if (this.showVariantViz) {
                    this.showVariantCircle(variant, false);

                    //const tipType = "hover";
                    //this.showVariantTooltip(variant, tipType, false);
                }
                this.$emit('cohort-variant-hover', variant, this);
            },
            onVariantHoverEnd: function () {
                if (this.showDepthViz) {
                    this.hideCoverageCircle();
                }
                if (this.showVariantViz) {
                    this.hideVariantCircle(false);
                    const tipType = "hover";
                    this.hideVariantTooltip(tipType);
                }
                this.$emit('cohort-variant-hover-end');
            },
            showVariantTooltip: function (variant, tipType, lock) {
                const self = this;

                let tooltip = self.d3.select("#main-tooltip");
                let tooltipObj = self.hoverTooltip;
                if (tipType === "click") {
                    tooltip = self.d3.select("#click-tooltip");
                    tooltipObj = self.clickTooltip;
                }

                let x = variant.screenX;
                let y = variant.screenY;
                let coord = {
                    'x': x,
                    'y': y,
                    'height': 33,
                    'parentWidth': self.$el.offsetWidth,
                    'preferredPositions': [{top: ['center', 'right', 'left']},
                        {bottom: ['center', 'right', 'left']},
                        {right: ['middle', 'top', 'bottom']},
                        {left: ['middle', 'top', 'bottom']}]
                };

                // If we're displaying a tooltip for a canonical track, want to get variant from THIS track to show correct AF
                // (the sent in variant is from the s0 track)
                let trackVariant = variant;
                if (tipType === 'click' && self.canonicalSampleIds && self.canonicalSampleIds.indexOf(self.sampleModel.id) >= 0) {
                    let matchingFeat = null;
                    if (self.sampleModel.vcfData && self.sampleModel.features) {
                        matchingFeat = self.sampleModel.vcfData.features.filter((feat) => {
                            return feat.id === variant.id;
                        })
                    }
                    if (matchingFeat) {
                        trackVariant = matchingFeat;
                    }
                }
                tooltipObj.fillAndPositionTooltip(tooltip,
                    trackVariant,
                    self.selectedGene,
                    self.selectedTranscript,
                    lock,
                    coord,
                    self.sampleModel.id,
                    self.sampleModel.getAffectedInfo(),
                    self.sampleModel.cohort.mode,
                    self.sampleModel.cohort.maxAlleleCount);
            },
            tooltipScroll(direction) {
                this.hoverTooltip.scroll(direction, "#main-tooltip");
                this.clickTooltip.scroll(direction, "#click-tooltip");
            },
            hideVariantTooltip: function (tipType) {
                let hoverTooltip = this.d3.select("#main-tooltip");
                let clickTooltip = this.d3.select("#click-tooltip");

                // If we haven't specified a type, hide them both
                if (tipType == null) {
                    hoverTooltip.transition()
                        .duration(500)
                        .style("opacity", 0)
                        .style("z-index", 0)
                        .style("pointer-events", "none");

                    clickTooltip.transition()
                        .duration(500)
                        .style("opacity", 0)
                        .style("z-index", 0)
                        .style("pointer-events", "none");
                } else if (tipType === "click") {
                    clickTooltip.transition()
                        .duration(500)
                        .style("opacity", 0)
                        .style("z-index", 0)
                        .style("pointer-events", "none");
                } else if (tipType === "hover") {
                    hoverTooltip.transition()
                        .duration(500)
                        .style("opacity", 0)
                        .style("z-index", 0)
                        .style("pointer-events", "none");
                }
            },
            showVariantCircle: function (variant, lock) {
                if (this.showVariantViz) {
                    let container = this.getVariantSVG();
                    this.getVariantViz(variant).showVariantCircle(variant, container, lock);
                }
            },
            hideVariantCircle: function (lock) {
                const self = this;
                if (self.showVariantViz) {
                    let container = this.getVariantSVG();
                    self.$refs.variantVizRef.hideVariantCircle(container, lock);
                }
            },
            getVariantViz: function (variant) {
                return variant.fbCalled && variant.fbCalled === 'Y'
                    ? this.$refs.calledVariantVizRef
                    : this.$refs.variantVizRef;
            },
            // Returns all loaded and called variant viz SVGs
            getVariantSVG: function () {
                return this.d3.select(this.$el).select('#card-viz').select('.variant-viz').select('svg');
                // return this.d3.select(this.$el).select('.expansion-panels').select('.expansion-panel__container').select('.expansion-panel__body').select('#card-viz').select('.variant-viz > svg');
            },
            getTrackSVG: function (vizTrackName) {
                return this.d3.select(this.$el).select('#' + vizTrackName + ' > svg');
            },
            hideCoverageCircle: function () {
                if (this.showDepthViz) {
                    this.$refs.depthVizRef.hideCurrentPoint();
                }
            },
            showCoverageCircle: function (variant) {
                let self = this;

                if (self.showDepthViz && self.sampleModel.coverage != null) {
                    let theDepth = null;
                    var matchingVariants = self.sampleModel.loadedVariants.features.filter(function (v) {
                        return v.start === variant.start && v.alt === variant.alt && v.ref === variant.ref;
                    });

                    if (matchingVariants.length > 0) {
                        theDepth = matchingVariants[0].bamDepth;
                        // If samtools mpileup didn't return coverage for this position, use the variant's depth
                        // field.
                        if (theDepth == null || theDepth === '') {
                            theDepth = matchingVariants[0].genotypeDepth;
                        }
                    }

                    // If we have the exact depth for this variant, show it.  Otherwise, we will show
                    // the calculated (binned, averaged) depth at this position.
                    self.$refs.depthVizRef.showCurrentPoint({pos: variant.start, depth: theDepth});
                }


            },
            onVariantsVizChange: function (viz, trackId) {
                this.$nextTick(() => {
                    this.openState = [0];
                });
                if (trackId === 'known-variants') {
                    this.knownVariantsViz = viz;
                } else if (trackId === 'cosmic-variants') {
                    this.cosmicVariantsViz = viz;
                }
                this.$emit("variants-viz-change", viz, trackId);
            },
            onVariantsFilterChange: function (selectedCategories, trackId) {
                this.$nextTick(() => {
                    this.openState = [0];
                });
                this.$emit("variants-filter-change", selectedCategories, trackId);
            },
            showFlaggedVariant: function (variant) {
                if (this.showVariantViz) {
                    this.getVariantViz(variant).showFlaggedVariant(variant, this.getTrackSVG(variant.sampleModelId));
                }
            },
            getExonClass: function (exon) {
                if (this.showDepthViz && exon.danger) {
                    return exon.feature_type.toLowerCase() + (exon.danger[this.sampleModel.id] ? " danger" : "");
                } else {
                    return exon.feature_type.toLowerCase();
                }
            },
            showExonTooltip: function (featureObject, feature, lock) {
                let self = this;
                let tooltip = self.d3.select("#exon-tooltip");

                if (featureObject == null) {
                    self.hideExonTooltip();
                    return;
                }
                if (self.selectedExon) {
                    return;
                }
                if (lock) {
                    self.selectedExon = feature;
                    tooltip.style("pointer-events", "all");
                    tooltip.classed("locked", true);
                } else {
                    tooltip.style("pointer-events", "none");
                    tooltip.classed("locked", false);
                }

                let coverageRow = function (fieldName, coverageVal, covFields) {
                    let row = '<div>';
                    row += '<span style="padding-left:10px;width:60px;display:inline-block">' + fieldName + '</span>';
                    row += '<span style="width:40px;display:inline-block">' + self.d3.round(coverageVal) + '</span>';
                    row += '<span class="' + (covFields[fieldName] ? 'danger' : '') + '">' + (covFields[fieldName] ? covFields[fieldName] : '') + '</span>';
                    row += "</div>";
                    return row;
                };

                let html = '<div>'
                    + '<span id="exon-tooltip-title"' + (lock ? 'style="margin-top:8px">' : '>') + (feature.hasOwnProperty("exon_number") ? "Exon " + feature.exon_number : "") + '</span>'
                    + (lock ? '<a href="javascript:void(0)" id="exon-tooltip-close">X</a>' : '')
                    + '</div>';
                html += '<div style="clear:both">' + feature.feature_type + ' ' + self.globalAppProp.utility.addCommas(feature.start) + ' - ' + self.globalAppProp.utility.addCommas(feature.end) + '</div>';

                if (feature.geneCoverage && feature.geneCoverage[self.sampleModel.getId()]) {
                    let covFields = self.sampleModel.cohort.filterModel.whichLowCoverage(feature.geneCoverage[self.sampleModel.getId()]);
                    html += "<div style='margin-top:4px'>" + "Coverage:"
                        + coverageRow('min', feature.geneCoverage[self.sampleModel.getId()].min, covFields)
                        + coverageRow('median', feature.geneCoverage[self.sampleModel.getId()].median, covFields)
                        + coverageRow('mean', feature.geneCoverage[self.sampleModel.getId()].mean, covFields)
                        + coverageRow('max', feature.geneCoverage[self.sampleModel.getId()].max, covFields)
                        + coverageRow('sd', feature.geneCoverage[self.sampleModel.getId()].sd, covFields)

                }
                if (lock) {
                    html += '<div style="text-align:right;margin-top:8px">'
                        + '<a href="javascript:void(0)" id="exon-tooltip-thresholds" class="danger" style="float:left"  >Set cutoffs</a>'
                        + '</div>'
                }
                tooltip.html(html);
                if (lock) {
                    tooltip.select("#exon-tooltip-thresholds").on("click", function () {
                        self.$emit("show-coverage-cutoffs");
                    });
                    tooltip.select("#exon-tooltip-close").on("click", function () {
                        self.selectedExon = null;
                        self.hideExonTooltip(true);
                    })
                }

                let coord = self.globalAppProp.utility.getTooltipCoordinates(featureObject.node(),
                    tooltip, self.$el.offsetWidth, self.$('nav.toolbar').outerHeight());
                tooltip.style("left", coord.x + "px")
                    .style("text-align", 'left')
                    .style("top", (coord.y - 60) + "px");

                tooltip.style("z-index", 1032);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
            },
            hideExonTooltip: function (force) {
                let self = this;
                let tooltip = self.d3.select("#exon-tooltip");
                if (force || !self.selectedExon) {
                    tooltip.classed("locked", false);
                    tooltip.classed("black-arrow-left", false);
                    tooltip.classed("black-arrow-right", false);
                    tooltip.style("pointer-events", "none");
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                }
            },
            updateVariantClasses: function() {
                const self = this;
                let container = self.getTrackSVG(self.sampleModel.id);
                if (self.$refs.variantVizRef) {
                    self.$refs.variantVizRef.updateVariantClasses(container);
                }
            },
            applyActiveFilters: function() {
                const self = this;
                let container = self.getTrackSVG(self.sampleModel.id);
                self.$refs.variantVizRef.applyActiveFilters(container);
            },
            // drawIdeograms: function() {
            //     // TODO: reformat this for our use
            //     let cnvConfig = {
            //         organism: 'human',
            //         container: '#cnv-ideo',
            //         chromosome: this.selectedGene.chr,
            //         chrHeight: 500,
            //         orientation: 'horizontal',
            //         annotations: [{
            //             name: this.selectedGene.gene_name,
            //             chr: this.selectedGene.chr, // TODO: what are field names here
            //             start: this.selectedGene.start,
            //             stop: this.selectedGene.end
            //         }]
            //     };
                // let cnvIdeogram = new Ideogram(cnvConfig);
                //
                // let lohConfig = {
                //     organism: 'human',
                //     container: '#loh-ideo',
                //     chromosome: this.ncbiSummary.chromosome,
                //     chrHeight: 500,
                //     orientation: 'horizontal',
                //     annotations: [{
                //         name: this.gene,
                //         chr: this.ncbiSummary.chromosome,
                //         start: this.ncbiSummary.genomicinfo[0].chrstart,
                //         stop: this.ncbiSummary.genomicinfo[0].chrstop
                //     }]
                // };
                // let lohIdeogram = newIdeogram(lohConfig);
            //},
            getCategories: function(sampleModelId) {
                if (sampleModelId === 'known-variants') {
                    return ['unknown', 'other', 'benign', 'path']
                } else if (sampleModelId === 'cosmic-variants') {
                    return ['other', 'low', 'modifier', 'moderate', 'high']
                }
            },
            toggleTracks: function(showTracks) {
                this.showVariantViz = showTracks;
                this.showCnvViz = showTracks;
                this.showDepthViz = showTracks;
            }
        },
        filters: {},
        computed: {
            sampleLabel: function () {
                let label = "";
                if (this.sampleModel.selectedSample) {
                    label += this.sampleModel.selectedSample.toUpperCase();
                } else if (this.sampleModel.isCosmic) {
                    label = 'Cosmic';
                }
                return label;
            },
            depthVizHeight: function () {
                return this.showDepthViz ? 0 : 60;
            },
            coverageDangerRegions: function () {
                let self = this;
                if (self.selectedTranscript && self.selectedTranscript.features) {
                    var regions = [];
                    self.selectedTranscript.features
                        .filter(function (feature) {
                            return feature.feature_type === 'CDS' || feature.feature_type === 'UTR';
                        })
                        .forEach(function (feature) {
                            if (feature.danger[self.sampleModel.getId()]) {
                                regions.push(feature)
                            }
                        });
                    return regions;
                } else {
                    return [];
                }
            },
            isKnownOrCosmicTrack: function () {
                let self = this;
                return self.sampleModel.id === 'known-variants' || self.sampleModel.id === 'cosmic-variants';
            },
            trackColor: function () {
                let self = this;

                let models = null;
                if (self.sampleModel.isTumor) {
                    models = self.sampleModel.getCohortModel().getOrderedTumorModels();
                } else {
                    models = self.sampleModel.getCohortModel().getOrderedNormalModel();
                }
                if (models) {
                    let orders = [];
                    models.forEach((model) => {
                        orders.push(model.order);
                    });
                    let colorIdx = orders.indexOf(self.sampleModel.order);
                    if (colorIdx >= 0) {
                        let color = self.sampleModel.getCohortModel().globalApp.utility.getTrackColor(colorIdx, self.sampleModel.isTumor);
                        return color;
                    } else {
                        return 'gray';
                    }
                } else {
                    return 'gray';
                }
            },
            displayVariantCount: function() {
                const self = this;
                let displayCts = false;
                if (self.sampleModel.id !== 'known-variants' && self.sampleModel.id !== 'cosmic-variants') {
                    displayCts = true;
                } else if (self.sampleModel.id === 'known-variants' && self.knownVariantsViz === 'variants') {
                    displayCts = true;
                } else if (self.sampleModel.id === 'cosmic-variants' && self.cosmicVariantsViz === 'variants') {
                    displayCts = true;
                }
                return displayCts;
            },
            geneCoverageMedian: function() {
                if (this.sampleModel && this.sampleModel.cohort && this.sampleModel.cohort.filterModel) {
                    return this.sampleModel.cohort.filterModel.geneCoverageMedian;
                }
                return null;
            }
        },
        watch: {
            'sampleModel.inProgress.loadingVariants': function() {
                // Only use this to turn on loader
                this.loadingVars = this.sampleModel.inProgress.loadingVariants;
            },
            'sampleModel.inProgress.callingVariants': function() {
                this.callingVars = this.sampleModel.inProgress.callingVariants;
            },
            'sampleModel.inProgress.coverageLoading': function() {
                this.loadingCov = this.sampleModel.inProgress.coverageLoading;
            },
            'sampleModel.inProgress.rnaSeqLoading': function() {
                this.loadingRnaSeq = this.sampleModel.inProgress.rnaSeqLoading;
            },
            'sampleModel.inProgress.atacSeqLoading': function() {
                this.loadingAtacSeq = this.sampleModel.inProgress.atacSeqLoading;
            },
            selectedGene: function() {
                this.showChip = false;
            }
        },
        mounted: function () {
            this.id = this.sampleModel.id;
        },
        created: function () {
            this.depthVizYTickFormatFunc = this.depthVizYTickFormat ? this.depthVizYTickFormat : null;
        }
    }
</script>
