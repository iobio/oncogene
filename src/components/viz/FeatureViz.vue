<!-- Displays variant impact classification from various sources -->
<style lang="sass">
.info-button
  margin: 0
  padding-left: 0
  padding-right: 0
  padding-top: 0
  padding-bottom: 2px
  width: 22px !important
  height: 22px !important
</style>

<template>
  <v-container class="pa-0 ma-0">
    <v-container>
      <v-row style="padding-top: 10px" class="no-gutters mb-3">
        <div class="field-label-header" style="text-align: left">Annotation Details</div>
      </v-row>
      <v-row class="no-gutters mb-3">
        <v-col cols="12" sm="6" lg="2" class="summary-field-label">Effect:</v-col>
        <v-col cols="12" sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
          {{ effect }}
        </v-col>
        <v-col cols="12" sm="6" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
        <v-col sm="6" lg="2" class="summary-field-label">Impact:</v-col>
        <v-col sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
                 <span v-show="impactText !== '-'">
                   <svg v-if="type === 'mnp' || type === 'snp'" class="impact-badge" height="12" width="12">
                     <g transform="translate(1,3)" class="filter-symbol" v-bind:class="impactColor">
                       <rect width="8" height="8"></rect>
                     </g>
                   </svg>
                   <svg v-else-if="type==='del'" class="impact-badge" height="12" width="13">
                     <g transform="translate(5,6)" class="filter-symbol" v-bind:class="impactColor">
                       <path
                           d="M0,-4.161791450287817L4.805622828269509,4.161791450287817 -4.805622828269509,4.161791450287817Z">
                       </path>
                     </g>
                   </svg>
                   <svg v-else-if="type==='ins'" class="impact-badge" height="12" width="13">
                     <g transform="translate(7,7)" class="filter-symbol" v-bind:class="impactColor">
                       <path
                           d="M0,3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,-3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,3.5682482323055424Z">
                       </path>
                     </g>
                   </svg>
                   <svg v-else-if="type==='complex'" class="impact-badge" height="13" width="13">
                     <g transform="translate(4,6)" class="filter-symbol" v-bind:class="impactColor">
                       <path d="M0,-5.885661912765424L3.398088489694245,0 0,5.885661912765424 -3.398088489694245,0Z">
                       </path>
                     </g>
                   </svg>
                 </span>
          <span>
                   {{ impactText }}
                 </span>
        </v-col>
        <v-col sm="6" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
      </v-row>
      <v-row class="no-gutters mb-3">
        <v-col sm="6" lg="2" class="summary-field-label">Type:</v-col>
        <v-col sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span v-show="type !== '-'">
                    <svg v-if="type==='snp'" id="snp" class="legend-element" height="12" width="12"
                         transform="translate(1,2)">
                        <rect class="legend-symbol snp" rx="2" ry="1" x="1" width="10" y="1" height="10"
                              style="opacity: 1; fill: none; stroke: rgb(0, 0, 0); stroke-width: 1px;">
                        </rect>
                    </svg>
                    <svg v-else-if="type==='ins'" id="ins" class="legend-element" height="12" width="13"
                         transform="translate(2,2)">
                        <circle class="legend-symbol ins" cx="5" cy="6" r="4"
                                style="fill: none; stroke: rgb(0, 0, 0); stroke-width: 1px; opacity: 1;"></circle>
                    </svg>

                    <svg v-else-if="type==='del'" id="del" class="legend-element" height="12" width="13"
                         transform="translate(1,2)">
                        <polygon class="legend-symbol del  legend-element" points="0,10 5,0 10,10" rx="1" ry="1" x="1"
                                 y="2"
                                 style="fill: none; stroke: rgb(0, 0, 0); stroke-width: 1px; opacity: 1;">
                        </polygon>
                    </svg>

                    <svg v-else id="complex" class="legend-element" height="13" width="13" transform="translate(0,0)">
                        <g transform="translate(7,6)">
                            <path d="M0,-6.771323825530848L5.79617697938849,0 0,6.771323825530848 -5.79617697938849,0Z"
                                  class="legend-symbol complex"
                                  style="opacity: 1;fill: none;stroke-width: 1.5px !important;"></path>
                        </g>
                    </svg>
                </span>
          <span>
                    {{ type }}
                </span>
        </v-col>
        <v-col sm="6" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
        <v-col sm="6" lg="2" class="summary-field-label">Bases:</v-col>
        <v-col sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
          {{ refAlt }}
        </v-col>
        <div class="loader" v-if="loadingExtraAnnotations">
          <img src="../../assets/images/wheel.gif">
        </div>
      </v-row>
      <v-row class="no-gutters mb-3">
        <v-col sm="6" lg="2" class="summary-field-label">Status:</v-col>
        <v-col sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
          <span>{{ somaticText || '-' }}</span>
        </v-col>
        <v-col sm="6" md="5" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
        <v-col sm="6" lg="2" class="summary-field-label">AA:</v-col>
        <v-col sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span>
                    {{ aaText || '-' }}
                </span>
        </v-col>
        <div class="loader" v-if="loadingExtraAnnotations">
          <img src="../../assets/images/wheel.gif">
        </div>
      </v-row>
      <v-row class="no-gutters mb-3">
        <v-col sm="6" lg="2" class="summary-field-label">ClinVar:</v-col>
        <v-col sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span>
                   {{ clinVarText || '-' }}
                 </span>
        </v-col>
        <v-col sm="6" md="5" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
        <v-col sm="6" lg="2" class="summary-field-label">COSMIC:</v-col>
        <v-col sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span>
                    {{ cosmicText || '-' }}
                </span>
                <v-btn style="padding-bottom: 3px" x-small icon color="blue" v-if="cosmicLink" target="_blank" :href="cosmicLink">
                  <v-icon>open_in_new</v-icon>
                </v-btn>
        </v-col>
        <v-col sm="6" md="5" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-if="cnvInfo">
      <v-row style="padding-top: 10px" class="no-gutters mb-3">
        <div class="field-label-header" style="text-align: left">Copy Number Details</div>
      </v-row>
      <v-row class="no-gutters mb-3">
        <v-col sm="3" class="summary-field-label">Variant Status:</v-col>
        <v-col sm="9" class="summary-field-value">
          <v-btn x-small text style="text-align: left; font-size: 12px; color: #888; text-transform: lowercase; padding-left: 0; letter-spacing: 0">
            <v-icon left small :color="getCnvColor(cnvInfo.cnvType)">
              {{getCnvIcon(cnvInfo.cnvType)}}
            </v-icon>
            {{ cnvInfo.cnvStatusText || '-' }}
          </v-btn>
        </v-col>
        <v-col sm="6" md="5" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
      </v-row>
      <v-row v-if="cnvInfo.abnormal" class="no-gutters mb-3">
        <v-col sm="6" lg="2" class="summary-field-label">Total CN:</v-col>
        <v-col sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span>
                    {{ tcn }}
                </span>
        </v-col>
        <v-col sm="6" md="5" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
        <v-col sm="6" lg="2" class="summary-field-label">Minor CN:</v-col>
        <v-col sm="6" lg="4" v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span>
                    {{ lcn }}
                </span>
        </v-col>
        <v-col sm="6" md="5" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
      </v-row>
      <v-row v-if="cnvInfo.abnormal" class="no-gutters mb-3">
        <v-col sm="3" class="summary-field-label">CNV Coordinates:</v-col>
        <v-col sm="9" v-if="!loadingExtraAnnotations" class="summary-field-value">
          <span>
             {{ (formattedChrom + " " + cnvInfo.cnvCoordString) || '-' }}
           </span>
        </v-col>
        <v-col sm="6" md="5" lg="4" v-if="loadingExtraAnnotations">
          <div class="loader">
            <img src="../../assets/images/wheel.gif">
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>


