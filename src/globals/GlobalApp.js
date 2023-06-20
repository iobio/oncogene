/*  These app.global variables determine which iobio servers the gene.iobio app with interact
    with for a local deployment.  This entire .js can be replaced or modified to suit the
    specific iobio deployment environment.
*/
class GlobalApp {
  constructor($, d3, _) {
    this.GALAXY_TEST_MODE      = false;
    this.cnvDemoMode           = false;

    this.cacheHelper           = null;
    this.tour                  = "";
    this.completedTour         = "";

    this.version               = "3.0.5";

    this.DEV_IOBIO             = "nv-dev-new.iobio.io/";
    this.GREEN_IOBIO           = "nv-green.iobio.io/";
    this.STAGE_IOBIO           = this.GREEN_IOBIO;
    this.PROD_IOBIO            = "nv-prod.iobio.io/";
    this.CURRENT_IOBIO         = this.PROD_IOBIO;


    this.isOffline             = false;          // is there any internet connect to outside services and resources?
    this.isClinvarOffline      = false;          // is clinvar offline?  (Pull from clinvar hosted from URL?)
    this.accessNCBIGeneSummary = true;           // is it okay to access NCBI web resources to obtain the refseq gene summary?  In cases where the server and client are COMPLETELY offline, set this to false.

    this.useOnDemand           = true;           // use on demand tabix and samtools

    this.serverInstance        = "@hostname@/";  // this will be replace with the name of the server used for this deployement
    this.serverCacheDir        = "local_cache/"; // this is the directory from the server instance where resource files (like clinvar vcf) will be served
    this.serverDataDir         = "local_cache/"; // this is the directory from the server instance where data files will be served
    this.offlineUrlTag         = "site:";        // this is the first part if the vcf/bam URL that indicates that a special URL should be constructed to get to files served from the local isntance

    this.useSSL                = true;
    this.useServerCache        = false;

    this.d3                    = d3;
    this.$                     = $;
    this._                     = _;

    this.IOBIO_SERVICES        = this.isOffline              ? this.serverInstance : this.CURRENT_IOBIO;
    this.HTTP_SERVICES         = (this.useSSL ? "https://" : "http://") + "backend.iobio.io" + "/";
    this.emailServer           = (this.useSSL ? "wss://" : "ws://") +   this.IOBIO_SERVICES + "email/";


    this.hpoLookupUrl          = this.HTTP_SERVICES + "hpo/hot/lookup/?term=";

    // config files
    this.siteConfigUrl         =  "https://s3.amazonaws.com/gene.iobio.config/site-config.json";
    this.clinvarGenesUrl       =  "https://s3.amazonaws.com/gene.iobio.config/clinvar-counts.txt";

    // Get clinvar annotations from 'eutils' or 'vcf'
    this.clinvarSource         = "vcf";


    // get hgvs, rsid annotation for all variants
    this.getVariantIdsForGene = false;

    // How many genes can be analyzed in one session.  Set to null if no limitation.
    this.maxGeneCount         = 100;

    // Should vep retrieve allele frequencies (for gnomad, 1000G, ESP)
    this.vepAF                = true;
    this.useVEP               = false; // True if we want to use the old slow version of annotateSomaticVariants

    this.vepREVELFile         = './vep-cache/revel_all_chromosomes_for_vep.tsv.gz';

    // What browser cache implementation is used: 'localStorage' or 'indexedDB'
    this.BROWSER_CACHE_LOCAL_STORAGE = 'localStorage';
    this.BROWSER_CACHE_INDEXED_DB    = 'indexedDB';
    this.defaultBrowserCache         = this.BROWSER_CACHE_INDEXED_DB;

    this.BROWSER_CACHE_EXPIRATION    = 3 * 60 * 60 * 1000;  // 3 HOURS



    this.feedbackEmails              = "gene.iobio.feedback@gmail.com";  // what emails should feedback be sent to?   if no emails are provided, the feedback link will be hidden
    this.feedbackAttachScreenCapture = false;          // should the feedback include a screen capture?
    this.feedbackShowURL             = false;         // show the feedback email show the URL that launched gene.iobio?

    this.autocall                    = null       // If only alignments provided, should variants be automatically called when gene is selected?


    this.DEFAULT_BATCH_SIZE          = 10;              // how many genes can be analyzed simultaneously for 'Analyze all'

    this.keepLocalStorage            = false; // maintain cache between sessions?
    this.eduModeVariantSize          = 10;

    // Fields
    this.impactFieldToFilter         = 'highestImpactVep';
    this.impactFieldToColor          = 'vepImpact';

    this.COVERAGE_TYPE = 'coverage';
    this.RNASEQ_TYPE = 'rnaSeq';
    this.ATACSEQ_TYPE = 'atacSeq';

    this.INDIV_QUALITY_CUTOFF = 10; // ~99% assurance of read alignment

    this.useCnvDemo = true;
  }

