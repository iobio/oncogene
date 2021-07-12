import { LaunchConfigManager } from 'iobio-launch';
const GALAXY = 'galaxy';

// Called when home component mounted
export function createIntegration(query) {
    if (query.source === GALAXY) {
        return new GalaxyIntegration(query);
    } else if (query.source && query.project_id && query.sample_id) {
        return new MosaicIntegration(query);
    } else {
        return new StandardIntegration(query);
    }
}

class Integration {
    constructor(query, configOpts) {
        this.query = query;
        configOpts = configOpts ? configOpts : {};
        if (process.env.VUE_APP_LOCAL_BACKEND === true) {
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
    constructor(query) {
        console.log('Galaxy mode detected');
        let configOpts = {
            configLocation: (process.env.VUE_APP_CONFIG_LOCATION ? process.env.VUE_APP_CONFIG_LOCATION : '/config.json')
        };
        super(query, configOpts);
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
    init() {
        const self = this;
        console.log('Mosaic mode detected');
        return this.configMan.getConfig().then(launchConfig => {
            self.config = launchConfig;

            return new Promise((resolve) => {
                const projectId = this.config.params.project_id;
                if (projectId) {
                    // todo: port for all file types after implemented on FS side
                    this.getMosaicIobioUrls((alignmentURL, alignmentIndexURL) => {
                        self.alignmentURL = alignmentURL;
                        self.alignmentIndexURL = alignmentIndexURL;
                        resolve(alignmentURL, alignmentIndexURL);
                    });
                }
            });
        });
    }

    buildParams() {
        return {
            backendUrl: this.config.backendUrl,
            // todo: determine what Mosaic will pass back to me - multiple urls? fetch a config like galaxy?
            // bam: this.alignmentURL,
            // bai: this.alignmentIndexURL,
            // region: this.config.params.region,
        };
    }

    buildQuery() {
        return {
            source: this.config.params.source,
            sample_id: this.config.params.sample_id,
            project_id: this.config.params.project_id,
            sampling: this.config.params.sampling,
            region: this.config.params.region,
            backend: this.config.params.backend,
            // todo: maybe add gene list here?
        };
    }

    getMosaicIobioUrls(callback) {
        const self = this;
        let api = decodeURIComponent(this.config.params.source) + "/api/v1";

        let project_id = this.config.params.project_id;
        let access_token = this.config.params.access_token;
        let sample_id = this.config.params.sample_id;
        let token_type = this.config.params.token_type;

        if (access_token !== undefined) {
            localStorage.setItem('hub-iobio-tkn', token_type + ' ' + access_token);
        }

        if (localStorage.getItem('hub-iobio-tkn')) {

            // Get VCF File
            getFilesForSample(sample_id).done(data => {
                // todo: parse out more parameters here - multiple bams, vcf, tbi, cnvs, etc
                const bam = data.data.filter(f => (f.type == 'bam' || f.type == 'cram'))[0];
                const bai = data.data.filter(f => (f.type == 'bai' || f.type == 'crai'))[0];

                // Get Signed Url
                // todo: get signed urls for all files
                getSignedUrlForFile(project_id, bam).done(bamUrlData => {
                    const bamUrl = bamUrlData.url;
                    getSignedUrlForFile(project_id, bai).done(baiUrlData => {
                        const baiUrl = baiUrlData.url;
                        callback(bamUrl, baiUrl);
                    })
                })
            })
        } else {
            // todo: what package does this come from?
            //window.location.href = buildOauthLink();
        }

        // todo: this may change - could be whole diff endpoint - talk to Chase
        function getFilesForSample(sample_id) {
            return this.$.ajax({
                url: api + '/samples/' + sample_id + '/files',
                type: 'GET',
                contentType: 'application/json',
                headers: {
                    'Authorization': localStorage.getItem('hub-iobio-tkn')
                }
            }).fail(function() {
                //let link = buildOauthLink(); todo: what package does this come from?
                let link = '';
                self.$('#warning-authorize')
                    .append('Your access to hub.iobio has expired. Please click <a href='+link+'>here</a> to renew your access.')
                    .css('display', 'block');
            });
        }

        function getSignedUrlForFile (project_id, file) {
            return this.$.ajax({
                // url: api + '/files/' + file.id + '/url',
                url: api + '/projects/' + project_id + '/files/' + file.id + '/url',
                type: 'GET',
                contentType: 'application/json',
                headers: {
                    'Authorization': localStorage.getItem('hub-iobio-tkn')
                }
            });
        }
    }
}