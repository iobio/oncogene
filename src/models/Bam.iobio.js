/* Utility class to access bam files. Extends Thomas Down's bam.js work. */
export default class bamiobio {
    constructor(globalApp, endpoint) {
        this.globalApp = globalApp;
        this.endpoint = endpoint;
        this.sourceType = 'url';    // current version of oncogene only accepts urls

        // We may have multiple bam sources for oncogene
        this.coverageBam = null;
        this.coverageBai = null;
        this.coverageHeaderStr = '';
        this.coverageHeader = null;

        this.rnaSeqBam = null;
        this.rnaSeqBai = null;
        this.rnaSeqHeaderStr = '';
        this.rnaSeqHeader = null;

        this.atacSeqBam = null;
        this.atacSeqBai = null;
        this.atacSeqHeaderStr = '';
        this.atacSeqHeader = null;

        this.ignoreMessages = [
            /samtools\sError:\s.*:\sstderr\s-\s\[M::test_and_fetch\]\sdownloading\sfile\s.*\sto\slocal\sdirectory/
        ];
        this.errorMessageMap = {
            "samtools Could not load .bai": {
                regExp: /samtools\sError:\s.*:\sstderr\s-\sCould not load .bai.*/,
                message: "Unable to load the index (.bai) file, which has to exist in same directory and be given the same name as the .bam with the file extension of .bam.bai."
            },
            "samtools [E::hts_open]": {
                regExp: /samtools\sError:\s.*:\sstderr\s-\s\[E::hts_open\]\sfail\sto\sopen\sfile/,
                message: "Unable to access the file.  "
            },
            "samtools [E::hts_open_format]": {
                regExp: /samtools\sError:\s.*:\sstderr\s-\s\[E::hts_open_format\]\sfail\sto\sopen\sfile/,
                message: "Unable to access the file. "
            }
        };
        return this;
    }

    /*
     * GETTERS
     */
    getHeader(bamType, callback) {
        const me = this;
        let bamUrl = null;

        // Check if we have cached first
        if (bamType === this.globalApp.COVERAGE_TYPE) {
            if (this.coverageHeader) {
                callback(this.coverageHeader);
                return;
            } else {
                bamUrl = this.coverageBam;
            }
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            if (this.rnaSeqHeader) {
                callback(this.rnaSeqHeader);
                return;
            } else {
                bamUrl = this.rnaSeqBam;
            }
        } else if (bamType === this.globalApp.ATACSEQ_TYPE) {
            if (this.atacSeqHeader) {
                callback(this.atacSeqHeader);
                return;
            } else {
                bamUrl = this.atacSeqBam;
            }
        }

        // Otherwise go fetch
        const cmd = me.endpoint.getBamHeader(bamUrl);
        let rawHeader = "";
        cmd.on('data', function (data) {
            if (data != null) {
                rawHeader += data;
            }
        });
        cmd.on('end', function () {
            me.setHeader(rawHeader, bamType);
            if (bamType === me.globalApp.COVERAGE_TYPE) {
                callback(me.coverageHeader, bamType);
            } else if (bamType === me.globalApp.RNASEQ_TYPE) {
                callback(me.rnaSeqHeader, bamType);
            } else if (bamType === me.globalApp.ATACSEQ_TYPE) {
                callback(me.atacSeqHeader, bamType);
            } else {
                callback(null, bamType);
            }
        });
        cmd.on('error', function (error) {
            console.log(error);
        });
        cmd.run();
    }

    // todo: signature for this has changed (added bamType)
    getHeaderStr(bamType, callback) {
        const me = this;
        let existingHeaderStr = null;
        let bamUrl = null;

        if (bamType === this.globalApp.COVERAGE_TYPE) {
            existingHeaderStr = this.coverageHeaderStr;
            bamUrl = this.coverageBam;
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            existingHeaderStr = this.rnaSeqHeaderStr;
            bamUrl = this.rnaSeqBam;
        } else {
            existingHeaderStr = this.globalApp.atacSeqHeaderStr;
            bamUrl = this.atacSeqBam;
        }

        if (existingHeaderStr) {
            callback(existingHeaderStr);
        } else {
            const cmd = me.endpoint.getBamHeader(bamUrl);
            let rawHeader = "";
            cmd.on('data', function(data) {
                if (data != null) {
                    rawHeader += data;
                }
            });
            cmd.on('end', function() {
                me.setHeader(rawHeader);
                callback(existingHeaderStr);
            });
            cmd.on('error', function(error) {
                console.log(error);
            });
            cmd.run();
        }
    }

