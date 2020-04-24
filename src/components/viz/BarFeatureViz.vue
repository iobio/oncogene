<!-- Displays sample zygosity, affected status, and sample depth histograms -->

<style>
    .bar--positive {
        fill: steelblue;
    }

    .bar--negative {
        fill: darkorange;
    }

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

<template>
    <v-flex xs12>
        <v-layout row>
            <v-flex xs12 class="field-label-header" style="text-align:left">Cohort Zygosity Counts</v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs2 class="summary-field-label">Probands:</v-flex>
            <v-flex xs9 id="probandZygBar" style="padding-bottom:5px"></v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs2 class="summary-field-label">Subsets:</v-flex>
            <v-flex xs9 id="subsetZygBar" style="padding-bottom:5px"></v-flex>
        </v-layout>
    </v-flex>
</template>

<script>
    export default {
        name: 'bar-feature-viz',
        data() {
            return {
                probandZygChart: {},
                subsetZygChart: {},
                blank: ''
            }
        },
        props: {
            selectedVariant: {},
            probandZygMap: {},
            subsetZygMap: {},
            statusMap: {},
            depthMap: {},
            affectedProbandCount: {},
            affectedSubsetCount: {},
            totalProbandCount: {},
            totalSubsetCount: {},
            blacklistStatus: false
        },
        created: function () {
        },
        mounted: function () {
            let self = this;
            self.$emit('zyg-bars-mounted');
        },
        methods: {
            drawCharts(probandSampleCount, subsetSampleCount) {
                let self = this;

                // Don't draw charts until we have counts
                if (probandSampleCount == null || probandSampleCount === 0) {
                    return;
                }

                self.probandZygChart = barChart()
                    .parentId('probandZygBar')
                    .yValueMax(probandSampleCount)
                    .yTicks(self.getTicks(probandSampleCount))
                    .on('d3rendered', function () {
                    });
                self.probandZygChart(self.probandZygMap);

                self.subsetZygChart = barChart()
                    .parentId('subsetZygBar')
                    .yValueMax(subsetSampleCount)
                    .yTicks(self.getTicks(subsetSampleCount))
                    .on('d3rendered', function () {
                    });
                self.subsetZygChart(self.subsetZygMap);
            },
            fillCharts() {
                let self = this;
                self.probandZygChart.fillChart()(self.probandZygMap);
                self.subsetZygChart.fillChart()(self.subsetZygMap);
            },
            clear() {
                let self = this;
                self.probandZygChart.fillChart()();
                self.subsetZygChart.fillChart()();
            },
            getTicks(sampleCount) {
                let maxTicks = 5;
                if (sampleCount < (maxTicks - 1)) {
                    return sampleCount + 1;
                } else {
                    return maxTicks;
                }
            }
        },
        watch: {
            selectedVariant: function () {
                if (!this.blacklistStatus || this.selectedVariant == null) {
                    this.fillCharts();
                }
            }
        },
        computed: {}
    }
</script>
