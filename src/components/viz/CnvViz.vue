<style lang="sass">
.cnv-svg
  margin-top: -20px !important

.cnv-ideo
  .acen
    fill: #DDD !important

  .gvar
    fill: #EEE !important

  .stalk
    fill: #AAA !important

.cnv-pseudo-ideo
  position: absolute
  bottom: 95%
  left: 23%
  z-index: 4

  .bands
    display: none !important

  .chrLabel
    font-family: Quicksand !important
    font-size: 12px !important
    color: #888 !important

.cnv-ideo
  position: absolute
  bottom: 95%
  left: 23%
  z-index: 5

  .chrLabel
    display: none

.cnv-gene
  position: relative
  margin-top: 50px

</style>

<template>
  <v-container class="pa-0 ma-0" style="position: relative; height: 55px">
    <div :id="'cnv-ideo-' + model.id" class="cnv-ideo"></div>
    <div :id="'cnv-pseudo-ideo-' + model.id" class="cnv-pseudo-ideo"></div>
    <div :id="'cnv-' + model.id" class="cnv-gene"></div>
  </v-container>
</template>

<script>
import cnvD3 from '../../d3/Cnv.d3.js'
import Ideogram from "ideogram";

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
      data: null,  // cnvs that go into d3 viz
      ideograms: [], // gets rid of linter error and allows two ideograms
      tcnRed: "rgb(200, 18, 18, 0.5)",
      tcnBlue: "rgb(25, 77, 129, 0.5)",
      tcnGray: "rgb(204, 199, 155, 0.5)"
    }
  },
  mounted: function () {
    this.drawGeneLevel();
    this.drawChrLevel();
    this.id = this.model.getId();
  },
  methods: {
    drawGeneLevel: function () {
      const self = this;
      const cnvVizOptions = {
        margin: this.margin,
        verticalPadding: 4,
        showTransition: true,
        tcnRed: this.tcnRed,
        tcnBlue: this.tcnBlue,
        tcnGray: this.tcnGray
      };

      // Instantiate d3 object
      this.cnvChart = cnvD3(self.d3, ('cnv-' + self.model.id), cnvVizOptions);

      // Register listeners
      // todo: get rid of listeners
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
    drawChrLevel: function () {
      let strippedChr = this.selectedGene.chr;
      if (strippedChr && strippedChr.startsWith('chr')) {
        strippedChr = this.selectedGene.chr.substring(3);
      }
      if (this.data) {
        let annotations = [];
        let delims = this.data.mergedCnv[0].delimiters;
        let i = 0;
        delims.forEach(coordPair => {
          let start = coordPair[0];
          let end = coordPair[1];
          let tcn = coordPair[2];
          annotations.push({
            color: this.getTcnColor(tcn),
            chr: strippedChr,
            start: start,
            stop: end,
            name: 'CNV ' + (i + 1),
          });
          i++;
        })

        const chrWidth = 15;
        const chrHeight = (this.width * 0.7); // Ideogram orientation is rotated

        // Draw pseudo-ideogram with gene marker annotation
        const pseudoConfig = {
          organism: 'human',
          assembly: this.assemblyVersion,
          container: ('#cnv-pseudo-ideo-' + this.model.id),
          orientation: 'horizontal',
          chrHeight: chrHeight,
          chrWidth: chrWidth,
          chromosome: strippedChr,
          annotations: [{
            color: '#194d81',
            chr: strippedChr,
            start: +this.selectedGene.start,
            stop: +this.selectedGene.end,
            name: (this.selectedGene.gene_name + " Location")
          }],
          annotationsLayout: 'tracks',
          showAnnotTooltip: false,
          showBandLabels: false,
          showChromosomeLabels: true
        };
        let pseudoIdeo = new Ideogram(pseudoConfig);
        this.ideograms.push(pseudoIdeo);

        // Draw main ideogram on top
        const config = {
          organism: 'human',
          assembly: this.assemblyVersion,
          container: ('#cnv-ideo-' + this.model.id),
          orientation: 'horizontal',
          chrHeight: chrHeight,
          chrWidth: chrWidth,
          chromosome: strippedChr,
          annotations: annotations,
          annotationsLayout: 'overlay',
          showAnnotTooltip: false,
        };
        let ideo = new Ideogram(config);
        this.ideograms.push(ideo);
      }
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
    getTcnColor: function (tcn) {
      // todo: left off here - where do I get tcn?
      if (tcn > 2) {
        return this.tcnBlue;
      } else if (tcn < 2) {
        return this.tcnRed;
      } else {
        return this.tcnGray;
      }
    }
  },
  watch: {
    'model.cnvsInGeneObj': function () {
      if (this.model) {
        this.data = this.model.cnvsInGeneObj;
        this.updateGeneLevel();
        this.drawChrLevel();
      }
    }
  }
}
</script>