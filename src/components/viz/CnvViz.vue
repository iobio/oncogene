<style lang="sass">
    .cnv
        fill: #cf7676
        opacity: 50%
        z-index: 5

</style>

<template>
    <div class="cnv-viz"></div>
</template>

<script>
    import cnvD3 from '../../d3/Cnv.d3.js'
    export default {
        name: 'cnv-viz',
        props: {
            model: {}, // SampleModel
            regionStart: {
                default: 0,
                type: Number
            },
            regionEnd: {
                default: 0,
                type: Number
            },
            margin: {
                type: Object,
                default: function () {
                    return {top: 10, bottom: 10, left: 10, right: 10}
                }
            },
            showTransition: {
                type: Boolean,
                default: false
            },
            width: {
                type: Number,
                default: 0
            },
            d3: null
        },
        data() {
            return {
                cnvChart: {},
                id: '',
                data: null  // cnvs that go into d3 viz
            }
        },
        mounted: function () {
            this.draw();
            this.id = this.model.getId();
        },
        methods: {
            draw: function () {
                const self = this;

                const cnvVizOptions = {
                    margin: this.margin,
                    verticalPadding: 4,
                    showTransition: this.showTransition
                };

                // Instantiate d3 object
                this.cnvChart = cnvD3(self.d3, cnvVizOptions);
            },
            update: function () {
                const self = this;
                let selection = self.d3.select(self.$el).datum([self.data]);
                if (self.data) {
                    const chartData = {
                        selection: selection,
                        regionStart: self.regionStart,
                        regionEnd: self.regionEnd,
                        chromosome: self.chromosome,
                        verticalLayers: self.data.length,
                        width: self.width
                    };
                    self.cnvChart(chartData);
                } else {
                    self.cnvChart.clearVariants(selection);
                }
            }
        },
        watch: {
            'model.cnvsInGene': function () {
                this.data = this.model.cnvsInGene;
                this.update();
            }
        }
    }
</script>