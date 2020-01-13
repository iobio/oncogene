<template>
    <v-sheet
            height="100%"
            width="100%"
            :color="slideBackground"
            tile
    >
        <v-row justify="center" align="top" class="mb-auto" style="height: 10%">
            <v-col md="auto">
                <v-row justify="center">
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
        <v-row justify="center" align="center" class="mb-auto" style="height: 70%">
            <v-col md="auto">
                <v-row justify="center">
                    <v-text-field style="width: 500px"
                                  v-bind:label="'Enter .' + fileType +  ' URL'"
                                  hide-details
                                  v-model="url"
                                  color="appColor"
                                  @change="onUrlChange(fileType)"
                    ></v-text-field>
                </v-row>
                <v-row v-if="hasIndexFile && readyToCheckIndex" justify="center">
                    <v-text-field style="width: 500px"
                                  v-bind:label="'Enter .' + getIndexFileType() +  ' URL'"
                                  hide-details
                                  v-model="url"
                                  color="appColor"
                                  @change="onUrlChange(getIndexFileType())"
                    ></v-text-field>
                </v-row>
                <v-row v-for="i in sampleIds.length" :key="'sample-select-' + i">
                    <v-select
                            v-bind:class="samples == null || samples.length === 0 ? 'hide' : ''"
                            label="Sample"
                            v-model="selectedSample"
                            :items="samples"
                            color="appColor"
                            autocomplete
                            @input="onSampleSelected"
                            hide-details
                    ></v-select>
                </v-row>
            </v-col>
        </v-row>
    </v-sheet>
</template>

<script>
    export default {
        name: "FileUploadForm",
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
            }
        },
        data: function() {
            return {
                url: '',
                indexUrl: '',
                readyToCheckIndex: false,
                sampleIds: []
            }
        },
        computed: {
            hasIndexFile: function() {
                return this.getIndexFileType() !== '';
            }
        },
        methods: {
            onUrlChange: function(fileType) {
                // TODO: turn on loader for slide

                if (fileType === 'vcf') {
                    // Check vcf file

                    // Show prompt for tbi file if successful check

                    // Show genome build drop down
                } else if (fileType === 'tbi') {
                    // Populate sampleIds

                } else if (fileType === 'bam') {
                    // Check bam file

                    // Show prompt for bai file if successful check

                } else if (fileType === 'bai') {
                    // Check bai file

                    // Populate sampleIds?
                } else {
                    // Check facets file

                    // Populate sampleIds?
                }
            },
            onVcfUrlEntered: function (vcfUrl, tbiUrl) {
                let self = this;
                if (vcfUrl === '') {
                    self.modelInfo.vcf = null;
                    self.firstVcf = null;
                }
                if (tbiUrl === '') {
                    self.modelInfo.tbi = null;
                    self.firstTbi = null;
                }

                return new Promise((resolve, reject) => {

                    // Clear error state & flip on loading gif
                    self.vcfError = false;
                    self.retrievingIds = true;
                    self.$emit("sample-data-changed");

                    // Clear out old data
                    self.$set(self, "selectedSample", null);
                    self.$set(self, "samples", []);

                    if (self.modelInfo && self.modelInfo.model) {
                        // TODO: add build info to return callback params & check+notify as needed
                        self.modelInfo.model.onVcfUrlEntered(vcfUrl, tbiUrl, function (success, sampleNames) {
                            if (success) {
                                self.samples = sampleNames;
                                self.modelInfo.vcf = vcfUrl;
                                if (tbiUrl != null || tbiUrl !== '') {
                                    self.modelInfo.tbi = tbiUrl;
                                }
                                self.retrievingIds = false;
                                if (self.modelInfo.selectedSample && self.samples.indexOf(self.modelInfo.selectedSample) >= 0) {
                                    self.selectedSample = self.modelInfo.selectedSample;
                                    self.modelInfo.model.sampleName = self.modelInfo.sample;
                                } else if (self.samples.length === 1) {
                                    self.selectedSample = self.samples[0];
                                    self.modelInfo.selectedSample = self.selectedSample;
                                    self.modelInfo.model.sampleName = self.selectedSample;
                                } else {
                                    self.selectedSample = null;
                                    self.modelInfo.selectedSample = null;
                                    self.modelInfo.model.sampleName = null;
                                }
                                // self.$emit("samples-available", self.modelInfo.order, self.samples);
                            } else {
                                self.retrievingIds = false;
                                self.vcfError = true;
                                this.$alertify.set('notifier', 'position', 'top-right');
                                // alertify.warning("There was an error accessing the entered file. Please check the file and try again.");
                                reject('There was an error in onVcfUrlEnt in sampledata component');
                            }
                            self.$emit("sample-data-changed");
                            resolve();
                        })
                    }

                })
            },
            getIndexFileType: function() {
                if (this.fileType.toLowerCase() === 'vcf') {
                    return 'tbi';
                } else if (this.fileType.toLowerCase() === 'bam') {
                    return 'bai';
                } else {
                    return '';
                }
            }
        }
    }
</script>

<style lang="sass">

</style>