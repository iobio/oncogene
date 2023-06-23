import CacheHelper from './CacheHelper.js';
import bamiobio from './Bam.iobio.js';
import cnviobio from './Cnv.iobio.js';
import vcfiobio from './Vcf.iobio.js';

/* One per normal or tumor sample */
class SampleModel {
    constructor(globalApp) {

        // model references
        this.globalApp = globalApp;
        this.vcf = null;                    // The vcf.iobio model backing this
        this.bam = null;                    // The bam.iobio model backing this - used for coverage, rnaseq, and atacseq
        this.cnv = null;                    // The cnv.iobio model backing this
        this.cohort = null;

        this.vcfData = null;
        this.fbData = null;
        this.coverageData = null;
        this.rnaSeqData = null;
        this.atacSeqData = null;

        // variant & coverage data
        this.variantIdHash = {};    // A hash table of all variant IDs : variant objects in this model - MAY contain variant objects with only rnaSeqPtCoverage/atacSeqPtCoverage if missing from vcf
        this.loadedVariants = [];
        this.variantHistoData = null;
        this.coverage = [[]];       // Coverage pulled from bamData
        this.rnaSeqCoverage = [[]];
        this.atacSeqCoverage = [[]];
        this.somaticVarCoverage = [[]]; // List of [start site, read depth] corresponding to sites in tumor samples but not in normal samples - aka this is only used in normal SampleModel

        // vcf data
        this.vcfUrlEntered = false;
        this.vcfFileOpened = false;
        this.getVcfRefName = null;
        this.isMultiSample = false;
        this.vcfRefNamesMap = {};

        // bam data
        this.coverageUrlEntered = false;
        this.rnaSeqUrlEntered = false;
        this.atacSeqUrlEntered = false;
        this.getBamRefName = null;

        // cnv data
        this.cnvUrlEntered = false;
        this.cnvsInGeneObj = null;          // The CNVs within the currently selected gene
        this.cnvsOnSelectedChrom = null;    // The CNVs on the chromosome where currently selected gene located

        // model properties
        // TODO: I can get rid of some of these now
        this.id = '';               // Must be unique, format s0, s1... used to coordinate order in Welcome menu
        this.order = -1;            // The order in which the track is displayed vertically, relative to all other tracks, both normal and tumor
        this.categoryOrder = -1;    // The order of this model relative to the other models in the same category e.g., if this is track s1 but the first tumor track, this val will be 0
        this.displayName = '';      // Display name entered in filesMenu
        this.selectedSample = '';   // The sample id listed as the vcf column header
        this.selectedSampleIdx = -1;    // The 0-based index corresponding to the column in the vcf for this sample
        this.isGeneratedSampleName = false;
        this.defaultSampleName = null;
        this.isTumor = true;
        this.isCosmic = false;

        // functional flags
        this.isBasicMode = null;
        this.isEduMode = null;
        this.entryDataChanged = true;       // True if something in the filesMenu has changed for this sample, and the track needs to be updated upon clicking 'Load'
        this.lastGeneLoaded = null;         // The most recent gene analyzed for this sample
        this.noMatchingSamples = false;     // True if active filters leave no variants applicable from this sample
        this.debugMe = false;
        this.inProgress = {
            'loadingVariants': false,
            'callingVariants': false,
            'coverageLoading': false,   // Note: must keep coverage keys like this
            'cnvLoading' : false,
            'rnaSeqLoading': false,
            // 'atacSeqLoading': false
        };
    }

    /*
     * SETTERS
     */
    setLoadedVariants(theVcfData) {
        this.vcfData = theVcfData;
    }

    setCalledVariants(theFbData, cache = false) {
        this.fbData = theFbData;
        if (cache) {
            this._promiseCacheData(theFbData, CacheHelper.FB_DATA, window.gene.gene_name, window.selectedTranscript);
        }
    }

    promiseSetLoadState(theVcfData, taskName) {
        const me = this;
        let resolveIt = function (resolve, theVcfData) {
            if (theVcfData != null) {
                if (theVcfData.loadState == null) {
                    theVcfData.loadState = {};
                }
                theVcfData.loadState[taskName] = true;
            }
            resolve();
        };
        return new Promise(function (resolve, reject) {
            if (theVcfData != null) {
                resolveIt(resolve, theVcfData);
            } else {
                me.promiseGetVcfData(window.gene, window.selectedTranscript)
                    .then(function (data) {
                            resolveIt(resolve, data.vcfData);
                        },
                        function (error) {
                            var msg = "A problem occurred in SampleModel.promiseSetLoadState(): " + error;
                            console.log(msg);
                            reject(msg);
                        })
            }
        })
    }

    /*
     * GETTERS
     */
    getAnnotators() {
        return this.vcf ? this.vcf.getAnnotators() : [];
    }

    getGeneModel() {
        return this.cohort.geneModel;
    }

    // TODO: change this name and all references
    getAffectedInfo() {
        return this.cohort.tumorInfo;
    }

    getTranslator() {
        return this.cohort.translator;
    }

    getCacheHelper() {
        return this.cohort.cacheHelper;
    }

    getGenomeBuildHelper() {
        return this.cohort.genomeBuildHelper;
    }

    getAnnotationScheme() {
        // If this is the refseq gene model, set the annotation
        // scheme on the filter card to 'VEP' since snpEff will
        // be bypassed at this time.
        if (this.getGeneModel().geneSource === 'refseq') {
            return "VEP";
        } else {
            return this.cohort.annotationScheme;
        }
    }

    // A little bit of faking private props
    getCohortModel() {
        let self = this;
        return self.cohort;
    }

    getFeature(id) {
        const self = this;
        let variant = null;
        if (self.vcfData && self.vcfData.features && self.vcfData.features.length > 0) {
            let matchingVars = self.vcfData.features.filter((feat) => {
                return feat.id === id;
            });
            variant = matchingVars[0];
        }
        return variant;
    }

    /*
     * STATUS GETTERS
     */
    isLoaded() {
        return this.vcf != null && this.vcfData != null;
    }

    isReadyToLoad() {
        if (this.isVcfReadyToLoad()) {
            return this.isSampleSelected();
        } else {
            return this.isBamReadyToLoad();
        }
    }

    isBamReadyToLoad(bamType) {
        let bamUrlEntered = this.atacSeqUrlEntered;
        if (bamType === this.globalApp.COVERAGE_TYPE) {
            bamUrlEntered = this.coverageUrlEntered;
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            bamUrlEntered = this.rnaSeqUrlEntered;
        }
        return this.bam != null && bamUrlEntered;
    }

    isVcfReadyToLoad() {
        return this.vcf != null && (this.vcfUrlEntered || this.vcfFileOpened);
    }

    isSampleSelected() {
        return !this.isMultiSample || (this.selectedSample && this.selectedSample.length > 0);
    }

    isBamLoaded(bamType) {
        if (!bamType) {
            console.log("Error: need bam type in isBamLoaded");
        }
        return this.isBamReadyToLoad(bamType);
    }

    isCnvLoaded() {
        return this.cnv && this.cnvUrlEntered;
    }

    isVcfLoaded() {
        return this.vcf && (this.vcfUrlEntered || this.vcfFileOpened);
    }

    promiseGetVcfData(geneObject, selectedTranscript, whenEmptyUseFbData = true) {
        const me = this;
        const dataKind = CacheHelper.VCF_DATA;
        return new Promise(function (resolve, reject) {
            if (geneObject == null) {
                reject("Empty geneObject in SampleModel.promiseGetVcfData()");
            }

            // If only alignments have specified, but not variant files, we will need to use the
            // getBamRefName function instead of the getVcfRefName function.
            let theGetRefNameFunction = me.getVcfRefName != null ? me.getVcfRefName : me.getBamRefName;
            if (theGetRefNameFunction == null) {
                theGetRefNameFunction = me._stripRefName;
            }

            if (theGetRefNameFunction == null) {
                const msg = "No function defined to parse ref name from file";
                console.log(msg);
                reject(msg);
            }
            let theVcfData = null;

            if (me[dataKind] != null && me[dataKind].features && me[dataKind].features.length > 0) {
                if (theGetRefNameFunction(geneObject.chr) === me[dataKind].ref &&
                    geneObject.start === me[dataKind].start &&
                    geneObject.end === me[dataKind].end &&
                    geneObject.strand === me[dataKind].strand) {
                    theVcfData = me[dataKind];
                    resolve({model: me, vcfData: theVcfData});
                }
            }
            if (theVcfData == null) {
                // SJG TODO: put cacheing back in
                // Find vcf data in cache
                //me._promiseGetData(dataKind, geneObject.gene_name, selectedTranscript)
                //     .then(function (data) {
                //         if (data != null && data !== '') {
                //             me[dataKind] = data;
                //             theVcfData = data;
                //             resolve({model: me, vcfData: theVcfData});
                //         } else {
                            // If the vcf data is null, see if there are called variants in the cache.  If so,
                            // copy the called variants into the vcf data.
                            if (whenEmptyUseFbData && me.isAlignmentsOnly()) {
                                me.promiseGetFbData(geneObject, selectedTranscript)
                                    .then(function (theFbData) {
                                            // If no variants are loaded, create a dummy vcfData with 0 features
                                            if (theFbData && theFbData.features) {
                                                theVcfData = me.globalApp.$.extend({}, theFbData);
                                                theVcfData.features = [];
                                                me.promiseSetLoadState(theVcfData, 'clinvar')
                                                    .then(function () {
                                                        return me.promiseSetLoadState(theVcfData, 'coverage');
                                                    })
                                                    .then(function () {
                                                        return me.promiseSetLoadState(theVcfData, 'inheritance');
                                                    })
                                                    .then(function () {
                                                        me.addCalledVariantsToVcfData(theVcfData, theFbData);
                                                    })
                                            }
                                            resolve({model: me, vcfData: theVcfData});
                                        },
                                        function (error) {
                                            let msg = "Problem occurred in SampleModel.promiseGetVcfData: " + error;
                                            console.log(msg);
                                            reject(error);
                                        });
                            } else {
                                resolve({model: me, vcfData: theVcfData});
                            }
            }
            //         })
            // }
        });
    }

    promiseGetFbData(geneObject, selectedTranscript, reconstiteFromVcfData = false) {
        var me = this;
        return new Promise(function (resolve, reject) {
            me._promiseGetData(CacheHelper.FB_DATA, geneObject.gene_name, selectedTranscript)
                .then(function (theFbData) {
                        if (reconstiteFromVcfData) {
                            // Reconstitute called variants from vcf data that contains called variants
                            if (theFbData == null || theFbData.features == null) {
                                me.promiseGetVcfData(geneObject, selectedTranscript, false)
                                    .then(function (data) {
                                            var theVcfData = data.vcfData;
                                            me.promiseGetDangerSummary(geneObject.gene_name)
                                                .then(function () {
                                                        if (theVcfData && theVcfData.features) {
                                                            theFbData = me.reconstituteFbData(theVcfData);
                                                            resolve({fbData: theFbData, model: me});
                                                        } else {
                                                            resolve({fbData: theFbData, model: me});
                                                        }
                                                    },
                                                    function (error) {
                                                        var msg = "An error occurred in SampleModel.promiseGetFbData: " + error;
                                                        console.log(msg);
                                                        reject(msg);
                                                    })
                                        },
                                        function (error) {
                                            var msg = "An error occurred in SampleModel.promiseGetFbData: " + error;
                                            console.log(msg);
                                            reject(msg);
                                        });
                            } else {
                                resolve({fbData: theFbData, model: me});
                            }
                        } else {
                            resolve({fbData: theFbData, model: me});
                        }
                    },
                    function (error) {
                        var msg = "Problem in SampleModel.promiseGetFbData(): " + error;
                        console.log(msg);
                        reject(msg);
                    })
        })
    }

    reconstituteFbData(theVcfData) {
        var me = this;
        var theFbData = me.globalApp.$.extend({}, theVcfData);
        theFbData.features = [];
        theFbData.loadState = {clinvar: true, coverage: true, inheritance: true};
        // Add the unique freebayes variants to vcf data to include
        // in feature matrix
        theVcfData.features.forEach(function (v) {
            if (v == null) {
                console.log("empty variant!")
            } else {
                if (v.hasOwnProperty('fbCalled') && v.fbCalled == 'Y') {
                    var variantObject = me.globalApp.$.extend({}, v);
                    theFbData.features.push(variantObject);
                    variantObject.source = v;
                }
            }
        });
        return theFbData;
    }

    // promiseGetKnownVariantHistoData(geneObject, transcript, binLength, annotationMode) {
    //     var me = this;
    //     return new Promise(function (resolve, reject) {
    //         var refName = me._stripRefName(geneObject.chr);
    //         me.vcf.promiseGetVariantsHistoData(me.id, refName, geneObject, binLength == null ? transcript : null, binLength)
    //             .then(function (results) {
    //                 if (binLength == null) {
    //                     var exonBins = me.binKnownVariantsByExons(geneObject, transcript, binLength, results, annotationMode);
    //                     resolve(exonBins);
    //                 } else {
    //                     resolve(results);
    //                 }
    //             })
    //             .catch(function (error) {
    //                 reject(error);
    //             })
    //     })
    // }

    // promiseGetCosmicVariantHistoData(geneObject, transcript, binLength, annotationMode) {
    //     const me = this;
    //     return new Promise(function (resolve, reject) {
    //         let refName = me._stripRefName(geneObject.chr);
    //         me.vcf.promiseGetVariantsHistoData(me.id, refName, geneObject, binLength == null ? transcript : null, binLength)
    //             .then(function (results) {
    //                 if (binLength == null) {
    //                     let exonBins = me.binKnownVariantsByExons(geneObject, transcript, binLength, results, annotationMode);
    //                     resolve(exonBins);
    //                 } else {
    //                     resolve(results);
    //                 }
    //             })
    //             .catch(function (error) {
    //                 reject(error);
    //             })
    //     })
    // }

    binKnownVariantsByExons(geneObject, transcript, binLength, results, annotationMode) {
        var exonBins = [];
        transcript.features.filter(function (feature) {
            return feature.feature_type.toUpperCase() === 'CDS' || feature.feature_type.toUpperCase() === 'CDS';
        }).forEach(function (exon) {
            let exonBin = {};
            if (annotationMode === 'vep') {
                exonBin['point'] = (+exon.start + ((+exon.end - +exon.start) / 2));
                exonBin['start'] = exon.start;
                exonBin['end'] = exon.end;
                exonBin['total'] = +0;
                exonBin['high'] = +0;
                exonBin['moderate'] = +0;
                exonBin['modifier'] = +0;
                exonBin['low'] = +0;
            } else {
                exonBin['point'] = (+exon.start + ((+exon.end - +exon.start) / 2));
                exonBin['start'] = exon.start;
                exonBin['end'] = exon.end;
                exonBin['total'] = +0;
                exonBin['path'] = +0;
                exonBin['benign'] = +0;
                exonBin['unknown'] = +0;
                exonBin['other'] = +0;
            }
            results.forEach(function (rec) {
                if (+rec.start >= +exon.start && +rec.end <= +exon.end) {
                    if (annotationMode === 'vep') {
                        exonBin.total += +rec.total;
                        exonBin.high += +rec.high;
                        exonBin.moderate += +rec.moderate;
                        exonBin.modifier += +rec.modifier;
                        exonBin.low += +rec.low;
                    } else {
                        exonBin.total += +rec.total;
                        exonBin.path += +rec.path;
                        exonBin.benign += +rec.benign;
                        exonBin.other += +rec.other;
                        exonBin.unknown += +rec.unknown;
                    }
                }
            });
            exonBins.push(exonBin);
        });
        return exonBins;
    }

