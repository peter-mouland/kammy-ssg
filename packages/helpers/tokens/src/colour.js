const black = '#000';
const white = '#fff';
const midnight = '#263648';
const chill = '#0f81a3';
const rose = '#bd2f2f';
const lavender = '#d27df3';
const sand = '#f69f4d';
const dandelion = '#e9c627';
const moss = '#add230';
const sea = '#2cdb7b';

const core = {
    'rnb-colour-transparent': 'transparent',

    'rnb-colour-black-tint-4': '#f5f5f5',
    'rnb-colour-black-alpha-4': `rgba(${black}, 0.04)`,
    'rnb-colour-black-alpha-8': `rgba(${black}, 0.08)`,
    'rnb-colour-black-alpha-16': `rgba(${black}, 0.16)`,
    'rnb-colour-black-alpha-32': `rgba(${black}, 0.32)`,
    'rnb-colour-black-alpha-64': `rgba(${black}, 0.64)`,
    'rnb-colour-black': black,

    'rnb-colour-white-alpha-4': `rgba(${white}, 0.04)`,
    'rnb-colour-white-alpha-8': `rgba(${white}, 0.08)`,
    'rnb-colour-white-alpha-16': `rgba(${white}, 0.16)`,
    'rnb-colour-white-alpha-32': `rgba(${white}, 0.32)`,
    'rnb-colour-white-alpha-48': `rgba(${white}, 0.48)`,
    'rnb-colour-white-alpha-64': `rgba(${white}, 0.64)`,
    'rnb-colour-white': white,

    'rnb-colour-midnight-tint-4': '#f7f7f8',
    'rnb-colour-midnight-tint-8': '#eeeff1', // rgb: 238, 239, 241
    'rnb-colour-midnight-tint-16': '#dcdfe2',
    'rnb-colour-midnight-tint-32': '#b9bec4',
    'rnb-colour-midnight-tint-48': '#979fa8',
    'rnb-colour-midnight-tint-64': '#747f8a',
    'rnb-colour-midnight-alpha-96': `rgba(${midnight}, 0.96)`,
    'rnb-colour-midnight': midnight,
    'rnb-colour-midnight-shade-64': '#18232e',
    'rnb-colour-midnight-shade-48': '#121a23',
    'rnb-colour-midnight-shade-32': '#0c1117',

    'rnb-colour-chill-tint-4': '#f6fafc',
    'rnb-colour-chill-tint-8': '#ecf5f8',
    'rnb-colour-chill-tint-16': '#d8ebf0',
    'rnb-colour-chill-tint-32': '#b2d6e1',
    'rnb-colour-chill-tint-64': '#66aec5',
    'rnb-colour-chill': chill,
    'rnb-colour-chill-shade-64': '#0a5269',
    'rnb-colour-chill-shade-48': '#073e4e',
    'rnb-colour-chill-shade-32': '#052934',

    'rnb-colour-rose-tint-16': '#f4dede',
    'rnb-colour-rose-tint-32': '#e9bcbc',
    'rnb-colour-rose-tint-64': '#d57a7a',
    'rnb-colour-rose': rose,
    'rnb-colour-rose-shade-64': '#791e1e',
    'rnb-colour-rose-shade-48': '#5b1717',
    'rnb-colour-rose-shade-32': '#3c0f0f',

    'rnb-colour-lavender-tint-16': '#f8eafd',
    'rnb-colour-lavender-tint-32': '#f0d5fb',
    'rnb-colour-lavender-tint-64': '#e2acf7',
    'rnb-colour-lavender': lavender,
    'rnb-colour-lavender-shade-64': '#86509b',
    'rnb-colour-lavender-shade-48': '#653c75',
    'rnb-colour-lavender-shade-32': '#43284e',

    'rnb-colour-sand-tint-16': '#fdefe2',
    'rnb-colour-sand-tint-32': '#fce0c6',
    'rnb-colour-sand-tint-64': '#f9c28d',
    'rnb-colour-sand': sand,
    'rnb-colour-sand-shade-64': '#9d6631',
    'rnb-colour-sand-shade-48': '#764c25',
    'rnb-colour-sand-shade-32': '#4f3319',

    'rnb-colour-dandelion-tint-16': '#fbf6dc',
    'rnb-colour-dandelion-tint-32': '#f8ecb9',
    'rnb-colour-dandelion-tint-64': '#f1db75',
    'rnb-colour-dandelion': dandelion,
    'rnb-colour-dandelion-shade-64': '#957f19',
    'rnb-colour-dandelion-shade-48': '#705f13',
    'rnb-colour-dandelion-shade-32': '#4b3f0c',

    'rnb-colour-moss-tint-16': '#f2f8de',
    'rnb-colour-moss-tint-32': '#e4f0bc',
    'rnb-colour-moss-tint-64': '#cbe27b',
    'rnb-colour-moss': moss,
    'rnb-colour-moss-shade-64': '#6f861f',
    'rnb-colour-moss-shade-48': '#536517',
    'rnb-colour-moss-shade-32': '#37430f',

    'rnb-colour-sea-tint-8': '#effdf5',
    'rnb-colour-sea-tint-16': '#ddf9ea',
    'rnb-colour-sea-tint-32': '#bbf3d4',
    'rnb-colour-sea-tint-64': '#78e8ab',
    'rnb-colour-sea': sea,
    'rnb-colour-sea-shade-64': '#1c8c4f',
    'rnb-colour-sea-shade-48': '#15693b',
    'rnb-colour-sea-shade-32': '#0e4627',
};