    getClinvarUrl(build, forVizTrack = false) {
        let clinvarVizUrls = {
            'GRCh37': "ftp://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh37/archive_2.0/2018/clinvar_20181202.vcf.gz",
            'GRCh38': "ftp://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/archive_2.0/2018/clinvar_20181202.vcf.gz"
        };
        let clinvarAnnotationUrls = {
            'GRCh37': 'https://iobio.s3.amazonaws.com/gene/clinvar/clinvar.GRCh37.vcf.gz',
            'GRCh38': 'https://iobio.s3.amazonaws.com/gene/clinvar/clinvar.GRCh38.vcf.gz'
        };
        if (forVizTrack) {
          return clinvarVizUrls[build];
        } else {
          return clinvarAnnotationUrls[build];
        }
      }
    /* Updated 05Sept2019 to v90 */
    getCosmicUrl(build) {
        // These have VEP impact assigned
        // todo: host these privately on Mosaic
        let cosmicUrls = {
            'GRCh37': "https://iobio.s3.amazonaws.com/samples/vcf/cosmic.coding.norm.v96.GRCh37.vcf.gz",
            'GRCh38': "https://iobio.s3.amazonaws.com/samples/vcf/cosmic.coding.norm.v96.GRCh38.vcf.gz"
        };
        return cosmicUrls[build];
    }

    /* Returns three-letter code for AA corresponding to provided single-letter AA argument.
     * If no matching three-letter code is found, returns single-letter argument. */
    convertAa(singleAa) {
        if (!singleAa) {
            console.log('Problem getting AA - no single code provided');
            return '?';
        }

        const aaMap = {
            'A': 'Ala',
            'C': 'Cys',
            'D': 'Asp',
            'E': 'Glu',
            'F': 'Phe',
            'G': 'Gly',
            'H': 'His',
            'I': 'Ile',
            'K': 'Lys',
            'L': 'Leu',
            'M': 'Met',
            'N': 'Asn',
            'P': 'Pro',
            'Q': 'Gln',
            'R': 'Arg',
            'S': 'Ser',
            'T': 'Thr',
            'V': 'Val',
            'W': 'Trp',
            'Y': 'Tyr'
        };
        let threeAa = aaMap[singleAa];
        if (!threeAa && singleAa.includes('X')) {
            threeAa = '*';
        }
        return threeAa ? threeAa : singleAa;
    }

    // Returns 'N' for GRCh37; 'chrN' for GRCh38
    // If cannot parse build from chrString, returns null
    getChrByBuild(chrString, genomeBuild) {
        if (genomeBuild === 'GRCh37') {
            if (chrString.startsWith('chr')) {
                return genomeBuild.substring(3);
            }
        } else {
            if (!chrString.startsWith('chr')) {
                return 'chr' + chrString;
            } else {
                return chrString;
            }
        }
        console.log('Could not parse build according to provided string: ' + chrString);
        return null;
    }
}

export default GlobalApp

