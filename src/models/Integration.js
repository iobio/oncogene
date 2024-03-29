import {LaunchConfigManager} from 'iobio-launch';

const GALAXY = 'galaxy';
const FRAMESHIFT = 'frameshift';
const UTAH = 'utah';

// Called when home component mounted
export function createIntegration(query, globalApp) {
    if (query.source === GALAXY) {
        return new GalaxyIntegration(query, globalApp);
    } else if (query.source && query.project_id && query.sample_id) {
        return new MosaicIntegration(query, globalApp);
    } else {
        return new StandardIntegration(query, {}, globalApp);
    }
}

class Integration {
    constructor(query, configOpts, globalApp) {
        this.globalApp = globalApp;
        this.query = query;
        configOpts = configOpts ? configOpts : {};
        if (configOpts.useLocalBackend) {
            console.log('Using local backend');
            this.backend = window.location.origin + '/gru';
        }
        this.configMan = new LaunchConfigManager(configOpts);
        this.NORMAL = 'normal';
    }

    getSource() {
        return this.query ? this.query.source : null;
    }

    getBackend() {
        return (this.globalApp.GALAXY_TEST_MODE ? 'https://backend.iobio.io' : this.backend) + '/';
    }

    promiseGetMosaicIobioUrls(params) {
        const self = this;

        return new Promise((resolve, reject) => {
            const api = decodeURIComponent(params.source) + "/api/v1";
            const mosaic_distro = params.mosaic_distro;
            const project_id = params.project_id;
            const normal_id = params.sample_id;
            let tumor_ids = params.tumor_sample_ids.split(',');

            let passParams = {
                project_id,
                normal_id,
                tumor_ids
            };

            let token = '';
            if (mosaic_distro === FRAMESHIFT) {
                token = 'Bearer ' + process.env.VUE_APP_DEMO_TOKEN;
            } else if (mosaic_distro === UTAH) {
                token = localStorage.getItem('mosaic-iobio-tkn');
            } else {
                console.log("No mosaic distribution specified to get mosaic urls");
            }

            if (token) {
                promiseGetSampleUrls(api, token, passParams, self.globalApp.$)
                    .then(sampleMap => {
                        resolve(sampleMap);
                    }).catch(error => {
                    reject("Problem getting file info for sample: " + error);
                })
            } else {
                reject("No access token detected for Mosaic integration");
                // todo: what package does this come from?
                //window.location.href = buildOauthLink();
            }
        });
    }

    promiseGetDemoUrls() {
        const self = this;
        const cnvDemo = self.globalApp.useCnvDemo;

        return new Promise((resolve, reject) => {
            const projectId = cnvDemo? process.env.VUE_APP_CNV_DEMO_PROJECT_ID : process.env.VUE_APP_DEMO_PROJECT_ID;
            if (projectId) {
                let params = self.config.params;
                params['mosaic_distro'] = FRAMESHIFT;
                params.source = "https://mosaic.frameshift.io";
                params.project_id = projectId;
                // todo: put these in .env.local for now
                params.sample_id = cnvDemo ? "2843" : "2835";      // todo: add these as mosaic attributes or do getSamples call
                params.tumor_sample_ids = cnvDemo ? "2844,2847,2845,2846" : "2836,2837,2838,2839,2840";

                self.promiseGetMosaicIobioUrls(params)
                    .then(urlMap => {
                        self.tumors = [];
                        Object.keys(urlMap).forEach(sampleId => {
                            if (sampleId === self.NORMAL) {
                                self.vcfs = urlMap[sampleId].vcfs;
                                self.tbis = urlMap[sampleId].tbis;
                                self.normal = Object.assign({}, urlMap[sampleId]);
                            } else {
                                self.tumors.push(urlMap[sampleId]);
                            }
                        });
                        // todo: a better method is for Mosaic to provide samples in order specified
                        // todo: move this fxn into global
                        sortAlphaNum(self.tumors, self.globalApp._);
                        let demoParams = {
                            vcfs: this.vcfs,
                            tbis: this.tbis,
                            normal: this.normal,
                            tumors: this.tumors,
                            somaticOnly: true,  // todo: put this in as a Mosaic attribute
                            genes: "",          // todo: put this in as a Mosaic attribute
                        };
                        resolve(demoParams);
                    }).catch(err => {
                    reject("There was a problem getting demo data from Frameshift Mosaic: " + err);
                });
            } else {
                reject('Could not find necessary query arguments for Mosaic launch');
            }
        });
    }
}

