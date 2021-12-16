<template>
  <v-card class='full-width'>
    <v-card-title class="section-title">Sample {{selectedCnv.selectedSample}} Copy Number Details</v-card-title>
    <v-card-text id="dialog-card-text" class="px-5">
      <div class="pb-3 pt-3">
        <div class="dialog-label">Chromosomal View</div>
        <div :class="this.numCnvs > 1 ? 'legendIdeo' : 'compactIdeo'" id="ideo-container"></div>
      </div>
      <div>
        <div class="py-1 dialog-label">Gene View</div>
        <div id="cnv-dialog-shading" style="display: block; margin-left: auto; margin-right: auto;"></div>
        <div id="cnv-dialog-gene" style="display: block; margin-left: auto; margin-right: auto; margin-top: -40px"></div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import Ideogram from "ideogram";
import cnvD3 from '../d3/Cnv.d3.js'
import geneD3 from '../d3/Gene.d3.js'

export default {
  name: "cnv-dialog",
  props: {
    selectedGene: {
      type: Object,
      default: null
    },
    selectedTranscript: {
      type: Array,
      default: null
    },
    selectedCnv: {
      type: Object,
      default: null
    },
    assemblyVersion: {
      type: String,
      default: ''
    },
    maxTcn: {
      type: Number,
      default: 2
    },
    width: {
      type: Number,
      default: 0
    },
    d3: {
      type: Object,
      default: null
    },
    dialogOpen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      cnvChart: {},
      geneChart: {},
      loadingIdeogram: true,
      transcriptClass: function (d) {
        if (d.isCanonical) {
          return 'transcript current';
        } else {
          return 'transcript';
        }
      },
      cnvColors: ['rgb(127, 16, 16, 0.5)', 'rgb(204, 151, 142, 0.5)', 'rgb(0, 119, 136, 0.5)', 'rgb(38, 20, 71, 0.5)', 'rgb(243, 156, 107, 0.5)', 'rgb(192, 189, 165, 0.5)']
    }
  },
  watch: {
    'dialogOpen': {
      handler(newVal) {
        if (newVal === true) {
          this.loadingIdeogram = true;
          this.drawCnv();
        }
      },
      deep: true
    }
  },
  computed: {
    numCnvs: function() {
      if (this.selectedCnv && this.selectedCnv.cnvObj && this.selectedCnv.cnvObj.matchingCnvs) {
        return this.selectedCnv.cnvObj.matchingCnvs.length;
      } else {
        return 1;
      }
    }
  },
  methods: {
    drawCnv: function () {
      this.d3.select("#dialog-card-text").selectAll('svg').remove();

      let strippedChr = this.selectedGene.chr;
      if (this.selectedGene.chr.startsWith('chr')) {
        strippedChr = this.selectedGene.chr.substring(3);
      }
      this.drawShading(strippedChr);
      this.drawGene();
      this.drawIdeogram(strippedChr);
    },
    drawIdeogram: function (strippedChr) {
      if (!this.selectedGene || !this.selectedCnv) {
        console.log('Error in displaying CNV dialog - no selected gene or cnv');
        return;
      }
      let annotations = [];

      // Only add legend if we have more than one CNV
      if (!(this.selectedCnv.cnvObj && this.selectedCnv.cnvObj.mergedCnv && this.selectedCnv.cnvObj.mergedCnv.length > 0)) {
        console.log('ERROR: could not draw ideogram - selectedCnv not coming into CnvDialog correctly');
        return;
      }
      let delims = this.selectedCnv.cnvObj.mergedCnv[0].delimiters;
      let legend = [{
        name: '----------------------------------',
        rows: []
      }];
      let i = 0;
      delims.forEach(coordPair => {
        let start = coordPair[0];
        let end = coordPair[1];
        let color = this.cnvColors[i];
        annotations.push({
          color: color,
          chr: strippedChr,
          start: start,
          stop: end,
          name: 'CNV ' + (i+1),
        });
        legend[0].rows.push({color: color, name: 'CNV ' + (i+1) + ': ' + start + '-' + end})
        i++;
      })

      // Add gene
      const selectionColor = '#194d81';
      annotations.push({
        color: selectionColor,
        chr: strippedChr,
        start: this.selectedGene.start,
        stop: this.selectedGene.end,
        name: 'Gene Location',
        trackIndex: 1
      });
      legend[0].rows.push({color: selectionColor, name: 'Gene Location'})

      //let fullHeight = this.d3.select('#dialog-card-text').node().getBoundingClientRect().width - 100;
      let fullHeight = (this.width * 2) * 0.8;
      if (fullHeight > 0) {
        const config = {
          organism: 'human',
          assembly: this.assemblyVersion,
          container: '#ideo-container',
          orientation: 'horizontal',
          chrHeight: fullHeight,
          chrWidth: 20,
          chrLabelSize: 10,
          chromosome: strippedChr,
          annotations: annotations,
          annotationsLayout: 'overlay',
          legend: legend,
          showAnnotTooltip: false,
          chrFillColor: "transparent"
        };
        new Ideogram(config);
        this.loadingIdeogram = false;

        // Wait to draw gene markers until after ideogram rendered
        const self = this;

        // todo: might be able to use this hook instead onDrawAnnots in ideogram
        setTimeout(() => {
          let geneG = self.d3.select('#_ideogram').selectAll('.annot')
              .filter(function() {
                return self.d3.select(this).attr("fill") === selectionColor; // filter by single attribute
              })
          // Parse out points from attribute
          let points = geneG.attr('points');
          let coordArr = [];
          let pointArr = points.split(' ');
          pointArr.forEach(pointStr => {
            let singlePointArr = pointStr.split(',');
            singlePointArr.forEach(point => {
              coordArr.push(point);
            })
          })

          let newPoints = '';
          let topYCount = 0;
          for (let i = 0; i < coordArr.length; i++) {
            let currPoint = coordArr[i];
            if (i%2 === 0) {
              newPoints += (currPoint + ' ');
            } else {
              let updatedPoint = topYCount < 2 ? (+currPoint + 2) : (+currPoint + 35);
              newPoints += (updatedPoint + ' ');
              topYCount++;
            }
          }
          geneG.attr('points', newPoints);
        }, 50)
      }
    },
    drawShading: function (strippedChr) {
      if (this.selectedCnv && this.selectedCnv.cnvObj) {
        let selection = this.d3.select('#cnv-dialog-shading').datum(this.selectedCnv.cnvObj);
        const chartData = {
          selection: selection,
          regionStart: this.selectedGene.start,
          regionEnd: this.selectedGene.end,
          chromosome: strippedChr,
          verticalLayers: 1,
          width: this.width,
          maxTcn: this.maxTcn,
          drawMinorAllele: true
        };
        this.cnvChart(chartData);
      }
    },
    drawGene: function () {
      if (this.selectedTranscript && this.selectedTranscript.length > 0 && this.selectedTranscript[0] != null && Object.keys(this.selectedTranscript[0]).length > 0) {
        let options = {
          regionStart: this.selectedGene.start,
          regionEnd: this.selectedGene.end,
          width: this.width
        };
        this.geneChart.updateSize(options);

        if (this.geneChart.getWidth() > 0) {
          let selection = this.d3.select('#cnv-dialog-gene').datum(this.selectedTranscript);
          this.geneChart(selection);
        }
      }
    }
  },
  mounted() {
    const self = this;

    // Instantiate d3 objects
    let geneVizOptions = {
      regionStart: this.selectedGene.start,
      regionEnd: this.selectedGene.end,
      width: this.width,
      widthPercent: '100%',
      heightPercent: '100%',
      margin: {top: 10, bottom: 30, left: 0, right: 0},
      showXAxis: true,
      drawBrush: false,
      showBrush: false,
      trackHeight: 20,
      cdsHeight: 20,
      showLabel: true,
      transcriptClass: this.transcriptClass,
      color: '#7f1010',
      displayOnly: true,
      inDialog: true
    };
    this.geneChart = geneD3(this.d3, geneVizOptions);
    // Register listeners
    let geneDispatch = this.geneChart.getDispatch();
    geneDispatch.on('d3exontooltip', function(exonInfo) {
      self.$emit('toggle-exon-tooltip', exonInfo);
    });

    const cnvVizOptions = {
      margin: {top: -50, bottom: 10, left: 0, right: 0},
      verticalPadding: 4,
      showTransition: false,
      inDialog: true
    };
    this.cnvChart = cnvD3(this.d3, ('cnv-dialog-shading'), cnvVizOptions);
    let cnvDispatch = this.cnvChart.getDispatch();
    cnvDispatch.on('d3mouseover', function(exonInfo) {
      self.$emit('toggle-cnv-tooltip', exonInfo);
    });
    cnvDispatch.on('d3mouseout', function() {
      self.$emit('toggle-cnv-tooltip');
    });

    // Render charts
    this.drawCnv();

  }
}
</script>

<style lang="sass">
    //.axis
    //    text
    //      font-size: 8px !important

    #_ideogram
        padding-top: 0 !important

    .dialog-label
        font-family: Open Sans
        font-size: 18px

    #_ideogramLegend
        float: right !important
        margin-top: -35px

    .longIdeo
        height: 300px

    .shortIdeo
        height: 225px

    #_ideogramLegend
        font-family: Open Sans !important
        font-size: 14px !important

    .bandLabel
        font-family: Open Sans !important
        color: #888888

</style>