    promiseGetGeneCoverage(geneObject, transcript, bamType) {
        const me = this;

        return new Promise(function (resolve, reject) {
            me.promiseGetCachedGeneCoverage(geneObject, transcript)
                .then(function (cachedGeneCoverage) {
                        if (cachedGeneCoverage) {
                            // todo: change this to bamType key
                            resolve({model: me, 'geneCoverage': cachedGeneCoverage})
                        } else {
                            if (transcript.features == null || transcript.features.length === 0) {
                                resolve({model: me, gene: geneObject, transcript: transcript, 'geneCoverage': []});
                            } else {
                                me.bam.getGeneCoverage(geneObject,
                                    transcript,
                                    [me.bam],
                                    bamType,
                                    function (theData, trRefName, theGeneObject, theTranscript) {
                                        var geneCoverageObjects = me._parseGeneCoverage(theData);
                                        if (geneCoverageObjects.length > 0) {
                                            me._setGeneCoverageExonNumbers(transcript, geneCoverageObjects);
                                            me.setGeneCoverageForGene(geneCoverageObjects, theGeneObject, theTranscript, bamType);
                                            resolve({
                                                model: me,
                                                gene: theGeneObject,
                                                transcript: theTranscript,
                                                'geneCoverage': geneCoverageObjects
                                            });
                                        } else {
                                            console.log("Cannot get gene coverage for gene " + theGeneObject.gene_name);
                                            resolve({
                                                model: me,
                                                gene: theGeneObject,
                                                transcript: theTranscript,
                                                'geneCoverage': []
                                            });
                                        }
                                    }
                                );
                            }
                        }

                    },
                    function (error) {
                        reject(error);
                    });
        });
    }

    _setGeneCoverageExonNumbers(transcript, geneCoverageObjects) {
        transcript.features.forEach(function (feature) {
            var gc = null;
            var matchingFeatureCoverage = geneCoverageObjects.filter(function (gc) {
                return feature.start == gc.start && feature.end == gc.end;
            });
            if (matchingFeatureCoverage.length > 0) {
                gc = matchingFeatureCoverage[0];
            }
            if (gc) {
                gc.exon_number = feature.exon_number;
            }

        });
    }

    _parseGeneCoverage(theData) {
        var geneCoverageObjects = [];
        if (theData && theData.length > 0) {
            var fieldNames = [];
            theData.split("\n").forEach(function (rec) {
                if (rec.indexOf("#") == 0 && fieldNames.length == 0) {
                    rec.split("\t").forEach(function (field) {
                        if (field.indexOf("#") == 0) {
                            field = field.substring(1);
                        }
                        fieldNames.push(field);
                    })
                } else {
                    var fields = rec.split("\t");
                    if (fields.length == fieldNames.length) {
                        var gc = {};
                        for (var i = 0; i < fieldNames.length; i++) {
                            gc[fieldNames[i]] = fields[i];
                            if (fieldNames[i] == 'region') {
                                if (fields[i] != "NA") {
                                    var parts = fields[i].split(":");
                                    gc.chrom = parts[0];
                                    var region = parts[1].split("-");
                                    gc.start = region[0];
                                    gc.end = region[1];
                                }
                            }
                        }
                        geneCoverageObjects.push(gc);
                    }
                }
            })
        }

        return geneCoverageObjects;
    }

    promiseGetCachedGeneCoverage(geneObject, selectedTranscript, bamType) {
        let dataType = '';
        if (bamType === this.globalApp.COVERAGE_TYPE) {
            dataType = CacheHelper.GENE_COVERAGE_DATA;
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            dataType = CacheHelper.RNASEQ_COVERAGE_DATA;
        } else if (bamType === this.globalApp.ATACSEQ_TYPE) {
            dataType = CacheHelper.ATACSEQ_COVERAGE_DATA;
        }

        return this._promiseGetData(dataType, geneObject.gene_name, selectedTranscript);
    }

    setGeneCoverageForGene(geneCoverage, geneObject, transcript, bamType) {
        geneObject = geneObject ? geneObject : window.gene;
        transcript = transcript ? transcript : window.selectedTranscript;

        let dataType = '';
        if (bamType === this.globalApp.COVERAGE_TYPE) {
            dataType = CacheHelper.GENE_COVERAGE_DATA;
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            dataType = CacheHelper.RNASEQ_COVERAGE_DATA;
        } else if (bamType === this.globalApp.ATACSEQ_TYPE) {
            dataType = CacheHelper.ATACSEQ_COVERAGE_DATA;
        }
        this._promiseCacheData(geneCoverage, dataType, geneObject.gene_name, transcript);
    }

    promiseGetBamData(geneObject, bamType) {
        const me = this;
        return new Promise(function (resolve, reject) {
            if (geneObject == null) {
                reject("Error SampleModel.promiseGetBamData(): geneObject is null");
            }

            let bamData = this.coverageData;
            if (bamType === this.globalApp.RNASEQ_TYPE) {
                bamData = this.rnaSeqData;
            }

            if (bamData != null) {
                if (me.getBamRefName(geneObject.chr) === bamData.ref &&
                    geneObject.start === bamData.start &&
                    geneObject.end === bamData.end) {
                    let data = bamData;
                    resolve(data.coverage);
                }
            } else {
                // Find in cache
                me._promiseGetData(CacheHelper.BAM_DATA, geneObject.gene_name, null)
                    .then(function (data) {
                            if (data != null && data !== '') {
                                me._setBamData(bamType, data);
                            }
                            resolve(data ? data.coverage : null);
                        },
                        function (error) {
                            const msg = "An error occurred in SampleModel.promiseGetBamData(): " + error;
                            reject(msg);
                        })
            }

        })
    }

    promiseGetDangerSummary(geneName) {
        return this._promiseGetData(CacheHelper.DANGER_SUMMARY_DATA, geneName, null);
    }

    promiseGetVariantCount(data) {
        const me = this;

        let resolveIt = function (resolve, theVcfData) {
            var loadedVariantCount = 0;
            if (theVcfData && theVcfData.features) {
                theVcfData.features.forEach(function () {
                    loadedVariantCount++;
                });
            }
            resolve(loadedVariantCount);
        };

        return new Promise(function (resolve, reject) {
            if (data != null && data.features != null) {
                resolveIt(resolve, data);
            } else {
                me.promiseGetVcfData(window.gene, window.selectedTranscript)
                    .then(function (theData) {
                            resolveIt(resolve, theData.vcfData);
                        },
                        function (error) {
                            let msg = "Problem in SampleModel.promiseGetVariantCount(): " + error;
                            console.log(msg);
                            reject(msg);
                        })
            }
        })

    }

    promiseSummarizeDanger(geneName, theVcfData, options, geneCoverageAll, filterModel) {
        let me = this;
        return new Promise(function (resolve, reject) {
            let dangerSummary = SampleModel._summarizeDanger(geneName, theVcfData, options, geneCoverageAll, filterModel, me.getTranslator(), me.getAnnotationScheme());
            me.promiseCacheDangerSummary(dangerSummary, geneName).then(function () {
                    resolve(dangerSummary);
                },
                function (error) {
                    reject(error);
                })
        })
    }

    promiseSummarizeError(geneName, error) {
        var me = this;
        return new Promise(function (resolve, reject) {
            var dangerSummary = SampleModel.summarizeError(error);
            me.promiseCacheDangerSummary(dangerSummary, geneName)
                .then(function () {
                        resolve(dangerSummary);
                    },
                    function (error) {
                        reject(error);
                    })
        })
    }

    filterBamDataByRegion(coverage, regionStart, regionEnd) {
        return coverage.filter(function (d) {
            return (d[0] >= regionStart && d[0] <= regionEnd);
        });
    }

    reduceBamData(coverageData, numberOfPoints) {
        var factor = this.globalApp.d3.round(coverageData.length / numberOfPoints);
        var xValue = function (d) {
            return d[0];
        };
        var yValue = function (d) {
            return d[1];
        };
        return this.bam.reducePoints(coverageData, factor, xValue, yValue);
    }

    promiseGetCalledVariantCount() {
        var me = this;
        return new Promise(function (resolve, reject) {
            me.promiseGetFbData(window.gene, window.selectedTranscript, true)
                .then(function (data) {
                        var theFbData = data.fbData;
                        if (theFbData && theFbData.features) {
                            var count = theFbData.features
                                .filter(function (d) {
                                    // Filter homozygous reference for proband only
                                    if (d.zygosity && d.zygosity.toLowerCase() == 'homref') {
                                        return false;
                                    }
                                    return true;
                                }).length;
                            resolve(count);
                        } else {
                            resolve(0);
                        }

                    },
                    function (error) {
                        var msg = "Problem in getCalledVariantCount(): " + error;
                        console.log(msg);
                        reject(msg);
                    });
        })

    }


    promiseHasCalledVariants() {
        var me = this;
        return new Promise(function (resolve, reject) {
            if (me.fbData != null) {
                resolve(me.fbData != null && me.fbData.features != null && me.fbData.features.length > 0);
            } else {
                me.promiseGetFbData(window.gene, window.selectedTranscript, true)
                    .then(function (data) {
                            resolve(data.fbData != null && data.fbData.features != null && data.fbData.features.length > 0);
                        },
                        function (error) {
                            var msg = "Problem in SampleModel.promiseHasCalledVariants(): " + error;
                            console.log(msg);
                            reject(msg);
                        })
            }

        })
    }


    promiseVariantsHaveBeenCalled() {
        var me = this;
        return new Promise(function (resolve, reject) {
            if (me.fbData) {
                resolve(true);
            } else {
                me.promiseGetFbData(window.gene, window.selectedTranscript, true)
                    .then(function (data) {
                            resolve(data.fbData != null);
                        },
                        function (error) {
                            var msg = "Problem in SampleModel.promiseVariantsHaveBeenCalled(): " + error;
                            console.log(msg);
                            reject(msg);
                        });
            }
        })

    }

    /* Returns unique id correlated with sample. Formatted 'n' + i for normal and 't' + i for tumor */
    getId() {
        return this.id;
    }

    setId(theId) {
        this.id = theId;
    }

    /* Returns display name for sample */
    getDisplayName() {
        return this.displayName;
    }

    setDisplayName(theName) {
        if (theName) {
            this.displayName = theName;
        }
    }

    getSelectedSample() {
        return this.selectedSample;
    }

    setSelectedSample(theSample) {
        if (theSample) {
            this.selectedSample = theSample;
        }
    }

    getTumorStatus() {
        return this.isTumor && this.isTumor === true;
    }

    setTumorStatus(status) {
        this.tumorStatus = status;
    }

    setGeneratedSampleName(sampleName) {
        this.sampleName = sampleName;
        this.isGeneratedSampleName = true;
    }

    getVcfSampleName() {
        // Returns a sample name if provided in the vcf header; otherwise returns null.
        return !this.isGeneratedSampleName ? (this.selectedSample === "" ? null : this.selectedSample) : null;
    }


    setDefaultSampleName(sampleName) {
        this.defaultSampleName = sampleName;
    }


    getDefaultSampleName() {
        return this.defaultSampleName;
    }

    getTranscriptId() {
        let cohortModel = this.getCohortModel();
        if (cohortModel) {
            return cohortModel.selectedTranscriptId;
        }
        return "";
    }

    markEntryDataChanged(changedStatus) {
        let self = this;
        self.entryDataChanged = changedStatus;
    }

    init(cohort) {
        // init vcf.iobio
        this.cohort = cohort;
        this.vcf = vcfiobio(this.globalApp);
        this.vcf.setEndpoint(this.cohort.endpoint);
        this.vcf.setGenericAnnotation(this.cohort.genericAnnotation);
        this.vcf.setGenomeBuildHelper(this.cohort.genomeBuildHelper);
        this.vcf.setGeneModel(this.getGeneModel());
        this.vcf.setIsEduMode(this.cohort.isEduMode);
        this.bam = new bamiobio(this.globalApp, this.cohort.endpoint);
        this.cnv = new cnviobio(this.cohort.endpoint, this.cohort.genomeBuildHelper);
        this.cnv.init();
    }

    // todo: not allowing local file uploads atm
    // promiseBamFilesSelected(fileSelection) {
    //     const me = this;
    //     return new Promise(function (resolve, reject) {
    //
    //         me.bamData = null;
    //         me.fbData = null;
    //
    //         if (fileSelection == null) {
    //             me.bamFileOpened = false;
    //             me.bamRefName = null;
    //             resolve();
    //         } else {
    //             me.bam.openBamFile(fileSelection, function (success, message) {
    //                 if (success) {
    //                     me.bamFileOpened = true;
    //                     me.getBamRefName = me._stripRefName;
    //                     resolve(me.bam.bamFile.name);
    //
    //                 } else {
    //                     alert('Problem loading bam file');
    //                     reject(message);
    //                 }
    //             });
    //         }
    //     });
    // }

    // We don't need to check bam urls again, already checked in loader
    onBamUrlConfirmed(bamUrl, baiUrl, bamType, callback) {
        const self = this;

        if (bamUrl == null || bamUrl === "") {
            self._markBamUrlEntered(bamUrl, baiUrl, bamType, false);
            self.bam = null;
            if (callback) {
                callback(false)
            }
        } else {
            self._markBamUrlEntered(bamUrl, baiUrl, bamType, true);
            self.getBamRefName = this._stripRefName;
            if (callback) {
                callback(true);
            }
        }
    }

    onBamUrlEntered(bamUrl, baiUrl, bamType, callback) {
        const self = this;

        if (bamUrl == null || bamUrl === "") {
            self._markBamUrlEntered(bamType, false);
            if (callback) {
                callback(false)
            }
        } else {
            self._markBamUrlEntered(bamType, true);
            const ref = !this.getGenomeBuildHelper().isBuild37() ? '1' : 'chr1';
            self.bam.checkBamBaiUrls(bamUrl, baiUrl, ref, function (success, errorMsg) {
                if (!success) {
                    self._markBamUrlEntered(bamType, false);
                    console.log("Problem opening bam/bai file: " + errorMsg);
                }
                if (callback) {
                    callback(success);
                }
            });
        }
        self.getBamRefName = this._stripRefName;
    }

    _markBamUrlEntered(bamUrl, baiUrl, type, isEntered) {
        if (type === this.globalApp.COVERAGE_TYPE) {
            this.coverageUrlEntered = isEntered;
            this.bam.coverageBam = bamUrl;
            this.bam.coverageBai = baiUrl;
        } else if (type === this.globalApp.RNASEQ_TYPE) {
            this.rnaSeqUrlEntered = isEntered;
            this.bam.rnaSeqBam = bamUrl;
            this.bam.rnaSeqBai = baiUrl;
        } else if (type === this.globalApp.ATACSEQ_TYPE) {
            this.atacSeqUrlEntered = isEntered;
            this.bam.atacSeqBam = bamUrl;
            this.bam.atacSeqBai = baiUrl;
        }
    }

    onCnvUrlEntered(cnvUrl, callback) {
        if (cnvUrl == null || cnvUrl === '') {
            this.cnvUrlEntered = false;
            if (callback) {
                callback(false);
            }
        } else {
            this.cnvUrlEntered = true;
            const self = this;
            this.cnv.checkCnvFormat(cnvUrl, function (success, buffer) {
                if (!success) {
                    self.cnvUrlEntered = false;
                    console.log('Problem opening CNV file: ' + buffer);
                }
                if (callback) {
                    callback(success);
                }
            })
        }
    }

