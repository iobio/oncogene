<style lang="sass">
#ideogram-viz
  line
    stroke-width: 1px !important
    stroke: #888 !important

.cnv-svg
  margin-top: -20px !important

.cnv-pseudo-ideo
  position: absolute
  bottom: 96%
  left: 38%
  z-index: 3

  .chrLabel
    font-family: Quicksand !important
    font-size: 11px !important
    color: #888 !important

  .annot
    path, line
      fill: yellow
      stroke: #888
      transform: translate(0, 2.5px)


.cnv-ideo
  position: absolute
  bottom: 96%
  left: 38%
  z-index: 4

  .chrLabel
    display: none

.cnv-highlight-ideo
  position: absolute
  bottom: 96%
  left: 38%
  z-index: 5

  .chrLabel
    display: none

  .chromosome
    .bands
      display: none !important
    .annot
      stroke-width: 3
      stroke: #3586c0

.gene-pseudo-ideo
  position: absolute
  bottom: -2%
  left: 30%
  z-index: 3

  .chrLabel
    display: none

  .bands
    display: none !important

  .annot
    path, line
      stroke: #888
      fill: yellow
      transform: translate(0, 2.5px)

.gene-ideo
  position: absolute
  bottom: -2%
  left: 30%
  z-index: 4

  .chrLabel
    display: none

  .acen
    fill: #DDD !important

  .gvar
    fill: #EEE !important

  .stalk
    fill: #AAA !important

.gene-ideo-label
  padding-left: 42%
  margin-top: -15px
  font-size: 12px

</style>

