<template>
  <v-card flat>
    <v-card-title class="about-content-title">data inputs & file formats</v-card-title>
    <v-card-text>
      <div class="about-content-text">{{aboutText1}}</div>
    </v-card-text>
    <v-card-subtitle class="about-content-subtitle">
      VCF files
    </v-card-subtitle>
    <v-card-text>
      <div class="about-content-text">{{aboutText2}}</div>
    </v-card-text>
    <v-card-subtitle class="about-content-subtitle">
      BAM files
    </v-card-subtitle>
    <v-card-text>
      <div class="about-content-text">{{aboutText3}}</div>
    </v-card-text>
    <v-card-subtitle class="about-content-subtitle">
      CNV files
    </v-card-subtitle>
    <v-card-text>
      <div class="about-content-text">{{aboutText4}}</div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
name: "AboutText.vue",
  data: () => {
    return {
      aboutText1:
        "Oncogene.iobio consumes primary data including Variant Call Format (vcf), " +
          "Binary Sequencing Alignment/Map (bam) files. Variant calls " +
          "are the only required input for the application to work. Optionally, copy number data " +
          "may be provided in the form of a tab-delimited file with certain required headers, " +
          "and coverage, raw RNAseq, and ATACseq reads may be provided in bam file format. " +
          "Files must be uploaded from cloud-based repositories, such as AWS S3.",
      aboutText2: "Oncogene.iobio accepts a single, multi-sample vcf file and requires a corresponding index (tbi) file." +
          " One normal sample and one tumor sample are required to be selected from the provided vcf file. " +
          "Up to four more tumor samples may also be selected. Oncogene.iobio supports genome builds GRCh37" +
          " and GRCh38.",
      aboutText3: "Oncogene.iobio requires one coverage (bam) file and one index (bai) file per sample. " +
          "Bam and bai files may exist in the same, or different, directories. If you don't have an index file," +
          " please read documentation for 'samtools index' to create one. Local files are not currently accepted. ",
      aboutText4: "Oncogene.iobio requires one copy number file per sample. This file must be tab-delimited and contain " +
          "the following five headers: chr, start, end, lcn.em, and tcn.em (corresponding to chromosome, start coordinate, " +
          "end coordinate, lesser copy number, and total copy number, respectively). Other data columns " +
          "may exist in your tab-delimited file, however they will be ignored. The Facets program (by MSKCC) program outputs an ideal file for this purpose."
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

.about-content-subtitle
  font-family: Quicksand
  font-size: 22px
  font-weight: 500
  color: rgba(0, 0, 0, 0.6)

.about-content-text
  font-family: Raleway
  font-size: 16px
  color: rgba(0, 0, 0, 0.6)
</style>