    promiseVcfFilesSelected(fileSelection) {
        const me = this;

        return new Promise(function (resolve, reject) {
            me.sampleName = null;
            me.vcfData = null;

            if (fileSelection == null) {
                me.vcfFileOpened = false;
                me.vcfUrlEntered = false;
                me.getVcfRefName = null;
                me.isMultiSample = false;
                me.vcf.clearVcfFile();
                resolve();
            } else {
                me.vcf.openVcfFile(fileSelection,
                    function (success, message) {
                        if (me.lastVcfthis.alertify) {
                            me.lastVcfthis.alertify.dismiss();
                        }
                        if (success) {
                            me.vcfFileOpened = true;
                            me.vcfUrlEntered = false;
                            me.getVcfRefName = null;
                            me.isMultiSample = false;

                            // Get the sample names from the vcf header
                            me.vcf.getSampleNames(function (sampleNames) {
                                me.isMultiSample = sampleNames && sampleNames.length > 1 ? true : false;
                                resolve({'fileName': me.vcf.getVcfFile().name, 'sampleNames': sampleNames});
                            });
                        } else {

                            var msg = "<span style='font-size:18px'>" + message + "</span>";
                            this.alertify.set('notifier', 'position', 'top-right');
                            me.lastVcfthis.alertify = this.alertify.error(msg, 15);

                            reject(message);
                        }
                    });
            }


        });
    }

    clearVcf(cardIndex) {
        this.vcfData = null;
        this.vcfUrlEntered = false;
        this.vcfFileOpened = false;
        this.sampleName = null;
        this.globalApp.utility.removeUrl('sample' + cardIndex);
        this.globalApp.utility.removeUrl('vcf' + cardIndex);
        this.globalApp.utility.removeUrl('name' + cardIndex);
        this.vcf.clear();
    }

    // todo: this fxn signature changed
    clearBam(cardIndex, bamType) {
        if (bamType === this.globalApp.COVERAGE_TYPE) {
            this.coverageData = null;
            this.coverageUrlEntered = false;
            this.bam.clearCoverage();
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            this.rnaSeqData = null;
            this.rnaSeqUrlEntered = false;
            this.bam.clearRnaSeq();
        } else if (bamType === this.globalApp.ATACSEQ_TYPE) {
            this.atacSeqData = null;
            this.atacSeqUrlEntered = false;
            this.bam.clearAtacSeq();
        } else {
            this.coverageData = null;
            this.coverageUrlEntered = false;
            this.rnaSeqData = null;
            this.rnaSeqUrlEntered = false;
            this.atacSeqData = null;
            this.atacSeqUrlEntered = false
            this.bam.clearAll();
        }
        this.globalApp.utility.removeUrl(bamType + 'bam' + cardIndex);
    }

    // We've already checked urls, just fill in info
    onVcfUrlConfirmed(vcfUrl, tbiUrl, selectedSample) {
        this.vcfUrlEntered = true;
        this.vcf.setUrls(vcfUrl, tbiUrl);
        this.selectedSample = selectedSample;
    }

    onVcfUrlEntered(vcfUrl, tbiUrl, callback) {
        const me = this;
        let success = true;
        this.vcfData = null;
        this.sampleName = null;

        if (vcfUrl == null || vcfUrl === '') {
            this.vcfUrlEntered = false;
            this.vcf.clearVcfURL();
            success = false;
            if (callback) {
                callback(success)
            }
        } else {
            me.vcfUrlEntered = true;
            me.vcfFileOpened = false;
            me.getVcfRefName = null;
            me.isMultiSample = false;
            this.vcf.openVcfUrl(vcfUrl, tbiUrl, function (success, hdrBuild, errorMsg) {
                if (success) {
                    me.vcfUrlEntered = true;
                    me.vcfFileOpened = false;
                    me.getVcfRefName = null;
                    let build = '';

                    // if we couldn't determine build from header, try looking at chromosomes
                    if ((hdrBuild != null) && ((!hdrBuild.build) || hdrBuild.build === '')) {
                        me.vcf.getBuildFromChromosomes(vcfUrl, tbiUrl, function (success, chrBuild) {
                            build = chrBuild;
                            if (!success) {
                                console.log('Warning could not get build information from chromosome formatting.');
                            }

                            // Get the sample names from the vcf header
                            me.vcf.getSampleNames(function (sampleNames) {
                                me.isMultiSample = sampleNames && sampleNames.length > 1 ? true : false;
                                callback(success, sampleNames, build);
                            });
                        })
                    } else {
                        build = hdrBuild.build;

                        // Get the sample names from the vcf header
                        me.vcf.getSampleNames(function (sampleNames) {
                            me.isMultiSample = sampleNames && sampleNames.length > 1 ? true : false;
                            callback(success, sampleNames, build);
                        });
                    }
                } else {
                    me.vcfUrlEntered = false;
                    console.log("Problem opening vcf/tbi: " + errorMsg);
                    callback(success);
                }
            });
        }
    }

    onVcfFileEntered(vcfFile, tbiFile, callback) {
        const me = this;
        let success = true;
        this.vcfData = null;
        this.sampleName = null;

        if (vcfFile == null || vcfFile === '') {
            this.vcfFileOpened = false;
            this.vcf.clearVcfFile();
            success = false;
            if (callback) {
                callback(success)
            }
        } else {
            me.vcfFileOpened = true;
            me.vcfUrlEntered = false;
            me.getVcfRefName = null;
            me.isMultiSample = false;
            let fileSelection = {
                vcf: vcfFile,
                tbi: tbiFile
            };
            this.vcf.openVcfFile(fileSelection, function (urlObj) {
                if (urlObj) {
                    me.vcfUrlEntered = true;
                    me.vcfFileOpened = false;
                    me.getVcfRefName = null;
                    let build = '';


                    // if we couldn't determine build from header, try looking at chromosomes
                    if ((hdrBuild != null) && ((!hdrBuild.build) || hdrBuild.build === '')) {
                        me.vcf.getBuildFromChromosomes(me.vcf.vcfURL, me.vcf.tbiUrl, function (success, chrBuild) {
                            build = chrBuild;
                            if (!success) {
                                console.log('Warning could not get build information from chromosome formatting.');
                            }

                            // Get the sample names from the vcf header
                            me.vcf.getSampleNames(function (sampleNames) {
                                me.isMultiSample = sampleNames && sampleNames.length > 1 ? true : false;
                                callback(success, sampleNames, build);
                            });
                        })
                    } else {
                        build = hdrBuild != null ? hdrBuild.build : null;

                        // Get the sample names from the vcf header
                        me.vcf.getSampleNames(function (sampleNames) {
                            me.isMultiSample = sampleNames && sampleNames.length > 1 ? true : false;
                            callback(success, sampleNames, build);
                        });
                    }
                } else {
                    me.vcfUrlEntered = false;
                    console.log("Problem opening vcf/tbi: " + errorMsg);
                    callback(success);
                }
            });
        }
    }

    _promiseVcfRefName(ref) {
        const me = this;
        const theRef = ref != null ? ref : window.gene.chr;
        return new Promise(function (resolve, reject) {
            if (me.getVcfRefName != null) {
                // If we can't find the ref name in the lookup map, show a warning.
                if (me.vcfRefNamesMap[me.getVcfRefName(theRef)] == null) {
                    reject();
                } else {
                    resolve();
                }
            } else {
                me.vcfRefNamesMap = {};
                me.vcf.getReferenceLengths(function (refData) {
                    let foundRef = false;
                    refData.forEach(function (refObject) {
                        let refName = refObject.name;
                        if (refName === theRef) {
                            me.getVcfRefName = me._getRefName;
                            foundRef = true;
                        } else if (refName === me._stripRefName(theRef)) {
                            me.getVcfRefName = me._stripRefName;
                            foundRef = true;
                        }
                    });
                    // Load up a lookup table.  We will use me for validation when
                    // a new gene is loaded to make sure the ref exists.
                    if (foundRef) {
                        refData.forEach(function (refObject) {
                            var refName = refObject.name;
                            var theRefName = me.getVcfRefName(refName);
                            me.vcfRefNamesMap[theRefName] = refName;
                        });
                        resolve();
                    } else {
                        // If we didn't find the matching ref name, show a warning.
                        reject('Could not find matching ref in _promiseVcfRefName');
                    }

                });
            }
        });

    }

    promiseGetMatchingVariant(variant) {
        var me = this;
        return new Promise(function (resolve, reject) {
            me.promiseGetVcfData(window.gene, window.selectedTranscript)
                .then(function (data) {
                        var theVcfData = data.vcfData;
                        var matchingVariant = null;
                        if (theVcfData && theVcfData.features) {
                            theVcfData.features.forEach(function (v) {
                                if (v.start == variant.start
                                    && v.end == variant.end
                                    && v.ref == variant.ref
                                    && v.alt == variant.alt
                                    && v.type.toLowerCase() == variant.type.toLowerCase()) {
                                    matchingVariant = v;
                                }
                            });
                        }
                        resolve(matchingVariant);
                    },
                    function (error) {
                        var msg = "A problem occurred in SampleModel.promiseGetMatchingVariant(): " + error;
                        console.log(msg);
                        reject(msg);
                    })

        });
    }

    // A gene has been selected. Clear out the model's state in preparation for getting data.
    wipeGeneData() {
        this.vcfData = null;
        this.fbData = null;
        this.coverageData = null;
        this.rnaSeqData = null;
        this.atacSeqData = null;
    }

