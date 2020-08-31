const spacing = {
    'rnb-spacing-none': '0rem',
    'rnb-spacing-micro': '0.25rem', // 4px
    'rnb-spacing-tiny': '0.5rem', // 8px
    'rnb-spacing-small': '0.75rem', // 12px
    'rnb-spacing-medium': '1rem', // 16px
    'rnb-spacing-large': '1.5rem', // 24px
    'rnb-spacing-big': '2rem', // 32px
    'rnb-spacing-huge': '3rem', // 48px
    'rnb-spacing-super': '4rem', // 64px
    'rnb-spacing-jumbo': '8rem', // 128px
};

module.exports = {
    ...spacing,

    'rnb-spacing-inset-squash-micro': `${spacing['rnb-spacing-micro']} ${spacing['rnb-spacing-tiny']}`,
    'rnb-spacing-inset-squash-tiny': `${spacing['rnb-spacing-tiny']} ${spacing['rnb-spacing-small']}`,
    'rnb-spacing-inset-squash-small': `${spacing['rnb-spacing-small']} ${spacing['rnb-spacing-medium']}`,
    'rnb-spacing-inset-squash-medium': `${spacing['rnb-spacing-medium']} ${spacing['rnb-spacing-large']}`,

    'rnb-spacing-inset-squeeze-micro': `${spacing['rnb-spacing-tiny']} ${spacing['rnb-spacing-micro']}`,
    'rnb-spacing-inset-squeeze-tiny': `${spacing['rnb-spacing-small']} ${spacing['rnb-spacing-tiny']}`,
    'rnb-spacing-inset-squeeze-medium': `${spacing['rnb-spacing-large']} ${spacing['rnb-spacing-medium']}`,
};
