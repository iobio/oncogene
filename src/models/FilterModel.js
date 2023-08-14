/* Encapsulates logic for filtering variants from a single patient (aka a single normal vs. multiple tumor samples).
 * Among other things, determines if a variant is somatic or not by incorporating filter logic. */

class FilterModel {
    constructor(translator, cohortModel, $) {
        this.$ = $;
        this.cohortModel = cohortModel;

        // todo: add allAltCount and allAltFrequency here if no normal sample selected
        /* Initializers */
        let qualCutoff = 'qual',
            genotypeDepth = 'genotypeDepth',
            normalAltCount = 'normalAltCount',
            normalAltFreq = 'normalAltFreq',
            tumorAltCount = 'tumorAltCount',
            tumorAltFreq = 'tumorAltFreq';

        this.ANNOTATION = 'annotation';
        this.COUNT = 'count';    // Previously 'somatic'
        this.NORMAL_COUNT = 'normalCount';
        this.TUMOR_COUNT = 'tumorCount';
        this.QUALITY = 'quality';
        this.OPERATOR = '_OPERATOR';

        /* Class constants */
        this.QUAL_CUTOFF = qualCutoff;
        this.QUAL_OPERATOR = qualCutoff + this.OPERATOR;
        this.GENOTYPE_DEPTH = genotypeDepth;
        this.DEPTH_OPERATOR = genotypeDepth + this.OPERATOR;
        this.NORMAL_COUNT = normalAltCount;
        this.NORMAL_COUNT_OPERATOR = normalAltCount + this.OPERATOR;
        this.NORMAL_FREQ = normalAltFreq;
        this.TUMOR_COUNT = tumorAltCount;
        this.TUMOR_COUNT_OPERATOR = tumorAltCount + this.OPERATOR;
        this.TUMOR_FREQ = tumorAltFreq;

        /* Somatic settings */
        this.DEFAULT_COUNT_CUTOFFS = {
            normalAltFreq: 0.05,      // Must be between 0-1
            normalAltCount: 10,
            tumorAltFreq: 0.10,       // Must be between 0-1
            tumorAltCount: 5
        };

        /* Quality settings */
        this.DEFAULT_QUALITY_FILTERING_CRITERIA = {
            genotypeDepth: 10,
            qualCutoff: 20
        };

        // The categories by which the filters are grouped
        this.filterCategories =
            [
                {
                    name: this.ANNOTATION,
                    display: 'Annotation Filters',
                    active: false,
                    custom: false,
                    description: 'Filter by variant effect, impact, or type',
                    icon: 'category',
                    activeForSomaticOnlyMode: true // todo: I think I can get rid of this now
                },
                {
                    name: this.COUNT,
                    display: 'Frequency Filters',
                    active: false,
                    custom: false,
                    description: 'Select a threshold for allele frequencies and observation counts by which to display variants',
                    icon: 'flash_on',
                    activeForSomaticOnlyMode: false
                },
                {
                    name: this.QUALITY,
                    display: 'Quality Filters',
                    active: false,
                    custom: false,
                    description: 'Filter variants by observation counts',
                    icon: 'star',
                    activeForSomaticOnlyMode: false
                }
            ];

        // Note: if filter names match variant object field names, don't have to manually add filter to getVarValue in Variant.d3 class
        // The actual filters that can be applied
        this.filters = {
            // todo: would be awesome to put cosmic and clinvar in annotation filters here
            'annotation': [
                {name: 'impact', display: 'Impact', active: false, open: false, type: 'checkbox', tumorOnly: false, recallFilter: false},
                {name: 'type', display: 'Type', active: false, open: false, type: 'checkbox', tumorOnly: false, recallFilter: false}],
            'tumor_count': [
                {
                    name: tumorAltFreq,
                    display: 'Tumor Allele Frequency',
                    active: true,
                    open: false,
                    type: 'slider',
                    tumorOnly: true,
                    minValue: 0,
                    maxValue: 100,
                    labelSuffix: '%',
                    defaultLogic: '>=',
                    defaultVal: this.DEFAULT_COUNT_CUTOFFS.tumorAltFreq * 100,
                    currLogic: '>=',
                    currVal: this.DEFAULT_COUNT_CUTOFFS.tumorAltFreq * 100,
                    prevLogic: '>=',        // the logic previously used to recall somatic variants
                    prevVal: this.DEFAULT_COUNT_CUTOFFS.tumorAltFreq * 100,    // the value ^
                    stagedLogic: null,      // the logic slated to be changed for somatic variant recall
                    stagedVal: null,        // the value ^
                    recallFilter: true
                },
                {
                    name: tumorAltCount,
                    display: 'Tumor Alt. Observations',
                    active: true,
                    open: false,
                    type: 'slider',
                    tumorOnly: true,
                    labelSuffix: '',
                    defaultLogic: '>=',
                    defaultVal: this.DEFAULT_COUNT_CUTOFFS.tumorAltCount,
                    currLogic: '>=',
                    currVal: this.DEFAULT_COUNT_CUTOFFS.tumorAltCount,
                    prevLogic: '>=',
                    prevVal: this.DEFAULT_COUNT_CUTOFFS.tumorAltCount,
                    stagedLogic: null,      // the logic slated to be changed for somatic variant recall
                    stagedVal: null,        // the value ^
                    recallFilter: true
                }],
            'normalCount': [
                    {
                    name: normalAltFreq,
                    display: 'Normal Allele Frequency',
                    active: true,
                    open: false,
                    type: 'slider',
                    tumorOnly: false,
                    minValue: 0,
                    maxValue: 100,
                    labelSuffix: '%',
                    defaultLogic: '<=',
                    defaultVal: this.DEFAULT_COUNT_CUTOFFS.normalAltFreq * 100,
                    currLogic: '<=',
                    currVal: this.DEFAULT_COUNT_CUTOFFS.normalAltFreq * 100,
                    prevLogic: '<=',
                    prevVal: this.DEFAULT_COUNT_CUTOFFS.normalAltFreq * 100,
                    stagedLogic: null,      // the logic slated to be changed for somatic variant recall
                    stagedVal: null,        // the value ^
                    recallFilter: true
                },
                {
                    name: normalAltCount,
                    display: 'Normal Alt. Observations',
                    active: true,
                    open: false,
                    type: 'slider',
                    tumorOnly: false,
                    labelSuffix: '',
                    defaultLogic: '<=',
                    defaultVal: this.DEFAULT_COUNT_CUTOFFS.normalAltCount,
                    currLogic: '<=',
                    currVal: this.DEFAULT_COUNT_CUTOFFS.normalAltCount,
                    prevLogic: '<=',
                    prevVal: this.DEFAULT_COUNT_CUTOFFS.normalAltCount,
                    stagedLogic: null,      // the logic slated to be changed for somatic variant recall
                    stagedVal: null,        // the value ^
                    recallFilter: true
                }],
            'quality': [
                {
                    name: genotypeDepth,
                    display: 'Total Observations',
                    active: true,
                    open: false,
                    type: 'slider',
                    tumorOnly: false,
                    minValue: 0,
                    maxValue: 100,
                    labelSuffix: '',
                    defaultLogic: '>=',
                    defaultVal: this.DEFAULT_QUALITY_FILTERING_CRITERIA.genotypeDepth,
                    currLogic: '>=',
                    currVal: this.DEFAULT_QUALITY_FILTERING_CRITERIA.genotypeDepth,
                    prevLogic: '>=',
                    prevVal: this.DEFAULT_QUALITY_FILTERING_CRITERIA.genotypeDepth,
                    stagedLogic: null,      // the logic slated to be changed for somatic variant recall
                    stagedVal: null,        // the value ^
                    recallFilter: true
                },
                {
                    name: qualCutoff,
                    display: 'Quality Score',
                    active: true,
                    open: false,
                    type: 'slider',
                    tumorOnly: false,
                    minValue: 0,
                    maxValue: 500,
                    labelSuffix: '',
                    defaultLogic: '>=',
                    defaultVal: this.DEFAULT_QUALITY_FILTERING_CRITERIA.qualCutoff,
                    currLogic: '>=',
                    currVal: this.DEFAULT_QUALITY_FILTERING_CRITERIA.qualCutoff,
                    prevLogic: '>=',
                    prevVal: this.DEFAULT_QUALITY_FILTERING_CRITERIA.qualCutoff,
                    stagedLogic: null,      // the logic slated to be changed for somatic variant recall
                    stagedVal: null,        // the value ^
                    recallFilter: true
                }]
        };

        // Note: checkbox lists do not require somatic recall currently,
        // but staged property could easily be added in the future
        this.checkboxLists = {
            impact: [
                {name: 'HIGH', displayName: 'HIGH', excludeName: 'High Impact Variants', model: true, default: true},
                {name: 'MODERATE', displayName: 'MODERATE', excludeName: 'Moderate Impact Variants', model: true, default: true},
                {name: 'MODIFIER', displayName: 'MODIFIER', excludeName: 'Modifier Impact Variants', model: true, default: true},
                {name: 'LOW', displayName: 'LOW', excludeName: 'Low Impact Variants', model: true, default: true}
            ],
            type: [
                {name: 'del', displayName: 'DELETION', excludeName: 'Deletions', model: true, default: true},
                {name: 'ins', displayName: 'INSERTION', excludeName: 'Insertions', model: true, default: true},
                {name: 'mnp', displayName: 'MNP', excludeName: 'MNPs', model: true, default: true},
                {name: 'snp', displayName: 'SNP', excludeName: 'SNPs', model: true, default: true}
            ]
        };

        // todo: change to bcsq vs vep? change known-variants to clinvar...
        this.modelFilters = {
            'known-variants': {
                'vepImpact': []
            },
            'cosmic-variants': {
                'vepImpact': []
            }
        };

        this.translator = translator;

        this.filterHistory = {};        // Key: unique string composed of filter settings, Value: array of filter settings
        this.currentAnalysisKey = '';   // The current unique analysis string key
    }

