<!-- Displays subclone tree structure derived from Subclone Seeker annotation -->

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
      <v-col cols="12" sm="12" xl="3" class="bar-chart-label">
        Clonal Evolution Tree
      </v-col>
      <v-col v-show="!showLoader"
             cols="12" sm="12"
             :id="svgId"
             style="padding-bottom: 5px">
      </v-col>
      <v-col v-show="showLoader"
             cols="12" sm="12" xl="9">
        <div style="text-align: center; clear: both">
          <div class="loader vcfloader"
               style="display: inline-block">
            <span class="loader-label">Fetching evolution</span>
            <img src="../../assets/images/wheel.gif">
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import TidyTreeD3 from '../../d3/TidyTree.d3.js'
import demoTreeData from '@/data/flare-2.json'

export default {
  name: 'subclone-tree-viz',
  data() {
    return {
      chart: null,
      showLoader: false,
      svgId: 'subclone-tree'
    }
  },
  props: {
    subcloneModel: {
      type: Object,
      default: null
    },
    d3: null
  },
  computed: {},
  methods: {
    drawTree(tree) {
      console.log(tree); // satisfying linter - get rid of when working

      const self = this;
      self.showLoader = true;

      // Init tree
      let options = {};
      self.chart = TidyTreeD3(self.d3, options);

      // Draw tree
      let data = demoTreeData;
      // todo: data will change to tree arg here with properly formatted hierarchy - use d3.stratify
      self.populateTree(data);
      self.showLoader = false;
    },
    populateTree(data) {
      let options = { 'parentId' : this.svgId };
      this.chart(data, options);
    },
    clear() {
      let self = this;
      if (self.chart) {
        self.chart(null, {});
      }
    },
    setLoader(isLoading) {
      this.showLoader = isLoading;
    },
    changeViz(offsetIdx) {
      let treeInfo = this.subcloneModel.possibleTrees[offsetIdx - 1];
      this.drawTree(treeInfo);
    },
  },
  mounted: function () {
    let firstTreeInfo = this.subcloneModel.possibleTrees[0];
    // todo: need to translate graph format into json or object that hierarchy can parse - use d3.stratify
    this.drawTree(firstTreeInfo);
  }
}
</script>
