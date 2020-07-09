<!--SJG Aug2019; Adapted from gene.iobio and TDS Aug2018-->
<style lang="sass">
    .filter-form
        .slider-select
            padding-top: 0
            margin-top: -2px
            font-family: Quicksand

            .input-group__input
                i
                    padding: 0

                .input-group__selections
                    margin-left: 8px

    .slider-top-row
        padding-top: 15px

        .slider-bar
            padding-left: 15px
            padding-top: 0
            padding-right: 0

    .slider-bottom-row
        float: right
        text-align: right
        margin-top: -15px
        padding-right: 8px !important

        .slider-display
            padding-top: 0
            max-width: 45px
            height: 35px

            .input-group__input
                border-style: none

                input
                    text-align: right
                    font-size: 12px
                    border: none

        .slider-bar-value
            height: 15px
            margin-top: -5px
            color: $app-gray

        .slider-bar-input
            padding-top: 0
            width: 100px
            font-family: Quicksand

            .input-group__input
                margin-top: -5px

                input
                    font-size: 12px
                    text-align: center
                    color: $app-gray
                    padding-top: 8px
                span
                    font-size: 12px
                    color: $app-gray
                    padding-top: 8px

</style>

<template>
    <v-layout row wrap class="filter-form mx-2" style="max-width:500px;">
        <v-container>
            <v-row no-gutters>
                <v-col sm="6" md="3">
                    <v-select class="slider-select"
                              :items="dropDownOptions"
                              v-model="currLogic"
                              single-line
                              color="white"
                              style="margin-top: -15px"
                              :disabled="disableLogicDropdown">
                    </v-select>
                </v-col>
                <v-col sm="6" md="9" class="slider-top-row">
                    <v-slider dark :min="logicObj.minValue" :max="logicObj.maxValue" v-model="logicObj.currVal" class="slider-bar" @input="onSliderChange">
                    </v-slider>
                </v-col>
            </v-row>
            <v-row no-gutters style="margin-top: -15px">
                <v-col sm="6" md="9">
                    <!--Spacing-->
                </v-col>
                <v-col sm="6" md="3" class="slider-bottom-row">
                    <v-text-field v-model="logicObj.currVal" class="slider-bar-input" color="appColor" :suffix="logicObj.labelSuffix" type="number" @input="onSliderChange"></v-text-field>
                </v-col>
            </v-row>
        </v-container>
    </v-layout>
</template>

<script>
    export default {
        name: 'filter-panel-slider',
        components: {},
        props: {
            logicObj: {
              default: null,
              type: Object
            },
            annotationComplete: {
                default: false,
                type: Boolean
            },
        },
        data() {
            return {
                dropDownOptions: [
                    { text: '<' },
                    { text: '<=' },
                    { text: '=' },
                    { text: '>=' },
                    { text: '>' }
                ],
                disableLogicDropdown: false,
                currLogic: null,        // Note: have to use local prop and not model-backed one here because needs to be in dropDownOptions list
                firstExpansion: true    // Used to control slider mount preventing filter change
            }
        },
        watch: {
            currLogic: function(newVal, oldVal) {
                const self = this;
                if (newVal && oldVal && newVal.text !== oldVal.text) {
                    self.logicObj.active = true;
                    self.$emit('update-slider-logic', self.logicObj.name, newVal.text, self.logicObj.recallFilter);
                } else if (newVal == null) {
                    self.logicObj.active = false;
                }
            }
        },
        methods: {
            onSliderChange: function() {
                const self = this;
                if (self.firstExpansion) {
                    self.firstExpansion = false;
                } else {
                    self.logicObj.active = self.logicObj.currVal > 0;
                    self.logicObj.stagedLogic = self.logicObj.currLogic;
                    self.logicObj.stagedVal = self.logicObj.currVal;
                    self.$emit('filter-slider-changed');
                }
            }
        },
        mounted: function() {
            const self = this;
            if (self.logicObj && self.logicObj.defaultLogic) {
                const matchingLogic = self.dropDownOptions.filter((option) => {
                    return option.text === self.logicObj.defaultLogic;
                });
                self.currLogic = matchingLogic[0];
            }
        }
    }
</script>