<style lang="sass">
    .cnv-amp
        fill: #cf7676
        opacity: 0.5 !important
        z-index: 5

    .cnv-del
        fill: #194d81
        opacity: 0.3 !important
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
            maxTcn: {
                default: 2,
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
                drawMinorAllele: true,
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
                    showTransition: true
                };

                // Instantiate d3 object
                this.cnvChart = cnvD3(self.d3, ('cnv-' + self.model.id), cnvVizOptions);

                // Register listeners
                let dispatch = this.cnvChart.getDispatch();
                dispatch.on('d3mouseover', function(cnvInfo) {
                  self.$emit('toggle-cnv-tooltip', cnvInfo);
                });
                dispatch.on('d3mouseout', function() {
                  self.$emit('toggle-cnv-tooltip');
                });
                dispatch.on('d3click', function(cnvInfo, width) {
                  self.$emit('display-cnv-dialog', cnvInfo, width, self.model.selectedSample);
                })
            },
            update: function () {
                const self = this;
                let selection = self.d3.select(self.$el).datum(this.data);
                if (this.data) {
                    const chartData = {
                        selection: selection,
                        regionStart: self.regionStart,
                        regionEnd: self.regionEnd,
                        chromosome: self.chromosome,
                        verticalLayers: self.data.length,
                        width: self.width,
                        maxTcn: self.maxTcn,
                        drawMinorAllele: self.drawMinorAllele
                    };
                    self.cnvChart(chartData);
                }
            },
            showCnvPoint: function(variantStart, variantEnd, matchingCnvs) {
              const self = this;
              let container = self.d3.select(self.$el);
              self.cnvChart.showCircle(container, variantStart, variantEnd, matchingCnvs);
            },
            hideCnvPoint: function() {
              const self = this;
              let container = self.d3.select(self.$el);
              self.cnvChart.hideCircle(container);
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