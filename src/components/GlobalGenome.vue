<template>
    <v-card class="my-1 mr-1">
        <v-card-title style="font-family: Raleway; color: #888888">
            GENOME
        </v-card-title>
        <v-card-text>
            <div :id="divId" style="padding-left: 20px"></div>
        </v-card-text>
    </v-card>
</template>

<script>
    export default {
        name: "GlobalGenome.vue",
        props: {
            d3: {
                type: Object,
                default: null
            }
        },
        data: () => {
            return {
                divId: 'drug-map',
                heatmap: null
            }
        },
        methods: {
            drawGenome: function() {
                // const self = this;
                // const colors = ['#b2182b','#ef8a62','#fddbc7','#f7f7f7','#d1e5f0','#67a9cf','#2166ac'];
                // self.heatmap = new drugHeatmap(self.d3, self.divId)
                    // .on('drugClick', function(drug) { self.$emit('drugClick', drug); })
            }
        },
        mounted: function() {
            this.drawGenome();
        }
    }
</script>

<style scoped>
    rect.bordered {
        stroke: #E6E6E6;
        stroke-width:2px;
    }

    text.mono {
        font-size: 9pt;
        font-family: Raleway;
        fill: #888;
    }

    text.axis-drugs {
        fill: #000;
    }

    text.axis-evid {
        fill: #000;
    }
</style>