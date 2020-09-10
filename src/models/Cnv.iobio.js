// class to interact with backend for CNV files
// ideally these files are generated by the Facets program by MSKCC
class cnviobio {
    constructor(theEndpoint) {
        this.endpoint = theEndpoint;
        this.rawLines = null;
        this.headerIndices = null;
        this.startCoords = []; // index is chr, entry is sub-array of start coords [[22224, 22229, ...]
        this.cnvData = [];   // index is chr, entry is sub-array of maps of start, end, tcn, lcn [[{start: 21200, end: 22229, tcn: lcn: }, {start: 21200, end: 23457, tcn: lcn:}, ....]]
        this.dataLoaded = false;
        this.REQ_FIELDS = ['chrom', 'start', 'end', 'tcn.em', 'lcn.em'];
    }

    init() {
        for (let i = 0; i < 25; i++) {
            this.startCoords[i] = [];
            this.cnvData[i] = [];
        }
    }

    /* Returns true if all required CNV headers are present in provided file url. */
    checkCnvFormat(url, callback) {
        const self = this;
        self.endpoint.promiseGetCnvData(url)
            .then((buffer) => {
                const lines = buffer.split('\n');
                self.rawLines = lines.slice(1, (lines.length - 1));
                const headers = lines[0];
                let fieldIdx = this.checkHeaders(headers);
                self.headerIndices = fieldIdx;
                let notFoundFlag = false;
                fieldIdx.forEach(idx => {
                    if (idx < 0) {
                        notFoundFlag = true;
                    }
                });
                if (!notFoundFlag) {
                    callback(true);
                } else {
                    callback(false, 'badHeaders');
                }
            })
            .catch((error) => {
                console.log('Something went wrong with getting the CNV data: ' + error);
                callback(false, 'badFetch');
            })
    }

    /* Returns indices of required fields for CNV file header. */
    checkHeaders(headerLine) {
        const tokens = headerLine.split('\t');
        let fieldIdx = [];
        this.REQ_FIELDS.forEach(() => {
            fieldIdx.push(-1);
        });
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            for (let j = 0; j < this.REQ_FIELDS.length; j++) {
                let field = this.REQ_FIELDS[j];
                if (field.toLowerCase() === token) {
                    fieldIdx[j] = i;
                }
            }
        }
        fieldIdx.forEach((idx) => {
            if (idx < 0) {
                return null;
            }
        });
        return fieldIdx;
    }

    /* Populates map in this with each line from CNV file, grouped by chromosome. */
    promiseParseCnvData() {
        const self = this;
        return new Promise((resolve) => {
            self.rawLines.forEach((line) => {
                let tokens = line.split('\t');
                let currChr = tokens[self.headerIndices[0]];
                if (currChr === 'X') {
                    currChr = 24;
                } else if (currChr === 'Y') {
                    currChr = 25;
                }

                self.startCoords[currChr - 1].push(tokens[self.headerIndices[1]]);
                let otherData = {
                    start: tokens[self.headerIndices[1]],
                    end: tokens[self.headerIndices[2]],
                    tcn: tokens[self.headerIndices[3]],
                    lcn: tokens[self.headerIndices[4]]
                };
                self.cnvData[currChr - 1].push(otherData);
            });
            self.dataLoaded = true;
            resolve();
        })
    }

    // Two options here - multiple lines encompass our given section
    // or our section falls within one CNV event
    // Only pulls back CNV if the following is NOT true:
    //      LCN = 1 && TCN = 2
    findEntryByCoord(chr, startCoord, endCoord) {
        let matchingCnvs = [];

        if (chr.indexOf('c') > -1) {
            chr = chr.substring(3);
        }

        const chrStarts = this.startCoords[chr - 1];
        const chrData = this.cnvData[chr - 1];

        // Don't start searching if our first section is > our coord
        if (chrStarts[0] > startCoord) {
            return matchingCnvs;
        }

        // Search intervals for matching start
        for (let i = 0; i < chrStarts.length; i++) {
            if (chrData[i].start > endCoord) {
                break;
            }
            // We're in a gene encompasses by a CNV larger than the entire gene
            if (startCoord >= chrStarts[i] && endCoord <= chrData[i].end) {
                matchingCnvs.push(this._getFormattedData(chrData[i]));
            // We've found an element that encompasses some of the 5' part of the gene
            } else if (startCoord >= chrStarts[i] && chrData[i].end <= endCoord && chrData[i].end > startCoord) {
                matchingCnvs.push(this._getFormattedData(chrData[i]));
            // We've found an event that starts within our gene and encompasses some of the 3' part
            } else if (startCoord <= chrStarts[i] && chrStarts[i] < endCoord && chrData[i].end >= endCoord) {
                matchingCnvs.push(this._getFormattedData(chrData[i]));
            // We've found a tiny CNV within the gene
            } else if (startCoord <= chrStarts[i] && chrData[i].end <= endCoord) {
                matchingCnvs.push(this._getFormattedData(chrData[i]));
            }
        }
        return matchingCnvs;
    }

    /* Returns CNV data object with the following fields:
     * start, end, tcn, lcn, and points
     * where points is an array every 100bp between start and end with { coord lcn/tcn ratio } */
    _getFormattedData(data) {
        let points = [];
        for (let i = data.start; i < data.end; i += 1000) {
            points.push({ coord: i, ratio: (data.lcn/data.tcn).toFixed(2) });
        }

        // Always add on end coord
        points.push({ coord: data.end, ratio: (data.lcn/data.tcn).toFixed(2) });

        data.points = points;
        return data;
    }
}

export default cnviobio