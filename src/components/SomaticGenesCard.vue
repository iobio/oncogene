<!--Adapted from gene.iobio and TDS 17Aug2018-->

<style lang="sass">
    .ranked-genes-card
        font-size: 14px !important
        font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif' !important
        color: rgb(113,113,113)
        padding: 0

    .variant-text
        font-size: 15px !important
        font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif' !important
        display: inline
        text-overflow: ellipsis
        color: rgb(113,113,113)
        padding-left: 5px

</style>

<template>
    <v-container height="100%" width="100%" class="ranked-genes-card">
        <v-row justify="center">
            <v-chip style="margin-top: 15px; margin-bottom: 5px" v-if="totalSomaticVarCount >= 0" outlined color="appColor">{{ totalSomaticVarCount + ' Somatic Variants Found'}}</v-chip>
        </v-row>
        <v-container fluid grid-list-md style="overflow-y: scroll !important">
            <v-row justify="center">
                <v-expansion-panels inset>
                    <v-expansion-panel
                            v-for="(geneObj,i) in rankedGeneList"
                            :key="'gene-' + i">
                        <v-expansion-panel-header v-bind:style="{ 'background-color': isSelectedGene(geneObj) ? '#ebebeb' : 'transparent'}">
                            <v-row>
                                <template class="d-inline">
<!--                                    <v-icon color="primary" v-show="!isSelectedGene(geneObj)" @click="loadGene(geneObj)">reply</v-icon>-->
<!--                                    <v-icon color="secondary" v-show="isSelectedGene(geneObj)">double_arrow</v-icon>-->
                                     <v-btn small
                                            outlined
                                            color="primary"
                                            :disabled="isSelectedGene(geneObj)"
                                            @click="loadGene(geneObj)"
                                            style="padding-left: 3px; padding-right: 3px; margin-right: 5px">
                                        <v-icon color="primary">reply</v-icon>Load</v-btn>
                                    <div style="padding-left: 5px; padding-top: 5px; padding-right: 5px; font-size: 17px">
                                        {{ getGeneText(geneObj) }}
                                    </div>
                                    <v-avatar style="margin-top: 2px"
                                            size="20"
                                            color="somaticColor">
                                        <span style="color: white; font-family: Quicksand; font-size: 15px">
                                            {{getTotalVarCount(geneObj)}}
                                        </span>
                                    </v-avatar>
                                    <v-icon v-if="getHighCount(geneObj)>0" color="highColor">bookmark</v-icon>
                                    <v-icon v-if="getModerCount(geneObj)>0" color="moderColor">bookmark</v-icon>
                                    <v-icon v-if="getLowCount(geneObj)>0" color="lowColor">bookmark</v-icon>
                                    <v-icon v-if="getModifCount(geneObj)>0" color="modifColor">bookmark</v-icon>
                                </template>
                            </v-row>
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <v-list dense>
                                <v-list-item-group v-model="selectedVarIdx" color="primary">
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
                                </v-list-item-group>
                            </v-list>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-row>
        </v-container>
    </v-container>
</template>

<script>
    export default {
        name: 'somatic-genes-card',
        components: {},
        props: {
            rankedGeneList: {
                type: Array,
                default: () => { return []; }
            },
            selectedGeneName: {
                type: String,
                default: null
            },
            totalSomaticVarCount: {
                type: Number,
                default: -1
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
                    count = geneObj.highCount + geneObj.moderCount + geneObj.lowCount + geneObj.modifCount;
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
            onVariantSelected: function(feature) {
                this.$emit('variant-selected', feature, this, 'rankedList');
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
            deselectListVar: function() {
                this.selectedVarIdx = -1;
            }
        },
    }
</script>
