<template>
    <div :id="divId">
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
<!--                        <v-col class="shrink">-->
<!--                            <v-btn>Proceed</v-btn>-->
<!--                        </v-col>-->
                    </v-row>
                </v-alert>
                <v-carousel light class="start-carousel"
                            height="100%"
                            v-model="carouselModel"
                            :continuous="continuous"
                            :cycle="cycle"
                            :opactiy="1"
                >
                    <v-carousel-item :style="'background-color: ' + slideBackground">
                        <v-row class="flex-child mx-12 align-stretch" style="height: 100%">
                            <v-col class="d-flex align-stretch"
                                   cols="12" height="100">
                                <v-sheet class="d-flex flex-grow-1 flex-shrink-0"
                                         :color="slideBackground">
                                    <v-row justify="center" align="center" class="mb-auto" style="height: 90%">
                                        <v-col md="auto">
                                            <v-row justify-center class="pb-8">
                                                <div style="text-align: center; width: 100%; font-family: Quicksand; font-size: 48px; color: #7f1010">
                                                    ONCOGENE.IOBIO
                                                </div>
                                            </v-row>
                                            <v-row justify="center" class="pa-3">
                                                <v-btn x-large color="secondary" class="carousel-btn"
                                                       @click="advanceSlide">
                                                    Start New Analysis
                                                </v-btn>
                                            </v-row>