    /* Takes in a list of variants for which coverage is retrieved for, from a bam file.
     * Returns an array in the same sorted order. */
    promiseGetBamDepthForVariants(featureList, bamType, qualityCutoff) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (featureList.length === 0) {
                console.log('Warning: tried to get bam depth for empty feature list');
                resolve();
            }
            if (!self.bam) {
                reject("ERROR: trying to get coverage depth from sample that doesn't have a bam file.");
            }
            self.bam.getFilteredCoverageForRegion(featureList, bamType, qualityCutoff,
                function (countMap) {
                    if (countMap) {
                        resolve(countMap);
                    } else {
                        reject("Could not get coverage info for provided variant");
                    }
                });
        });
    }

    getBamDepth(gene, selectedTranscript, bamType, callbackDataLoaded) {
        const me = this;
        if (!this.isBamLoaded(bamType)) {
            if (callbackDataLoaded) {
                callbackDataLoaded();
            }
            return;
        }

        let performCallbackForCachedData = function (regions, theVcfData, coverageData) {
            if (regions.length > 0) {
                me._refreshVariantsWithCoverage(theVcfData, coverageData, function () {
                    if (callbackDataLoaded) {
                        callbackDataLoaded(coverageData);
                    }
                });
            } else {
                if (callbackDataLoaded) {
                    callbackDataLoaded(coverageData);
                }
            }
        };

        let performCallback = function (regions, theVcfData, coverageForRegion, coverageForPoints) {
            if (regions.length > 0) {
                me._refreshVariantsWithCoverage(theVcfData, coverageForPoints, function () {
                    if (callbackDataLoaded) {
                        callbackDataLoaded(coverageForRegion);
                    }
                });
            } else {
                if (callbackDataLoaded) {
                    callbackDataLoaded(coverageForRegion, CacheHelper.BAM_DATA);
                }
            }
        };

        // A gene has been selected.  Read the bam file to obtain
        // the read coverage.
        const refName = this.getBamRefName(gene.chr);
        this.promiseGetVcfData(gene, selectedTranscript)
            .then(function (data) {
                const theVcfData = data.vcfData;
                let regions = [];
                // We have variants, get the positions for each variant.  This will
                // be provided for the service to get coverage data so that specific
                // base coverage is also returned.
                if (theVcfData != null) {
                    me.flagDupStartPositions(theVcfData.features);
                    if (theVcfData) {
                        theVcfData.features.forEach(function (variant) {
                            if (!variant.dup) {
                                regions.push({name: refName, start: variant.start - 1, end: variant.start});
                            }
                        });
                    }
                }
                // Get the coverage data for the gene region
                // First the gene vcf data has been cached, just return
                // it.  (No need to retrieve the variants from the iobio service.)
                me._promiseGetData(CacheHelper.BAM_DATA, gene.gene_name)
                    .then(function (data) {
                        if (data != null && data !== '') {
                            me._setBamData(bamType, data);
                            performCallbackForCachedData(regions, theVcfData, data.coverage);
                        } else {
                            let data = {};
                            me.bam.getCoverageForRegion(refName, bamType, gene.start, gene.end, regions, 2000, me.globalApp.useServerCache,
                                function (coverageForRegion, coverageForPoints) {
                                    if (coverageForRegion != null) {
                                        data = {
                                            gene: gene.gene_name,
                                            ref: refName,
                                            start: gene.start,
                                            end: gene.end,
                                            coverage: coverageForRegion
                                        };
                                        me._setBamData(bamType, data);

                                        // Use browser cache for storage coverage data if app is not relying on
                                        // server-side cache
                                        let useBrowserCache = false;
                                        // todo: SJG not using cache currently
                                        if (!me.globalApp.useServerCache && useBrowserCache) {
                                            me._promiseCacheData(data, CacheHelper.BAM_DATA, gene.gene_name)
                                                .then(function () {
                                                    performCallback(regions, theVcfData, coverageForRegion, coverageForPoints);
                                                })
                                        } else {
                                            performCallback(regions, theVcfData, coverageForRegion, coverageForPoints);
                                        }
                                    } else {
                                        performCallback(regions, theVcfData, coverageForRegion, coverageForPoints);
                                    }

                                });
                        }

                    })
            })
    }

    /* Populates CNV data from raw file data */
    promiseInitCnvData() {
        const self = this;
        if (!self.cnvUrlEntered || !self.cnv) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            self.cnv.promiseParseCnvData()
                .then(() => {
                    resolve();
                }).catch(err => {
                    reject("Something went wrong populating cnv data: " + err);
            });
        });
    }

    /* Returns an object with the list of CNVs that occur within the boundaries of the provided gene, as well as a single merged continuous CNV. */
    promiseGetCnvRegions(theRegion, abnormalOnly, chromLevel) {
        const self = this;
        return new Promise((resolve) => {
            let cnvObj = self.cnv.findEntryByCoord(theRegion.chr, theRegion.start, theRegion.end, abnormalOnly, chromLevel);
            resolve(cnvObj);
        });
    }

    promiseAnnotated(theVcfData) {
        return new Promise(function (resolve, reject) {
            if (theVcfData != null &&
                theVcfData.features != null &&
                theVcfData.loadState != null &&
                theVcfData.loadState['clinvar'] === true) {
                resolve();
            } else {
                reject();
            }
        });
    }

    promiseAnnotatedAndCoverage(theVcfData) {
        const me = this;
        return new Promise(function (resolve, reject) {
            if (theVcfData != null &&
                theVcfData.features != null &&
                theVcfData.loadState != null &&
                (theVcfData.loadState['inheritance'] === true) &&
                theVcfData.loadState['clinvar'] === true &&
                (!me.isBamLoaded() || theVcfData.loadState['coverage'] === true)) {
                resolve();
            } else {
                reject();
            }
        });
    }

    // promiseGetVariantExtraAnnotations(theGene, theTranscript, variant, format, getHeader = false) {
    //     const me = this;
    //     return new Promise(function (resolve, reject) {
    //         // Create a gene object with start and end reduced to the variants coordinates.
    //         let fakeGeneObject = me.globalApp.$().extend({}, theGene);
    //         fakeGeneObject.start = variant.start;
    //         fakeGeneObject.end = variant.end;
    //
    //         if ((variant.fbCalled === 'Y' || variant.extraAnnot) && format !== "vcf") {
    //             // We already have the hgvs and rsid for this variant, so there is
    //             // no need to call the services again.  Just return the
    //             // variant.  However, if we are returning raw vcf records, the
    //             // services need to be called so that the info field is formatted
    //             // with all of the annotations.
    //             if (format && (format === 'csv' || format === 'json')) {
    //                 // Exporting data requires additional data to be returned to link
    //                 // the extra annotations back to the original bookmarked entries.
    //                 resolve([variant, variant, ""]);
    //             } else {
    //                 resolve(variant);
    //             }
    //         } else {
    //             me._promiseVcfRefName(theGene.chr).then(function () {
    //                 me.vcf.promiseGetVariants(
    //                     me.getVcfRefName(theGene.chr),
    //                     fakeGeneObject,
    //                     theTranscript,
    //                     null,   // regions
    //                     false,  // is multi-sample
    //                     me._getSamplesToRetrieve(),  // sample names
    //                     me.getAnnotationScheme().toLowerCase(), // annot scheme
    //                     me.getTranslator().clinvarMap,  // clinvar map
    //                     me.getGeneModel().geneSource === 'refseq',
    //                     true,  // hgvs notation
    //                     true,  // rsid
    //                     true, // vep af
    //                     me.globalApp.useServerCache, // serverside cache
    //                     me.id,
    //                     me.rnaSeqUrlEntered,
    //                     me.atacSeqUrlEntered
    //                 ).then(function (data) {
    //
    //                     var rawVcfRecords = data[0];
    //                     var vcfRecords = rawVcfRecords.filter(function (record) {
    //                         if (record.indexOf("#") === 0) {
    //                             if (getHeader) {
    //                                 return true;
    //                             } else {
    //                                 return false;
    //                             }
    //                         } else if (record !== "") {
    //                             var fields = record.split("\t");
    //                             var chrom = fields[0];
    //                             var start = fields[1];
    //                             var ref = fields[3];
    //                             var alt = fields[4];
    //                             var found = false;
    //                             alt.split(",").forEach(function (theAlt) {
    //                                 if (!found &&
    //                                     me.getVcfRefName(theGene.chr) === chrom &&
    //                                     start === variant.start &&
    //                                     theAlt === variant.alt &&
    //                                     ref === variant.ref) {
    //                                     found = true;
    //                                 }
    //                             });
    //                             return found;
    //                         }
    //                     });
    //                     let theVcfData = data[1];
    //                     if (theVcfData != null && theVcfData.features != null && theVcfData.features.length > 0) {
    //                         // Now update the hgvs notation on the variant
    //                         var matchingVariants = theVcfData.features.filter(function (aVariant) {
    //                             var matches =
    //                                 (variant.start === aVariant.start &&
    //                                     variant.alt === aVariant.alt &&
    //                                     variant.ref === aVariant.ref);
    //                             return matches;
    //                         });
    //                         if (matchingVariants.length > 0) {
    //                             var v = matchingVariants[0];
    //                             if (format && (format === 'csv' || format === 'json')) {
    //                                 resolve([v, variant, vcfRecords]);
    //                             } else if (format && format === 'vcf') {
    //                                 if (vcfRecords) {
    //                                     resolve([v, variant, vcfRecords]);
    //                                 } else {
    //                                     reject('Cannot find vcf record for variant ' + theGene.gene_name + " " + variant.start + " " + variant.ref + "->" + variant.alt);
    //                                 }
    //                             } else {
    //                                 me.promiseGetVcfData(theGene, theTranscript)
    //                                     .then(function (data) {
    //                                         var cachedVcfData = data.vcfData;
    //                                         var msg = '';
    //                                         if (cachedVcfData) {
    //                                             var theVariants = cachedVcfData.features.filter(function (d) {
    //                                                 if (d.start === v.start &&
    //                                                     d.alt === v.alt &&
    //                                                     d.ref === v.ref) {
    //                                                     return true;
    //                                                 } else {
    //                                                     return false;
    //                                                 }
    //                                             });
    //                                             if (theVariants && theVariants.length > 0) {
    //                                                 let theVariant = theVariants[0];
    //
    //                                                 // set the hgvs and rsid on the existing variant
    //                                                 theVariant.extraAnnot = true;
    //                                                 const vepAnnots = [
    //                                                     'vepConsequence',
    //                                                     'vepImpact',
    //                                                     'vepExon',
    //                                                     'vepHGVSc',
    //                                                     'vepHGVSp',
    //                                                     'vepAminoAcids',
    //                                                     'vepVariationIds',
    //                                                     'vepSIFT',
    //                                                     'vepPolyPhen',
    //                                                     'vepRegs',
    //                                                     'regulatory',
    //                                                     'vepAf',
    //                                                     'highestImpactVep',
    //                                                     'highestSIFT',
    //                                                     'highestPolyphen'
    //                                                 ];
    //                                                 vepAnnots.forEach(function (vepAnnot) {
    //                                                     theVariant[vepAnnot] = v[vepAnnot];
    //                                                 });
    //
    //                                                 // re-cache the data
    //                                                 me._promiseCacheData(cachedVcfData, CacheHelper.VCF_DATA, theGene.gene_name, theTranscript)
    //                                                     .then(function () {
    //                                                         // return the annotated variant
    //                                                         resolve(theVariant);
    //                                                     }, function (error) {
    //                                                         msg = "Problem caching data in SampleModel.promiseGetVariantExtraAnnotations(): " + error;
    //                                                         console.log(msg);
    //                                                         reject(msg);
    //                                                     });
    //                                             } else {
    //                                                 msg = "Cannot find corresponding variant to update HGVS notation for variant " + v.chrom + " " + v.start + " " + v.ref + "->" + v.alt;
    //                                                 console.log(msg);
    //                                                 reject(msg);
    //                                             }
    //                                         } else {
    //                                             msg = "Unable to update gene vcfData cache with updated HGVS notation for variant " + v.chrom + " " + v.start + " " + v.ref + "->" + v.alt;
    //                                             console.log(msg);
    //                                             reject(msg);
    //                                         }
    //                                     })
    //                             }
    //                         } else {
    //                             reject('Cannot find vcf record for variant ' + theGene.gene_name + " " + variant.start + " " + variant.ref + "->" + variant.alt);
    //                         }
    //                     } else {
    //                         const msg = "Empty results returned from SampleModel.promiseGetVariantExtraAnnotations() for variant " + variant.chrom + " " + variant.start + " " + variant.ref + "->" + variant.alt;
    //                         console.log(msg);
    //                         if (format === 'csv' || format === 'json' || format === 'vcf') {
    //                             resolve([variant, variant, []]);
    //                         }
    //                         reject(msg);
    //                     }
    //                 });
    //             });
    //         }
    //     });
    // }

    // promiseGetImpactfulVariantIds(theGeneObject, theTranscript) {
    //     var me = this;
    //
    //
    //     return new Promise(function (resolve, reject) {
    //
    //         var trRefName = null;
    //
    //         me._promiseVcfRefName(theGeneObject.chr)
    //             .then(function () {
    //                 trRefName = me.getVcfRefName(theGeneObject.chr);
    //
    //                 // Get the coords for variants of high or moder impact
    //                 return me.promiseGetVcfData(theGeneObject, theTranscript)
    //             })
    //             .then(function (data) {
    //                     var theVcfData = data.vcfData;
    //
    //                     var regions = theVcfData.features.filter(function (variant) {
    //                         if (variant.fbCalled == 'Y') {
    //                             return false;
    //                         } else if (variant.extraAnnot) {
    //                             return false;
    //                         } else {
    //                             return (variant.vepImpact['HIGH'] || variant.vepImpact['MODERATE']);
    //                         }
    //                     }).map(function (variant) {
    //                         return {name: trRefName, start: variant.start, end: variant.end};
    //                     })
    //
    //                     if (regions.length > 0) {
    //
    //                         me.vcf.promiseGetVariants(
    //                             trRefName,
    //                             theGeneObject,
    //                             theTranscript,
    //                             regions,   // regions
    //                             false,        // is multi-sample
    //                             me._getSamplesToRetrieve(),  // sample names
    //                             me.getAnnotationScheme().toLowerCase(), // annot scheme
    //                             me.getTranslator().clinvarMap,  // clinvar map
    //                             me.getGeneModel().geneSource == 'refseq' ? true : false,
    //                             true,  // hgvs notation
    //                             true,  // rsid
    //                             false, // vep af
    //                             me.globalApp.useServerCache, // serverside cache
    //                             me.id,
    //                             me.rnaSeqUrlEntered,
    //                             me.atacSeqUrlEntered
    //                         ).then(function (data) {
    //
    //                             var annotVcfData = data[1];
    //
    //                             if (annotVcfData != null && annotVcfData.features != null && annotVcfData.features.length > 0) {
    //                                 // refresh the variants with the variant ids
    //                                 me._refreshVariantsWithVariantIds(theVcfData, annotVcfData);
    //                                 me._promiseCacheData(theVcfData, CacheHelper.VCF_DATA, theGeneObject.gene_name, theTranscript)
    //                                     .then(function () {
    //                                             me.theVcfData = theVcfData;
    //                                             resolve(theVcfData.features);
    //                                         },
    //                                         function (error) {
    //                                             var msg = "Problem caching data in SampleModel.promiseGetImpactfulVariantIds(): " + error;
    //                                             console.log(msg);
    //                                             reject(msg);
    //                                         })
    //                             } else {
    //                                 var msg = "Empty results returned from SampleModel.promiseGetImpactfulVariantIds() for gene " + theGeneObject.gene_name;
    //                                 console.log(msg);
    //                                 reject(msg);
    //                             }
    //
    //                         });
    //
    //                     } else {
    //                         resolve(theVcfData.features);
    //                     }
    //
    //                 },
    //                 function (error) {
    //                     var msg = "A problem occurred in SampleModel.promiseGetImpactfulVariantIds(): " + error;
    //                     console.log(msg);
    //                     reject(msg);
    //                 })
    //
    //
    //     });
    // }

    /* Takes in a list of regions, calls 5 regions at a time to process.
     * regions may be an array of variant objects with properties name, start, and end
     * or an array of strings already preformatted for bcftools */
    promiseGetVariantIds(regions) {
        const self = this;
        const batchCount = 5;

        return new Promise((resolve, reject) => {
            let resultMap = {};
            let promises = [];

            for (let i = 0; i < regions.length; i += batchCount) {
                let regionBatch = regions.slice(i, Math.min((i + batchCount), regions.length));
                let varIdP = self.vcf.promiseGetVariantIds(regionBatch, 'COSMIC_ID')
                    .then(function (data) {
                        if (data) {
                            if (Object.keys(data).length === 0) {
                                let regionStr = '';
                                regionBatch.forEach(region => {
                                    regionStr += (region.name + ':' + region.start + '-' + region.end + ', ');
                                })
                                console.log('Warning: no cosmic variants found for the batch: ' + regionStr);
                            }
                            let modelKey = self.id + '-ids';
                            if (resultMap[modelKey]) {
                                let varObj = resultMap[modelKey];
                                for (var varId in data) {
                                    varObj[varId] = data[varId];
                                }
                            } else {
                                resultMap[self.id + '-ids'] = data;
                            }
                        } else {
                            reject('Warning: no result obtained from getting variant ids for ' + self.id);
                        }
                    }).catch(function (err) {
                    reject('Could not obtain variant ids for ' + self.id + ' because: ' + err);
                    });
                promises.push(varIdP);
            }
            Promise.all(promises)
                .then(() => {
                    resolve(resultMap);
                })
        });
    }

    // Returns all vcf data in multi-sample vcf, per track
    promiseGetAllVariants(theGene, theTranscript, isMultiSample, bcsqImpactMap) {
        const me = this;
        return new Promise(function (resolve, reject) {
            // First the gene vcf data has been cached, just return
            // it.  (No need to retrieve the variants from the iobio service.)
            let resultMap = {};
            me._promiseGetData(CacheHelper.VCF_DATA, theGene.gene_name, theTranscript)
                .then(function (vcfData) {
                    if (vcfData != null && vcfData !== '') {
                        resultMap = vcfData;
                        return resultMap;
                    } else {
                        me._promiseVcfRefName(theGene.chr)
                            .then(function () {
                                //let samplesInFile = me._getSamplesToRetrieve();
                                //function (refName, geneObject, selectedTranscript, regions, isMultiSample, selectedSamples, vepAf, somaticOnlyMode, bcsqImpactMap) {
                                return me.vcf.promiseGetVariants(
                                    me.getVcfRefName(theGene.chr),
                                    theGene,
                                    theTranscript,
                                    isMultiSample, // is multi-sample
                                    me.getCohortModel().selectedSamples,
                                    false,
                                    bcsqImpactMap
                                );
                            })
                            .then(data => {
                                resultMap = data[1];
                                resolve(resultMap);
                            }).catch(error => {
                            reject(error)
                        })
                    }
                });
        });
    }

    processVariants(results) {
        const me = this;
        if (results && results.length > 0) {
            // Base this off of ID
            let filtData = results.filter((item) => {
                return item.name === me.getSelectedSample();
            });

            if (filtData.length > 0) {
                filtData = filtData[0]
            } else {
                filtData = results[0];
            }

            // todo: no gene prop here
            let theGeneObject = me.getGeneModel().geneObjects[filtData.gene];
            if (theGeneObject) {

                var resultMap = {};
                var idx = 0;

                var postProcessNextVariantCard = function (idx, callback) {
                    if (idx === 1) {
                        if (callback) {
                            callback();
                        }
                    } else {
                        var theVcfData = results[idx];
                        if (theVcfData == null) {
                            if (callback) {
                                callback();
                            }
                            return;
                        }
                        theVcfData.gene = theGeneObject;
                        resultMap[me.id] = theVcfData;
                        me.vcfData = theVcfData;
                        idx++;
                        postProcessNextVariantCard(idx, callback);
                    }
                };

                postProcessNextVariantCard(idx, function () {
                    // Set the highest allele freq for all variants
                    for (var key in resultMap) {
                        var theVcfData = resultMap[key];
                        if (theVcfData && theVcfData.features) {
                            theVcfData.features.forEach(function (variant) {
                                me._determineHighestAf(variant);
                                me.variantIdHash[variant.id] = variant;
                            })
                        }
                    }
                });
            }
        }
    }

    promiseAnnotateVariants(theGene, theTranscript, sampleModels, isMultiSample, isBackground) {
        let me = this;

        return new Promise(function (resolve, reject) {
            // First the gene vcf data has been cached, just return
            // it.  (No need to retrieve the variants from the iobio service.)
            let resultMap = {};
            let promises = [];
            sampleModels.forEach(function (model) {
                let p = model._promiseGetData(CacheHelper.VCF_DATA, theGene.gene_name, theTranscript)
                    .then(function (vcfData) {
                        if (vcfData != null && vcfData !== '') {
                            resultMap[model.id] = vcfData;

                            if (!isBackground) {
                                model.vcfData = vcfData;
                                model.fbData = me.reconstituteFbData(vcfData);
                            }

                            // Populate hash table of variant IDs in this sample
                            vcfData.features.forEach((feat) => {
                                // Update ptCov props from marker values if we don't have this data
                                if (!me.rnaSeqUrlEntered) {
                                    feat.rnaSeqPtCov = 0;
                                }
                                if (!me.atacSeqUrlEntered) {
                                    feat.atacSeqPtCov = 0;
                                }
                                model.variantIdHash[feat.id] = feat;
                            });
                        }
                    });
                promises.push(p);
            });

            Promise.all(promises)
                .then(function () {
                        if (Object.keys(resultMap).length === sampleModels.length) {
                            resolve(resultMap);
                        } else {
                            // We don't have the variants for the gene in cache,
                            // so call the iobio services to retreive the variants for the gene region
                            // and annotate them.
                            me._promiseVcfRefName(theGene.chr)
                                .then(function () {
                                    let regions = me.getGeneModel().getFormattedGeneRegions({ 'gene' : theGene });
                                    return me.vcf.promiseAnnotateSomaticVariants('', me.cohortModel.selectedSamples, regions, false);
                                })
                                .then(function (data) {
                                        let results = data[1];

                                        if (!isMultiSample) {
                                            results = [results];
                                        }

                                        if (results && results.length > 0) {
                                            // Base this off of ID
                                            let filtData = results.filter((item) => {
                                                return item.name === me.getSelectedSample();
                                            });

                                            if (filtData.length > 0) {
                                                filtData = filtData[0]
                                            } else {
                                                filtData = results[0];
                                            }

                                            let theGeneObject = me.getGeneModel().geneObjects[filtData.gene];
                                            if (theGeneObject) {

                                                var resultMap = {};
                                                var idx = 0;

                                                var postProcessNextVariantCard = function (idx, callback) {
                                                    if (idx === sampleModels.length) {
                                                        if (callback) {
                                                            callback();
                                                        }
                                                        return;
                                                    } else {
                                                        var model = sampleModels[idx];
                                                        var theVcfData = results[idx];
                                                        if (theVcfData == null) {
                                                            if (callback) {
                                                                callback();
                                                            }
                                                            return;
                                                        }

                                                        theVcfData.gene = theGeneObject;
                                                        resultMap[model.id] = theVcfData;

                                                        if (!isBackground) {
                                                            model.vcfData = theVcfData;
                                                        }
                                                        idx++;
                                                        postProcessNextVariantCard(idx, callback);
                                                    }
                                                };

                                                postProcessNextVariantCard(idx, function () {
                                                    // Set the highest allele freq for all variants
                                                    for (var key in resultMap) {
                                                        var theVcfData = resultMap[key];
                                                        if (theVcfData && theVcfData.features) {
                                                            theVcfData.features.forEach(function (variant) {
                                                                me._determineHighestAf(variant);
                                                                me.variantIdHash[variant.id] = variant;
                                                            })
                                                        }
                                                    }
                                                    resolve(resultMap);
                                                });

                                            } else {
                                                let error = "ERROR - cannot locate gene object to match with vcf data " + data.ref + " " + data.start + "-" + data.end;
                                                console.log(error);
                                                reject(error);
                                            }
                                        } else {
                                            let error = "ERROR - empty vcf results for " + theGene.gene_name;
                                            console.log(error);
                                            reject(error);
                                        }


                                    },
                                    function (error) {
                                        reject("missing reference: " + error);
                                    });
                        }
                    },
                    function (error) {
                        reject(error);
                    });
        });
    }

    determineAffectedStatus(data, theGene, theTranscript, affectedInfo, callback) {
        var me = this;
        var promise = null;
        if (data != null) {
            promise = new Promise(function (resolve) {
                resolve(data);
            })
        } else {
            promise = me._promiseGetData(CacheHelper.VCF_DATA, theGene.gene_name, theTranscript);
        }

        var theVcfData = null;

        promise.then(function (data) {
                theVcfData = data;

                var affectedSibs = affectedInfo.filter(function (info) {
                    return info.status == 'affected' && info.relationship == 'sibling';
                })
                me._determineAffectedStatusImpl(theVcfData, 'affected', affectedSibs)

                var unaffectedSibs = affectedInfo.filter(function (info) {
                    return info.status == 'unaffected' && info.relationship == 'sibling';
                })
                me._determineAffectedStatusImpl(theVcfData, 'unaffected', unaffectedSibs)

                // For some reason, vcf data is reset to pre determineSibStatus unless we clear out vcfData
                // at this point
                //me.vcfData = null;

                if (callback) {
                    callback(theVcfData);
                }

            },
            function (error) {
                var msg = "An error occurred in SampleModel.determineAffectedStatus(): " + error;
                console.log(msg);
                if (callback) {
                    callback(null);
                }
            })


    }

    promiseDetermineCompoundHets(data, theGene, theTranscript) {
        var me = this;

        return new Promise(function (resolve, reject) {

            var dataPromise = null;
            if (data != null) {
                dataPromise = Promise.resolve(data);
            } else {
                dataPromise = me._promiseGetData(CacheHelper.VCF_DATA, theGene.gene_name, theTranscript);
            }

            dataPromise.then(function (data) {
                var theVcfData = data;
                var candidateVariants = {
                    'mother': [],
                    'father': []
                }

                theVcfData.features.forEach(function (variant) {
                    let passes = me.cohort.filterModel.determinePassCriteria('compoundHet', variant, {'ignore': ['inheritance']});
                    if (passes.all && variant.inheritance == 'none' && variant.zygosity && variant.zygosity.toUpperCase() != 'HOMREF') {
                        // Create a bag of candidate variants inherited from mother and another one for variants
                        // inherited by father
                        var fromMother = false;
                        if (variant.motherZygosity && (variant.motherZygosity.toLowerCase() == 'het' || variant.motherZygosity.toLowerCase() == 'hom')) {
                            fromMother = true;
                        }
                        var fromFather = false;
                        if (variant.fatherZygosity && (variant.fatherZygosity.toLowerCase() == 'het' || variant.fatherZygosity.toLowerCase() == 'hom')) {
                            fromFather = true;
                        }
                        if (fromMother && fromFather) {
                            // ignore variants that are inherited from both mom and dad
                        } else if (fromMother) {
                            candidateVariants.mother.push(variant);
                        } else if (fromFather) {
                            candidateVariants.father.push(variant);
                        }
                    }
                })


                // Associate all possible compoundHet variants with a variant
                for (var key in candidateVariants) {
                    var theVariants = candidateVariants[key];
                    theVariants.forEach(function (theVariant) {
                        for (var otherKey in candidateVariants) {
                            if (otherKey != key) {
                                var otherVariants = candidateVariants[otherKey];
                                otherVariants.forEach(function (otherVariant) {
                                    if (theVariant != otherVariant) {
                                        if (theVariant.compoundHets == null) {
                                            theVariant.compoundHets = [];
                                        }
                                        if (theVariant.inheritance == null || theVariant.inheritance == 'none') {
                                            theVariant.inheritance = 'compound het';
                                        }
                                        let proxyVariant = {
                                            chrom: otherVariant.chrom,
                                            start: otherVariant.start,
                                            ref: otherVariant.ref,
                                            alt: otherVariant.alt
                                        }
                                        theVariant.compoundHets.push(proxyVariant);
                                    }
                                })
                            }
                        }
                    })
                }

                resolve(theVcfData);


            })
                .catch(function (error) {
                    var msg = "An error occurred in SampleModel.determineCompoundHets(): " + error;
                    console.log(msg);
                    reject(msg);
                })
        })


    }


    // Assigns variant afFieldHighest field
    _determineHighestAf(variant) {
        var me = this;
        // Find the highest value (the least rare AF) betweem exac and 1000g to evaluate
        // as 'lowest' af for all variants in gene
        var afHighest = null;

        if (me.globalApp.useVEP) {
            if (me.globalApp.$.isNumeric(variant.afExAC) && me.globalApp.$.isNumeric(variant.af1000G)) {
                // Ignore exac n/a.  If exac is higher than 1000g, evaluate exac
                if (variant.afExAC > -100 && variant.afExAC >= variant.af1000G) {
                    variant.afFieldHighest = 'afExAC';
                } else {
                    variant.afFieldHighest = 'af1000G';
                }
            } else if (me.globalApp.$.isNumeric(variant.afExAC)) {
                variant.afFieldHighest = 'afExAC';

            } else if (me.globalApp.$.isNumeric(variant.af1000G)) {
                variant.afFieldHighest = 'af1000G';
            }
            afHighest = me.getHighestAf(variant);

            if (me.globalApp.vepAF) {
                if (me.globalApp.$.isNumeric(variant.vepAf.gnomAD.AF) && afHighest) {
                    if (variant.vepAf.gnomAD.AF >= afHighest) {
                        variant.afFieldHighest = 'afgnomAD';
                    }
                } else if (me.globalApp.$.isNumeric(variant.vepAf.gnomAD.AF)) {
                    variant.afFieldHighest = 'afgnomAD';
                }
            }
        }

        //

        variant.afHighest = me.getHighestAf(variant);
    }

    getHighestAf(variant) {
        if (variant.afFieldHighest) {
            var subfields = variant.afFieldHighest.split(".");
            var current = variant;
            subfields.forEach(function (subfield) {
                current = current[subfield];
            });
            return current;
        } else {
            return null;
        }
    }


    _determineAffectedStatusImpl(theVcfData, affectedStatus, affectedInfo) {
        theVcfData.features.forEach(function (variant) {
            SampleModel._determineAffectedStatusForVariant(variant, affectedStatus, affectedInfo);
        });
    }


    promiseIsCached(geneName, transcript) {
        var me = this;

        return new Promise(function (resolve, reject) {
            var key = me._getCacheKey(CacheHelper.VCF_DATA, geneName.toUpperCase(), transcript);
            me.getCacheHelper().promiseGetData(key)
                .then(function (data) {
                        resolve(data != null && data != "");
                    },
                    function (error) {
                        reject(error);
                    })

        })
    }

    promiseIsCachedAndInheritanceDetermined(geneObject, transcript, checkForCalledVariants) {
        var me = this;
        return new Promise(function (resolve, reject) {
            me._promiseGetData(CacheHelper.VCF_DATA, geneObject.gene_name, transcript)
                .then(function (theVcfData) {
                        me.promiseGetFbData(geneObject, transcript, true)
                            .then(function (data) {
                                var theFbData = data.fbData;
                                var vcfDataCached = theVcfData && theVcfData.loadState != null && (theVcfData.loadState['inheritance']);
                                resolve(vcfDataCached && (!checkForCalledVariants || (theFbData && theFbData.features)));
                            })
                    },
                    function (error) {
                        var msg = "A problem occurred in SampleModel.promiseIsCachedAndInheritanceDetermined(): " + error;
                        console.log(msg);
                        reject(msg);
                    });

        })
    }


    _getCacheKey(dataKind, geneName, transcript) {
        let me = this;
        return me.getCacheHelper().getCacheKey(
            {
                id: this.getId(),
                sample: (this.selectedSample != null ? this.selectedSample : "null"),
                gene: (geneName),
                transcript: (transcript != null ? transcript.transcript_id : "null"),
                annotationScheme: (me.getAnnotationScheme().toLowerCase()),
                dataKind: dataKind
            }
        );

    }

    promiseCacheDangerSummary(dangerSummary, geneName) {
        return this._promiseCacheData(dangerSummary, CacheHelper.DANGER_SUMMARY_DATA, geneName);
    }

    clearCacheItem(dataKind, geneName, transcript) {
        var me = this;
        var key = me._getCacheKey(dataKind, geneName, transcript);
        me.getCacheHelper().promiseRemoveCacheItem(dataKind, key);
    }

    /*
  pruneIntronVariants = function(data) {
    if (data.features.length > 500) {
      filterCard.setExonicOnlyFilter();
    } else {
      filterCard.setExonicOnlyFilter(false);
    }
  }
  */

    _getSamplesToRetrieve() {
        let me = this;
        let samplesToRetrieve = [];

        if (me.getVcfSampleName()) {
            samplesToRetrieve.push({
                vcfSampleName: me.getVcfSampleName(),
                sampleName: me.getSelectedSample()
            });

            // Include all of the sample names for the proband
            me.getAffectedInfo().forEach(function (info) {
                if (info.model == me) {
                    // ignore the affected info for this sample.  We already added it
                    // to the list of samples to retrieve

                } else if (info.model.getVcfSampleName() && me._otherSampleInThisVcf(info.model)) {
                    // If the 'other' sample exists in the sample multi-sample vcf as this sample,
                    // add it to the list of samples to retrieve.  For example, an affected sib could be in the
                    // mother's vcf file.   In this case, we will retreive both the mother and affected sib at
                    // the same time so we can obtain the genotype for the affected sib and sync up to the
                    // proband later (when inheritance is determined)
                    samplesToRetrieve.push({
                        vcfSampleName: info.model.getVcfSampleName(),
                        sampleName: info.model.getSelectedSample()
                    });
                }
            })
        } else {
            samplesToRetrieve.push({
                vcfSampleName: "",
                sampleName: me.getSelectedSample()
            });
        }
        return samplesToRetrieve;
    }

    /* Returns the index of this sample within the _getSamplesToRetrieve list. */
    _getSampleIndex(list) {
        let self = this;
        let idxCount = 0;
        let idx = list.filter((item) => {
            if (item.sampleName === self.getSelectedSample()) {
                return idxCount;
            } else {
                idxCount++;
            }
        });
        return idx[0];
    }

    _otherSampleInThisVcf(otherModel) {
        var me = this;
        var theVcfs = {};

        var pushVcfFile = function (model) {
            if (model.vcfUrlEntered) {
                let url = model.vcf.getVcfURL();
                // If we're working with pre-signed urls, we may have a different timestamp and accessId
                if (url.indexOf('?') > -1) {
                    url = url.substring(0, url.indexOf('?'));
                }
                theVcfs[url] = true;
            } else {
                theVcfs[model.vcf.getVcfFile().name] = true;
            }
        }

        pushVcfFile(me);
        pushVcfFile(otherModel);

        return Object.keys(theVcfs).length == 1;
    }


    _pileupVariants(features, start, end) {
        var me = this;
        var width = 1000;
        var theFeatures = features;
        theFeatures.forEach(function (v) {
            v.level = 0;
        });

        var featureWidth = me.isEduMode || me.isBasicMode ? me.globalApp.eduModeVariantSize : 4;
        var posToPixelFactor = Math.round((end - start) / width);
        var widthFactor = featureWidth + (me.isEduMode || me.isBasicMode ? me.globalApp.eduModeVariantSize * 2 : 4);
        var maxLevel = this.vcf.pileupVcfRecords(theFeatures, start, posToPixelFactor, widthFactor);
        if (maxLevel > 30) {
            for (var i = 1; i < posToPixelFactor; i++) {
                // TODO:  Devise a more sensible approach to setting the min width.  We want the
                // widest width possible without increasing the levels beyond 30.
                if (i > 4) {
                    featureWidth = 1;
                } else if (i > 3) {
                    featureWidth = 2;
                } else if (i > 2) {
                    featureWidth = 3;
                } else {
                    featureWidth = 4;
                }

                features.forEach(function (v) {
                    v.level = 0;
                });
                var factor = posToPixelFactor / (i * 2);
                maxLevel = me.vcf.pileupVcfRecords(theFeatures, start, factor, featureWidth + 1);
                if (maxLevel <= 50) {
                    i = posToPixelFactor;
                    break;
                }
            }
        }
        return {'maxLevel': maxLevel, 'featureWidth': featureWidth};
    }


    flagDupStartPositions(variants) {
        // Flag variants with same start position as this will throw off comparisons
        for (var i = 0; i < variants.length - 1; i++) {
            var variant = variants[i];
            var nextVariant = variants[i + 1];
            if (i == 0) {
                variant.dup = false;
            }
            nextVariant.dup = false;

            if (variant.start == nextVariant.start) {
                nextVariant.dup = true;
            }
        }

    }

    _refreshVariantsWithCoverage(theVcfData, coverage, callback) {
        var me = this;
        if (theVcfData == null || coverage == null) {
            callback();
        }
        var recs = theVcfData.features;

        me.flagDupStartPositions(recs);

        for (var vcfIter = 0, covIter = 0; vcfIter < recs.length; null) {
            // Bypass duplicates
            if (recs[vcfIter].dup) {
                recs[vcfIter].bamDepth = recs[vcfIter - 1].bamDepth;
                vcfIter++;
            }
            if (vcfIter < recs.length) {
                if (covIter >= coverage.length) {
                    recs[vcfIter].bamDepth = "";
                    vcfIter++;
                } else {
                    var coverageRow = coverage[covIter];
                    var coverageStart = coverageRow[0];
                    var coverageDepth = coverageRow[1];

                    // compare curr variant and curr coverage record
                    if (recs[vcfIter].start == coverageStart) {
                        recs[vcfIter].bamDepth = +coverageDepth;
                        vcfIter++;
                        covIter++;
                    } else if (recs[vcfIter].start < coverageStart) {
                        recs[vcfIter].bamDepth = "";
                        vcfIter++;
                    } else {
                        //console.log("no variant corresponds to coverage at " + coverageStart);
                        covIter++;
                    }

                }
            }

        }
        if (!theVcfData.hasOwnProperty('loadState')) {
            theVcfData.loadState = {};
        }
        theVcfData.loadState['coverage'] = true;
        callback();


    }

    _refreshVariantsWithVariantIds(theVcfData, annotatedVcfData) {
        if (theVcfData == null) {
            return;
        }
        var loadVariantIds = function (recs, annotedRecs) {
            for (var vcfIter = 0, annotIter = 0; vcfIter < recs.length && annotIter < annotedRecs.length; null) {

                var annotatedRec = annotedRecs[annotIter];

                // compare curr variant and curr clinVar record
                if (recs[vcfIter].start == +annotatedRec.start) {

                    // add clinVar info to variant if it matches
                    if (recs[vcfIter].alt == annotatedRec.alt &&
                        recs[vcfIter].ref == annotatedRec.ref) {

                        var variant = recs[vcfIter];

                        // set the hgvs and rsid on the existing variant
                        variant.extraAnnot = true;
                        variant.vepHGVSc = annotatedRec.vepHGVSc;
                        variant.vepHGVSp = annotatedRec.vepHGVSp;
                        variant.vepVariationIds = annotatedRec.vepVariationIds;

                        vcfIter++;
                        annotIter++;
                    } else {
                        // If clinvar entry didn't match the variant, figure out if the vcf
                        // iter (multiple vcf recs with same position as 1 clinvar rec) or
                        // the clinvar iter needs to be advanced (multiple clinvar recs with same
                        // position as 1 vcf rec)
                        if (vcfIter + 1 < recs.length && recs[vcfIter + 1].start == +annotatedRec.start) {
                            vcfIter++;
                        } else {
                            annotIter++;
                        }
                    }

                } else if (recs[vcfIter].start < +annotatedRec.start) {
                    vcfIter++;
                } else {
                    annotIter++;
                }
            }
        }

        // Load the clinvar info for the variants loaded from the vcf
        var sortedFeatures = theVcfData.features.sort(SampleModel.orderVariantsByPosition);
        var sortedAnnotVariants = annotatedVcfData.features.sort(SampleModel.orderVariantsByPosition);
        loadVariantIds(sortedFeatures, sortedAnnotVariants);
    }

    _refreshVariantsWithClinvarEutils(theVcfData, clinVars) {
        var me = this;
        var clinVarIds = clinVars.uids;
        if (theVcfData == null) {
            return;
        }

        var loadClinvarProperties = function (recs) {
            for (var vcfIter = 0, clinvarIter = 0; vcfIter < recs.length && clinvarIter < clinVarIds.length; null) {
                var uid = clinVarIds[clinvarIter];
                var clinVarStart = clinVars[uid].variation_set[0].variation_loc.filter(function (v) {
                    return v["assembly_name"] == me.getGenomeBuildHelper().getCurrentBuildName()
                })[0].start;
                var clinVarAlt = clinVars[uid].variation_set[0].variation_loc.filter(function (v) {
                    return v["assembly_name"] == me.getGenomeBuildHelper().getCurrentBuildName()
                })[0].alt;
                var clinVarRef = clinVars[uid].variation_set[0].variation_loc.filter(function (v) {
                    return v["assembly_name"] == me.getGenomeBuildHelper().getCurrentBuildName()
                })[0].ref;


                // compare curr variant and curr clinVar record
                if (recs[vcfIter].clinvarStart == clinVarStart) {
                    // add clinVar info to variant if it matches
                    if (recs[vcfIter].clinvarAlt == clinVarAlt &&
                        recs[vcfIter].clinvarRef == clinVarRef) {
                        me._addClinVarInfoToVariant(recs[vcfIter], clinVars[uid]);
                        vcfIter++;
                        clinvarIter++;
                    } else {
                        // If clinvar entry didn't match the variant, figure out if the vcf
                        // iter (multiple vcf recs with same position as 1 clinvar rec) or
                        // the clinvar iter needs to be advanced (multiple clinvar recs with same
                        // position as 1 vcf rec)
                        if (vcfIter + 1 < recs.length && recs[vcfIter + 1].clinvarStart == clinVarStart) {
                            vcfIter++;
                        } else {
                            clinvarIter++;
                        }
                    }
                } else if (recs[vcfIter].start < clinVarStart) {
                    vcfIter++;
                } else {
                    clinvarIter++;
                }
            }
        }

        // Load the clinvar info for the variants loaded from the vcf
        var sortedFeatures = theVcfData.features.sort(SampleModel.orderVariantsByPosition);
        loadClinvarProperties(sortedFeatures);

    }


    _refreshVariantsWithClinvarVCFRecs(theVcfData, clinvarVariants) {
        var me = this;
        if (theVcfData == null) {
            return;
        }


        var loadClinvarProperties = function (recs, clinvarRecs) {
            for (var vcfIter = 0, clinvarIter = 0; vcfIter < recs.length && clinvarIter < clinvarRecs.length; null) {

                var clinvarRec = clinvarRecs[clinvarIter];

                // compare curr variant and curr clinVar record
                if (recs[vcfIter].start == +clinvarRec.pos) {


                    // add clinVar info to variant if it matches
                    if (recs[vcfIter].alt == clinvarRec.alt &&
                        recs[vcfIter].ref == clinvarRec.ref) {
                        var variant = recs[vcfIter];

                        var result = me.vcf.parseClinvarInfo(clinvarRec.info, me.getTranslator().clinvarMap);
                        for (var key in result) {
                            variant[key] = result[key];
                        }

                        vcfIter++;
                        clinvarIter++;
                    } else {
                        // If clinvar entry didn't match the variant, figure out if the vcf
                        // iter (multiple vcf recs with same position as 1 clinvar rec) or
                        // the clinvar iter needs to be advanced (multiple clinvar recs with same
                        // position as 1 vcf rec)
                        if (vcfIter + 1 < recs.length && recs[vcfIter + 1].start == +clinvarRec.pos) {
                            vcfIter++;
                        } else {
                            clinvarIter++;
                        }
                    }

                } else if (recs[vcfIter].start < +clinvarRec.pos) {
                    vcfIter++;
                } else {
                    clinvarIter++;
                }
            }
        }

        // Load the clinvar info for the variants loaded from the vcf
        var sortedFeatures = theVcfData.features.sort(SampleModel.orderVariantsByPosition);
        var sortedClinvarVariants = clinvarVariants.sort(SampleModel.orderVariantsByPosition);
        loadClinvarProperties(sortedFeatures, sortedClinvarVariants);
    }


    _addClinVarInfoToVariant(variant, clinvar) {
        var me = this;
        variant.clinVarUid = clinvar.uid;

        if (!variant.clinVarAccession) {
            variant.clinVarAccession = clinvar.accession;
        }

        var clinSigObject = variant.clinVarClinicalSignificance;
        if (clinSigObject == null) {
            variant.clinVarClinicalSignificance = {"none": "0"};
        }

        var clinSigString = clinvar.clinical_significance.description;
        var clinSigTokens = clinSigString.split(", ");
        var idx = 0;
        clinSigTokens.forEach(function (clinSigToken) {
            if (clinSigToken != "") {
                // Replace space with underlink
                clinSigToken = clinSigToken.split(" ").join("_").toLowerCase();
                variant.clinVarClinicalSignificance[clinSigToken] = idx.toString();
                idx++;

                // Get the clinvar "classification" for the highest ranked clinvar
                // designation. (e.g. "pathogenic" trumps "benign");
                var mapEntry = me.getTranslator().clinvarMap[clinSigToken];
                if (mapEntry != null) {
                    if (variant.clinvarRank == null ||
                        mapEntry.value < variant.clinvarRank) {
                        variant.clinvarRank = mapEntry.value;
                        variant.clinvar = mapEntry.clazz;
                    }
                }
            }

        });


        var phenotype = variant.clinVarPhenotype;
        if (phenotype == null) {
            variant.clinVarPhenotype = {};
        }

        var phTokens = clinvar.trait_set.map(function (d) {
            return d.trait_name;
        }).join('; ');
        if (phTokens !== "") {
            var tokens = phTokens.split("; ");
            idx = 0;
            tokens.forEach(function (phToken) {
                // Replace space with underlink
                phToken = phToken.split(" ").join("_");
                variant.clinVarPhenotype[phToken.toLowerCase()] = idx.toString();
                idx++;
            });
        }
    }


    loadCalledTrioGenotypes(theVcfData, theFbData) {
        var me = this;

        theVcfData = theVcfData ? theVcfData : this.vcfData;
        if (theVcfData == null || theVcfData.features == null) {
            return;
        }
        theFbData = theFbData ? theFbData : this.fbData;


        var sourceVariants = theVcfData.features
            .filter(function (variant) {
                return variant.fbCalled == 'Y';
            })
            .reduce(function (object, variant) {
                var key = variant.type + " " + variant.start + " " + variant.ref + " " + variant.alt;
                object[key] = variant;
                return object;
            }, {});
        if (theFbData) {
            theFbData.features.forEach(function (fbVariant) {
                var key = fbVariant.type + " " + fbVariant.start + " " + fbVariant.ref + " " + fbVariant.alt;
                var source = sourceVariants[key];
                if (source) {
                    fbVariant.inheritance = source.inheritance;
                    fbVariant.genotypeRefCountMother = source.genotypeRefCountMother;
                    fbVariant.genotypeAltCountMother = source.genotypeAltCountMother;
                    fbVariant.genotypeDepthMother = source.genotypeDepthMother;
                    fbVariant.bamDepthMother = source.bamDepthMother;
                    fbVariant.genotypeRefCountFather = source.genotypeRefCountFather;
                    fbVariant.genotypeAltCountFather = source.genotypeAltCountFather;
                    fbVariant.genotypeDepthFather = source.genotypeDepthFather;
                    fbVariant.bamDepthFather = source.bamDepthFather;
                    fbVariant.fatherZygosity = source.fatherZygosity;
                    fbVariant.motherZygosity = source.motherZygosity;
                    fbVariant.uasibsZygosity = source.uasibsZygosity;
                    ['affected', 'unaffected']
                        .forEach(function (affectedStatus) {
                            ['summary', 'zygosity', 'genotypeAltCount', 'genotypeRefCount', 'genotypeDepth', 'bamDepth']
                                .forEach(function (field) {
                                    var attr = affectedStatus + "_" + field;
                                    fbVariant[attr] = source[attr];
                                })
                        })
                    if (me.relationship != 'proband') {
                        fbVariant.genotypeRefCountProband = source.genotypeRefCountProband;
                        fbVariant.genotypeAltCountProband = source.genotypeAltCountProband;
                        fbVariant.genotypeDepthProband = source.genotypeDepthProband;
                        fbVariant.probandZygosity = source.probandZygosity;
                    }
                }


            });


        }
    }


    isAlignmentsOnly() {
        return !this.isVcfReadyToLoad() && this.isBamLoaded();
    }

    /*
   *  For trios, mother and father vcf data cache was cleared out, so now
   *  we need to reconstruct vcf data to equal loaded variants + unique freebayes
   *  variants
   */
    addCalledVariantsToVcfData(theVcfData, theFbData) {
        const me = this;

        // Exit if there are no cached called variants
        if (theFbData == null || theFbData.features.length == 0) {
            return;
        }


        // We have to order the variants in both sets before comparing
        theVcfData.features = theVcfData.features.sort(SampleModel.orderVariantsByPosition);
        theFbData.features = theFbData.features.sort(SampleModel.orderVariantsByPosition);

        // We will call this multiple times, so clear out any called variants from the
        // vcf data to start fresh
        theVcfData.features = theVcfData.features.filter(function (d) {
            return !d.hasOwnProperty("fbCalled") || d.fbCalled != 'Y';
        })


        // Compare the variant sets, marking the variants as unique1 (only in vcf),
        // unique2 (only in freebayes set), or common (in both sets).
        if (me.isVcfLoaded()) {
            // Compare fb data to vcf data
            me.vcf.compareVcfRecords(theVcfData, theFbData);

            // Add unique freebayes variants to vcfData
            theFbData.features = theFbData.features.filter(function (d) {
                return d.consensus == 'unique2';
            });
        }


        // Add the unique freebayes variants to vcf data to include
        // in feature matrix
        theFbData.features.forEach(function (v) {
            var variantObject = me.globalApp.$.extend({}, v);
            theVcfData.features.push(variantObject);
            v.source = variantObject;
        });

        return theVcfData;
    }


    _determineUniqueFreebayesVariants(geneObject, theTranscript, theVcfData, theFbData) {
        var me = this;


        if (theVcfData == null) {
            theVcfData = me.vcfData;
        }
        if (theFbData == null) {
            theFbData = me.fbData;
        }


        // We have to order the variants in both sets before comparing
        theVcfData.features = theVcfData.features.sort(SampleModel.orderVariantsByPosition);
        theFbData.features = theFbData.features.sort(SampleModel.orderVariantsByPosition);

        // Compare the variant sets, marking the variants as unique1 (only in vcf),
        // unique2 (only in freebayes set), or common (in both sets).
        if (me.isVcfLoaded()) {
            // Compare fb data to vcf data
            me.vcf.compareVcfRecords(theVcfData, theFbData);

            // Add unique freebayes variants to vcfData
            theFbData.features = theFbData.features.filter(function (d) {
                return d.consensus == 'unique2';
            });
        }


        // Add the unique freebayes variants to vcf data to include
        // in feature matrix
        theFbData.features.forEach(function (v) {
            var variantObject = me.globalApp.$.extend({}, v);
            theVcfData.features.push(variantObject);
            v.source = variantObject;
        });
    }


    filterVariants(data, filterObject, start, end, bypassRangeFilter) {
        let me = this;

        if (data == null || data.features == null) {
            console.log("Empty data/features");
            return;
        }

        if (me.id === 'known-variants') {
            return me.filterKnownVariants(data, start, end, bypassRangeFilter);
        }


        let impactField = me.getAnnotationScheme().toLowerCase() === 'snpeff' ? 'impact' : me.globalApp.impactFieldToFilter;
        let effectField = me.getAnnotationScheme().toLowerCase() === 'snpeff' ? 'effect' : 'vepConsequence';

        // coverageMin is always an integer or NaN
        let coverageMin = filterObject.coverageMin;
        let intronsExcludedCount = 0;

        let affectedFilters = null;
        if (filterObject.tumorInfo) {
            affectedFilters = filterObject.tumorInfo.filter(function (info) {
                return info.filter;
            });
        } else {
            affectedFilters = {};
        }


        let filteredFeatures = data.features.filter(function (d) {

            let passAffectedStatus = true;
            if (me.getId() === 's0' && affectedFilters.length > 0) {
                affectedFilters.forEach(function (info) {
                    let genotype = d.genotypes[info.variantCard.getSelectedSample()];
                    let zygosity = genotype && genotype.zygosity ? genotype.zygosity : "gt_unknown";

                    if (info.status === 'affected') {
                        if (zygosity.toUpperCase() !== 'HET' && zygosity.toUpperCase() !== 'HOM') {
                            passAffectedStatus = false;
                        }
                    } else if (info.status === 'unaffected') {
                        if (zygosity.toUpperCase() === 'HET' || zygosity.toUpperCase() === 'HOM') {
                            passAffectedStatus = false;
                        }
                    }
                })
            }


            // We don't want to display homozygous reference variants in the variant chart
            // or feature matrix (but we want to keep it to show trio allele counts).
            let isHomRef = (d.zygosity != null && (d.zygosity.toLowerCase() === 'gt_unknown' || d.zygosity.toLowerCase() === 'homref')) ? true : false;
            let isGenotypeAbsent = d.genotype == null ? true : (d.genotype.absent ? d.genotype.absent : false);

            let meetsRegion = true;
            if (!bypassRangeFilter) {
                if (start != null && end != null) {
                    meetsRegion = (d.start >= start && d.start <= end);
                }
            }

            // Allele frequency Exac - Treat null and blank af as 0
            let variantAf = d.afHighest && d.afHighest !== "." ? d.afHighest : 0;
            let meetsAf = true;
            if (me.globalApp.$.isNumeric(filterObject.afMin) && me.globalApp.$.isNumeric(filterObject.afMax)) {
                meetsAf = (variantAf >= filterObject.afMin && variantAf <= filterObject.afMax);
            }

            let meetsLoadedVsCalled = false;
            if (filterObject.loadedVariants && filterObject.calledVariants) {
                meetsLoadedVsCalled = true;
            } else if (!filterObject.loadedVariants && !filterObject.calledVariants) {
                meetsLoadedVsCalled = true;
            } else if (filterObject.loadedVariants) {
                if (!d.hasOwnProperty("fbCalled") || d.fbCalled !== 'Y') {
                    meetsLoadedVsCalled = true;
                }
            } else if (filterObject.calledVariants) {
                if (d.hasOwnProperty("fbCalled") && d.fbCalled === 'Y') {
                    meetsLoadedVsCalled = true;
                }
            }

            let meetsExonic = false;
            if (filterObject.exonicOnly) {
                for (var key in d[impactField]) {
                    if (key.toLowerCase() === 'high' || key.toLowerCase() === 'moderate') {
                        meetsExonic = true;
                    }
                }
                if (!meetsExonic) {
                    for (var keyE in d[effectField]) {
                        if (keyE.toLowerCase() !== 'intron_variant' && keyE.toLowerCase() !== 'intron variant' && keyE.toLowerCase() !== "intron") {
                            meetsExonic = true;
                        }
                    }
                }
                if (!meetsExonic) {
                    intronsExcludedCount++;
                }
            } else {
                meetsExonic = true;
            }


            // Evaluate the coverage for the variant to see if it meets min.
            let meetsCoverage = true;
            if (coverageMin && coverageMin > 0) {
                if (me.globalApp.$.isNumeric(d.bamDepth)) {
                    meetsCoverage = d.bamDepth >= coverageMin;
                } else if (me.globalApp.$.isNumeric(d.genotypeDepth)) {
                    meetsCoverage = d.genotypeDepth >= coverageMin;
                }
            }

            let incrementEqualityCount = function (condition, counterObject) {
                let countAttribute = condition ? 'matchCount' : 'notMatchCount';
                counterObject[countAttribute]++;
            }
            // Iterate through the clicked annotations for each variant. The variant
            // needs to match
            // at least one of the selected values (e.g. HIGH or MODERATE for IMPACT)
            // for each annotation (e.g. IMPACT and ZYGOSITY) to be included.
            let evaluations = {};
            for (var keyA in filterObject.annotsToInclude) {
                var annot = filterObject.annotsToInclude[keyA];
                if (annot.state) {
                    var evalObject = evaluations[annot.key];
                    if (!evalObject) {
                        evalObject = {};
                        evaluations[annot.key] = evalObject;
                    }

                    var annotValue = d[annot.key] || '';

                    // Keep track of counts where critera should be true vs counts
                    // for critera that should be false.
                    //
                    // In the simplest case,
                    // the filter is evalated for equals, for example,
                    // clinvar == pathogenic or clinvar == likely pathogenic.
                    // In this case, if a variant's clinvar = pathogenic, the
                    // evaluations will look like this:
                    //  evalEquals: {matchCount: 1, notMatchCount: 0}
                    // When variant's clinvar = benign
                    //  evalEquals: {matchCount: 0, notMatchCount: 1}
                    //
                    // In a case where the filter is set to clinvar NOT EQUAL 'pathogenic'
                    // AND NOT EQUAL 'likely pathogenic'
                    // the evaluation will be true on if the variant's clinvar is NOT 'pathogenic'
                    // AND NOT 'likely pathogenic'
                    // When variant's clinvar is blank:
                    //  evalNotEquals: {matchCount: 0, notMatchCount: 2}
                    //
                    // If variant's clinvar is equal to pathogenic
                    //  evalNotEquals: {matchCount: 1, notMatchCount 1}
                    //
                    var evalKey = 'equals';
                    if (annot.hasOwnProperty("not") && annot.not) {
                        evalKey = 'notEquals';
                    }
                    if (!evalObject.hasOwnProperty(evalKey)) {
                        evalObject[evalKey] = {matchCount: 0, notMatchCount: 0};
                    }
                    var doesMatch = false;
                    if (me.globalApp.$.isPlainObject(annotValue)) {
                        for (var avKey in annotValue) {
                            doesMatch = avKey.toLowerCase() == annot.value.toLowerCase();
                            incrementEqualityCount(doesMatch, evalObject[evalKey])
                        }
                    } else {
                        doesMatch = annotValue.toLowerCase() == annot.value.toLowerCase();
                        incrementEqualityCount(doesMatch, evalObject[evalKey])
                    }
                }
            }

            // If zero annots to evaluate, the variant meets the criteria.
            // If annots are to be evaluated, the variant must match
            // at least one value for each annot to meet criteria
            let meetsAnnot = true;
            for (key in evaluations) {
                let evalObject = evaluations[key];

                // Bypass evaluation for non-proband on inheritance mode.  This only
                // applied to proband.
                if (key === 'inheritance' && me.getId() !== 's0') {
                    continue;
                }
                if (evalObject.hasOwnProperty("equals") && evalObject["equals"].matchCount === 0) {
                    meetsAnnot = false;
                    break;
                }
            }

            // For annotations set to 'not equal', any case where the annotation matches (matchCount > 0),
            // we set that the annotation critera was not met.  Example:  When filter is
            // clinvar 'not equal' pathogenic, and variant.clinvar == 'pathogenic' matchCount > 0,
            // so the variants does not meet the annotation criteria
            let meetsNotEqualAnnot = true;
            for (key in evaluations) {
                let evalObject = evaluations[key];

                // Bypass evaluation for non-proband on inheritance mode.  This only
                // applied to proband.
                if (key === 'inheritance' && me.getRelationship() !== 'proband') {
                    continue;
                }
                // Any case where the variant attribute matches value on a 'not equal' filter,
                // we have encountered a condition where the criteria is not met.
                if (evalObject.hasOwnProperty("notEquals") && evalObject["notEquals"].matchCount > 0) {
                    meetsNotEqualAnnot = false;
                    break;
                }
            }


            return (!isHomRef || isGenotypeAbsent) && meetsRegion && meetsAf && meetsCoverage && meetsAnnot && meetsNotEqualAnnot && meetsExonic && meetsLoadedVsCalled && passAffectedStatus;
        });


        let vcfDataFiltered = {
            intronsExcludedCount: intronsExcludedCount,
            end: end,
            features: filteredFeatures,
            name: data.name,
            start: start,
            strand: data.strand,
            variantRegionStart: start,
            genericAnnotators: data.genericAnnotators
        };
        return vcfDataFiltered;
    }

    filterKnownVariants(data, start, end, bypassRangeFilter, filterModel) {
        var theFilters = filterModel.getModelSpecificFilters('known-variants').filter(function (theFilter) {
            return theFilter.value == true;
        })

        var filteredVariants = data.features.filter(function (d) {

            var meetsRegion = true;
            if (!bypassRangeFilter) {
                if (start != null && end != null) {
                    meetsRegion = (d.start >= start && d.start <= end);
                }
            }

            let meetsFilter = true;
            if (theFilters.length > 0) {
                meetsFilter = false;
                theFilters.forEach(function (theFilter) {
                    if (d[theFilter.key] === theFilter.clazz) {
                        meetsFilter = true;
                    }
                });
            }

            return meetsRegion && meetsFilter;

        })

        var pileupObject = this._pileupVariants(filteredVariants, start, end);

        var vcfDataFiltered = {
            intronsExcludedCount: 0,
            end: end,
            features: filteredVariants,
            maxLevel: pileupObject.maxLevel + 1,
            featureWidth: pileupObject.featureWidth,
            name: data.name,
            start: start,
            strand: data.strand,
            variantRegionStart: start,
            genericAnnotators: data.genericAnnotators
        };
        return vcfDataFiltered;
    }


    classifyByImpact(d, annotationScheme, inTumorTrack, inKnownTrack, somaticOnlyMode, selectedTranscriptId) {
        let self = this;

        var impacts = "";
        var colorimpacts = "";
        var effects = "";
        var filterStatus = "";

        var transVarBcsq = '';
        if (annotationScheme === 'bcsq') {
            let trimmedTranscript = selectedTranscriptId.substring(0, selectedTranscriptId.indexOf('.'));
            transVarBcsq = d.bcsq[trimmedTranscript] ? d.bcsq[trimmedTranscript] : {};
        }

        let effectList = {};
        if (annotationScheme === 'vep') {
            effectList = d.vepConsequence;
        } else {
            // If we can't get the current transcript info (because it doesn't exist) color by highest impact from other transcript
            let type = transVarBcsq ? transVarBcsq['csqType'] : '';
            effectList[type] = type;
        }
        for (var key in effectList) {
            if (annotationScheme.toLowerCase() === 'vep' && key.indexOf("&") > 0) {
                var tokens = key.split("&");
                tokens.forEach(function (token) {
                    effects += " " + token;

                });
            } else {
                effects += " " + key;
            }
        }

        let impactList = {};
        if (annotationScheme === 'vep') {
            impactList = d[self.globalApp.impactFieldToFilter];
        } else {
            let impact = transVarBcsq.impact;
            if (impact) {
                impactList[impact] = impact;
            }
        }
        for (key in impactList) {
            impacts += " " + key;
        }

        if (d.isInherited != null && d.isInherited === false && inTumorTrack && !inKnownTrack && !somaticOnlyMode) {
            colorimpacts += " " + "impact_SOMATIC";
        } else {
            let colorImpactList = {};
            if (annotationScheme === 'vep') {
                colorImpactList = d[self.globalApp.impactFieldToColor];
            } else {
                let impact = (transVarBcsq && transVarBcsq.impact) ? transVarBcsq.impact : '';
                if (impact !== '') {
                    colorImpactList[impact] = impact;
                }
            }
            for (key in colorImpactList) {
                colorimpacts += " " + 'impact_' + key;
            }
        }

        if (colorimpacts === "") {
            colorimpacts = "impact_none";
        }

        if (d.passesFilters) {
            filterStatus = "filtered";
        }

        return 'variant ' + d.type.toLowerCase() + ' ' + d.zygosity.toLowerCase() + ' ' + (d.inheritance ? d.inheritance.toLowerCase() : "") + ' ' + d.clinvar + ' ' + impacts + ' ' + effects + ' ' + d.consensus + ' ' + colorimpacts + ' ' + filterStatus;
    }

    promiseCompareVariants(theVcfData, compareAttribute, matchAttribute, matchFunction, noMatchFunction) {
        var me = this;

        return new Promise(function (resolve, reject) {
            if (me.vcfData == null) {
                me._promiseVcfRefName().then(function () {

                    me.vcf.promiseGetVariants(
                        me.getVcfRefName(window.gene.chr),
                        window.gene,
                        window.selectedTranscript,
                        null,     // regions
                        false,    // is multi-sample
                        me._getSamplesToRetrieve(),
                        me.getAnnotationScheme().toLowerCase(),
                        me.getTranslator().clinvarMap,
                        me.getGeneModel().geneSource === 'refseq' ? true : false)
                        .then(function (data) {

                            if (data != null && data.features != null) {
                                me.vcfData = data[1];

                                me.vcfData.features = me.vcfData.features.sort(SampleModel.orderVariantsByPosition);
                                me.vcfData.features.forEach(function (feature) {
                                    feature[compareAttribute] = '';
                                });
                                me.vcf.compareVcfRecords(theVcfData, me.vcfData, compareAttribute, matchFunction, noMatchFunction);
                                resolve();
                            } else {
                                var error = 'promiseCompareVariants() has null data returned from promiseGetVariants';
                                console.log(error);
                                reject(error);
                            }
                        }, function (error) {
                            var message = 'error occurred when getting variants in promiseCompareVariants: ' + error;
                            console.log(message);
                            reject(message);
                        });
                }, function (error) {
                    reject("missing reference: " + error);
                });

            } else {
                me.vcfData.features = me.vcfData.features.sort(SampleModel.orderVariantsByPosition);
                if (compareAttribute) {
                    me.vcfData.features.forEach(function (feature) {
                        feature[compareAttribute] = '';
                    });
                }
                me.vcf.compareVcfRecords(theVcfData, me.vcfData, compareAttribute, matchFunction, noMatchFunction);
                resolve();
            }

        });


    }

    classifyByClinvar(d) {
        return 'variant ' + d.type.toLowerCase() + ' ' + d.clinvar + ' colorby_' + d.clinvar;
    }


    // SJG TODO: ripped out cacheing for now
    // _promiseGetData(dataKind, geneName, transcript) {
    _promiseGetData() {
        // let me = this;
        return new Promise(function (resolve) {
            resolve();
            // if (geneName == null) {
            //     let msg = "SampleModel._promiseGetData(): empty gene name";
            //     console.log(msg);
            //     reject(msg);
            // } else {
            //     let key = me._getCacheKey(dataKind, geneName.toUpperCase(), transcript);
            //     me.getCacheHelper().promiseGetData(key)
            //         .then(function (data) {
            //                 resolve(data);
            //             },
            //             function (error) {
            //                 let msg = "An error occurred in SampleModel._promiseGetData(): " + error;
            //                 console.log(msg);
            //                 reject(msg);
            //             })
            // }
        })
    }

    _promiseCacheData(data, dataKind, geneName, transcript) {
        var me = this;
        return new Promise(function (resolve, reject) {
            var key = me._getCacheKey(dataKind, geneName.toUpperCase(), transcript);

            // In order to avoid circular references that cause vcfData.features
            // to have null elements, we just blank out the 'features' property
            // on every variant
            if (dataKind === 'vcfData' || dataKind === 'fbData') {
                if (data.features) {
                    data.features.forEach(function (f) {
                        delete f.features;
                    })
                }
            }

            me.getCacheHelper().promiseCacheData(key, data)
                .then(function () {
                        resolve();
                    },
                    function (error) {
                        CacheHelper.showError(key, error);
                        this.alertify.set('notifier', 'position', 'top-right');
                        this.alertify.error("Error occurred when compressing analyzed data before caching.", 15);
                        reject(error);
                    })
        })
    }

    getSampleNamesToGenotype() {
        var sampleNames = null;
        var me = this;
        if (this.getRelationship() === 'proband') {
            sampleNames = [];
            me.getAffectedInfo().forEach(function (info) {
                sampleNames.push(info.model.getSampleName());
            })
        }
        return sampleNames;
    }

    /*
     * HELPERS
     */
    _getRefName(refName) {
        return refName;
    }

    _stripRefName(refName) {
        var tokens = refName.split("chr");
        var strippedName = refName;
        if (tokens.length > 1) {
            strippedName = tokens[1];
        } else {
            tokens = refName.split("ch");
            if (tokens.length > 1) {
                strippedName = tokens[1];
            }
        }
        return strippedName;
    }

    _setBamData(bamType, data) {
        const me = this;
        if (bamType === this.globalApp.COVERAGE_TYPE) {
            me.coverageData = data;
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            me.rnaSeqData = data;
        } else {
            console.log('Could not assign bam data b/c type not coverage or rnaseq');
        }
    }

    getBamData(bamType) {
        const me = this;
        if (bamType === me.globalApp.COVERAGE_TYPE) {
            return me.coverageData;
        } else if (bamType === me.globalApp.RNASEQ_TYPE) {
            return me.rnaSeqData;
        } else {
            console.log('Could not get bam data b/c type not coverage or rnaseq');
        }
    }

    getResultType(bamType) {
        if (bamType === this.globalApp.COVERAGE_TYPE) {
            return 'coverage';
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            return 'rnaSeqCoverage';
        } else {
            // return 'atacSeqCoverage';
            return '';
        }
    }
}

