<style lang="sass">
    @import "../../assets/sass/_variables.sass"

    #edit-transcript-button
        color: $app-color
        margin: 0px 8px 0px 0px
        padding: 0px

        .btn__content
            color: $app-color
            padding: 0px

    #select-transcript-viz
        .selected
            outline: solid 1px $current-color

            .selection-box
                cursor: pointer

        .current
            font-weight: bold
            outline: solid 2px $current-color

    #select-transcripts-box
        .btn--floating.btn--small
            height: 20px !important
            width: 22px !important
            margin-left: 4px

        .btn--floating.btn--small .btn__content
            padding: 0px

        .btn__content
            color: $text-color

        #gene-source-box
            font-family: Raleway

            .input-group--select
                .input-group__selections__comma
                    font-size: 14px
                    padding: 0

            .input-group
                label
                    font-size: 14px
                    line-height: 25px

            .input-group__input
                min-height: 0px
                margin-top: 10px

        #gene-viz-box
            min-height: 100px
            max-height: 300px
            overflow-y: scroll

    .tscript-headline
        font-family: Quicksand
        font-size: 18px
        background-color: #7f1010
        color: white

</style>

<template>
    <div class="d-inline-flex" id="transcript-menu">
        <v-menu offset-y
                :close-on-content-click="false"
                nudge-width="500"
                bottom
                left
                v-model="showTranscriptsMenu"
                origin="center center"
                transition="scale-transition"
        >
            <template v-slot:activator="{ on, attrs }">
                <v-btn id="edit-transcript-button"
                       v-bind="attrs"
                       v-on="on"
                       text>
                    Transcript
                    <v-icon>expand_more</v-icon>
                </v-btn>
            </template>
            <v-card id="select-transcripts-box">
                <v-card-title class="tscript-headline">
                    <span>Transcript Info</span>
                </v-card-title>
              <v-row id="gene-source-box" class="px-2">
                <v-col sm="6">
                  <div>Selected: {{ selectedTranscript.transcript_id }}</div>
                </v-col>
                <v-col sm="3" offset-sm="3" class="py-1">
                  <v-select class="selection-box"
                            v-bind:items="geneSources"
                            v-model="geneSource"
                            label="Gene source"
                            item-value="text"
                            @input="onGeneSourceSelected">
                  </v-select>
                </v-col>
              </v-row>
                <div class="gene-viz-wrapper px-2">
                    <gene-viz id="select-transcript-viz"
                              :data="selectedGene.transcripts"
                              :margin=margin
                              :trackHeight=trackHeight
                              :cdsHeight=cdsHeight
                              :showLabel=true
                              :fixedWidth=600
                              :regionStart="selectedGene.start"
                              :regionEnd="selectedGene.end"
                              :showXAxis=false
                              :d3="d3"
                              @transcript-selected="onTranscriptSelected">
                    </gene-viz>
                </div>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn small class="mb-2" raised @click.native.stop="onTranscriptVizClose">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-menu>
    </div>
</template>

<script>
    import GeneViz from '../viz/GeneViz.vue'

    export default {
        name: 'transcripts-viz',
        components: {
            GeneViz
        },
        props: {
            selectedGene: {},
            selectedTranscript: {},
            geneSources: null,
            geneModel: null,
            d3: null
        },
        data() {
            return {
                margin: {top: 5, right: 5, bottom: 5, left: 200},
                trackHeight: 20,
                cdsHeight: 15,
                showTranscriptsMenu: false,
                newTranscript: null,
                geneSource: null,
                isCanonical: true
            }
        },

        mounted: function () {
            this.geneSource = this.geneModel.geneSource;
        },

        methods: {
            onTranscriptSelected: function (theTranscript) {
                this.newTranscript = theTranscript;
                let canonical = this.geneModel.getCanonicalTranscript(this.selectedGene);
                this.isCanonical = canonical.transcript_id === this.newTranscript.transcript_id;
                if (this.newTranscript == null) {
                    this.newTranscript = this.selectedTranscript;
                }
                this.$emit('transcriptSelected', this.newTranscript);
                this.showTranscriptsMenu = false;
            },
            onTranscriptVizClose: function () {
                var self = this;
                self.showTranscriptsMenu = false;
            },
            onGeneSourceSelected: function () {
                let self = this;
                self.$emit('gene-source-selected', self.geneSource);
            },

        },


    }
</script>


