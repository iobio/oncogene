<style lang="sass" scoped>
    @import ../assets/sass/variables
    #files-menu
        .btn
            border: 1px solid #965757
    .dropdown-button
        color: #888888
        font-family: Roboto !important
        font-size: 1rem
        font-weight: 500
        text-transform: uppercase
        letter-spacing: 0.0892857143em
        justify-content: start

    .menuable__content__active
        > form
            margin-left: 30px
            margin-right: 30px
            max-width: 720px
            font-size: 12px !important

        .input-group.radio
            margin-top: 0px
            margin-bottom: 0px

        .radio label
            line-height: 25px

        .input-group.radio-group
            padding-top: 0px

        .input-group__selections__comma
            font-size: 13px

        .input-group.input-group--selection-controls.switch
            label
                font-weight: normal
                font-size: 12px
                padding-left: 5px

    #files-form
        .radio-group
            .input-group__input
                min-height: 25px

        .loader
            display: inline-block
            margin-right: 2px

            img
                width: 20px
                height: 20px

        .sample-label
            span
                margin-top: 2px
                margin-bottom: 2px
                vertical-align: top
                margin-left: 0px
                font-size: 15px
                color: $app-color
                display: inline-block
                margin-right: 20px
            .switch
                display: inline-block
                width: 100px
</style>
<!--Taken from https://alligator.io/vuejs/file-select-component/-->
<style scoped>
    .file-select > .select-button {
        text-align: left;
        padding-left: 15px;
        padding-top: 6px;
        padding-botton: 6px;
        cursor: pointer;
        font-weight: 500;
    }

    /* Don't forget to hide the original file input! */
    .file-select > input[type="file"] {
        display: none;
    }
</style>