    getNormalSampleStatus() {
        if (this.cohortModel == null) {
            console.log("Could not get normal sample status because filter model has no parent cohort model.");
        } else {
            return this.cohortModel.getNormalSampleStatus();
        }
    }

    getVarCallerUsed() {
        if (this.cohortModel == null) {
            console.log("Could not get variant caller because filter model has no parent cohort model.");
        } else {
            return this.cohortModel.getVarCallerUsed();
        }
    }

    /* Returns filter objects associated with the provided category.
     * This getter is mostly redundant, other than introducing logic when an analysis does
     * not contain a normal sample. */
    getFilters(filterCategory) {
        if (filterCategory === this.COUNT) {
            const hasNormalSample = this.getNormalSampleStatus();
            if (hasNormalSample) {
                return { ...this.filters[this.NORMAL_COUNT], ...this.filters[this.TUMOR_COUNT]};
            } else {
                return this.filters[this.TUMOR_COUNT];
            }
        } else {
            return this.filters[filterCategory];
        }
    }

    /* Marks variants as somatic, or non-inherited, if they fulfill the following:
     *
     *  The normal track exhibits the following logic: (A || B) && C
     *     where
     *      A) does not contain the variant in question
     *      B) does contain the variant but at a threshold meeting slider-set criteria
     *      C) is visible/ not filtered out by other non-somatic filters (including quality)
     *
     *  AND
     *
     *  the tumor track exhibits the following logic: A && B
     *     where
     *      A) contains the variant at a threshold meeting slider-set criteria
     *      B) is visible/ not filtered out by other non-somatic filters (including quality)
     *
     *  Marks variants as inherited, if they fulfill the following:
     *
     *  The normal track contains the variant with quality thresholds met AND the tumor track contains the variant with quality thresholds met but not somatic ones
     *
     *  If globalMode is true, returns a map of selectedSampleId: somaticFeatureList.
     *  Otherwise, returns a dictionary of somatic variant IDs from all tumor tracks combined.
     */
    // todo: look at if somaticOnlyMode is actually determining correct behavior here
    promiseAnnotateVariantInheritance(resultMap, featuresList, globalMode, somaticOnlyMode) {
        const self = this;
        return new Promise((resolve, reject) => {
            let normalSamples = [];
            let tumorSamples = [];
            let tumorSampleModelIds = [];
            let inheritedVarLookup = {};
            let somaticVarMap = {};
            let somaticVarLookup = {};
            let i = 0;

            // Classify samples
            for (i = 0; i < Object.keys(resultMap).length; i++) {
                let sampleId = Object.keys(resultMap)[i];
                let currData = self.$.extend({}, Object.values(resultMap)[i].vcfData);
                let sampleObj = {'currData': currData, 'model': Object.values(resultMap)[i]};
                if (!(resultMap[sampleId].isTumor) && sampleId !== 'known-variants' && sampleId !== 'cosmic-variants') {
                    normalSamples.push(sampleObj);
                    somaticVarMap[sampleObj.model.selectedSample] = { 'name': sampleObj.model.selectedSample, 'features': [] };
                } else if (sampleId !== 'known-variants' && sampleId !== 'cosmic-variants') {
                    tumorSamples.push(sampleObj);    // Don't need reference to model for tumor
                    tumorSampleModelIds.push(sampleId);
                    somaticVarMap[sampleObj.model.selectedSample] = { 'name': sampleObj.model.selectedSample, 'features': [] };
                }
            }

            // Make normal variant hash table
            let passesNormalFiltersLookup = {};   // Hash of variants that pass the Normal somatic filters ONLY (normal alt count and normal alt freq)
            let normalContainsLookup = {};        // Hash of all variants in normal sample
            let passesOtherFiltersLookup = {};    // Hash of variants in normal track ONLY that pass any active filters except somatic related (this includes quality)
            normalSamples.forEach((currNorm) => {
                if (currNorm && (globalMode || (currNorm.currData && (currNorm.currData.features.length > 0)))) {
                    let normFeatures = [];
                    if (globalMode) {
                        let matchingFeatureList = featuresList.filter(list => {
                            return list.name === currNorm.model.selectedSample;
                        });
                        normFeatures = matchingFeatureList[0].features;
                    } else {
                        normFeatures = currNorm.currData.features;
                    }

                    // See if normal features pass applied, non-somatic filters (ex: impact, effect, etc)
                    let filteredNormFeatures = [];
                    normFeatures.forEach((feature) => {
                        feature.isInherited = true;   // Need to mark all normal variants as inherited from null
                        normalContainsLookup[feature.id] = true;
                        if (feature.passesFilters === true) {
                            filteredNormFeatures.push(feature);
                            inheritedVarLookup[feature.id] = true;
                            passesOtherFiltersLookup[feature.id] = true;
                        }
                    });

                    // See if normal features pass somatic criteria
                    for (i = 0; i < filteredNormFeatures.length; i++) {
                        let currFeat = filteredNormFeatures[i];
                        let passesNormalCount = false;

                        // If we're pulling back from annotateSomaticVars, we've already filtered based on counts
                        // If we're in somatic only mode, we're not filtering
                        if (globalMode) {
                            passesNormalCount = true;
                        } else {
                            passesNormalCount = self.matchAndPassFilter(self.getFilterField(self.COUNT, self.NORMAL_COUNT, 'currLogic'), currFeat.genotypeAltCount, self.getFilterField(self.COUNT, self.NORMAL_COUNT, 'currVal'));
                        }
                        let currNormAf = Math.round(currFeat.genotypeAltCount / currFeat.genotypeDepth * 100) / 100;
                        // let passesNormalAf = false;
                        // if (somaticOnlyMode) {
                        //     passesNormalAf = true;
                        // } else {
                        let passesNormalAf = self.matchAndPassFilter(self.getFilterField(self.COUNT, self.NORMAL_FREQ, 'currLogic'), currNormAf, self.getAdjustedCutoff(self.getFilterField(self.COUNT, self.NORMAL_FREQ, 'currVal'), self.NORMAL_FREQ));
                        //}
                        if (currFeat.id != null && passesNormalCount && passesNormalAf) {
                            passesNormalFiltersLookup[currFeat.id] = true;
                        }
                    }
                }
            });

            // Mark somatic and inherited variants
            let coverageCheckFeatures = {};
            for (i = 0; i < tumorSamples.length; i++) {
                let currTumor = tumorSamples[i];
                if (globalMode || (currTumor.currData && currTumor.currData.features && currTumor.currData.features.length > 0)) {
                    let tumorFeatures = [];
                    if (globalMode) {
                        let matchingFeatureList = featuresList.filter(list => {
                            return list.name === currTumor.model.selectedSample;
                        });
                        tumorFeatures = matchingFeatureList[0].features;
                    } else {
                        tumorFeatures = currTumor.currData.features;
                    }
                    // Don't need to look at tumor features that don't pass other filters
                    let filteredTumorFeatures = tumorFeatures.filter((feature) => {
                        return feature.passesFilters === true;
                    });
                    filteredTumorFeatures.forEach((feature) => {
                        let passesTumorCount = false;

                        // If we're pulling back from annotateSomaticVars, we've already filtered based on counts
                        // If we're in somatic only mode, we're not filtering
                        if (globalMode || somaticOnlyMode) {
                            passesTumorCount = true;
                        } else {
                            passesTumorCount = self.matchAndPassFilter(self.getFilterField(self.COUNT, self.TUMOR_COUNT, 'currLogic'), feature.genotypeAltCount, self.getFilterField(self.COUNT, self.TUMOR_COUNT, 'currVal'));
                        }
                        let currAltFreq = Math.round(feature.genotypeAltCount / feature.genotypeDepth * 100) / 100;
                        let passesTumorAf = false;
                        if (somaticOnlyMode) {
                            passesTumorAf = true;
                        } else {
                            passesTumorAf = self.matchAndPassFilter(self.getFilterField(self.COUNT, self.TUMOR_FREQ, 'currLogic'), currAltFreq, self.getAdjustedCutoff(self.getFilterField(self.COUNT, self.TUMOR_FREQ, 'currVal'), self.TUMOR_FREQ));
                        }

                        if (passesNormalFiltersLookup[feature.id] && passesTumorAf && passesTumorCount) {
                            // Found a somatic variant
                            feature.isInherited = false;
                            somaticVarLookup[feature.id] = true;
                            (somaticVarMap[currTumor.model.selectedSample].features).push(feature);
                            inheritedVarLookup[feature.id] = false;
                        } else if (normalContainsLookup[feature.id] == null && passesTumorAf && passesTumorCount) {
                            if (globalMode) {
                                feature.isInherited = false;
                                somaticVarLookup[feature.id] = true;
                                (somaticVarMap[currTumor.model.selectedSample].features).push(feature);
                                inheritedVarLookup[feature.id] = false;
                            } else {
                                coverageCheckFeatures[feature.id] = {
                                    'chrom': feature.chrom,
                                    'start': feature.start,
                                    'end': feature.end,
                                    'id': feature.id
                                };
                            }
                        } else if (passesOtherFiltersLookup[feature.id]) {
                            // We have an inherited variant
                            feature.isInherited = true;
                            inheritedVarLookup[feature.id] = true;
                        } else {
                            // Else, we don't pass some sort of quality filter
                            // Or we aren't in the normal lookup
                            // Or we are in the normal lookup but we don't pass Tumor criteria

                            feature.isInherited = null;
                            inheritedVarLookup[feature.id] = false;

                            // Have to mark actual variant in normal sample as null b/c that's what feature matrix tooltips look at
                            if (normalContainsLookup[feature.id]) {
                                normalSamples[0].model.variantIdHash[feature.id].isInherited = null;
                            }
                        }
                    })
                }
            }
            // If we're in global mode, we don't have the bandwidth to get reads for all vars at once
            // Instead, these will be pulled in piece-meal like rnaseq/atacseq
            if (globalMode || somaticOnlyMode) {
                coverageCheckFeatures = {};
            }
            let coverageCheckList = Object.values(coverageCheckFeatures);
            if (coverageCheckList.length > 0) {
                // Check coverage in normal sample (todo: update for multiple normal samples in the future)
                normalSamples[0].model.promiseGetBamDepthForVariants(coverageCheckList, self.translator.globalApp.COVERAGE_TYPE, self.cohortModel.globalApp.INDIV_QUALITY_CUTOFF)
                    .then(coverageMap => {
                        for (var featId in coverageMap) {
                            let depth = coverageMap[featId];    // coverageMap respects order
                            let depthObj = self.getFilters(self.QUALITY).filter(filt => {
                                return filt.name === self.GENOTYPE_DEPTH;
                            });
                            if (depthObj.length <= 0) {
                                console.log('Something went wrong getting depth filter');
                            } else {
                                depthObj = depthObj[0];
                            }
                            if (self.matchAndPassFilter(depthObj.currLogic, depth, depthObj.currVal)) {

                                // Have to check to see if all of the tumor samples have this variant`
                                tumorSamples.forEach((sample) => {
                                    let tumorModel = sample.model;
                                    let matchingFeature = tumorModel.variantIdHash[featId];
                                    if (matchingFeature) {
                                        matchingFeature.isInherited = false;
                                        (somaticVarMap[tumorModel.selectedSample].features).push(matchingFeature);
                                    }
                                });
                                somaticVarLookup[featId] = true;
                                inheritedVarLookup[featId] = false;
                            } else {
                                let feature = coverageCheckList.filter(feat => {
                                    return feat.id === featId;
                                });
                                feature[0].isInherited = null;
                                inheritedVarLookup[featId] = false;  // Still need to mark this as false to display as undetermined in feature matrix
                            }
                            // Save the read count in the normal model for tooltip use so we don't have to access BAM again
                            normalSamples[0].model.somaticVarCoverage.push(coverageMap[featId]);
                        }
                        if (globalMode) {
                            resolve(somaticVarMap);
                        }
                        resolve({'somaticLookup': somaticVarLookup, 'inheritedLookup': inheritedVarLookup});
                    }).catch((error) => {
                    reject('Something went wrong in promiseAnnotateVariantInheritance: ' + error);
                })
            } else {
                if (globalMode) {
                    resolve(somaticVarMap);
                }
                resolve({'somaticLookup': somaticVarLookup, 'inheritedLookup': inheritedVarLookup});
            }
        })
    }

