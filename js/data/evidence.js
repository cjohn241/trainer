// evidence.js — the sources behind the advice. Each entry has a plain
// claim, where it comes from, and a label:
//   Strong         major guidelines or several good reviews agree
//   Moderate       good reviews, but smaller or less certain effects
//   Emerging       early, small or mixed evidence
//   Design choice  game design, not a science claim
//
// These are written from memory. checked: false until the v0.3 evidence
// check confirms the source, year and link. Links search PubMed so they
// always lead somewhere real.

const EVIDENCE = {
  'acsm-novice': {
    claim: 'Beginners build strength with 1–3 sets of 8–12 reps, 2–3 days a week.',
    source: 'American College of Sports Medicine position stand: Progression models in resistance training for healthy adults',
    year: 2009, type: 'guideline', label: 'Strong', checked: false,
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=ACSM+position+stand+progression+models+resistance+training+healthy+adults+2009',
  },
  'loads-near-failure': {
    claim: 'Light and heavy weights both build muscle when sets end with only a few reps left in you.',
    source: 'Schoenfeld et al.; Lopez et al. (meta-analyses)',
    year: '2017; 2021', type: 'meta-analyses', label: 'Strong', checked: false,
    note: 'Heavier weights are a bit better for maximum strength.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=low+vs+high+load+resistance+training+meta-analysis+hypertrophy',
  },
  'who-2020': {
    claim: 'Adults: 150–300 minutes a week of moderate activity, plus strength work on 2 or more days.',
    source: 'WHO guidelines on physical activity and sedentary behaviour',
    year: 2020, type: 'guideline', label: 'Strong', checked: false,
    url: 'https://www.who.int/publications/i/item/9789240015128',
  },
  'every-move-counts': {
    claim: 'Any amount of activity counts. There is no minimum length for it to help.',
    source: 'WHO guidelines on physical activity and sedentary behaviour',
    year: 2020, type: 'guideline', label: 'Strong', checked: false,
    url: 'https://www.who.int/publications/i/item/9789240015128',
  },
  'rpe': {
    claim: 'Rating how hard a set felt (reps left in the tank) is a usable way to adjust training.',
    source: 'Helms et al., RIR-based RPE scale, plus later reviews',
    year: 2016, type: 'review', label: 'Moderate', checked: false,
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Helms+repetitions+in+reserve+RPE+scale',
  },
  'hip-knee': {
    claim: 'Hip and knee strengthening is a first-line treatment for common knee pain.',
    source: 'OARSI knee guidelines; patellofemoral pain consensus statement (Collins et al.)',
    year: '2018–2019', type: 'guideline', label: 'Strong', checked: false,
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=patellofemoral+pain+consensus+statement+exercise+therapy+2018',
  },
  'bands': {
    claim: 'Resistance bands build strength about as well as regular weights.',
    source: 'Lopes et al. (systematic review and meta-analysis)',
    year: 2019, type: 'meta-analysis', label: 'Moderate', checked: false,
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=elastic+bands+resistance+training+strength+meta-analysis+2019',
  },
  'real-incentives': {
    claim: 'Real-world rewards help people stay active, at least while the reward is on offer.',
    source: 'Mitchell et al. (systematic review and meta-analysis of financial incentives for physical activity)',
    year: 2020, type: 'meta-analysis', label: 'Moderate', checked: false,
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Mitchell+financial+incentives+physical+activity+meta-analysis+2020',
  },
  'strength-breaks': {
    claim: 'A few weeks of lighter training keeps most of your strength. Short trips do not undo your work.',
    source: 'Bosquet et al. (detraining meta-analysis); Spiering et al. (maintaining strength and muscle)',
    year: '2013; 2021', type: 'meta-analysis and review', label: 'Moderate', checked: false,
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Spiering+maintaining+physical+performance+minimal+dose+2021',
  },
  'design-energy': {
    claim: 'Your energy tap sets how much today\'s quest asks of you.',
    label: 'Design choice',
    note: 'This is game design, built on effort-based training. No study tests this exact mapping.',
  },
  'design-tiny': {
    claim: 'A Tiny Quest counts as a full win.',
    label: 'Design choice',
    note: 'Science says any movement helps. It does not say 3 minutes equals a full workout. The win is about keeping the habit alive.',
  },
};
