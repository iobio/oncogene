<!--Adapted from gene.iobio and TDS 17Aug2018-->

<style lang="sass">
    .ranked-genes-card
        font-size: 14px !important
        font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif' !important
</style>

<template>
    <v-container height="100%" class="ranked-genes-card">
        <v-container fluid grid-list-md style="overflow-y: scroll !important">
            <v-row justify="center">
                <v-expansion-panels inset>
                    <v-expansion-panel
                            v-for="(geneObj,i) in rankedGeneList"
                            :key="'gene-' + i">
                        <v-expansion-panel-header>{{ getGeneText(geneObj) }}</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <v-list dense>
                                <v-list-item-group v-model="selectedVarIdx" color="primary">
                                    <v-list-item v-for="(feat,i) in geneObj.somaticVariantList" :key="'var-' + i">
                                        <v-list-item-content>
                                            <v-list-item-title v-text="getVarText(feat)" @click="onVariantSelected(feat)"></v-list-item-title>
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
            }
        },
        data() {
            return {
                selectedVarIdx: null
            }
        },
        watch: {},
        methods: {
            getGeneText: function(geneObj) {
                let text = geneObj.gene_name;
                if (geneObj.cosmicHighCount > 0) {
                    text += ' ' + geneObj.cosmicHighCount;
                }
                if (geneObj.cosmicModerCount > 0) {
                    text += ' ' + geneObj.cosmicModerCount;
                }
                if (geneObj.cosmicLowCount > 0) {
                    text += ' ' + geneObj.cosmicLowCount;
                }
                if (geneObj.cosmicModifCount > 0) {
                    text += ' ' + geneObj.cosmicModifCount;
                }
                if (geneObj.highCount > 0) {
                    text += ' ' + geneObj.highCount;
                }
                if (geneObj.moderCount > 0) {
                    text += ' ' + geneObj.moderCount;
                }
                if (geneObj.lowCount > 0) {
                    text += ' ' + geneObj.lowCount;
                }
                if (geneObj.modifCount > 0) {
                    text += ' ' + geneObj.modifCount;
                }
                return text;
            },
            getVarText: function(feat) {
                return feat.id;
            },
            onVariantSelected: function(feature) {
                this.$emit('variant-selected', feature, this, 'rankedList');
            }
        },
        computed: {}
    }
</script>
