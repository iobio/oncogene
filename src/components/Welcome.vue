<template>
    <div :id="divId">
        <svg :width="welcomeWidth" :height="welcomeHeight">
            <g :transform="translation"></g>
        </svg>
    </div>
</template>

<script>
    import variantRainD3 from '../d3/VariantRain.d3.js'
    export default {
        name: "Welcome",
        props: {
            d3: {
                type: Object,
                default: null
            },
            welcomeWidth: {
                type: Number,
                default: 0
            },
            welcomeHeight: {
                type: Number,
                default: 0
            },
            navBarHeight: {
                type: Number,
                default: 0
            }
        },
        data: function () {
            return {
                divId: 'variantRainDiv'
            }
        },
        computed: {
            translation: function () {
                return'translate(20, 50)'
            }
        },
        methods: {
            makeItRain: function () {
                variantRainD3(this.d3, this.divId, this.welcomeWidth, this.welcomeHeight, this.navBarHeight);
            }
        },
        mounted: function () {
            this.makeItRain();
        }
    }
</script>

<style scoped>

</style>