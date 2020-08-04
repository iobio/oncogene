<style lang="sass">
    @import ../../assets/sass/variables

    .depth-viz .circle-label
        fill: $arrow-color
        font-size: 15px
        font-weight: bold
        stroke: none
        pointer-events: none

    .depth-viz
        .y.axis
            line
                stroke-width: .5px

            .tick
                text
                    font-size: 11px

    .depth-viz path.line
        stroke: rgba(128, 128, 128, .81)
        stroke-width: 1
        fill: none

    .area-chart-gradient-top
        stop-color: grey
        stop-opacity: 0.1

    .area-chart-gradient-bottom
        stop-color: grey
        stop-opacity: 0.6

    .depth-viz
        text-align: left
        margin-top: 0px
        min-height: 30px

        .circle
            stroke: none
            fill: $current-color
            pointer-events: none

        .region
            stroke-width: 1px
            stroke: $coverage-problem-region-color
            fill: $coverage-problem-region-color

        .threshold
            line
                stroke-width: 1px
                stroke: lightgray
                stroke-dasharray: 5, 5

            text
                font-size: 12px
                fill: $text-color
                cursor: pointer

</style>


<template>
    <div class="depth-viz">
    </div>
</template>

<script>

    import lineD3 from '../../d3/Line.d3.js'

    export default {
        name: 'depth-viz',
        props: {
            type: {
                type: String,
                default: null
            },
            coverage: {
                type: Array,
                default: null
            },
            coverageDangerRegions: {
                type: Array,
                default: function () {
                    return [];
                }
            },
            coverageMedian: {
                type: Number,
                default: 0
            },
            maxDepth: {
                type: Number,
                default: 0
            },
            currentPoint: {
                type: Object,
                default: function () {
                    return null;
                }
            },
            width: {
                type: Number,
                default: 0
            },
            height: {
                type: Number,
                default: 0
            },
            kind: {
                type: String,
                default: 'area'
            },
            margin: {
                type: Object,
                default: function () {
                    return {}
                }
            },
            showXAxis: {
                type: Boolean,
                default: true
            },
            showYAxis: {
                type: Boolean,
                default: true
            },
            yAxisLine: {
                type: Boolean,
                default: false
            },
            yTicks: {
                type: Number,
                default: 3
            },
            regionStart: {
                type: Number,
                default: 0
            },
            regionEnd: {
                type: Number,
                default: 0
            },
            regionGlyph: {
                type: Function,
                default: function () {
                }
            },
            d3: null,
            $: null
        },
        data() {
            return {
                depthChart: {}
            }
        },
        created: function () {
        },
        mounted: function () {
            this.draw();
        },
        methods: {
            draw: function () {
                const self = this;

                const lineVizOptions = {
                    width: this.width,
                    height: this.height,
                    widthPercentage: '100%',
                    heightPercentage: '100%',
                    kind: this.kind,
                    margin: this.margin,
                    showXAxis: this.showXAxis,
                    showYAxis: this.showYAxis,
                    yTicks: this.yTicks,
                    maxDepth: this.maxDepth,
                    regionGlyphFunc: this.regionGlyph
                };

                self.depthChart = lineD3(self.d3, lineVizOptions);

                // Register listeners
                let dispatch = self.depthChart.getDispatch();
                dispatch.on("d3region", function (featureObject, feature, lock) {
                    self.$emit("region-selected", featureObject, feature, lock);
                });

                this.setDepthChart();
            },
            update: function () {
                var self = this;
                if (self.coverage.length > 0 && self.coverage[0].length > 0) {
                    self.$(self.$el).removeClass("hide");
                    let options = {
                        maxDepth: self.maxDepth,
                        xStart: self.regionStart,
                        xEnd: self.regionEnd,
                        width: self.width,
                        height: self.height
                    };
                    self.depthChart.updateSize(options);
                    let selection = self.d3.select(self.$el).datum(self.coverage);
                    self.depthChart(selection);
                } else {
                    self.$(self.$el).addClass("hide");
                    let selection = self.d3.select(self.$el).datum([[0, 0]]);
                    self.depthChart(selection);
                }
            },
            setDepthChart: function () {
                this.$emit('updateDepthChart', this.depthChart);
            },
            showCurrentPoint: function (point) {
                this.depthChart.showCircle(point.pos, point.depth);
            },
            hideCurrentPoint: function () {
                this.depthChart.hideCircle();
            }
        },
        watch: {
            coverage: function () {
                this.update();
            },
            coverageDangerRegions: function () {
                let self = this;
                self.depthChart.highlightRegions(self.coverageDangerRegions,
                    {},
                    self.regionStart,
                    self.regionEnd,
                    self.coverageMedian);
            }
        }
    }
</script>