class SubcloneModel {
    constructor(subcloneStr) {
        this.subcloneHeaderStr = subcloneStr
        this.possibleTrees = [];
    }
    // todo: possible that user won't select all samples and that all samples present in subclone structure
    // todo: also possible that user will select all samples and that not all sample present in subclone structure
    // todo: also possible that user will pick wrong sample as normal... will this affect anything?

    /* Inserts node into the subclone node list at a position corresponding to its clone ID.
     * For example, C1 is inserted at index 1, C2 is inserted at index 2, etc (N is always at index 0) */
    insertNode(node, subclone) {
        if (!subclone.nodes || !node.id) {
            console.log('Could not insert node, nodes list DNE in subclone object or no node ID in node object');
        } else {
            if (node.id === 'N') {
                subclone.nodes.splice(0, 0, node);
            } else {
                let idx = +(node.id.substring(1));
                subclone.nodes.splice(idx, 0, node);
            }
        }
    }

    /* Returns the node object corresponding to the given ID in constant time.
     * Returns null if node DNE. */
    getNode(nodeId, subclone) {
        if (!subclone || !subclone.nodes)
        if (nodeId === 'N') {
            return subclone.nodes[0];
        } else {
            let idx = +(nodeId.substring(1));
            return subclone.nodes[idx];
        }
    }

    parseNodesAndEdges(lineage, subclone) {
        let edgeStr = lineage.substring(lineage.indexOf('\"') + 1, lineage.length - 1);
        let edges = edgeStr.split(',');
        for (let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            let nodes = edge.split('->');
            if (nodes.length !== 2) {
                console.log('Something went wrong parsing edge for subclones from line: ' + edge);
                console.log('Parsing subclones failed...');
                break;
            }
            const sourceNodeId = nodes[0];
            let sourceNode = { id: sourceNodeId, freqs: {} };
            const destNodeId = nodes[1];
            let destNode = { id: destNodeId, freqs: {} };

            // Add source node
            if (!subclone.edges[sourceNodeId]) {
                subclone.edges[sourceNodeId] = [destNodeId];
                this.insertNode(sourceNode, subclone);
                //subclone.nodes.push(sourceNode);
            } else {
                subclone.edges[sourceNodeId].push(destNodeId);
            }

            // Add dest node
            if (!subclone.edges[destNodeId]) {
                subclone.edges[destNodeId] = [];
                subclone.nodes.push(destNode);
            }
        }
    }

    assignFreqs(trace, subclone) {
        let traceStr = trace.substring(trace.indexOf('<') + 1, trace.length - 2);   // Trim off 'TRACE=<' and '\">'
        let traceEls = trace.split('=');
        if (traceEls.length !== 2) {
            console.log('Could not parse trace string from subclone line: ' + traceStr);
            console.log('Parsing subclones failed...');
        } else {
            const sampleId = traceEls[0];
            let freqs = traceEls[1];
            let sampleFreqs = freqs.split("\",");
            if (sampleFreqs.length < 1) {
                console.log('Could not parse trace string from subclone line: ' + sampleFreqs);
                console.log('Parsing subclones failed...');
                return;
            }

            // todo: put some sanity checks here - should always have same node assignments for each sampleID
            for (let i = 0; i < sampleFreqs.length; i++) {
                let currSampleFreqs = sampleFreqs[i];
                if (i === 0) {
                    currSampleFreqs = currSampleFreqs.substring(1);   // Trim off first sample '\"'
                }
                let nodeFreqs = currSampleFreqs.split(', ');
                for (let i = 0; i < nodeFreqs.length; i++) {
                    let freq = nodeFreqs[i];
                    let freqEls = freq.split(':');
                    if (freqEls.length !== 2) {
                        console.log('Could not parse trace string from subclone line: ' + freq);
                        console.log('Parsing subclones failed...');
                        return;
                    } else {
                        let nodeId = freqEls[0];
                        let freq = freqEls[1];
                        let node = this.getNode(nodeId, subclone);
                        node.freqs[sampleId] = freq;
                    }
                }
            }
        }
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
        this.parseNodesAndEdges(lineage, subclone);
        // todo: need to detect errors here - wrap in promise?

        // Annotate frequencies to each clone for each sample
        this.assignFreqs(trace, subclone);
        // todo: same detect errors here

    }

    /* Extracts all possible subclone trees annotated in the header section of the vcf file
     * and adds them to the list of possible trees. */
    parseSubcloneTrees() {
        let trees = this.subcloneHeaderStr.split('\n');
        trees.forEach(tree => {
            let possibleTree = this.parseSubclone(tree);
            if (possibleTree != null) {
                this.possibleTrees.push(possibleTree);
            }
        })
    }

}
export default SubcloneModel