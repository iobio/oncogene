<style lang="sass">
.cnv-gene
  position: relative
  margin-top: 30px
</style>

<template>
  <div :id="'cnv-' + model.id" class="cnv-gene"></div>
</template>

<script>
import cnvD3 from '../../d3/Cnv.d3.js'

export default {
  name: 'cnv-viz',
  props: {
    model: {}, // SampleModel
    selectedGene: {},
    maxTcn: {
      default: 2,
      type: Number
    },
    margin: {
      type: Object,
      default: function () {
        return {top: -10, bottom: 10, left: 10, right: 10}
      }
    },
    cnvPalette: {
      type: Object,
      default: function () {
        return {
          tcnRed: "rgb(200, 18, 18, 0.5)",
          tcnBlue : "rgb(25, 77, 129, 0.5)",
          tcnGray : "rgb(204, 199, 155, 0.5)" }
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
    this.drawGeneLevel();
    this.id = this.model.getId();
  },
  methods: {
    drawGeneLevel: function () {
      const self = this;
      const cnvVizOptions = {
        margin: this.margin,
        verticalPadding: 4,
        showTransition: true,
        tcnRed: this.cnvPalette.tcnRed,
        tcnBlue: this.cnvPalette.tcnBlue,
        tcnGray: this.cnvPalette.tcnGray
      };

      // Instantiate d3 object
      this.cnvChart = cnvD3(self.d3, ('cnv-' + self.model.id), cnvVizOptions);

      // Register listeners
      // todo: chain to show arrow like on coord track
      let dispatch = this.cnvChart.getDispatch();
      dispatch.on('d3mouseover', function (cnvInfo) {
        self.$emit('toggle-cnv-tooltip', cnvInfo);
      });
      dispatch.on('d3mouseout', function () {
        self.$emit('toggle-cnv-tooltip');
      });
      dispatch.on('d3click', function (cnvInfo, width) {
        self.$emit('display-cnv-dialog', cnvInfo, width, self.model.selectedSample);
      })
    },
    updateGeneLevel: function () {
      const self = this;
      let selection = self.d3.select(self.$el).datum(this.data);
      if (this.data) {
        const chartData = {
          selection: selection,
          regionStart: self.selectedGene.start,
          regionEnd: self.selectedGene.end,
          chromosome: self.selectedGene.chr,
          verticalLayers: self.data.length,
          width: self.width,
          maxTcn: self.maxTcn,
          drawMinorAllele: self.drawMinorAllele
        };
        self.cnvChart(chartData);
      }
    },
    showCnvPoint: function (variantStart, variantEnd, matchingCnvs) {
      const self = this;
      let container = self.d3.select(self.$el);
      self.cnvChart.showCircle(container, variantStart, variantEnd, matchingCnvs);
    },
    hideCnvPoint: function () {
      const self = this;
      let container = self.d3.select(self.$el);
      self.cnvChart.hideCircle(container);
    },
  },
  watch: {
    'model.cnvsInGeneObj': function () {
      if (this.model) {
        this.data = this.model.cnvsInGeneObj;
        this.updateGeneLevel();
      }
    }
  }
}
</script>