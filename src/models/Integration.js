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
                    // {
                    //      normal: {   vcf:
                    //                  tbi:
                    //                  coverageBam:
                    //                  coverageBai:
                    //                  cnv:
                    //                  rnaSeqBam:
                    //                  rnaSeqBai:
                    //                  },
                    //      t1: { ^^^ NO vcf/tbi }
                    // }
                    this.getMosaicIobioUrls((urlMap) => {
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
            //accessToken: this.config.params.access_token,
            //genes: this.config.params.genes, todo: get CM to get rid of this in launcher
            projectId: this.config.params.project_id,
            sampleId: this.config.params.sample_id, // aka normal sample
            somaticOnly: this.config.params.somatic_only,
            source: this.config.params.source,
            tumorSampleIds: this.config.params.tumor_sample_ids
        };
    }

    getMosaicIobioUrls(callback) {
        const self = this;
        let api = decodeURIComponent(this.config.params.source) + "/api/v1";
        let returnMap = {};

        const project_id = this.config.params.project_id;
        const access_token = this.config.params.access_token;
        const normal_id = this.config.params.sample_id;
        const token_type = this.config.params.token_type;

        // TODO: CONFIG IS PARSING THESE AS STRINGS NOT ARRAY
        // NEED TO FIX THIS IN Qs?
        let tumor_ids = [];
        debugger;
        if (this.config.params['tumor_sample_ids[0]']) {
            tumor_ids.push(this.config.params['tumor_sample_ids[0']);
        }
        if (this.config.params['tumor_sample_ids[1]']) {
            tumor_ids.push(this.config.params['tumor_sample_ids[1']);
        }
        if (this.config.params['tumor_sample_ids[2]']) {
            tumor_ids.push(this.config.params['tumor_sample_ids[2']);
        }
        if (this.config.params['tumor_sample_ids[3]']) {
            tumor_ids.push(this.config.params['tumor_sample_ids[3']);
        }
        if (this.config.params['tumor_sample_ids[4]']) {
            tumor_ids.push(this.config.params['tumor_sample_ids[4']);
        }


        if (access_token !== undefined) {
            localStorage.setItem('mosaic-iobio-tkn', token_type + ' ' + access_token);
        }
        if (localStorage.getItem('mosaic-iobio-tkn')) {

            // Get file urls for normal sample
            getFilesForSample(project_id, normal_id, self).done(data => {
                const vcf = data.data.filter(f => (f.type === 'vcf'))[0];
                const tbi = data.data.filter(f => (f.type === 'tbi'))[0];
                const bam = data.data.filter(f => (f.type === 'bam' || f.type === 'cram'))[0];
                const bai = data.data.filter(f => (f.type === 'bai' || f.type === 'crai'))[0];
                // todo: how do I pull out rnaseq bams from here instead of coverage bams?
                // todo: add in pulling facets data out

                getSignedUrlForFile(project_id, vcf, self).done(vcfUrlData => {
                    const vcfUrl = vcfUrlData.url;
                    getSignedUrlForFile(project_id, tbi, self).done(tbiUrlData => {
                        const tbiUrl = tbiUrlData.url;
                        getSignedUrlForFile(project_id, bam, self).done(bamUrlData => {
                            const bamUrl = bamUrlData.url;
                            getSignedUrlForFile(project_id, bai, self).done(baiUrlData => {
                                const baiUrl = baiUrlData.url;
                                returnMap['normal'] = { 'vcf': vcfUrl, 'tbi': tbiUrl, 'coverageBam': bamUrl, 'coverageBai': baiUrl}
                            })
                        })
                    })
                })
            })

            // Get file urls for tumor sample(s)
            let tumorNo = 1;
            tumor_ids.forEach(tumor_id => {
                getFilesForSample(project_id, tumor_id, self).done(data => {
                    const bam = data.data.filter(f => (f.type === 'bam' || f.type === 'cram'))[0];
                    const bai = data.data.filter(f => (f.type === 'bai' || f.type === 'crai'))[0];
                    // todo: how do I pull out rnaseq bams from here instead of coverage bams?
                    // todo: add in pulling facets data out

                    // Get Signed Url
                    getSignedUrlForFile(project_id, bam, self).done(bamUrlData => {
                        const bamUrl = bamUrlData.url;
                        getSignedUrlForFile(project_id, bai, self).done(baiUrlData => {
                            const baiUrl = baiUrlData.url;
                            returnMap[('t' + tumorNo)] = {'coverageBam': bamUrl, 'coverageBai': baiUrl}
                        })
                    })
                })
                tumorNo++;
            })
            callback(returnMap);

        } else {
            console.log("No access token detected");
            // todo: what package does this come from?
            //window.location.href = buildOauthLink();
        }

        function getFilesForSample(project_id, sample_id, self) {
            return self.globalApp.$.ajax({
                url: api + '/projects/' + project_id + '/samples/' + sample_id + '/files',
                type: 'GET',
                contentType: 'application/json',
                headers: {
                    'Authorization': localStorage.getItem('mosaic-iobio-tkn')
                }
            }).fail(function() {
                //let link = buildOauthLink(); todo: what package does this come from?
                let link = '';
                self.globalApp.$('#warning-authorize')
                    .append('Your access to hub.iobio has expired. Please click <a href='+link+'>here</a> to renew your access.')
                    .css('display', 'block');
            });
        }

        function getSignedUrlForFile (project_id, file, self) {
            return self.globalApp.$.ajax({
                url: api + '/projects/' + project_id + '/files/' + file.id + '/url',
                type: 'GET',
                contentType: 'application/json',
                headers: {
                    'Authorization': localStorage.getItem('mosaic-iobio-tkn')
                }
            });
        }
    }
}