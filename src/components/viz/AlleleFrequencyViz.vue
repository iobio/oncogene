<!-- Displays allele frequencies of selected variant -->
<style lang="sass">
    .bar-outline
        stroke: #000 !important
        stroke-width: 1px !important
        stroke-opacity: .3 !important
</style>

<template>
    <v-flex xs12>
        <v-layout row>
            <v-flex xs12 class="field-label-header" style="text-align: left">Allele Frequencies</v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs2 md2 class="summary-field-label">1000G:</v-flex>
            <v-flex xs2 v-bind:class="{ hide: loadingExtraAnnotations === true }" class="summary-field-value">{{
                oneKGenomes }}
            </v-flex>
            <v-flex xs2 class="loader" v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <img src="/src/assets/images/wheel.gif">
            </v-flex>
            <v-flex xs9 md9 id="oneKProgress" style="padding: 0px"></v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs2 md2 class="summary-field-label">gnomAD:</v-flex>
            <v-flex xs2 v-bind:class="{ hide: loadingExtraAnnotations === true }" class="summary-field-value">{{ gnomad
                }}
            </v-flex>
            <v-flex xs2 class="loader" v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <img src="/src/assets/images/wheel.gif">
            </v-flex>
            <v-flex xs9 md9 id="gnomadProgress" style="padding: 0px"></v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs2 md2 class="summary-field-label">ExAC:</v-flex>
            <v-flex xs2 v-bind:class="{ hide: loadingExtraAnnotations === true }" class="summary-field-value">{{ exAc
                }}
            </v-flex>
            <v-flex xs2 class="loader" v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <img src="/src/assets/images/wheel.gif">
            </v-flex>
            <v-flex xs9 md9 id="exAcProgress" style="padding: 0px"></v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs2 md2 class="summary-field-label">Proband:</v-flex>
            <v-flex xs2 v-bind:class="{ hide: loadingExtraAnnotations === true }" class="summary-field-value">{{
                probandDisplay }}
            </v-flex>
            <v-flex xs2 class="loader" v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <img src="/src/assets/images/wheel.gif">
            </v-flex>
            <v-flex xs9 md9 id="probandProgress" style="padding: 0px"></v-flex>
        </v-layout>
        <v-layout row>
            <v-flex xs2 md2 class="summary-field-label">Subset:</v-flex>
            <v-flex xs2 v-bind:class="{ hide: loadingExtraAnnotations === true }" class="summary-field-value">{{
                subsetDisplay }}
            </v-flex>
            <v-flex xs2 class="loader" v-bind:class="{ hide: loadingExtraAnnotations === false }">
                <img src="/src/assets/images/wheel.gif">
            </v-flex>
            <v-flex xs9 md9 id="subsetProgress" style="padding: 0px"></v-flex>
        </v-layout>
    </v-flex>
</template>

