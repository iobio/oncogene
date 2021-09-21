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
      <v-col cols="12" sm="12" xl="12" class="bar-chart-label">
        Clonal Evolution Tree
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
// import demoTreeData from '@/data/subclone_tree_demo.json'

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
    d3: null,
    colors: {
      type: Object,
      default: null
    },
  },
  computed: {},
  methods: {
    drawTree(tree, offsetIdx) {

      const self = this;
      self.showLoader = true;

      // Init tree
      let options = {};
      self.chart = TidyTreeD3(self.d3, options);

      // Draw tree
      self.populateTree(tree, offsetIdx);
      self.showLoader = false;
    },
    populateTree(data, offsetIdx) {
      let options = {
        'parentId' : this.svgId,
        'colorMap': this.getColorMap(offsetIdx)
      };
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
      let treeInfo = this.subcloneModel.getTreeViz(offsetIdx);
      this.populateTree(treeInfo, offsetIdx);
    },
    getColorMap: function(offsetIdx) {
      let colorMap = new Map();
      let i = 0;
      let maxClones = this.subcloneModel.possibleTrees[offsetIdx - 1].nodes.length - 1;
      for (var clone in this.colors) {
        if (i < maxClones) {
          colorMap.set(clone, this.colors[clone]);
          i++;
        }
      }
      return colorMap;
    },
  },
  mounted: function () {
    let firstTreeInfo = this.subcloneModel.getTreeViz(1);
    this.drawTree(firstTreeInfo,1);
  }
}
</script>