SampleModel._summarizeDanger = function (geneName, theVcfData, options = {}, geneCoverageAll, filterModel, translator) {
    const me = this;
    var dangerCounts = me.globalApp.$().extend({}, options);
    dangerCounts.CONSEQUENCE = {};
    dangerCounts.IMPACT = {};
    dangerCounts.CLINVAR = {};
    dangerCounts.INHERITANCE = {};
    dangerCounts.AF = {};
    dangerCounts.featureCount = 0;
    dangerCounts.loadedCount = 0;
    dangerCounts.calledCount = 0;
    dangerCounts.harmfulVariantsInfo = [];
    dangerCounts.failedFilter = false;
    dangerCounts.geneName = geneName;

    SampleModel.summarizeDangerForGeneCoverage(dangerCounts, geneCoverageAll, filterModel);

    dangerCounts.badges = filterModel.flagVariants(theVcfData);

    if (theVcfData == null || theVcfData.features == null) {
        console.log("unable to summarize danger due to null data");
        dangerCounts.error = "unable to summarize danger due to null data";
        return dangerCounts;
    } else if (theVcfData.features.length === 0) {
        dangerCounts.failedFilter = filterModel.hasFilters();
        return dangerCounts;
    }

    var clinvarClasses = {};
    var impactClasses = {};
    var inheritanceClasses = {};
    var afClazz = null;
    var afField = null;
    var lowestAf = 999;
    dangerCounts.harmfulVariantsInfo = [];


    theVcfData.features.forEach(function (variant) {

        for (key in variant.highestImpactVep) {
            if (translator.impactMap.hasOwnProperty(key) && translator.impactMap[key].badge) {
                impactClasses[key] = impactClasses[key] || {};
                impactClasses[key][variant.type] = true; // key = consequence, value = transcript id
            }
        }

        for (key in variant.highestSIFT) {
            if (translator.siftMap.hasOwnProperty(key) && translator.siftMap[key].badge) {
                var clazz = translator.siftMap[key].clazz;
                dangerCounts.SIFT = {};
                dangerCounts.SIFT[clazz] = {};
                dangerCounts.SIFT[clazz][key] = variant.highestSIFT[key];
            }
        }

        for (key in variant.highestPolyphen) {
            if (translator.polyphenMap.hasOwnProperty(key) && translator.polyphenMap[key].badge) {
                clazz = translator.polyphenMap[key].clazz;
                dangerCounts.POLYPHEN = {};
                dangerCounts.POLYPHEN[clazz] = {};
                dangerCounts.POLYPHEN[clazz][key] = variant.highestPolyphen[key];
            }
        }

        if (variant.hasOwnProperty('clinvar')) {
            let clinvarEntry = null;
            let clinvarKey = null;
            for (var key in translator.clinvarMap) {
                var me = translator.clinvarMap[key];
                if (clinvarEntry == null && me.clazz == variant.clinvar) {
                    clinvarEntry = me;
                    clinvarKey = key;
                }
            }
            if (clinvarEntry && clinvarEntry.badge) {
                clinvarClasses[clinvarKey] = clinvarEntry;
            }
        }

        if (variant.inheritance && variant.inheritance !== 'none') {
            clazz = translator.inheritanceMap[variant.inheritance].clazz;
            inheritanceClasses[clazz] = variant.inheritance;
        }


        if (variant.afFieldHighest) {
            translator.afHighestMap.forEach(function (rangeEntry) {
                if (+variant.afHighest > rangeEntry.min && +variant.afHighest <= rangeEntry.max) {
                    if (rangeEntry.value < lowestAf) {
                        lowestAf = rangeEntry.value;
                        afClazz = rangeEntry.clazz;
                        afField = variant.afFieldHighest;
                    }
                }
            });
        }

        // Turn on flag for harmful variant if one is found
        if (variant.harmfulVariant) {
            dangerCounts.harmfulVariantsInfo.push(variant.harmfulVariant);
        }
    });

    var getLowestClinvarClazz = function (clazzes) {
        var lowestOrder = 9999;
        var lowestClazz = null;
        var dangerObject = null;
        for (var clazz in clazzes) {
            var object = clazzes[clazz];
            if (object.value < lowestOrder) {
                lowestOrder = object.value;
                lowestClazz = clazz;
            }
        }
        if (lowestClazz) {
            dangerObject = {};
            dangerObject[lowestClazz] = clazzes[lowestClazz];
        }
        return dangerObject;
    }

    var getLowestImpact = function (impactClasses) {
        var classes = ['HIGH', 'MODERATE', 'MODIFIER', 'LOW'];
        for (var i = 0; i < classes.length; i++) {
            var impactClass = classes[i];
            if (impactClasses[impactClass]) {
                var lowestImpact = {};
                lowestImpact[impactClass] = impactClasses[impactClass];
                return lowestImpact;
            }
        }
        return {};
    }

    var hvLevel = dangerCounts.harmfulVariantsInfo
        .map(d => d.level)
        .reduce((min, cur) => Math.min(min, cur), Infinity);
    dangerCounts.harmfulVariantsLevel = hvLevel == Infinity ? null : hvLevel;

    dangerCounts.IMPACT = getLowestImpact(impactClasses);
    dangerCounts.CLINVAR = getLowestClinvarClazz(clinvarClasses);
    dangerCounts.INHERITANCE = inheritanceClasses;

    var afSummaryObject = {};
    if (afClazz != null) {
        afSummaryObject[afClazz] = {field: afField, value: lowestAf};
    }
    dangerCounts.AF = afSummaryObject;

    dangerCounts.featureCount = theVcfData.features.length;
    dangerCounts.loadedCount = theVcfData.features.filter(function (d) {
        if (d.hasOwnProperty('zygosity') && d.zygosity != null) {
            return d.zygosity.toUpperCase() != 'HOMREF' && !d.hasOwnProperty("fbCalled") || d.fbCalled != 'Y';
        } else {
            return !d.hasOwnProperty("fbCalled") || d.fbCalled != 'Y';
        }
    }).length;
    dangerCounts.calledCount = theVcfData.features.filter(function (d) {
        if (d.hasOwnProperty('zygosity') && d.zygosity != null) {
            return d.zygosity.toUpperCase() != 'HOMREF' && d.hasOwnProperty("fbCalled") && d.fbCalled == 'Y';
        } else {
            return d.hasOwnProperty("fbCalled") && d.fbCalled == 'Y';
        }
    }).length;

    // Indicate if the gene pass the filter (if applicable)
    dangerCounts.failedFilter = filterModel.hasFilters() && dangerCounts.featureCount == 0;

    return dangerCounts;
}