    getGeneCoverage(geneObject, transcript, bams, bamType, callback) {
        const me = this;
        const refName = geneObject.chr;
        const regionStart = geneObject.start;
        const regionEnd = geneObject.end;

        // Capture all of the exon regions from the transcript
        let regions = [];
        transcript.features.forEach(function (feature) {
            if (feature.feature_type.toUpperCase() === 'CDS') {
                regions.push({start: feature.start, end: feature.end});
            }
        });
        this._transformRefName(refName, bamType,function (trRefName) {
            let index = 0;
            let bamSources = [];
            // Note: leaving this PoC using the static def even though model relationship has changed
            me._initializeBamSource(bams, trRefName, regionStart, regionEnd, bamSources, index, function () {
                const cmd = me.endpoint.getGeneCoverage(bamSources, trRefName, geneObject.gene_name, regionStart, regionEnd, regions);
                let geneCoverageData = "";
                cmd.on('data', function (data) {
                    if (data == null) {
                        return;
                    }
                    geneCoverageData += data;
                });
                cmd.on('end', function () {
                    callback(geneCoverageData, trRefName, geneObject, transcript);
                });
                cmd.on('error', function (error) {
                    console.log(error);
                });
                cmd.run();
            });
        });
    }

    /*
    *  This method will return coverage as point data.  It takes the reference name along
    *  with the region start and end.  Optionally, the caller can provide an array of
    *  region objects to get the coverage at exact positions.  Also, this method takes an
    *  optional argument of maxPoints that will specify how many data points should be returned
    *  for the region.  If not specified, all data points are returned.  The callback method
    *  will send back to arrays; one for the coverage points, reduced down to the maxPoints, and
    *  the second for coverage of specific positions.  The latter can then be matched to vcf records
    *  , for example, to obtain the coverage for each variant.
    */
    getCoverageForRegion(refName, bamType, regionStart, regionEnd, regions, maxPoints, useServerCache, callback) {
        const me = this;

        this._transformRefName(refName, bamType, function (trRefName) {
            let bamSource = {};
            if (bamType === me.globalApp.COVERAGE_TYPE) {
                bamSource.bamUrl = me.coverageBam;
                bamSource.baiUrl = me.coverageBai;
            } else if (bamType === me.globalApp.RNASEQ_TYPE) {
                bamSource.bamUrl = me.rnaSeqBam;
                bamSource.baiUrl = me.rnaSeqBai;
            } else if (bamType === me.globalApp.ATACSEQ_TYPE) {
                bamSource.bamUrl = me.atacSeqBam;
                bamSource.baiUrl = me.atacSeqBai;
            } else {
                console.log("Need to provide bam type to getCoverageForRegion");
            }

            let serverCacheKey = me._getServerCacheKey("coverage", trRefName, regionStart, regionEnd, bamSource.bamUrl,{maxPoints: maxPoints});
            let cmd = me.endpoint.getBamCoverage(bamSource, trRefName, regionStart, regionEnd, regions, maxPoints, useServerCache, serverCacheKey);
            let samData = "";
            cmd.on('data', function (data) {
                if (data == null) {
                    return;
                }
                samData += data;
            });
            cmd.on('end', function () {
                if (samData !== "") {
                    let coverage = null;
                    let coverageForPoints = [];
                    let coverageForRegion = [];
                    let lines = samData.split('\n');
                    lines.forEach(function (line) {
                        if (line.indexOf("#specific_points") === 0) {
                            coverage = coverageForPoints;
                        } else if (line.indexOf("#reduced_points") === 0) {
                            coverage = coverageForRegion;
                        } else {
                            let fields = line.split('\t');
                            let pos = -1;
                            let depth = -1;
                            if (fields[0] != null && fields[0] !== '') {
                                pos = +fields[0];
                            }
                            if (fields[1] != null && fields[1] !== '') {
                                depth = +fields[1];
                            }
                            if (coverage) {
                                if (pos > -1 && depth > -1) {
                                    coverage.push([pos, depth]);
                                }
                            }
                        }
                    });
                    callback(coverageForRegion, coverageForPoints);
                }
            });
            cmd.on('error', function (error) {
                console.log(error);

            });
            cmd.run();
        });
    }

