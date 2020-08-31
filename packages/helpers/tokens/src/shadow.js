const colour = require('./colour');

module.exports = {
    'rnb-shadow-sea': `0 0 0 ${colour['rnb-colour-transparent']}`,
    'rnb-shadow-earth': `0 0.125rem 0.25rem ${colour['rnb-colour-black-alpha-16']}`,
    'rnb-shadow-hill': `0 0.25rem 0.5rem ${colour['rnb-colour-black-alpha-16']}`,
    'rnb-shadow-mountain': `0 0.5rem 0.75rem ${colour['rnb-colour-black-alpha-16']}`,

    'rnb-shadow-earth-top': `0 -0.125rem 0.25rem ${colour['rnb-colour-black-alpha-16']}`,
    'rnb-shadow-hill-top': `0 -0.25rem 0.5rem ${colour['rnb-colour-black-alpha-16']}`,
    'rnb-shadow-mountain-top': `0 -0.5rem 0.75rem ${colour['rnb-colour-black-alpha-16']}`,
};
