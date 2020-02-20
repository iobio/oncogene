<template>
    <div :id="divId">
        <svg :width="welcomeWidth" :height="welcomeHeight">
            <g :transform="translation"></g>
        </svg>
        <v-overlay
                :absolute="absolute"
                :value="overlay"
                :opacity="opacity"
        >
            <v-card
                    elevation="24"
                    width="1000"
                    height="550"
                    class="mx-auto"
            >
                <v-carousel light class="start-carousel"
                            height="100%"
                            v-model="carouselModel"
                            :continuous="continuous"
                            :cycle="cycle"
                            :opactiy="1"
                >
                    <v-carousel-item :style="'background-color: ' + slideBackground">
                        <v-row class="flex-child mx-12 align-stretch" style="height: 90%">
                            <v-col class="d-flex align-stretch"
                                   cols="12" height="100">
                                <v-sheet class="d-flex flex-grow-1 flex-shrink-0"
                                         :color="slideBackground">
                                    <v-row justify="center" align="center" class="mb-auto" style="height: 90%">
                                        <v-col md="auto">
                                            <v-row justify="center" class="pa-3">
                                                <v-btn x-large color="secondary" class="carousel-btn"
                                                       @click="advanceSlide">
                                                    Start New Analysis
                                                </v-btn>
                                            </v-row>
                                            <v-row justify="center" class="pa-3">
                                                <v-btn x-large color="secondary" class="carousel-btn"
                                                       @click="$emit('load-demo')">
                                                    Try Demo Analysis
                                                </v-btn>
                                            </v-row>
                                            <v-row justify="center" class="pa-3">
                                                <v-btn x-large color="secondary" class="carousel-btn"
                                                       @click="$emit('upload-config')">Upload Analysis
                                                </v-btn>
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
                                <v-card-title>
                                    Required Inputs
                                </v-card-title>
                                <v-card-text class="about-text">
                                    {{ aboutText }}
                                </v-card-text>
                            </v-card>
                            <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
                                <v-card-title class="justify-center">
                                    What types of data do you have?
                                </v-card-title>
                                <v-card-subtitle class="about-subtitle">
                                    (Select all that apply)
                                </v-card-subtitle>
                                <v-divider class="mx-12"></v-divider>
                                <v-card-actions>
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
                                <v-card-title>
                                    Somatic Calling
                                </v-card-title>
                                <v-card-text class="about-text">
                                    {{ aboutText }}
                                </v-card-text>
                            </v-card>
                            <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
                                <v-card-title class="justify-center">
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
                                <v-card-title>
                                    Gene Loci Selections
                                </v-card-title>
                                <v-card-text class="about-text">
                                    {{ aboutText }}
                                </v-card-text>
                            </v-card>
                            <v-card light flat :color="slideBackground" class="pa-2 pl-0 function-card" width="70%">
                                <v-card-title class="justify-center">
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
                                        <!--TODO: put validator on this data-->
                                        <!--TODO: do we still want to show this if only somatic variants in file-->
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
                                <v-card-title>
                                    {{ (getFileType(userData[i-1])).toUpperCase() }} Input
                                </v-card-title>
                                <v-card-text class="about-text">
                                    {{ aboutText }}
                                </v-card-text>
                            </v-card>
                            <vcf-form v-if="userData[i-1] === 'vcf'"
                                      :cohortModel="cohortModel"
                                      :dataType="getDataType(userData[i-1])"
                                      :fileType="getFileType(userData[i-1])"
                                      :slideBackground="slideBackground"
                                      :modelInfoList="modelInfoList"
                                      :allDataModels="DATA_MODELS"
                                      :maxSamples="MAX_SAMPLES"
                                      @clear-model-info="setModelInfo"
                                      @set-model-info="setModelInfo"
                                      @remove-model-info="removeModelInfo">
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
                                               @update-status="updateMultiStatus">
                            </multi-source-form>
                            <v-card v-else light flat :color="slideBackground" class="pa-2 pl-0 function-card"
                                    width="70%">
                                <v-card-title class="justify-center">
                                    Data Summary
                                </v-card-title>
                                <v-divider class="mx-12"></v-divider>
                                <v-card-actions>
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
                                    <v-btn large class="config-btn" :disabled="!isReadyToLaunch">Download Config</v-btn>
                                    <v-btn large color="secondary" class="launch-btn" :disabled="!isReadyToLaunch">
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
            }
        },
        data: function () {
            return {
                // view state
                divId: 'variantRainDiv',
                cycle: false,
                continuous: false,
                absolute: false,
                opacity: 0.1,
                overlay: true,
                slideBackground: 'white',
                aboutElevation: 4,
                carouselModel: 0,
                clearGeneListFlag: true,

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
                    'facets',
                    'bam',
                    'bam'
                ],
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
                geneListNames: [],
                validGenesMap: {},
                selectedList: null,
                listInput: 'Select a type to populate gene list or enter your own', // TODO: need to check for duplicates before launching all calls
                modelInfoList: [],
                sampleIds: []
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
                    // TODO: make this prettier & create anonymous logging system to track if people want another entry vector
                    alert('Oncogene is currently configured to require this data type.');
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
            updateMultiStatus: function (stepName, allCompleteStatus) {
                this.updateStepProp(stepName, 'complete', allCompleteStatus === 1);
            },
            isReadyToLaunch: function() {
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
                }
            }
        },
        mounted: function () {
            this.makeItRain();
            this.populateValidGenesMap();
            this.populateGeneLists();
        }
    }
</script>

<style lang="sass">
    .start-carousel
        font-family: "Open Sans"
        font-size: 14px

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
            color: white
            font-weight: 500
            font-size: 18px

        .base-card
            height: 480px
            margin-left: 60px
            margin-right: 60px
            margin-top: 10px

        .about-card
            background-color: white
            color: #4a4a4a

            .v-card__title
                font-size: 16px

        .about-text
            height: 375px
            overflow: scroll

        .about-subtitle
            color: #888888 !important
            text-align: center !important

        .function-card
            color: #4a4a4a

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
</style>