    /* For each region, compares the abnormal (TCN != 2 || LCN != 1) CNVs of the normal model(s) to those of the tumor model(s).
     * Any CNVs present in only the tumor samples as a dictionary organized by geneName: list of abnormal CNVs.
     * If no normalCnvModels are provided, just includes all tumor sample CNVs that are abnormal. */
    annotateSomaticCnvs(normalCnvModels, tumorCnvModels, geneObjects) {
        let somaticCnvs = {};
        Object.keys(geneObjects).forEach(geneName => {
            let geneObj = geneObjects[geneName];
            let normalLookup = {};
            let tumorLookup = {};

            // We may not have normal CNVs to find 'somatic' CNVs - in that case, just include all abnormal tumor CNVs
            let normalCnvObj = {};
            normalCnvModels.forEach(normalCnvModel => {
                normalCnvObj = normalCnvModel.findEntryByCoord(geneObj.chr, geneObj.start, geneObj.end, true);
                normalCnvObj.matchingCnvs.forEach(normalCnv => {
                    normalLookup[normalCnv.start + '_' + normalCnv.end + '_' + normalCnv.tcn + '_' + normalCnv.lcn] = true;
                })
            })

            tumorCnvModels.forEach(tumorCnvModel => {
                let tumorCnvObj = tumorCnvModel.findEntryByCoord(geneObj.chr, geneObj.start, geneObj.end, true);
                tumorCnvObj.matchingCnvs.forEach(tumorCnv => {
                    if (!normalLookup[tumorCnv.start + '_' + tumorCnv.end + '_' + tumorCnv.tcn + '_' + tumorCnv.lcn]) {
                        if (somaticCnvs[geneName] == null) {
                            somaticCnvs[geneName] = [];
                        }
                        let existingCnv = tumorLookup[tumorCnv.start + '_' + tumorCnv.end + '_' + tumorCnv.tcn + '_' + tumorCnv.lcn];
                        if (!existingCnv) {
                            tumorCnv.selectedSamples = [tumorCnvModel.selectedSample];
                            somaticCnvs[geneName].push(tumorCnv);
                            tumorLookup[tumorCnv.start + '_' + tumorCnv.end + '_' + tumorCnv.tcn + '_' + tumorCnv.lcn] = tumorCnv;
                        } else {
                            existingCnv.selectedSamples.push(tumorCnvModel.selectedSample);
                        }
                    }
                })
            })
        })
        return somaticCnvs;
    }

