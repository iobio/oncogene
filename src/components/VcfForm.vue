<template>
  <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
    <v-card-title class="justify-center function-card-title">
      {{ dataType }} Data
    </v-card-title>
    <v-divider class="mx-12"></v-divider>
    <v-card-actions>
      <v-container v-if="!urlsVerified">
        <div class="d-flex justify-center" style="margin-top:-10px">
          <v-radio-group row v-model="localData">
            <v-radio label="Cloud Data" :value="false"></v-radio>
            <v-radio label="Local Data" :value="true"></v-radio>
          </v-radio-group>
        </div>
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
        <v-file-input v-else-if="localData"
                      label="Select vcf file"
                      :rules="vcfRules"
                      v-model="file"
                      class="top-file"
                      @change="onFileChange()">
        </v-file-input>
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
        <v-file-input v-else-if="localData"
                      label="Select tbi file"
                      :rules="tbiRules"
                      v-model="indexFile"
                      class="bot-file"
                      @change="onFileChange()">
        </v-file-input>
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
                  @change="onChange()"
                  class="drop">
        </v-select>
      </v-container>
      <v-container v-if="urlsVerified" fluid style="padding-top: 0">
        <v-row justify=center align="start">
          <v-col md="auto" dense>
            <v-btn dark small color="secondary" @click="urlsVerified = false">Edit Urls</v-btn>
          </v-col>
        </v-row>
        <v-virtual-scroll
            id="selected-sample-scroller"
            :items="modelInfoList"
            :item-height="scrollItemHeight"
            :height="scrollerTotalHeight"
        >
          <template v-slot:default="{ item }">
            <v-list-item :key="'listInfo-' + modelInfoList.indexOf(item)">
              <v-list-item-icon style="padding-top:5px">
                <v-icon large color="appColor">filter_{{ modelInfoList.indexOf(item) + 1 }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content style="padding-bottom: 0">
                <v-row dense>
                  <v-col md="6">
                    <v-select
                        label="Sample"
                        v-model="item.selectedSample"
                        :items="filteredVcfSampleNames"
                        color="appColor"
                        autocomplete
                        dense
                        hide-details
                        @click="applyScrollableStyle"
                    ></v-select>
                  </v-col>
                  <v-col :md="isRemovable(modelInfoList.indexOf(item)) ? 3 : 6">
                    <v-switch class="px-0"
                              style="margin-top: -4px"
                              v-model="item.isTumor"
                              :label="item.isTumor ? 'Tumor' : 'Normal'">
                    </v-switch>
                  </v-col>
                  <v-col v-if="isRemovable(modelInfoList.indexOf(item))" :md="isRemovable(modelInfoList.indexOf(item)) ? 3 : 0">
                    <v-btn x-small outlined icon color="appHighlight" dark class="mt-0"
                            @click="deleteTrack(modelInfoList.indexOf(item))">
                      <v-icon>close</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-virtual-scroll>
        <v-btn v-if="modelInfoList.length < numSamplesInFile"
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
    d3: {
      type: Object,
      default: null
    },
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
    },
    configLocalVcf: {
      type: Boolean,
      default: false
    },
    lastConfigFileName: {
      type: String,
      default: ""
    },
    lastConfigIndexFileName: {
      type: String,
      default: ""
    }
  },
  data: function () {
    return {
      url: null,
      indexUrl: null,
      file: null,
      indexFile: null,
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
      numSamplesInFile: 0, // The number of samples in the selected vcf file
      genomeBuilds: ['GRCh37', 'GRCh38'],
      GALAXY: 'galaxy',
      URL: 'url',
      FILE: 'local',
      scrollItemHeight: 50,
      scrollerTotalHeight: 290,
      localData: false,
      vcfRules: [
        value => {
          if (!value || (value && value.name.length > 7
              && value.name.substring(value.name.length - 7) === '.vcf.gz')) {
            return true;
          } else {
            return 'vcf files must be of type .vcf.gz';
          }
        }
      ],
      tbiRules: [
        value => {
          if (!value || (value && value.name.length > 11
              && value.name.substring(value.name.length - 11) === '.vcf.gz.tbi'
              || value.name.substring(value.name.length - 11) === '.vcf.gz.csi')) {
            return true;
          } else {
            return 'index files must be of type .vcf.gz.tbi or .vcf.gz.csi';
          }
        }
      ]
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
    applyScrollableStyle: function() {
      const self = this;
      setTimeout(() => {
        self.d3.selectAll('.v-menu__content')
            .style('overflow-y', 'auto');
      }, 500);
    },
    onChange: function() {
      if (this.localData) {
        this.onFileChange();
      } else {
        this.onUrlChange();
      }
    },
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
    onFileChange: function() {
      if (this.file && this.indexFile && this.selectedBuild) {
        let selectedSamples = this.configLocalVcf ? this.uploadedSelectedSampleLists.filter(list => { return list[0]; }) : null;
        this.onVcfFileEntered(this.file, this.indexFile, selectedSamples);
      } else if (this.file == null || this.indexFile == null) {
        this.$emit('clear-model-info', null);
      }
      if (this.selectedBuild !== '') {
        this.$emit('on-build-change', this.selectedBuild);
      }
    },
    onVcfFileEntered: function(vcfFile, tbiFile, uploadedSelectedSamples) {
      const self = this;

      if (!uploadedSelectedSamples || uploadedSelectedSamples.length < 2) {
        self.$emit('clear-model-info', null);
      }
      return new Promise(resolve => {
        self.$emit('hide-alerts');
        self.displayLoader = true;
        self.cohortModel.sampleModelUtil.onVcfFileEntered(vcfFile, tbiFile, function (success, sampleNames, hdrBuild, vcfUrl, tbiUrl) {
          if (success) {
            self.numSamplesInFile = sampleNames.length;
            self.displayLoader = false;
            self.promiseUpdateModelInfo(self.FILE, vcfFile, tbiFile, hdrBuild, uploadedSelectedSamples, sampleNames)
                .then(() => {
                  // Also want to fill in file proxy urls for modelInfo objs
                  self.$emit('update-model-info', 'vcfUrl', vcfUrl);
                  self.$emit('update-model-info', 'tbiUrl', tbiUrl);
                  resolve();
                })
          } else {
            self.displayAccessAlert();
            resolve();
          }
        })
      });
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
      return new Promise(resolve => {
        self.$emit('hide-alerts');
        self.displayLoader = true;
        self.cohortModel.sampleModelUtil.onVcfUrlEntered(vcfUrl, tbiUrl, function (success, sampleNames, hdrBuild) {
          self.numSamplesInFile = sampleNames.length;
          self.displayLoader = false;
          if (success) {
            self.promiseUpdateModelInfo(self.URL, vcfUrl, tbiUrl, hdrBuild, uploadedSelectedSamples, sampleNames)
                .then(() => {
                  resolve();
                })
          } else {
            self.displayAccessAlert();
            resolve();
          }
        })
      })
    },
    displayAccessAlert: function() {
      let alertText = 'There was a problem accessing the provided vcf or tbi file, please check your url and try again. If the problem persists, please email iobioproject@gmail.com for assistance.';
      this.$emit('show-alert', 'error', alertText);
      this.$emit('upload-fail');
    },
    promiseUpdateModelInfo: function(mode, vcf, tbi, hdrBuild, uploadedSelectedSamples, sampleNames) {
      const self = this;
      let usingConfigWithLocalFiles = self.lastConfigFileName != null && self.lastConfigFileName !== "";

      return new Promise((resolve, reject) => {
        if (sampleNames.length < 2) {
          let alertText = 'It looks like your file only contains one sample - Oncogene is currently configured to work with at least one normal and one tumor sample. Please try again.';
          self.$emit('show-alert', 'error', alertText);
          reject();
        } else if (uploadedSelectedSamples && uploadedSelectedSamples.length >= 2 && !usingConfigWithLocalFiles) {
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
          if (mode === self.URL) {
            self.$emit('update-model-info', 'vcfUrl', vcf);
            self.$emit('update-model-info', 'tbiUrl', tbi);
          } else {
            self.$emit('update-model-info', 'vcfFile', vcf);
            self.$emit('update-model-info', 'tbiFile', tbi);
          }

          // Flip front end flags
          self.urlsVerified = true;
          self.$emit('sources-verified');
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
          if (mode === self.URL) {
            self.url = vcf;
            self.indexUrl = tbi;
          } else {
            self.file = vcf;
            self.indexFile = tbi;
          }

          // If we're using a local config, make sure names match up
          if (self.configLocalVcfName != null && (self.file.name !== self.lastConfigFileName || self.indexFile.name !== self.lastConfigIndexFileName)) {
            self.$emit('show-alert', 'warning', "One or more of the files you selected do not match the names of the files " +
                "previously selected for the configuration being uploaded. Things may not work properly, please double check loading settings " +
                "before launching.");
          }

          // Create modelInfos and add to drop down lists in loader
          let infoList = [];
          let modelInfo = null;
          let selectedSamples = [];
          let unsortedSampleList = [];  // Used only for config upload with local files
          let currSampleFromFile = null;
          for (var i = 0; i < sampleNames.length; i++) {
            // Only create modelInfos for samples that Mosaic has passed over in URL params
            if (self.externalLaunchMode && self.uploadedSelectedSampleLists && self.uploadedSelectedSampleLists.length > 0) {
              selectedSamples = self.uploadedSelectedSampleLists[selectedVcfIdx];
              currSampleFromFile = sampleNames[i];
              if (selectedSamples.indexOf(currSampleFromFile) >= 0) {
                modelInfo = self.createModelInfo(currSampleFromFile, i !== 0, self.modelInfoIdx);
                infoList.push(modelInfo);
                self.modelInfoIdx++;
                self.filteredVcfSampleNames.push(currSampleFromFile);
              }
            } else if (self.externalLaunchSource === self.GALAXY) {
              if (i < self.galaxySampleCap) {
                modelInfo = self.createModelInfo(sampleNames[i], i !== 0, self.modelInfoIdx);
                infoList.push(modelInfo);
                self.modelInfoIdx++;
              }
              self.filteredVcfSampleNames.push(sampleNames[i]);
            } else if (usingConfigWithLocalFiles && self.uploadedSelectedSampleLists && self.uploadedSelectedSampleLists.length > 0) {
              selectedSamples = self.uploadedSelectedSampleLists;
              currSampleFromFile = sampleNames[i];
              let selSampleIdx = selectedSamples.indexOf(currSampleFromFile)
              if (selSampleIdx >= 0) {
                modelInfo = self.createModelInfo(currSampleFromFile, i !== 0, selSampleIdx);
                unsortedSampleList.push(modelInfo);
                self.modelInfoIdx++;
                self.filteredVcfSampleNames.push(currSampleFromFile);
              }
            } else {
              modelInfo = self.createModelInfo(sampleNames[i], i !== 0, self.modelInfoIdx);
              if (mode === self.URL) {
                modelInfo.vcfUrl = vcf;
                modelInfo.tbiUrl = tbi;
              } else {
                modelInfo.vcfFile = vcf;
                modelInfo.tbiFile = tbi;
              }
              infoList.push(modelInfo);
              self.modelInfoIdx++;
              self.filteredVcfSampleNames.push(sampleNames[i]);
            }
            // Always add to vcfSampleNames array though, important for getting correct column from vcf file
            self.vcfSampleNames.push(sampleNames[i]);
          }
          if (usingConfigWithLocalFiles) {
            infoList = unsortedSampleList.sort(function (a, b) { return a.order - b.order});
          }

          self.$emit('set-model-info', infoList);

          // Toggle display flags
          self.urlsVerified = true;

          // Ensure if user adds sample after galaxy, it's allowed
          self.galaxySampleCap = Math.max;

          self.$emit('vcf-sample-names-updated', self.vcfSampleNames);
          resolve();
        }
      });
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
      const self = this;
      let newInfo = this.createModelInfo(null, true, this.modelInfoIdx);
      this.modelInfoList.push(newInfo);
      this.modelInfoIdx++;
      setTimeout(function () {
        document.getElementById("selected-sample-scroller").scrollTop = self.scrollItemHeight * (self.modelInfoList.length)
      }, 100);
    },
    deleteTrack: function (modelInfoIdx) {
      this.$emit('remove-model-info', modelInfoIdx);
      this.modelInfoIdx--;
    },
    isRemovable: function (i) {
      return i > 0;
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
          // todo: here's the part we're missing - making modelInfo obj per selected sample
          // todo: this will be wrong if we don't have any tumor samples
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

    this.localData = this.configLocalVcf;

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
  padding-top: 50px
  padding-bottom: 10px
  padding-left: 20px
  padding-right: 20px

.bot-url
  padding-bottom: 10px
  padding-left: 20px
  padding-right: 20px

.top-file
  padding-top: 50px
  padding-left: 10px
  padding-right: 20px

.bot-file
  margin-top: 0
  padding-top: 5px
  padding-left: 10px
  padding-right: 20px

.drop
  padding-left: 19px
  padding-right: 19px

</style>