<script>
    import progressBar from '../../d3/progressBar.d3.js'
    export default {
        name: 'allele-frequency-viz',
        data() {
            return {
                oneKBar: {},
                exAcBar: {},
                gnomadBar: {},
                probandBar: {},
                subsetBar: {},
                probandDisplay: '-',
                subsetDisplay: '-'
            }
        },
        props: {
            selectedVariant: {},
            oneKGenomes: {
                default: "",
                type: String
            },
            exAc: {
                default: "",
                type: String
            },
            gnomad: {
                default: "",
                type: String
            },
            totalProbandAlleleCount: {
                default: 0,
                type: Number
            },
            totalSubsetAlleleCount: {
                default: 0,
                type: Number
            },
            affectedProbandAlleleCount: {
                default: 0,
                type: Number
            },
            d3: {
                type: Object,
                default: null
            }
        },
        created: function () {
        },
        mounted: function () {
            this.drawProgressBars();
        },
        computed: {
            affectedProbandPercentage: function () {
                if (this.totalProbandAlleleCount === 0 || this.totalProbandAlleleCount < 0 || this.blacklistStatus) {
                    return "0";
                }
                let numMutantAlleles = this.affectedProbandAlleleCount;
                let totalAlleleCount = this.totalProbandAlleleCount;

                let freq = (Math.round((numMutantAlleles / totalAlleleCount) * 100));
                if (freq === 0 && numMutantAlleles > 0) {
                    return "1%";
                }
                return (Math.round((numMutantAlleles / totalAlleleCount) * 100)) + "";
            },
            affectedSubsetPercentage: function () {
                if (this.totalSubsetAlleleCount === 0 || this.totalSubsetAlleleCount < 0 || this.blacklistStatus) {
                    return "0";
                }
                let numMutantAlleles = this.affectedSubsetAlleleCount;
                let totalAlleleCount = this.totalSubsetAlleleCount;

                let freq = (Math.round((numMutantAlleles / totalAlleleCount) * 100));
                if (freq === 0 && numMutantAlleles > 0) {
                    return "1%";
                }
                return (Math.round((numMutantAlleles / totalAlleleCount) * 100)) + "";
            }
        },
        methods: {
            drawProgressBars() {
                let self = this;

                self.oneKBar = progressBar(self.d3)
                    .parentId('oneKProgress')
                    .on('d3rendered', function () {
                    });
                self.oneKBar();

                self.gnomadBar = progressBar(self.d3)
                    .parentId('gnomadProgress')
                    .on('d3rendered', function () {
                    });
                self.gnomadBar();

                self.exAcBar = progressBar(self.d3)
                    .parentId('exAcProgress')
                    .on('d3rendered', function () {
                    });
                self.exAcBar();

                self.probandBar = progressBar(self.d3)
                    .parentId('probandProgress')
                    .on('d3rendered', function () {
                    });
                self.probandBar();

                self.subsetBar = progressBar(self.d3)
                    .parentId('subsetProgress')
                    .on('d3rendered', function () {
                    });
                self.subsetBar();
            },
            fillProgressBars() {
                let self = this;

                self.oneKBar.moveProgressBar()(self.oneKGenomes);
                self.gnomadBar.moveProgressBar()(self.gnomad);
                self.exAcBar.moveProgressBar()(self.exAc);
                self.probandBar.moveProgressBar()(self.affectedProbandPercentage);
                self.subsetBar.moveProgressBar()(self.affectedSubsetPercentage);
            },
            clear() {
                let self = this;
                self.oneKBar.moveProgressBar()(0);
                self.gnomadBar.moveProgressBar()(0);
                self.exAcBar.moveProgressBar()(0);
                self.probandBar.moveProgressBar()(0);
                self.subsetBar.moveProgressBar()(0);
            },
            getProbandDisplay() {
                if (this.selectedVariant == null || this.blacklistStatus) return "-";
                else if (this.totalProbandAlleleCount < 0) return 'N/A';
                else if (this.totalProbandAlleleCount === 0) return "0%";
                else {
                    let numMutantAlleles = this.affectedProbandAlleleCount;
                    let totalAlleleCount = this.totalProbandAlleleCount;

                    let freq = Math.round((numMutantAlleles / totalAlleleCount) * 100);
                    if (freq === 0 && numMutantAlleles > 0) {
                        return "<1%";
                    }
                    return freq + "%";
                }
            },
            getSubsetDisplay() {
                if (this.selectedVariant == null || this.blacklistStatus) return "-";
                else if (this.totalProbandAlleleCount < 0) return 'N/A';
                else if (this.totalSubsetAlleleCount === 0) return "0%";
                else {
                    let numMutantAlleles = this.affectedSubsetAlleleCount;
                    let totalAlleleCount = this.totalSubsetAlleleCount;

                    let freq = Math.round((numMutantAlleles / totalAlleleCount) * 100);
                    if (freq === 0 && numMutantAlleles > 0) {
                        return "<1%";
                    }
                    return freq + "%";
                }
            }
        },
        watch: {
            selectedVariant: function () {
                this.fillProgressBars();
                this.probandDisplay = this.getProbandDisplay();
                this.subsetDisplay = this.getSubsetDisplay();
            },
            oneKGenomes: function() {
                let self = this;
                if (self.oneKGenomes !== '-') {
                    self.oneKBar.moveProgressBar()(self.oneKGenomes);
                }
            },
            exAc: function() {
                let self = this;
                if (self.exAc !== '-') {
                    self.exAcBar.moveProgressBar()(self.exAc);
                }
            },
            gnomad: function() {
                let self = this;
                if (self.gnomad !== '-') {
                    self.gnomadBar.moveProgressBar()(self.gnomad);
                }
            }
        }
    }

</script>