    getMatchingDepth(startCoord, depthList) {
        let lastDepth = 0;
        for (let i = 0; i < depthList.length; i++) {
            let listStart = depthList[i][0];
            let listDepth = depthList[i][1];
            if (startCoord === listStart) {
                lastDepth = listDepth;
                break;
            } else if (startCoord > listStart) {
                break;
            }
            lastDepth = listDepth;
        }
        return lastDepth;
    }

    matchAndPassFilter(logic, varVal, cutoffVal) {
        let passesFilter = false;
        varVal = parseFloat(varVal);
        cutoffVal = parseFloat(cutoffVal);
        switch (logic) {
            case '<': {
                passesFilter = varVal < cutoffVal;
                break;
            }
            case '<=': {
                passesFilter = varVal <= cutoffVal;
                break;
            }
            case '=': {
                passesFilter = varVal === cutoffVal;
                break;
            }
            case '>=': {
                passesFilter = varVal >= cutoffVal;
                break;
            }
            case '>': {
                passesFilter = varVal > cutoffVal;
                break;
            }
            default: {
                break;
            }
        }
        return passesFilter;
    }

    /* Need a special case here because of drop-down menu structure in Vue. */
    updateFilterLogic(filterName, newLogic) {
        const self = this;
        for (var filterCatName in self.filters) {
            let filterCat = self.getFilters(filterCatName);
            filterCat.forEach((filter) => {
                if (filter.name === filterName) {
                    filter.currLogic = newLogic;
                }
            })
        }
    }

