<!-- Displays sample zygosity, affected status, and sample depth histograms -->

<style>
    .axis text {
        font: 10px sans-serif;
    }

    .axis path,
    .axis line {
        fill: none;
        stroke: #000;
        shape-rendering: crispEdges;
    }
</style>
<style lang="sass">
    .bar-label
        font: 12px Quicksand
</style>

<template>
    <v-container>
        <v-row no-gutters>
            <v-col cols="12" sm="12" xl="3" class="summary-field-label">
                {{ chartLabel }}:
            </v-col>
            <v-col v-show="!showLoader"
                   cols="12" sm="12" xl="9"
                   :id="bamType + 'Bar'"
                   style="padding-bottom: 5px">
            </v-col>
            <v-col v-show="showLoader"
                    cols="12" sm="12" xl="9">
                <div style="text-align: center; clear: both">
                    <div class="loader vcfloader"
                         style="display: inline-block">
                        <span class="loader-label">Fetching reads</span>
                        <img src="../../assets/images/wheel.gif">
                    </div>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import barChart from '../../d3/barChart.d3.js'

    export default {
        name: 'bar-feature-viz',
        data() {
            return {
                chart: null,
                showLoader: false
            }
        },
        props: {
            selectedVariant: {
                type: Object,
                default: null
            },
            bamType: {
                type: String,
                default: null
            },
            counts: {
                type: Object,
                default: null
            },
            d3: null
        },
        computed: {
            chartLabel: function() {
                return this.bamType === 'coverage' ? 'Coverage' : this.bamType === 'rnaSeq' ? 'Rna-Seq' : 'Atac-Seq';
            }
        },
        methods: {
            drawCharts(updatedCounts) {
                const self = this;
                self.showLoader = true;
                let counts = updatedCounts ? updatedCounts : self.counts;

                // Don't draw charts until we have counts
                if (counts == null || Object.values(counts)[0] < 0) {
                    return;
                }
                self.showLoader = false;
                let maxCount = 0;
                let sampleCount = 0;
                Object.values(counts).forEach(count => {
                    if (count > maxCount)
                        maxCount = count;
                    sampleCount++;
                });

                let objs = [];
                for (var count in counts) {
                    let obj = { label: count, value: counts[count] };
                    objs.push(obj);
                }

                let options = {
                    'parentId': self.bamType + 'Bar',
                    'yValMax': maxCount,
                    'yTicks': self.getTicks(sampleCount),
                    'dataMap': objs
                };
                self.chart = barChart(self.d3, options);
                self.chart();
                self.fillCharts(objs);
            },
            fillCharts(objs) {
                let self = this;
                self.chart.fillChart(objs);
            },
            clear() {
                let self = this;
                if (self.chart) {
                    self.chart.fillChart();
                }
            },
            getTicks(sampleCount) {
                let maxTicks = 5;
                if (sampleCount < (maxTicks - 1)) {
                    return sampleCount + 1;
                } else {
                    return maxTicks;
                }
            },
            setLoader(isLoading) {
                this.showLoader = isLoading;
            }
        },
        mounted: function() {
            //this.drawCharts();
        }
    }
</script>
