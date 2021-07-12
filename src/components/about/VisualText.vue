<template>
  <v-card flat>
    <v-card-title class="about-content-title">visual elements</v-card-title>
    <v-card-text>
      <div class="about-content-text pb-6">{{aboutText1}}</div>
      <hr/>
      <img class="pt-5" src="../../assets/images/variants.png"/>
      <div class="about-content-text pb-10">{{aboutText2}}</div>
      <hr/>
      <img class="pt-5" src="../../assets/images/coverage.png"/>
      <div class="about-content-text pb-10">{{aboutText3}}</div>
      <hr/>
      <img class="pt-5" style="max-width: 950px" src="../../assets/images/cnv_details.png"/>
      <div class="about-content-text pb-10">{{aboutText4}}</div>
      <hr/>
      <img class="pt-5" style="max-width: 950px" src="../../assets/images/variant_details.png"/>
      <div class="about-content-text pb-10">{{aboutText5}}</div>
      <hr/>
      <img class="pt-5" style="max-width: 950px" src="../../assets/images/pileup.png"/>
      <div class="about-content-text pb-10">{{aboutText6}}</div>
      <hr/>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
name: "VisualText.vue",
  data: () => {
    return {
      aboutText1:
        "Oncogene.iobio integrates powerful visualizations to aid in data exploration and discovery.",
      aboutText2: "Examine single nucleotide variations and small insertions/deletions along the coordinate space",
      aboutText3: "Examine genomic and RNA-seq reads alongside variants",
      aboutText4: "Quickly assess copy number variation within the coordinate space, and click to view details",
      aboutText5: "Inspect variants of interest guided by key annotations from VEP, COSMIC, and ClinVar",
      aboutText6: "Examine alignments for a variant in the pileup view"
    }
  }
}
</script>

<style scoped lang="sass">
.about-content-title
  font-family: Quicksand
  font-size: 28px
  font-weight: 500
  color: rgba(0, 0, 0, 0.6)

.about-content-text
  font-family: Raleway
  font-size: 16px
  color: rgba(0, 0, 0, 0.6)
</style>