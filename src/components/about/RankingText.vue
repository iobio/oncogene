<template>
  <v-card flat>
    <v-card-title class="about-content-title">gene scoring & ranking</v-card-title>
    <v-card-text>
      <div class="about-content-text">{{aboutText1}}</div>
    <v-list disabled>
      <v-list-item-group>
        <v-list-item
        v-for="(item, i) in items" :key="i">
          <v-list-item-icon>
            <v-icon small :color="item.color">circle</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="about-content-text" v-text="item.text"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
name: "RankingText.vue",
  data: () => {
    return {
      aboutText1:
        "Oncogene ranks genes based on the number of somatic variants (SNPs and small indels) and somatic, abnormal copy number variations (CNVs) they contain: " +
          "the higher the number of variants and abnormal CNVs, the higher a gene will be ranked. " +
          "Further, variants carry more weight relative to their functional impact (as annotated by VEP), and their presence in the COSMIC database. If copy number data is supplied, " +
          "this is additionally incorporated into the scoring algorithm. Specifically, scores " +
          "are calculated by tallying the following per gene:",
      items: [
        { text: "+4 per variant with HIGH impact", color: '#E0292B'},
        { text: "+3 per variant with MODERATE impact", color: '#F49A73'},
        { text: "+2 per variant with LOW impact", color: '#b5cf6a'},
        { text: "+1 per variant with MODIFIER impact", color: '#f9e4b5'},
        { text: "+1 if variant exists in COSMIC db", color: '#888888'},
        { text: "+1 if variant falls within a region where total copy number != 2", color: '#cf7676'},
        { text: "+1 if a gene contains an abnormal CNV (regardless of if it contains a SNP or indel in the region) ", color: '#cf7676'},
      ]
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