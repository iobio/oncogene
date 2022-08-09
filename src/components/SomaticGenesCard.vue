<!--Adapted from gene.iobio and TDS 17Aug2018-->

<style lang="sass">
.ranked-genes-card
  font-size: 14px !important
  font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif' !important
  padding: 0
  background-color: transparent
.ranked-sub-card
  overflow-y: scroll
  background-color: transparent !important
.variant-text
  font-size: 15px !important
  font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif' !important
  display: inline
  text-overflow: ellipsis
  padding-left: 5px
.section-title
  font-size: 22px
</style>

<template>
  <v-card flat
          tile
          dark
          color="transparent"
          width="100%"
          class="ranked-genes-card">
    <v-card-title class="section-title">
      Ranked Genes
    </v-card-title>
    <v-card-subtitle style="font-style: italic" class="mt-2 pb-1">
      The following loci contain somatic variants
    </v-card-subtitle>
    <v-card-text>
      <v-card class="ranked-sub-card">
        <v-container fluid grid-list-md>
          <v-row justify="center">
            <v-expansion-panels class="mx-1" style="background-color: transparent !important; overflow-y: scroll"
                                inset
                                v-if="rankedGeneList">
              <v-expansion-panel style="background-color: transparent"
                                 v-for="(geneObj,i) in rankedGeneList"
                                 :key="'gene-' + i">
                <v-expansion-panel-header v-bind:style="{ 'background-color': isSelectedGene(geneObj) ? '#965757' : 'transparent'}">
                  <v-row>
                    <template class="d-inline">
                      <v-icon v-if="getHighCount(geneObj)>0" color="highColor">bookmark</v-icon>
                      <v-icon v-if="getModerCount(geneObj)>0" color="moderColor">bookmark</v-icon>
                      <v-icon v-if="getLowCount(geneObj)>0" color="lowColor">bookmark</v-icon>
                      <v-icon v-if="getModifCount(geneObj)>0" color="modifColor">bookmark</v-icon>
                      <v-icon v-if="getCnvCount(geneObj)>0" color="brightPrimary">bookmark_border</v-icon>
                      <v-avatar style="margin-top: 2px; margin-left: 5px"
                                size="22"
                                color="secondary">
                                        <span style="color: white; font-family: Quicksand; font-size: 15px">
                                            {{getTotalVarCount(geneObj)}}
                                        </span>
                      </v-avatar>
                      <!--                                    <v-avatar style="margin-top: 2px; margin-left: 5px; font-size: 10px" color="brightPrimary" size="22" v-if="geneObj.hasCnv">CNV</v-avatar>-->
                      <v-chip v-if="getCnvCount(geneObj)>0" small light color="brightPrimary" style="margin-top: 2px; margin-left: 5px">CNV</v-chip>
                      <div style="padding-left: 10px; padding-top: 5px; padding-right: 5px; font-size: 17px">
                        {{ getGeneText(geneObj) }}
                      </div>
                      <v-btn small
                             outlined
                             color="brightPrimary"
                             v-show="!isSelectedGene(geneObj)"
                             @click="loadGene(geneObj)"
                             style="padding-left: 3px; padding-right: 3px; margin-left: 5px">
                        Load
                        <v-icon color="brightPrimary">arrow_right_alt</v-icon>
                      </v-btn>
                    </template>
                  </v-row>
                </v-expansion-panel-header>
                <v-expansion-panel-content style="background-color: transparent !important;">
                  <v-list style="background-color: transparent" dense>
                    <v-list-item-group v-model="selectedVarIdx">
                      <v-list-item v-for="(feat,i) in geneObj.somaticVariantList" :key="'var-' + i">
                        <v-list-item-content>
                          <v-row style="padding-bottom: 2px" @mouseover="onVariantHover(geneObj, feat)" @mouseleave="onVariantHoverExit">
                            <v-col xs12 style="padding-top: 0; padding-bottom: 0; white-space: nowrap; text-overflow: ellipsis">
                                                    <span class="d-inline">
                                                       <svg v-if="feat.type === 'mnp' || feat.type === 'snp'" class="impact-badge" height="14" width="12">
                                                         <g transform="translate(1,3)" class="filter-symbol" :class="getImpactColor(feat)">
                                                           <rect width="9" height="9"></rect>
                                                         </g>
                                                       </svg>
                                                       <svg v-else-if="feat.type==='del'" class="impact-badge" height="12" width="13">
                                                         <g transform="translate(5,6)" class="filter-symbol" v-bind:class="getImpactColor(feat)">
                                                           <path d="M0,-4.161791450287817L4.805622828269509,4.161791450287817 -4.805622828269509,4.161791450287817Z">
                                                           </path>
                                                         </g>
                                                       </svg>
                                                       <svg v-else-if="feat.type==='ins'" class="impact-badge" height="12" width="13">
                                                         <g transform="translate(7,7)" class="filter-symbol" v-bind:class="getImpactColor(feat)">
                                                           <path d="M0,3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,-3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,3.5682482323055424Z">
                                                           </path>
                                                         </g>
                                                       </svg>
                                                       <svg v-else-if="feat.type==='complex'" class="impact-badge" height="13" width="13">
                                                         <g transform="translate(4,6)" class="filter-symbol" v-bind:class="getImpactColor(feat)">
                                                           <path d="M0,-5.885661912765424L3.398088489694245,0 0,5.885661912765424 -3.398088489694245,0Z">
                                                           </path>
                                                         </g>
                                                       </svg>
                                                     </span>
                              <v-list-item-title class="variant-text" v-text="getVarText(feat)" @click="onVariantSelected(feat)"></v-list-item-title>
                            </v-col>
                          </v-row>
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item v-for="(cnv, i) in geneObj.somaticCnvList" :key="'cnv-' + i">
                        <v-list-item-content>
                          <v-list-item-content>
                            <v-row style="padding-bottom: 2px" @mouseover="onCnvHover(geneObj, cnv)" @mouseleave="onCnvHoverExit">
                              <v-col xs12 style="padding-top: 0; padding-bottom: 0; white-space: nowrap; text-overflow: ellipsis">
                                                    <span class="d-inline">
                                                       <svg class="impact-badge" height="12" width="10">
                                                         <g transform="translate(4,6)" class="filter-symbol" style="stroke: #cf7676 !important; fill: #cf7676 !important;">
                                                           <path d="M0,-5.885661912765424L3.398088489694245,0 0,5.885661912765424 -3.398088489694245,0Z">
                                                           </path>
                                                         </g>
                                                       </svg>
                                                     </span>
                                <v-list-item-title class="variant-text" v-text="getCnvText(cnv)" @click="onCnvSelected(cnv)"></v-list-item-title>
                              </v-col>
                            </v-row>
                          </v-list-item-content>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list-item-group>
                  </v-list>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
            <v-chip v-if="noVarsFound" color="red">
              No somatic variants found - enter genes manually above
            </v-chip>
          </v-row>
        </v-container>
      </v-card>
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
                default: () => { return null; }
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
            }
        },
        data() {
            return {
                selectedVarIdx: null
            }
        },
        mounted: function() {
            this.selectedVarIdx = -1;
        },
        methods: {
            getGeneText: function(geneObj) {
                if (!geneObj) return '';
                return geneObj.gene_name;
            },
            getImpactColor: function(feat) {
                if (feat != null && feat.highestImpactVep != null) {
                    var impactLevel = Object.keys(feat.highestImpactVep)[0].toUpperCase();
                    return "impact_" + impactLevel;
                }
                return "";
            },
            getVarText: function(feat) {
                let type = this.getReadableType(feat.type);
                let impact = Object.keys(feat.highestImpactVep)[0].toLowerCase();
                let aaChange = feat.ref + '->' + feat.alt;
                return type + ' ' + impact + ' ' + aaChange;
            },
            getCnvText: function(cnv) {
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
            getTotalVarCount: function(geneObj) {
                let count = 0;
                if (geneObj) {
                    count = geneObj.highCount + geneObj.moderCount + geneObj.lowCount + geneObj.modifCount + geneObj.cnvCount;
                }
                return count;
            },
            getHighCount: function(geneObj) {
                let count = 0;
                if (geneObj) {
                    count = geneObj.highCount;
                }
                return count;
            },
            getModerCount: function(geneObj) {
                let count = 0;
                if (geneObj) {
                    count = geneObj.moderCount;
                }
                return count;
            },
            getLowCount: function(geneObj) {
                let count = 0;
                if (geneObj) {
                    count = geneObj.lowCount;
                }
                return count;
            },
            getModifCount: function(geneObj) {
                let count = 0;
                if (geneObj) {
                    count = geneObj.modifCount;
                }
                return count;
            },
            getCnvCount: function(geneObj) {
              // todo CNV: think this will need to change for filtering by sample/cnv rank
                let count = 0;
                if (geneObj) {
                  count = geneObj.somaticCnvList.length;
                }
                return count;
            },
            onVariantSelected: function(feature) {
                this.$emit('variant-selected', feature, this, 'rankedList');
            },
            onCnvSelected: function(cnv) {
                // todo cnv: implement highlighting fxnality
            },
            isSelectedGene: function(geneObj) {
                if (!geneObj) return false;
                return geneObj.gene_name === this.selectedGeneName;
            },
            loadGene: function(geneObj) {
                this.$emit('gene-selected-from-list', geneObj.gene_name);
            },
            onVariantHover: function(geneObj, variant) {
                // Only emit event if we're hovering over a gene that's loaded
                if (geneObj.gene_name === this.selectedGeneName)
                    this.$emit('variant-hover', variant, 'rankedList');
            },
            onVariantHoverExit: function() {
                this.$emit('variant-hover-exit');
            },
            onCnvHover: function(geneObj, variant) {
              // Only emit event if we're hovering over a gene that's loaded
              if (geneObj.gene_name === this.selectedGeneName)
                this.$emit('cnv-hover', variant, 'rankedList');
            },
            onCnvHoverExit: function() {
              this.$emit('cnv-hover-exit');
            },
            deselectListVar: function() {
                this.selectedVarIdx = -1;
            }
        },
    }
</script>