    /* Takes in a list of variants, sets passesFilter field on each variant to true,
     * if it passes all of the current filter criteria within this model.
     *
     * If we're in somaticOnlyMode, want variants to always pass filters. */
    markFilteredVariants(variants, somaticOnlyMode) {
        const self = this;

        // Get active filters
        let checkboxFilters = self.getCheckboxFilters();

        variants.forEach(variant => {
            // Innocent until proven guilty
            variant.passesFilters = true;

            // Checkbox filters
            if (!somaticOnlyMode) {
                for (let i = 0; i < checkboxFilters.length; i++) {
                    let filter = checkboxFilters[i];
                    let field = filter[0];
                    let value = filter[1];

                    if (self.getVarField(variant, field) === value) {
                        variant.passesFilters = false;
                        break;
                    }
                }
            }
        });
    }

    /* Marks if filter is active or inactive. Used to control indicators in filter drawer. */
    setFilterState(parentFilterName, filterName, filterState) {
        const self = this;
        let filterObj = self.getFilterObject(parentFilterName, filterName);
        if (filterObj) {
            filterObj.active = filterState;
        }
    }

    /* Marks if larger category is active or inactive. Used to control indicators in filter drawer. */
    setCategoryState(categoryName, categoryState) {
        const self = this;
        let filterObj = self.filterCategories.filter((filt) => {
            return filt.name === categoryName;
        });
        if (filterObj.length > 0) {
            filterObj[0].active = categoryState;
        }
    }

