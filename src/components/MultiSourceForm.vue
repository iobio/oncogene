<template>
    <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
        <v-card-title class="justify-center">
            {{ dataType }} Data
        </v-card-title>
        <v-divider class="mx-12"></v-divider>
        <v-card-actions>
            <v-container v-if="modelInfoList.length < 2" class="info-blurb">
                <v-row class="flex-child mx-12 align-stretch" style="height: 100%">
                    <v-col class="d-flex align-center" cols="12">
                        Please enter a valid VCF url and select at least two samples to enter {{dataType.toLowerCase()}} data
                    </v-col>
                </v-row>
            </v-container>
            <v-container fluid v-else>
                <v-col md="auto" style="padding-left: 0; padding-right: 0" v-if="urlsVerified">
                    <v-row v-for="i in modelInfoList.length" :key="'sample-row-' + i" class="dense-row">
                        <v-col md="2" style="padding-left: 0" class="text-sm-center">
                            <v-chip label outlined small color="appColor" style="margin-top: 7px;">{{getTumorStatus(i-1)}}</v-chip>
                        </v-col>
                        <v-col md="4">
                            <v-text-field class="top-url"
                                          :label="'Enter .' + fileType +  ' URL'"
                                          hide-details
                                          v-model="url"
                                          color="appColor"
                                          @change="onUrlChange()"
                            ></v-text-field>
                        </v-col>
                        <v-col md="4" style="padding-right: 0">
                            <v-text-field class="bot-url"
                                          :label="'Enter .' + getIndexFileType() +  ' URL'"
                                          hide-details
                                          v-model="indexUrl"
                                          color="appColor"
                                          @change="onUrlChange()"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                </v-col>
            </v-container>
        </v-card-actions>
        <v-overlay :value="displayLoader">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
        </v-overlay>
    </v-card>
</template>

<script>
    export default {
        name: "MultiSourceForm",
        props: {
            dataType: {
                type: String,
                default: ''
            },
            fileType: {
                type: String,
                default: ''
            },
            slideBackground: {
                type: String,
                default: ''
            },
            cohortModel: {
                type: Object,
                default: null
            },
            modelInfoList: {
                type: Array,
                default: function () { return []; }
            },
            disabled: {
                type: Boolean,
                default: false
            }
        },
        data: function () {
            return {
                url: '',
                indexUrl: '',
                vcfSampleNames: [],
                selectedSamples: [],
                sampleNicknames: [],
                displayLoader: false,
                displayBuild: false,
                urlsVerified: false
            }
        },
        computed: {
            hasIndexFile: function () {
                return this.getIndexFileType() !== '';
            }
        },
        methods: {
            /* Can add more data types here as need be */
            onUrlChange: function () {
                if (this.fileType === 'bam' && this.url !== '' && this.indexUrl !== '') {
                    this.onBamUrlEntered(this.url, this.indexUrl);
                } else {
                    // Check facets file
                    // Populate sampleIds?
                }
            },
            /* Asks cohort model to check vcf and returns number of samples in vcf
             *
             * NOTE: in the future, if allowing for single vcfs per sample, can cycle through each sampleModel and ask, then return this
             */
            // onBamUrlEntered: function (bamUrl, baiUrl, dataCategory) {
            //     const self = this;
            //     return new Promise((resolve, reject) => {
            //         self.displayLoader = true;
            //         let numSamples = self.modelInfoList.length;
            //         for (let i = 0; i < numSamples; i++) {
            //             self.cohortModel.sampleModelUtil.onBamUrlEntered(bamUrl, baiUrl, function (success, sampleNames) {
            //                 self.displayLoader = false;
            //                 if (sampleNames.length < modelInfoList.length) {
            //                     alert('Oncogene is currently configured to work with coverage information for each sample.')
            //                 }
            //             })
            //         }
            //     });
            // },
            // onFacetsUrlEntered: function (facetsUrl) {
            //
            // },
            getIndexFileType: function () {
                if (this.fileType.toLowerCase() === 'vcf') {
                    return 'tbi';
                } else if (this.fileType.toLowerCase() === 'bam') {
                    return 'bai';
                } else {
                    return '';
                }
            },
            addModelInfo: function (selectedSample, isTumor) {
                const self = this;
                let modelInfo = {};
                modelInfo.displayName = selectedSample;
                modelInfo.selectedSample = selectedSample;
                modelInfo.isTumor = isTumor;

                self.modelInfoList.push(modelInfo);
            },
            getTumorStatus: function (i) {
                if (i === 0) {
                    return 'NORMAL';
                } else {
                    return 'TUMOR';
                }
            },
            deleteTrack: function(modelInfoIdx) {
                this.modelInfoList.splice(modelInfoIdx, 1);
            }
        }
    }
</script>

<style lang="sass">
    .dense-row
        height: 50px

    .function-card
        font-family: "Open Sans"
        font-size: 14px
        color: #4a4a4a

    .top-url
        padding-top: 100px
        padding-bottom: 10px
        padding-left: 20px
        padding-right: 20px

    .bot-url
        padding-bottom: 10px
        padding-left: 20px
        padding-right: 20px

    .info-blurb
        color: #888888
        font-style: italic
        font-size: 18px
        height: 300px
        text-align: center
</style>