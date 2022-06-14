<template>
  <v-card class='full-width'>
    <v-card-title class="section-title">Subclone {{ selectedSubclone }} Variants ({{ totalVariants }} total)</v-card-title>
    <v-card-text id="dialog-card-text" class="px-5">
      <v-list style="max-height: 500px;"
              class="overflow-y-auto section-title">
        <v-list-group
            v-for="item in geneVarItems"
            :key="item.gene"
            v-model="item.active"
            value="true"
            no-action
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title v-text="formatGeneHeader(item.gene, item.variants.length)"></v-list-item-title>
            </v-list-item-content>
          </template>

          <v-list-item
              v-for="variant in item.variants"
              :key="variant.id"
          >
            <v-list-item-content>
              <v-list-item-title v-text="formatVarInfo(variant)"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>

export default {
  name: "subclone-dialog",
  props: {
    selectedSubclone: {
      type: String,
      default: ''
    },
    variantObj: {
      type: Object,
      default: null
    },
    d3: {
      type: Object,
      default: null
    },
    dialogOpen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      geneVarItems: []
    }
  },
  watch: {
    'dialogOpen': {
      handler() {
        this.geneVarItems = this.formatGeneVars(this.variantObj);
      },
      deep: true
    }
  },
  computed: {
    totalVariants: function() {
      return this.geneVarItems.length;
    }
  },
  methods: {
    drawCnv: function () {
      this.d3.select("#dialog-card-text").selectAll('svg').remove();

      let strippedChr = this.selectedGene.chr;
      if (this.selectedGene.chr.startsWith('chr')) {
        strippedChr = this.selectedGene.chr.substring(3);
      }
      this.drawShading(strippedChr);
      this.drawGene();
      this.drawIdeogram(strippedChr);
    },
    formatGeneVars: function (variantObj) {
      let items = [];
      Object.keys(variantObj).forEach(geneName => {
        let variants = variantObj[geneName];
        variants.forEach(variant => {
          if (!variant.chrom.startsWith('chr')) {
            variant.chrom = 'chr' + variant.chrom;
          }
        })
        items.push({
          gene: geneName,
          variants: variantObj[geneName],
          active: false
        });
      })

      items.sort((a, b) => {
        return a.gene.toUpperCase() < b.gene.toUpperCase() ? -1 : 1;
      })
      return items;
    },
    formatVarInfo: function (variant) {
      return variant.chrom + ': ' + variant.start + ' - ' + variant.end + ' ' + variant.ref + ' -> ' + variant.alt;
    },
    formatGeneHeader: function (gene, numVars) {
      return gene + ' (' + numVars + ')';
    }
  },
  mounted() {
    this.geneVarItems = this.formatGeneVars(this.variantObj);
  }
}
</script>

<style lang="sass">
    .section-title
      font-family: Quicksand

    .section-text
      font-family: Raleway

</style>