    /*
     * SETTERS
     */
    setCoverageBam(bamUrl, baiUrl) {
        this.coverageBam = bamUrl;
        this.coverageBai = baiUrl;
    }

    setRnaSeqBam(bamUrl, baiUrl) {
        this.rnaSeqBam = bamUrl;
        this.rnaSeqBai = baiUrl;
    }

    setAtacSeqBam(bamUrl, baiUrl) {
        this.atacSeqBam = bamUrl;
        this.atacSeqBai = baiUrl;
    }

    setHeader(headerStr, bamType) {
        let header = {sq: [], toStr: headerStr};
        const lines = headerStr.split("\n");
        for (var i = 0; i < lines.length > 0; i++) {
            const fields = lines[i].split("\t");
            if (fields[0] === "@SQ") {
                let fHash = {};
                fields.forEach(function (field) {
                    let values = field.split(':');
                    fHash[values[0]] = values[1]
                });
                header.sq.push({name: fHash["SN"], end: 1 + parseInt(fHash["LN"])});
                header.species = fHash["SP"];
                header.assembly = fHash["AS"];
            }
        }
        if (bamType === this.globalApp.COVERAGE_TYPE) {
            this.coverageHeaderStr = headerStr;
            this.coverageHeader = header;
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            this.rnaSeqHeaderStr = headerStr;
            this.rnaSeqHeader = header;
        } else {
            this.atacSeqHeaderStr = headerStr;
            this.atacSeqHeader = header;
        }
    }

    /*
     * OTHERS
     */

    /* Checks that both the bam and bai urls can be fetched. */
    checkBamBaiUrls(url, baiUrl, ref, callback) {
        const me = this;
        const cmd = this.endpoint.checkBamBaiFiles(url, baiUrl, ref);
        let success = null;
        cmd.on('data', function (data) {
            if (data != null && data !== '') {
                success = true;
            }
        });
        cmd.on('end', function () {
            if (success == null) {
                success = true;
            }
            if (success) {
                callback(success);
            }
        });
        cmd.on('error', function (error) {
            if (me._ignoreErrorMessage(error)) {
                success = true;
                callback(success)
            } else {
                success = false;
                callback(success, me._translateErrorMessage(error));
            }
        });
        cmd.run();
    }

    // todo: signature for this has changed (added bamType)
    freebayesJointCall(geneObject, transcript, bams, isRefSeq, fbArgs, vepAF, bamType, callback) {
        const me = this;
        const refName = geneObject.chr;
        const regionStart = geneObject.start;
        const regionEnd = geneObject.end;

        this._transformRefName(refName, bamType,function (trRefName) {
            //  Once all bam sources have been established
            let index = 0;
            let bamSources = [];
            me._initializeBamSource(bams, trRefName, regionStart, regionEnd, bamSources, index, bamType,function () {
                const cmd = me.endpoint.freebayesJointCall(bamSources, trRefName, regionStart, regionEnd, isRefSeq, fbArgs, vepAF);
                let variantData = "";
                cmd.on('data', function (data) {
                    if (data == null) {
                        return;
                    }
                    variantData += data;
                });
                cmd.on('end', function () {
                    callback(variantData, trRefName, geneObject, transcript);
                });
                cmd.on('error', function (error) {
                    console.log(error);
                });
                cmd.run();
            });
        });
    }

    reducePoints(data, factor, xvalue, yvalue) {
        if (!factor || factor <= 1) {
            return data;
        }
        let results = [];
        // Create a sliding window of averages
        for (var i = 0; i < data.length; i += factor) {
            // Slice from i to factor
            let avgWindow = data.slice(i, i + factor);
            let sum = 0;
            avgWindow.forEach(function (point) {
                let y = yvalue(point);
                if (y) {
                    sum += Math.round(y);
                }
            });
            let average = Math.round(sum / avgWindow.length);
            results.push([xvalue(data[i]), average])
        }
        return results;
    }

