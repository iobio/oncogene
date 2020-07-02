<!--Adapted from gene.iobio and TDS 17Aug2018-->

<style lang="sass">
    .section-title
        font-family: 'Quicksand'
        color: white
        background-color: #7f1010
        padding-bottom: 5px

    .filter-settings-form
        background-color: transparent !important

        .filter-category
            font-size: 18px
            font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif'
            vertical-align: top
            background-color: transparent

        .filter-title
            font-size: 14px
            font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif'
            vertical-align: top
            margin-left: 6px
        svg
            width: 22px
            height: 18px
        .remove-custom-filter
            margin: 0px
            float: right

        .recall-btn
            font-family: 'Open Sans', 'Quattrocento Sans', 'sans serif'

    #filter-settings-icon
        font-size: 20px
        color: $app-color
</style>

<template class="pa-0">
    <v-card flat tile dark width="100%" class="filter-settings-form mx-1">
        <div class="text-center px-1 py-1">
            <div>
                <v-btn class="mx-1 recall-btn" color="brightPrimary" v-if="recallCriteriaSet" @click="recallSomaticVariants">
                    Recall Somatic Variants
                </v-btn>
                <v-btn class="mx-1 recall-btn" v-if="recallCriteriaSet" @click="clearRecallCriteria">
                    Cancel
                </v-btn>
            </div>
        </div>
        <v-card flat
                color="transparent"
                v-for="category in filterModel.filterCategories"
                :ref="category.name + 'ExpansionRef'"
                :key="category.name"
                :value="category.custom">
            <v-card-title class="filter-category px-0">
                <v-icon small style="padding-left: 5px; padding-right: 5px" color="white">
                    {{category.icon}}
                </v-icon>
                {{ category.display }}
            </v-card-title>
            <v-card-text><i>{{category.description}}</i></v-card-text>
            <filter-panel
                    v-if="category.name !== 'coverage'"
                    ref="filterSettingsRef"
                    :filterName="category.name"
                    :filterModel="filterModel"
                    :filter="category"
                    :annotationComplete="annotationComplete"
                    :applyFilters="applyFilters"
                    @filter-change="onFilterChange">
            </filter-panel>
        </v-card>
    </v-card>
</template>


<script>
    import FilterPanel from './FilterPanel.vue'

    export default {
        name: 'filter-panel-menu',
        components: {
            FilterPanel
        },
        props: {
            filterModel: null,
            showCoverageCutoffs: null,
            annotationComplete: {
                type: Boolean,
                default: false
            },
            applyFilters: {
                type: Boolean,
                default: false
            },
        },
        data() {
            return {
                showMenu: true,
                recallCriteriaSet: false
            }
        },
        methods: {
            onFilterChange: function(recallFilter) {
                if (recallFilter) {
                    this.recallCriteriaSet = true;
                } else {
                    this.$emit('filter-change');
                }
            },
            recallSomaticVariants: function() {
                this.$emit('recall-somatic-variants');
            },
            clearRecallCriteria: function() {
                // todo: keep record of last called in filterModel and pull from there
            }
        },
    }
</script>