<script>
export default {
  name: 'feature-viz',
  props: {
    effect: {
      default: "",
      type: String
    },
    impactText: {
      default: "",
      type: String
    },
    impactColor: {
      default: "",
      type: String
    },
    type: {
      default: "",
      type: String
    },
    refAlt: {
      default: "",
      type: String
    },
    aaText: {
      default: "",
      type: String
    },
    cosmicText: {
      default: "",
      type: String
    },
    cosmicLink: {
      default: "",
      type: String
    },
    clinVarText: {
      default: "",
      type: String
    },
    clinVarColor: {
      default: null,
      type: String
    },
    revelText: {
      default: "",
      type: String
    },
    somaticText: {
      default: "",
      type: String
    },
    variantSelected: {
      default: false,
      type: Boolean
    },
    loadingExtraAnnotations: {
      default: false,
      type: Boolean
    },
    loadingExtraClinvarAnnotations: {
      default: false,
      type: Boolean
    },
    cnvInfo: {
      default: null,
      type: Object
    },
    chrom: {
      default: "",
      type: String
    }
  },
  computed: {
    formattedChrom : function () {
      if (this.chrom && this.chrom.startsWith("chr")) {
        return this.chrom;
      } else {
        return 'chr' + this.chrom + ': ';
      }
    },
    tcn : function () {
      if (this.cnvInfo) {
        if (this.cnvInfo.tcn) {
          return this.cnvInfo.tcn;
        } else {
          return "0";
        }
      } else {
        return "-";
      }
    },
    lcn : function () {
      if (this.cnvInfo) {
        if (this.cnvInfo.lcn) {
          return this.cnvInfo.lcn;
        } else {
          return "0";
        }
      } else {
        return "-";
      }
    }
  },
  created: function () {
  },
  mounted: function () {
  },
  methods: {
    getCnvIcon: function (cnvType) {
      if (cnvType === "amp") {
        return "keyboard_double_arrow_up";
      } else if (cnvType === "del") {
        return "keyboard_double_arrow_down";
      } else if (cnvType === "minor") {
        return "warning";
      } else {
        return "horizontal_rule";
      }
    },
    getCnvColor: function (cnvType) {
      if (cnvType === "amp") {
        return "rgb(25, 77, 129, 0.5)";
      } else if (cnvType === "del") {
        return "rgb(200, 18, 18, 0.5)";
      } else if (cnvType === "minor") {
        return "#EED202";
      } else {
        return "rgb(204, 199, 155)";
      }
    }
  },
  watch: {}
}

</script>