const defaults = {
    // Score band colours – Global
    'rnb-colour-band-theta': core['rnb-colour-sand-tint-64'],
    'rnb-colour-band-alpha': core['rnb-colour-sand-tint-64'],
    'rnb-colour-band-beta': core['rnb-colour-dandelion-tint-64'],
    'rnb-colour-band-gamma': core['rnb-colour-moss-tint-64'],
    'rnb-colour-band-delta': core['rnb-colour-sea-tint-64'],
    'rnb-colour-band-epsilon': core['rnb-colour-chill-tint-32'],
    // Theming colours – Light
    'rnb-colour-primary-light': core['rnb-colour-midnight'],
    'rnb-colour-secondary-light': core['rnb-colour-midnight-tint-64'],
    'rnb-colour-tertiary-light': core['rnb-colour-midnight-tint-48'],
    'rnb-colour-positive-light': core['rnb-colour-sea-shade-64'],
    'rnb-colour-negative-light': core['rnb-colour-rose'],
    'rnb-colour-attention-light': core['rnb-colour-sand'],
    'rnb-colour-disabled-light': core['rnb-colour-midnight-tint-32'],
    'rnb-colour-action-light': core['rnb-colour-chill'],
    'rnb-colour-overlay-light': core['rnb-colour-midnight-alpha-96'],
    // Background colours – Light
    'rnb-colour-background-light': core['rnb-colour-midnight-tint-4'],
    'rnb-colour-card-light': core['rnb-colour-white'],
    'rnb-colour-cell-light': core['rnb-colour-white'],
    'rnb-colour-section-light': core['rnb-colour-white'],
    'rnb-colour-header-light': core['rnb-colour-white'],
    'rnb-colour-footer-light': core['rnb-colour-midnight-shade-64'],
    // Theming colours – Dark
    'rnb-colour-primary-dark': core['rnb-colour-white'],
    'rnb-colour-secondary-dark': core['rnb-colour-white-alpha-64'],
    'rnb-colour-tertiary-dark': core['rnb-colour-white-alpha-48'],
    'rnb-colour-positive-dark': core['rnb-colour-sea'],
    'rnb-colour-negative-dark': core['rnb-colour-rose-tint-64'],
    'rnb-colour-attention-dark': core['rnb-colour-sand'],
    'rnb-colour-disabled-dark': core['rnb-colour-white-alpha-32'],
    'rnb-colour-action-dark': core['rnb-colour-chill-tint-64'],
    'rnb-colour-overlay-dark': core['rnb-colour-black-alpha-64'],
    // Background colours – Dark
    'rnb-colour-background-dark': core['rnb-colour-midnight-shade-32'],
    'rnb-colour-card-dark': core['rnb-colour-midnight-shade-64'],
    'rnb-colour-cell-dark': core['rnb-colour-white-alpha-4'],
    'rnb-colour-section-dark': core['rnb-colour-white-alpha-4'],
    'rnb-colour-header-dark': core['rnb-colour-white-alpha-4'],
    'rnb-colour-footer-dark': core['rnb-colour-white-alpha-4'],
};

module.exports = { ...core, ...defaults };
