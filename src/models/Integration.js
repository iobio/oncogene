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
            self.vcf = self.config.params.vcfs[0];
            self.tbi = self.config.params.tbis[0];

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
            vcf: this.vcf,
            tbi: this.tbi,
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
                                    self.vcf = urlMap[sampleId].vcf;
                                    self.tbi = urlMap[sampleId].tbi;
                                    self.normal = Object.assign({}, urlMap[sampleId]);
                                    delete self.normal.vcf;
                                    delete self.normal.tbi;
                                } else {
                                    self.tumors.push(urlMap[sampleId]);
                                }
                            });
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
            vcf: this.vcf,
            tbi: this.tbi,
            normal: this.normal,
            tumors: this.tumors
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

            // todo: config is parsing these as strings rather than array - how to fix?
            let tumor_ids = [];
            if (self.config.params['tumor_sample_ids[0]']) {
                tumor_ids.push(self.config.params['tumor_sample_ids[0]']);
            }
            if (self.config.params['tumor_sample_ids[1]']) {
                tumor_ids.push(self.config.params['tumor_sample_ids[1]']);
            }
            if (self.config.params['tumor_sample_ids[2]']) {
                tumor_ids.push(self.config.params['tumor_sample_ids[2]']);
            }
            if (self.config.params['tumor_sample_ids[3]']) {
                tumor_ids.push(self.config.params['tumor_sample_ids[3]']);
            }
            if (self.config.params['tumor_sample_ids[4]']) {
                tumor_ids.push(self.config.params['tumor_sample_ids[4]']);
            }

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

export function promiseGetNormalSampleUrls(api, params, $) {
    const project_id = params.project_id;
    const normal_id = params.normal_id;
    return new Promise((resolve) => {
        // Get file urls for normal sample
        let returnMap = {};
        getFilesForSample(project_id, normal_id, api, $).done(data => {
            if (data.data) {
                const vcf = data.data.filter(f => (f.type === 'vcf'))[0];
                const tbi = data.data.filter(f => (f.type === 'tbi'))[0];
                const bam = data.data.filter(f => (f.type === 'bam' || f.type === 'cram'))[0];
                const bai = data.data.filter(f => (f.type === 'bai' || f.type === 'crai'))[0];
                // todo: how do I pull out rnaseq bams from here instead of coverage bams?
                // todo: add in pulling facets data out

                getSignedUrlForFile(project_id, vcf, api, $).done(vcfUrlData => {
                    const vcfUrl = vcfUrlData.url;
                    getSignedUrlForFile(project_id, tbi, api, $).done(tbiUrlData => {
                        const tbiUrl = tbiUrlData.url;
                        if (bam && bai) {
                            getSignedUrlForFile(project_id, bam, api, $).done(bamUrlData => {
                                const bamUrl = bamUrlData.url;
                                getSignedUrlForFile(project_id, bai, api, $).done(baiUrlData => {
                                    const baiUrl = baiUrlData.url;
                                    returnMap['normal'] = { 'vcf': vcfUrl, 'tbi': tbiUrl, 'coverageBam': bamUrl, 'coverageBai': baiUrl}
                                    resolve(returnMap);
                                })
                            })
                        } else {
                            console.log("No bam & bai files obtained for normal sample");
                            returnMap['normal'] = { 'vcf': vcfUrl, 'tbi': tbiUrl };
                            resolve(returnMap);
                        }
                    })
                })
            }
        })
    });
}

export function promiseGetTumorSampleUrls(api, params, $) {
    const project_id = params.project_id;
    let tumor_ids = params.tumor_ids;
    return new Promise((resolve) => {
        // Get file urls for tumor sample(s)
        let tumorNo = 1;
        let mosaicPs = [];
        let returnMap = {};
        tumor_ids.forEach(tumor_id => {
            let p = new Promise((innerResolve, innerReject) => {
                getFilesForSample(project_id, tumor_id, api, $).done(data => {
                    if (data.data) {
                        const bam = data.data.filter(f => (f.type === 'bam' || f.type === 'cram'))[0];
                        const bai = data.data.filter(f => (f.type === 'bai' || f.type === 'crai'))[0];
                        // todo: how do I pull out rnaseq bams from here instead of coverage bams?
                        // todo: add in pulling facets data out

                        // Get Signed Url
                        if (bam && bai) {
                            getSignedUrlForFile(project_id, bam, api, $).done(bamUrlData => {
                                const bamUrl = bamUrlData.url;
                                getSignedUrlForFile(project_id, bai, api, $).done(baiUrlData => {
                                    const baiUrl = baiUrlData.url;
                                    returnMap[('t' + tumorNo)] = {'coverageBam': bamUrl, 'coverageBai': baiUrl};
                                    innerResolve();
                                })
                            })
                        } else {
                            console.log("No bam & bai files for tumor " + tumorNo);
                            resolve(returnMap);
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