SampleModel._determineAffectedStatusForVariant = function (variant, affectedStatus, affectedInfo) {
    var matchesCount = 0;
    var summaryField = affectedStatus + "_summary";

    variant[summaryField] = "none";

    affectedInfo.forEach(function (info) {
        var sampleName = info.model.getSampleName();
        var genotype = variant.genotypes[sampleName];

        if (genotype) {

            var zyg = genotype.zygosity ? genotype.zygosity : "none";
            if (zyg.toLowerCase() != 'none' && zyg.toLowerCase() != 'gt_unknown' && zyg.toLowerCase() != 'homref') {
                matchesCount++;
            }
        }
    });

    if (matchesCount > 0 && matchesCount == affectedInfo.length) {
        variant[summaryField] = "present_all";
    } else if (matchesCount > 0) {
        variant[summaryField] = "present_some"
    } else {
        variant[summaryField] = "present_none";
    }
};


SampleModel.summarizeDangerForGeneCoverage = function (dangerObject, geneCoverageAll, filterModel, clearOtherDanger = false, refreshOnly = false) {
    dangerObject.geneCoverageInfo = {};
    dangerObject.geneCoverageProblem = false;


    if (geneCoverageAll && Object.keys(geneCoverageAll).length > 0) {
        for (var relationship in geneCoverageAll) {
            var geneCoverage = geneCoverageAll[relationship];
            if (geneCoverage) {
                geneCoverage.forEach(function (gc) {
                    if (gc.region != 'NA') {
                        if (filterModel.isLowCoverage(gc)) {
                            dangerObject.geneCoverageProblem = true;


                            // build up the geneCoveragerInfo to show exon numbers with low coverage
                            // and for which samples
                            //   example:  {'Exon 1/10': {'proband'}, 'Exon 9/10': {'proband', 'mother'}}
                            var exon = null;
                            if (gc.exon_number) {
                                exon = +gc.exon_number.split("\/")[0];
                            } else {
                                exon = +gc.id;
                            }
                            if (dangerObject.geneCoverageInfo[exon] == null) {
                                dangerObject.geneCoverageInfo[exon] = {};
                            }
                            dangerObject.geneCoverageInfo[exon][relationship] = true;
                        }

                    }
                })
            }
        }

    }

    // When we are just showing gene badges for low coverage and not reporting on status of
    // filtered variants, clear out the all of the danger summary object related to variants
    if (clearOtherDanger) {
        dangerObject.CONSEQUENCE = {};
        dangerObject.IMPACT = {};
        dangerObject.CLINVAR = {};
        dangerObject.INHERITANCE = {};
        dangerObject.AF = {};
        dangerObject.featureCount = 0;
        dangerObject.loadedCount = 0;
        dangerObject.calledCount = 0;
        dangerObject.harmfulVariantsInfo = [];
        // If a gene filter is being applied (refreshOnly=false)
        // The app is applying the standard filter of 'has exon coverage problems', so
        // indicate that gene didn't pass filter if there is NOT a coverage problem
        dangerObject.failedFilter = refreshOnly ? false : !dangerObject.geneCoverageProblem;
    }

    return dangerObject;
}

