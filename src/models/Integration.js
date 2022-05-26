import { LaunchConfigManager } from 'iobio-launch';
const GALAXY = 'galaxy';

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
    }
    getSource() {
        return this.query ? this.query.source : null;
    }
    getBackend() {
        return this.globalApp.GALAXY_TEST_MODE ? 'https://backend.iobio.io/gru' : this.backend;
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
                self.normal = { 'vcfs': self.vcfs, 'tbis': self.tbis };
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
        this.NORMAL = 'normal';
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
                                // todo: a better method is for Mosaic to provide samples in order specified
                                // todo: move this fxn into global
                                sortAlphaNum(self.tumors, self.globalApp._);
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
                        self.promiseGetGenesBySetId(self.config.params)
                            .then(geneSetObj => {
                                self.geneList = geneSetObj.geneList;
                                self.geneListName = 'Mosaic provided ['+ geneSetObj.geneListName + ' set]';
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

    promiseGetMosaicIobioUrls(params) {
        const self = this;

        return new Promise((resolve, reject) => {
            const api = decodeURIComponent(params.source) + "/api/v1";
            const project_id = params.project_id;
            const normal_id = params.sample_id;
            let tumor_ids = params.tumor_sample_ids.split(',');

            let passParams = {
                project_id,
                normal_id,
                tumor_ids
            };

            if (localStorage.getItem('mosaic-iobio-tkn')) {
                promiseGetSampleUrls(api, passParams, self.globalApp.$)
                    .then(sampleMap => {
                        resolve(sampleMap);
                    }).catch(error => {
                        reject("Problem getting file info for sample: " + error);
                })
            } else {
                reject("No access token detected");
                // todo: what package does this come from?
                //window.location.href = buildOauthLink();
            }
        });
    }

    promiseGetGenesBySetId(params) {
        const self = this;

        return new Promise((resolve, reject) => {
            const api = decodeURIComponent(params.source) + "/api/v1";
            const project_id = params.project_id;
            const gene_set_id = params.gene_set_id;

            if (localStorage.getItem('mosaic-iobio-tkn')) {
                getGeneListById(project_id, gene_set_id, api, self.globalApp.$)
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
                reject("No access token detected");
                // todo: what package does this come from?
                //window.location.href = buildOauthLink();
            }
        });
    }
}

/* Returns object with one entry for the normal sample, and
 * one entry per tumor sample. The entry contains presigned
 * url for vcf/tbi files and bam/bai files
 * FOR COVERAGE ONLY FOR NOW (if they exist). */
export function promiseGetSampleUrls(api, params, $) {
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
        let p = promiseGetSingleSampleUrls(api, project_id, sample_id, $)
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
 * For now, ONLY CONTAINS COVERAGE bam file urls. */
export function promiseGetSingleSampleUrls(api, project_id, sample_id, $) {
    return new Promise((resolve, reject) => {
        getFilesForSample(project_id, sample_id, api, $).done(data => {
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
                                    }
                                    resolve(urlObj);
                                })
                            })
                        } else {
                            console.log("No bam & bai files obtained for normal sample");
                            // todo: add rnaseq, cnv here
                            let urlObj = {'vcfs': vcfUrls, 'tbis': tbiUrls, selectedSamples, vcfFileNames, tbiFileNames};
                            resolve(urlObj);
                        }
                    })
            }
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

export function getGeneListById (project_id, gene_set_id, api, $) {
    return $.ajax({
        url: api + '/projects/' + project_id + '/genes/sets/' + gene_set_id,
        type: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': localStorage.getItem('mosaic-iobio-tkn')
        }
    });
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