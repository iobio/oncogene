<template>
  <v-card flat>
    <v-card-title class="about-content-title">filtering variants</v-card-title>
    <v-card-text>
      <div class="about-content-text">{{aboutText1}}</div>
      <v-list disabled>
        <v-list-item-group>
          <v-list-item
              v-for="(desc, i) in somaticDesc" :key="i">
            <v-list-item-icon>
              <v-icon small color="primary">circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="about-content-text" v-text="desc"></v-list-item-title>
              <v-list-item-subtitle class="about-content-subtext" v-text="somaticDefaults[i]"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      <div class="about-content-text pt-5">{{aboutText2}}</div>
      <v-list disabled>
        <v-list-item-group>
          <v-list-item
              v-for="(desc, i) in qualityDesc" :key="i">
            <v-list-item-icon>
              <v-icon small color="primary">circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="about-content-text" v-text="desc"></v-list-item-title>
              <v-list-item-subtitle class="about-content-subtext" v-text="qualityDefaults[i]"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
name: "FilteringText.vue",
  data: () => {
    return {
      somaticDesc: [
        "Tumor Allele Frequency: the number of alternate allele observations divided by the total allele observations in any tumor sample",
        "Tumor Alternate Observations: the number of alternate allele observations in any tumor sample",
        "Normal Allele Frequency: the number of alternate allele observations divided by the total allele observations in the normal sample",
        "Normal Alternate Observations: the number of alternate allele observations in the normal sample",
      ],
      somaticDefaults: [
        "Default criteria is greater than or equal to 10%",
        "Default criteria is greater than or equal to 5",
        "Default criteria is less than or equal to 5%",
        "Default criteria is less than or equal to 10",
      ],
      qualityDesc: [
        "Total Observations: all observations covering the starting position of the variant",
        "Quality Score: phred-scaled quality score for the alternative allele assertion (high scores indicate high confidence calls)"
      ],
      qualityDefaults: [
        "Default criteria is greater than or equal to 10",
        "Default criteria is greater than or equal to 20",
      ],
      aboutText1:
        "Oncogene.iobio uniquely allows users to filter variants based on custom somatic criteria: ",
      aboutText2: "Users may also filter somatic variants based on quality: ",
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

.about-content-subtext
  font-family: Raleway
  font-size: 14px
  color: rgba(0, 0, 0, 0.6)
  font-style: italic
</style>