// Stand-alone launch
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
            useLocalBackend: true
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

            if (self.vcfs == null || self.vcfs.length === 0
                || self.tbis == null || self.tbis.length === 0) {
                console.log('ERROR: did not obtain required parameters from Galaxy configuration');
                // todo: bubble up this error to user
            }

            // Galaxy passes optional data in json entries 0-5
            // If optional data types (bams/cnvs) not provided in config file,
            // we still need to make entries for those
            self.normal = self.config.params["0"];
            if (self.normal == null) {
                self.normal = {'vcfs': self.vcfs, 'tbis': self.tbis};
            }
            self.t1 = self.config.params["1"];
            if (self.t1 == null) {
                self.t1 = {'vcfs': self.vcfs, 'tbis': self.tbis};
            }

            // Check for other optional tumor samples
            self.t2 = self.config.params["2"];
            self.t3 = self.config.params["3"];
            self.t4 = self.config.params["4"];
            self.t5 = self.config.params["5"];

            self.tumors = [self.t1];
            if (self.t2) {
                self.tumors.push(self.t2);
            }
            if (self.t3) {
                self.tumors.push(self.t3);
            }
            if (self.t4) {
                self.tumors.push(self.t4);
            }
            if (self.t5) {
                self.tumors.push(self.t5);
            }
        });
    }

    buildParams() {
        return {
            backendUrl: this.backend ? this.backend : this.config.backendUrl,
            vcfs: this.vcfs,
            tbis: this.tbis,
            normal: this.normal,
            tumors: this.tumors
        };
    }

    buildQuery() {
        return {
            source: this.config.params.source
        };
    }
}

class MosaicIntegration extends Integration {
    constructor(query, globalApp) {
        console.log("Launch from Mosaic detected");
        super(query, {}, globalApp);
    }