SampleModel.summarizeError = function (theError) {
    var summaryObject = {};

    summaryObject.CONSEQUENCE = {};
    summaryObject.IMPACT = {};
    summaryObject.CLINVAR = {}
    summaryObject.INHERITANCE = {};
    summaryObject.ERROR = theError;
    summaryObject.featureCount = 0;

    return summaryObject;
};


SampleModel.calcMaxAlleleCount = function (theVcfData, maxAlleleCount = 0) {
    if (theVcfData && theVcfData.features) {
        theVcfData.features.forEach(function (theVariant) {
            if (theVariant.genotypeDepth) {
                if ((+theVariant.genotypeDepth) > maxAlleleCount) {
                    maxAlleleCount = +theVariant.genotypeDepth;
                }
            }
        })
    }
    return maxAlleleCount;
};


SampleModel.orderVariantsByPosition = function (a, b) {
    var refAltA = a.ref + "->" + a.alt;
    var refAltB = b.ref + "->" + b.alt;

    var chromA = a.chrom.indexOf("chr") == 0 ? a.chrom.split("chr")[1] : a.chrom;
    var chromB = b.chrom.indexOf("chr") == 0 ? b.chrom.split("chr")[1] : b.chrom;
    if (!chromA.startsWith('chr')) {
        chromA = chromA.charCodeAt(0);
    }
    if (!chromB.startsWith('chr')) {
        chromB = chromB.charCodeAt(0);
    }

    if (+chromA == +chromB) {
        if (a.start == b.start) {
            if (refAltA == refAltB) {
                return 0;
            } else if (refAltA < refAltB) {
                return -1;
            } else {
                return 1;
            }
        } else if (a.start < b.start) {
            return -1;
        } else {
            return 1;
        }
    } else {
        if (+chromA < +chromB) {
            return -1;
        } else if (+chromA > +chromB) {
            return 1;
        }
    }
};