<!--                                            <v-row justify="center" class="pa-3">-->
<!--                                                <v-btn x-large color="secondary" class="carousel-btn"-->
<!--                                                       @click="$emit('load-demo')">-->
<!--                                                    Try Demo Analysis-->
<!--                                                </v-btn>-->
<!--                                            </v-row>-->
                                            <v-row justify="center" class="pa-3">
                                                <v-btn x-large color="secondary" class="carousel-btn"
                                                       @click="displayConfigUploadSlide">Upload Analysis
                                                </v-btn>
                                            </v-row>
                                            <v-row :hidden="!showUploadEntry" justify="center" class="pa-3">
                                                <v-file-input v-model="configFile" accept=".json"
                                                              label="Click to Select File"
                                                              @change="checkAndUploadConfig"></v-file-input>
                                            </v-row>
                                        </v-col>
                                    </v-row>
                                </v-sheet>
                            </v-col>
                        </v-row>
                    </v-carousel-item>

                    <v-carousel-item :style="'background-color: ' + slideBackground">
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
                                <v-card-actions class="function-card-body">
                                    <v-container fluid>
                                        <v-row v-for="i in DATA_MODELS.length"
                                               :key="'checkbox-' + i"
                                               no-gutters dense>
                                            <v-col cols="4"></v-col>
                                            <v-col cols="6">
                                                <v-checkbox
                                                        dense v-model="userData" color="appColor"
                                                        :label="DATA_DESCRIPTORS[i-1] + ' (.' + FILE_DESCRIPTORS[i-1] + ')'"
                                                        :value="DATA_MODELS[i-1]"
                                                        @click="onDataChecked(DATA_MODELS[i-1])">
                                                </v-checkbox>
                                            </v-col>
                                        </v-row>
                                    </v-container>
                                </v-card-actions>
                            </v-card>
                        </v-card>
                    </v-carousel-item>
                    <v-carousel-item :style="'background-color: ' + slideBackground">
                        <v-card class="d-flex align-stretch justify-center base-card" :color="slideBackground" flat
                                light>
                            <v-card shaped class="pa-2 ml-8 mr-6 justify-center about-card" width="30%"
                                    :elevation="aboutElevation">
                                <v-card-title class="about-title">
                                    Somatic Calling
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
                                                <v-radio-group v-model="somaticCallsOnly">
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
                    <v-carousel-item :style="'background-color: ' + slideBackground">
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
                                        <v-select
                                                :items="geneListNames"
                                                color="appColor"
                                                background-color="white"
                                                label="Cancer Type (Panel Name)"
                                                outlined
                                                clearable
                                                v-model="selectedList"
                                                @change="populateListInput"
                                        ></v-select>
                                        <v-textarea
                                                color="appColor"
                                                background-color="white"
                                                outlined
                                                rows="10"
                                                label="Genes"
                                                :rules="geneRules"
                                                :value="listInput"
                                                @click="checkFirstClick"
                                        ></v-textarea>
                                    </v-container>
                                </v-card-actions>
                            </v-card>
                        </v-card>
                    </v-carousel-item>
                    <v-carousel-item v-for="i in userData.length" :key="'form-' + i"
                                     :style="'background-color: ' + slideBackground">
                        <v-card class="d-flex align-stretch justify-center base-card" :color="slideBackground" flat
                                light>
                            <v-card shaped class="pa-2 ml-8 mr-6 justify-center about-card" width="30%"
                                    :elevation="aboutElevation">
                                <v-card-title class="about-title">
                                    {{ getCardTitle(i) }}
                                </v-card-title>
                                <v-card-text class="about-text">
                                    {{ getFileText(userData[i-1]) }}
                                </v-card-text>
                            </v-card>
                            <vcf-form v-if="userData[i-1] === 'vcf'"
                                      ref="vcfFormRef"
                                      :cohortModel="cohortModel"
                                      :dataType="getDataType(userData[i-1])"
                                      :fileType="getFileType(userData[i-1])"
                                      :slideBackground="slideBackground"
                                      :modelInfoList="modelInfoList"
                                      :allDataModels="DATA_MODELS"
                                      :maxSamples="MAX_SAMPLES"
                                      :uploadedUrl="uploadedVcfUrl"
                                      :uploadedIndexUrl="uploadedTbiUrl"
                                      :uploadedSelectedSamples="uploadedSelectedSamples"
                                      :uploadedBuild="selectedBuild"
                                      :parentModelInfoIdx="modelInfoIdx"
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
                                      @vcf-form-mounted="vcfFormMounted=true">
                            </vcf-form>
                            <multi-source-form v-else-if="userData[i-1] !== 'summary'"
                                               ref="multiRef"
                                               :cohortModel="cohortModel"
                                               :dataType="getDataType(userData[i-1])"
                                               :modelType="userData[i-1]"
                                               :fileType="getFileType(userData[i-1])"
                                               :slideBackground="slideBackground"
                                               :modelInfoList="modelInfoList"
                                               :maxSamples="MAX_SAMPLES"
                                               @update-status="updateMultiStatus"
                                               @upload-fail="onUploadFail"
                                               @show-alert="displayAlert"
                                               @hide-alerts="hideAlerts">
                            </multi-source-form>
                            <v-card v-else light flat :color="slideBackground" class="pa-2 pl-0 function-card"
                                    width="70%">
                                <v-card-title class="justify-center function-card-title">
                                    Data Summary
                                </v-card-title>
                                <v-divider class="mx-12"></v-divider>
                                <v-card-actions class="function-card">
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
                                                        class="summary-label">
                                            {{s.text}}
                                            <small v-if="s.optional && !s.active">Not Selected</small>
                                            <small v-if="(!s.optional || (s.optional && s.active)) && !s.complete">Incomplete</small>
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
                                            {{s.text}}
                                            <small v-if="s.optional && !s.active">Not Selected</small>
                                            <small v-if="(!s.optional || (s.optional && s.active)) && !s.complete">Incomplete</small>
                                        </v-stepper-step>
                                    </v-stepper>
                                </v-card-actions>
                                <v-card-actions style="justify-content: center">
                                    <v-btn large class="config-btn" :disabled="!isReadyToLaunch()"
                                           @click="downloadConfig">
                                        Download Config
                                    </v-btn>
                                    <v-btn large color="secondary" class="launch-btn" :disabled="!isReadyToLaunch()"
                                           @click="launch">
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
    import geneListsByType from '../data/gene_lists.json'
    import validGenes from '../data/genes.json'
    import _ from 'lodash'

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
            }
        },
        data: function () {
            return {
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
                vcfFormMounted: false,
                uploadedVcfUrl: null,
                uploadedTbiUrl: null,
                uploadedSelectedSamples: [],
                launchedFromConfig: false,
                showError: false,
                errorText: 'Some alert text',
                showWarning: false,
                warningText: 'Some warning text',
                validGenesMap: {},
                geneListNames: [],
                selectedList: null,
                modelInfoIdx: 0,

                // static data
                DATA_DESCRIPTORS: [
                    'Variant Calls',
                    'Read Coverage',
                    'Copy Number',
                    'Raw RNAseq',
                    'Raw ATACseq'
                ],
                DATA_MODELS: [
                    'vcf',
                    'coverage',
                    'cnv',
                    'rnaSeq',
                    'atacSeq'
                ],
                LOCKED_DATA: {
                    'vcf': true,
                    'coverage': true,
                    'cnv': false,
                    'rnaSeq': false,
                    'atacSeq': false
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
                        'end coordinate, lesser copy number, and total copy number, respectively). Other data columns may exist in your tab-delimited file,' +
                        'however they will be ignored. The Facets program (by MSKCC) program outputs an ideal file for this purpose.',

                    summary: 'Please review the summary at left to confirm the type of data uploaded. Steps highlighted ' +
                            'in red indicate the data is mandatory, or has been checked, and is not complete. Please complete ' +
                        'or uncheck the data type as necessary to proceed. To save time upon launching this project for ' +
                        'subsequent analyses, download the configuration file, and use it on the first screen.',
                },
                MAX_SAMPLES: 6,
                aboutText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, ' +
                    'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ' +
                    'ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ' +
                    'ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate ' +
                    'velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat' +
                    ' cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' +
                    ' sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ' +
                    'ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ' +
                    'ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate ' +
                    'velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat' +
                    ' cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
                dataText: 'Oncogene.iobio consumes primary data including Variant Call Format (vcf), ' +
                    'Binary Alignment/Map (bam) files. Both variant calls and read coverage data ' +
                    'are required for the application to work. Optionally, copy number data ' +
                    'may be provided in the form of a tab-delimited file with certain required headers ' +
                    '(see the CNV panel for details), and raw ' +
                    'RNAseq and ATACseq reads may be provided in bam file format.',
                somaticText: 'Oncogene.iobio will perform somatic calling on your variant data for you ' +
                    'if your file contains both somatic and inherited variants. This is ' +
                    'performed by requiring each variant to pass a certain criteria of ' +
                    'frequency and observation thresholds in both the tumor and normal samples, ' +
                    'along with certain quality thresholds. If your file contains only somatic calls, ' +
                    'select \'Yes\' so this criteria will not be applied.',
                geneListText: 'Using the provided list, oncogene.iobio will find somatic variants ' +
                    'and provide a ranked list of impactful loci for inspection. Each provided list contains ' +
                    'genes implicated in the corresponding type of cancer. If the type of cancer is ' +
                    'unknown, or not provided in the dropdown, UCSF500 is a good place to start, or visit' +
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
                        active: true,
                        complete: false,
                        index: 4,
                        optional: false,
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
                    {
                        step: 'atacSeq',
                        active: false,
                        complete: false,
                        index: 7,
                        optional: true,
                        text: 'Upload ATACseq Data'
                    },
                    {
                        step: 'review',
                        active: true,
                        complete: false,
                        index: 8,
                        optional: false,
                        text: 'Complete Required Data'
                    },
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
                ],
                // retained (model) state
                userData: ['vcf', 'coverage', 'summary'],   // NOT GUARANTEED TO BE IN SAME ORDER AS dataModels
                somaticCallsOnly: false,
                selectedBuild: null,
                listInput: 'Select a type to populate gene list or enter your own', // TODO: need to check for duplicates before launching all calls
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
            }
        },
        methods: {
            makeItRain: function () {
                variantRainD3(this.d3, this.divId, this.welcomeWidth, this.welcomeHeight, this.navBarHeight);
            },
            advanceSlide: function () {
                this.carouselModel += 1;
            },
            // NOTE: not sure why, but clicking prepend checkbox icon caused this to fire twice (hence, debounce)
            onDataChecked: _.debounce(function (model) {
                // Check to see if we're trying to uncheck required type
                if (this.LOCKED_DATA[model]) {
                    this.showError = true;
                    this.errorText = 'Oncogene is currently configured to require this data type';
                    this.userData.push(model);
                }

                // Otherwise, remove if in list
                let existIdx = this.userData.indexOf(model);
                let isActive = false;
                if (existIdx > -1) {
                    this.userData.splice(existIdx, 1);
                } else {
                    // Or insert before summary slide
                    isActive = true;
                    this.userData.splice(this.userData.length - 1, 0, model);
                }
                this.updateStepProp(model, 'active', isActive);
            }, 100),
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
            getFileText: function(type) {
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
            getCardTitle: function(index) {
                let fileType = this.getFileType(this.userData[index-1]);
                if (fileType === 'summary') {
                    return 'Input Summary';
                } else {
                    return fileType.toUpperCase() + ' Input';
                }
            },
            populateGeneLists: function () {
                for (var listName in geneListsByType) {
                    this.geneListNames.push(listName);
                }
            },
            populateValidGenesMap: function () {
                validGenes.forEach((gene) => {
                    this.validGenesMap[gene['gene_name']] = true;
                });
            },
            populateListInput: function () {
                this.clearGeneListFlag = false;
                this.listInput = '';
                let geneList = geneListsByType[this.selectedList];
                if (geneList) {
                    geneList.forEach((gene) => {
                        this.listInput += gene + '\n';
                    });
                }
            },
            setModelInfo: function (info) {
                if (!info) {
                    this.updateStepProp('vcf', 'complete', false);
                    this.modelInfoList = [];
                } else {
                    this.updateStepProp('vcf', 'complete', true);
                    this.modelInfoList = info;
                }
                // Trick vue into update
                this.modelInfoList.push('foo');
                this.modelInfoList.pop();
            },
            setVcfSampleNames: function(vcfSampleNames) {
                this.vcfSampleNames = vcfSampleNames;
            },
            updateModelInfo: function (propName, propVal) {
                this.modelInfoList.forEach((modelInfo) => {
                    modelInfo[propName] = propVal;
                });
                // Only updating with valid info, can set to complete
                this.updateStepProp('vcf', 'complete', true);
            },
            removeModelInfo: function (modelInfoIdx) {
                this.modelInfoList.splice(modelInfoIdx, 1);
            },
            updateStepProp: function (stepName, propName, propStatus) {
                let matchingSteps = this.reqSteps.filter((step) => {
                    return step.step === stepName;
                });
                if (matchingSteps.length < 0) {
                    console.log("Couldn't find matching step to update prop status");
                } else {
                    matchingSteps[0][propName] = propStatus;
                }
                // Every time we update a complete status, check to see if we're all done
                if (propName === 'complete' && stepName !== 'review') {
                    this.updateStepProp('review', 'complete', this.isReadyToLaunch());
                }
            },
            updateMultiStatus: function (stepName, allCompleteStatus, allFinishedStatus) {
                this.updateStepProp(stepName, 'complete', allCompleteStatus === 1);
                if (allCompleteStatus && allFinishedStatus && this.launchedFromConfig) {
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
            checkFirstClick: function () {
                if (this.clearGeneListFlag) {
                    this.listInput = '';
                    this.clearGeneListFlag = false;
                }``
            },
            displayConfigUploadSlide: function () {
                this.showUploadEntry = true;
            },
            hideAlerts: function() {
                this.errorText = '';
                this.showError = false;
                this.warningText = '';
                this.showWarning = false;
            },
            displayAlert: function(whichAlert, alertText) {
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
                    // Don't add any verification parameters
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
                    newVal.atacSeqBamUrl = modelInfo.atacSeqBamUrl;
                    newVal.atacSeqBaiUrl = modelInfo.atacSeqBaiUrl;
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
            },
            checkAndUploadConfig: function () {
                const self = this;
                let reader = new FileReader();
                reader.readAsText(self.configFile);
                reader.onload = () => {
                    let result = reader.result;
                    let infoObj = JSON.parse(result);
                    if (!(infoObj['samples'] && infoObj['listInput'] && infoObj['dataTypes'])) {
                        self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
                        self.showError = true;
                    } else {
                        self.modelInfoList = infoObj['samples'];
                        self.userData = infoObj['dataTypes'];
                        // TODO: problem here is that if we have types other than base 2, not actually added to slide deck
                        // need to call
                        self.listInput = infoObj['listInput'];
                        self.updateStepProp('geneList', 'complete', true);
                        self.somaticCallsOnly = infoObj['somaticCallsOnly'];
                        self.selectedList = infoObj['selectedList'];
                        self.selectedBuild = infoObj['build'];

                        // Little extra work to fill in fields for vcf/tbi form
                        // Note: assumes single vcf
                        let firstSample = self.modelInfoList[0];
                        self.uploadedVcfUrl = firstSample.vcfUrl;
                        self.uploadedTbiUrl = firstSample.tbiUrl;

                        // if we have optional data types, set flags
                        if (firstSample['rnaSeqBamUrl']) {
                            self.updateStepProp('rnaSeq', 'active', true);
                        }
                        if (firstSample['atacSeqBamUrl']) {
                            self.updateStepProp('atacSeq', 'active', true);
                        }
                        if (firstSample['cnvUrl']) {
                            self.updateStepProp('cnv', 'active', true);
                        }
                        let selectedSamples = [];
                        self.modelInfoIdx = 0;
                        let modelInfoCount = 0;

                        // todo: we need to check for cnv, rnaseq, and atacseq here and call updateStepProp
                        // to get rid of 'Not Selected' badge for summary card for optional data

                        self.modelInfoList.forEach((modelInfo) => {
                            modelInfoCount++;
                            selectedSamples.push(modelInfo.selectedSample);
                        });
                        self.modelInfoIdx = modelInfoCount; // Update child component to stay on count
                        self.uploadedSelectedSamples = selectedSamples;
                        self.launchedFromConfig = true;

                        if (!(self.uploadedSelectedSamples && self.userData && self.listInput &&
                            self.uploadedVcfUrl && self.uploadedTbiUrl) || self.somaticCallsOnly == null) {
                            self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
                            self.showError = true;
                        }

                        self.clearGeneListFlag = false;

                        // Have to mount vcf slide to do actual checks
                        if (self.vcfFormMounted && self.$refs.vcfFormRef) {
                            self.$refs.vcfFormRef.forEach(ref => {
                                ref.uploadConfigInfo(self.uploadedVcfUrl, self.uploadedTbiUrl, self.selectedBuild, self.uploadedSelectedSamples);
                            });
                        }
                        self.mountVcfSlide();
                    }
                };
                reader.onerror = () => {
                    self.errorText = "There was missing or corrupted information in the configuration file: please try a different file or manually upload your information.";
                    self.showError = true;
                };
            },
            onUploadedUrlsVerified: function () {
                if (this.launchedFromConfig) {
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
            mountVcfSlide: function () {
                this.carouselModel = 4;
            },
            launch: function () {
                this.cohortModel.setInputDataTypes(this.userData);
                this.cohortModel.setBuild(this.selectedBuild);
                this.cohortModel.setCallType(this.somaticCallsOnly);

                // Set adjusted selected sample indices (account for any skipped samples)
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
                this.$emit('launched', this.modelInfoList, this.listInput);
            }
        },
        mounted: function () {
            // this.makeItRain();
            this.populateValidGenesMap();
            this.populateGeneLists();
            // todo: if we've already loaded, populate data here
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