<template>
    <v-app>
        <v-app-bar app dark color=darkPrimary>
            <v-toolbar-title class="headline text-uppercase">
                <span id="title">Oncogene.iobio</span>
            </v-toolbar-title>
            <v-toolbar-title style="padding-bottom:15px">
                <span id="beta-title">beta</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
                    text
                    href="http://iobio.io"
                    target="_blank"
            >
                <files-menu
                        ref="fileMenuRef"
                        :cohortModel="cohortModel"
                        @update-samples="onUpdateSamples"
                        @on-files-loaded="onFilesLoaded"
                        @load-demo-data="onLoadDemoData"
                >
                </files-menu>
                <span class="mr-2">an iobio project</span>
            </v-btn>
        </v-app-bar>

        <v-content>
            <Home/>
        </v-content>
    </v-app>
</template>

<script>
    import Home from './components/Home';
    import FilesMenu from './components/FilesMenu'

    export default {
        name: 'App',
        components: {
            Home,
            FilesMenu
        },
        data: () => {
            return {
                cohortModel: null
            }
        },
        methods: {
            onLoadDemoData: function (loadAction) {
                this.$emit("load-demo-data", loadAction);
            },
            onFilesLoaded: function (analyzeAll) {
                this.$emit("on-files-loaded", analyzeAll);
            },
            onUpdateSamples: function () {
                this.$emit('update-samples');
            },
        }
    };
</script>
<style scoped lang="sass">
    #title
        font-family: Quicksand
        font-weight: 500

        #beta-title
            font-style: italic
            font-size: 16px
            margin-right: 5px
            margin-left: 0px
            color: yellow
</style>