    clearAllFilters() {
        const self = this;
        self.filterCategories.forEach((filter) => {
            filter.active = false;
        });
    }

    setModelFilter(id, key, entries) {
        this.modelFilters[id][key] = entries;
    }

    resetAllFiltersToDefault() {
        Object.values(this.filters).forEach(filterList => {
            filterList.forEach(filter => {
                if (filter.type === 'slider') {
                    filter.currLogic = filter.defaultLogic;
                    filter.currVal = filter.defaultVal;
                }
            });
        });
        Object.values(this.checkboxLists).forEach(listEntry => {
            listEntry.model = listEntry.default;
        })
    }

    /* Switches current logic to staged logic for all applicable filters. */
    commitStagedChanges() {
        Object.values(this.filters).forEach(filterList => {
            filterList.forEach(filter => {
                if (filter.type === 'slider') {
                    filter.prevLogic = filter.currLogic;
                    filter.prevVal = filter.currVal;
                }
            })
        })
    }

    removeStagedFilter(filterName) {
        Object.values(this.filters).forEach(filterList => {
            filterList.forEach(filter => {
                if (filter.name === filterName) {
                    filter.stagedLogic = null;
                    filter.stagedVal = null;
                    filter.currLogic = filter.prevLogic;
                    filter.currVal = filter.prevVal;
                }
            })
        })
    }

    /* Resets all staged changes to null */
    clearAllStagedChanges() {
        Object.values(this.filters).forEach(filterList => {
            filterList.forEach(filter => {
                if (filter.type === 'slider') {
                    filter.stagedLogic = null;
                    filter.stagedVal = null;
                    filter.currLogic = filter.prevLogic;
                    filter.currVal = filter.prevVal;
                }
            })
        })
    }

    /*** HELPERS ***/

    /* Returns appropriately formatted filter display name for chips/labels. */
    getFilterDisplayName(name, parentFilterName) {
        let filterDisplayName = '';
        if (parentFilterName === 'impact') {
            filterDisplayName = name.toLowerCase();
            filterDisplayName = filterDisplayName.charAt(0).toUpperCase() + filterDisplayName.slice(1);
            filterDisplayName += ' Impact';
        } else if (parentFilterName === 'type') {
            if (name !== 'SNP' && name !== 'MNP') {
                filterDisplayName = filterDisplayName.toLowerCase();
                filterDisplayName = filterDisplayName.charAt(0).toUpperCase() + filterDisplayName.slice(1);
            }
            filterDisplayName += 's';
        } else if (parentFilterName === 'frequencies') {
            filterDisplayName = name + ' Freq';
        } else {
            filterDisplayName = name;
        }
        return filterDisplayName;
    }

    getFilterObject(parentFilterName, filterName) {
        const self = this;

        let filterObj = self.getFilters(parentFilterName).filter((cat) => {
            return cat.name === filterName;
        });
        if (filterObj.length > 0) {
            return filterObj[0];
        } else {
            return null;
        }
    }

    getAdjustedCutoff(cutoffValue, filterName) {
        const filtersNeedAdjusting = {
            'tumorAltFreq': true,
            'normalAltFreq': true
        };
        if (filtersNeedAdjusting[filterName]) {
            return cutoffValue / 100;
        } else {
            return cutoffValue;
        }
    }

    getFilterField(parentFilterName, filterName, fieldName) {
        const self = this;
        let filterObj = self.getFilterObject(parentFilterName, filterName);
        return filterObj[fieldName];
    }

    getCheckboxFilters() {
        const self = this;
        let typesToHide = [];
        for (var listCatName in self.checkboxLists) {
            let currList = self.checkboxLists[listCatName];
            currList.forEach((filter) => {
                if (!filter.model) {
                    typesToHide.push([listCatName, filter.name]);
                }
            })
        }
        return typesToHide;
    }

    // todo: can I get rid of these?
    // /* Returns filters that should be applied to tumor tracks.
    //  * Does NOT include 'somatic' filters because those are used
    //  * only for styling variants, not drawing/filtering out. */
    // getTumorCutoffFilters() {
    //     const self = this;
    //     const tumorFilters = [];
    //     for (var filterCatName in self.filters) {
    //         if (filterCatName !== this.ANNOTATION && filterCatName !== this.COUNT) {
    //             const currFilters = self.getFilters(filterCatName);
    //             currFilters.forEach((currFilter) => {
    //                 if (currFilter.active) {
    //                     tumorFilters.push(currFilter);
    //                 }
    //             });
    //         }
    //     }
    //     return tumorFilters;
    // }
    //
    // /* Returns filters that should be applied to normal tracks.
    //  * Does NOT include 'somatic' filters because those are used
    //  * only for styling variants, not drawing/filtering out. */
    // getNormalCutoffFilters() {
    //     const self = this;
    //     const normalFilters = [];
    //     for (var filterCatName in self.filters) {
    //         if (filterCatName !== this.ANNOTATION && filterCatName !== this.COUNT) {
    //             const currFilters = self.getFilters(filterCatName);
    //             currFilters.forEach((currFilter) => {
    //                 if (!currFilter.tumorOnly && currFilter.active) {
    //                     normalFilters.push(currFilter);
    //                 }
    //             });
    //         }
    //     }
    //     return normalFilters;
    // }

