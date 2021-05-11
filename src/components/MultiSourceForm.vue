<template>
  <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
    <v-card-title class="justify-center function-card-title">
      {{ dataType }} Data
    </v-card-title>
    <v-divider class="mx-12"></v-divider>
    <v-card-actions>
      <v-container v-if="modelInfoList.length < 2" class="info-blurb">
        <v-row class="flex-child mx-12 align-stretch" style="height: 100%">
          <v-col class="d-flex align-center" cols="12">
            Please enter a valid VCF url and select at least two samples to enter {{ dataType.toLowerCase() }}
            data
          </v-col>
        </v-row>
      </v-container>
      <v-container fluid v-else>
        <v-list dense flat>
          <v-list-item-group v-model="listInfo">
            <v-list-item v-for="(listInfo, i) in modelInfoList"
                         :key="'listInfo-' + i">
              <v-list-item-icon style="padding-top:25px">
                <v-icon large color="appColor">filter_{{ i + 1 }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content style="padding-bottom: 0">
                <v-row dense>
                  <v-col :md="columnWidth">
                    <v-select v-if="galaxyMode"
                              v-model="listInfo[key]"
                              :items="fileList"
                              item-color="secondary"
                              placeholder="Select file"
                              style="max-width: 185px"
                              dense
                              return-object
                              @change="populateRespectiveIndex(listInfo[key], i)">
                    </v-select>
                    <v-text-field v-else
                                  :label="'Enter .' + fileType +  ' URL'"
                                  hide-details
                                  dense
                                  v-model="listInfo[key]"
                                  color="appColor"
                                  @change="onUrlChange(i)"
                    ></v-text-field>
                  </v-col>
                  <v-col v-if="hasIndexFile" :md="columnWidth" style="padding-right: 0">
                    <v-select v-if="galaxyMode"
                              v-model="listInfo[indexKey]"
                              :items="indexList"
                              placeholder="Select index"
                              style="max-width: 185px"
                              dense>
                    </v-select>
                    <v-text-field v-else
                                  :label="'Enter .' + getIndexFileType() +  ' URL'"
                                  hide-details
                                  dense
                                  v-model="listInfo[indexKey]"
                                  color="appColor"
                                  style="padding-left: 10px"
                                  @change="onUrlChange(i)"
                    ></v-text-field>
                  </v-col>
                  <v-col md="2">
                    <v-list-item-icon v-if="listInfo[verifiedKey]" class="pt-2">
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
      default: function () {
        return [];
      }
    },
    maxSamples: {
      type: Number,
      default: 0
    },
    configSampleCount: {
      type: Number,
      default: null
    },
    launchSource: {
      type: String,
      default: null
    },
    fileList: {
      type: Array,
      default: function () {
        return [];
      }
    },
    indexList: {
      type: Array,
      default: function () {
        return [];
      }
    }
  },
  data: function () {
    return {
      displayLoader: false,
      displayBuild: false,
      allUrlsVerified: false,
      listInfo: null,
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
    },
    verifiedKey: function () {
      return this.modelType + 'Verified';
    },
    galaxyMode: function () {
      return this.launchSource === 'galaxy';
    }
  },
  methods: {
    /* Can add more data types here as need be */
    onUrlChange: function (i) {
      const self = this;
      self.modelInfoList[i][self.verifiedKey] = false;
      let url = self.modelInfoList[i][self.key];
      let indexUrl = self.modelInfoList[i][self.indexKey];
      if (self.fileType === 'bam' && url != null && url !== "" && indexUrl != null && indexUrl !== "") {
        self.checkBam(i, url, indexUrl)
            .then(() => {
              self.$emit('update-status', self.modelType, self.getAllInputStatus(), self.getInputFinishedStatus());
            });
      } else if (self.fileType === 'cnv' && url != null && url !== '') {
        // Check cnv file
        self.checkCnv(i, url)
            .then(() => {
              self.$emit('update-status', self.modelType, self.getAllInputStatus(), self.getInputFinishedStatus());
            })
      }
    },
    checkBam: function (modelInfoIdx, bamUrl, baiUrl) {
      const self = this;
      return new Promise((resolve) => {
        self.$emit('hide-alerts');
        self.displayLoader = true;
        self.cohortModel.sampleModelUtil.onBamUrlEntered(bamUrl, baiUrl, self.dataType, function (success) {
          self.displayLoader = false;
          if (success) {
            self.modelInfoList[modelInfoIdx][self.verifiedKey] = true;
          } else {
            let alertText = 'There was a problem accessing the provided bam or bai file, please check your url and try again. If the problem persists, please email iobioproject@gmail.com for assistance.';
            self.$emit('show-alert', 'error', alertText);
            self.$emit('upload-fail');
          }
          resolve();
        });
      });
    },
    checkCnv: function (modelInfoIdx, cnvUrl) {
      const self = this;
      return new Promise((resolve) => {
        self.$emit('hide-alerts');
        self.displayLoader = true;
        self.modelInfoList[modelInfoIdx][self.verifiedKey] = true;
        self.cohortModel.sampleModelUtil.onCnvUrlEntered(cnvUrl, function (success, errType) {
          self.displayLoader = false;
          if (success) {
            self.modelInfoList[modelInfoIdx][self.verifiedKey] = true;
          } else {
            let alertText = '';
            if (errType === 'badHeaders') {
              alertText = 'The provided file did not contain the required data fields. Please make sure your file is tab-delimited with the required headers listed to the left.';
            } else {
              alertText = 'There was a problem accessing the provided CNV file, please ensure the path is correct and try again.';
            }
            self.$emit('show-alert', 'error', alertText);
            self.$emit('upload-fail');
          }
          resolve();
        });
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
    getTumorStatus: function (i) {
      if (i === 0) {
        return 'NORMAL';
      } else {
        return 'TUMOR';
      }
    },
    deleteTrack: function (modelInfoIdx) {
      this.modelInfoList.splice(modelInfoIdx, 1);
    },
    getAllInputStatus: function () {
      let allVerified = true;
      // Only want to check slots that are active
      this.modelInfoList.forEach((modelInfo) => {
        // Only require bams for every sample if coverage type
        if (this.modelType === 'coverage') {
          allVerified &= modelInfo[this.verifiedKey];
          // Otherwise, make sure at least one entry filled
        } else {
          allVerified |= modelInfo[this.verifiedKey];
        }
      });
      return allVerified;
    },
    getInputFinishedStatus: function () {
      let allFinishedCount = 0;
      this.modelInfoList.forEach((modelInfo) => {
        allFinishedCount += modelInfo[this.verifiedKey] ? 1 : 0;
      });
      return this.configSampleCount ? (allFinishedCount === this.configSampleCount) : (allFinishedCount === this.modelInfoList.length);
    },
    checkForUpload: function () {
      const self = this;
      let allSamplesHaveUrls = true;
      let allSamplesHaveIndexUrls = true;

      self.modelInfoList.forEach((modelInfo) => {
        if (modelInfo[self.key] != null && modelInfo[self.key] !== '') {
          allSamplesHaveUrls &= true;
          if (self.fileType !== 'bam' || (self.fileType === 'bam'
              && modelInfo[self.indexKey] != null && modelInfo[self.indexKey] !== '')) {
            allSamplesHaveIndexUrls &= true;
          }
        }
      });
      if (allSamplesHaveUrls && allSamplesHaveIndexUrls) {
        for (let i = 0; i < self.modelInfoList.length; i++) {
          self.onUrlChange(i);
        }
      }
    },
    populateRespectiveIndex: function (fileName, i) {
      let indexIdx = this.fileList.indexOf(fileName);
      this.modelInfoList[i][this.indexKey] = this.indexList[indexIdx];
    }
  },
  mounted: function () {
    this.checkForUpload();
    this.$emit('multi-source-mounted', this.modelType);
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

.menuable__content__active
  [aria-selected="true"]
    .v-list-item__content
      background-color: rgb(25, 77, 129, 0.3)
</style>