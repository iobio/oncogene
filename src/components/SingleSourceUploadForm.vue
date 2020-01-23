<template>
    <v-sheet
            height="100%"
            width="100%"
            :color="slideBackground"
            tile
    >
        <v-row justify="center" align="top" class="mb-auto" style="height: 10%">
            <v-col md="auto">
                <v-row justify="center" style="padding-top: 10px">
                    <h2>{{ dataType }} Data</h2>
                </v-row>
                <v-divider style="width: 700px"></v-divider>
            </v-col>
            <v-text-field
                    v-if="fileType === 'url'"
                    v-bind:label="'Enter ' + label +  ' URL'"
                    hide-details
                    v-model="url"
                    color="appColor"
                    @change="onUrlChange"
            ></v-text-field>
        </v-row>
        <v-row justify=center align="start" v-if="urlsVerified" style="padding-top: 10px">
            <v-col md="auto">
                <v-btn dark small color="darkPrimary" @click="urlsVerified = false">Edit Urls</v-btn>
            </v-col>
        </v-row>
        <v-row justify="center" align="center" class="mb-auto" style="height: 70%">
            <v-col md="auto" v-if="!urlsVerified">
                <v-row justify="center">
                    <v-text-field style="width: 500px;"
                                  :label="'Enter .' + fileType +  ' URL'"
                                  hide-details
                                  v-model="url"
                                  color="appColor"
                                  @change="onUrlChange()"
                    ></v-text-field>
                </v-row>
                <v-row v-if="hasIndexFile" justify="center">
                    <v-text-field style="width: 500px;"
                                  :label="'Enter .' + getIndexFileType() +  ' URL'"
                                  hide-details
                                  v-model="indexUrl"
                                  color="appColor"
                                  @change="onUrlChange()"
                    ></v-text-field>
                </v-row>
            </v-col>
            <v-col md="auto" style="padding-left: 0; padding-right: 0" v-if="urlsVerified">
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
            </v-col>
        </v-row>
        <v-overlay :value="displayLoader">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
        </v-overlay>
    </v-sheet>
</template>

<script>
    export default {
        name: "SingleSampleUploadForm",
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
            onUrlChange: function () {
                if (this.fileType === 'vcf' && this.url !== '' && this.indexUrl !== '') {
                    this.onVcfUrlEntered(this.url, this.indexUrl);
                } else if (this.fileType === 'bam') {
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
            onVcfUrlEntered: function (vcfUrl, tbiUrl) {
                const self = this;
                self.modelInfoList = [];
                return new Promise((resolve, reject) => {
                    self.displayLoader = true;
                    self.cohortModel.sampleModelUtil.onVcfUrlEntered(vcfUrl, tbiUrl, function (success, sampleNames) {
                        self.displayLoader = false;
                        if (sampleNames.length < 2) {
                            alert('Oncogene is currently configured to work with at least one normal and one tumor sample');
                            reject();
                        } else {
                            // Create modelInfo per sample
                            for (let i = 0; i < sampleNames.length; i++) {
                                self.addModelInfo(sampleNames[i], i === 0);
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
            onBamUrlEntered: function (bamUrl, baiUrl, dataCategory) {
                const self = this;
                return new Promise((resolve, reject) => {
                    self.displayLoader = true;
                    let numSamples = self.modelInfoList.length;
                    for (let i = 0; i < numSamples; i++) {
                        self.cohortModel.sampleModelUtil.onBamUrlEntered(bamUrl, baiUrl, function (success, sampleNames) {
                            self.displayLoader = false;
                            if (sampleNames.length < modelInfoList.length) {
                                alert('Oncogene is currently configured to work with coverage information for each sample.')
                            }
                        })
                    }
                })

                // Update modelInfos per

                // depending on dataCategory coverage, rnaseq, or atacseq
            },
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
</style>