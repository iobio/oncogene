<style lang="sass">
    .cnv-amp
        fill: #cf7676
        opacity: 50%
        z-index: 5

    .cnv-del
        fill: #194d81
        opacity: 30%
        z-index: 5


    .cnv-flat
        fill: transparent

</style>

<template>
    <div :id="'cnv-' + model.id"></div>
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
            chromosome: {
                default: null,
                type: String
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
                this.cnvChart = cnvD3(self.d3, ('cnv-' + self.model.id), cnvVizOptions);

                // Register listeners
                let dispatch = this.cnvChart.getDispatch();
                dispatch.on('d3cnv', function(positionArr, cnvInfo) {
                    self.$emit('toggle-cnv-tooltip', positionArr, cnvInfo);
                });
            },
            // todo: 1) add CNV by track to detail panel
            // todo: 2) add CNV event to somatic score & ordering algorithm
            // todo: 3) only display colors for amps/dels

            update: function () {
                const self = this;
                let selection = self.d3.select(self.$el).datum(self.data);
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
                }
            }
        },
        watch: {
            'model.cnvsInGene': function () {
                if (this.model) {
                    this.data = this.model.cnvsInGene;
                    this.update();
                }
            }
        }
    }
</script>