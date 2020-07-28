<template>
    <v-card flat class="mx-2 igv-modal">
        <v-container>
            <v-row>
                <v-col cols="4">
                    {{heading}}
                </v-col>
                <v-col cols="6" style="text-align:center">
                    <v-radio-group v-model="selectedBamType"
                                   :row="true"
                                   dense
                                   class="mt-0"
                                   label="Select Bam Type:"
                                   @change="updateTracks">
                        <v-radio v-for="n in bamTypes"
                                 color="secondary"
                                 :key="n"
                                 :label="n"
                                 :value="n"
                                 style="font-style: italic; cursor: grab"
                        ></v-radio>
                    </v-radio-group>
                </v-col>
                <v-col cols="2" style="text-align: center">
                    <v-btn fab small @click='zoomOut' class="mx-1" color="secondary">
                        <v-icon>zoom_out</v-icon>
                    </v-btn>
                    <v-btn fab small @click='zoomIn' class="mx-1" color="secondary">
                        <v-icon>zoom_in</v-icon>
                    </v-btn>
                </v-col>
<!--                Note: leaving new tab functionality out for now b/c presigned URLs do not work-->
<!--                <v-col cols="2" style="text-align: right">-->
<!--                    <v-btn @click='launchFullIGV' color="secondary">-->
<!--                        Open in Tab-->
<!--                        <v-icon class="pl-2">-->
<!--                            open_in_new-->
<!--                        </v-icon>-->
<!--                    </v-btn>-->
<!--                </v-col>-->
            </v-row>
            <v-row no-gutters>
                <v-col cols="12" sm="12">
                    <div id='igv-content'></div>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
    import igv from 'igv'

    export default {
        name: 'pileup',
        props: {
            heading: String,
            referenceURL: String,
            locus: String,
            visible: {
                type: Boolean,
                default: true,
            },
            tracks: Array,
            showLabels: {
                type: Boolean,
                default: false,
            },
            hasRnaSeq: {
                type: Boolean,
                default: false
            },
            hasAtacSeq: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                browser: null,
                selectedBamType: 'Coverage',
                bamTypes: ['Coverage'],
                browserParams: null,
                RNASEQ_TYPE: 'RNA-seq',
                ATACSEQ_TYPE: 'ATAC-seq'
            }
        },
        mounted: function () {
            if (this.hasRnaSeq) {
                this.bamTypes.push(this.RNASEQ_TYPE);
            }
            if (this.hasAtacSeq) {
                this.bamTypes.push(this.ATACSEQ_TYPE);
            }

            if (this.visible) {
                this.init();
            }
        },
        methods: {
            init: function () {
                const igvDiv = this.$el.querySelector('#igv-content');

                this.browserParams = {
                    showControls: false,
                    showIdeogram: true,
                    showTrackLabels: this.showLabels,
                    //showCenterGuide: true,
                    minimumBases: 20,
                    reference: {
                        fastaURL: this.referenceURL,
                    },
                    locus: this.locus,
                    tracks: []
                };

                for (const track of this.tracks) {
                    this.browserParams.tracks.push({
                        height: 120,
                        coverageTrackHeight: 30,
                        alignmentRowHeight: 1,
                        name: track.name,
                        type: 'alignment',
                        url: track.coverageBam,     // Always default to coverage bams
                        indexURL: track.coverageBai,
                    });
                }
                igv.createBrowser(igvDiv, this.browserParams).then((browser) => {
                    this.browser = browser;
                })
            },
            zoomOut: function () {
                this.browser.zoomOut();
            },
            zoomIn: function () {
                this.browser.zoomIn();
            },
            launchFullIGV: function () {
                launchIGV(this.referenceURL, this.locus, this.tracks);
            },
            updateTracks: function () {
                const self = this;
                let urlKey = 'coverageBam';
                let indexUrlKey = 'coverageBai';

                if (this.selectedBamType === this.RNASEQ_TYPE) {
                    urlKey = 'rnaSeqBam';
                    indexUrlKey = 'rnaSeqBai';
                } else if (this.selectedBamType === this.ATACSEQ_TYPE) {
                    urlKey = 'atacSeqBam';
                    indexUrlKey = 'atacSeqBai';
                }

                // Clear out existing tracks
                this.tracks.forEach((track) => {
                    self.browser.removeTrackByName(track.name);
                });

                // Add back tracks with selected bam type
                for (const track of this.tracks) {
                    if (track[urlKey]) {
                        this.browser.loadTrack({
                            height: 120,
                            coverageTrackHeight: 30,
                            alignmentRowHeight: 1,
                            name: track.name,
                            type: 'alignment',
                            url: track[urlKey],
                            indexURL: track[indexUrlKey],
                        });
                    }
                }
            }
        },
        watch: {
            visible: function () {
                if (!this.browser) {
                    this.init();
                } else if (!this.visible) {
                    igv.removeBrowser(this.browser);
                    this.browser = null;
                }
                //igv.visibilityChange();
            },
        }
    }

    function launchIGV(referenceURL, locus, tracks) {
        const igvTracks = tracks.map((track) => ({
            type: 'alignment',
            //format: 'bam',
            url: track.alignmentURL,
            indexURL: track.alignmentIndexURL,
            name: track.name,
        }));

        const igvConfig = {
            showIdeogram: true,
            reference: {
                fastaURL: referenceURL,
            },
            locus,
            tracks: igvTracks,
        };

        if (tracks[0].variantURL) {
            igvConfig.tracks.unshift({
                name: 'Variants',
                type: 'variant',
                format: 'vcf',
                url: tracks[0].variantURL,
            })
        }
        const url = 'https://s3.amazonaws.com/static.iobio.io/dev/igv.iobio.io/index.html?config=' + JSON.stringify(igvConfig);
        window.open(url, '_blank');
    }
</script>

<style lang="sass">
    .igv-modal
        font-family: Quicksand
        font-size: 20px
</style>