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
    <v-flex xs12>
<!--        <v-layout row>-->
<!--            <v-flex xs12 class="field-label-header" style="text-align: left; margin-top: 5px">Cohort Details-->
<!--            </v-flex>-->
<!--        </v-layout>-->
<!--        <v-layout row>-->
<!--            <v-flex xl3 lg4 md6 class="summary-field-label">-->
<!--                <span>Raw p-value:</span>-->
<!--                <v-menu open-on-hover offset-y transition="slide-y-transition" max-width="300px">-->
<!--                    <v-btn flat icon small color="cohortBlue" slot="activator" class="info-button">-->
<!--                        <v-icon small>info_outline</v-icon>-->
<!--                    </v-btn>-->
<!--                    <v-card>-->
<!--                        <v-card-title style="font-family: Poppins; font-size: 16px; font-weight: 500; padding-top: 2px">-->
<!--                            Raw p-value-->
<!--                        </v-card-title>-->
<!--                        <v-divider></v-divider>-->
<!--                        <v-card-text>-->
<!--                            This value represents statistically-significant enrichment, with values closer to-->
<!--                            zero indicating a higher amount of enrichment of a variant within the subset cohort relative-->
<!--                            to the larger proband group. This number is calculated via a Cochran Armitage Trend Test.-->
<!--                        </v-card-text>-->
<!--                    </v-card>-->
<!--                </v-menu>-->
<!--            </v-flex>-->
<!--            <v-flex xl7 md6 v-bind:class="{hide: loadingExtraAnnotations === true}" class="cohort-summary-field-value">-->
<!--                <span>{{ pValueInfo }}</span>-->
<!--            </v-flex>-->
<!--            <div class="loader" v-bind:class="{ hide: loadingExtraAnnotations === false }">-->
<!--                <img src="../../../assets/images/wheel.gif">-->
<!--            </div>-->
<!--        </v-layout>-->
        <v-layout row>
            <v-flex xl3 lg4 md6 class="summary-field-label">
                <span>-log<sub>10</sub>(p-val):</span>
                <v-menu open-on-hover offset-y transition="slide-y-transition" max-width="300px">
                    <v-btn text icon small color="appColor" slot="activator" class="info-button">
                        <v-icon small>info_outline</v-icon>
                    </v-btn>
                    <v-card>
                        <v-card-title style="font-family: Poppins; font-size: 16px; font-weight: 500; padding-top: 2px">
                            -log<sub>10</sub>(p-value)
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text>
                            This value represents statstically-significant enrichment, with higher values indicating
                            a higher amount of enrichment of a variant within the subset cohort relative to the
                            larger proband group. This number is calculated by taking the -log(base 10) of the
                            raw p-value above, and is the y-coordinate by which the variants are displayed
                            within the cohort track.
                        </v-card-text>
                    </v-card>
                </v-menu>
            </v-flex>
            <v-flex lg7 md6 v-bind:class="{hide: loadingExtraAnnotations === true}" class="cohort-summary-field-value">
                <span>{{ log10pValueInfo }}</span>
            </v-flex>
            <div class="loader" v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <img src="/src/assets/images/wheel.gif">
            </div>
        </v-layout>
        <v-layout row style="padding-top: 10px">
            <v-flex xs12 class="field-label-header" style="text-align: left">Annotation Details</v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs1 md2 class="summary-field-label">Effect:</v-flex>
            <v-flex xs5 md4 v-bind:class="{hide: loadingExtraAnnotations === true}" class="summary-field-value">
                {{effect}}
            </v-flex>
            <v-flex xs5 md4 v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <div class="loader">
                    <img src="/src/assets/images/wheel.gif">
                </div>
            </v-flex>
            <v-flex xs1 md2 class="summary-field-label">Impact:</v-flex>
            <v-flex xs5 md4 v-bind:class="{hide: loadingExtraAnnotations === true}" class="summary-field-value">
                 <span v-bind:class="{hide: impactText === ''}">
                   <svg v-bind:class="{hide: (type !== 'snp' && type !== 'mnp')}" class="impact-badge" height="12" width="12">
                     <g transform="translate(1,3)" class="filter-symbol" v-bind:class="impactColor">
                       <rect width="8" height="8"></rect>
                     </g>
                   </svg>
                   <svg v-bind:class="{hide: (type !== 'del')}" class="impact-badge" height="12" width="13">
                     <g transform="translate(5,6)" class="filter-symbol" v-bind:class="impactColor">
                       <path d="M0,-4.161791450287817L4.805622828269509,4.161791450287817 -4.805622828269509,4.161791450287817Z">
                       </path>
                     </g>
                   </svg>
                   <svg v-bind:class="{hide: (type !== 'ins')}" class="impact-badge" height="12" width="13">
                     <g transform="translate(7,7)" class="filter-symbol" v-bind:class="impactColor">
                       <path d="M0,3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,-3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,3.5682482323055424Z">
                       </path>
                     </g>
                   </svg>
                   <svg v-bind:class="{hide: (type !== 'complex')}" class="impact-badge" height="13" width="13">
                     <g transform="translate(4,6)" class="filter-symbol" v-bind:class="impactColor">
                       <path d="M0,-5.885661912765424L3.398088489694245,0 0,5.885661912765424 -3.398088489694245,0Z">
                       </path>
                     </g>
                   </svg>
                 </span>
                <span>
                   {{impactText}}
                 </span>
            </v-flex>
            <v-flex xs5 md4 v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <div class="loader">
                    <img src="/src/assets/images/wheel.gif">
                </div>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs1 md2 class="summary-field-label">Type:</v-flex>
            <v-flex xs5 md4 v-bind:class="{hide: loadingExtraAnnotations === true}" class="summary-field-value">
                <span v-bind:class="{hide: type === ''}">
                    <svg v-bind:class="{hide: (type !== 'snp')}" id="snp" class="legend-element" height="12" width="12" transform="translate(1,2)">
                        <rect class="legend-symbol snp" rx="2" ry="1" x="1" width="10" y="1" height="10" style="opacity: 1; fill: none; stroke: rgb(0, 0, 0); stroke-width: 1px;">
                        </rect>
                    </svg>
                    <svg v-bind:class="{hide: (type !== 'ins')}" id="ins" class="  legend-element" height="12" width="13" transform="translate(2,2)">
                        <circle class="legend-symbol ins" cx="5" cy="5" r="5"
                                style="fill: none; stroke: rgb(0, 0, 0); stroke-width: 1px; opacity: 1;"></circle>
                    </svg>

                    <svg v-bind:class="{hide: (type !== 'del')}" id="del" class="  legend-element" height="12" width="13" transform="translate(1,2)">
                        <polygon class="legend-symbol del  legend-element" points="0,10 5,0 10,10" rx="1" ry="1" x="1" y="2"
                                 style="fill: none; stroke: rgb(0, 0, 0); stroke-width: 1px; opacity: 1;">
                        </polygon>
                    </svg>

                    <svg v-bind:class="{hide: (type !== 'complex')}" id="complex" class="  legend-element" height="13" width="13" transform="translate(0,0)">
                        <g transform="translate(7,6)">
                            <path d="M0,-6.771323825530848L5.79617697938849,0 0,6.771323825530848 -5.79617697938849,0Z"
                                  class="legend-symbol complex"
                                  style="opacity: 1;fill: none;stroke-width: 1.5px !important;"></path>
                        </g>
                    </svg>
                </span>
                <span>
                    {{type}}
                </span>
            </v-flex>
            <v-flex xs5 md4 v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <div class="loader">
                    <img src="/src/assets/images/wheel.gif">
                </div>
            </v-flex>
            <v-flex xs1 md2 class="summary-field-label">Bases:</v-flex>
            <v-flex xs5 md4 v-bind:class="{hide: loadingExtraAnnotations === true}" class="summary-field-value">
                {{refAlt}}
            </v-flex>
            <div class="loader" v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <img src="/src/assets/images/wheel.gif">
            </div>
        </v-layout>
        <v-layout row>
            <v-flex xs6 md2 class="summary-field-label">Somatic:</v-flex>
            <v-flex xs6 md4 v-bind:class="{hide: loadingExtraClinvarAnnotations === true}" class="summary-field-value">
                 <span v-bind:class="{hide: clinVarText === ''}">
                   <svg id="gene-badge-clinvar" class="glyph" width="13" height="14">
                       <g transform="translate(1,3)" v-bind:class="clinVarColor">
                         <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#clinvar-symbol"
                              width="11" height="11"></use>
                       </g>
                   </svg>
                 </span>
                <span>{{ clinVarText || '-' }}</span>
            </v-flex>
            <v-flex xs5 md4 v-bind:class="{ hide: loadingExtraClinvarAnnotations === false }">
                <div class="loader">
                    <img src="/src/assets/images/wheel.gif">
                </div>
            </v-flex>
            <v-flex xs6 md2 class="summary-field-label">In COSMIC:</v-flex>
            <v-flex xs6 md4 v-bind:class="{hide: loadingExtraAnnotations === true}" class="summary-field-value">
         <span v-bind:class="{hide: polyPhenText === ''}">
           <svg id="gene-badge-clinvar" class="glyph" width="13" height="14">
               <g transform="translate(1,3)" v-bind:class="polyPhenColor">
                 <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#biohazard-symbol"
                      width="12" height="12"></use>
               </g>
           </svg>
         </span>
                <span>
           {{ polyPhenText || '-' }}
         </span>
            </v-flex>
            <div class="loader" v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <img src="/src/assets/images/wheel.gif">
            </div>
        </v-layout>
        <v-layout row>
            <v-flex xs6 md2 class="summary-field-label">ClinVar:</v-flex>
            <v-flex xs6 md4 v-bind:class="{hide: loadingExtraAnnotations === true}" class="summary-field-value">
         <span v-bind:class="{hide: siftText === ''}">
           <svg id="gene-badge-clinvar" class="glyph" width="13" height="14">
               <g transform="translate(1,3)" v-bind:class="siftColor">
                 <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#danger-symbol" width="12"
                      height="12"></use>
               </g>
           </svg>
         </span>
                <span>
           {{ siftText || '-' }}
         </span>
            </v-flex>
            <v-flex xs5 md4 v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <div class="loader">
                    <img src="/src/assets/images/wheel.gif">
                </div>
            </v-flex>
            <v-flex xs6 md2 class="summary-field-label">REVEL:</v-flex>
            <v-flex xs6 md4 v-bind:class="{hide: loadingExtraAnnotations === true}" class="summary-field-value">
            <span>
           {{ revelText || '-' }}
            </span>
            </v-flex>
            <v-flex xs5 md4 v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <div class="loader">
                    <img src="/src/assets/images/wheel.gif">
                </div>
            </v-flex>
        </v-layout>
    </v-flex>
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
            clinVarText: {
                default: "",
                type: String
            },
            clinVarColor: {
                default: null,
                type: String
            },
            siftText: {
                default: "",
                type: String
            },
            siftColor: {
                default: "",
                type: String
            },
            polyPhenText: {
                default: "",
                type: String
            },
            polyPhenColor: {
                default: "",
                type: String
            },
            revelText: {
                default: "",
                type: String
            },
            variantSelected: {
                default: false,
                type: Boolean
            },
            foldEnrichmentInfo: {
                default: "",
                type: String
            },
            pValueInfo: {
                default: "",
                type: String
            },
            log10pValueInfo: {
                default: "",
                type: String
            },
            loadingExtraAnnotations: {
                default: false,
                type: Boolean
            },
            loadingExtraClinvarAnnotations: {
                default: false,
                type: Boolean
            }
        },
        computed: {},
        created: function () {
        },
        mounted: function () {
        },
        methods: {},
        watch: {}
    }

</script>
