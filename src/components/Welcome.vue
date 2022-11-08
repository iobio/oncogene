<template>
  <div :id="divId">
    <v-snackbar
        v-model="snackbar"
        :timeout=timeout
        shaped
        top
        color="secondary"
    >
      {{ this.listText + " list added to gene list" }}
      <template v-slot:action="{ attrs }">
        <v-btn
            color="blue"
            text
            v-bind="attrs"
            @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <svg v-if="!firstLoadComplete" :width="welcomeWidth" :height="welcomeHeight">
      <g :transform="translation"></g>
    </svg>
    <v-overlay
        :absolute="absolute"
        :value="true"
        :opacity="opacity"
    >
      <v-card
          elevation="24"
          width="1000"
          height="550"
          class="mx-auto"
          :style="'background: ' + slideBackground"
      >
        <v-system-bar class="mb-2 pt-3" color="white" v-if="firstLoadComplete">
          <v-spacer></v-spacer>
          <v-icon class="pt-2" large color="appGray" @click="$emit('toggle-carousel', false)">close</v-icon>
        </v-system-bar>
        <v-alert v-model="showError"
                 prominent
                 outlined
                 dismissible
                 color="warning"
                 icon="error"
                 class="caro-alert">
          <v-row align="center">
            <v-col class="grow">
              {{ errorText }}
            </v-col>
          </v-row>
        </v-alert>
        <v-alert v-model="showWarning"
                 prominent
                 outlined
                 dismissible
                 color="secondary"
                 icon="warning"
                 class="caro-alert">
          <v-row align="center">
            <v-col class="grow">
              {{ warningText }}
            </v-col>
          </v-row>
        </v-alert>
        <v-carousel light class="start-carousel"
                    height="100%"
                    v-model="carouselModel"
                    :continuous="continuous"
                    :cycle="cycle"
                    :opactiy="1"
        >
          <v-overlay :value="displayDemoLoader">
            <v-progress-circular indeterminate size="64"></v-progress-circular>
          </v-overlay>
          <v-carousel-item v-if="nativeLaunch" :style="'background-color: ' + slideBackground">
            <v-row class="flex-child mx-12 align-stretch" style="height: 100%">
              <v-col class="d-flex align-stretch"
                     cols="12" height="100">
                <!--                                todo: left off put transition on here for buttons-->
                <v-sheet class="d-flex flex-grow-1 flex-shrink-0"
                         :color="slideBackground">
                  <v-row justify="center" align="center" class="mb-auto" style="height: 90%">
                    <v-col md="10">
                      <v-row justify-center class="pb-8">
                        <div
                            style="text-align: center; width: 100%; font-family: Quicksand; font-size: 54px; color: #7f1010">
                          ONCOGENE.IOBIO
                        </div>
                      </v-row>
                      <v-row justify="center" class="pa-3">
                        <v-col md="5" class="mx-2">
                          <v-btn x-large block color="secondary" class="carousel-btn"
                                 @click="advanceSlide">
                            Start New Analysis
                          </v-btn>
                        </v-col>
                        <v-col md="5" class="mx-2">
                          <v-btn x-large block color="secondary" class="carousel-btn"
                                 @click="displayConfigUploadSlide">Upload Analysis
                          </v-btn>
                        </v-col>
                      </v-row>
                      <v-row justify="center" class="pa-3">
                        <v-col md="5" class="mx-2">
                          <v-btn x-large block color="#3a77ab" class="carousel-btn"
                                 @click="$emit('display-about')">About & Help
                          </v-btn>
                        </v-col>
                        <v-col md="5" class="mx-2">
                          <v-btn x-large block color="#3a77ab" class="carousel-btn"
                                 @click="loadDemoFromMosaic">Try Demo Analysis
                          </v-btn>
                        </v-col>
                      </v-row>
                      <v-row v-show="showUploadEntry" justify="center" class="pa-3">
                        <v-file-input v-model="configFile" accept=".json"
                                      label="Click to Select File"
                                      @change="checkAndUploadConfig">
                        </v-file-input>
                      </v-row>
                    </v-col>
                  </v-row>
                </v-sheet>
              </v-col>
            </v-row>
          </v-carousel-item>

          <v-carousel-item v-if="nativeLaunch" :style="'background-color: ' + slideBackground">
            <v-card class="d-flex align-stretch justify-center base-card" :color="slideBackground" flat
                    light>
              <v-card shaped class="pa-2 ml-8 mr-6 justify-center about-card" width="30%"
                      :elevation="aboutElevation">
                <v-card-title class="about-title">
                  Required Inputs
                </v-card-title>
                <v-card-text class="about-text">
                  {{ dataText }}
                </v-card-text>
              </v-card>
              <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
                <v-card-title class="justify-center function-card-title">
                  What types of data do you have?
                </v-card-title>
                <v-card-subtitle class="about-subtitle">
                  (Select all that apply)
                </v-card-subtitle>
                <v-divider class="mx-12"></v-divider>
                <v-card-actions class="mt-3">
                  <v-container fluid>
                    <v-row v-for="i in userData.length"
                           :key="'checkbox-' + i"
                           no-gutters dense>
                      <v-col cols="3"></v-col>
                      <v-col cols="8">
                        <v-checkbox v-if="userData[i-1].name !== 'summary'"
                                    dense
                                    v-model="userData[i-1].model"
                                    color="appColor"
                                    :label="DATA_DESCRIPTORS[i-1] + ' (.' + FILE_DESCRIPTORS[i-1] + ')' + (isRequired(DATA_MODELS[i-1]) ? ' [required]' : '')"
                                    :disabled="isRequired(DATA_MODELS[i-1])"
                                    @click.capture.stop="onDataChecked(DATA_MODELS[i-1])">
                        </v-checkbox>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card-actions>
              </v-card>
            </v-card>
          </v-carousel-item>
          <v-carousel-item v-if="!isMosaic(launchSource)" :style="'background-color: ' + slideBackground">
            <v-card class="d-flex align-stretch justify-center base-card" :color="slideBackground" flat
                    light>
              <v-card shaped class="pa-2 ml-8 mr-6 justify-center about-card" width="30%"
                      :elevation="aboutElevation">
                <v-card-title class="about-title">
                  Somatic Filtering
                </v-card-title>
                <v-card-text class="about-text">
                  {{ somaticText }}
                </v-card-text>
              </v-card>
              <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
                <v-card-title class="justify-center function-card-title">
                  Does your VCF file contain somatic variants only?
                </v-card-title>
                <v-divider class="mx-12"></v-divider>
                <v-card-actions style="height: 80%">
                  <v-container fluid class="align-stretch">
                    <v-row align="center">
                      <v-col cols="4"></v-col>
                      <v-col cols="6">
                        <v-radio-group v-model="somaticCallsOnly"
                                       @change="updateGeneListReq">
                          <v-radio color="appColor"
                                   key="som-false"
                                   label="No"
                                   :value="false"
                          ></v-radio>
                          <v-radio color="appColor"
                                   key="som-true"
                                   label="Yes"
                                   :value="true"
                          ></v-radio>
                        </v-radio-group>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card-actions>
              </v-card>
            </v-card>
          </v-carousel-item>
          <v-carousel-item v-if="isMosaic(launchSource) && !isReadyToLaunch()"
                           :style="'background-color: ' + slideBackground">
            <v-card class="d-flex align-stretch justify-center base-card" :color="slideBackground" flat
                    light>
              <v-card-title class="about-title">
                Loading Mosaic Data...
              </v-card-title>
            </v-card>
          </v-carousel-item>
          <v-carousel-item v-if="!somaticCallsOnly"
                           :style="'background-color: ' + slideBackground">
            <v-card class="d-flex align-stretch justify-center base-card" :color="slideBackground" flat
                    light>
              <v-card shaped class="pa-2 ml-8 mr-6 justify-center about-card" width="30%"
                      :elevation="aboutElevation">
                <v-card-title class="about-title">
                  Gene Loci Selections
                </v-card-title>
                <v-card-text class="about-text">
                  <p v-html="geneListText"></p>
                </v-card-text>
              </v-card>
              <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
                <v-card-title class="justify-center function-card-title">
                  What type of cancer are you examining?
                </v-card-title>
                <v-card-subtitle class="about-subtitle">
                  (If you're not sure, select UCSF500)
                </v-card-subtitle>
                <v-divider class="mx-12"></v-divider>
                <v-card-actions>
                  <v-container class="px-11">
                    <v-row no-gutters>
                      <v-col sm="12" class="pr-1">
                        <v-select
                            :items="cancerListNames"
                            color="appColor"
                            background-color="white"
                            label="Cancer Type"
                            outlined
                            dense
                            v-model="selectedCancerList"
                            @change="populateListInput('cancer')"
                        ></v-select>
                      </v-col>
                      <!--                                          todo: Leaving out as of Mar2021...-->
                      <!--                                          <v-col sm="6" class="pl-1">-->
                      <!--                                            <v-select-->
                      <!--                                                :items="tissueListNames"-->
                      <!--                                                color="appColor"-->
                      <!--                                                background-color="white"-->
                      <!--                                                label="Tissue Type"-->
                      <!--                                                outlined-->
                      <!--                                                dense-->
                      <!--                                                v-model="selectedTissueList"-->
                      <!--                                                @change="populateListInput('tissue')"-->
                      <!--                                            ></v-select>-->
                      <!--                                          </v-col>-->
                    </v-row>
                    <v-textarea
                        color="appColor"
                        background-color="white"
                        outlined
                        rows="8"
                        label="Genes"
                        :rules="geneRules"
                        v-model="listInput"
                        class="pt-1"
                        @click="checkFirstClick"
                    ></v-textarea>
                    <div class="v-text-field__details" style="margin-top: -25px">
                      <div class="v-messages theme--light">
                        <div class="v-messages__wrapper float-right">
                          {{ geneCount + ' genes' }}
                        </div>
                      </div>
                    </div>
                  </v-container>
                </v-card-actions>
              </v-card>
            </v-card>
          </v-carousel-item>
          <v-carousel-item v-for="(data, i) in selectedUserData" :key="'form-' + i"
                           :style="'background-color: ' + slideBackground">
            <v-card class="d-flex align-stretch justify-center base-card" :color="slideBackground" flat
                    light>
              <v-card shaped class="pa-2 ml-8 mr-6 justify-center about-card" width="30%"
                      :elevation="aboutElevation">
                <v-card-title class="about-title">
                  {{ getCardTitle(data) }}
                </v-card-title>
                <v-card-text class="about-text">
                  {{ getFileText(data) }}
                </v-card-text>
              </v-card>
              <vcf-form v-if="data === 'vcf' && canMountVcf"
                        ref="vcfFormRef"
                        :cohortModel="cohortModel"
                        :dataType="getDataType(data)"
                        :fileType="getFileType(data)"
                        :slideBackground="slideBackground"
                        :allDataModels="DATA_MODELS"
                        :maxSamples="MAX_SAMPLES"
                        :uploadedUrls="uploadedVcfUrls"
                        :uploadedIndexUrls="uploadedTbiUrls"
                        :uploadedSelectedSampleLists="uploadedSelectedSamples"
                        :uploadedBuild="selectedBuild"
                        :modelInfoList="modelInfoList"
                        :parentModelInfoIdx="modelInfoIdx"
                        :externalLaunchMode="!nativeLaunch"
                        :externalLaunchSource="launchSource"
                        :vcfFileNames="vcfNameList"
                        :tbiFileNames="tbiNameList"
                        :galaxySampleCount="galaxySampleCount"
                        @clear-model-info="setModelInfo"
                        @set-model-info="setModelInfo"
                        @remove-model-info="removeModelInfo"
                        @update-model-info="updateModelInfo"
                        @urls-verified="onUploadedUrlsVerified"
                        @upload-fail="onUploadFail"
                        @on-build-change="updateBuild"
                        @show-alert="displayAlert"
                        @hide-alerts="hideAlerts"
                        @vcf-sample-names-updated="setVcfSampleNames"
                        @vcf-form-mounted="vcfFormMounted=true"
                        @vcf-index-selected="updateLaunchParamSamples">
              </vcf-form>
              <multi-source-form v-else-if="data !== 'summary'"
                                 ref="multiRef"
                                 :cohortModel="cohortModel"
                                 :dataType="getDataType(data)"
                                 :modelType="data"
                                 :fileType="getFileType(data)"
                                 :slideBackground="slideBackground"
                                 :modelInfoList="modelInfoList"
                                 :maxSamples="MAX_SAMPLES"
                                 :configSampleCount="configSampleCount[data]"
                                 :launchSource="launchSource"
                                 :fileList="getFileList(data)"
                                 :indexList="getIndexList(data)"
                                 :fileNameList="getFileNameList(data)"
                                 :indexNameList="getIndexNameList(data)"
                                 :selectedSampleList="selectedSampleList"
                                 :externalLaunchMode="!nativeLaunch"
                                 @update-status="updateMultiStatus"
                                 @upload-fail="onUploadFail"
                                 @show-alert="displayAlert"
                                 @hide-alerts="hideAlerts"
                                 @multi-source-mounted="markMultiSourceMounted">
              </multi-source-form>
              <v-card v-else light flat :color="slideBackground" class="pa-2 pl-0 function-card"
                      width="70%">
                <v-card-title class="justify-center function-card-title">
                  Data Summary
                </v-card-title>
                <v-divider class="mx-12"></v-divider>
                <v-lazy>
                  <v-card-actions class="function-card pt-3">
                    <v-stepper class="summary-stepper"
                               light
                               vertical
                               non-linear
                               value="1"
                    >
                      <v-stepper-step v-for="(s,i) in firstHalfSteps"
                                      :key="'step-' + i"
                                      :complete="s.complete"
                                      :rules="[() => (!s.optional || (s.optional && s.active) ? s.complete : true)]"
                                      :step="s.index"
                                      class="summary-label my-2">
                        {{ s.text }}
                        <small v-if="isNotSelected(s)">{{
                            (s.step === 'geneList') ? 'Not Applicable' : 'Not Selected'
                          }}</small>
                        <small v-if="isIncomplete(s)">Incomplete</small>
                      </v-stepper-step>
                    </v-stepper>
                    <v-stepper class="summary-stepper"
                               light
                               vertical
                               non-linear
                               :value="reqSteps.length">
                      <v-stepper-step v-for="(s,i) in secondHalfSteps" :key="'step-' + i"
                                      :complete="s.complete"
                                      :rules="[() => (!s.optional || (s.optional && s.active) ? s.complete : true)]"
                                      :step="s.index"
                                      class="summary-label">
                        {{ s.text }}
                        <small v-if="isNotSelected(s)">Not Selected</small>
                        <small v-if="isIncomplete(s)">Incomplete</small>
                      </v-stepper-step>
                    </v-stepper>
                  </v-card-actions>
                </v-lazy>
                <v-card-actions style="justify-content: center">
                  <v-btn large class="config-btn" :disabled="!isReadyToLaunch()"
                         @click="downloadConfig">
                    Download Config
                  </v-btn>
                  <v-btn large color="secondary" class="launch-btn" :disabled="!isReadyToLaunch()"
                         @click="launch(false)">
                    Launch
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-card>
          </v-carousel-item>
        </v-carousel>
      </v-card>
    </v-overlay>
  </div>
</template>

<script>
import variantRainD3 from '../d3/VariantRain.d3.js'
import VcfForm from './VcfForm.vue'
import MultiSourceForm from './MultiSourceForm.vue'
import geneListsByCancerType from '../data/genes_by_cancer_type_ncgv6.json'
import geneListsByTissueType from '../data/genes_by_tissue_type_ncgv6.json'
import validGenes from '../data/genes.json'

export default {
  name: "Welcome",
  components: {
    VcfForm,
    MultiSourceForm
  },
  props: {
    d3: {
      type: Object,
      default: null
    },
    cohortModel: {
      type: Object,
      default: null
    },
    welcomeWidth: {
      type: Number,
      default: 0
    },
    welcomeHeight: {
      type: Number,
      default: 0
    },
    navBarHeight: {
      type: Number,
      default: 0
    },
    firstLoadComplete: {
      type: Boolean,
      default: false
    },
    launchSource: {
      type: String,
      default: null
    },
    launchParams: {
      type: Object,
      default: null
    },
    demoParams: {
      type: Object,
      default: null
    }
  },
  data: function () {
    return {
      // dynamic file imports
      demoFile: null,

      // constants
      GALAXY: 'galaxy',
      UTAH_MOSAIC: 'https://mosaic.chpc.utah.edu',
      CDDRC_MOSAIC: 'https://cddrc.utah.edu',
      VCF: 'vcf',
      COVERAGE: 'coverage',
      RNASEQ: 'rnaSeq',
      ATACSEQ: 'atacSeq',
      CNV: 'cnv',

      // view state
      divId: 'variantRainDiv',
      cycle: false,
      continuous: false,
      absolute: false,
      opacity: 0.3,
      overlay: true,
      slideBackground: 'white',
      aboutElevation: 4,
      carouselModel: 0,
      clearGeneListFlag: true,
      showUploadEntry: false,
      configFile: [],
      canMountVcf: true,
      vcfFormMounted: false,
      uploadedVcfUrls: null,
      uploadedTbiUrls: null,

      // Used for Mosaic/Galaxy integration launch
      fileLists: {
        'coverage': [],
        'rnaSeq': [],
        // 'atacSeq': [],
        'cnv': []
      },
      indexLists: {
        'coverage': [],
        'rnaSeq': [],
        // 'atacSeq': [],
      },
      fileNameLists: {
        'coverage': [],
        'rnaSeq': [],
        // 'atacSeq': [],
        'cnv': []
      },
      indexNameLists: {
        'coverage': [],
        'rnaSeq': [],
        // 'atacSeq': [],
      },

      // lists to make identifying drop-down urls easier in vcf/multi-sample cmpnts
      selectedSampleList: [],
      vcfNameList: [],
      tbiNameList: [],

      uploadedSelectedSamples: [], // this may be a single array of sample names, or an array of arrays (if launched from Mosaic w/ multiple vcfs)
      launchedFromConfig: false,
      showError: false,
      errorText: 'Some alert text',
      showWarning: false,
      warningText: 'Some warning text',
      validGenesMap: {},
      cancerListNames: [],
      tissueListNames: [],  // note: not currently using but leaving in for future
      selectedCancerList: null,
      selectedTissueList: null,
      mosaicGeneList: [],
      modelInfoIdx: 0,
      displayDemoLoader: false,
      galaxySampleCount: 6,

      // static data
      DATA_DESCRIPTORS: [
        'Variant Calls',
        'Read Coverage',
        'Copy Number',
        'Raw RNAseq',
        // 'Raw ATACseq'
      ],
      DATA_MODELS: [
        'vcf',
        'coverage',
        'cnv',
        'rnaSeq',
        // 'atacSeq'
      ],
      LOCKED_DATA: {
        'vcf': true,
        'coverage': false,
        'cnv': false,
        'rnaSeq': false,
        // 'atacSeq': false
      },
      FILE_DESCRIPTORS: [
        'vcf',
        'bam',
        'cnv',
        'bam',
        'bam'
      ],
      FILE_TEXT: {
        vcf: 'Oncogene.iobio accepts a single, multi-sample vcf file and requires a corresponding ' +
            'index (tbi) file. One normal sample and one tumor sample is required to be selected ' +
            'from the provided vcf file. Up to four more tumor samples may also be selected. ' +
            'Oncogene.iobio supports genome builds GRCh37 and GRCh38. For other build or ' +
            'other input format requests, please email iobioproject@gmail.com.',

        bam: 'Oncogene.iobio requires one coverage (bam) file and one index (bai) file ' +
            'per sample. Bam and bai files may exist in the same, or different, directories. ' +
            'If you don\'t have an index file, please see \'samtools index\' to create one. ' +
            'Local files are not currently accepted. For other input format requests, please ' +
            'contact support at iobioproject@gmail.com.',

        optionalBam: 'Oncogene.iobio optionally allows for one coverage (bam) file and one index (bai) file ' +
            'per sample. Bam and bai files may exist in the same, or different, directories. ' +
            'If you don\'t have an index file, please see \'samtools index\' to create one. ' +
            'Local files are not currently accepted. For other input format requests, please ' +
            'contact support at iobioproject@gmail.com.',

        cnv: 'Oncogene.iobio requires one copy number file per sample. This file must be tab-delimited and contain ' +
            'the following five headers: chr, start, end, lcn.em, and tcn.em (corresponding to chromosome, start coordinate, ' +
            'end coordinate, lesser copy number, and total copy number, respectively). Other data columns may exist in your tab-delimited file, ' +
            'however they will be ignored. The Facets program (by MSKCC) program outputs an ideal file for this purpose.',

        summary: 'Please review the summary at left to confirm the type of data uploaded. Steps highlighted ' +
            'in red indicate the data is mandatory, or has been checked, and is not complete. Please complete ' +
            'or uncheck the data type as necessary to proceed. To save time upon launching this project for ' +
            'subsequent analyses, download the configuration file, and use it on the first screen.',
      },
      MAX_SAMPLES: 6,
      dataText: 'Oncogene.iobio consumes primary data including Variant Call Format (vcf), ' +
          'Binary Sequencing Alignment/Map (bam) files. Both variant calls and sequencing read data ' +
          'are required for the application to work. Optionally, copy number data ' +
          'may be provided in the form of a tab-delimited file with certain required headers ' +
          '(see the CNV panel for details), and raw ' +
          'RNAseq reads may be provided in bam file format.',
      somaticText: 'Oncogene.iobio will perform somatic filtering on your variant data for you ' +
          'if your file contains both somatic and inherited variants. This is ' +
          'performed by requiring each variant to pass a certain criteria of ' +
          'frequency and observation thresholds in both the tumor and normal samples, ' +
          'along with certain quality thresholds. If your file contains only somatic calls, ' +
          'select \'Yes\' so this criteria will not be applied.',
      geneListText: 'Using the provided list, oncogene.iobio will find somatic variants ' +
          'and provide a ranked list of impactful loci for inspection. Each provided list, ' +
          'sourced from <a target="_blank" href="http://ncg.kcl.ac.uk/index.php">NCG6.0</a>, contains ' +
          'genes implicated in the corresponding type of cancer or found in cancers at the selected primary tissue.' +
          ' If the type of cancer is unknown, or not provided in the dropdown, UCSF500 is a good place to start, or visit' +
          ' <a target="_blank" href="https://genepanel.iobio.io">genepanel.iobio.io</a>' +
          ' to curate your own custom list.',
      reqSteps: [
        {
          step: 'variantType',
          active: true,
          complete: true,
          index: 1,
          optional: false,
          text: 'Enter Variant Type'
        },
        {
          step: 'geneList',
          active: true,
          complete: false,
          index: 2,
          optional: false,
          text: 'Enter Gene List'
        },
        {
          step: 'vcf',
          active: true,
          complete: false,
          index: 3,
          optional: false,
          text: 'Upload Variant Calls'
        },
        {
          step: 'coverage',
          active: false,
          complete: false,
          index: 4,
          optional: true,
          text: 'Upload Coverage Data'
        },
        {
          step: 'cnv',
          active: false,
          complete: false,
          index: 5,
          optional: true,
          text: 'Upload Copy Numbers'
        },
        {
          step: 'rnaSeq',
          active: false,
          complete: false,
          index: 6,
          optional: true,
          text: 'Upload RNAseq Data'
        },
        // {
        //   step: 'atacSeq',
        //   active: false,
        //   complete: false,
        //   index: 7,
        //   optional: true,
        //   text: 'Upload ATACseq Data'
        // },
        // {
        //   step: 'review',
        //   active: true,
        //   complete: false,
        //   index: 7,
        //   optional: false,
        //   text: 'Complete Required Data'
        // },
      ],
      geneRules: [
        v => !!v || 'At least one gene is required',
        v => {
          const self = this;
          let invalids = [];
          v.split('\n').forEach((gene) => {
            if (!self.validGenesMap[gene.toUpperCase()] && gene !== '') {
              invalids.push(gene.toUpperCase());
            }
          });
          let isValid = invalids.length === 0;
          self.updateStepProp('geneList', 'complete', isValid);
          return isValid || 'Cannot process the following genes: ' + invalids.join();
        },
        v => {
          let numGenes = v.split('\n').length;
          let isValid = numGenes < 1000;
          return isValid || 'Maximum number of genes is 1000';
        }
      ],
      multiMountedStatus: {
        'coverage': false,
        'cnv': false,
        'rnaSeq': false,
        // 'atacSeq': false
      },
      // retained (model) state
      userData: [
        {name: 'vcf', model: true},
        {name: 'coverage', model: false},
        {name: 'cnv', model: false},
        {name: 'rnaSeq', model: false},
        // {name: 'atacSeq', model: false},
        {name: 'summary', model: true}],        // NOT GUARANTEED TO BE IN SAME ORDER AS dataModels
      selectedUserData: ['vcf', 'summary'],       // List of current cards in carousel
      configSampleCount: {                        // Used to advance slide when optional data count less than total sample count
        'cnv': this.MAX_SAMPLES,
        'rnaSeq': this.MAX_SAMPLES,
        // 'atacSeq': this.MAX_SAMPLES
      },
      somaticCallsOnly: false,
      selectedBuild: null,
      STARTING_INPUT: 'Select a type to populate gene list or enter your own',
      listInput: '',
      listText: '',
      geneCount: 0,
      snackbar: false,
      timeout: 2000,
      modelInfoList: [],
      vcfSampleNames: []
    }
  },
  computed: {
    translation: function () {
      return 'translate(20, 50)'
    },
    firstHalfSteps: function () {
      return this.reqSteps.slice(0, (this.reqSteps.length / 2));
    },
    secondHalfSteps: function () {
      return this.reqSteps.slice((this.reqSteps.length / 2));
    },
    nativeLaunch: function () {
      return this.launchSource !== this.GALAXY && this.launchSource !== this.UTAH_MOSAIC
          && this.launchSource !== this.CDDRC_MOSAIC;
    }
  },
  watch: {
    listInput: function () {
      if (this.listInput === this.STARTING_INPUT || this.listInput === '') {
        this.geneCount = 0;
      } else {
        this.geneCount = this.listInput.split('\n').length;
      }
    }
  },
  methods: {
    makeItRain: function () {
      variantRainD3(this.d3, this.divId, this.welcomeWidth, this.welcomeHeight, this.navBarHeight);
    },
    advanceSlide: function () {
      this.carouselModel += 1;

      // If we've loaded the config completely, turn off advance flag
      // so if user circles back to edit, won't advance unexpectedly
      const baseIdx = this.geneCount > 0 ? 3 : 2;
      if (this.carouselModel === baseIdx + this.selectedUserData.length) {
        this.launchedFromConfig = false;
      }
    },
    // Programmatically checks data type ON - used for Galaxy and Mosaic integrations. Updates loader accordingly.
    addDataType: function (model) {
      for (let i = 0; i < this.userData.length; i++) {
        let dataObj = this.userData[i];
        if (dataObj.name === model) {
          dataObj.model = true;
          break;
        }
      }
      this.onDataChecked(model);
    },
    onDataChecked: function (model) {
      // Set model to opposite
      let isActive = false;
      for (let i = 0; i < this.userData.length; i++) {
        let dataObj = this.userData[i];
        if (dataObj.name === model) {
          isActive = dataObj.model;

          // Insert or delete from our computed list for carousel cards
          if (dataObj.model) {
            // Account for any missing cards prior to get proper insertion index
            let decCount = 0;
            for (let j = 0; j < i; j++) {
              let currObj = this.userData[j];
              if (!currObj.model) {
                decCount++;
              }
            }
            this.selectedUserData.splice((i - decCount), 0, dataObj.name);
          } else {
            let selectedIdx = this.selectedUserData.indexOf(model);
            this.selectedUserData.splice(selectedIdx, 1);
            // Clear data from slide we just removed
            this.clearModelInfo(model);
            this.updateStepProp(model, 'complete', false);
          }
          break;
        }
      }
      this.updateStepProp(model, 'active', isActive);
    },
    clearModelInfo: function (modelName) {
      if (modelName === 'cnv') {
        this.modelInfoList.forEach(modelInfo => {
          modelInfo.cnvUrl = null;
        });
      } else if (modelName === 'rnaSeq' || modelName === 'atacSeq') {
        this.modelInfoList.forEach(modelInfo => {
          modelInfo[modelName + 'BamUrl'] = null;
          modelInfo[modelName + 'BaiUrl'] = null;
          modelInfo[modelName + 'Verified'] = false;
        });
      }
    },
    isRequired: function (dataType) {
      return dataType === 'vcf';
    },
    getFileType: function (type) {
      let idx = this.DATA_MODELS.indexOf(type);
      if (idx < 0) {
        return 'summary';
      }
      return this.FILE_DESCRIPTORS[idx];
    },
    getDataType: function (type) {
      let idx = this.DATA_MODELS.indexOf(type);
      return this.DATA_DESCRIPTORS[idx];
    },
    getFileText: function (type) {
      let idx = this.DATA_MODELS.indexOf(type);
      if (idx < 0) {
        return this.FILE_TEXT['summary'];
      }
      let fileType = this.FILE_DESCRIPTORS[idx];
      if (type === 'atacSeq' || type === 'rnaSeq') {
        fileType = 'optionalBam';
      }
      return this.FILE_TEXT[fileType];
    },
    getFileList: function (type) {
      return this.fileLists[type] ? this.fileLists[type] : [];
    },
    getIndexList: function (type) {
      return this.indexLists[type] ? this.indexLists[type] : [];
    },
    getFileNameList: function (type) {
      return this.fileNameLists[type] ? this.fileNameLists[type] : [];
    },
    getIndexNameList: function (type) {
      return this.indexNameLists[type] ? this.indexNameLists[type] : [];
    },
    getCardTitle: function (type) {
      if (type === 'summary') {
        return 'Input Summary';
      }

      let idx = -1;
      for (let i = 0; i < this.userData.length; i++) {
        let currData = this.userData[i];
        if (type === currData.name) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) {
        let fileType = this.getFileType(this.userData[idx].name);
        return fileType.toUpperCase() + ' Input';
      }
    },
    populateGeneLists: function () {
      for (var listName in geneListsByCancerType) {
        this.cancerListNames.push(listName);
      }
      // If we have a Mosaic-passed list, put at top
      if (this.isMosaic(this.launchSource) && this.launchParams.geneListName) {
        this.cancerListNames.splice(0, 0, this.launchParams.geneListName);
        this.mosaicGeneList = this.launchParams.genes;
      }

      // Note: not currently using tissue lists, but leaving in
      for (var tissueListName in geneListsByTissueType) {
        this.tissueListNames.push(tissueListName);
      }
    },
    populateValidGenesMap: function () {
      validGenes.forEach((gene) => {
        this.validGenesMap[gene['gene_name']] = true;
      });
    },
    populateListInput: function (listType) {
      this.clearGeneListFlag = false;
      if (this.listInput === this.STARTING_INPUT) {
        this.listInput = '';
      }
      let selectedList = this.selectedCancerList;
      let geneList = [];

      // Special case for Mosaic passed list
      if (selectedList.startsWith('Mosaic provided')) {
        geneList = this.mosaicGeneList;
      } else {
        geneList = geneListsByCancerType[selectedList];
        if (listType === 'tissue') {
          selectedList = this.selectedTissueList;
          geneList = geneListsByTissueType[selectedList];
        }
      }

      if (geneList) {
        geneList.forEach((gene) => {
          this.listInput += gene + '\n';
        });
      }

      // Update snackbar
      this.listText = selectedList;
      this.snackbar = true;

      //this.updateGeneCount();
    },
    setModelInfo: function (info) {
      if (!info) {
        this.updateStepProp('vcf', 'complete', false);
        this.modelInfoList = [];
      } else {
        this.updateStepProp('vcf', 'complete', true);
        this.modelInfoList = info;
      }

      // Add non-vcf sample data if coming from Mosaic/Galaxy
      if (!this.nativeLaunch && info) {
        this.updateNonVcfModelInfo();
      }

      // Trick vue into update
      this.modelInfoList.push('foo');
      this.modelInfoList.pop();
    },
    updateNonVcfModelInfo: function () {
      const self = this;

      // Clear out any state from before
      self.selectedSampleList = [];

      let samples = [this.launchParams.normal];
      samples = samples.concat(this.launchParams.tumors);
      let props = ['coverageBamUrl', 'coverageBaiUrl', 'rnaSeqBamUrl', 'rnaSeqBamUri', 'cnvUrl'];
      let sampleIdx = 0;
      samples.forEach(sample => {
        let vals = [sample.coverageBam, sample.coverageBai, sample.rnaSeqBam, sample.rnaSeqBai, sample.cnv];
        if (self.launchSource === self.GALAXY) {
          self.updateIndividualModelInfo(sampleIdx, props, vals);
        } else {
          let selectedSample = self.nativeLaunch ? sample.selectedSample : sample.selectedSamples[sample.selectedSampleIdx];
          self.selectedSampleList.push(selectedSample);
          self.updateIndividualModelInfo(selectedSample, props, vals);
        }
        sampleIdx++;
      })
    },
    setVcfSampleNames: function (vcfSampleNames) {
      this.vcfSampleNames = vcfSampleNames;
    },
    updateModelInfo: function (propName, propVal) {
      this.modelInfoList.forEach((modelInfo) => {
        modelInfo[propName] = propVal;
      });
      // Only updating with valid info, can set to complete
      this.updateStepProp('vcf', 'complete', true);
    },
    /* Updates all properties corresponding to propNames for a single model info object.
     * selectedSample argument may be a string corresponding to the selectedSample name
     * like for Mosaic, or may be an index for which modelInfo in the array for
     * Galaxy situations, when we don't have selectedSample names passed and just
     * want to update in order of what was passed. */
    updateIndividualModelInfo: function (selectedSample, propNames, propVals) {
      let modelInfo = null;
      if ((typeof selectedSample) === "string") {
        modelInfo = this.modelInfoList.filter(m => (m.selectedSample === selectedSample))[0];
      } else if ((typeof selectedSample) === "number") {
        modelInfo = this.modelInfoList[selectedSample];
      }
      for (let i = 0; i < propNames.length; i++) {
        let propName = propNames[i];
        modelInfo[propName] = propVals[i];
      }
    },
    removeModelInfo: function (modelInfoIdx) {
      this.modelInfoList.splice(modelInfoIdx, 1);
    },
    // Called when we have multiple vcfs coming in from Mosaic and one has been selected
    // Allows for reactivity/selection of bams/cnvs
    updateLaunchParamSamples: function(vcfIdx) {
      let samples = [this.launchParams.normal];
      samples = samples.concat(this.launchParams.tumors);
      samples.forEach(sample => {
        sample.selectedSampleIdx = vcfIdx;
      });
    },
    updateStepProp: function (stepName, propName, propStatus) {
      for (let i = 0; i < this.reqSteps.length; i++) {
        let currStep = this.reqSteps[i];
        if (currStep.step === stepName) {
          currStep[propName] = propStatus;
          break;
        }
      }
      // Every time we update a complete status, check to see if we're all done
      if ((propName === 'complete' || propName === 'active') && stepName !== 'review') {
        this.updateStepProp('review', 'complete', this.isReadyToLaunch());
      }
    },
    updateMultiStatus: function (stepName, allCompleteStatus, allFinishedStatus) {
      this.updateStepProp(stepName, 'complete', allCompleteStatus === 1);
      if (allCompleteStatus && allFinishedStatus && (this.launchedFromConfig || !this.nativeLaunch)) {
        this.advanceSlide();
      }
    },
    isReadyToLaunch: function () {
      let ready = 1;
      this.reqSteps.forEach((step) => {
        ready &= ((step.active && step.step !== 'review') ? step.complete : 1);
      });
      return ready === 1;
    },
    markMultiSourceMounted: function (model) {
      this.multiMountedStatus[model] = true;
    },
    checkFirstClick: function () {
      if (this.clearGeneListFlag) {
        this.listInput = '';
        this.clearGeneListFlag = false;
      }
    },
    displayConfigUploadSlide: function () {
      this.showUploadEntry = true;
    },
    hideAlerts: function () {
      this.errorText = '';
      this.showError = false;
      this.warningText = '';
      this.showWarning = false;
    },
    displayAlert: function (whichAlert, alertText) {
      if (whichAlert === 'error') {
        this.errorText = alertText;
        this.showError = true;
      } else {
        this.warningText = alertText;
        this.showWarning = true;
      }
    },
    downloadConfig: function () {
      const self = this;

      // JSON.stringify
      let exportObj = {'dataTypes': self.userData};
      exportObj['listInput'] = self.listInput;
      exportObj['selectedList'] = self.selectedList;
      exportObj['somaticCallsOnly'] = self.somaticCallsOnly;
      exportObj['build'] = self.selectedBuild;

      let sampleArr = [];
      let order = 0;
      self.modelInfoList.forEach((modelInfo) => {
        let newVal = {};
        // Don't add any validation parameters
        newVal.id = modelInfo.id ? modelInfo.id : ('s' + order);
        newVal.order = modelInfo.order ? modelInfo.order : order;
        newVal.selectedSample = modelInfo.selectedSample;
        newVal.isTumor = modelInfo.isTumor;
        newVal.vcfUrl = modelInfo.vcfUrl;
        newVal.tbiUrl = modelInfo.tbiUrl;
        newVal.coverageBamUrl = modelInfo.coverageBamUrl;
        newVal.coverageBaiUrl = modelInfo.coverageBaiUrl;
        newVal.rnaSeqBamUrl = modelInfo.rnaSeqBamUrl;
        newVal.rnaSeqBaiUrl = modelInfo.rnaSeqBaiUrl;
        // newVal.atacSeqBamUrl = modelInfo.atacSeqBamUrl;
        // newVal.atacSeqBaiUrl = modelInfo.atacSeqBaiUrl;
        newVal.cnvUrl = modelInfo.cnvUrl;
        sampleArr.push(newVal);
        order++;
      });
      exportObj['samples'] = sampleArr;

      const exportFile = JSON.stringify(exportObj);
      const blob = new Blob([exportFile], {type: 'text/plain'});
      const e = document.createEvent('MouseEvents'),
          a = document.createElement('a');
      a.download = "oncogene_iobio_config.json";
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
      e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      a.dispatchEvent(e);
      self.$gtag.pageview("/downloadConfig");
    },
    checkAndUploadConfig: function () {
      const self = this;
      if (!self.configFile) {
        return;
      }

      // Clear out any previous data if this is a second upload
      self.clearUploadForm();

      let reader = new FileReader();
      reader.readAsText(self.configFile);
      reader.onload = () => {
        let result = reader.result;
        let infoObj = JSON.parse(result);
        let fulfillsList = infoObj['somaticCallsOnly'] || infoObj['listInput'];
        if (!(infoObj['samples'] && fulfillsList && infoObj['dataTypes'])) {
          self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
          self.showError = true;
        } else {
          self.modelInfoList = infoObj['samples'];
          self.selectedUserData = [];
          self.userData = infoObj['dataTypes'];
          self.userData.forEach(data => {
            if (data.model) {
              self.selectedUserData.push(data.name);
            }
          });

          self.listInput = infoObj['listInput'];
          self.updateStepProp('geneList', 'complete', true);
          self.somaticCallsOnly = infoObj['somaticCallsOnly'];

          // Clear out starting string from gene list if somatic only
          if (self.somaticCallsOnly) {
            self.listInput = "";
          }
          self.selectedList = infoObj['selectedList'];
          self.selectedBuild = infoObj['build'];

          // Little extra work to fill in fields for vcf/tbi form
          // Note: assumes single vcf
          let firstSample = self.modelInfoList[0];
          self.uploadedVcfUrls = [firstSample.vcfUrl];
          self.uploadedTbiUrls = [firstSample.tbiUrl];

          // if we have optional data types, set flags (may only have optional data for a single sample, so check all)
          let coverageActiveCount = 0;
          let rnaSeqActiveCount = 0;
          // let atacSeqActiveCount = 0;
          let cnvActiveCount = 0;
          for (let i = 0; i < self.modelInfoList.length; i++) {
            let currModelInfo = self.modelInfoList[i];
            if (currModelInfo['coverageBamUrl']) {
              coverageActiveCount++;
              // Just update for first one found
              if (coverageActiveCount === 1) {
                self.updateStepProp('coverage', 'active', true);
              }
            }
            if (currModelInfo['rnaSeqBamUrl']) {
              rnaSeqActiveCount++;
              // Just update for first one found
              if (rnaSeqActiveCount === 1) {
                self.updateStepProp('rnaSeq', 'active', true);
              }
            }
            // if (currModelInfo['atacSeqBamUrl']) {
            //   atacSeqActiveCount++;
            //   // Just update for first one found
            //   if (atacSeqActiveCount === 1) {
            //     self.updateStepProp('atacSeq', 'active', true);
            //   }
            // }
            if (currModelInfo['cnvUrl']) {
              cnvActiveCount++;
              // Just update for first one found
              if (cnvActiveCount === 1) {
                self.updateStepProp('cnv', 'active', true);
              }
            }
          }
          self.configSampleCount['cnv'] = cnvActiveCount;
          self.configSampleCount['coverage'] = coverageActiveCount;
          self.configSampleCount['rnaSeq'] = rnaSeqActiveCount;
          // self.configSampleCount['atacSeq'] = atacSeqActiveCount;

          let selectedSamples = [];
          self.modelInfoIdx = 0;
          let modelInfoCount = 0;

          self.modelInfoList.forEach((modelInfo) => {
            modelInfoCount++;
            if (typeof modelInfo.isTumor !== 'boolean') {
              modelInfo.isTumor = modelInfo.isTumor === 'true';  // Get rid of type casting issues
            }
            selectedSamples.push(modelInfo.selectedSample);
          });
          self.modelInfoIdx = modelInfoCount; // Update child component to stay on count
          self.uploadedSelectedSamples = selectedSamples;
          self.launchedFromConfig = true;

          if (!(self.uploadedSelectedSamples && self.userData && fulfillsList &&
              self.uploadedVcfUrls && self.uploadedTbiUrls) || self.somaticCallsOnly == null) {
            self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
            self.showError = true;
          }

          self.clearGeneListFlag = false;

          // Have to mount vcf slide to do actual checks
          if (self.vcfFormMounted && self.$refs.vcfFormRef) {
            self.$refs.vcfFormRef.forEach(ref => {
              if (self.uploadedVcfUrls.length > 1) {
                self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
                self.showError = true;
              } else {
                ref.uploadConfigInfo(self.uploadedVcfUrls[0], self.uploadedTbiUrls[0], self.selectedBuild, self.uploadedSelectedSamples);
              }
            });
          }
          self.mountVcfSlide(self.somaticCallsOnly);
          self.$gtag.pageview("/uploadConfig");
        }
      };
      reader.onerror = () => {
        self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
        self.showError = true;
      };
    },
    checkAndUploadExternalConfig: function () {
      const self = this;
      self.displayDemoLoader = true;
      let formattedSource = this.launchSource === this.GALAXY ? this.GALAXY : 'Mosaic';
      let displayWarning = function (warningText) {
        const warningType = 'error';
        self.displayAlert(warningType, warningText);
      }

      let coverageExists = false,
          rnaSeqExists = false,
          // atacSeqExists = false,
          cnvExists = false;

      let samples = [self.launchParams.normal];
      samples = samples.concat(self.launchParams.tumors);
      self.galaxySampleCount = samples.length;
      samples.forEach(sample => {

        // Create file-specific lists used for vcf-dropdown
        if (self.isMosaic(self.launchSource)) {
          for (let i = 0; i < sample.selectedSamples.length; i++) {
            if (self.uploadedSelectedSamples[i] == null) {
              self.uploadedSelectedSamples[i] = [sample.selectedSamples[i]];
            } else {
              self.uploadedSelectedSamples[i].push(sample.selectedSamples[i]);
            }
          }
        }

        // Optional fields
        if ((sample.coverageBam && !sample.coverageBai) || (sample.coverageBai && !sample.coverageBam)) {
          displayWarning('There was a problem passing coverage BAM file data from ' + formattedSource + '. Please try launching again, or contact iobioproject@gmail.com for assistance');
        } else {
          // Still need to check if this sample has optional data type
          if (sample.coverageBam) {
            self.fileLists[self.COVERAGE].push(sample.coverageBam);
            self.indexLists[self.COVERAGE].push(sample.coverageBai);
            self.fileNameLists[self.COVERAGE].push(sample.bamName);
            self.indexNameLists[self.COVERAGE].push(sample.baiName);
            coverageExists = true;
          }
        }
        if ((sample.rnaSeqBam && !sample.rnaSeqBai) || (sample.rnaSeqBai && !sample.rnaSeqBam)) {
          displayWarning('There was a problem passing RNA-seq BAM file data from ' + formattedSource + '. Please try launching again, or contact iobioproject@gmail.com for assistance');
        } else {
          // Still need to check if this sample has optional data type
          if (sample.rnaSeqBam) {
            self.fileLists[self.RNASEQ].push(sample.rnaSeqBam);
            self.indexLists[self.RNASEQ].push(sample.rnaSeqBai);
            self.fileNameLists[self.RNASEQ].push(sample.bamName);
            self.indexNameLists[self.RNASEQ].push(sample.baiName);
            rnaSeqExists = true;
          }
        }
        // if ((sample.atacSeqBam && !sample.atacSeqBai) || (sample.atacSeqBai && !sample.atacSeqBam)) {
        //   displayGalaxyWarning('There was a problem passing ATAC-seq BAM file data from Galaxy. Please try launching again, or contact iobioproject@gmail.com for assistance');
        // } else {
        // Still need to check if this sample has optional data type
        // if (sample.atacSeqBam) {
        //   self.fileLists[self.ATACSEQ].push(sample.atacSeqBam);
        //   self.indexLists[self.ATACSEQ].push(sample.atacSeqBai);
        //   atacSeqExists = true;
        // }
        // }
        if (sample.cnv) {
          self.fileLists[self.CNV].push('[' + sample.selectedSample + '] ' + sample.cnv);
          self.fileNameLists[self.CNV].push(sample.cnvName); // todo: this will need to be added when CNV added to integration
          cnvExists = true;
        }
      });

      // Toggle switches in loader
      if (coverageExists) {
        self.addDataType(self.COVERAGE);
      }
      if (rnaSeqExists) {
        self.addDataType(self.RNASEQ);
      }
      // if (atacSeqExists) {
      //   self.addDataType(self.ATACSEQ);
      // }
      if (cnvExists) {
        self.addDataType(self.CNV);
      }

      // todo: once Mosaic passes over the coverage/rnaseq/cnv data
      // todo: need to populate those slides and advance

      self.somaticCallsOnly = self.launchParams.somaticOnly === 'true';

      if (self.launchParams.genes) {
        self.listInput = self.launchParams.genes.join('\n');
        self.selectedCancerList = self.launchParams.geneListName ? self.launchParams.geneListName : null;
        self.clearGeneListFlag = false;
        self.updateStepProp('geneList', 'active', true);
        self.updateStepProp('geneList', 'complete', true);
        self.advanceSlide();
      } else if (self.launchParams.somaticOnly) {
        self.updateStepProp('geneList', 'complete', true);
      }
      self.displayDemoLoader = false;

      if (!self.uploadedVcfUrls || self.uploadedVcfUrls.length === 0 ||
          !self.uploadedTbiUrls || self.uploadedTbiUrls.length === 0) {
        displayWarning('Missing required data files from ' + formattedSource + '. Please try launching again, or contact iobioproject@gmail.com for assistance');
      }
    },
    clearUploadForm: function () {
      this.errorText = null;
      this.showError = false;
      this.modelInfoList = [];
      this.userData = [
        {name: 'vcf', model: true},
        {name: 'coverage', model: false},
        {name: 'cnv', model: false},
        {name: 'rnaSeq', model: false},
        // {name: 'atacSeq', model: false},
        {name: 'summary', model: true}];
      this.configSampleCount = {
        'cnv': this.MAX_SAMPLES,
        'coverage': this.MAX_SAMPLES,
        'rnaSeq': this.MAX_SAMPLES,
        // 'atacSeq': this.MAX_SAMPLES
      };
      this.listInput = '';
      this.somaticCallsOnly = false;
      this.selectedCancerList = null;
      this.selectedTissueList = null;
      this.selectedBuild = null;
      this.uploadedVcfUrls = null;
      this.uploadedTbiUrls = null;
      this.modelInfoIdx = 0;
      this.uploadedSelectedSamples = [];
      this.launchedFromConfig = true;
      this.clearGeneListFlag = false;
    },
    onUploadedUrlsVerified: function () {
      if (this.launchedFromConfig || !this.nativeLaunch) {
        this.advanceSlide();
      }
    },
    // If we have a config upload fail, we don't want to auto-advance when
    // the user starts to change things/ enter new data
    onUploadFail: function () {
      this.launchedFromConfig = false;
    },
    updateBuild: function (build) {
      this.selectedBuild = build;
    },
    mountVcfSlide: function (somaticCallsOnly) {
      const self = this;
      // Sloppy but works
      if (somaticCallsOnly) {
        setTimeout(() => {
          self.carouselModel = 3;
        }, 200);
      } else {
        this.carouselModel = 4;
      }
    },
    updateGeneListReq: function () {
      this.updateStepProp('geneList', 'optional', this.somaticCallsOnly);
      this.updateStepProp('geneList', 'active', !this.somaticCallsOnly);
      this.listInput = this.somaticCallsOnly ? '' : this.STARTING_INPUT;
    },
    isNotSelected: function (s) {
      return s.optional && !s.active;
    },
    isIncomplete: function (s) {
      return (!s.optional || (s.optional && s.active)) && !s.complete;
    },
    launch: function (demoMode = false) {
      this.cohortModel.setInputDataTypes(this.selectedUserData);
      this.cohortModel.setBuild(this.selectedBuild);
      this.cohortModel.setCallType(this.somaticCallsOnly);

      if (!demoMode) {
        let omittedSampleFlags = [];
        for (let i = 0; i < this.vcfSampleNames.length; i++) {
          omittedSampleFlags.push(1);
        }
        this.modelInfoList.forEach(modelInfo => {
          let idx = this.vcfSampleNames.indexOf(modelInfo.selectedSample);
          omittedSampleFlags[idx] = 0;
        });
        this.modelInfoList.forEach(modelInfo => {
          let bound = this.vcfSampleNames.indexOf(modelInfo.selectedSample);
          let numSkipBefore = 0;
          for (let i = 0; i < bound; i++) {
            numSkipBefore += omittedSampleFlags[i];
          }
          modelInfo.selectedSampleIdx = bound - numSkipBefore;
        });
      }
      this.$emit('launched', this.modelInfoList, this.listInput, demoMode);
    },
    createModelInfoFromParam: function(param, isTumor, modelInfoIdx) {
      let modelInfo = this.cohortModel.createModelInfo(param.selectedSamples[0], isTumor, modelInfoIdx);
      modelInfo.vcfUrl = param.vcfs[0];
      modelInfo.tbiUrl = param.tbis[0];
      modelInfo.coverageBamUrl = param.coverageBam;
      modelInfo.coverageBaiUrl = param.coverageBai;
      modelInfo.cnvUrl = param.cnv;
      return modelInfo;
    },
    loadDemoFromMosaic: function() {
      const self = this;
      self.promiseLoadDemoFromMosaic()
          .then(() => {
            self.launch(true);
          }).catch(err => {
            console.log("Problem launching demo data from Mosaic: " + err);
      });
    },
    promiseLoadDemoFromMosaic: function() {
      const self = this;
      self.displayDemoLoader = true;

      return new Promise((resolve, reject) => {
        // Create model infos
        self.modelInfoList = [];

        let normalModelInfo = this.createModelInfoFromParam(self.demoParams.normal, false, 0);
        self.modelInfoList.push(normalModelInfo);
        let tumors = self.demoParams.tumors;
        let modelInfoIdx = 1;
        tumors.forEach(tumor => {
          let tumorModelInfo = this.createModelInfoFromParam(tumor, true, modelInfoIdx);
          self.modelInfoList.push(tumorModelInfo);
          modelInfoIdx++;
        });

        // Set other necessary flags
        self.somaticCallsOnly = self.demoParams.somaticOnly;
        self.selectedUserData = ['vcf', 'coverage', 'summary'];
        if (self.demoParams.tumors[0].cnv) {
          self.selectedUserData = ['vcf', 'coverage', 'cnv', 'summary'];
        }
        self.listInput = self.demoParams.genes;
        self.uploadedVcfUrls = self.demoParams.vcfs;
        self.uploadedTbiUrls = self.demoParams.tbis;

        // read vcf and update vcfSampleNames prop to coordinate order
        self.cohortModel.sampleModelUtil.onVcfUrlEntered(self.uploadedVcfUrls[0], self.uploadedTbiUrls[0], function (success, sampleNames, hdrBuild) {
          if (success) {
            self.selectedBuild = hdrBuild;
            self.cohortModel.setBuild(self.selectedBuild);
            for (let i = 0; i < sampleNames.length; i++) {
              let sampleName = sampleNames[i];
              let matchingModelInfo = self.modelInfoList.filter(function(modelInfo) {
                return modelInfo.selectedSample === sampleName;
              });
              matchingModelInfo.selectedSampleIdx = i;
            }

            self.$gtag.pageview("/demo");
            resolve();
          } else {
            let alertText = 'There was a problem accessing the provided vcf or tbi file, please check your url and try again. If the problem persists, please email iobioproject@gmail.com for assistance.';
            self.displayAlert('error', alertText);
            reject();
          }
        })
      });
    },
    loadDemo: function () {
      const self = this;
      self.displayDemoLoader = true;

      const exportFile = JSON.stringify(self.demoFile);
      self.configFile = new Blob([exportFile], {type: 'text/plain'});

      let reader = new FileReader();
      reader.readAsText(self.configFile);
      reader.onload = () => {
        let result = reader.result;
        let infoObj = JSON.parse(result);
        let fulfillsList = infoObj['somaticCallsOnly'] || infoObj['listInput'];
        if (!(infoObj['samples'] && fulfillsList && infoObj['dataTypes'])) {
          self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
          self.showError = true;
        } else {
          self.modelInfoList = infoObj['samples'];
          //self.vcfSampleNames = infoObj['vcfSampleNames'];
          self.selectedUserData = [];
          self.userData = infoObj['dataTypes'];
          self.userData.forEach(data => {
            if (data.model) {
              self.selectedUserData.push(data.name);
            }
          });

          self.listInput = infoObj['listInput'];
          self.somaticCallsOnly = infoObj['somaticCallsOnly'];
          self.selectedList = infoObj['selectedList'];
          self.selectedBuild = infoObj['build'];

          // Little extra work to fill in fields for vcf/tbi form
          // Note: assumes single vcf
          let firstSample = self.modelInfoList[0];
          self.uploadedVcfUrls = [firstSample.vcfUrl];
          self.uploadedTbiUrls = [firstSample.tbiUrl];

          // if we have optional data types, set flags (may only have optional data for a single sample, so check all)
          let coverageActiveCount = 0;
          let rnaSeqActiveCount = 0;
          // let atacSeqActiveCount = 0;
          let cnvActiveCount = 0;
          for (let i = 0; i < self.modelInfoList.length; i++) {
            let currModelInfo = self.modelInfoList[i];
            if (currModelInfo['coverageBamUrl']) {
              coverageActiveCount++;
            }
            if (currModelInfo['rnaSeqBamUrl']) {
              rnaSeqActiveCount++;
            }
            // if (currModelInfo['atacSeqBamUrl']) {
            //   atacSeqActiveCount++;
            // }
            if (currModelInfo['cnvUrl']) {
              cnvActiveCount++;
            }
          }
          self.configSampleCount['cnv'] = cnvActiveCount;
          self.configSampleCount['coverage'] = coverageActiveCount;
          self.configSampleCount['rnaSeq'] = rnaSeqActiveCount;
          // self.configSampleCount['atacSeq'] = atacSeqActiveCount;

          let selectedSamples = [];
          self.modelInfoIdx = 0;
          let modelInfoCount = 0;

          self.modelInfoList.forEach((modelInfo) => {
            modelInfoCount++;
            if (typeof modelInfo.isTumor !== 'boolean') {
              modelInfo.isTumor = modelInfo.isTumor === 'true';  // Get rid of type casting issues
            }
            selectedSamples.push(modelInfo.selectedSample);
          });
          self.modelInfoIdx = modelInfoCount; // Update child component to stay on count
          self.uploadedSelectedSamples = selectedSamples;
          self.launchedFromConfig = true;

          if (!(self.uploadedSelectedSamples && self.userData && fulfillsList &&
              self.uploadedVcfUrls && self.uploadedTbiUrls) || self.somaticCallsOnly == null) {
            self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
            self.showError = true;
          }
          self.clearGeneListFlag = false;
        }

        self.cohortModel.sampleModelUtil.onVcfUrlEntered(self.uploadedVcfUrls[0], self.uploadedTbiUrls[0], function (success, sampleNames, hdrBuild) {
          if (success) {
            if (hdrBuild !== self.selectedBuild && self.selectedBuild !== '') {
              let warningText = "Warning: it looks like the selected genome build does not match the one reported in the header of the file.";
              self.$emit('show-alert', 'warning', warningText);
            }
            // Still populate drop-down lists
            for (let i = 0; i < sampleNames.length; i++) {
              self.vcfSampleNames.push(sampleNames[i]);
            }
            self.$gtag.pageview("/demo");
            self.launch(true);
          } else {
            let alertText = 'There was a problem accessing the provided vcf or tbi file, please check your url and try again. If the problem persists, please email iobioproject@gmail.com for assistance.';
            self.displayAlert('error', alertText);
          }
        })
      };
      reader.onerror = () => {
        self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
        self.showError = true;
      };
    },
    isMosaic: function (source) {
      return (source === this.UTAH_MOSAIC || source === this.CDDRC_MOSAIC);
    }
  },
  mounted: function () {
    const self = this;

    // this.makeItRain();
    this.listInput = this.STARTING_INPUT;
    // If we're launching for Mosaic, need to wait to mount vcf slide until urls checked
    this.canMountVcf = !this.isMosaic(this.launchSource);

    this.populateValidGenesMap();
    this.populateGeneLists();
    if (this.launchParams && this.launchParams.vcfs) {

      this.uploadedVcfUrls = this.launchParams.vcfs;
      this.uploadedTbiUrls = this.launchParams.tbis;
      this.vcfNameList = this.launchParams.vcfFileNames;
      this.tbiNameList = this.launchParams.tbiFileNames;

      // Ideally we have a single vcf coming in
      if (this.uploadedVcfUrls.length === 1 && this.uploadedTbiUrls.length === 1) {
        self.cohortModel.sampleModelUtil.onVcfUrlEntered(self.uploadedVcfUrls[0], self.uploadedTbiUrls[0], (success, sampleNames, build) => {
          if (success) {
            self.selectedBuild = build;
            self.canMountVcf = true;
            // Sloppy but works
            if (self.isMosaic(self.launchSource)) {
              setTimeout(() => {
                self.advanceSlide();
              }, 100);
            }
          } else {
            if (this.launchSource === this.GALAXY) {
              self.displayAlert('error', 'Could not read file data from Galaxy. Please try launching again, or contact iobioproject@gmail.com for assistance');
              console.log('Could not read vcf header from file passed by Galaxy');
            } else if (this.launchSource === this.CDDRC_MOSAIC || this.launchSource === this.UTAH_MOSAIC) {
              self.displayAlert('error', 'Could not read file data from Mosaic. Please try launching again, or contact iobioproject@gmail.com for assistance');
              console.log('Could not read vcf header from file passed by Mosaic');
            } else {
              self.displayAlert('error', 'Could not read parameterized file data. Please try launching again, or contact iobioproject@gmail.com for assistance');
              console.log('Something went wrong passing data to application...');
            }
          }
        });
      } else {
        self.canMountVcf = true;
        // Sloppy but works
        if (self.isMosaic(self.launchSource)) {
          setTimeout(() => {
            self.advanceSlide();
          }, 100);
        }
      }
    }
    if (!this.nativeLaunch) {
      this.checkAndUploadExternalConfig();
    }
  }
}
</script>

<style lang="sass">
.start-carousel
  color: #888888

  .v-carousel__controls
    background: #7f1010

    .v-item-group
      .v-carousel__controls__item
        color: #ededed !important

  .v-window__container
    .v-window__prev
      .v-btn
        background: #7f1010

        .v-btn__content
          .v-icon
            color: #ededed

    .v-window__next
      .v-btn
        background: #7f1010

        .v-btn__content
          .v-icon
            color: #ededed

  .start-carousel-card
    width: 75%
    height: 75%
    background: transparent

  .carousel-btn
    font-family: Quicksand
    color: white
    font-weight: 500
    font-size: 18px

  .base-card
    height: 480px
    margin-left: 60px
    margin-right: 60px
    margin-top: 10px

  .about-card
    font-family: 'Open Sans'
    background-color: white
    color: #4a4a4a

    .v-card__title
      font-size: 16px

  .about-title
    font-family: Quicksand !important
    font-size: 18px !important
    color: #888888

  .about-text
    font-family: 'Open Sans'
    height: 375px
    overflow: scroll
    justify-content: center

  .about-subtitle
    color: #888888 !important
    text-align: center !important

  .function-card-title
    font-family: 'Quicksand'
    font-size: 22px
    color: #888888

  .function-card
    color: #888888
    font-family: 'Open Sans'

  .summary-stepper
    width: 50%
    box-shadow: none !important
    -webkit-box-shadow: none !important

    .summary-label
      font-family: "Open Sans"
      font-size: 16px

      .v-stepper__label
        text-shadow: none !important

  .launch-btn
    font-family: Quicksand !important
    font-size: 20px !important
    font-weight: 700 !important

  .config-btn
    font-size: 14px !important

.caro-alert
  margin-bottom: 0 !important

</style>