<template>
  <v-container id="ideogram-viz" pa-0>
    <div v-if="inGeneCard" class="gene-ideo-label">{{ selectedGene.chr }}</div>
    <div :id="getIdeoId(true, false)" :class="getIdeoClass(true, false)"></div>
    <div :id="getIdeoId(false, false)" :class="getIdeoClass(false, false)"></div>
    <div v-if="!inGeneCard" :id="getIdeoId(false, true)" :class="getIdeoClass(false, true)"></div>
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
    d3: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      data: null,  // cnvs that go into d3 viz
      ideo: null,
      pseudoIdeo: null,
      highlightIdeo: null,
      chrWidth: 12,
      showHighlight: false,
      highlightConfig: null,
    }
  },
  computed: {
    chrHeight: function() {
      return this.width * 0.5; // Ideogram orientation is rotated
    },
    strippedChr: function() {
      let chrom = this.selectedGene.chr;
      if (chrom && chrom.startsWith('chr')) {
        return chrom.substring(3);
      } else {
        return chrom;
      }
    }
  },
  mounted: function () {
    if (this.inGeneCard) {
      this.drawChrLevel();
    }
  },
  methods: {
    drawChrLevel: function () {
      let pseudoId = this.getIdeoId(true, false);
      this.d3.select('#' + pseudoId).style("opacity", 0);
      this.pseudoIdeo = null;
      this.ideo = null;

      let annotations = [];
      // Fill in CNVs for variant card
      if (this.data && !this.inGeneCard) {
        let cnvObjs = this.data.matchingCnvs;
        let i = 0;
        cnvObjs.forEach(cnvObj => {
          annotations.push({
            color: this.getCnvColor(cnvObj.tcn, cnvObj.lcn),
            chr: this.strippedChr,
            start: cnvObj.start,
            stop: cnvObj.end,
            name: 'CNV ' + (i + 1),
            id: 'test'
          });
          i++;
        })
      }

      // Draw pseudo-ideogram with gene marker annotation
      const pseudoConfig = {
        organism: 'human',
        assembly: this.assemblyVersion,
        container: ('#' + this.getIdeoId(true, false)),
        orientation: 'horizontal',
        chrHeight: this.chrHeight,
        chrWidth: this.chrWidth,
        chromosome: this.strippedChr,
        annotations: [{
          color: '#194d81',
          chr: this.strippedChr,
          start: +this.selectedGene.start,
          stop: +this.selectedGene.end,
          name: (this.selectedGene.gene_name + " Location")
        }],
        annotationsLayout: 'tracks',
        showAnnotTooltip: false,
        showBandLabels: false,
        showChromosomeLabels: true,
        onDrawAnnots: this.appendGeneLength
      };
      this.pseudoIdeo = new Ideogram(pseudoConfig);

      // Draw main ideogram on top
      let config = {};
      if (this.inGeneCard) {
        // Have to leave out annotations prop completely (can't be empty array)
        config = {
          organism: 'human',
          assembly: this.assemblyVersion,
          container: ('#' + this.getIdeoId(false, false)),
          orientation: 'horizontal',
          chrHeight: this.chrHeight,
          chrWidth: this.chrWidth,
          chromosome: this.strippedChr,
          annotationsLayout: 'overlay',
          chrFillColor: 'transparent',
          showBandLabels: this.inGeneCard,
          showAnnotTooltip: false,
        };
      } else {
        config = {
          organism: 'human',
          assembly: this.assemblyVersion,
          container: ('#' + this.getIdeoId(false, false)),
          orientation: 'horizontal',
          chrHeight: this.chrHeight,
          chrWidth: this.chrWidth,
          chromosome: this.strippedChr,
          annotations: annotations,
          annotationsLayout: 'overlay',
          chrFillColor: 'white',
          showBandLabels: this.inGeneCard,
          showAnnotTooltip: false,
        };
      }
      this.ideo = new Ideogram(config);
      this.d3.select('#' + pseudoId).style("opacity", 1);
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
    getIdeoId: function (isPseudo, isHighlight) {
      return 'cnv-' + (isPseudo ? 'psuedo-' : isHighlight? 'highlight-' : '') + 'ideo-' + (this.inGeneCard ? 'gene' : this.model.id);
    },
    getIdeoClass: function (isPseudo, isHighlight) {
      return (this.inGeneCard ? 'gene-' : 'cnv-') + (isPseudo ? 'pseudo-' : isHighlight ? 'highlight-' : '') + 'ideo';
    },
    // This actually draws another ideogram on top, with a highlighted border
    // This is only called on variant card refs, so don't need inGeneCard logic
    highlightSegment: function(cnvObj) {
      let start = 0;
      let end = 0;
      if (cnvObj && cnvObj.matchingCnvs.length > 0) {
        start = cnvObj.matchingCnvs[0].start;
        end = cnvObj.matchingCnvs[0].end;
      }

      let selectedAnnotation = {
        color: "rgba(255, 255, 255, 0.1)",
        chr: this.strippedChr,
        start: start,
        stop: end,
        name: 'selected-CNV-' + this.model.id,
      };

      let id = this.getIdeoId(false, true);
      this.highlightConfig = {
        organism: 'human',
        assembly: this.assemblyVersion,
        container: ('#' + id),
        orientation: 'horizontal',
        chrHeight: this.chrHeight,
        chrWidth: this.chrWidth,
        chromosome: this.strippedChr,
        annotations: [selectedAnnotation],
        annotationsLayout: 'overlay',
        chrFillColor: 'transparent',
        showBandLabels: this.inGeneCard,
        showAnnotTooltip: false,
      };
      this.highlightIdeo = new Ideogram(this.highlightConfig);
      // Need timeout so we don't get flash from previously drawn highlight ideo
      setTimeout(() => {
        this.d3.select('#' + id).style('opacity', 1);
      }, 200);
    },
    removeHighlight: function() {
      let id = this.getIdeoId(false, true);
      this.d3.select('#' + id).style("opacity", 0);
      this.highlightIdeo = null;
    },
    appendGeneLength: function() {
      if (this.inGeneCard) {
        let geneLength = this.selectedGene.end - this.selectedGene.start;
        geneLength = new Intl.NumberFormat().format(geneLength);
        let id = this.getIdeoId(true, false);
        let geneMarkerEl = this.d3.select('#' + id).select('.annot');
        let geneMarkerBbox = geneMarkerEl.node().getBBox();
        geneMarkerEl.append('text')
            .attr('x', (geneMarkerBbox.x + 15) + 'px')
            .attr('y', geneMarkerBbox.y + 8)
            .text(geneLength + ' bp');
      }
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
        this.removeHighlight();
        if (this.model) {
          this.data = this.model.cnvsOnSelectedChrom;
          this.drawChrLevel();
        }
      }
    }
  }
}
</script>