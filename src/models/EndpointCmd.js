import {Client} from 'iobio-api-client';

export default class EndpointCmd {

    constructor(globalApp, genomeBuildHelper, getHumanRefNamesFunc, backendUrl) {
        this.globalApp = globalApp;
        this.genomeBuildHelper = genomeBuildHelper;
        this.getHumanRefNames = getHumanRefNamesFunc;

        // talk to correct version of gru per integration
        if (backendUrl == null) {
            backendUrl = 'backend.iobio.io';
        }
        this.api = new Client(backendUrl, {secure: true});
        this.devApi = new Client('mosaic.chpc.utah.edu/gru-dev-9003/', {secure: true});
        this.gruBackend = true;
    }


    getVcfHeader(vcfUrl, tbiUrl) {
        return this.api.streamCommand('variantHeader', {url: vcfUrl, indexUrl: tbiUrl});
    }

    getVcfDepth(vcfUrl, tbiUrl) {
        if (!tbiUrl) {
            tbiUrl = vcfUrl + '.tbi';
        }
        return this.api.streamCommand('vcfReadDepth', {url: tbiUrl});
    }

    /* Returns only the columns of a VCF file which contain fields necessary to create a unique identifier for a variant.
     * Regions param must be an array of gene objects with refName, start, and end properties
     * NOTE: bcftools does not accept 'chr2' - must convert to just '2'
     * These include: POS, REF, ALT and INFO
     * Can be used when determining if a variant exists in two samples across VCF files, for instance.
     * Currently used in Oncogene for COSMIC comparison */
    getVariantIds(vcfSource, regions) {
        return this.api.streamCommand('getIdColumns', {vcfUrl: vcfSource.vcfUrl, regions});
    }

    // Return first non-header/column label line from vcf
    getFirstVcfEntry(vcfUrl, tbiUrl) {
        return this.api.streamCommand('getChromosomes', {url: vcfUrl, indexUrl: tbiUrl});
    }

    /* Returns somatic variants for the given selectedSamples and regions.
     * The somaticCriteria object contains filters for defining 'somaticness'/
     */
    annotateSomaticVariants(vcfSource, selectedSamples, geneRegions, somaticFilterPhrase) {
        const selectedSamplesStr = selectedSamples.join();
        const geneRegionsStr = geneRegions.join();
        const genomeBuildName = this.genomeBuildHelper.getCurrentBuildName();
        return this.api.streamCommand('annotateSomaticVariants',
                {
                    vcfUrl: vcfSource.vcfUrl,
                    selectedSamplesStr,
                    geneRegionsStr,
                    somaticFilterPhrase,
                    genomeBuildName
                });
    }

