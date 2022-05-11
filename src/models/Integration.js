import { LaunchConfigManager } from 'iobio-launch';
const GALAXY = 'galaxy';

// Called when home component mounted
export function createIntegration(query, globalApp) {
    if (query.source === GALAXY) {
        return new GalaxyIntegration(query, globalApp);
    } else if (query.source && query.project_id && query.sample_id) {
        return new MosaicIntegration(query, globalApp);
    } else {
        return new StandardIntegration(query, globalApp);
    }
}

class Integration {
    constructor(query, configOpts, globalApp) {
        this.globalApp = globalApp;
        this.query = query;
        configOpts = configOpts ? configOpts : {};
        if (process.env.VUE_APP_LOCAL_BACKEND === 'true') {
            console.log('Using local backend');
            this.backend = window.location.origin + '/gru';
        }
        this.configMan = new LaunchConfigManager(configOpts);
    }
    getSource() {
        return this.query ? this.query.source : null;
    }
}

// Stand-alone launch or Galaxy (TBD)
class StandardIntegration extends Integration {
    init() {
        const self = this;
        return this.configMan.getConfig().then(launchConfig => {
            self.config = launchConfig;
        });
    }

    buildParams() {
        return Object.assign({
            backendUrl: this.backend ? this.backend : this.config.backendUrl,
        }, this.config.params);
    }

    buildQuery() {
        return Object.assign({}, this.query);
    }
}

class GalaxyIntegration extends Integration {
    constructor(query, globalApp) {
        console.log('Galaxy mode detected');
        let configOpts = {
            configLocation: (process.env.VUE_APP_CONFIG_LOCATION ? process.env.VUE_APP_CONFIG_LOCATION : '/config.json')
        };
        super(query, configOpts, globalApp);
    }

    init() {
        const self = this;
        return this.configMan.getConfig().then(launchConfig => {
            self.config = launchConfig;

            // Required params
            self.vcfs = self.config.params.vcfs;
            self.tbis = self.config.params.tbis;

            // todo: take this out of requirement! can just have vcf/tbi
            self.normal = self.config.params["0"];
            self.t1 = self.config.params["1"];
            if (self.vcf == null || self.tbi == null
                || self.normal == null || self.t1 == null) {
                console.log('ERROR: did not obtain required parameters from Galaxy configuration');
            }

            // Optional timepoints
            self.t2 = self.config.params["2"];
            self.t3 = self.config.params["3"];
            self.t4 = self.config.params["4"];
            self.t5 = self.config.params["5"];
        });
    }

    buildParams() {
        let tumors = [this.t1];
        if (this.t2) {
            tumors.push(this.t2);
        }
        if (this.t3) {
            tumors.push(this.t3);
        }
        if (this.t4) {
            tumors.push(this.t4);
        }
        if (this.t5) {
            tumors.push(this.t5);
        }

        return {
            backendUrl: this.backend ? this.backend : this.config.backendUrl,
            vcfs: this.vcfs,
            tbis: this.tbis,
            normal: this.normal,
            tumors: tumors
        };
    }

    buildQuery() {
        return {
            source: this.config.params.source,
            //project_id: this.config.params.project_id,
            // todo: whatever else info from galaxy that would be helpful
        };
    }
}

class MosaicIntegration extends Integration {
    constructor(query, globalApp) {
        console.log("Launch from Mosaic detected");
        super(query, {}, globalApp);
        this.NORMAL = 'normal';
    }

    init() {
        const self = this;
        return this.configMan.getConfig().then(launchConfig => {
            self.config = launchConfig;

            return new Promise((resolve, reject) => {
                const projectId = self.config.params.project_id;

                if (projectId) {
                    self.promiseGetMosaicIobioUrls()
                        .then(urlMap => {
                            self.tumors = [];
                            Object.keys(urlMap).forEach(sampleId => {
                                if (sampleId === self.NORMAL) {
                                    self.vcfs = urlMap[sampleId].vcfs;
                                    self.tbis = urlMap[sampleId].tbis;
                                    self.vcfFileNames = urlMap[sampleId].vcfFileNames;
                                    self.tbiFileNames = urlMap[sampleId].tbiFileNames;
                                    self.normal = Object.assign({}, urlMap[sampleId]);
                                } else {
                                    self.tumors.push(urlMap[sampleId]);
                                }
                            });
                            // todo: a better method is for Mosaic to provide samples in order specified
                            sortAlphaNum(self.tumors, self.globalApp._);
                            resolve();
                        });
                } else {
                    reject('Could not find necessary query arguments for Mosaic launch');
                }
            });
        });
    }

    buildParams() {
        return {
            backendUrl: this.backend ? this.backend : this.config.backendUrl,
            vcfs: this.vcfs,
            tbis: this.tbis,
            vcfFileNames: this.vcfFileNames,
            tbiFileNames: this.tbiFileNames,
            normal: this.normal,
            tumors: this.tumors,
            somaticOnly: this.config.params.somatic_only,
            genes: this.config.params.genes ? [this.config.params.genes.split(',')] : []
        };
    }

