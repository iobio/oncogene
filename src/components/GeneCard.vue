<style lang="sass">
    @import ../assets/sass/variables
    #gene-card
        font-family: Quicksand

        .header
            font-size: 22px
            padding-left: 12px

        .sub-header
            font-size: 16px
            padding-left: 5px

        .gene-name
            color: #7f1010
            font-size: 18px
            font-weight: 800

        .reverse
            font-size: 12px
            padding-left: 5px
            font-style: italic

        .region
            width: 100px
            text-align: right
            padding-left: 3px
            font-size: 14px

        .transcripts
            margin-left: 10px

        .zoom-switch
            pointer-events: auto
            cursor: auto
            label
                padding-left: 7px
                line-height: 18px
                font-size: 12px
                font-weight: bold
                padding-top: 2px
                color: $text-color
                width: 50px

        .gene-summary
            font-size: 13px
            margin-top: -50px
            max-height: 95px
            overflow-y: scroll

    #gene-track
        padding-left: 34px
        padding-right: 34px

</style>

<template>
    <v-card width="100%" id="gene-card">
        <v-container>
            <v-row no-gutters class="pt-2">
                <v-col cols="12" sm="8">
                    <span class="header">
                        Gene Details
                    </span>
                    <span v-if="selectedGene" class="ml-3 gene-name">
                        {{ selectedGene.gene_name }}
                    </span>
                    <span class="sub-header">
                        {{ selectedGene.chr }}
                    </span>
                    <span class="sub-header">
                        {{ formatRegion(selectedGene.startOrig) }} - {{ formatRegion(selectedGene.endOrig) }}
                    </span>
                    <v-text-field dense class="d-inline-flex region"
                                  prefix="+-"
                                  suffix="bp"
                                  label="Region Buffer"
                                  v-model="regionBuffer"
                                  v-on:change="onGeneRegionBufferChange">
                    </v-text-field>
                    <transcripts-menu
                            class="transcripts"
                            :selectedGene="selectedGene"
                            :selectedTranscript="selectedTranscript"
                            :geneSources="geneSources"
                            :geneModel="geneModel"
                            :d3="d3"
                            @transcriptSelected="onTranscriptSelected"
                            @gene-source-selected="onGeneSourceSelected">
                    </transcripts-menu>
