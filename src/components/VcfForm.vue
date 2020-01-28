<template>
    <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
        <v-card-title class="justify-center">
            {{ dataType }} Data
        </v-card-title>
        <v-divider class="mx-12"></v-divider>
        <v-card-actions>
            <v-container fluid v-if="urlsVerified">
                <v-text-field class="top-url"
                              :label="'Enter .' + fileType +  ' URL'"
                              hide-details
                              v-model="url"
                              color="appColor"
                              @change="onUrlChange()"
                ></v-text-field>
                <v-text-field class="bot-url"
                              :label="'Enter .' + getIndexFileType() +  ' URL'"
                              hide-details
                              v-model="indexUrl"
                              color="appColor"
                              @change="onUrlChange()"
                ></v-text-field>
            </v-container>
            <v-container v-if="urlsVerified" class="align-center px-0">
                <v-row v-for="i in modelInfoList.length" :key="'sample-row-' + i" class="dense-row">
                    <v-col md="2" style="padding-left: 0" class="text-sm-center">
                        <v-chip label outlined small color="appColor" style="margin-top: 7px;">{{getTumorStatus(i-1)}}</v-chip>
                    </v-col>
                    <v-col md="4">
                        <v-text-field dense
                                      v-model="modelInfoList[i-1].displayName"
                                      label="Nickname"
                        ></v-text-field>
                    </v-col>
                    <v-col md="4" style="padding-right: 0">
                        <v-select
                                label="Sample"
                                v-model="modelInfoList[i-1].selectedSample"
                                :items="vcfSampleNames"
                                color="appColor"
                                autocomplete
                                dense
                                hide-details
                        ></v-select>
                    </v-col>
                    <v-col v-if="i > 2" md="2">
                        <div class="text-xs-center">
                            <v-btn text icon color="appColor" @click="deleteTrack(i-1)">
                                <v-icon>close</v-icon>
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>
                <v-btn
                        color="darkPrimary"
                        absolute
                        dark
                        small
                        right
                        fab
                        style="margin-right: 20px; margin-bottom: 20px"
                >
                    <v-icon>add</v-icon>
                </v-btn>
            </v-container>
        </v-card-actions>
        <v-overlay :value="displayLoader">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
        </v-overlay>
    </v-card>
</template>

<script>
    export default {
        name: "VcfForm",
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
                if (this.fileType === 'vcf' && this.url !== '' && this.indexUrl !== '') {
                    this.onVcfUrlEntered(this.url, this.indexUrl);
                } else {
                    // Check facets file

                    // Populate sampleIds?
                }
            },
            /* Asks cohort model to check vcf and returns number of samples in vcf
             *
             * NOTE: in the future, if allowing for single vcfs per sample, can cycle through each sampleModel and ask, then return this
             */
            onVcfUrlEntered: function (vcfUrl, tbiUrl) {
                const self = this;
                self.$emit('clear-model-info', null);
                return new Promise((resolve, reject) => {
                    self.displayLoader = true;
                    self.cohortModel.sampleModelUtil.onVcfUrlEntered(vcfUrl, tbiUrl, function (success, sampleNames) {
                        self.displayLoader = false;
                        if (sampleNames.length < 2) {
                            alert('Oncogene is currently configured to work with at least one normal and one tumor sample');
                            reject();
                        } else {
                            // Create modelInfo per sample, tell parent to set
                            let infoList = [];
                            for (let i = 0; i < sampleNames.length; i++) {
                                let modelInfo = self.getModelInfo(sampleNames[i], i === 0);
                                infoList.push(modelInfo);
                                self.$emit('set-model-info', infoList);
                                self.vcfSampleNames.push(sampleNames[i]);
                            }
                            // Toggle display flags
                            self.urlsVerified = true;
                            self.displayBuild = true;
                            resolve();
                        }
                    })
                })
            },
            getIndexFileType: function () {
                if (this.fileType.toLowerCase() === 'vcf') {
                    return 'tbi';
                } else if (this.fileType.toLowerCase() === 'bam') {
                    return 'bai';
                } else {
                    return '';
                }
            },
            getModelInfo: function (selectedSample, isTumor) {
                let modelInfo = {};
                modelInfo.displayName = selectedSample;
                modelInfo.selectedSample = selectedSample;
                modelInfo.isTumor = isTumor;
                return modelInfo;
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

</style>