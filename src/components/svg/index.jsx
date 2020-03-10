/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import SvgProvider from './Provider';

const createSymbol = (svg) => {
  // defs need to be moved outside the symbol for firefox
  const matches = svg.match(/<defs>(.*?)<\/defs>/ig) || [];
  const defs = (matches.length > 0) ? matches[0] : '';
  return svg
    .replace(/<defs>(.*?)<\/defs>/ig, () => '')
    .replace('<svg', `<svg class="sr-only" >${defs}<symbol`)
    .replace('</svg>', '</symbol></svg>');
};

const createUse = (svg, use) => {
  // svg needs viewBox for firefox
  const matches = svg.match(/viewBox="(.*?)"/ig) || [];
  const viewBox = (matches.length > 0) ? ` ${matches[0]}` : '';
  return `<svg${viewBox}><use xlink:href='#${use}' /></svg>`;
};

const setId = (svg, id) => svg.replace(/(<svg[^>]*) id=".*?"/ig, '$1').replace('<svg', `<svg id="${id}"`);
const createSymbolWithId = (svg, id) => createSymbol(setId(svg, id));
const setWidth = (svg, width) => svg.replace(/(<svg[^>]*) width=".*?"/ig, '$1').replace(/<svg/g, `<svg width="${width}"`);
const setHeight = (svg, height) => svg.replace(/(<svg[^>]*) height=".*?"/ig, '$1').replace(/<svg/g, `<svg height="${height}"`);

const Index = ({
  height, width, children, className, symbol = false, id, use, cacheId, ...props
}, { svgCache }) => {
  let svg = '';
  const hasProvider = !!svgCache;

  if (svgCache && svgCache.use({ cacheId })) {
    svg = svgCache.use({ cacheId });
  } else if (cacheId && hasProvider) {
    const Use = createUse(children, cacheId);
    const Symbol = createSymbolWithId(children, cacheId);
    svg = Use;
    svgCache.add({ cacheId, Use, Symbol });
  } else if (symbol) {
    svg = createSymbolWithId(children, id);
  } else if (use) {
    svg = createUse(svg, use);
  } else {
    svg = children;
  }

  svg = id && !symbol ? setId(svg, id) : svg;
  svg = height ? setHeight(svg, height) : svg;
  svg = width ? setWidth(svg, width) : svg;

  return <span dangerouslySetInnerHTML={{ __html: svg }} className={className} {...props} />;
};

Index.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.string]).isRequired,
  className: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  symbol: PropTypes.bool,
  id: PropTypes.string,
  cacheId: PropTypes.string,
  use: PropTypes.string,
};

Index.defaultProps = {
  className: null,
  height: null,
  width: null,
  symbol: null,
  id: null,
  cacheId: null,
  use: null,
};

Index.contextTypes = {
  svgCache: PropTypes.object,
};

export default Index;
export { SvgProvider };
