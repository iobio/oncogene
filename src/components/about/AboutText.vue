<template>
  <v-card flat>
    <v-card-title class="about-content-title">about</v-card-title>
    <v-card-text>
      <div class="about-content-text">{{aboutText1}}</div>
      <br>
      <div class="about-content-text">{{aboutText2}}</div>
      <br>
      <div class="about-content-text">{{aboutText3}}</div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
name: "AboutText.vue",
  data: () => {
    return {
      aboutText1:
        "Next generation sequencing is rapidly becoming an integral part of cancer research and clinical patient care. " +
                "Although the primary data analysis tasks have largely been standardized (e.g. read alignment and variant calling), " +
            "the secondary analysis tasks, such as filtering for variants with high confidence, prioritizing somatic variants " +
            "with respect to their impact, identifying potential driver mechanisms, and proposing candidate genomic vulnerabilities " +
            "for targeted therapy, rely on a dispersed array of unintuitive tools requiring specialized computational skills. " +
            "To empower those with domain expertise but without technical knowledge in accomplishing such critical analyses, " +
            "we have developed oncogene.iobio.",
      aboutText2: "Oncogene.iobio consumes multi-omic primary sequencing data in standard formats (vcf/bam files) made available " +
          "securely from cloud-based repositories (e.g. AWS S3). It incorporates functional annotation and cancer-specific gene/variant" +
          " databases such as VEP, COSMIC, CIViC, NCG, and others. Users specify the sample relationships (e.g. multiple longitudinally-acquired " +
          "cancer samples from the same patient), select genes of interest (via an app-supplied panel or custom provided list), " +
          "include additional available data types (e.g. RNA or Methyl-Seq), and define criteria for somatic variant identification " +
          "(e.g. variant allele frequency > 0.1 in tumor samples, and <0.05 in the matched normal sample). Genes are ranked according " +
          "to their oncogenic likelihood (i.e. how many somatic variants with increasing functional impact, and chromosomal CNVs, " +
          "they contain) and users may further explore each identified site with interactive visualizations. Uniquely, when " +
          "filtering criteria such as allele frequency or other quality metrics are changed, oncogene.iobio will dynamically " +
          "re-run the filtering and annotation pipeline, and render the updated results immediately. Furthermore, oncogene.iobio " +
          "integrates all provided data types, highlighting regions of a gene with abnormal copy number states, significant " +
          "transcriptional changes, and hypo- or hyper-methylated sites.",
      aboutText3: "With integrative visualizations and intuitive operation, oncogene.iobio aims to help investigators of all " +
          "computational skill levels identify disease drivers and therapeutic targets, and thereby support oncological research and diagnostic care."
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