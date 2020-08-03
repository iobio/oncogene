<!--SJG Jan2019; Adapted from gene.iobio and TDS Aug2018-->
<style lang="sass">
    .filter-form
        .input-group
            label
                padding-top: 5px
                padding-left: 15px
                font-size: 14px
                font-weight: normal
                color: black !important
                pointer-events: none !important
                cursor: default
</style>

<template>
    <v-layout row wrap class="filter-form mx-2 px-2" style="max-width:500px;">
        <v-flex xs12>
            <v-container fluid>
                <v-checkbox v-for="item in checkboxLists[parentFilterName]"
                            :key="item.name"
                            :label="item.displayName"
                            v-bind:disabled="!annotationComplete"
                            v-model="item.model"
                            dark
                            style="padding-left: 15px; margin-top: 0; margin-bottom: 0; max-height: 30px"
                            @click.stop="boxChecked(item)">
                </v-checkbox>
            </v-container>
        </v-flex>
    </v-layout>
</template>

<script>

    export default {
        name: 'filter-panel-checkbox',
        props: {
            parentFilterName: null,
            annotationComplete: {
                type: Boolean,
                default: true
            },
            checkboxLists: null
        },
        methods: {
            boxChecked: function(filterObj) {
                filterObj.model = !filterObj.model;
                this.$emit('filter-toggled', this.parentFilterName);
            }
        }
    }
</script>