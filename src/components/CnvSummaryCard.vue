<!-- Component populated with variant details on selection.
     SJG updated Aug2020 -->

<style lang="sass">
    .cnv-summary-card
        height: 100%

    .cnv-field-label
        color: #b4b3b3
        font-style: italic
        font-size: 12px
        padding-left: 2px
        text-align: left

    .cnv-viz
        min-height: 100px
        max-height: 600px
        padding-top: 0px
        overflow-x: hidden

        .content
            font-size: 12px
            padding-left: 10px
            margin-bottom: 0px
            float: left
            max-width: 350px
            min-width: 350px

        .field-label
            color: #b4b3b3
            font-style: italic
            padding-left: 6px
            text-align: right

        .field-label-header
            color: #7f7f7f
            font-style: italic
            padding-left: 2px
            text-align: left
            font-family: 'Quicksand'

        .subtitle-label
            color: #7f7f7f
            font-style: italic
            padding-left: 6px
            text-align: center

        .field-value
            padding-right: 25px
            padding-left: 5px
            word-break: break-word

        .summary-field-value
            font-size: 12px
            word-break: break-word
            padding-left: 1px
            padding-right: 1px
            color: #888888
            text-align: left
</style>

<template>
    <v-card class="px-0 mx-1 my-1" outlined>
        <v-container class="cnv-summary-card">
            <v-row no-gutters flat style="font-family: Quicksand">
                <v-col cols="12" sm="12" xl="4" style="font-size: 22px">
                    Copy Number Details
                </v-col>
            </v-row>
            <v-container fluid grid-list-md style="overflow-y: scroll !important; padding-top: 0">
                <v-row wrap>
                    <cnv-line-viz v-if="hasCnvData" class="cnv-viz"
                                     ref="cnvLineViz"
                                     style="padding-top: 10px"
                                     :data="cnvCounts"
                                     :d3="d3">
                    </cnv-line-viz>
                </v-row>
            </v-container>
        </v-container>
    </v-card>
</template>


<script>
    import CnvLineViz from "./viz/CnvLineViz.vue"

    export default {
        name: 'variant-summary-card',
        components: {
            CnvLineViz
        },
        props: {
            d3: null,
            cohortModel: null,
            hasCnvData: {
                type: Boolean,
                default: false
            },
        },
        data() {
            return {
                cohortFieldsValid: true,
                coverageCounts: null,
                cnvCounts: null,
                rnaSeqCounts: null,
                atacSeqCounts: null,
                rawBamDialog: false,
                rules: {
                    numericRule: value => (!isNaN(value)) && parseInt(value) >= 0  || 'Must be a positive integer',
                },
                qualityCutoff: 10
            }
        },
        watch: {
            'cohortModel.cnvData': function() {
                let maxTcn = this.cohortModel.getMaxTcn(this.cohortModel.cnvData);
                let sampleLabels = this.cohortModel.selectedSamples;
                if (this.$refs.cnvLineViz) {
                    this.$refs.cnvLineViz.fillChart(this.cohortModel.cnvData, sampleLabels, maxTcn);
                }
            }
        },
        methods: {

        }
    }
</script>