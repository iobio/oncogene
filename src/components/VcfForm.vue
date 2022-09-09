<template>
  <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
    <v-card-title class="justify-center function-card-title">
      {{ dataType }} Data
    </v-card-title>
    <v-divider class="mx-12"></v-divider>
    <v-card-actions>
      <v-container fluid v-if="!urlsVerified">
        <v-select v-if="externalLaunchMode"
                  v-model="url"
                  class="drop"
                  :items="vcfList"
                  item-text="text"
                  item-value="value"
                  item-color="secondary"
                  placeholder="Select vcf"
                  return-object
                  @change="populateRespectiveIndex()">
        </v-select>
        <v-text-field v-else class="top-url"
                      :label="'Enter .' + fileType +  ' URL'"
                      hide-details
                      v-model="url"
                      color="appColor"
                      @change="onUrlChange()"
        ></v-text-field>
        <v-select v-if="externalLaunchMode"
                  v-model="indexUrl"
                  class="drop"
                  :items="tbiList"
                  item-text="text"
                  item-value="value"
                  item-color="secondary"
                  placeholder="Select tbi"
                  return-object>
        </v-select>
        <v-text-field v-else class="bot-url"
                      :label="'Enter .' + getIndexFileType() +  ' URL'"
                      hide-details
                      v-model="indexUrl"
                      color="appColor"
                      @change="onUrlChange()"
        ></v-text-field>
        <v-select v-model="selectedBuild"
                  label="Genome Build"
                  :items="genomeBuilds"
                  @change="onUrlChange()"
                  class="drop">
        </v-select>
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
                <v-icon large color="appColor">filter_{{ i + 1 }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content style="padding-bottom: 0">
                <v-row dense>
                  <v-col md="6">
                    <v-select
                        label="Sample"
                        v-model="listInfo.selectedSample"
                        :items="filteredVcfSampleNames"
                        color="appColor"
                        autocomplete
                        dense
                        hide-details
                    ></v-select>
                  </v-col>
                  <v-col md="4">
                    <v-chip small outlined color="appHighlight" dark class="mt-3"
                            :close="isRemovable(i)"
                            @click:close="deleteTrack(i)">
                      {{ isTumorTrack(listInfo) }}
                    </v-chip>
                  </v-col>
                </v-row>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
          <v-btn v-if="modelInfoList.length < maxSamples"
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
    allDataModels: {
      type: Array,
      default: function () {
        return [];
      }
    },
    maxSamples: {
      type: Number,
      default: 0
    },
    uploadedUrls: {
      type: Array,
      default: () => {
        return [];
      }
    },
    uploadedIndexUrls: {
      type: Array,
      default: () => {
        return [];
      }
    },
    // Lists of selected samples (one per vcf) provided from either
    // an internal config (in which case only one list)
    // or an external config (in which one list per vcf filtered by
    // Mosaic sample IDs passed in url params)
    uploadedSelectedSampleLists: {
      type: Array,
      default: () => {
        return [];
      }
    },
    uploadedBuild: {
      type: String,
      default: null
    },
    parentModelInfoIdx: {
      type: Number,
      default: 0
    },
    modelInfoList: {
      type: Array,
      default: () => {
        return [];
      }
    },
    externalLaunchMode: {
      type: Boolean,
      default: false
    },
    externalLaunchSource: {
      type: String,
      default: ''
    },
    vcfFileNames: {
      type: Array,
      default: () => {
        return [];
      }
    },
    tbiFileNames: {
      type: Array,
      default: () => {
        return [];
      }
    },
    galaxySampleCount: {
      type: Number,
      default: 0
    }
  },
  data: function () {
    return {
      url: null,
      indexUrl: null,
      vcfSampleNames: [], // the vcf column IDs pulled from actual file
      filteredVcfSampleNames: [], // the intersection of vcf column IDs & passed selectedSampleIds
      selectedSamples: [],
      sampleNicknames: [],
      displayLoader: false,
      selectedBuild: null,
      urlsVerified: false,
      listInfo: -1,
      modelInfoIdx: 0,
      galaxySampleCap: 0,
      genomeBuilds: ['GRCh37', 'GRCh38'],
      GALAXY: 'galaxy'
    }
  },
  computed: {
    hasIndexFile: function () {
      return this.getIndexFileType() !== '';
    },
    vcfList: function () {
      let annoList = [];
      for (let i = 0; i < this.uploadedUrls.length; i++) {
        if (this.externalLaunchSource === this.GALAXY) {
          annoList.push(this.uploadedUrls[i]);
        } else {
          annoList.push({ 'text': this.vcfFileNames[i], 'value': this.uploadedUrls[i] });
        }
      }
      return annoList;
    },
    tbiList: function () {
      let annoList = [];
      for (let i = 0; i < this.uploadedIndexUrls.length; i++) {
        if (this.externalLaunchSource === this.GALAXY) {
          annoList.push(this.uploadedIndexUrls[i]);
        } else {
          annoList.push({ 'text': this.tbiFileNames[i], 'value': this.uploadedIndexUrls[i] });
        }
      }
      return annoList;
    },
    // Returns true if external source (Mosaic) has >1 multi-sample vcf file associated with the normal samples
    // Does NOT mean data is spread over multiple vcf files
    multipleVcfsExist: function () {
      return (this.externalLaunchMode && this.uploadedSelectedSampleLists.length > 0
        && this.uploadedSelectedSampleLists[0].length > 1);
    }
  },
  methods: {
    onUrlChange: function () {
      if (this.url && this.indexUrl && this.selectedBuild) {
        // If we autofill, don't have to parse object itself
        let url = this.url.value ? this.url.value : this.url;
        let index = this.indexUrl.value ? this.indexUrl.value : this.indexUrl;
        this.onVcfUrlEntered(url, index);
      } else if (this.url === '' || this.indexUrl === '') {
        this.$emit('clear-model-info', null);
      }
      if (this.selectedBuild !== '') {
        this.$emit('on-build-change', this.selectedBuild);
      }
    },
    /* Asks cohort model to check vcf and returns number of samples in vcf
     * NOTE: in the future, if allowing for single vcfs per sample,
     * can cycle through each sampleModel and ask, then return this
     */
    onVcfUrlEntered: function (vcfUrl, tbiUrl, uploadedSelectedSamples) {
      const self = this;
      self.galaxySampleCap = Math.max(self.galaxySampleCap, self.galaxySampleCount);

      if (!uploadedSelectedSamples || uploadedSelectedSamples.length < 2) {
        self.$emit('clear-model-info', null);
      }
      return new Promise((resolve, reject) => {
        self.$emit('hide-alerts');
        self.displayLoader = true;
        self.cohortModel.sampleModelUtil.onVcfUrlEntered(vcfUrl, tbiUrl, function (success, sampleNames, hdrBuild) {
          self.displayLoader = false;
          if (success) {
            if (sampleNames.length < 2) {
              let alertText = 'It looks like your file only contains one sample - Oncogene is currently configured to work with at least one normal and one tumor sample. Please try again.';
              self.$emit('show-alert', 'error', alertText);
              reject();
            } else if (uploadedSelectedSamples && uploadedSelectedSamples.length >= 2) {
              // Check for correct build
              if (hdrBuild !== self.selectedBuild && self.selectedBuild !== '') {
                let warningText = "Warning: it looks like the selected genome build does not match the one reported in the header of the file.";
                self.$emit('show-alert', 'warning', warningText);
              }
              // Still populate drop-down lists
              // Note: don't have to filter vcf sample names when we provide only one list
              for (let i = 0; i < sampleNames.length; i++) {
                self.filteredVcfSampleNames.push(sampleNames[i]);
                self.vcfSampleNames.push(sampleNames[i]);
              }
              self.$emit('vcf-sample-names-updated', self.vcfSampleNames);

              // Update verified urls in model info objects
              self.$emit('update-model-info', 'vcfUrl', vcfUrl);
              self.$emit('update-model-info', 'tbiUrl', tbiUrl);

              // Flip front end flags
              self.urlsVerified = true;
              self.$emit('urls-verified');
              resolve();
            } else {
              if (uploadedSelectedSamples && sampleNames.length < uploadedSelectedSamples.length) {
                let alertText = 'The selected samples used in previous analyses could not be found, please re-select your samples.';
                self.$emit('show-alert', 'error', alertText);
              }
              // Check that build is correct
              if (hdrBuild !== self.selectedBuild && self.selectedBuild !== '') {
                let warningText = "Warning: it looks like the selected genome build does not match the one reported in the header of the file.";
                self.$emit('show-alert', 'warning', warningText);
                resolve();
              }

              // Extract actual urls out of objects
              let selectedVcfIdx = 0;
              if (self.externalLaunchMode) {
                let vcfListVals = [];
                self.vcfList.forEach(obj => {
                  vcfListVals.push(obj.value);
                })
                let strippedUrl = (typeof self.url === 'string' ? self.url : self.url.value);
                selectedVcfIdx = vcfListVals.indexOf(strippedUrl);
                if (self.externalLaunchMode && self.multipleVcfsExist) {
                  self.$emit('vcf-index-selected', selectedVcfIdx);
                }
              }

              // Set urls for removing/adding sample functionality
              self.url = vcfUrl;
              self.indexUrl = tbiUrl;

              // Create modelInfos and add to drop down lists in loader
              let infoList = [];
              for (let i = 0; i < sampleNames.length; i++) {
                // Only create modelInfos for samples that Mosaic has passed over in URL params
                if (self.externalLaunchMode && self.uploadedSelectedSampleLists && self.uploadedSelectedSampleLists.length > 0) {
                  let selectedSamples = self.uploadedSelectedSampleLists[selectedVcfIdx];
                  let currSampleFromFile = sampleNames[i];
                  if (selectedSamples.indexOf(currSampleFromFile) >= 0) {
                    let modelInfo = self.createModelInfo(currSampleFromFile, i !== 0, self.modelInfoIdx);
                    infoList.push(modelInfo);
                    self.modelInfoIdx++;
                    self.filteredVcfSampleNames.push(currSampleFromFile);
                  }
                } else if (self.externalLaunchSource === self.GALAXY) {
                  if (i < self.galaxySampleCap) {
                    let modelInfo = self.createModelInfo(sampleNames[i], i !== 0, self.modelInfoIdx);
                    infoList.push(modelInfo);
                    self.modelInfoIdx++;
                  }
                  self.filteredVcfSampleNames.push(sampleNames[i]);
                } else {
                  let modelInfo = self.createModelInfo(sampleNames[i], i !== 0, self.modelInfoIdx);
                  infoList.push(modelInfo);
                  self.modelInfoIdx++;
                  self.filteredVcfSampleNames.push(sampleNames[i]);
                }
                // Always add to vcfSampleNames array though, important for getting correct column from vcf file
                self.vcfSampleNames.push(sampleNames[i]);
              }
              self.$emit('set-model-info', infoList);

              // Toggle display flags
              self.urlsVerified = true;

              // Ensure if user adds sample after galaxy, it's allowed
              self.galaxySampleCap = Math.max;

              self.$emit('vcf-sample-names-updated', self.vcfSampleNames);
              resolve();
            }
          } else {
            let alertText = 'There was a problem accessing the provided vcf or tbi file, please check your url and try again. If the problem persists, please email iobioproject@gmail.com for assistance.';
            self.$emit('show-alert', 'error', alertText);
            self.$emit('upload-fail');
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
    createModelInfo: function (selectedSample, isTumor, modelInfoIdx) {
      return this.cohortModel.createModelInfo(selectedSample, isTumor, modelInfoIdx);
    },
    addTrack: function () {
      let newInfo = this.createModelInfo(null, true, this.modelInfoIdx);
      this.modelInfoList.push(newInfo);
      this.modelInfoIdx++;
    },
    deleteTrack: function (modelInfoIdx) {
      this.$emit('remove-model-info', modelInfoIdx);
      this.modelInfoIdx--;
    },
    isTumorTrack: function (modelInfo) {
      if (modelInfo.isTumor) {
        return 'Tumor';
      } else {
        return 'Normal';
      }
    },
    isRemovable: function (i) {
      return i > 1;
    },
    uploadConfigInfo: function (uploadedUrl, uploadedIndexUrl, uploadedBuild, uploadedSelectedSamples) {
      const self = this;

      this.url = uploadedUrl ? uploadedUrl : (this.uploadedUrls && this.uploadedUrls.length === 1) ? this.uploadedUrls[0] : null;
      this.indexUrl = uploadedIndexUrl ? uploadedIndexUrl : (this.uploadedIndexUrls && this.uploadedIndexUrls.length === 1) ? this.uploadedIndexUrls[0] : null;
      this.selectedBuild = uploadedBuild ? uploadedBuild : this.uploadedBuild;
      let selectedSamples = [];
      if (!this.multipleVcfsExist) {
        selectedSamples = uploadedSelectedSamples ? uploadedSelectedSamples :
            this.uploadedSelectedSampleLists.filter(list => { return list[0]; });
      }

      // Have to actually make model infos here for external configs
      if (this.externalLaunchMode) {
        let infoList = [];
        selectedSamples.forEach(sample => {
          let modelInfo = self.createModelInfo(sample, self.modelInfoIdx !== 0, self.modelInfoIdx);
          infoList.push(modelInfo);
          self.modelInfoIdx++;
        })
        if (infoList.length > 0) {
          self.$emit('set-model-info', infoList);
        }
      }

      if (this.url && this.indexUrl) {
        if (this.externalLaunchMode && this.uploadedUrls.length > 1) {
          this.onVcfUrlEntered(this.url.value, this.indexUrl.value, selectedSamples);
        } else {
          this.onVcfUrlEntered(this.url, this.indexUrl, selectedSamples);
        }
      }
    },
    populateRespectiveIndex: function() {
      if (!this.url) {
        return;
      }
      let indexIdx = this.uploadedUrls.indexOf(this.url.value);
      this.indexUrl = this.uploadedIndexUrls[indexIdx];
      this.onUrlChange();
    }
  },
  watch: {
    parentModelInfoIdx: function () {
      this.modelInfoIdx = this.parentModelInfoIdx;
    }
  },
  mounted: function () {
    // Coordinate with carousel to behave correctly for navigating then uploading
    this.$emit('vcf-form-mounted');

    // Check to see if we have info uploaded
    // NOTE: vcf-form may or may not be mounted yet
    this.uploadConfigInfo();
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

.drop
  padding-left: 19px
  padding-right: 19px

</style>