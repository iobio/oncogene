<style lang="sass">
@import "../../assets/sass/_variables.sass"

#transcriptMenuId
  font-family: Raleway, sans-serif
  font-size: 12px

#edit-transcript-button
  color: $app-color
  margin: 0 8px 0 0
  padding: 0

#select-transcript-viz
  .selected
    outline: solid 1px red

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
    font-family: Raleway, serif

    .input-group--select
      .input-group__selections__comma
        font-size: 18px
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
  font-family: Quicksand, sans-serif
  font-size: 18px
  background-color: #194d81
  color: white

.t-menu
  .transcript
    .name
      font-size: 15px
      line-height: normal
      font-family: 'Open Sans', sans-serif
      color: #888888
    .type
      font-family: 'Open Sans', sans-serif
      font-size: 14px
      color: #888888

.v-menu__content
  overflow-y: hidden


</style>


<template>
  <div class="d-inline-flex" id="transcript-menu">
    <v-menu offset-y
            left
            bottom
            max-height="700"
            :min-width="trackWidth"
            origin="center center"
            transition="scale-transition"
            content-class="t-menu"
            class="menu-class"
            :value="showTranscriptsMenu"
            :close-on-content-click="false"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn id="edit-transcript-button"
               v-bind="attrs"
               v-on="on"
               @click="increaseKey"
               text>
          {{ transcriptText }}
          <v-icon>expand_more</v-icon>
          <v-icon v-if="!selectedTranscript.isCanonical"
                  small
                  color="#eed202">
            warning
          </v-icon>
        </v-btn>
      </template>
      <v-card id="select-transcripts-box">
        <v-card-title class="tscript-headline">
          <span>Transcript Info</span>
        </v-card-title>
        <v-row id="gene-source-box" class="px-5">
          <v-col sm="6">
            <div class="pt-1" style="font-size: 18px">
              <span>Selected: </span>
              <span style="font-weight: 500">{{ selectedTranscript.transcript_id }}</span>
              <v-icon v-if="!selectedTranscript.isCanonical"
                      small
                      color="#eed202"
                      class="px-2">
                warning
              </v-icon>
              <v-chip v-if="!selectedTranscript.isCanonical" x-small>Non-Canonical</v-chip>
            </div>
          </v-col>
          <v-col sm="3" offset-sm="3" class="py-1">
            <v-select class="selection-box"
                      v-bind:items="geneSources"
                      v-model="geneSource"
                      label="Gene source"
                      color="#10487f"
                      item-value="text"
                      @input="onGeneSourceSelected">
            </v-select>
          </v-col>
        </v-row>
        <div :id="transcriptMenuId" class="px-2" :style="'overflow-y: scroll; height: 400px'">
          <gene-viz id="select-transcript-viz"
                    :key="refreshKey"
                    :data="selectedGene.transcripts"
                    :margin="margin"
                    :trackHeight="trackHeight"
                    :cdsHeight="cdsHeight"
                    :showLabel="true"
                    :fixedWidth="trackWidth"
                    :regionStart="selectedGene.start"
                    :regionEnd="selectedGene.end"
                    :showXAxis="false"
                    :d3="d3"
                    :divId="transcriptMenuId"
                    :selectedTranscriptId = selectedTranscript.transcript_id
                    :inDialog="true"
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
      margin: {top: 5, right: 5, bottom: 5, left: 5},
      trackHeight: 25,
      trackWidth: 850,
      cdsHeight: 25,
      showTranscriptsMenu: false,
      newTranscript: null,
      geneSource: null,
      isCanonical: true,
      transcriptMenuId: 'transcript-gene-viz',
      refreshKey: 1
    }
  },
  computed: {
    transcriptText: function () {
      return this.$vuetify.breakpoint.width > 1750 ? ('Transcript ' + this.selectedTranscript.transcript_id) : 'Transcript';
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
      this.showTranscriptsMenu = false;
    },
    onGeneSourceSelected: function () {
      this.$emit('gene-source-selected', self.geneSource);
    },
    increaseKey: function() {
      const self = this;
      self.refreshKey++;
      self.showTranscriptsMenu = true;
    },
  },


}
</script>


