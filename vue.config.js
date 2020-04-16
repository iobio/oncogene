module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  devServer: {
    disableHostCheck: true,
    // proxy: {
    //   '^/entrez/eutils/esearch.fcgi?db=gene&usehistory=y&retmode=json': {
    //     target: 'https://eutils.ncbi.nlm.nih.gov'
    //   },
    //   '^/entrez/eutils/esummary.fcgi?db=gene&usehistory=y&retmode=json': {
    //     target: 'https://eutils.ncbi.nlm.nih.gov'
    //   }
    // }
  }
}