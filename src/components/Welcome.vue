<template>
    <div :id="divId">
        <svg :width="welcomeWidth" :height="welcomeHeight">
            <g :transform="translation"></g>
        </svg>
        <v-overlay
                :absolute="absolute"
                :value="overlay"
                :opacity="opacity"
        >
            <v-card
                    elevation="24"
                    width="800"
                    height="550"
                    class="mx-auto"
            >
                <v-carousel light class="start-carousel"
                            height="100%"
                            v-model="carouselModel"
                            :continuous="continuous"
                            :cycle="cycle"
                            :opactiy="1"
                >
                    <v-carousel-item>
                        <v-sheet
                                height="100%"
                                width="100%"
                                :color="slideBackground"
                                tile
                        >
                            <v-row justify="center" align="center" class="mb-auto" style="height: 90%">
                                <v-col md="auto">
                                    <v-row justify="center" class="pa-3">
                                        <v-btn x-large color="#965757" class="carousel-btn" @click="advanceSlide">
                                            Start New Analysis
                                        </v-btn>
                                    </v-row>
                                    <v-row justify="center" class="pa-3">
                                        <v-btn x-large color="#965757" class="carousel-btn"
                                               @click="$emit('load-demo')">
                                            Try Demo Analysis
                                        </v-btn>
                                    </v-row>
                                    <v-row justify="center" class="pa-3">
                                        <v-btn x-large color="#965757" class="carousel-btn"
                                               @click="$emit('upload-config')">Upload Analysis
                                        </v-btn>
                                    </v-row>
                                </v-col>
                            </v-row>
                        </v-sheet>
                    </v-carousel-item>
                    <v-carousel-item>
                        <v-sheet
                                height="100%"
                                width="100%"
                                :color="slideBackground"
                                tile
                        >
                            <v-row justify="center" align="start" class="mb-auto" style="height: 10%">
                                <v-col md="auto">
                                    <v-row justify="center" style="padding-top: 10px">
                                        <h2>What types of data do you have?</h2>
                                    </v-row>
                                    <v-row justify="center" style="padding-bottom: 10px">
                                        (Select all that apply)
                                    </v-row>
                                    <v-divider style="width: 700px;"></v-divider>
                                    <v-row v-for="i in dataModels.length"
                                           :key="dataModels[i]"
                                           justify="start"
                                           style="height: 10%;">
                                        <v-checkbox dense v-model="userData" color="appColor"
                                                    style="padding-left: 250px"
                                                    :label="dataDescriptors[i-1] + ' (.' + fileDescriptors[i-1] + ')'"
                                                    :value="dataModels[i-1]"
                                                    @mouseup="onDataChecked(dataModels[i-1])">
                                        </v-checkbox>
                                    </v-row>
                                </v-col>
                            </v-row>
                        </v-sheet>
                    </v-carousel-item>
                    <v-carousel-item>
                        <v-sheet
                                height="100%"
                                width="100%"
                                :color="slideBackground"
                                tile
                        >
                            <v-row justify="center" align="start" class="mb-auto" style="height: 10%">
                                <v-col md="auto">
                                    <v-row justify="center" style="padding-top: 10px">
                                        <h2>Does your VCF file contain somatic variants only?</h2>
                                    </v-row>
                                    <v-divider></v-divider>
                                </v-col>
                            </v-row>
                            <v-row justify="center" align="center" class="mb-auto" style="height: 90%">
                                <v-col md="auto">
                                    <v-row justify="center">
                                        <v-radio-group v-model="somaticCallsOnly">
                                            <v-radio color="appColor"
                                                     key="som-false"
                                                     label="No"
                                                     :value="false"
                                            ></v-radio>
                                            <v-radio color="appColor"
                                                     key="som-true"
                                                     label="Yes"
                                                     :value="true"
                                            ></v-radio>
                                        </v-radio-group>
                                    </v-row>
                                </v-col>
                            </v-row>
                        </v-sheet>
                    </v-carousel-item>
                    <v-carousel-item>
                        <v-sheet
                                height="100%"
                                width="100%"
                                :color="slideBackground"
                                tile
                        >
                            <v-row justify="center" align="top" class="mb-auto" style="height: 10%">
                                <v-col md="auto">
                                    <v-row justify="center">
                                        <h2>What type of cancer are you examining?</h2>
                                    </v-row>
                                    <v-row justify="center">
                                        <i>(If you're not sure, select UCSF500)</i>
                                    </v-row>
                                    <v-divider style="width: 700px"></v-divider>
                                    <v-row justify="center">
                                        <v-container style="width: 650px">
                                            <v-select
                                                    :items="geneListNames"
                                                    color="appColor"
                                                    background-color="white"
                                                    label="Cancer Type (Panel Name)"
                                                    outlined
                                                    v-model="selectedList"
                                                    @change="populateListInput"
                                            ></v-select>
                                            <v-textarea
                                                    color="appColor"
                                                    background-color="white"
                                                    rows="10"
                                                    label="Genes"
                                                    :value="listInput"
                                            ></v-textarea>
                                        </v-container>
                                        <!--// TODO: text area that gets filled and can be added to-->
                                    </v-row>
                                </v-col>
                            </v-row>
                        </v-sheet>
                    </v-carousel-item>
                    <v-carousel-item v-for="i in userData.length" :key="'form-' + i">
                        <single-sample-upload-form
                                v-if="getFileType(i) == 'vcf'"
                                :cohortModel="cohortModel"
                                :dataType="getDataType(userData[i-1])"
                                :fileType="getFileType(userData[i-1])"
                                :slideBackground="slideBackground"
                                :modelInfoMap="modelInfoMap">
                        </single-sample-upload-form>
                        <!--TODO: else put multi-sample for bams-->
                    </v-carousel-item>
                    <!--TODO: either have last item here with status or bottom bar and disable load-->
                </v-carousel>
                <!--<v-list two-line>-->
                <!--<v-list-item>-->
                <!--<v-list-item-avatar>-->
                <!--<v-img src="https://cdn.vuetifyjs.com/images/john.png"></v-img>-->
                <!--</v-list-item-avatar>-->
                <!--<v-list-item-content>-->
                <!--<v-list-item-title>John Leider</v-list-item-title>-->
                <!--<v-list-item-subtitle>Author</v-list-item-subtitle>-->
                <!--</v-list-item-content>-->
                <!--<v-list-item-action>-->
                <!--<v-switch-->
                <!--v-model="cycle"-->
                <!--label="Cycle Slides"-->
                <!--inset-->
                <!--&gt;</v-switch>-->
                <!--</v-list-item-action>-->
                <!--</v-list-item>-->
                <!--</v-list>-->
            </v-card>
        </v-overlay>
    </div>
</template>

<script>
    import variantRainD3 from '../d3/VariantRain.d3.js'
    import SingleSampleUploadForm from './SingleSourceUploadForm.vue'
    import geneListsByType from '../data/gene_lists.json'
    import _ from 'lodash'

    export default {
        name: "Welcome",
        components: {
            SingleSampleUploadForm
        },
        props: {
            d3: {
                type: Object,
                default: null
            },
            cohortModel: {
                type: Object,
                default: null
            },
            welcomeWidth: {
                type: Number,
                default: 0
            },
            welcomeHeight: {
                type: Number,
                default: 0
            },
            navBarHeight: {
                type: Number,
                default: 0
            }
        },
        data: function () {
            return {
                // animation data
                divId: 'variantRainDiv',

                // view state
                cycle: false,
                continuous: false,
                absolute: false,
                opacity: 0.1,
                overlay: true,
                slideBackground: '#ededed',
                carouselModel: 0,
                dataDescriptors: [
                    'Variant Calls',
                    'Read Coverage',
                    'Copy Number',
                    'Raw RNAseq',
                    'Raw ATACseq'
                ],
                dataModels: [
                    'vcf',
                    'coverageBam',
                    'cnv',
                    'rnaSeq',
                    'atacSeq'
                ],
                userData: ['vcf', 'coverageBam'],   // NOT GUARANTEED TO BE IN SAME ORDER AS dataModels
                lockedData: {
                    'vcf': true,
                    'coverageBam': true,
                    'cnv': false,
                    'rnaSeq': false,
                    'atacSeq': false
                },
                fileDescriptors: [
                    'vcf',
                    'bam',
                    'facets',
                    'bam',
                    'bam'
                ],
                geneListNames: [],
                selectedList: null,

                // retained (model) state
                somaticCallsOnly: false,
                listInput: 'Select a type to populate gene list or enter your own',
                modelInfoMap: {},
                sampleIds: [],
            }
        },
        computed: {
            translation: function () {
                return 'translate(20, 50)'
            },
        },
        methods: {
            makeItRain: function () {
                variantRainD3(this.d3, this.divId, this.welcomeWidth, this.welcomeHeight, this.navBarHeight);
            },
            advanceSlide: function () {
                this.carouselModel += 1;
            },
            // NOTE: not sure why, but clicking prepend checkbox icon caused this to fire twice (hence, debounce)
            onDataChecked: _.debounce(function (model) {
                if (this.lockedData[model]) {
                    // TODO: make this prettier & create anonymous logging system to track if people want another entry vector
                    alert('Oncogene is currently configured to require this data type.');
                    this.userData.push(model);
                }
            }, 100),
            getFileType: function (type) {
                let idx = this.dataModels.indexOf(type);
                return this.fileDescriptors[idx];
            },
            getDataType: function (type) {
                let idx = this.dataModels.indexOf(type);
                return this.dataDescriptors[idx];
            },
            populateGeneLists: function () {
                for (var listName in geneListsByType) {
                    this.geneListNames.push(listName);
                }
            },
            populateListInput: function () {
                this.listInput = '';
                geneListsByType[this.selectedList].forEach((gene) => {
                    this.listInput += gene + '\n';
                });
            }
        },
        mounted: function () {
            this.makeItRain();
            this.populateGeneLists();
        }
    }
</script>

<style lang="sass">
    .start-carousel
        .v-carousel__controls
            background: #7f1010
            .v-item-group
                .v-carousel__controls__item
                    color: #ededed !important
        .v-window__container
            .v-window__prev
                .v-btn
                    background: #7f1010
                    .v-btn__content
                        .v-icon
                            color: #ededed
            .v-window__next
                .v-btn
                    background: #7f1010
                    .v-btn__content
                        .v-icon
                            color: #ededed
        .start-carousel-card
            width: 75%
            height: 75%
            background: transparent
        .carousel-btn
            color: white


</style>