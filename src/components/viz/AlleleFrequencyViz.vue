<!-- Displays allele frequencies of selected variant -->
<style lang="sass">
    .bar-outline
        stroke: #000 !important
        stroke-width: 1px !important
        stroke-opacity: .3 !important
</style>

<template>
    <v-container>
        <v-row no-gutters>
            <div class="field-label-header pb-2" style="text-align: left">Alternate Allele Frequencies</div>
        </v-row>
        <v-row v-for="(id, i) in sampleIds" :key="id" no-gutters>
            <v-col cols="12" sm="3" xl="2" class="summary-field-label">{{ selectedSamples[i] }}</v-col>
            <v-col cols="12" sm="9" xl="3" class="summary-field-value">{{ getPercentageDisplay(selectedSamples[i]) }}</v-col>
            <v-col cols="12" sm="12" xl="7" :id="'progress_' + selectedSamples[i]" class="mt-1"></v-col>
        </v-row>
    </v-container>
</template>

<script>
    import progressBar from '../../d3/progressBar.d3.js'
    export default {
        name: 'allele-frequency-viz',
        data() {
            return {
                bars: null
            }
        },
        props: {
            selectedVariant: {},
            sampleMap: {},
            sampleIds: null,
            selectedSamples: null,  // NOTE: must be same order as sampleIds
            d3: {
                type: Object,
                default: null
            }
        },
        created: function () {
        },
        mounted: function () {
            this.drawAfBars();
        },
        methods: {
            drawAfBars() {
                const self = this;
                self.bars = [];
                self.selectedSamples.forEach((ss) => {
                    let currBar = progressBar(self.d3, ss);
                    currBar();
                    self.bars.push(currBar);
                });
            },
            fillProgressBars() {
                const self = this;
                self.bars.forEach((bar) => {
                    let af = self.getMatchingAp(bar.getId());
                    bar.moveProgressBar(af);
                });
            },
            clear() {
                const self = this;
                self.bars.forEach((bar) => {
                    bar.moveProgressBar(0);
                });
            },
            getMatchingAp(selectedSample) {
                const self = this;
                if (!self.sampleMap) {
                    console.log('Error: need samplereads map to populate bars');
                } else {
                    let feat = self.sampleMap[selectedSample];
                    if (!feat || !feat.genotypeDepth) {
                        // If we don't have a feature here, it was not reported in the vcf so assuming 0 reads
                        // NOTE: alternative option would be to fetch reads from bam, but then would be incongruous w/ rest of reads reported here
                        return 0;
                    } else {
                        if (feat.genotypeDepth === 0) {
                            return 0;
                        } else {
                            return Math.round(feat.genotypeAltCount / feat.genotypeDepth * 100); // alt / total
                        }
                    }
                }
            },
            getPercentageDisplay(selectedSample) {
                if (this.selectedVariant == null) return "-";
                else {
                    let feat = this.sampleMap[selectedSample];
                    if (!feat || !feat.genotypeDepth) {
                        return '-';
                    }
                    let numMutantAlleles = feat.genotypeAltCount;
                    let totalAlleleCount = feat.genotypeDepth;
                    if (totalAlleleCount === 0) return '0%';

                    let freq = Math.round((numMutantAlleles / totalAlleleCount) * 100);
                    if (freq === 0 && numMutantAlleles > 0) {
                        return '<1% (' + numMutantAlleles + '/' + totalAlleleCount + ')';
                    }
                    return freq + '% (' + numMutantAlleles + '/' + totalAlleleCount + ')';
                }
            }
        },
        watch: {
            selectedVariant: function () {
                this.fillProgressBars();
            },
        }
    }

</script>