    promiseGetCnvData(cnvUrl) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.globalApp.$.ajax({
                url: cnvUrl,
                type: "GET",
                crossDomain: true,
                dataType: "text",
                success: function (res) {
                    if (res && res.length > 0) {
                        resolve(res);
                    } else {
                        reject("Empty results returned from promiseGetCnvData");
                    }
                },
                error: function (xhr, status, errorThrown) {
                    console.log("Error: " + errorThrown);
                    console.log("Status: " + status);
                    console.log(xhr);
                    reject("Error " + errorThrown + " occurred in promiseGetCnvData");
                }
            });
        })
    }

    annotateVariants(vcfSource, refName, regions, vcfSampleNames, annotationEngine, isRefSeq, hgvsNotation, getRsId, vepAF, useServerCache, serverCacheKey, sfariMode = false, gnomadUrl, gnomadRegionStr) {
        const refNames = this.getHumanRefNames(refName).split(" ");
        const genomeBuildName = this.genomeBuildHelper.getCurrentBuildName();
        const refFastaFile = this.genomeBuildHelper.getFastaPath(refName);

        return this.api.streamCommand('annotateVariants', {
            vcfUrl: vcfSource.vcfUrl,
            tbiUrl: vcfSource.tbiUrl,
            refNames,
            regions,
            vcfSampleNames: vcfSampleNames.split(','),
            refFastaFile,
            genomeBuildName,
            isRefSeq,
            hgvsNotation,
            getRsId,
            vepAF,
            sfariMode,
            vepREVELFile: this.globalApp.vepREVELFile,
            gnomadUrl: gnomadUrl ? gnomadUrl : '',
            gnomadRegionStr: gnomadRegionStr ? gnomadRegionStr : '',
        });
    }

    normalizeVariants(vcfUrl, tbiUrl, refName, regions) {
        let refFastaFile = this.genomeBuildHelper.getFastaPath(refName);
        let contigStr = "";
        this.getHumanRefNames(refName).split(" ").forEach(function (ref) {
            contigStr += "##contig=<ID=" + ref + ">\n";
        });
        return this.api.streamCommand('normalizeVariants', {
            vcfUrl,
            tbiUrl,
            refName,
            regions,
            contigStr,
            refFastaFile
        });
    }

    getCountsForGene(url, refName, geneObject, binLength, regions, annotationMode, requiresVepService = false) {
        let vepArgs = '';
        if (requiresVepService) {
            vepArgs += " --assembly " + this.genomeBuildHelper.getCurrentBuildName();
            vepArgs += " --format vcf";
            vepArgs += " --allele_number";
        }
        return this.api.streamCommand('clinvarCountsForGene', {
            clinvarUrl: url,
            region: {
                refName,
                start: geneObject.start,
                end: geneObject.end,
            },
            binLength,
            regions,
            annotationMode: annotationMode,
            requiresVepService: requiresVepService,
            vepArgs: vepArgs
        });
    }

    getBamHeader(bamUrl) {
        let params = {url: bamUrl};
        return this.api.streamCommand('alignmentHeader', params);
    }

    /* Returns an array of position: point coverage objects based on a python program by TDS.
     * If qualityCutoff is provided, only includes reads that meet or exceed that MAPQ value. */
    getBamCoverage(bamSource, refName, regionStart, regionEnd, regions, maxPoints, useServerCache, serverCacheKey, qualityCutoff) {
        const url = bamSource.bamUrl;
        const samtoolsRegion = {refName, start: regionStart, end: regionEnd};
        const indexUrl = bamSource.baiUrl;
        maxPoints = maxPoints ? maxPoints : 0;

        return this.api.streamCommand('alignmentCoverage', {
            url,
            indexUrl,
            samtoolsRegion,
            maxPoints,
            coverageRegions: regions,
            qualityCutoff

        });
    }

    /* Does a small check on both the bam and bai file. Notably, getting the bam header does not check bai. */
    checkBamBaiFiles(bamUrl, baiUrl, ref) {
        const url = bamUrl;
        const indexUrl = baiUrl;
        const region = ref + ':1-2';

        return this.api.streamCommand('checkBamBai', {
            url,
            indexUrl,
            region
        });
    }

    freebayesJointCall(bamSources, refName, regionStart, regionEnd, isRefSeq, fbArgs, vepAF, sampleNames) {
        const refFastaFile = this.genomeBuildHelper.getFastaPath(refName);
        const refNames = this.getHumanRefNames(refName).split(" ");
        const genomeBuildName = this.genomeBuildHelper.getCurrentBuildName();
        const clinvarUrl = this.globalApp.getClinvarUrl(genomeBuildName);

        return this.api.streamCommand('freebayesJointCall', {
            alignmentSources: bamSources,
            refFastaFile,
            region: {
                refName,
                start: regionStart,
                end: regionEnd,
            },
            fbArgs,
            refNames,
            genomeBuildName,
            vepREVELFile: this.globalApp.vepREVELFile,
            vepAF,
            isRefSeq,
            clinvarUrl,
            sampleNames,
        });
    }

    getGeneCoverage(bamSources, refName, geneName, regionStart, regionEnd, regions) {
        const url = bamSources[0].bamUrl;
        const indexUrl = bamSources[0].baiUrl;
        return this.api.streamCommand('geneCoverage', {
            url,
            indexUrl,
            refName,
            geneName,
            regionStart,
            regionEnd,
            regions
        });
    }

    // NOTE: this function has not been testing with the monolith backend as of Nov2019
    // Unaware if GRU has an endpoint for this - SJG
    _getBamRegions(bamSources, refName, regionStart, regionEnd) {
        const me = this;
        let regionArg = refName + ":" + regionStart + "-" + regionEnd;
        let bamCmds = [];
        bamSources.forEach(function (bamSource) {
            let samtools = bamSource.bamUrl != null ? me.IOBIO.samtoolsOnDemand : me.IOBIO.samtools;

            if (bamSource.bamUrl) {
                let args = ['view', '-b', '"' + bamSource.bamUrl + '"', regionArg];
                if (bamSource.baiUrl) {
                    args.push('"' + bamSource.baiUrl + '"');
                }
                let bamCmd = this.iobio.cmd(samtools, args, {
                    'urlparams': {'encoding': 'binary'},
                    ssl: me.globalApp.useSSL
                });
                bamCmds.push(bamCmd);

            } else {
                let args = ['view', '-b', bamSource.bamBlob];
                let bamCmd = this.iobio.cmd(samtools, args, {
                    'urlparams': {'encoding': 'binary'},
                    ssl: me.globalApp.useSSL
                });
                bamCmds.push(bamCmd);
            }

        });
        return bamCmds;
    }

    // NOTE: this function has not been testing with the monolith backend as of Nov2019
    // Unaware if GRU has an endpoint for this - SJG
    _getSuggestedVariants(refName, regionStart, regionEnd) {
        const me = this;

        // Create an iobio command get get the variants from clinvar for the region of the gene
        let regionParm = refName + ":" + regionStart + "-" + regionEnd;

        //var clinvarUrl = me.genomeBuildHelper.getBuildResource(me.genomeBuildHelper.RESOURCE_CLINVAR_VCF_FTP);
        let clinvarUrl = me.globalApp.getClinvarUrl(me.genomeBuildHelper.getCurrentBuildName());

        let tabixArgs = ['-h', clinvarUrl, regionParm];
        let cmd = this.iobio.cmd(me.IOBIO.tabix, tabixArgs, {ssl: me.globalApp.useSSL});

        cmd = cmd.pipe(me.IOBIO.vt, ['view', '-f', '\"INFO.CLNSIG=~\'5|4\'\"', '-'], {ssl: me.globalApp.useSSL});
        return cmd;
    }
}


