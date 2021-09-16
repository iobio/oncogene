class SubcloneModel {
    constructor(subcloneArr) {
        this.subcloneHeaderStrs = subcloneArr;
        this.possibleTrees = [];
        this.clonalVarMap = {};
        this.NORMAL = 'n';
    }
    // todo: possible that user won't select all samples and that all samples present in subclone structure
    // todo: also possible that user will select all samples and that not all sample present in subclone structure
    // todo: also possible that user will pick wrong sample as normal... will this affect anything?

    /* Inserts node into the subclone node list at a position corresponding to its clone ID.
     * For example, C1 is inserted at index 1, C2 is inserted at index 2, etc (N is always at index 0) */
    insertNode(node, subclone) {
        if (!subclone.nodes || !node.id) {
            console.log('Could not insert node, nodes list DNE in subclone object or no node ID in node object');
            return false;
        } else {
            if (node.id === this.NORMAL) {
                subclone.nodes.splice(0, 0, node);
            } else {
                let idx = +(node.id.substring(1));
                subclone.nodes.splice(idx, 0, node);
            }
            return true;
        }
    }

    /* Returns the node object corresponding to the given ID in constant time.
     * Returns null if node DNE. */
    getNode(nodeId, subclone) {
        if (!subclone || !subclone.nodes) {
            return null;
        }
        if (nodeId === this.NORMAL) {
            return subclone.nodes[0];
        } else {
            let idx = +(nodeId.substring(1));
            return subclone.nodes[idx];
        }
    }

    /* Extracts nodes and edges for a single subclone tree from ##SUBCLONE seeker lines in vcf header */
    parseNodesAndEdges(lineage, subclone) {
        let edgeStr = lineage.substring(lineage.indexOf('\"') + 1, lineage.length - 1);
        let edges = edgeStr.split(',');
        for (let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            let nodes = edge.split('->');
            if (nodes.length !== 2) {
                console.log('Something went wrong parsing edge for subclones from line: ' + edge);
                return false;
            }
            const sourceNodeId = (nodes[0]).trim();
            let sourceNode = { id: sourceNodeId, freqs: {} };
            const destNodeId = (nodes[1]).trim();
            let destNode = { id: destNodeId, freqs: {} };

            // Add source node
            let success = true;
            if (!subclone.edges[sourceNodeId]) {
                subclone.edges[sourceNodeId] = [destNodeId];
                success &= this.insertNode(sourceNode, subclone);
            } else {
                subclone.edges[sourceNodeId].push(destNodeId);
            }
            // Add dest node
            if (!subclone.edges[destNodeId]) {
                subclone.edges[destNodeId] = [];
                success &= this.insertNode(destNode, subclone);
            }
            // Short-circuit if something went wrong
            if (!success) {
                return false;
            }
        }
        return true;
    }

    /* Assigns clonal frequencies for each sample listed in ##SUBCLONE seeker lines in vcf header */
    assignFreqs(trace, subclone) {
        let traceStr = trace.substring(trace.indexOf('<') + 1, trace.length - 2);   // Trim off 'TRACE=<' and '\">'
        let traceSamples = traceStr.split('\",');
        for (let i = 0; i < traceSamples.length; i++) {
            let traceSample = traceSamples[i];
            let traceEls = traceSample.split("=");
            if (traceEls.length !== 2) {
                console.log('Could not parse trace string from subclone line: ' + traceStr);
                return false;
            } else {
                const sampleId = traceEls[0];
                let freqs = traceEls[1];
                let nodeFreqs = freqs.split(',');
                if (freqs.length < 1) {
                    console.log('Could not parse trace string from subclone line: ' + nodeFreqs);
                    return false;
                }
                for (let i = 0; i < nodeFreqs.length; i++) {
                    let currNodeFreq = nodeFreqs[i];
                    if (i === 0) {
                        currNodeFreq = currNodeFreq.substring(1);   // Trim off first sample '\"'
                    }
                    let freqEls = currNodeFreq.split(':');
                    if (freqEls.length !== 2) {
                        console.log('Could not parse trace string from clonal frequency: ' + currNodeFreq);
                        return false;
                    } else {
                        let nodeId = (freqEls[0]).trim();
                        let freq = freqEls[1];
                        let node = this.getNode(nodeId, subclone);
                        if (node == null) {
                            console.log('Could not get node ' + nodeId + ' to assign frequencies');
                            return false;
                        }
                        node.freqs[sampleId] = +freq;
                    }

                }
            }
        }
        return true;
    }

    /* Extracts an individual subclone tree from the provided string. Parsing is specific to
     * the Subclone Seeker annotation tool developed by YQ in Marth lab Aug2021. */
    parseSubclone(treeLine) {
        const tree = treeLine.split(';');
        let lineage = tree[0];
        let trace = tree[1];

        if (!lineage || !trace) {
            console.log('Could not parse lineage or trace fields from ##SUBCLONE header line: ' + tree);
            return null;
        }
        // Return object
        let subclone = {
            'nodes' : [],       // list of nodes objects in tree
            'edges' : {}        // nodeId : listOf child nodeIds
        }
        // Extract nodes and edges
        let success = this.parseNodesAndEdges(lineage, subclone);
        if (!success) {
            console.log('Could not parse nodes and edges from header');
            return null;
        }

        // Annotate frequencies to each clone for each sample
        success = this.assignFreqs(trace, subclone);
        if (!success) {
            console.log('Could not assign clonal frequencies');
            return null;
        }
        return subclone;
    }

    /* Extracts all possible subclone trees annotated in the header section of the vcf file
     * and adds them to the list of possible trees. */
    promiseParseSubcloneTrees() {
        const self = this;
        return new Promise((resolve, reject) => {
            let trees = self.subcloneHeaderStrs;
            trees.forEach(tree => {
                let possibleTree = this.parseSubclone(tree);
                if (possibleTree != null) {
                    self.possibleTrees.push(possibleTree);
                } else {
                    return reject('Parsing subclones failed...');
                }
            });
            return resolve(self.possibleTrees);
        })
    }

    populateSubcloneVariants(variants) {
        const self = this;
        variants.forEach(variant => {
            let subcloneId = variant.subcloneId;
            if (self.clonalVarMap[subcloneId]) {
                self.clonalVarMap[subcloneId].push(variant);
            } else {
                self.clonalVarMap[subcloneId] = [variant];
            }
        })
    }
}
export default SubcloneModel