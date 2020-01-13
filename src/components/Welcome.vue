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
                    class="mx-auto"
            >
                <v-carousel light class="start-carousel"
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
                                        <v-btn x-large color="#965757" class="carousel-btn" @click="advanceSlide">Start
                                            New Analysis
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
                            <v-row justify="center" align="center" class="mb-auto" style="height: 90%">
                                <v-col md="auto">
                                    <v-row justify="center">
                                        What types of data do you have?
                                    </v-row>
                                    <v-row justify="center">
                                        (Select all that apply)
                                    </v-row>
                                    <v-divider></v-divider>
                                    <v-row v-for="i in dataModels.length"
                                           :key="dataModels[i]"
                                           style="height: 10%">
                                        <v-checkbox dense v-model="userData" color="appColor" class="my-1"
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
                            <v-row justify="center" align="center" class="mb-auto" style="height: 90%">
                                <v-col md="auto">
                                    <v-row justify="center">
                                        Does your VCF file contain somatic variants only?
                                    </v-row>
                                    <v-divider></v-divider>
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
                    <v-carousel-item v-for="i in userData.length" :key="'form-' + i">
                        <file-upload-form
                            :dataType="getDataType(userData[i-1])"
                            :fileType="getFileType(userData[i-1])"
                            :slideBackground="slideBackground">
                        </file-upload-form>
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
    import FileUploadForm from './FileUploadForm.vue'
    import _ from 'lodash'

    export default {
        name: "Welcome",
        components: {
          FileUploadForm
        },
        props: {
            d3: {
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
                divId: 'variantRainDiv',
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
                userData: ['vcf', 'coverageBam'],   // NOT GUARANTEED TO BE IN SAME ORDER AS DATAMODELS
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
                somaticCallsOnly: false
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
            onDataChecked: _.debounce(function(model) {
                if (this.lockedData[model]) {

                    // TODO: make this prettier
                    alert('Oncogene is currently configured to require this data type.');

                    // TODO: create anonymous logging system to track if people want another entry vector

                    this.userData.push(model);

                    // TODO: add slides here programmatically? Or just go to
                }
            }, 100),
            getFileType: function(type) {
                let idx = this.dataModels.indexOf(type);
                return this.fileDescriptors[idx];
            },
            getDataType: function(type) {
                let idx = this.dataModels.indexOf(type);
                return this.dataDescriptors[idx];
            }
        },
        mounted: function () {
            this.makeItRain();
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