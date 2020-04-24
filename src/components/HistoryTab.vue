<!--Adapted from gene.iobio and TDS 17Aug2018-->

<style lang="sass">
    .history-card
        .toolbar__title
            font-size: 14px !important
            font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif' !important
            color: #7f7f7f
            font-style: italic
            font-weight: 500 !important
        .toolbar__content
            background-color: white
            height: 100px
</style>

<template>
    <v-layout row style="padding-top: 10px">
        <v-flex xs12>
            <v-card class="history-card">
                <v-toolbar flat>
                    <v-toolbar-title>Re-visit genes previously analyzed by clicking the icon</v-toolbar-title>
                </v-toolbar>
                <v-divider style="margin: 0"></v-divider>
                <v-list>
                    <v-list-tile v-for="item in geneHistoryList" :key="item" avatar @click="reloadGene(item)">
                        <v-list-tile-action>
                            <v-icon color="cohortBlue">replay</v-icon>
                        </v-list-tile-action>
                        <v-list-tile-content>
                            <v-list-tile-title v-text="item"></v-list-tile-title>
                        </v-list-tile-content>
                    </v-list-tile>
                </v-list>
            </v-card>
        </v-flex>
    </v-layout>
</template>


<script>
    export default {
        name: 'history-tab',
        components: {},
        props: {
            geneHistoryList: {
                type: Array,
                default: []
            }
        },
        data() {
            return {}
        },
        watch: {},
        methods: {
            reloadGene(geneName) {
                let self = this;
                self.$emit('reload-gene-history', geneName);
            }
        },
        computed: {},
        created: function () {
        },
        mounted: function () {
        }
    }
</script>
