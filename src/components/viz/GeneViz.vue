<style lang="sass">
.iobio-gene .axis
  line, path
    fill: none
    stroke: lightgrey
    shape-rendering: crispEdges
    stroke-width: 3px

  .iobio-gene .brush .extent
    stroke: #000
    fill-opacity: .125
    shape-rendering: crispEdges
</style>

<style type="text/css">
.ibo-gene .cds, .ibo-gene .exon, .ibo-gene .utr {
  fill: rgba(167, 167, 167, 0.63);
  stroke: rgb(159, 159, 159);
}

#transcript-menu-item.ibo-gene .transcript.selected .utr,
#transcript-menu-item.ibo-gene .transcript.selected .exon,
#transcript-menu-item.ibo-gene .transcript.selected .cds {
  fill: #2196f3 !important;
  stroke: #2196f3 !important;
}

#transcript-menu-item.ibo-gene .transcript.current .utr,
#transcript-menu-item.ibo-gene .transcript.current .exon,
#transcript-menu-item.ibo-gene .transcript.current .cds {
  fill: rgb(119, 167, 19) !important;
  stroke: rgb(74, 130, 11) !important;
}

#transcript-menu-item.ibo-gene .utr:hover,
#transcript-menu-item.ibo-gene .cds:hover,
#transcript-menu-item.ibo-gene .exon:hover,
#transcript-menu-item.ibo-gene .reference:hover {
  cursor: pointer;
}

#transcript-menu-item.ibo-gene .transcript.current .reference {
  stroke: rgb(0, 0, 0);
  stroke-width: 1.5px;
}

#transcript-menu-item.ibo-gene .transcript.selected .reference {

  stroke-width: 2px;
}

.ibo-gene .reference {
  stroke: rgb(150, 150, 150);
}

.ibo-gene .name {
  font-size: 13px;
  fill: rgb(120, 120, 120);
}

#transcript-menu-item.ibo-gene .transcript.selected .name {
  font-style: italic;
  font-size: 13px;
  fill: #2196f3 !important;
}

#transcript-menu-item.ibo-gene .transcript.current .name {
  font-weight: bold;
  font-style: italic;
  fill: black;
  font-size: 13px;
}

#transcript-menu-item.ibo-gene .transcript .name:hover {
  cursor: pointer;
}

#transcript-menu-item.ibo-gene .name {
  font-size: 14px;
  fill: rgb(120, 120, 120);
}

#transcript-menu-item.ibo-gene .type {
  font-size: 14px;
  fill: rgb(205, 71, 40);
  font-style: italic;
}

.ibo-gene .arrow {
  stroke: rgb(150, 150, 150);
  fill: none;
}

.ibo-gene .axis path, .ibo-gene .axis line {
  fill: none;
  stroke: lightgrey;
  shape-rendering: crispEdges;
}

.ibo-gene .tooltip {
  position: absolute;
  text-align: center;
  z-index: 20;
  color: white;
  padding: 4px 6px 4px 6px;
  font: 11px arial;
  background: rgb(80, 80, 80);
  border: 0px;
  border-radius: 4px;
  pointer-events: none;
}

.transcript .selection-box {
  fill: transparent;
}

.brush .extent {
  stroke: #000;
  fill-opacity: 0.125;
  shape-rendering: crispEdges;
}

.resize {
  display: inline !important;
  fill: #7A7A7A;
  fill-opacity: 1;
  stroke: #7A7A7A;
  stroke-width: 3px;

}

</style>

<style lang="sass">

@import ../../assets/sass/variables

#gene-viz.ibo-gene
  .cds.danger
    fill: $danger-exon-color
    stroke: $danger-exon-border-color

  .utr.danger
    fill: $danger-exon-color
    stroke: $danger-exon-border-color

  .gene.x.axis
    font-size: 14px !important

#gene-pseudo-ideo
  position: absolute
  bottom: 28%
  left: 23%
  z-index: 2

  .chrLabel
    font-family: Quicksand
    font-size: 12px
    color: #888

  .bands
    display: none !important

#gene-ideo
  position: absolute
  bottom: 28%
  left: 23%
  z-index: 3

  .chrLabel
    display: none

  .acen
    fill: #DDD !important

  .gvar
    fill: #EEE !important

  .stalk
    fill: #AAA !important

#gene-container
  position: relative
  margin-top: 20px

  #gene-viz
    padding-top: 20px

</style>

<template>
  <v-container id="gene-container" style="position: relative" class="pb-0">
    <div id="gene-ideo"></div>
    <div id="gene-pseudo-ideo"></div>
    <div id="gene-viz"></div>
  </v-container>
</template>

<script>
import geneD3 from '../../d3/Gene.d3.js'
import Ideogram from "ideogram";

