<template>
    <div id="">

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
          }
        },
        data: function() {
            return {
                divId: 'variantRainDiv',
            }
        },
        methods: {
            makeItRain: function() {
                variantRainD3(this.d3);
            }
        },
        mounted: function() {
            this.makeItRain();
        }
    }
</script>

<style scoped>

</style>