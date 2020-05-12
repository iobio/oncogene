<!-- Displays allele frequencies of selected variant -->
<style lang="sass">
    .bar-outline
        stroke: #000 !important
        stroke-width: 1px !important
        stroke-opacity: .3 !important
</style>

<template>
    <v-flex xs12>
        <v-layout row>
            <v-flex xs12 class="field-label-header" style="text-align: left">Alternate Allele Frequencies</v-flex>
        </v-layout>
        <v-layout row v-for="(id, i) in sampleIds" :key="id">
            <v-flex xs2 class="summary-field-label">{{ selectedSamples[i] }}</v-flex>
            <v-flex xs3 class="summary-field-value">{{ getPercentageDisplay(id) }}
            </v-flex>
            <v-flex xs7 :id="id + 'Progress'" style="padding: 0px"></v-flex>
        </v-layout>
    </v-flex>
</template>

<script>
    import progressBar from '../../d3/progressBar.d3.js'
    export default {
        name: 'allele-frequency-viz',
        data() {
            return {
                bars: null,
                barsDrawn: false,
                waitingToFill: true
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
            if (this.waitingToFill) {
                this.fillProgressBars();
                this.waitingToFill = false;
            }
            this.barsDrawn = true;
        },
        methods: {
            drawAfBars() {
                const self = this;
                self.bars = [];
                self.sampleIds.forEach((id) => {
                    let currBar = progressBar(self.d3, id);
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
            getMatchingAp(sampleId) {
                const self = this;
                if (!self.sampleMap) {
                    console.log('Error: need samplereads map to populate bars');
                } else {
                    let feat = self.sampleMap[sampleId];
                    if (!feat) {
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
            getPercentageDisplay(sampleId) {
                if (this.selectedVariant == null) return "-";
                else {
                    let feat = this.sampleMap[sampleId];
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
                if (this.barsDrawn) {
                    this.fillProgressBars();
                } else {
                    this.waitingToFill = true;
                }
            },
        }
    }

</script>
