const borderRadius = require('./borderRadius');
const borderWidth = require('./borderWidth');
const colour = require('./colour');
const fontFamily = require('./fontFamily');
const fontSize = require('./fontSize');
const fontWeight = require('./fontWeight');
const lineHeight = require('./lineHeight');
const mediaQuery = require('./mediaQuery');
const shadow = require('./shadow');
const spacing = require('./spacing');
const timing = require('./timing');
const zIndex = require('./zIndex');

const allProperties = {
    borderRadius,
    borderWidth,
    colour,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    mediaQuery,
    shadow,
    spacing,
    timing,
    zIndex,
};

const rainbowProperties = Object.keys(allProperties).reduce((acc, key) => ({ ...acc, ...allProperties[key] }), {});

module.exports = {
    borderRadius,
    borderWidth,
    colour,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    mediaQuery,
    shadow,
    spacing,
    timing,
    zIndex,
    tokens: {
        properties: rainbowProperties,
        mediaQueries: mediaQuery,
    },
};
