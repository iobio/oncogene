<!-- Displays proportions of subclones per timepoint -->

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
      <v-col cols="12" sm="12" xl="12" class="bar-chart-label">
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
import demoBarData from '@/data/subclone_counts_demo.csv'

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
    counts: {
      type: Object,
      default: null
    },
    d3: null,
    colorMap: {
      type: Map,
      default: null
    },
  },
  methods: {
    drawChart(data) {
      const self = this;
      console.log(data);  //todo: get rid of

      self.showLoader = true;
      let options = {
        'parentId': self.svgId,
        'colorMap': self.colorMap
      };
      self.chart = barChart(self.d3);
      self.fillChart(demoBarData, options);  // todo: change with real data
      self.showLoader = false;
    },
    fillChart(clonalCounts, options) {
      this.chart(clonalCounts, options);
    },
    clear() {
      this.chart();
    },
    setLoader(isLoading) {
      this.showLoader = isLoading;
    },
    changeViz(offsetIdx) {
      let treeInfo = this.subcloneModel.possibleTrees[offsetIdx - 1];
      this.fillChart(treeInfo);
    },
  },
  mounted: function () {
    //let firstTreeInfo = this.subcloneModel.possibleTrees[0];
    let firstTreeInfo = 'getRidOfMe'; //todo
    this.drawChart(firstTreeInfo);
  }
}
</script>
