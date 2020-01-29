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
                <v-list dense flat>
                    <v-list-item-group v-model="listInfo">
                        <v-list-item v-for="(listInfo, i) in modelInfoList"
                                     :key="'listInfo-' + i">
                            <v-list-item-icon style="padding-top:25px">
                                <v-icon large color="appColor">filter_{{i+1}}</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content style="padding-bottom: 0">
                                <v-row dense>
                                    <v-col :md="columnWidth">
                                        <v-text-field
                                                :label="'Enter .' + fileType +  ' URL'"
                                                hide-details
                                                dense
                                                v-model="listInfo[key]"
                                                color="appColor"
                                                @change="onUrlChange(i)"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col v-if="hasIndexFile" md="5" style="padding-right: 0">
                                        <v-text-field
                                                :label="'Enter .' + getIndexFileType() +  ' URL'"
                                                hide-details
                                                dense
                                                v-model="listInfo[indexKey]"
                                                color="appColor"
                                                @change="onUrlChange(i)"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col md="2">
                                        <v-list-item-icon v-if="verifiedStatus[i]" class="pt-2">
                                            <v-icon color="green">checkmark</v-icon>
                                        </v-list-item-icon>
                                    </v-col>
                                </v-row>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list-item-group>
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
        name: "MultiSourceForm",
        props: {
            dataType: {
                type: String,
                default: ''
            },
            modelType: {
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
            maxSamples: {
                type: Number,
                default: 0
            }
        },
        data: function () {
            return {
                displayLoader: false,
                displayBuild: false,
                allUrlsVerified: false,
                listInfo: -1,
                verifiedStatus: []
            }
        },
        computed: {
            hasIndexFile: function () {
                return this.getIndexFileType() !== '';
            },
            columnWidth: function () {
                return this.hasIndexFile ? 5 : 10;
            },
            key: function () {
                let key = '';
                if (this.modelType === 'cnv') {
                    key = this.modelType + 'Url';
                } else {
                    key = this.modelType + 'BamUrl';
                }
                return key;
            },
            indexKey: function () {
                let key = '';
                if (this.modelType === 'cnv') {
                    key = this.modelType + 'Url';
                } else {
                    key = this.modelType + 'BaiUrl';
                }
                return key;
            }
        },
        methods: {
            /* Can add more data types here as need be */
            onUrlChange: function (i) {
                this.verifiedStatus[i] = false;
                if (this.fileType === 'bam' && this.modelInfoList[i][this.key] != null && this.modelInfoList[i][this.indexKey] != null) {
                    this.checkBam(i, this.modelInfoList[i][this.key], this.modelInfoList[i][this.indexKey]);
                } else {
                    // Check facets file
                    this.checkFacets(this.url);
                }
            },
            checkBam: function (modelInfoIdx, bamUrl, baiUrl) {
                const self = this;
                return new Promise((resolve, reject) => {
                    self.displayLoader = true;
                        self.cohortModel.sampleModelUtil.onBamUrlEntered(bamUrl, baiUrl, function (success) {
                            self.displayLoader = false;
                            // TODO: this is coming back successful incorrectly
                            if (success) {
                                self.verifiedStatus[modelInfoIdx] = true;
                                resolve();
                            } else {
                                reject("There was a problem with the provided bam or bai file.");
                            }
                    });
                });
            },
            checkFacets: function (facetsUrl) {
                console.log(facetsUrl);
                // TODO: add in backend check here to look for column headers
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
            getTumorStatus: function (i) {
                if (i === 0) {
                    return 'NORMAL';
                } else {
                    return 'TUMOR';
                }
            },
            deleteTrack: function (modelInfoIdx) {
                this.modelInfoList.splice(modelInfoIdx, 1);
            }
        },
        mounted: function () {
            for (let i = 0; i < this.maxSamples; i++) {
                this.verifiedStatus[i] = false;
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