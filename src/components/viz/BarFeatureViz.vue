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
            <v-flex xs12 class="field-label-header" style="text-align:left">Raw Bam Counts</v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs2 class="summary-field-label">{{ chartLabel }}:</v-flex>
            <v-flex xs9 :id="bamType + 'bar'" style="padding-bottom:5px"></v-flex>
        </v-layout>
    </v-flex>
</template>

<script>
    import barChart from '../../d3/barChart.d3.js'

    export default {
        name: 'bar-feature-viz',
        data() {
            return {
                chart: null
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
                return this.bamType === 'rnaSeq' ? 'Rna-Seq' : 'Atac-Seq';
            }
        },
        methods: {
            drawCharts() {
                const self = this;

                // Don't draw charts until we have counts
                if (self.counts == null) {
                    return;
                }

                let maxCount = 0;
                let sampleCount = 0;
                Object.values(self.counts).forEach(count => {
                    if (count > maxCount)
                        maxCount = count;
                    sampleCount++;
                });

                let options = {
                    'parentId': self.bamType + 'bar',
                    'yValMax': maxCount,
                    'yTicks': self.getTicks(sampleCount)
                };
                self.chart = barChart(self.d3, options);
            },
            fillCharts() {
                let self = this;
                let objs = [];
                for (var count in self.counts) {
                    let obj = { label: count, value: self.counts[count] };
                    objs.push(obj);
                }

                self.chart.fillChart(objs);
            },
            clear() {
                let self = this;
                self.chart.fillChart();
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
                this.drawCharts();
                this.fillCharts();
            }
        }
    }
</script>