SampleModel.orderVcfRecords = function (rec1, rec2) {
    const me = this;

    var fields1 = rec1.split("\t");
    var fields2 = rec2.split("\t");

    var chrom1 = fields1[0].indexOf("chr") == 0 ? fields1[0].split("chr")[1] : fields1[0];
    var chrom2 = fields2[0].indexOf("chr") == 0 ? fields2[0].split("chr")[1] : fields2[0];
    if (!me.globalApp.$.isNumeric(chrom1)) {
        chrom1 = chrom1.charCodeAt(0);
    }
    if (!me.globalApp.$.isNumeric(chrom2)) {
        chrom2 = chrom2.charCodeAt(0);
    }

    var start1 = +fields1[1];
    var start2 = +fields2[1];

    var refalt1 = fields1[3] + fields1[4];
    var refalt2 = fields2[3] + fields2[4];


    if (+chrom1 < +chrom2) {
        return -1;
    } else if (+chrom1 > +chrom2) {
        return 1;
    } else {
        if (+start1 < +start2) {
            return -1;
        } else if (+start1 > +start2) {
            return 1;
        } else {
            if (refalt1 > refalt2) {
                return -1;
            } else if (refalt1 > refalt2) {
                return 1;
            } else {
                return 0;
            }
        }
    }

}
export default SampleModel