    buildQuery() {
        return {
            projectId: this.config.params.project_id,
            sampleId: this.config.params.sample_id, // aka normal sample
            somaticOnly: this.config.params.somatic_only,
            source: this.config.params.source,
            tumorSampleIds: this.config.params.tumor_sample_ids
        };
    }

    promiseGetMosaicIobioUrls() {
        const self = this;

        return new Promise((resolve, reject) => {
            const api = decodeURIComponent(self.config.params.source) + "/api/v1";
            const project_id = self.config.params.project_id;
            const normal_id = self.config.params.sample_id;
            let tumor_ids = self.config.params.tumor_sample_ids.split(',');

            let params = {
                project_id,
                normal_id,
                tumor_ids
            };
            let returnMap = {};

            if (localStorage.getItem('mosaic-iobio-tkn')) {
                promiseGetNormalSampleUrls(api, params, self.globalApp.$)
                    .then(normalMap => {
                        Object.keys(normalMap).forEach(key => {
                            returnMap[key] = normalMap[key];
                        })
                        promiseGetTumorSampleUrls(api, params, self.globalApp.$)
                            .then(tumorMap => {
                                Object.keys(tumorMap).forEach(key => {
                                    returnMap[key] = tumorMap[key];
                                })
                                updateVcfUrlsForTumors(returnMap);
                                resolve(returnMap);
                            }).catch(error => {
                                reject("Problem getting file info for tumor samples: " + error);
                            })
                    }).catch(error => {
                        reject("Problem getting file info for normal sample: " + error);
                })
            } else {
                reject("No access token detected");
                // todo: what package does this come from?
                //window.location.href = buildOauthLink();
            }
        });
    }
}

/* Returns object with one entry for a normal sample.
 * The entry contains presigned url for vcf/tbi files and
 * bam/bai files FOR COVERAGE ONLY FOR NOW (if they exist). */
export function promiseGetNormalSampleUrls(api, params, $) {
    const project_id = params.project_id;
    const normal_id = params.normal_id;
    return new Promise((resolve, reject) => {
        // Get file urls for normal sample
        let returnMap = {};
        getFilesForSample(project_id, normal_id, api, $).done(data => {
            if (data.data) {
                let vcfs = data.data.filter(f => (f.type === 'vcf'));
                let tbis = data.data.filter(f => (f.type === 'tbi'));
                const bam = data.data.filter(f => (f.type === 'bam' || f.type === 'cram'))[0];
                const bai = data.data.filter(f => (f.type === 'bai' || f.type === 'crai'))[0];
                // todo: see note about pulling out rnaseq/facets data below

                if (vcfs.length === 0) {
                    reject('No vcf file obtained from Mosaic launch');
                }
                if (vcfs.length !== tbis.length) {
                    reject('Did not obtain equal number of vcf and tbi files from Mosaic');
                }

                let urlPs = [];
                let vcfUrls = [];
                let tbiUrls = [];
                let selectedSamples = [];
                let vcfFileNames = [];
                let tbiFileNames = [];

                // get signed urls for each vcf associated with normal sample
                for (let i = 0; i < vcfs.length; i++) {
                    let vcf = vcfs[i];
                    let tbi = tbis[i];
                    let selectedSample = vcf.vcf_sample_name;
                    let vcfName = vcf.name;
                    let tbiName = tbi.name;

                    let p = new Promise(resolve => {
                        getSignedUrlForFile(project_id, vcf, api, $).done(vcfUrlData => {
                            const vcfUrl = vcfUrlData.url;
                            getSignedUrlForFile(project_id, tbi, api, $).done(tbiUrlData => {
                                const tbiUrl = tbiUrlData.url;
                                vcfUrls.push(vcfUrl);
                                tbiUrls.push(tbiUrl);
                                selectedSamples.push(selectedSample);
                                vcfFileNames.push(vcfName);
                                tbiFileNames.push(tbiName);
                                resolve();
                            })
                        })
                    });
                    urlPs.push(p);
                }
                Promise.all(urlPs)
                    .then(() => {
                        // Only one bam/bai for single normal sample
                        if (bam && bai) {
                            getSignedUrlForFile(project_id, bam, api, $).done(bamUrlData => {
                                const bamUrl = bamUrlData.url;
                                getSignedUrlForFile(project_id, bai, api, $).done(baiUrlData => {
                                    const baiUrl = baiUrlData.url;
                                    // todo: add rnaSeq, cnv here
                                    returnMap['normal'] = {
                                        'vcfs': vcfUrls,
                                        'tbis': tbiUrls,
                                        'coverageBam': bamUrl,
                                        'coverageBai': baiUrl,
                                        selectedSamples,
                                        vcfFileNames,
                                        tbiFileNames
                                    }
                                    resolve(returnMap);
                                })
                            })
                        } else {
                            console.log("No bam & bai files obtained for normal sample");
                            // todo: add rnaseq, cnv here
                            returnMap['normal'] = {'vcfs': vcfUrls, 'tbis': tbiUrls, selectedSamples, vcfFileNames, tbiFileNames};
                            resolve(returnMap);
                        }
                    })
            }
        })
    });
}

