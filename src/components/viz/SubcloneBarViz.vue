<!-- Displays proportions of subclones per timepoint -->

<style>

.subclone path,
.subclone line {
  fill: none;
  stroke: #7f7f7f;
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

.subclone
  text
    font-size: 13px
    font-family: Quicksand
    text-anchor: end
    fill: #717171

</style>

<template>
  <v-container>
    <v-row no-gutters>
      <v-col cols="12" sm="12" xl="12" class="bar-chart-label" style="margin-bottom: -30px">
        Clonal Prevalence
      </v-col>
      <v-col v-show="!showLoader"
             cols="12" sm="12"
             :id="svgId"
             style="padding-bottom: 5px">
      </v-col>
      <v-col v-show="showLoader"
             cols="12" sm="12" xl="12">
        <div style="text-align: center; clear: both">
          <div class="loader vcfloader"
               style="display: inline-block">
            <span class="loader-label">Fetching subclone counts</span>
            <img src="../../assets/images/wheel.gif">
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import barChart from '../../d3/StackedBarChart.d3.js'

export default {
  name: 'subclone-bar-viz',
  data() {
    return {
      chart: null,
      showLoader: false,
      svgId: 'Subclone-Bar'
    }
  },
  props: {
    subcloneModel: {
      type: Object,
      default: null
    },
    d3: null,
    colors: {
      type: Object,
      default: null
    },
    width: null
  },
  methods: {
    drawChart(data) {
      const self = this;
      self.showLoader = true;
      let smallChart = self.width <= 720;
      self.chart = barChart(self.d3, smallChart);
      self.fillChart(data, 1);
      self.showLoader = false;
    },
    fillChart(clonalCounts) {
      let options = {
        'parentId': this.svgId,
        'colorMap': this.colors
      };
      this.chart(clonalCounts, options);
    },
    clear() {
      this.chart();
    },
    setLoader(isLoading) {
      this.showLoader = isLoading;
    },
    changeViz(offsetIdx) {
      let treeInfo = this.subcloneModel.getBarVizTree(offsetIdx);
      this.fillChart(treeInfo, offsetIdx);
    },
    displaySubcloneDialog: function(subcloneId) {
      this.$emit('display-subclone-dialog', subcloneId);
    }
  },
  mounted: function () {
    let firstTreeInfo = this.subcloneModel.getBarVizTree(1);
    this.drawChart(firstTreeInfo);
  }
}
</script>