<template>
    <!--TODO: put in tabs here for genomic/transcriptomic/chromatin-->
    <v-menu
            id="files-menu"
            offset-y
            :close-on-content-click="false"
            :close-on-click="false"
            :max-width="800"
            :nudge-width="500"
            :max-height="550"
            v-model="showFilesMenu">
        <template v-slot:activator="{ on }">
            <v-btn text outlined v-on="on">
                Files
            </v-btn>
        </template>

        <v-card>
            <v-layout wrap class="mt-2 ml-4">
                <v-flex xs6 class="mt-2">
                    <v-container>
                        <v-switch label="Time Series" color="#7f1010" hide-details style="margin:0" v-model="timeSeriesMode">
                        </v-switch>
                        <v-switch label="Separate index URL" color="#7f1010" hide-details style="margin:0" v-model="separateUrlForIndex">
                        </v-switch>
                    </v-container>
                </v-flex>
                <v-flex xs3 class="pl-2 pr-0">
                    <v-select
                            label="Genome Build"
                            hide-details
                            v-model="buildName"
                            :items="buildList"
                            color="appColor"
                            @change="updateBuildAndValidate"
                    ></v-select>
                </v-flex>

                <v-flex xs3 class="pr-0 pt-2">
                    <v-menu>
                        <template v-slot:activator="{ on }">
                            <v-btn outlined
                                   color="appColor"
                                   style="margin: 5px"
                                   v-on="on">
                                Auto-Fill
                                <v-icon small>keyboard_arrow_down</v-icon>
                            </v-btn>
                        </template>
                        <v-list>
                            <v-list-item>
                                <v-list-item-content>
                                    <v-btn text color="appGray" class="dropdown-button"
                                           @click="loadDuoDemo">
                                        {{ dualAutofill.display }}
                                    </v-btn>
                                </v-list-item-content>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-content>
                                    <v-btn text color="appGray" class="dropdown-button"
                                           @click="loadTimeDemo">
                                        {{ timeAutofill.display }}
                                    </v-btn>
                                </v-list-item-content>
                            </v-list-item>
                            <v-list-item>
                                <label class="file-select">
                                    <!-- We can't use a normal button element here, it would become t he target of the label. -->
                                    <div id="uploadButton" class="select-button">
                                        <span class="dropdown-button">Upload Config</span>
                                    </div>
                                    <!-- Hidden file input -->
                                    <input type="file" @change="onUploadCustomFile"/>
                                </label>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-content>
                                    <v-btn text color="appGray" :disabled="!isValid"
                                           class="dropdown-button"
                                           @click="onDownloadCustomFile">
                                        Download Config
                                    </v-btn>
                                </v-list-item-content>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-flex>
            </v-layout>
            <v-form id="files-form" style="padding: 10px; overflow-y: scroll; max-height: 350px; margin-left: 15px; margin-right: 15px; border: dotted #888888 1px">
                <v-layout wrap class="mt-2">
                    <!--<draggable-->
                            <!--:options="{handle: 'drag-handle'}"-->
                            <!--@end="onDragEnd">-->
                        <v-flex xs12
                                v-for="sample in sampleIds"
                                :key="sample"
                                :id="sample">
                            <!--v-if="modelInfoMap && modelInfoMap[sample] && Object.keys(modelInfoMap[sample]).length > 0">-->
                            <sample-data
                                    ref="sampleDataRef"
                                    v-if="modelInfoMap && modelInfoMap[sample] && Object.keys(modelInfoMap[sample]).length > 0"
                                    :modelInfo="modelInfoMap[sample]"
                                    :timeSeriesMode="timeSeriesMode"
                                    :dragId="sample"
                                    :arrIndex=sampleIds.indexOf(sample)
                                    :separateUrlForIndex="separateUrlForIndex"
                                    @sample-data-changed="validate"
                                    @remove-sample="removeSample">
                            </sample-data>
                        </v-flex>
                    <!--</draggable>-->
                </v-layout>
            </v-form>
            <v-layout style="padding:0 20px 5px 20px">
                <v-flex xs6 class="mt-2 text-left">
                    <v-btn small outlined fab color="appColor"
                           @click="promiseAddSample(true, true, true)">
                        <v-icon>add</v-icon>
                    </v-btn>
                </v-flex>
                <v-flex xs6 class="mt-2 text-right">
                    <div v-show="inProgress" style="display: inline-block; width: 50px">
                        <img src="../assets/images/wheel.gif">
                    </div>
                    <v-btn
                            @click="onLoad"
                            :class="clazzAttention"
                            :disabled="!isValid"
                            :style="'margin: 5px; width: 94px'"
                            color="appColor"
                            outlined>
                        Load
                    </v-btn>
                    <v-btn outlined @click="onCancel" :style="'margin: 5px width: 94px'" color="appColor">
                        Cancel
                    </v-btn>
                </v-flex>
            </v-layout>
        </v-card>
    </v-menu>