    /* Returns filters involved in recalling variants.
     * If activeOnly, returns those currently staged to recall variants. */
    getRecallFilters(activeOnly) {
        let recallFilters = [];
        this.getFilters(this.COUNT).forEach(filter => {
            if (!activeOnly)
                recallFilters.push(filter);
            else if (filter.stagedLogic && filter.stagedVal >= 0 &&
                !(filter.stagedLogic === filter.currLogic && filter.stagedVal === filter.stagedLogic))
                recallFilters.push(filter);
        });
        this.getFilters(this.QUALITY).forEach(filter => {
            if (!activeOnly)
                recallFilters.push(filter);
            else if (filter.stagedLogic && filter.stagedVal >= 0 &&
                !(filter.stagedLogic === filter.currLogic && filter.stagedVal === filter.stagedLogic))
                recallFilters.push(filter);
        });
        return recallFilters;
    }

    setActiveRecallFilters(filterSettings) {
        let foundMatch = false;
        let countFilters = this.getFilters(this.COUNT);
        const qualityFilters = this.getFilters(this.QUALITY);
        for (let i = 0; i < countFilters.length; i++) {
            let filter = countFilters[i];
            if (filter.name === filterSettings.name) {
                filter.currLogic = filterSettings.currLogic;
                filter.currVal = filterSettings.currVal;
                foundMatch = true;
                break;
            }
        }
        if (!foundMatch) {
            for (let i = 0; i < qualityFilters.length; i++) {
                let filter = qualityFilters[i];
                if (filter.name === filterSettings.name) {
                    filter.currLogic = filterSettings.currLogic;
                    filter.currVal = filterSettings.currVal;
                    foundMatch = true;
                    break;
                }
            }
        }
        if (!foundMatch) {
            console.log('Warning: could not update settings for filter ' + filterSettings.name);
        }
    }


    /* Returns current values for all active filters, not just those used in somatic calling. */
    getActiveImplementedFilters() {
        let activeFilters = [];
        Object.values(this.filters).forEach(filterList => {
            filterList.forEach(filter => {
                if (filter.active && filter.type !== 'checkbox') {
                    activeFilters.push(filter);
                }
            })
        });
        Object.values(this.checkboxLists).forEach(list => {
            list.forEach(filter => {
                if (!filter.model) {
                    activeFilters.push(filter);
                }
            })
        });
        return activeFilters;
    }

    /* Returns the value of the variant according to the field name argument.
     * Sometimes these need a bit of translating - if not, returns simple value according to key. */
    getVarField(variant, fieldName) {
        if (!variant) {
            console.log('Could not retrieve field from variant');
        } else {
            if (fieldName === 'impact') {
                let impactObj = variant['highestImpactVep'];
                let keys = Object.keys(impactObj);
                return (impactObj && keys.length > 0) ? keys[0] : null;
            } else if (variant[fieldName] == null) {
                console.log('Could not retrieve field from variant');
            } else {
                return variant[fieldName];
            }
        }
    }

    /* Takes in arrays of normal and tumor selected sample idxs (see Sample Model constructor for definitions).
     * If no normal samples provided in analysis, does not include in filtering criteria*/
    getCountCallingCriteria(normalSelSampleIdxs, tumorSelSampleIdxs) {
        const self = this;
        let criteria =  {
            'tumorSampleIdxs': tumorSelSampleIdxs,
            'totalSampleNum': normalSelSampleIdxs.length + tumorSelSampleIdxs.length
        };
        // May not always have normal samples in analysis
        if (normalSelSampleIdxs.length > 0) {
           criteria['normalSampleIdxs'] = normalSelSampleIdxs;
        }

        self.getFilters(self.COUNT).forEach(filter => {
            criteria[filter.name] = filter.currVal;
            criteria[filter.name + this.OPERATOR] = filter.currLogic;
        });
        self.getFilters(self.QUALITY).forEach(filter => {
            criteria[filter.name] = filter.currVal;
            criteria[filter.name + this.OPERATOR] = filter.currLogic;
            criteria[filter.name + this.OPERATOR] = filter.currLogic;
        });

        return criteria;
    }

    /* Returns final filtering phrase, including depth and quality, for filtering variants.
     * If only tumor samples, or normal sample does not contain any variants, the vcf is assumed
     * to be pre-filtered for somatic only variants, and the filter phrase only contains quality and
     * depth requirements. If alternatively, a normal sample with variants is present,
     * somatic filtering criteria is also included, unless removed by the user.
     */
    getFilterPhrase(normalSelSampleIdxs, tumorSelSampleIdxs) {
        // todo: left off here - checking to see if this functionality fits with new paradigm of passing filtering in
        // for both global and local variant calling
        // todo: may need to incorporate somaticOnly logic here, DEFINITELY that no normal sample possible

        // todo: change this so that normal phrase returns empty if no normal sample
        // todo: check formatting of combining tumorPhrase w/ empty normalPhrase string
        // todo: what does freqCriteria look like?
        const countCriteria = this.getCountCallingCriteria(normalSelSampleIdxs, tumorSelSampleIdxs);
        const normalPhrase = this.getNormalFilterPhrase(normalSelSampleIdxs, countCriteria);
        const tumorPhrase = this.getTumorFilterPhrase(tumorSelSampleIdxs, countCriteria);
        const samplePhrase = '(' + normalPhrase + ')&&(' + tumorPhrase + ')';
        const qualPhrase = '(QUAL' + countCriteria[this.QUAL_OPERATOR] + countCriteria[this.QUAL_CUTOFF] + ')';
        return qualPhrase + '&&' + samplePhrase;
    }