export default {
  name: 'gene-viz',
  props: {
    data: {},
    regionStart: {
      default: 0,
      type: Number
    },
    regionEnd: {
      default: 0,
      type: Number
    },
    chr: {
      default: "",
      type: String
    },
    geneName: {
      default: "",
      type: String
    },
    height: {
      default: 100,
      type: Number
    },
    width: {
      default: 100,
      type: Number
    },
    trackHeight: {
      default: 20,
      type: Number
    },
    cdsHeight: {
      default: 20,
      type: Number
    },
    margin: {
      type: Object,
      default: function () {
        return {top: 0, bottom: 0, left: 10, right: 10}
      }
    },
    transcriptClass: {
      type: Function,
      default: function (d) {
        if (d.isCanonical) {
          return 'transcript current';
        } else {
          return 'transcript';
        }
      }
    },
    featureClass: {
      type: Function,
      default: function (d) {
        return d.feature_type.toLowerCase();
      }
    },
    showLabel: {
      type: Boolean,
      default: false
    },
    showXAxis: {
      type: Boolean,
      default: true
    },
    fixedWidth: {
      type: Number,
      default: 0
    },
    isZoomTrack: {
      type: Boolean,
      default: false
    },
    zoomSwitchOn: {
      type: Boolean,
      default: false
    },
    displayOnly: {
      type: Boolean,
      default: false
    },
    $: {
      type: Function,
      default: null
    },
    d3: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      geneChart: {},
      ideograms: []
    }
  },
  mounted: function () {
    this.drawGene();
    this.drawChr();
    this.updateGene(false); // Don't want to show zoom brush on mount
  },
  methods: {
    drawChr: function () {
      let strippedChr = this.chr;
      if (strippedChr && strippedChr.startsWith('chr')) {
        strippedChr = this.chr.substring(3);
      }

      const chrWidth = 15;
      const chrHeight = this.width * 0.7;

      // Draw pseudo-ideogram with gene marker annotation
      this.d3.select('#gene-pseudo-ideo').select('svg').remove();

      const pseudoConfig = {
        organism: 'human',
        assembly: this.assemblyVersion,
        container: ('#gene-pseudo-ideo'),
        orientation: 'horizontal',
        chrHeight: chrHeight,
        chrWidth: chrWidth,
        chromosome: strippedChr,
        annotations: [{
          color: '#194d81',
          chr: strippedChr,
          start: +this.regionStart,
          stop: +this.regionEnd,
          name: (this.geneName + " Location")
        }],
        annotationsLayout: 'tracks',
        showAnnotTooltip: false,
        showBandLabels: false
      };
      let pseudoIdeo = new Ideogram(pseudoConfig);
      this.ideograms.push(pseudoIdeo);

      // Draw main ideogram on top
      this.d3.select('#gene-ideo').select('svg').remove();

      const config = {
        organism: 'human',
        assembly: this.assemblyVersion,
        container: ('#gene-ideo'),
        orientation: 'horizontal',
        chrHeight: chrHeight,
        chrWidth: chrWidth,
        chromosome: strippedChr,
        annotationsLayout: 'overlay',
        showAnnotTooltip: false
      };
      let ideo = new Ideogram(config);
      this.ideograms.push(ideo);

    },
    drawGene: function () {
      const self = this;

      let options = {
        regionStart: self.regionStart,
        regionEnd: self.regionEnd,
        width: self.fixedWidth > 0 ? self.fixedWidth : self.width,
        widthPercent: '100%',
        heightPercent: '100%',
        margin: self.margin,
        showXAxis: true,
        drawBrush: self.isZoomTrack,
        showBrush: false,
        trackHeight: self.trackHeight,
        cdsHeight: self.cdsHeight,
        showLabel: self.showLabel,
        transcriptClass: self.transcriptClass,
        color: '#194d81',
        displayOnly: self.displayOnly,
        divId: "gene-viz"
      };
      self.geneChart = geneD3(self.d3, options);

      let dispatch = self.geneChart.getDispatch();
      dispatch.on("d3brush", function (brush) {
        if (!brush.empty()) {
          let regionStart = self.d3.round(brush.extent()[0]);
          let regionEnd = self.d3.round(brush.extent()[1]);
          self.$emit('region-zoom', regionStart, regionEnd);
        } else {
          // Only being hit once
          self.$emit('region-zoom-reset');
        }
      })
          .on("d3selected", function (d) {
            self.$emit('transcript-selected', d);
          })
          .on("d3featuretooltip", function (featureObject, feature, lock) {
            self.$emit("feature-selected", featureObject, feature, lock);
          });
    },
    updateGene: function () {
      const self = this;
      if (self.data && self.data.length > 0 && self.data[0] != null && Object.keys(self.data[0]).length > 0) {
        let options = {
          regionStart: self.regionStart,
          regionEnd: self.regionEnd,
          width: self.fixedWidth > 0 ? self.fixedWidth : self.$el.clientWidth
        };
        this.geneChart.updateSize(options);

        if (this.geneChart.getWidth() > 0) {
          let selection = self.d3.select(this.$el).datum(self.data);
          // this.geneChart.showZoomBrush(showZoomBrush);
          this.geneChart(selection);
        }
      }
    },
    toggleBrush: function (showBrush, container) {
      const self = this;
      self.geneChart.toggleBrush()(showBrush, container);
    },
    concatKeys: function (transcripts) {
      if (transcripts) {
        return transcripts.map(function (tx) {
          return tx && tx.transcript_id ? tx.transcript_id : '';
        }).join(" ");
      } else {
        return "";
      }
    }
  },
  watch: {
    data: function (newData, oldData) {
      const self = this;
      if (self && self.$(self.$el).find("svg").length === 0 || self.concatKeys(newData) != self.concatKeys(oldData)) {
        self.updateGene(false);
        self.drawChr();
      }
    },
    regionStart: function () {
      const self = this;
      const showZoomBrush = self.isZoomTrack && self.zoomSwitchOn;
      self.updateGene(showZoomBrush);
    }
  }
}
</script>