    init() {
        const self = this;
        return this.configMan.getConfig().then(launchConfig => {
            self.config = launchConfig;

            return new Promise((resolve, reject) => {
                let promises = [];

                const projectId = self.config.params.project_id;
                if (projectId) {
                    let p = new Promise((fileResolve, fileReject) => {
                        self.promiseGetMosaicIobioUrls(self.config.params)
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
                                sortAlphaNum(self.tumors, self.globalApp._); // Mosaic does not guarantee return in specified order
                                fileResolve();
                            }).catch(err => {
                            fileReject("There was a problem getting Mosaic data: " + err);
                        });
                    })
                    promises.push(p);
                } else {
                    reject('Could not find necessary query arguments for Mosaic launch');
                }

                const geneSetId = self.config.params.gene_set_id;
                if (geneSetId && !self.config.params.somatic_only) {
                    let p = new Promise(geneResolve => {

                        let params = self.config.params;
                        params['mosaic_distro'] = UTAH;
                        self.promiseGetGenesBySetId(params)
                            .then(geneSetObj => {
                                self.geneList = geneSetObj.geneList;
                                self.geneListName = 'Mosaic provided [' + geneSetObj.geneListName + ' set]';
                                geneResolve();
                            }).catch(err => {
                            console.log("Could not fetch genes from Mosaic by gene id: " + err);
                            // Don't want to reject here because user can still enter genes if this messes up
                        });
                        promises.push(p);
                    });
                } else if (self.config.params.genes && !self.config.params.somatic_only) {
                    self.geneList = self.config.params.genes.split(',');
                    self.geneListName = 'Mosaic provided [user-entered]';
                }
                Promise.all(promises)
                    .then(() => {
                        resolve();
                    });
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
            genes: this.geneList,
            geneListName: this.geneListName
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

    promiseGetGenesBySetId(params) {
        const self = this;

        return new Promise((resolve, reject) => {
            const api = decodeURIComponent(params.source) + "/api/v1";
            const mosaic_distro = params.mosaic_distro;
            const project_id = params.project_id;
            const gene_set_id = params.gene_set_id;

            let token = '';
            if (mosaic_distro === FRAMESHIFT) {
                token = process.env.VUE_DEMO_TOKEN;
            } else if (mosaic_distro === UTAH) {
                token = localStorage.getItem('mosaic-iobio-tkn');
            } else {
                console.log("No mosaic distribution specified to get gene set");
            }

            if (token) {
                getGeneListById(project_id, gene_set_id, api, token, self.globalApp.$)
                    .then(geneListObj => {
                        if (geneListObj) {
                            resolve({'geneList': geneListObj.genes, 'geneListName': geneListObj.name});
                        } else {
                            reject("Something went wrong performing gene set call to Mosaic");
                        }
                    }).catch(error => {
                    reject("Problem getting gene list from Mosaic: " + error);
                })
            } else {
                reject("No access token detected for Mosaic integration");
                // todo: what package does this come from?
                //window.location.href = buildOauthLink();
            }
        });
    }
}

/* Returns object with one entry for the normal sample, and
 * one entry per tumor sample. The entry contains presigned
 * url for vcf/tbi files, bam/bai files (FOR COVERAGE ONLY if exist),
 * and cnv files (if exist). */
export function promiseGetSampleUrls(api, token, params, $) {
    return new Promise((resolve, reject) => {

        const project_id = params.project_id;
        const normal_id = params.normal_id;
        let tumor_ids = params.tumor_ids;

        let sample_ids = [normal_id];
        sample_ids.push(...tumor_ids);

        let promises = [];
        let returnMap = {};
        for (let i = 0; i < sample_ids.length; i++) {
            let sample_id = sample_ids[i];
            let p = promiseGetSingleSampleUrls(api, token, project_id, sample_id, $)
                .then(urlObj => {
                    if (i === 0) {
                        returnMap['normal'] = urlObj;
                    } else {
                        returnMap['t' + i] = urlObj;
                    }
                }).catch(err => {
                    reject('Something went wrong getting sample ' + i + ': ' + err);
                })
            promises.push(p);
        }
        Promise.all(promises)
            .then(() => {
                resolve(returnMap);
            })
    })

}

/* Returns an object with presigned urls for the single sample
 * corresponding to the provided sample_id argument.
 * For now, DOES NOT INCLUDE RNASEQ BAM FILES. */
// todo: add rnaseq bam files here if use case
export function promiseGetSingleSampleUrls(api, token, project_id, sample_id, $) {
    return new Promise((resolve, reject) => {
        getFilesForSample(project_id, sample_id, api, token, $).done(data => {
            if (data.data) {
                let vcfs = data.data.filter(f => (f.type === 'vcf'));
                let tbis = data.data.filter(f => (f.type === 'tbi'));
                const bam = data.data.filter(f => (f.type === 'bam' || f.type === 'cram'))[0];
                const bai = data.data.filter(f => (f.type === 'bai' || f.type === 'crai'))[0];
                const cnv = data.data.filter(f => (f.type === 'tsv' || f.type === 'csv'))[0];   // todo: are these ever any other file types

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
                    if (selectedSample == null) {
                        console.log('ERROR: vcf_sample_name not set for Mosaic sample');
                    }
                    let vcfName = vcf.name;
                    let tbiName = tbi.name;

                    let p = new Promise(resolve => {
                        getSignedUrlForFile(project_id, vcf, api, token, $).done(vcfUrlData => {
                            const vcfUrl = vcfUrlData.url;
                            getSignedUrlForFile(project_id, tbi, api, token, $).done(tbiUrlData => {
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
                            getSignedUrlForFile(project_id, bam, api, token, $).done(bamUrlData => {
                                const bamUrl = bamUrlData.url;
                                getSignedUrlForFile(project_id, bai, api, token, $).done(baiUrlData => {
                                    const baiUrl = baiUrlData.url;
                                    if (cnv) {
                                        getSignedUrlForFile(project_id, cnv, api, token, $).done(cnvUrlData => {
                                            const cnvUrl = cnvUrlData.url;
                                            let urlObj = {
                                                'vcfs': vcfUrls,
                                                'tbis': tbiUrls,
                                                'coverageBam': bamUrl,
                                                'bamName': bam.name,
                                                'coverageBai': baiUrl,
                                                'baiName': bai.name,
                                                'cnv': cnvUrl,
                                                'cnvName': cnv.name,
                                                selectedSamples,
                                                vcfFileNames,
                                                tbiFileNames
                                            };
                                            resolve(urlObj);
                                        })
                                    } else {
                                        let urlObj = {
                                            'vcfs': vcfUrls,
                                            'tbis': tbiUrls,
                                            'coverageBam': bamUrl,
                                            'bamName': bam.name,
                                            'coverageBai': baiUrl,
                                            'baiName': bai.name,
                                            selectedSamples,
                                            vcfFileNames,
                                            tbiFileNames
                                        };
                                        resolve(urlObj);
                                    }
                                })
                            })
                        } else {
                            if (cnv) {
                                getSignedUrlForFile(project_id, cnv, api, token, $).done(cnvUrlData => {
                                    const cnvUrl = cnvUrlData.url;
                                    let urlObj = {
                                        'vcfs': vcfUrls,
                                        'tbis': tbiUrls,
                                        'cnv': cnvUrl,
                                        'cnvName': cnv.name,
                                        selectedSamples,
                                        vcfFileNames,
                                        tbiFileNames
                                    };
                                    resolve(urlObj);
                                })
                            } else {
                                let urlObj = {
                                    'vcfs': vcfUrls,
                                    'tbis': tbiUrls,
                                    selectedSamples,
                                    vcfFileNames,
                                    tbiFileNames
                                };
                                resolve(urlObj);
                            }
                        }
                    })
            }
        })
    });
}

export function getFilesForSample(project_id, sample_id, api, token, $) {
    return $.ajax({
        url: api + '/projects/' + project_id + '/samples/' + sample_id + '/files',
        type: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': token
        }
    }).fail(function () {
        //let link = buildOauthLink(); todo: what package does this come from?
        let link = '';
        $('#warning-authorize')
            .append('Your access to mosaic.iobio has expired. Please click <a href=' + link + '>here</a> to renew your access.')
            .css('display', 'block');
    });
}

export function getSignedUrlForFile(project_id, file, api, token, $) {
    return $.ajax({
        url: api + '/projects/' + project_id + '/files/' + file.id + '/url',
        type: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': token
        }
    });
}

export function getGeneListById(project_id, gene_set_id, api, $) {
    return $.ajax({
        url: api + '/projects/' + project_id + '/genes/sets/' + gene_set_id,
        type: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': localStorage.getItem('mosaic-iobio-tkn')
        }
    });
}

/* Sorts alphanumerically by selected sample ID. */
export function sortAlphaNum(list) {
    // const reA = /[^a-zA-Z]/g;
    // const reN = /[^0-9]/g;

    let sortFxn = function (a, b) {
        let aSS = a.selectedSample ? a.selectedSample : a.selectedSamples[0];
        let bSS = b.selectedSample ? b.selectedSample : b.selectedSamples[0];
        if (aSS.toString().startsWith('year_')) {
            aSS = aSS.toString().substring(5);
        }
        if (bSS.toString().startsWith('year_')) {
            bSS = bSS.toString().substring(5);
        }

        return aSS.localeCompare(bSS, undefined, {numeric: true});
    }
    return list.sort(sortFxn);
}