    clearAll() {
        this.clearCoverage();
        this.clearRnaSeq();
        this.clearAtacSeq();
    }

    clearCoverage() {
        this.coverageBam = null;
        this.coverageBai = null;
        this.coverageHeaderStr = null;
        this.coverageHeader = null;
    }

    clearRnaSeq() {
        this.rnaSeqBam = null;
        this.rnaSeqBai = null;
        this.rnaSeqHeaderStr = null;
        this.rnaSeqHeader = null;
    }

    clearAtacSeq() {
        this.atacSeqBam = null;
        this.atacSeqBai = null;
        this.atacSeqHeaderStr = null;
        this.atacSeqHeader= null;
    }


    /*
     * HELPERS
     */

    _transformRefName(refName, bamType, callback) {
        let found = false;
        this.getHeader(bamType, function (header) {
            header.sq.forEach(function (seq) {
                if (seq.name === refName || seq.name.split('chr')[1] === refName || seq.name === refName.split('chr')[1]) {
                    found = true;
                    callback(seq.name);
                }
            });
            if (!found) callback(refName); // not found
        })
    }

    _ignoreErrorMessage(error) {
        const me = this;
        let ignore = false;
        me.ignoreMessages.forEach(function (regExp) {
            if (error.match(regExp)) {
                ignore = true;
            }
        });
        return ignore;
    }

    _translateErrorMessage(error) {
        const me = this;
        let message = null;
        for (var key in me.errorMessageMap) {
            let errMsg = me.errorMessageMap[key];
            if (message == null && error.match(errMsg.regExp)) {
                message = errMsg.message;
            }
        }
        return message ? message : error;
    }

    // Sequentially examine each bam source, either specifying the bamUrl, or creating a blob (for local files)
    // todo: this function & PoC is super confusing - fix
    _initializeBamSource(bams, refName, regionStart, regionEnd, bamSources, idx, bamType, callback) {
        var me = this;
        if (idx === bams.length) {
            callback();
        } else {
            let bam = bams[idx];
            let bamSource = me._getBamData(bamType);
            if (bam.sourceType === "url") {
                bamSources.push({'bamUrl': bamSource.bamUrl, 'baiUrl': bamSource.baiUrl});
                idx++;
                me._initializeBamSource(bams, refName, regionStart, regionEnd, bamSources, idx, callback);
            } else {
                bam.convert('sam', refName, regionStart, regionEnd,
                    function (data, e) {
                        console.log(e);
                        var bamBlob = new Blob([bam.header.toStr + "\n" + data]);
                        bamSources.push({'bamBlob': bamBlob});
                        idx++;
                        me._initializeBamSource(bams, refName, regionStart, regionEnd, bamSources, idx, callback);
                    },
                    {noHeader: true}
                );
            }
        }
    }

    _getServerCacheKey(service, refName, start, end, bamUrl, miscObject) {
        let key = "backend.gene.iobio"
            //+ "-" + cacheHelper.launchTimestamp
            + "-" + bamUrl
            + "-" + service
            + "-" + refName
            + "-" + start.toString()
            + "-" + end.toString();
        if (miscObject) {
            for (var miscKey in miscObject) {
                key += "-" + miscKey + "=" + miscObject[miscKey];
            }
        }
        return key;
    }

    _getBamData(bamType) {
        let bamData = {};
        if (bamType === this.globalApp.COVERAGE_TYPE) {
            bamData['bamUrl'] = this.coverageBam;
            bamData['baiUrl'] = this.coverageBai;
        } else if (bamType === this.globalApp.RNASEQ_TYPE) {
            bamData['bamUrl'] = this.rnaSeqBam;
            bamData['baiUrl'] = this.rnaSeqBai;
        } else {
            bamData['bamUrl'] = this.atacSeqBam;
            bamData['baiUrl'] = this.atacSeqBai;
        }
        return bamData;
    }
}


