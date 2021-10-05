<!-- Subclone visualizations over time.
     SJG updated Sept2021 -->

<style lang="sass">
#raw-bam-dialog
  font-family: Quicksand

  .raw-bam-headline
    font-size: 20px
    background-color: #7f1010
    color: white

.summary-card
  height: 100%

.summary-field-label
  color: #b4b3b3
  font-style: italic
  font-size: 12px
  padding-left: 2px
  text-align: left

.subclone-viz
  min-height: 100px
  max-height: 700px
  padding-top: 0px
  overflow-x: hidden

  .content
    font-size: 12px
    padding-left: 10px
    margin-bottom: 0px
    float: left
    max-width: 350px
    min-width: 350px

  .field-label
    color: #b4b3b3
    font-style: italic
    padding-left: 6px
    text-align: right

  .field-label-header
    color: #7f7f7f
    font-style: italic
    padding-left: 2px
    text-align: left
    font-family: 'Quicksand'

  .subtitle-label
    color: #7f7f7f
    font-style: italic
    padding-left: 6px
    text-align: center

  .field-value
    padding-right: 25px
    padding-left: 5px
    word-break: break-word

  .summary-field-value
    font-size: 12px
    word-break: break-word
    padding-left: 1px
    padding-right: 1px
    color: #888888
    text-align: left

  .cohort-summary-field-value
    font-size: 12px
    word-break: break-word
    padding-left: 1px
    padding-right: 1px
    padding-top: 5px !important

    #inheritance
      height: 18px

    #coverage-svg
      float: left

      rect
        &.alt-count
          stroke: black !important

        &.ref-count
          stroke: black !important
          fill: none !important

        &.alt-count
          fill: #6A9C2F !important

        &.other-count
          stroke: black !important
          fill: rgb(132, 132, 132) !important

      text
        font-size: 12px !important

        &.alt-count
          fill: white !important

        &.alt-count-under
          fill: $text-color !important

        &.other-count
          fill: white !important
          font-style: italic !important

        &.other-count-under
          fill: $text-color !important
          font-style: italic !important

        &.ref-count
          fill: $text-color !important

      .header-small
        overflow-wrap: break-word
        text-align: left
        width: 85px
        float: left
        color: $tooltip-label-color
        fill: $tooltip-label-color

      .allele-count-bar
        text
          font-size: 11px !important
          fill: $text-color

      #allele-count-legend
        padding-top: 0px

      .affected-symbol
        font-size: 14px
        color: $danger-color !important
        float: right
        padding-right: 2px

      .allele-count-bar
        overflow-wrap: break-word
        float: left
        width: 120px
        min-height: 25px

      .ped-info
        width: 270px
        clear: both
        line-height: 13px !important

      .ped-label
        padding-top: 0px
        vertical-align: top
        text-align: left
        width: 69px
        float: left
        font-size: 12px
        color: $text-color

      .ped-zygosity
        width: 75px
        float: left

      .zygosity
        float: left
        font-size: 9px
        font-weight: normal !important
        padding-top: 1px !important
        padding-bottom: 0px !important
        padding-right: 0px !important
        padding-left: 0px !important
        background-color: #D3D5D8 !important
        margin-right: 2px
        margin-top: 0px !important
        width: 39px !important
        color: black
        border: solid thin rgba(0, 0, 0, 0.22)
        cursor: none
        pointer-events: none

      .zygosity
        &.hom
          background-color: rgba(165, 48, 48, 0.76) !important
          color: white

        &.homref
          background-color: #5D809D !important
          color: rgba(255, 255, 255, 1)

        &.unknown
          background-color: #b9edf3 !important

        &.none
          background-color: transparent !important
          border: solid thin #5D809D !important
</style>

<template>
  <v-card class="px-0 mx-1 my-1" outlined>
    <v-container class="summary-card">
      <v-row no-gutters flat style="font-family: Quicksand">
        <v-col cols="12" sm="12" xl="12" style="font-size: 22px">
          Subclone Evolution
        </v-col>
      </v-row>
      <v-container fluid grid-list-md style="overflow-y: scroll !important; padding-top: 0">
        <v-row wrap>
          <subclone-tree-viz id="subclone-tree-viz" class="subclone-viz"
                             style="padding-top: 20px"
                             ref="subcloneTreeVizRef"
                             v-if="subcloneModel.possibleTrees.length > 0"
                             :subcloneModel="subcloneModel"
                             :d3="d3"
                             :colors="colors"
                             @display-subclone-dialog="displaySubcloneDialog">
          </subclone-tree-viz>
          <subclone-bar-viz id="subclone-bar-viz" class="subclone-viz"
                            style="padding-top: 30px; padding-bottom: 30px"
                            v-if="subcloneModel.possibleTrees.length > 0"
                            ref="subcloneBarVizRef"
                            :subcloneModel="subcloneModel"
                            :d3="d3"
                            :colors="colors"
                            :width="width">
          </subclone-bar-viz>
        </v-row>
        <v-row no-gutters justify="center">
          <v-pagination v-model="subcloneIdx"
                        :length="subcloneModel.possibleTrees.length"
                        @next="transitionViz"
                        @input="transitionViz"
                        @previous="transitionViz"></v-pagination>
        </v-row>
      </v-container>
    </v-container>
  </v-card>
</template>


<script>
import SubcloneBarViz from "./viz/SubcloneBarViz.vue"
import SubcloneTreeViz from "./viz/SubcloneTreeViz.vue"

export default {
  name: 'subclone-summary-card',
  components: {
    SubcloneBarViz,
    SubcloneTreeViz,
  },
  props: {
    subcloneModel: null,
    d3: null,
    $: null,
    width: null
  },
  data() {
    return {
      subcloneIdx: 1,
      colors: {
        "n": "white",
        "C1": "#F8B195",
        "C2": "#F67280",
        "C3": "#6C5B7B",
        "C4": "#C06C84",
        "C5": "#355C7D",
        "C6": "#43719F",
        "C7": "#F59D3D",
        "C8": "#9B6A97",
        "C9": "#398949",
        "C10": "#5B8DB8",
        "C11": "#FFC686",
        "C12": "#BE89AC",
        "C13": "#61AA57",
        "C14": "#7AAAD0",
        "C15": "#9D7760",
        "C16": "#D5A5C4",
        "C17": "#7DC470",
        "C18": "#9BC7E4",
        "C19": "#BBB1AC",
        "C20": "#BADDF1",
        "C21": "#F1CF63",
        "C22": "#EFC9E6",
        "C23": "#B4E0A7"
      }
    }
  },
  methods: {
    transitionViz: function () {
      this.$refs.subcloneBarVizRef.changeViz(this.subcloneIdx);
      this.$refs.subcloneTreeVizRef.changeViz(this.subcloneIdx);
    },
    highlightNode: function(subcloneId) {
      this.$refs.subcloneTreeVizRef.highlightNode(subcloneId);
    },
    displaySubcloneDialog: function(subcloneId) {
      this.$emit('display-subclone-dialog', subcloneId);
    }
  }
}
</script>