/* Returns object with one entry per tumor ID provided in params argument.
 * Each entry contains presigned url for bam/bai files FOR COVERAGE ONLY FOR NOW.
 * Does NOT assign any presigned url for vc/tbi files. */
export function promiseGetTumorSampleUrls(api, params, $) {

    // todo: left off here - need to merge normal/tumor fxns to add in calling multiple vcf mosaic calls here
    // todo: each vcf will have a different vcf_sample_name associated with the tumor sample, and need these
    // todo: to populate launchParam models for welcome cmpnt

    const project_id = params.project_id;
    let tumor_ids = params.tumor_ids;
    return new Promise((resolve) => {
        // Get file urls for tumor sample(s)
        let tumorNo = 1;
        let mosaicPs = [];
        let returnMap = {};
        tumor_ids.forEach(tumor_id => {
            let p = new Promise((innerResolve, innerReject) => {
                let localCount = tumorNo;
                getFilesForSample(project_id, tumor_id, api, $).done(data => {
                    if (data.data) {
                        const vcf = data.data.filter(f => (f.type === 'vcf'))[0];
                        const bam = data.data.filter(f => (f.type === 'bam' || f.type === 'cram'))[0];
                        const bai = data.data.filter(f => (f.type === 'bai' || f.type === 'crai'))[0];
                        // todo: how do I pull out rnaseq bams from here instead of coverage bams?
                        // update after talking w/ AW: will organize by experiment
                        // todo: add in pulling facets data out
                        // update after talking w/ AW: will have three dropdowns for launcher - coverage exp, rnaseq exp, facets exp

                        if (!vcf) {
                            innerReject('No vcf file obtained from Mosaic launch');
                        }
                        const selectedSample = vcf.vcf_sample_name;

                        // Get Signed Url
                        if (bam && bai) {
                            getSignedUrlForFile(project_id, bam, api, $).done(bamUrlData => {
                                const bamUrl = bamUrlData.url;
                                getSignedUrlForFile(project_id, bai, api, $).done(baiUrlData => {
                                    const baiUrl = baiUrlData.url;
                                    // todo: add rnaseq & cnv here
                                    returnMap[selectedSample] = {'coverageBam': bamUrl, 'coverageBai': baiUrl, selectedSamples: [selectedSample] };
                                    innerResolve();
                                })
                            })
                        } else {
                            console.log("No bam & bai files for tumor " + localCount);
                            // todo: add rnaseq & cnv here
                            returnMap[('t' + localCount)] = {'vcf': null, 'tbi': null};
                            innerResolve();
                        }
                    } else {
                        innerReject("Could not get file data from Mosaic");
                    }
                })
            });
            mosaicPs.push(p);
            tumorNo++;
        })
       Promise.all(mosaicPs).then(() => {
           resolve(returnMap);
       })
    });
}

export function getFilesForSample(project_id, sample_id, api, $) {
    return $.ajax({
        url: api + '/projects/' + project_id + '/samples/' + sample_id + '/files',
        type: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': localStorage.getItem('mosaic-iobio-tkn')
        }
    }).fail(function() {
        //let link = buildOauthLink(); todo: what package does this come from?
        let link = '';
        $('#warning-authorize')
            .append('Your access to mosaic.iobio has expired. Please click <a href='+link+'>here</a> to renew your access.')
            .css('display', 'block');
    });
}

export function getSignedUrlForFile (project_id, file, api, $) {
    return $.ajax({
        url: api + '/projects/' + project_id + '/files/' + file.id + '/url',
        type: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': localStorage.getItem('mosaic-iobio-tkn')
        }
    });
}

export function updateVcfUrlsForTumors(returnMap) {
    const normalObj = returnMap['normal'];
    if (!normalObj) {
        console.log('WARNING: no normal object to pull VCF/TBI urls from in Integration');
    }

    Object.keys(returnMap).forEach(sample => {
        if (sample !== 'normal') {
            let currObj = returnMap[sample];
            currObj['vcfs'] = normalObj['vcfs'];
            currObj['tbis'] = normalObj['tbis'];
        }
    })
}

export function sortAlphaNum(list, _) {
    //return list.sort(new Intl.Collator('en',{numeric:true, sensitivity:'accent'}).compare)
    const reA = /[^a-zA-Z]/g;
    const reN = /[^0-9]/g;

    let sortFxn = function(a, b) {
        let aA = _.replace(a.selectedSample, reA, "");
        let bA = _.replace(b.selectedSample, reA, "");
        if (aA === bA) {
            let aN = parseInt(_.replace(a.selectedSample, reN, ""), 10);
            let bN = parseInt(_.replace(b.selectedSample, reN, ""), 10);
            return aN === bN ? 0 : aN > bN ? 1 : -1;
        } else {
            return aA > bA ? 1 : -1;
        }
    }
    return list.sort(sortFxn);
}