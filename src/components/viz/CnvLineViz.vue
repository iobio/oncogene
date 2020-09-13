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
    .bar-chart-label
        font: 13px Quicksand
        color: #b4b3b3
        font-style: italic
    .bar-label
        font: 12px Quicksand
    .quality-input
        font-family: Quicksand
        font-size: 16px

        input
            text-align: center
            height: 30px

</style>

<template>
    <v-container>
        <v-row no-gutters>
            <div class="field-label-header pb-2" style="text-align: left">Copy Number Counts</div>
        </v-row>
        <v-row no-gutters>
            <v-col cols="12" sm="12"
                   style="padding-bottom: 5px">
                <div id="cnvLineChart"></div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import lineChart from '../../d3/lineChart.d3.js'

    export default {
        name: 'cnv-line-viz',
        data() {
            return {
                chart: null,
                id: 'cnvLineChart'
            }
        },
        props: {
            d3: null
        },
        methods: {
            drawCharts() {
                const self = this;
                let options = {
                    'parentId': self.id
                };
                self.chart = lineChart(self.d3, options);
            },
            fillChart(cnvData, sampleLabels, maxTcn) {
                const self = this;
                self.chart(cnvData, sampleLabels, maxTcn);
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
            this.drawCharts();
        }
    }
</script>
