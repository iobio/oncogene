export default class Translator {

  constructor(globalApp, glyph) {
    this.globalApp = globalApp;
    this.glyph = glyph;

    this.HIGH = 'HIGH',
    this.MODERATE = 'MODERATE',
    this.MODIFIER = 'MODIFIER',
    this.LOW = 'LOW';


    this.clinvarMap     = {
              'pathogenic'            : {value: 1,   badge: true, examineBadge: true, clazz: 'clinvar_path', symbolFunction: this.glyph.showClinVarSymbol},
              'pathogenic/likely_pathogenic' :
                                        {value: 2,   badge: true, examineBadge: true, clazz: 'clinvar_path', symbolFunction: this.glyph.showClinVarSymbol},
              'likely_pathogenic'     : {value: 3,   badge: true, examineBadge: true, clazz: 'clinvar_lpath', symbolFunction: this.glyph.showClinVarSymbol},
              'uncertain_significance': {value: 4,   badge: true, examineBadge: true, clazz: 'clinvar_uc', symbolFunction: this.glyph.showClinVarSymbol},
              'conflicting_interpretations_of_pathogenicity':
                                        {value: 4,   badge: true, examineBadge: true, clazz: 'clinvar_cd', symbolFunction: this.glyph.showClinVarSymbol},
              'conflicting_data_from_submitters':
                                        {value: 5,   badge: true,  examineBadge: true, clazz: 'clinvar_cd', symbolFunction: this.glyph.showClinVarSymbol},
              'drug_response'         : {value: 131, badge: false, examineBadge: true, clazz: 'clinvar_other', symbolFunction: this.glyph.showClinVarSymbol},
              'confers_sensitivity'   : {value: 131, badge: false, examineBadge: true, clazz: 'clinvar_other', symbolFunction: this.glyph.showClinVarSymbol},
              'risk_factor'           : {value: 131, badge: false, examineBadge: true, clazz: 'clinvar_other', symbolFunction: this.glyph.showClinVarSymbol},
              'other'                 : {value: 131, badge: false, examineBadge: true, clazz: 'clinvar_other', symbolFunction: this.glyph.showClinVarSymbol},
              'association'           : {value: 131, badge: false, examineBadge: true, clazz: 'clinvar_other', symbolFunction: this.glyph.showClinVarSymbol},
              'protective'            : {value: 131, badge: false, examineBadge: true, clazz: 'clinvar_other', symbolFunction: this.glyph.showClinVarSymbol},
              'not_provided'          : {value: 131, badge: false, examineBadge: true, clazz: 'clinvar_other', symbolFunction: this.glyph.showClinVarSymbol},
              'likely_benign'         : {value: 141, badge: false, examineBadge: true, clazz: 'clinvar_lbenign', symbolFunction: this.glyph.showClinVarSymbol},
              'benign/likely_benign'  : {value: 141, badge: false, examineBadge: true, clazz: 'clinvar_lbenign', symbolFunction: this.glyph.showClinVarSymbol},
              'benign'                : {value: 151, badge: false, examineBadge: true, clazz: 'clinvar_benign', symbolFunction: this.glyph.showClinVarSymbol},
              'none'                  : {value: 161, badge: false, examineBadge: false, clazz: ''}
                       };
    this.somaticMap = {
              'isSomatic'             : {value: 1,   badge: true, examineBadge: true, clazz: 'impact_SOMATIC', symbolFunction: this.glyph.showSomaticSymbol},
              'isInherited'           : {value: 2,   badge: false, examineBadge: false, clazz: ''},
              'undetermined'          : {value: 3,   badge: true, examineBadge: true, clazz: 'impact_UNDETERMINED', symbolFunction: this.glyph.showUndeterminedSymbol}
                      };
    this.cosmicMap = {
              'inCosmic'             : {value: 1,   badge: true, examineBadge: true, clazz: 'in_cosmic', symbolFunction: this.glyph.showCosmicSymbol},
              'notInCosmic'          : {value: 104, badge: true, examineBadge: true, clazz: ''},
    };

    this.impactMap = {
                        HIGH:     {value: 1, badge: true, clazz: 'impact_HIGH',     symbolFunction: this.glyph.showImpactSymbol},
                        MODERATE: {value: 2, badge: true, clazz: 'impact_MODERATE', symbolFunction: this.glyph.showImpactSymbol},
                        MODIFIER: {value: 3, badge: false, clazz: 'impact_MODIFIER', symbolFunction: this.glyph.showImpactSymbol},
                        LOW:      {value: 4, badge: false, clazz: 'impact_LOW',      symbolFunction: this.glyph.showImpactSymbol},
                        none:     {value: 5, badge: false, clazz: 'impact_none',      symbolFunction: this.glyph.showImpactSymbol}
                     };
    this.highestImpactMap = {
                        HIGH:     {value: 1, badge: true, clazz: 'impact_HIGH',     symbolFunction: this.showHighestImpactSymbol, bind: this},
                        MODERATE: {value: 2, badge: true, clazz: 'impact_MODERATE', symbolFunction: this.showHighestImpactSymbol, bind: this},
                        MODIFIER: {value: 3, badge: false, clazz: 'impact_MODIFIER', symbolFunction: this.showHighestImpactSymbol, bind: this},
                        LOW:      {value: 4, badge: false, clazz: 'impact_LOW',      symbolFunction: this.showHighestImpactSymbol, bind: this}
                     };

    this.bcsqImpactMap = {
        transcript_ablation: { impact: this.HIGH },
        splice_acceptor_variant: { impact: this.HIGH },
        splice_donor_variant: { impact: this.HIGH },
        stop_gained: { impact: this.HIGH },
        frameshift_variant: { impact: this.HIGH },
        stop_lost: { impact: this.HIGH },
        start_lost: { impact: this.HIGH },
        transcript_amplification: { impact: this.HIGH },
        inframe_insertion : { impact: this.MODERATE },
        inframe_deletion : { impact: this.MODERATE },
        missense_variant : { impact: this.MODERATE },
        protein_altering_variant : { impact: this.MODERATE },
        splice_region_variant : { impact: this.LOW },
        splice_donor_5th_base_variant : { impact: this.LOW },
        splice_donor_region_variant : { impact: this.LOW },
        splice_polypyrimidine_tract_variant : { impact: this.LOW },
        incomplete_terminal_codon_variant : { impact: this.LOW },
        start_retained_variant : { impact: this.LOW },
        stop_retained_variant : { impact: this.LOW },
        synonymous_variant : { impact: this.LOW },
        coding_sequence_variant : { impact: this.MODIFIER },
        mature_miRNA_variant : { impact: this.MODIFIER },
        five_prime_UTR_variant : { impact: this.MODIFIER },
        three_prime_UTR_variant : { impact: this.MODIFIER },
        non_coding_transcript_exon_variant : { impact: this.MODIFIER },
        intron_variant : { impact: this.MODIFIER },
        NMD_transcript_variant : { impact: this.MODIFIER },
        non_coding_transcript_variant : { impact: this.MODIFIER },
        upstream_gene_variant : { impact: this.MODIFIER },
        downstream_gene_variant : { impact: this.MODIFIER },
        TFBS_ablation : { impact: this.MODIFIER },
        TFBS_amplification : { impact: this.MODIFIER },
        TF_binding_site_variant : { impact: this.MODIFIER },
        regulatory_region_ablation : { impact: this.MODERATE },
        regulatory_region_amplification : { impact: this.MODIFIER },
        feature_elongation : { impact: this.MODIFIER },
        regulatory_region_variant : { impact: this.MODIFIER },
        feature_truncation : { impact: this.MODIFIER },
        intergenic_variant : { impact: this.MODIFIER }
    };

    this.siftMap = {
                      deleterious:                 {value: 1, badge: true, clazz: 'sift_deleterious', symbolFunction: this.glyph.showSiftSymbol},
                      deleterious_low_confidence:  {value: 2, badge: true, clazz: 'sift_deleterious_low_confidence', symbolFunction: this.glyph.showSiftSymbol},
                      tolerated_low_confidence: {value: 3, badge: false, clazz: 'sift_tolerated_low_confidence',symbolFunction: this.glyph.showSiftSymbol},
                      tolerated:    {value: 102, badge: false, clazz: 'sift_tolerated',symbolFunction: this.glyph.showSiftSymbol},
                      unknown:      {value: 103, badge: false, clazz: ''},
                      none:         {value: 103, badge: false, clazz: ''}
                    };
    this.polyphenMap = {
                      probably_damaging:    {value: 1, badge: true, clazz: 'polyphen_probably_damaging', symbolFunction: this.glyph.showPolyPhenSymbol},
                      possibly_damaging:    {value: 2, badge: true, clazz: 'polyphen_possibly_damaging', symbolFunction: this.glyph.showPolyPhenSymbol},
                      benign:               {value: 103, badge: false, clazz: 'polyphen_benign',            symbolFunction:this.glyph.showPolyPhenSymbol},
                      unknown:              {value: 104, badge: false, clazz: ''},
                      none:                 {value: 104, badge: false, clazz: ''}
                       };
    this.inheritanceMap = {
                      denovo:               {value: 1, badge: true,  clazz: 'denovo',       display: 'de novo',      symbolFunction: this.glyph.showDeNovoSymbol},
                      recessive:            {value: 2, badge: true,  clazz: 'recessive',    display: 'recessive',    symbolFunction: this.glyph.showRecessiveSymbol},
                      'x-linked':           {value: 3, badge: true,  clazz: 'x-linked',     display: 'x-linked',     symbolFunction: this.glyph.showXLinkedSymbol},
                      'compound het':       {value: 4, badge: true,  clazz: 'compound-het', display: 'compound het', symbolFunction: this.glyph.showCompoundHetSymbol},
                      'autosomal dominant': {value: 5, badge: true,  clazz: 'autosomal-dominant', display: 'autosomal dominant', symbolFunction: this.glyph.showAutosomalDominantSymbol},
                      none:                 {value: 3, badge: false, clazz: 'noinherit',    display: '',             symbolFunction: this.glyph.showNoInheritSymbol}
                       };
    this.zygosityMap = {
                      HOM:        {value: 1, badge: true,  clazz: 'zyg_hom',        symbolFunction: this.glyph.showHomSymbol},
                      HET:        {value: 2, badge: false, clazz: 'het'        },
                      HOMREF:     {value: 3, badge: false, clazz: 'homref'     },
                      gt_unknown: {value: 4, badge: false, clazz: 'gt_unknown' }
                       };

    this.alleleFreqMap = {
                      'tumorSample'  : {value: 1,   badge: true, examineBadge: true, clazz: '', symbolFunction: this.glyph.showTumorSampleSymbol},
                      'normalSample' : {value: 2,   badge: true, examineBadge: true, clazz: '', symbolFunction: this.glyph.showNormalSampleSymbol},
    };

  this.filtersPassedMap = {
      'pathogenic':        {value: 1, badge: false, clazz: 'system-flagged',  symbolFunction: this.glyph.showFlaggedSymbol},
      'somatic':           {value: 1, badge: false, clazz: 'system-flagged',  symbolFunction: this.glyph.showFlaggedSymbol},
      'compoundHet':       {value: 1, badge: false, clazz: 'system-flagged',  symbolFunction: this.glyph.showFlaggedSymbol},
      'high':              {value: 2, badge: false, clazz: 'system-flagged',  symbolFunction: this.glyph.showFlaggedSymbol},
      'userFlagged':       {value: 3, badge: false, clazz: 'user-flagged',    symbolFunction: this.glyph.showFlaggedSymbol},
      'notCategorized':    {value: 3, badge: false, clazz: 'user-flagged',    symbolFunction: this.glyph.showFlaggedSymbol},
      'notFound':          {value: 3, badge: false, clazz: 'user-flagged',    symbolFunction: this.glyph.showFlaggedSymbol},
      '':                  {value: 3, badge: false, clazz: '',                symbolFunction: ''}
  };

    this.unaffectedMap = {
                          present_some:   {value: 104, badge: false, clazz: 'unaffected', symbolFunction: this.glyph.showAffectedPresentSymbol},
                          present_all:    {value: 104, badge: false, clazz: 'unaffected', symbolFunction: this.glyph.showAffectedPresentSymbol},
                          present_none:   {value: 104, badge: false, clazz: 'unaffected', symbolFunction: this.glyph.showAffectedPresentSymbol},
                          none:           {value: 104, badge: false, clazz: 'unaffected', symbolFunction: ''}
                   };
    this.affectedMap = {
                          present_all:    {value: 3,   badge: true,  clazz: 'affected',  symbolFunction: this.glyph.showAffectedPresentSymbol},
                          present_some:   {value: 4,   badge: true,  clazz: 'affected',  symbolFunction: this.glyph.showAffectedPresentSymbol},
                          present_none:   {value: 104, badge: false, clazz: 'affected',  symbolFunction: this.glyph.showAffectedPresentSymbol},
                          none:           {value: 104, badge: false, clazz: 'affected',  symbolFunction: ''}
                   };
      this.harmfulVariantMap = {
                          1:    {value: 1,   badge: true,  clazz: 'harmful1-variant',  symbolFunction: this.glyph.showHarmfulVariantSymbol},
                          2:    {value: 2,   badge: true,  clazz: 'harmful2-variant',  symbolFunction: this.glyph.showHarmfulVariantSymbol},
                          3:    {value: 3,   badge: true,  clazz: 'harmful3-variant',  symbolFunction: this.glyph.showHarmfulVariantSymbol},
                          none: {value: 101, badge: false, clazz: '',                  symbolFunction: ''}
                   };
    // For af range, value must be > min and <= max
    this.afHighestMap = [ {min: -100.1, max: -100,   value: +99, badge: false, clazz: '',    symbolFunction: ''},
                         {min: -1.1,   max: +0,        value: +2,  badge: true, clazz: 'afhighest_rare',    symbolFunction: this.glyph.showAfRareSymbol},
                         {min: -1.1,   max: +.0001,    value: +3,  badge: true, clazz: 'afhighest_rare',    symbolFunction: this.glyph.showAfRareSymbol},
                         {min: -1.1,   max: +.001,     value: +4,  badge: true, clazz: 'afhighest_rare',    symbolFunction: this.glyph.showAfRareSymbol},
                         {min: -1.1,   max: +.01,      value: +5,  badge: true, clazz: 'afhighest_rare',    symbolFunction: this.glyph.showAfRareSymbol},
                         {min: -1.1,   max: +.05,      value: +6,  badge: true, clazz: 'afhighest_rare',    symbolFunction: this.glyph.showAfRareSymbol},
                         {min: +.05,   max: +1,        value: +7,  badge: false,clazz: '',    symbolFunction: ''},
                        ];

      this.filterNameMap = {
          'pValue': 'pVal',
          'adjPVal': 'adjustedLevel',
          'g1000': 'af1000G',
          'exac': 'afExAC',
          'gnomad': 'afgnomAD',
          'probandFreq': 'probandFreq',
          'subsetFreq': 'subsetFreq'
      }
  }

  getInheritanceLabel(inheritance) {
    var map = this.inheritanceMap[inheritance];
    return map ? map.display : inheritance;
  }

  getSomaticLabel(isInherited) {
      if (isInherited === false) {
          return 'somatic';
      } else if (isInherited === true) {
          return 'inherited';
      } else {
          return 'undetermined';
      }
  }

  getCosmicLabel(inCosmic) {
      return inCosmic === true ? 'COSMIC variant' : '';
  }

  showHighestImpactSymbol(selection, d3, options) {
    var variant = d3.select(selection.node().parentNode).datum();
    var vepHighestImpacts = options.self.globalApp.utility.getNonCanonicalHighestImpactsVep(variant, options.self.impactMap);
    if (Object.keys(vepHighestImpacts).length > 0) {
      options.self.glyph.showImpactSymbol(selection, d3, options);
    }
  }
    getTranslatedFilterName(filterName) {
        let map = this.filterNameMap;
        let translatedName = map[filterName];
        return translatedName == null ? filterName : translatedName;
    }

}