<!--                    <v-spacer></v-spacer>-->
<!--                    <v-switch-->
<!--                            v-on:click.self.stop.prevent="toggleZoom"-->
<!--                            class="zoom-switch ml-1 d-infline-flex"-->
<!--                            label="Zoom"-->
<!--                            v-model="showZoom"-->
<!--                    >-->
<!--                    </v-switch>-->
                </v-col>
            </v-row>
            <v-row no-gutters>
                <v-col cols="12" sm="8">
                    <div id="gene-track">
                        <div :id="geneVizName" v-if="showGene">
                            <gene-viz id="gene-viz"
                                      ref="transcriptGeneVizRef"
                                      :data="[selectedTranscript]"
                                      :height="40"
                                      :margin="margin"
                                      :trackHeight="trackHeight"
                                      :cdsHeight="cdsHeight"
                                      :regionStart="geneRegionStart"
                                      :regionEnd="geneRegionEnd"
                                      :isZoomTrack="true"
                                      :zoomSwitchOn="showZoom"
                                      :d3="d3"
                                      :$="$"
                                      :displayOnly="true"
                                      @region-zoom="onRegionZoom"
                                      @region-zoom-reset="onRegionZoomReset">
                            </gene-viz>
                        </div>
                    </div>
                </v-col>
                <v-col cols="12" sm="4">
                    <div class="gene-summary">
                        {{ ncbiSummary ? ncbiSummary.summary : 'Unable to display gene summary' }}
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
    import GeneViz from './viz/GeneViz.vue'
    import TranscriptsMenu from './partials/TranscriptsMenu.vue'
    import Vue from 'vue'

    export default {
        name: 'gene-card',
        components: {
            GeneViz,
            TranscriptsMenu,
        },
        props: {
            selectedGene: {},
            selectedTranscript: {},
            geneRegionStart: null,
            geneRegionEnd: null,
            geneModel: null,
            d3: null,
            $: null
        },
        data() {
            return {
                margin: {
                    top: 20,
                    right: 0,
                    bottom: 18,
                    left: 0
                },
                trackHeight:  18,
                cdsHeight:  12,
                geneSource: null,
                geneSources: ['gencode', 'refseq'],
                noTranscriptsWarning: null,
                showNoTranscriptsWarning: false,
                geneRegionBuffer: null,
                phenotypes: null,
                phenotypeTerms: null,
                ncbiSummary: null,
                showZoom: false,
                zoomMessage: "Drag to zoom",
                geneVizName: 'transcript-panel',
                updateMatrix: false  // Used to control redraw of feature matrix when zoom status changes
            }
        },
        methods: {
            onTranscriptSelected: function (transcript) {
                var self = this;
                self.$emit('transcript-selected', transcript);
            },
            onGeneSourceSelected: function (geneSource) {
                let self = this;
                var switchMsg = null;
                if (self.geneModel.refseqOnly[self.selectedGene.gene_name] && geneSource != 'refseq') {
                    switchMsg = 'Gene ' + self.selectedGene.gene_name + ' only in RefSeq. Switching to this transcript set.';
                    self.geneSource = 'refseq';
                } else if (self.geneModel.gencodeOnly[self.selectedGene.gene_name] && geneSource != 'gencode') {
                    switchMsg = 'Gene ' + self.selectedGene.gene_name + ' only in Gencode. Switching to this transcript set.';
                    self.geneSource = 'gencode';
                } else {
                    self.geneSource = geneSource;
                }
                if (switchMsg) {
                    self.noTranscriptsWarning = switchMsg;
                    self.showNoTranscriptsWarning = true;
                }
                self.$emit('gene-source-selected', self.geneSource);
            },
            onRegionZoom: function (regionStart, regionEnd) {
                this.zoomMessage = "Click to zoom out";
                this.$emit('gene-region-zoom', regionStart, regionEnd);
            },
            onRegionZoomReset: function () {
                let updateTrack = true;
                this.zoomMessage = "Drag to zoom";
                this.$emit('gene-region-zoom-reset', updateTrack);
            },
            initSummaryInfo: function () {
                let self = this;
                if (self.selectedGene && self.selectedGene.gene_name) {
                    self.ncbiSummary = self.geneModel.geneNCBISummaries[self.selectedGene.gene_name];
                    if (self.ncbiSummary == null || self.ncbiSummary.summary == '?') {
                        self.geneModel.promiseGetNCBIGeneSummary(self.selectedGene.gene_name)
                            .then(function (data) {
                                self.ncbiSummary = data;
                            })
                    }
                    self.phenotypes = self.geneModel.genePhenotypes[self.selectedGene.gene_name]
                    if (self.phenotypes) {
                        self.phenotypeTerms = self.phenotypes.map(function (d) {
                            return d.hpo_term_name;
                        }).join(", ");
                    }
                } else {
                    self.ncbiSummary = null;
                    self.phenotypes = null;
                }
            },
            toggleZoom: function() {
                const self = this;
                self.updateMatrix = true;
                self.showZoom = !self.showZoom;
            },
            onGeneRegionBufferChange: function (newGeneRegionBuffer) {
                this.$emit('gene-region-buffer-change', parseInt(newGeneRegionBuffer));
            },
            formatRegion: function (value) {
                return !value ? '' : this.d3.format(",")(value);
            },
            formatTranscriptType: function (transcript) {
                if (transcript && transcript.transcript_type.indexOf("transcript") < 0) {
                    return transcript.transcript_type + " transcript";
                } else if (transcript) {
                    return transcript.transcript_type;
                } else {
                    return "";
                }
            },
            getNonReactiveClass: function() {
                return 'display';
            }
        },
        computed: {
            showGene: function () {
                return this.selectedGene != null && Object.keys(this.selectedGene).length > 0
            },
            showGeneTypeWarning: function () {
                return this.selectedGene != null
                    && Object.keys(this.selectedGene).length > 0
                    && this.selectedGene.gene_type !== 'protein_coding'
                    && this.selectedGene.gene_type !== 'gene';
            },
            showTranscriptTypeWarning: function () {
                if (this.selectedTranscript == null || this.selectedTranscript.transcript_type === 'protein_coding'
                    || this.selectedTranscript.transcript_type === 'mRNA'
                    || this.selectedTranscript.transcript_type === 'transcript') {
                    return false;
                } else {
                    if (this.selectedGene.gene_type !== this.selectedTranscript.transcript_type) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            regionBuffer: {
                get() {
                    return this.value == null ? 1000 : this.value
                },
                set(val) {
                    Vue.nextTick(() => {
                        this.$emit('input', val)
                    })
                }
            }
        },
        watch: {
            geneModel: function () {
                this.geneRegionBuffer = this.geneModel ? this.geneModel.geneRegionBuffer : 0;
            },
            selectedGene: function (newGene, oldGene) {
                if (newGene.gene_name !== oldGene.gene_name) {
                    this.initSummaryInfo();
                }
            },
            showZoom: function () {
                const self = this;
                let container = this.d3.select('#' + self.geneVizName).select('#gene-viz');
                if (self.showZoom) {
                    self.zoomMessage = "Drag to zoom";
                    self.$refs.transcriptGeneVizRef.toggleBrush(self.showZoom, container);
                } else {
                    self.$refs.transcriptGeneVizRef.toggleBrush(self.showZoom, container);
                    self.$emit('gene-region-zoom-reset', self.updateMatrix);
                }
            },
            clearZoom: function () {
                const self = this;
                self.showZoom = false;
                self.zoomMessage = "Drag to zoom";
                const updateTrack = false;
                self.$emit('gene-region-zoom-reset', updateTrack);
            }
        },
        mounted: function () {
            this.geneSource = this.geneModel.geneSource;
            this.initSummaryInfo();
        },
    }
</script>