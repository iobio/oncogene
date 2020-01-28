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
            <v-container v-if="urlsVerified" fluid>
                <v-row justify=center align="start">
                    <v-col md="auto" dense>
                        <v-btn dark small color="darkPrimary" @click="urlsVerified = false">Edit Urls</v-btn>
                    </v-col>
                </v-row>
                <v-list dense>
                    <v-list-group-item v-model="listInfo">
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
                                        <v-chip small color="appHighlight" dark>{{ isTumorTrack(listInfo) }}</v-chip>
                                    </v-col>
                                </v-row>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list-group-item>
                </v-list>


                <!--<v-row justify="center" align="center" class="mb-auto">-->
                    <!--<v-col md="auto" style="padding-left: 0; padding-right: 0" v-if="urlsVerified">-->
                        <!--<v-row v-for="i in modelInfoList.length" :key="'sample-row-' + i" class="dense-row">-->
                            <!--<v-col md="2" class="text-sm-center mt-1">-->
                                <!--<v-chip outlined color="appColor">{{i}}</v-chip>-->
                            <!--</v-col>-->
                            <!--<v-col md="3" class="mt-2 justify-center">-->
                                <!--<v-chip small color="appHighlight" dark label>{{ isTumorTrack(modelInfoList[i-1]) }}</v-chip>-->
                            <!--</v-col>-->
                            <!--<v-col md="4" style="padding-right: 0">-->
                                <!--<v-select-->
                                        <!--label="Sample"-->
                                        <!--v-model="modelInfoList[i-1].selectedSample"-->
                                        <!--:items="vcfSampleNames"-->
                                        <!--color="appColor"-->
                                        <!--autocomplete-->
                                        <!--dense-->
                                        <!--hide-details-->
                                <!--&gt;</v-select>-->
                            <!--</v-col>-->
                            <!--<v-col v-if="i > 2" md="2">-->
                                <!--<div class="text-xs-center">-->
                                    <!--<v-btn text icon color="appColor" @click="deleteTrack(i-1)">-->
                                        <!--<v-icon>close</v-icon>-->
                                    <!--</v-btn>-->
                                <!--</div>-->
                            <!--</v-col>-->
                        <!--</v-row>-->
                        <!--<v-btn-->
                                <!--color="darkPrimary"-->
                                <!--absolute-->
                                <!--dark-->
                                <!--small-->
                                <!--right-->
                                <!--fab-->
                                <!--style="margin-right: 20px; margin-bottom: 20px"-->
                        <!--&gt;-->
                            <!--<v-icon>add</v-icon>-->
                        <!--</v-btn>-->
                    <!--</v-col>-->
                <!--</v-row>-->
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
                urlsVerified: false,
                listInfo: 0
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
                if (this.url !== '' && this.indexUrl !== '') {
                    this.onVcfUrlEntered(this.url, this.indexUrl);
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
                                let modelInfo = self.getModelInfo(sampleNames[i], i !== 0);
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
            deleteTrack: function(modelInfoIdx) {
                this.$emit('remove-model-info', modelInfoIdx);
            },
            isTumorTrack: function(modelInfo) {
                if (modelInfo.isTumor) {
                    return 'Tumor';
                } else {
                    return 'Normal';
                }
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