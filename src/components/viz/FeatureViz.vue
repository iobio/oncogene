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
        <v-layout row style="padding-top: 10px">
            <v-flex xs12 class="field-label-header" style="text-align: left">Annotation Details</v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs1 md2 class="summary-field-label">Effect:</v-flex>
            <v-flex xs5 md4 v-if="!loadingExtraAnnotations" class="summary-field-value">
                {{effect}}
            </v-flex>
            <v-flex xs5 md4 v-if="loadingExtraAnnotations">
                <div class="loader">
                    <img src="../../assets/images/wheel.gif">
                </div>
            </v-flex>
            <v-flex xs1 md2 class="summary-field-label">Impact:</v-flex>
            <v-flex xs5 md4 v-if="!loadingExtraAnnotations" class="summary-field-value">
                 <span v-bind:class="{hide: impactText === ''}">
                   <svg v-if="type === 'mnp' || type === 'snp'" class="impact-badge" height="12" width="12">
                     <g transform="translate(1,3)" class="filter-symbol" v-bind:class="impactColor">
                       <rect width="8" height="8"></rect>
                     </g>
                   </svg>
                   <svg v-else-if="type==='del'" class="impact-badge" height="12" width="13">
                     <g transform="translate(5,6)" class="filter-symbol" v-bind:class="impactColor">
                       <path d="M0,-4.161791450287817L4.805622828269509,4.161791450287817 -4.805622828269509,4.161791450287817Z">
                       </path>
                     </g>
                   </svg>
                   <svg v-else-if="type==='ins'" class="impact-badge" height="12" width="13">
                     <g transform="translate(7,7)" class="filter-symbol" v-bind:class="impactColor">
                       <path d="M0,3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,-3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,3.5682482323055424Z">
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
                   {{impactText}}
                 </span>
            </v-flex>
            <v-flex xs5 md4 v-if="loadingExtraAnnotations">
                <div class="loader">
                    <img src="../../assets/images/wheel.gif">
                </div>
            </v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs1 md2 class="summary-field-label">Type:</v-flex>
            <v-flex xs5 md4 v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span v-bind:class="{hide: type === ''}">
                    <svg v-if="type==='snp'" id="snp" class="legend-element" height="12" width="12" transform="translate(1,2)">
                        <rect class="legend-symbol snp" rx="2" ry="1" x="1" width="10" y="1" height="10" style="opacity: 1; fill: none; stroke: rgb(0, 0, 0); stroke-width: 1px;">
                        </rect>
                    </svg>
                    <svg v-else-if="type==='ins'" id="ins" class="legend-element" height="12" width="13" transform="translate(2,2)">
                        <circle class="legend-symbol ins" cx="5" cy="6" r="4"
                                style="fill: none; stroke: rgb(0, 0, 0); stroke-width: 1px; opacity: 1;"></circle>
                    </svg>

                    <svg v-else-if="type==='del'" id="del" class="legend-element" height="12" width="13" transform="translate(1,2)">
                        <polygon class="legend-symbol del  legend-element" points="0,10 5,0 10,10" rx="1" ry="1" x="1" y="2"
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
                    {{type}}
                </span>
            </v-flex>
            <v-flex xs5 md4 v-if="loadingExtraAnnotations">
                <div class="loader">
                    <img src="../../assets/images/wheel.gif">
                </div>
            </v-flex>
            <v-flex xs1 md2 class="summary-field-label">Bases:</v-flex>
            <v-flex xs5 md4 v-if="!loadingExtraAnnotations" class="summary-field-value">
                {{ refAlt }}
            </v-flex>
            <div class="loader" v-if="loadingExtraAnnotations">
                <img src="../../assets/images/wheel.gif">
            </div>
        </v-layout>
        <v-layout row>
            <v-flex xs6 md2 class="summary-field-label">Status:</v-flex>
            <v-flex xs6 md4 v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span>{{ somaticText || '-' }}</span>
            </v-flex>
            <v-flex xs5 md4 v-if="loadingExtraAnnotations">
                <div class="loader">
                    <img src="../../assets/images/wheel.gif">
                </div>
            </v-flex>
            <v-flex xs6 md2 class="summary-field-label">AA:</v-flex>
            <v-flex xs6 md4 v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span>
                    {{ aaText || '-' }}
                </span>
            </v-flex>
            <div class="loader" v-if="loadingExtraAnnotations">
                <img src="../../assets/images/wheel.gif">
            </div>
        </v-layout>
        <v-layout row>
            <v-flex xs6 md2 class="summary-field-label">ClinVar:</v-flex>
            <v-flex xs6 md4 v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span>
                   {{ clinVarText || '-' }}
                 </span>
            </v-flex>
            <v-flex xs5 md4 v-if="loadingExtraAnnotations">
                <div class="loader">
                    <img src="../../assets/images/wheel.gif">
                </div>
            </v-flex>
            <v-flex xs6 md2 class="summary-field-label">COSMIC:</v-flex>
            <v-flex xs6 md4 v-if="!loadingExtraAnnotations" class="summary-field-value">
                <span>
                    {{ cosmicText || '-' }}
                </span>
            </v-flex>
            <v-flex xs5 md4 v-if="loadingExtraAnnotations">
                <div class="loader">
                    <img src="../../assets/images/wheel.gif">
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
            aaText: {
                default: "",
                type: String
            },
            cosmicText: {
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
