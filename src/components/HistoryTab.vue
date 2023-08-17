<!--Adapted from gene.iobio and TDS 17Aug2018-->

<style lang="sass">
.history-card
  font-family: Quicksand
  overflow-y: scroll

  .history-toolbar
    font-size: 14px !important
    font-style: italic
    color: white
    font-weight: 500 !important

  .section-title
    font-size: 22px
</style>

<template>
  <v-card flat
          tile
          dark
          color="transparent"
          class="history-card">
    <v-card-title class="section-title">
      Session History
    </v-card-title>
    <v-card-subtitle style="font-style: italic" class="mt-2 pb-3">
      Review previous somatic analysis conditions
    </v-card-subtitle>
    <v-divider style="margin: 0"></v-divider>
    <v-card-text>
      <v-list-group v-for="(analysis, i) in analysisHistoryList"
                    :key="i">
        <template v-slot:activator>
          <v-list-item-title style="color: white">{{ getAnalysisTitle(analysis) }}
            <v-btn small
                   outlined
                   color="brightPrimary"
                   v-show="!isCurrentAnalysis(analysis)"
                   @click="reloadAnalysis(analysis.filters)"
                   style="padding-left: 3px; padding-right: 3px; margin-left: 5px">
              Load
              <v-icon color="brightPrimary">arrow_right_alt</v-icon>
            </v-btn>
          </v-list-item-title>
          <v-divider
              v-if="i + 1 < analysisHistoryList.length"
              :key="'d'+i"
          ></v-divider>
        </template>
        <v-list-group
            sub-group
            no-action
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title style="color: white">Filters</v-list-item-title>
            </v-list-item-content>
          </template>
          <v-list-item
              v-for="(filterObj, i) in analysis.filters"
              :key="'f'+i"
          >
            <v-list-item-title v-text="getFilterLine(filterObj)"></v-list-item-title>
          </v-list-item>
        </v-list-group>
        <v-list-group
            sub-group
            no-action
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title style="color: white">Genes</v-list-item-title>
            </v-list-item-content>
          </template>
          <v-list-item
              v-for="(gene, i) in analysis.rankedGeneList"
              :key="'g'+i"
          >
            <v-list-item-title v-text="gene"></v-list-item-title>
          </v-list-item>
        </v-list-group>
      </v-list-group>
    </v-card-text>
  </v-card>
</template>


<script>
export default {
  name: 'history-tab',
  components: {},
  props: {
    filterModel: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      analysisHistoryList: []
    }
  },
  methods: {
    refreshList: function () {
      this.analysisHistoryList = Object.values(this.filterModel.filterHistory);
    },
    reloadAnalysis(analysisFilters) {
      let self = this;
      self.$emit('reload-analysis-history', analysisFilters);
    },
    getAnalysisTitle(analysisObj) {
      return analysisObj.somaticVarCount + ' VARIANTS / ' + analysisObj.somaticGeneCount + ' GENES';
    },
    getFilterLine(filterObj) {
      return filterObj.display + ' ' + filterObj.currOper + ' ' + filterObj.currVal;
    },
    isCurrentAnalysis(analysis) {
      let currentKey = this.filterModel.getAnalysisKey(analysis.filters);
      return this.filterModel.currentAnalysisKey === currentKey;
    }
  },
  mounted: function () {
    this.analysisHistoryList = Object.values(this.filterModel.filterHistory);
  }
}
</script>
