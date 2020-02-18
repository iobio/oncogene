<template>
    <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
        <v-card-title class="justify-center">
            {{ dataType }} Data
        </v-card-title>
        <v-divider class="mx-12"></v-divider>
        <v-card-actions>
            <v-container fluid v-if="!urlsVerified">
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
            <v-container v-if="urlsVerified" fluid style="padding-top: 0">
                <v-row justify=center align="start">
                    <v-col md="auto" dense>
                        <v-btn dark small color="secondary" @click="urlsVerified = false">Edit Urls</v-btn>
                    </v-col>
                </v-row>
                <v-list dense>
                    <v-list-item-group v-model="listInfo">
                        <v-list-item v-for="(listInfo, i) in modelInfoList"
                        :key="'listInfo-' + i">
                            <v-list-item-icon style="padding-top:25px">
                                <v-icon large color="appColor">filter_{{i+1}}</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content style="padding-bottom: 0">
                                <v-row dense>
                                    <v-col md="6">
                                        <v-select
                                                label="Sample"
                                                v-model="listInfo.selectedSample"
                                                :items="vcfSampleNames"
                                                color="appColor"
                                                autocomplete
                                                dense
                                                hide-details
                                        ></v-select>
                                    </v-col>
                                    <v-col md="4">
                                        <v-chip small outlined color="appHighlight" dark class="mt-3"
                                                :close="isCloseable(i)"
                                                @click:close="deleteTrack(i)">
                                            {{ isTumorTrack(listInfo) }}
                                        </v-chip>
                                    </v-col>
                                </v-row>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list-item-group>
                    <v-btn  v-if="modelInfoList.length < maxSamples"
                            color="secondary"
                            absolute
                            dark
                            small
                            right
                            fab
                            style="margin-right: 20px; margin-bottom: 20px"
                            @click="addTrack">
                        <v-icon>add</v-icon>
                    </v-btn>
                </v-list>
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
            allDataModels: {
                type: Array,
                default: function () {return []; }
            },
            maxSamples: {
                type: Number,
                default: 0
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
                urlsVerified: false,
                listInfo: -1
            }
        },
        computed: {
            hasIndexFile: function () {
                return this.getIndexFileType() !== '';
            }
        },
        methods: {
            onUrlChange: function () {
                if (this.url !== '' && this.indexUrl !== '') {
                    this.onVcfUrlEntered(this.url, this.indexUrl);
                } else if (this.url === '' || this.indexUrl  === '') {
                    this.$emit('clear-model-info', null);
                }
            },
            /* Asks cohort model to check vcf and returns number of samples in vcf
             * NOTE: in the future, if allowing for single vcfs per sample,
             * can cycle through each sampleModel and ask, then return this
             */
            onVcfUrlEntered: function (vcfUrl, tbiUrl) {
                const self = this;
                // TODO: clear out warning/alert here
                self.$emit('clear-model-info', null);
                return new Promise((resolve, reject) => {
                    self.displayLoader = true;
                    self.cohortModel.sampleModelUtil.onVcfUrlEntered(vcfUrl, tbiUrl, function (success, sampleNames) {
                        self.displayLoader = false;
                        if (success) {
                            if (sampleNames.length < 2) {
                                alert('Oncogene is currently configured to work with at least one normal and one tumor sample');
                                reject();
                            } else {
                                // Create modelInfo per sample
                                let infoList = [];
                                for (let i = 0; i < sampleNames.length; i++) {
                                    let modelInfo = self.createModelInfo(sampleNames[i], i !== 0, vcfUrl, tbiUrl);
                                    infoList.push(modelInfo);
                                    self.$emit('set-model-info', infoList);
                                    self.vcfSampleNames.push(sampleNames[i]);
                                }
                                // Toggle display flags
                                self.urlsVerified = true;
                                self.displayBuild = true;
                                resolve();
                            }
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
            createModelInfo: function (selectedSample, isTumor, vcfUrl, tbiUrl) {
                let modelInfo = {};
                modelInfo.selectedSample = selectedSample;
                modelInfo.isTumor = isTumor;

                modelInfo.vcfUrl = vcfUrl;
                modelInfo.tbiUrl = tbiUrl;
                modelInfo.coverageBamUrl = null;
                modelInfo.coverageBaiUrl = null;
                modelInfo.coverageVerified = false;
                modelInfo.rnaSeqBamUrl = null;
                modelInfo.rnaSeqBaiUrl = null;
                modelInfo.rnaSeqVerified = false;
                modelInfo.atacSeqBamUrl = null;
                modelInfo.atacSeqBaiUrl = null;
                modelInfo.atacSeqVefified = false;
                modelInfo.cnvUrl = null;
                modelInfo.cnvVerified = false;

                return modelInfo;
            },
            addTrack: function () {
                let newInfo = this.createModelInfo(null, true);
                this.modelInfoList.push(newInfo);
            },
            deleteTrack: function (modelInfoIdx) {
                this.$emit('remove-model-info', modelInfoIdx);
            },
            isTumorTrack: function (modelInfo) {
                if (modelInfo.isTumor) {
                    return 'Tumor';
                } else {
                    return 'Normal';
                }
            },
            isCloseable: function(i) {
                return i > 1;
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