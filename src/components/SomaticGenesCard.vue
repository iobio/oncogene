<!--Adapted from gene.iobio and TDS 17Aug2018-->

<style lang="sass">
.ranked-genes-card
  font-size: 14px !important
  font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif' !important
  background-color: transparent

.ranked-sub-card
  background-color: transparent !important

.variant-text
  font-size: 15px !important
  font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif' !important
  display: inline
  text-overflow: ellipsis
  padding-left: 5px

.section-title
  font-family: 'Quicksand' !important
  font-size: 22px
  font-weight: 300

.ranked-integer
  font-size: 18px
  color: black
  font-weight: bolder
  font-family: "Quicksand"

</style>

<template>
  <v-card flat
          tile
          dark
          color="transparent"
          class="ranked-genes-card">
    <v-card-title class="section-title">
      Ranked Genes
    </v-card-title>
    <v-card-text class="mt-4">
      <v-virtual-scroll
          bench="50"
          :items="rankedGeneList"
          item-height="64"
          v-bind:height="scrollHeight">
        <template v-slot:default="{ item }">

          <v-list-item :style="[isSelectedGene(item) ? {'background-color': 'rgb(82, 104, 125, 0.75)',} : {'background-color': 'transparent'}]"
                       @click="loadGene(item)">
            <v-list-item-content>
              <div style="font-size: 15px">
                {{ getGeneText(item) }}
              </div>
            </v-list-item-content>
            <v-list-item-avatar style="margin-left: 0" v-if="getHighCount(item)>0">
              <v-avatar style="margin-top: 2px;"
                        :size="rankedAvSize"
                        color="highColor">
                    <span class="ranked-integer">
                        {{ getHighCount(item) }}
                    </span>
              </v-avatar>
            </v-list-item-avatar>
            <v-list-item-avatar style="margin-left: 0" v-if="getModerCount(item)>0">
              <v-avatar style="margin-top: 2px;"
                        :size="rankedAvSize"
                        color="moderColor">
                    <span class="ranked-integer">
                        {{ getModerCount(item) }}
                    </span>
              </v-avatar>
            </v-list-item-avatar>
            <v-list-item-avatar style="margin-left: 0" v-if="getLowCount(item)>0">
              <v-avatar style="margin-top: 2px;"
                        :size="rankedAvSize"
                        color="lowColor">
                    <span class="ranked-integer">
                        {{ getLowCount(item) }}
                    </span>
              </v-avatar>
            </v-list-item-avatar>
            <v-list-item-avatar style="margin-left: 0" v-if="getModifCount(item)>0">
              <v-avatar style="margin-top: 2px;"
                        :size="rankedAvSize"
                        color="modifColor">
                    <span class="ranked-integer">
                        {{ getModifCount(item) }}
                    </span>
              </v-avatar>
            </v-list-item-avatar>
            <v-chip v-if="getCnvCount(item)>0" small light color="brightPrimary"
                    style="margin-top: 2px; margin-left: 5px">CNV
            </v-chip>
          </v-list-item>
          <v-divider></v-divider>
        </template>
      </v-virtual-scroll>
      <v-chip v-if="noVarsFound" color="red">
        No somatic variants found - enter genes manually above
      </v-chip>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'somatic-genes-card',
  components: {},
  props: {
    rankedGeneList: {
      type: Array,
      default: () => {
        return null;
      }
    },
    selectedGeneName: {
      type: String,
      default: null
    },
    totalSomaticVarCount: {
      type: Number,
      default: -1
    },
    noVarsFound: {
      type: Boolean,
      default: false
    },
    useVEP: {
      type: Boolean,
      default: false
    },
    screenHeight: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      selectedVarIdx: null,
      rankedAvSize: 26,
      scrollHeight: this.screenHeight - 260
    }
  },
  mounted: function () {
    this.selectedVarIdx = -1;
  },
  methods: {
    getGeneText: function (geneObj) {
      if (!geneObj) return '';
      return geneObj.gene_name;
    },
    getImpactColor: function (feat) {
      if (this.useVEP && feat != null && feat.highestImpactVep != null) {
        let impactLevel = Object.keys(feat.highestImpactVep)[0].toUpperCase();
        return "impact_" + impactLevel;
      } else if (!this.useVEP && feat != null && feat.highestImpactBcsq != null) {
        let impactLevel = feat.highestImpactBcsq.toUpperCase();
        return "impact_" + impactLevel;
      }
      return "";
    },
    getVarText: function (feat) {
      let type = this.getReadableType(feat.type);
      let impact = this.useVEP ? Object.keys(feat.highestImpactVep)[0].toLowerCase() : feat.highestImpactBcsq.toLowerCase();
      let aaChange = feat.ref + '->' + feat.alt;
      return type + ' ' + impact + ' ' + aaChange;
    },
    getCnvText: function (cnv) {
      return 'CNV: ' + cnv.start + '->' + cnv.end;
    },
    getReadableType(type) {
      if (type === 'snp') {
        return 'SNP';
      } else if (type === 'del') {
        return 'deletion';
      } else if (type === 'ins') {
        return 'insertion';
      } else if (type === 'complex') {
        return 'complex';
      }
    },
    getTotalVarCount: function (geneObj) {
      let count = 0;
      if (geneObj) {
        count = geneObj.highCount + geneObj.moderCount + geneObj.lowCount + geneObj.modifCount + geneObj.cnvCount;
      }
      return count;
    },
    getHighCount: function (geneObj) {
      let count = 0;
      if (geneObj) {
        count = geneObj.highCount;
      }
      return count;
    },
    getModerCount: function (geneObj) {
      let count = 0;
      if (geneObj) {
        count = geneObj.moderCount;
      }
      return count;
    },
    getLowCount: function (geneObj) {
      let count = 0;
      if (geneObj) {
        count = geneObj.lowCount;
      }
      return count;
    },
    getModifCount: function (geneObj) {
      let count = 0;
      if (geneObj) {
        count = geneObj.modifCount;
      }
      return count;
    },
    getCnvCount: function (geneObj) {
      // todo CNV: think this will need to change for filtering by sample/cnv rank
      let count = 0;
      if (geneObj) {
        count = geneObj.somaticCnvList.length;
      }
      return count;
    },
    onVariantSelected: function (feature) {
      this.$emit('variant-selected', feature, this, 'rankedList');
    },
    isSelectedGene: function (geneObj) {
      if (!geneObj) return false;
      return geneObj.gene_name === this.selectedGeneName;
    },
    loadGene: function (geneObj) {
      this.$emit('gene-selected-from-list', geneObj.gene_name);
    },
    onVariantHover: function (geneObj, variant) {
      // Only emit event if we're hovering over a gene that's loaded
      if (geneObj.gene_name === this.selectedGeneName)
        this.$emit('variant-hover', variant, 'rankedList');
    },
    onVariantHoverExit: function () {
      this.$emit('variant-hover-exit');
    },
    onCnvHover: function (geneObj, variant) {
      // Only emit event if we're hovering over a gene that's loaded
      if (geneObj.gene_name === this.selectedGeneName)
        this.$emit('cnv-hover', variant, 'rankedList');
    },
    onCnvHoverExit: function () {
      this.$emit('cnv-hover-exit');
    },
    deselectListVar: function () {
      this.selectedVarIdx = -1;
    }
  },
}
</script>
