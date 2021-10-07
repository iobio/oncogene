<!--Adapted from gene.iobio and TDS 17Aug2018-->

<style lang="sass">
.section-title
  font-family: 'Quicksand'
  color: white
  background-color: #7f1010
  padding-bottom: 5px

.filter-settings-form
  background-color: transparent !important
  width: 100%

  .filter-category
    font-size: 22px
    font-family: 'Quicksand'
    vertical-align: top
    background-color: transparent

  .filter-title
    font-size: 14px
    font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif'
    vertical-align: top
    margin-left: 6px

  svg
    width: 22px
    height: 18px

  .remove-custom-filter
    margin: 0px
    float: right

  .recall-btn
    font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif'

  .staged-filters
    font-family: 'Quicksand'

#filter-settings-icon
  font-size: 20px
  color: $app-color
</style>

<template class="pa-0">
  <v-card flat tile dark class="filter-settings-form mx-1">
    <v-card-text>
      <v-card v-if="activeRecallFilters.length > 0" class="px-2">
        <div class="mt-5 staged-filters">
          <v-card-title style="font-size: 22px">
            <v-icon class="pr-1" color="white">warning</v-icon>
            Staged filter changes:
          </v-card-title>
          <v-card-text>
            <v-chip color="white" class="my-1" outlined close
                    v-for="stagedFilter in activeRecallFilters"
                    :key="stagedFilter.name"
                    @click:close="removeStagedFilter(stagedFilter.name)">
              {{ stagedFilter.display + ' ' + stagedFilter.stagedLogic + ' ' + stagedFilter.stagedVal }}
            </v-chip>
          </v-card-text>
          <v-card-actions>
            <v-btn class="mx-1 mt-1 recall-btn" color="secondary" @click="recallSomaticVariants">
              Recall Somatic Variants
            </v-btn>
            <v-btn color="appGray" class="mx-1 mt-1 recall-btn" @click="clearRecallCriteria">
              Cancel
            </v-btn>
          </v-card-actions>
        </div>
      </v-card>
      <v-card flat
              color="transparent"
              v-for="category in filterModel.filterCategories"
              :ref="category.name + 'ExpansionRef'"
              :key="category.name"
              :value="category.custom">
        <v-card-title class="filter-category px-0">
          <v-icon small style="padding-left: 5px; padding-right: 5px" color="white">
            {{ category.icon }}
          </v-icon>
          {{ category.display }}
        </v-card-title>
        <v-card-text>
          <div class="pb-2 pt-0"><i>{{ category.description }}</i></div>
          <filter-panel
              v-if="category.name !== 'coverage'"
              ref="filterSettingsRef"
              :filterName="category.name"
              :filterModel="filterModel"
              :filter="category"
              :annotationComplete="annotationComplete"
              :applyFilters="applyFilters"
              :displaySomaticOnly="category.activeForSomaticOnlyMode"
              :somaticOnlyMode="somaticOnlyMode"
              @filter-change="onFilterChange">
          </filter-panel>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>


<script>
import FilterPanel from './FilterPanel.vue'

export default {
  name: 'filter-panel-menu',
  components: {
    FilterPanel
  },
  props: {
    filterModel: null,
    showCoverageCutoffs: null,
    annotationComplete: {
      type: Boolean,
      default: false
    },
    applyFilters: {
      type: Boolean,
      default: false
    },
    somaticOnlyMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showMenu: true,
      activeRecallFilters: []
    }
  },
  methods: {
    onFilterChange: function (recallFilter) {
      // todo: here, need to update active status of parent in filterModel class

      if (recallFilter) {
        const activeOnly = true;
        this.activeRecallFilters = this.filterModel.getRecallFilters(activeOnly);
      } else {
        this.$emit('filter-change');
      }
    },
    recallSomaticVariants: function () {
      this.filterModel.commitStagedChanges();
      this.activeRecallFilters = [];
      this.$emit('recall-somatic-variants');
    },
    clearRecallCriteria: function () {
      this.filterModel.clearAllStagedChanges();
      this.activeRecallFilters = [];
    },
    removeStagedFilter: function (filterName) {
      this.filterModel.removeStagedFilter(filterName);
      const activeOnly = true;
      this.activeRecallFilters = this.filterModel.getRecallFilters(activeOnly);
    }
  },
}
</script>
