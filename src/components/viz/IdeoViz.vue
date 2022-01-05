<style lang="sass">
.cnv-svg
  margin-top: -20px !important

.cnv-pseudo-ideo
  position: absolute
  bottom: 96%
  left: 38%
  z-index: 4

  .bands
    display: none !important

  .chrLabel
    font-family: Quicksand !important
    font-size: 11px !important
    color: #888 !important

.cnv-ideo
  position: absolute
  bottom: 96%
  left: 38%
  z-index: 5

  .chrLabel
    display: none

.gene-pseudo-ideo
  position: absolute
  bottom: -8%
  left: 25.5%
  z-index: 2

  .chrLabel
    font-family: Quicksand
    font-size: 12px
    color: #888

  .bands
    display: none !important

.gene-ideo
  position: absolute
  bottom: -8%
  left: 25.5%
  z-index: 3

  .chrLabel
    display: none

  .acen
    fill: #DDD !important

  .gvar
    fill: #EEE !important

  .stalk
    fill: #AAA !important

.gene-ideo-label
  padding-left: 35%
  padding-bottom: 7px
  font-size: 12px


</style>

<template>
  <v-container pa-0>
    <div v-if="inGeneCard" class="gene-ideo-label">{{ selectedGene.chr }}</div>
    <div :id="getIdeoId(false)" :class=getIdeoClass(false)></div>
    <div :id="getIdeoId(true)" class="cnv-pseudo-ideo"></div>
  </v-container>
</template>

<script>
import Ideogram from "ideogram";

export default {
  name: 'ideo-viz',
  props: {
    model: {}, // SampleModel
    selectedGene: {},
    margin: {
      type: Object,
      default: function () {
        return {top: -10, bottom: 10, left: 10, right: 10}
      }
    },
    width: {
      type: Number,
      default: 0
    },
    cnvPalette: {
      type: Object,
      default: function () {
        return {
          tcnRed: "rgb(200, 18, 18, 0.5)",
          tcnBlue: "rgb(25, 77, 129, 0.5)",
          tcnGray: "rgb(204, 199, 155, 0.5)"
        }
      }
    },
    inGeneCard : {
      type: Boolean,
      default: false
    },
    assemblyVersion: {
      type: String,
      default: ''
    },
  },
  data() {
    return {
      data: null,  // cnvs that go into d3 viz
      ideograms: [], // gets rid of linter error and allows two ideograms
    }
  },
  mounted: function () {
    if (this.inGeneCard) {
      this.drawChrLevel();
    }
  },
  methods: {
    drawChrLevel: function () {
      let strippedChr = this.selectedGene.chr;
      if (strippedChr && strippedChr.startsWith('chr')) {
        strippedChr = this.selectedGene.chr.substring(3);
      }
      let annotations = [];
      // Fill in CNVs for variant card
      if (this.data && !this.inGeneCard) {
        let cnvObjs = this.data.matchingCnvs;
        let i = 0;
        cnvObjs.forEach(cnvObj => {
          annotations.push({
            color: this.getCnvColor(cnvObj.tcn, cnvObj.lcn),
            chr: strippedChr,
            start: cnvObj.start,
            stop: cnvObj.end,
            name: 'CNV ' + (i + 1),
          });
          i++;
        })
      }

      const chrWidth = 12;
      const chrHeight = (this.width * 0.5); // Ideogram orientation is rotated

      // Draw pseudo-ideogram with gene marker annotation
      const pseudoConfig = {
        organism: 'human',
        assembly: this.assemblyVersion,
        container: ('#' + this.getIdeoId(true)),
        orientation: 'horizontal',
        chrHeight: chrHeight,
        chrWidth: chrWidth,
        chromosome: strippedChr,
        annotations: [{
          color: '#194d81',
          chr: strippedChr,
          start: +this.selectedGene.start,
          stop: +this.selectedGene.end,
          name: (this.selectedGene.gene_name + " Location")
        }],
        annotationsLayout: 'tracks',
        showAnnotTooltip: false,
        showBandLabels: false,
        showChromosomeLabels: true
      };
      let pseudoIdeo = new Ideogram(pseudoConfig);
      this.ideograms.push(pseudoIdeo);

      // Draw main ideogram on top
      let config = {};
      if (this.inGeneCard) {
        // Have to leave out annotations prop completely (can't be empty array)
        config = {
          organism: 'human',
          assembly: this.assemblyVersion,
          container: ('#' + this.getIdeoId(false)),
          orientation: 'horizontal',
          chrHeight: chrHeight,
          chrWidth: chrWidth,
          chromosome: strippedChr,
          annotationsLayout: 'overlay',
          chrFillColor: (this.inGeneCard ? 'transparent' : 'white'),
          showBandLabels: this.inGeneCard,
          showAnnotTooltip: false,
        };
      } else {
        config = {
          organism: 'human',
          assembly: this.assemblyVersion,
          container: ('#' + this.getIdeoId(false)),
          orientation: 'horizontal',
          chrHeight: chrHeight,
          chrWidth: chrWidth,
          chromosome: strippedChr,
          annotations: annotations,
          annotationsLayout: 'overlay',
          chrFillColor: (this.inGeneCard ? 'transparent' : 'white'),
          showBandLabels: this.inGeneCard,
          showAnnotTooltip: false,
        };
      }
      let ideo = new Ideogram(config);
      this.ideograms.push(ideo);
    },
    getCnvColor: function (tcn, lcn) {
      if (tcn === 2 && lcn !== 1) {
        return this.cnvPalette.tcnGray;
      } else if (tcn > 2) {
        return this.cnvPalette.tcnBlue;
      } else if (tcn < 2) {
        return this.cnvPalette.tcnRed;
      } else {
        console.log("WARNING: fed in non-abnormal CNV to ideogram");
      }
    },
    getIdeoId: function (isPseudo) {
      return 'cnv-' + (isPseudo ? 'psuedo-' : '') + 'ideo-' + (this.inGeneCard ? 'gene' : this.model.id);
    },
    getIdeoClass : function (isPseudo) {
      return (this.inGeneCard ? 'gene-' : 'cnv-') + (isPseudo ? 'pseudo-' : '') + 'ideo';
    }
  },
  watch: {
    'model.cnvsOnSelectedChrom': function () {
      if (this.model && !this.inGeneCard) {
        this.data = this.model.cnvsOnSelectedChrom;
        this.drawChrLevel();
      }
    },
    selectedGene: function () {
      if (this.inGeneCard) {
        this.drawChrLevel();
      } else {
        if (this.model) {
          this.data = this.model.cnvsOnSelectedChrom;
          this.drawChrLevel();
        }
      }
    }
  }
}
</script>