</template>
<script>

    import SampleData from './SampleData.vue'
    // import draggable from 'vuedraggable'

    export default {
        name: 'files-menu',
        components: {
            SampleData,
            // draggable
        },
        props: {
            cohortModel: null
        },
        data() {
            return {
                showFilesMenu: false,
                isValid: false,
                speciesList: [],
                speciesName: null,
                buildName: null,
                activeTab: null,
                modelInfoMap: {},
                sampleIds: [],
                dualAutofill: {'display': 'Demo Duo', 'value': 'dual'},
                timeAutofill: {'display': 'Demo Time Series', 'value': 'timeSeries'},
                autofillAction: null,
                timeSeriesMode: false,
                separateUrlForIndex: false,
                inProgress: false,
                stateUnchanged: true,
                arrId: 0,
                debugMe: false,
                inputClass: 'fileSelect',
                loadDemoFromWelcome: false,
                loadDemoFromDropdown: false,
                bringAttention: null
            }
        },
        watch: {
            showFilesMenu: function () {
                if (this.cohortModel && this.showFilesMenu) {
                    this.init();
                }
            },
            timeSeriesMode: function () {
                this.onModeChanged();
            }
        },
        methods: {
            promiseAddSample: function (isTumor = true, stateChanged = true, scrollToSample = false) {
                const self = this;
                if (stateChanged) {
                    self.stateUnchanged = false;
                }

                // If we've loaded a demo, and they change it, deselect demo drop-down
                if (self.autofillAction != null) {
                    self.autofillAction = null;
                }

                return new Promise((resolve, reject) => {
                    let newId = self.findNextAvailableId();
                    self.sampleIds.push(newId);

                    // Add entry to map
                    let newInfo = {};
                    newInfo.isTumor = isTumor;
                    newInfo.id = newId;
                    newInfo.selectedSample = '';
                    newInfo.samples = [];
                    newInfo.displayName = '';
                    newInfo.vcf = null;
                    newInfo.bam = null;
                    newInfo.tbi = null;
                    newInfo.bai = null;
                    newInfo.order = self.sampleIds.length - 1;
                    self.modelInfoMap[newId] = newInfo;

                    // Add sample model for new entry
                    self.cohortModel.promiseAddSample(newInfo)
                        .then((model) => {
                            newInfo.model = model;
                            if (self.debugMe) {
                                console.log('adding new sample');
                                self.debugOrder();
                            }
                            if (scrollToSample) {
                                self.scrollToEnd();
                            }
                            resolve();
                        })
                        .catch((error) => {
                            reject('There was a problem adding sample: ' + error);
                        });
                });
            },
            scrollToEnd: function() {
                this.$nextTick(() => {
                    let container = document.querySelector('#files-form');
                    container.scrollTop = container.scrollHeight;
                });
            },
            findNextAvailableId: function () {
                let self = this;
                let ids = [];
                let arrLength = self.sampleIds.length;
                for (let i = 0; i < arrLength; i++) {
                    ids.push(parseInt(self.sampleIds[i].substring(1)));
                }
                ids.sort();
                let nextVal = arrLength;
                for (let i = 0; i < arrLength - 1; i++) {
                    if (ids[i + 1] - ids[i] > 1) {
                        nextVal = i + 1;
                        break;
                    }
                }
                return 's' + nextVal;
            },
            onLoad: function () {
                let self = this;
                self.bringAttention = null;
                self.inProgress = true;
                self.cohortModel.genomeBuildHelper.setCurrentBuild(self.buildName);
                self.cohortModel.promiseAddClinvarSample()
                    .then(() => {
                        self.cohortModel.promiseAddCosmicSample()
                            .then(() => {
                                self.cohortModel.setTumorInfo(true);
                                self.cohortModel.isLoaded = true;
                                self.cohortModel.getCanonicalModels().forEach(function (model) {
                                    if (model.displayName == null || model.displayName.length === 0) {
                                        model.displayName = model.id;
                                    }
                                });
                                // let performAnalyzeAll = self.autofillAction ? true : false;
                                self.inProgress = false;

                                self.$emit("on-files-loaded", null);
                                self.showFilesMenu = false;
                            })
                    })
            },
            onCancel: function () {
                this.showFilesMenu = false;
            },
            onModeChanged: function () {
                let self = this;
                if (self.autofillAction == null) {
                    if (self.timeSeriesMode) {
                        self.promiseInitMoreTumors()
                            .then(() => {
                                self.moveNormalToFirstSlot();
                                self.setTumorStatusAllSamples();
                            });
                    } else {
                        self.removeMoreTumors();
                    }
                }
            },
            /* Moves sample 's0' to first slot of samples array */
            moveNormalToFirstSlot: function () {
                let self = this;
                if (self.sampleIds[0] !== 's0') {
                    let oldIndex = self.sampleIds.indexOf('s0');
                    let newIndex = 0;
                    self.updateSampleOrder(oldIndex, newIndex);
                }
            },
            /* Sets first entry in samples array to normal, sets remaining to tumor */
            setTumorStatusAllSamples: function () {
                let self = this;

                if (self.$refs.sampleDataRef != null) {
                    self.$refs.sampleDataRef.forEach((ref) => {
                        if (ref.dragId === 's0') {
                            ref.setTumorStatus(false);
                        }
                        else {
                            ref.setTumorStatus(true);
                        }
                    });
                }
            },
            onUploadCustomFile: function (evt) {
                let self = this;

                let customFile = evt.target.files[0];
                self.cohortModel.promiseInitCustomFile(customFile)
                    .then((obj) => {
                        self.onAutoLoad(obj.isTimeSeries, 'custom', obj.infos);
                    })
                    .catch((e) => {
                        console.log('Problem loading custom config file: ' + e);
                        alert('There was a problem loading from the selected config file. Please try again.');
                    });
            },
            onDownloadCustomFile: function () {
                let self = this;

                // JSON.stringify
                let exportObj = {'isTimeSeries': self.timeSeriesMode};
                let sampleArr = [];
                let infoValues = Object.values(self.modelInfoMap);
                infoValues.forEach((val) => {
                    let newVal = {};
                    newVal.id = val.id;
                    newVal.isTumor = val.isTumor;
                    newVal.vcf = val.vcf;
                    newVal.tbi = val.tbi;
                    newVal.bam = val.bam;
                    newVal.bai = val.bai;
                    newVal.order = val.order;
                    newVal.selectedSample = val.selectedSample;
                    newVal.displayName = val.displayName;
                    sampleArr.push(newVal);
                });
                exportObj['samples'] = sampleArr;
                const exportFile = JSON.stringify(exportObj);
                const blob = new Blob([exportFile], {type: 'text/plain'});
                const e = document.createEvent('MouseEvents'),
                    a = document.createElement('a');
                a.download = "oncogene_config.json";
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
                e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
            },
            loadDuoDemo: function () {
                let self = this;
                self.onAutoLoad(false, 'demo', null);
            },
            loadTimeDemo: function () {
                let self = this;
                self.onAutoLoad(true, 'demo', null);
            },
            promiseLoadDemoFromWelcome: function() {
                let self = this;
                self.loadDemoFromWelcome = true;
                self.showFilesMenu = true;
            },
            updateBuildAndValidate: function(newVal) {
                let self = this;
                if (newVal !== self.buildName) {    // self.buildName still oldVal at this point
                    self.cohortModel.genomeBuildHelper.setCurrentBuild(newVal);
                    if (self.$refs.entryDataRef) {
                        self.$refs.entryDataRef.forEach((entryRef) => {
                            if (!(entryRef.dragId === 's0')) {
                                entryRef.retryEnteredUrls()
                                    .catch((errObj) => {
                                        console.log('There was a problem with retryEnteredUrls: ' + errObj);
                                    })
                            }
                        })
                    }
                }
            },
            closeFileMenu: function() {
                let self = this;
                self.loadDemoFromWelcome = true;
                self.showFilesMenu = false;
            },
            onAutoLoad: function (timeSeries, mode, customInfos) {
                let self = this;

                return new Promise((resolve, reject) => {
                    // Toggle switches
                    if (timeSeries) {
                        self.timeSeriesMode = true;
                    } else {
                        self.timeSeriesMode = false;
                    }

                    let infosToLoad = null;
                    let customHasSeparateIndices = false;
                    if (mode === 'demo') {
                        let whichDemo = timeSeries ? 'timeSeries' : 'dual';
                        infosToLoad = self.cohortModel.demoModelInfos[whichDemo];
                    } else {
                        infosToLoad = customInfos;
                        customHasSeparateIndices = self.checkCustomIndex(customInfos);
                    }

                    if (self.cohortModel.demoCmmlFiles || customHasSeparateIndices) {
                        self.separateUrlForIndex = true;
                    } else {
                        self.separateUrlForIndex = false;
                    }

                    // Reset modelInfoMap to get rid of any added info extras
                    self.modelInfoMap = {};

                    // Add relevant infos to map and ids to sample array in correct order
                    let idList = [];
                    let arrIndex = 0;
                    infosToLoad.forEach(function (modelInfo) {
                        let id = modelInfo.id;
                        idList.push(id);
                        self.modelInfoMap[id] = modelInfo;
                        self.sampleIds[arrIndex] = modelInfo.id;
                        arrIndex++;
                    });

                    // Get rid of any remaining extra samples names in array
                    if (self.sampleIds.length > arrIndex) {
                        let numToDelete = self.sampleIds.length - arrIndex;
                        self.sampleIds.splice(arrIndex, numToDelete);
                    }

                    // Ensure orders are correct
                    for (let i = 0; i < self.sampleIds.length; i++) {
                        let currInfo = self.modelInfoMap[self.sampleIds[i]];
                        currInfo.order = i;
                    }

                    // Force update labels
                    self.$refs.sampleDataRef.forEach((ref) => {
                        ref.updateLabel();
                    });

                    // Ensure models are synonymous with infos and in same order as viewed
                    self.cohortModel.removeExtraModels(idList);
                    let addPromises = [];
                    for (let i = 0; i < self.sampleIds.length; i++) {
                        let currKey = self.sampleIds[i];
                        let currModel = self.cohortModel.getModel(currKey);
                        if (currModel == null) {
                            let corrInfo = self.modelInfoMap[currKey];
                            let start = Date.now();
                            let p = self.cohortModel.promiseAddSample(corrInfo, i, true)
                                .then(() => {
                                    let end = Date.now();
                                    console.log('Took ' + (end-start) + ' ms to add sample to cohort model');
                                });
                            addPromises.push(p);
                        } else {
                            self.cohortModel.sampleModels[i] = currModel;
                        }
                    }
                    // Set flag to get loading rolling
                    self.cohortModel.isLoaded = true;

                    // Update view from gene home
                    self.$emit('update-samples');

                    Promise.all(addPromises)
                        .then(() => {
                            // Turn on loading spinners
                            for (let i = 0; i < self.$refs.sampleDataRef.length; i++) {
                                self.$refs.sampleDataRef[i].setLoadingFlags(true);
                            }

                            self.cohortModel.getCanonicalModels().forEach(function (model) {
                                self.promiseSetModel(model);
                            });
                            if (self.debugMe) {
                                console.log('loading demo data');
                                self.debugOrder();
                            }
                            self.scrollToEnd();
                            resolve();
                        }).catch((error) => {
                            self.bringAttention = null;
                            reject('Problem in autoloading in files menu: ' + error);
                    })
                });
            },
            checkCustomIndex: function (infos) {
                let areSeparate = false;
                infos.forEach((info) => {
                    if (info.bai != null || info.tbi != null) {
                        areSeparate = true;
                    }
                });
                return areSeparate;
            },
            /* Sets corresponding model for each info object; */
            promiseSetModel: function (model) {
                let self = this;
                return new Promise(function (resolve, reject) {

                    // Assign model prop in info object to model
                    let theModel = model;
                    let theModelInfo = self.modelInfoMap[theModel.id];
                    theModelInfo.model = theModel;

                    // Trigger on vcf check in model
                    theModel.onVcfUrlEntered(theModelInfo.vcf, theModelInfo.tbi, function (success, sampleNames) {
                        if (success) {
                            // Set sample prop
                            theModelInfo.samples = sampleNames;
                            self.$refs.sampleDataRef.forEach(function (ref) {
                                if (ref.modelInfo.id === theModel.id) {
                                    // Set selected sample in model and in child cmpnt
                                    theModel.setSelectedSample(theModelInfo.selectedSample);
                                    ref.updateSamples(sampleNames, theModelInfo.selectedSample);
                                    ref.setLoadingFlags(false);

                                    // Set display name in model
                                    theModel.displayName = theModelInfo.displayName ? theModelInfo.displayName : theModelInfo.selectedSample;
                                    self.validate();
                                }
                            });
                            theModel.onBamUrlEntered(theModelInfo.bam, theModelInfo.bai, function (success) {
                                self.validate();
                                if (success) {
                                    resolve();
                                } else {
                                    reject('No bam to check');
                                }
                            })
                        } else {
                            // Turn off loading spinners
                            for (let i = 0; i < self.$refs.sampleDataRef.length; i++) {
                                self.$refs.sampleDataRef[i].setLoadingFlags(false);
                            }
                            reject('No vcf to check');
                        }
                    })
                })
            },
            validate: function () {
                this.isValid = true;

                let keyList = Object.keys(this.modelInfoMap);
                for (let i = 0; i < keyList.length; i++) {
                    let currKey = keyList[i];
                    this.isValid &= (this.modelInfoMap[currKey] != null && this.modelInfoMap[currKey].model.isReadyToLoad());
                }
                this.bringAttention = this.isValid ? 'load' : null;
            },
            getModel: function (id) {
                let theModel = null;
                if (this.cohortModel) {
                    let modelObject = this.cohortModel.sampleMap[id];
                    if (modelObject) {
                        theModel = modelObject.model;
                    }
                }
                return theModel;
            },
            init: function () {
                let self = this;
                if (self.cohortModel && self.cohortModel.getCanonicalModels().length > 0 && !self.loadDemoFromWelcome) {
                    self.initModelInfo();
                } else {
                    self.promiseAddSample(false, false, false)
                        .then(() => {
                            self.promiseAddSample(true, false, false)
                                .then(() => {
                                    // If we've clicked run w/ demo data on welcome screen, want to get that process going
                                    if (self.loadDemoFromWelcome) {
                                        self.onAutoLoad(false, 'demo')
                                            .then(() => {
                                                self.loadDemoFromWelcome = false;
                                                self.onLoad();
                                            })
                                    }
                                });
                        })
                        .catch((error) => {
                            console.log('Problem adding samples while initializing files menu: ' + error);
                        });
                }
            },
            initModelInfo: function () {
                let self = this;
                self.separateUrlForIndex = false;
                self.timeSeries = false;
                self.cohortModel.getCanonicalModels().forEach(function (model) {
                    let modelInfo = self.modelInfoMap[model.id];
                    if (modelInfo == null) {
                        modelInfo = {};
                        modelInfo.displayName = model.getDisplayName();
                        modelInfo.isTumor = model.getTumorStatus();
                        modelInfo.order = model.order;
                        modelInfo.vcf = model.vcf ? model.vcf.getVcfURL() : null;
                        modelInfo.tbi = model.vcf ? model.vcf.getTbiURL() : null;
                        modelInfo.bam = model.bam ? model.bam.bamUri : null;
                        modelInfo.bai = model.bam ? model.bam.baiUri : null;
                        modelInfo.model = model;
                        if (modelInfo.tbi || modelInfo.bai) {
                            self.separateUrlForIndex = true;
                        }
                        let key = 's' + self.sampleIds.length;
                        self.$set(self.modelInfoMap, key, modelInfo);
                    }
                })
            },
            promiseInitMoreTumors: function () {
                let self = this;

                return new Promise((resolve, reject) => {
                    let promises = [];
                    if (self.stateUnchanged && self.sampleIds.length === 2) {
                        for (let i = 0; i < 2; i++) {
                            promises.push(self.promiseAddSample(true, false));
                        }
                    }
                    Promise.all(promises)
                        .then(() => {
                            resolve();
                        }).catch((error) => {
                            reject('Something went wrong in promiseInitMoreTumors: ' + error);
                    })
                });
            },
            removeMoreTumors: function () {
                let self = this;
                if (self.stateUnchanged) {
                    let sampleLength = self.sampleIds.length;
                    for (let i = sampleLength - 1; i > 1; i--) {
                        self.removeSample(i, false, true);
                    }
                }
            },
            removeSample: function (sampleIndex, stateChanged = true, demoCall = false) {
                let self = this;
                if (stateChanged) {
                    self.stateUnchanged = false;
                }

                // If we've selected a demo, and then changed it, deselect dropdown
                if (self.autofillAction != null && !demoCall) {
                    self.autofillAction = null;
                }

                // If we're deleting the first one on time series mode, must enforce next one normal
                if (self.timeSeriesMode && sampleIndex === 0) {
                    let key = self.sampleIds[1];
                    self.modelInfoMap[key].isTumor = false;
                    self.modelInfoMap[key].model.isTumor = false;
                }

                // Update order for any samples after deleted one
                for (let i = sampleIndex + 1; i < self.sampleIds.length; i++) {
                    let key = self.sampleIds[i];
                    self.modelInfoMap[key].order--;
                    self.modelInfoMap[key].model.order--;
                }

                // Remove sample and delete info
                let id = self.sampleIds[sampleIndex];
                self.sampleIds.splice(sampleIndex, 1);
                delete self.modelInfoMap[id];
                self.cohortModel.removeSample(id);

                // Update label
                if (self.$refs.sampleDataRef != null) {
                    self.$refs.sampleDataRef.forEach((ref) => {
                        if (ref.modelInfo.order >= sampleIndex) {
                            ref.updateLabel();
                        }
                    });
                }
                self.$emit('update-samples');
                self.validate();
                //self.debugOrder();
            },
            onDragEnd: function (evt) {
                let self = this;
                self.stateUnchanged = false;

                let oldIndex = evt.oldIndex;
                let newIndex = evt.newIndex;

                // Update order and isTumor props
                self.updateSampleOrder(oldIndex, newIndex);
            },
            updateSampleOrder: function (oldIndex, newIndex, demoCall = false) {
                let self = this;

                if (self.autofillAction != null && !demoCall) {
                    self.autofillAction = null;
                }

                if (self.$refs.sampleDataRef != null) {
                    self.$refs.sampleDataRef.forEach((ref) => {
                        ref.updateOrder(oldIndex, newIndex);
                    });
                }
                // Order sample ids arrays for view and model accordingly
                if (oldIndex < newIndex) {
                    self.sampleIds.splice(newIndex + 1, 0, self.sampleIds[oldIndex]);
                    self.sampleIds.splice(oldIndex, 1);
                } else if (newIndex < oldIndex) {
                    self.sampleIds.splice(newIndex, 0, self.sampleIds[oldIndex]);
                    self.sampleIds.splice(oldIndex + 1, 1);
                }
                self.cohortModel.updateSampleOrder(oldIndex, newIndex);

                if (self.debugMe) {
                    console.log('updating order');
                    self.debugOrder();
                }
            },
            debugOrder: function () {
                let self = this;

                console.log("sample id array: " + self.sampleIds.join(','));
                console.log("modelInfoMap: " + (Object.keys(self.modelInfoMap)).join(','));
                let modelInfoOrders = [];
                (Object.values(self.modelInfoMap)).forEach((info) => {
                    modelInfoOrders.push(info.order);
                });
                console.log('modelInfo orders: ' + modelInfoOrders.join(','));
                let modelIds = [];
                let modelOrders = [];
                self.cohortModel.sampleModels.forEach((model) => {
                    modelIds.push(model.id);
                    modelOrders.push(model.order);
                });
                console.log("cohort model list: " + modelIds.join(','));
                console.log("cohort model map: " + (Object.keys(self.cohortModel.sampleMap)).join(','));
                console.log("cohort model orders: " + modelOrders.join(','));
            },
            // openFileSelection: function() {
            //     let self = this;
            //     self.showFilesMenu = true;
            //     $('#uploadButton').click();
            // }
        },
        computed: {
            buildList: function () {
                if (this.speciesName && this.cohortModel && this.cohortModel.genomeBuildHelper) {
                    return this.cohortModel.genomeBuildHelper.speciesToBuilds[this.speciesName].map(function (gb) {
                        return gb.name;
                    })
                } else {
                    return [];
                }
            },
            clazzAttention: function () {
                if (this.bringAttention && this.bringAttention === 'load') {
                    return 'attention';
                } else {
                    return '';
                }
            },
        },
        created: function () {
        },
        mounted: function () {
            if (this.cohortModel) {
                this.speciesName = this.cohortModel.genomeBuildHelper.getCurrentSpeciesName();
                this.buildName = this.cohortModel.genomeBuildHelper.getCurrentBuildName();
                this.speciesList = this.cohortModel.genomeBuildHelper.speciesList.map(function (sp) {
                    return sp.name;
                }).filter(function (name) {
                    return name === 'Human';
                });
            }


        }
    }
</script>
