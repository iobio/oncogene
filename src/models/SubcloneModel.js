class SubcloneModel {
    constructor(subcloneArr) {
        this.subcloneHeaderStrs = subcloneArr;
        this.possibleTrees = [];
        this.barVizTrees = {};  // An object with pagination_id: [{ subclone: 'C1', timepoint: 'B1', prev: 0.5 }]
        this.treeVizObjs = {};
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
            let sourceNode = {id: sourceNodeId, freqs: {}, parents: []};
            const destNodeId = (nodes[1]).trim();
            let destNode = {id: destNodeId, freqs: {}, parents: []};

            // Add source node
            let success = true;
            if (!subclone.edges[sourceNodeId]) {
                subclone.edges[sourceNodeId] = [destNodeId];
                success &= this.insertNode(sourceNode, subclone);
            } else {
                subclone.edges[sourceNodeId].push(destNodeId);
            }
            // Add dest node if it doesn't already exist
            if (!subclone.edges[destNodeId]) {
                subclone.edges[destNodeId] = [];
                destNode.parents.push(sourceNodeId);
                success &= this.insertNode(destNode, subclone);
            } else {
                // Otherwise just add immediate parent
                let existNode = this.getNode(destNodeId, subclone);
                existNode.parents.push(sourceNodeId);
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
                const sampleId = traceEls[0].trim();
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
        // Return object - a subclone tree
        let subclone = {
            'nodes': [],       // list of nodes objects in tree
            'edges': {}        // nodeId : listOf child nodeIds
        }
        // Extract nodes and edges
        let success = this.parseNodesAndEdges(lineage, subclone);
        if (!success) {
            console.log('Could not parse nodes and edges from header');
            return null;
        }

        // Iterate back through nodes and assign full lineage
        //let founderClone = this.getNode('C1', subclone);  // todo: is this a safe assumption - C1 will always be founder clone?
        //this.annotateLineage(founderClone.id, subclone, []);

        // Annotate frequencies to each clone for each sample
        success = this.assignFreqs(trace, subclone);
        if (!success) {
            console.log('Could not assign clonal frequencies');
            return null;
        }

        return subclone;
    }

    /* Used to assign parent nodes to children - not currently using but may prove useful in future */
    annotateLineage(nodeId, subclone, parentIds) {
        let node = this.getNode(nodeId, subclone);
        let childIds = subclone.edges[nodeId];

        // We've reached a leaf node, annotate the parent IDs we've seen until now
        if (childIds.length === 0) {
            let parentCopy = parentIds.slice();
            node.parents = parentCopy;
        } else {
            // We haven't hit a leaf node yet

            // Add ourselves to the list of parents
            parentIds.push(nodeId);

            // Iterate through our children
            childIds.forEach(childId => {
                if (childId !== 'n') {
                    this.annotateLineage(childId, subclone, parentIds);
                }
            })
            // Get rid of ourselves before we return to last call
            parentIds.pop();
        }
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

    /* Use for fish plot in future but todo: needs to be reversed - sum children into parent, not parent into children */
    sumCps(subclone, staticSubclone) {
        const self = this;
        let nodes = subclone.nodes;
        nodes.forEach(node => {
            if (node.id !== 'n') {
                node.edges.forEach(parent => {
                    if (parent !== 'n') {
                        let parentNode = self.getNode(parent, staticSubclone);
                        Object.keys(node.freqs).forEach(timept => {
                            if (timept !== 'B0') {
                                node.freqs[timept] += parentNode.freqs[timept];
                            }
                        })
                    }
                })
            }
        })
    }

    getBarVizTree(paginationIdx) {
        const self = this;
        if (self.barVizTrees[paginationIdx]) {
            return self.barVizTrees[paginationIdx];
        } else {
            // Make a copy of object so we don't lose original CPs
            let subclone = self.possibleTrees[paginationIdx - 1];

            let nodes = subclone.nodes;
            for (let i = 0; i < nodes.length; i++) {
                let node = nodes[i];
                let id = node.id;
                let subnodeList = [];

                if (id !== 'n') {
                    Object.keys(node.freqs).forEach(timepoint => {
                        if (timepoint !== 'B0') {
                            let freq = node.freqs[timepoint];
                            subnodeList.push({'subclone': id, 'timepoint': timepoint, 'prev': freq})
                        }
                    })
                    // Sort nodes so they appear in correct timepoint order
                    subnodeList.sort((a, b) => {
                        return parseInt(a.timepoint.substr(1)) < parseInt(b.timepoint.substr(1)) ? -1 : 0
                    });

                    if (self.barVizTrees[paginationIdx]) {
                        self.barVizTrees[paginationIdx] = self.barVizTrees[paginationIdx].concat(subnodeList);
                    } else {
                        self.barVizTrees[paginationIdx] = subnodeList;
                    }
                }
            }
            return self.barVizTrees[paginationIdx];
        }
    }

    getTreeViz(paginationIdx) {
        const self = this;
        if (self.treeVizObjs[paginationIdx]) {
            return self.treeVizObjs[paginationIdx];
        } else {
            let subclone = self.possibleTrees[paginationIdx - 1];
            let nodes = subclone.nodes;
            let firstNode = nodes[1];

            let retObj = {
                "name": firstNode.id,
                "children": []
            };

            let edges = subclone.edges[firstNode.id];
            edges.forEach(childId => {
                let childObject = self.getChildObject(childId, subclone);
                retObj.children.push(childObject);
            })
            self.treeVizObjs[paginationIdx] = retObj;
            return self.treeVizObjs[paginationIdx];
        }
    }

    getChildObject(childId, subclone) {
        let childNode = this.getNode(childId, subclone);
        let grandchildIds = subclone.edges[childId];

        // We've reached a leaf node, return object
        if (grandchildIds.length === 0) {
            return {
                "name": childNode.id
            };
        } else {
            // We have more grandchildren to explore
            let node = {
                "name": childNode.id,
                "children": []
            };
            grandchildIds.forEach(grandchildId => {
                let granchildObj = this.getChildObject(grandchildId, subclone);
                node.children.push(granchildObj);
            })
            return node;
        }
    }
}

export default SubcloneModel