    /* Returns normal(non-tumor) filtering phrase for normal samples based on current somatic criteria.
     * If we don't have any normal samples, returns empty string. */
    getNormalFilterPhrase(normalSelSampleIdxs, countCriteria) {
        let normalPhrase = '';
        for (let i = 0; i < normalSelSampleIdxs.length; i++) {
            const idx = normalSelSampleIdxs[i];
            if (i > 0) {
                normalPhrase += '||';
            }

            let altNumAcronym = this._getAltNumAcronym();
            // todo: BIG PROBLEM - how do I know which count to pull - not always 0?
            normalPhrase += '(FORMAT/' + altNumAcronym + '[' + idx + ':0]' + countCriteria[this.NORMAL_COUNT_OPERATOR] + countCriteria[this.NORMAL_COUNT];
            normalPhrase += '&FORMAT/DP[' + idx + ':0]' + countCriteria[this.DEPTH_OPERATOR] + countCriteria[this.GENOTYPE_DEPTH] + ')';
            normalPhrase += '||(FORMAT/DP[' + idx + ':0]=\".\")';
        }
        return normalPhrase;
    }

    /* Returns tumor filtering phrase for tumor samples based on current somatic criteria. */
    getTumorFilterPhrase(tumorSelSampleIdxs, countCriteria) {
        let tumorPhrase = '';
        for (let i = 0; i < tumorSelSampleIdxs.length; i++) {
            const idx = tumorSelSampleIdxs[i];
            if (i > 0) {
                tumorPhrase += '||';
            }
            let altNumAcronym = this._getAltNumAcronym();
            // todo: BIG PROBLEM - how do I know which count to pull - not always 0?
            tumorPhrase += '(FORMAT/' + altNumAcronym + '[' + idx + ':0]' + countCriteria[this.TUMOR_COUNT_OPERATOR] + countCriteria[this.TUMOR_COUNT];
            tumorPhrase += '&FORMAT/DP[' + idx + ':0]' + countCriteria[this.DEPTH_OPERATOR] + countCriteria[this.GENOTYPE_DEPTH] + ')';
        }
        return tumorPhrase;
    }

    /* Returns the acronym representing the number of alternate allele counts.
     * This acronym varies by variant calling programs -
     * for example, Freebayes uses AO, while GATK uses AC. */
    // todo: add any others here...
    _getAltNumAcronym() {
        const varCallerUsed = this.getVarCallerUsed();
        switch (varCallerUsed) {
            case 'freebayes':
                return 'AO';
            case 'gatk':
                return 'AC';
            default:
                console.log("ERROR: Could not determine acronym used to report alternate allele counts.");
        }
    }

    /* Used to load in global filters from a previous analysis */
    loadFilterSettings(analysisSettings) {
        analysisSettings.forEach(filter => {
            this.setActiveRecallFilters(filter);
        });
    }

    /* Adds current filter settings, and the number of somatic variants & genes they pulled back,
     * to history list, if the exact same settings have not yet been added.
     * { somaticVarCount: x,
     *   somaticGeneCount: y,
     *   rankedGeneList: [geneA, geneB...],
     *   filters: [
     *     { name: filterName,
     *       logic: filterLogic,
     *       val: filterVal
     *     }
     *   ]
     * }
     */
    addFilterHistory(somaticVarCount, somaticGeneCount, rankedGeneList) {
        let filterSettingsList = [];

        let analysisKey = this.getAnalysisKey(this.getRecallFilters());
        this.getRecallFilters(false).forEach(filter => {
            let settingsObject = {};
            settingsObject.name = filter.name;
            settingsObject.display = filter.display;
            settingsObject.currLogic = filter.currLogic;
            settingsObject.currVal = filter.currVal;
            filterSettingsList.push(settingsObject);
        });

        if (!this.filterHistory[analysisKey]) {
            let analysisObject = {};
            analysisObject['somaticVarCount'] = somaticVarCount;
            analysisObject['somaticGeneCount'] = somaticGeneCount;
            analysisObject['rankedGeneList'] = rankedGeneList;
            analysisObject['filters'] = filterSettingsList;
            this.filterHistory[analysisKey] = analysisObject;
        }
        // Regardless if we've already added this analysis, it's the current one
        this.currentAnalysisKey = analysisKey;
    }

    getAnalysisKey(filters) {
        let analysisKey = '';
        filters.forEach(filter => {
            analysisKey += filter.name;
            analysisKey += filter.currLogic;
            analysisKey += filter.currVal;
            analysisKey += "_";
        });
        return analysisKey;
    }

    updateCheckboxParentsStatus(parentName) {
        let active = false;
        let list = this.checkboxLists[parentName];
        for (let i = 0; i < list.length; i++) {
            let currFilter = list[i];
            if (!currFilter.model) {
                active = true;
                break;
            }
        }
        let parentFilter = this.getFilters(this.ANNOTATION).filter(filt => {
            return filt.name === parentName;
        });
        if (parentFilter.length > 0) {
            parentFilter[0].active = active;
        }
    }
}

export default FilterModel;
