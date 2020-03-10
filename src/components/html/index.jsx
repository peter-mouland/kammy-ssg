/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';

const GA = ({ gaKey }) => (
  <div id='google-analytics'>
    <script dangerouslySetInnerHTML={{
      __html: `
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

        ga('create', '${gaKey}', 'auto');
        ga('send', 'pageview');
      `,
    }} />
  </div>
);

GA.propTypes = {
  gaKey: PropTypes.string.isRequired,
};

const Index = ({
  initialState, body, js, css, links, GA_KEY,
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta httpEquiv="x-dns-prefetch-control" content="on" />
      <meta name="viewport" content="width=device-width,initial-scale=1.0" />
      <div id="links" dangerouslySetInnerHTML={{ __html: links }} />
      <div id="stylesheets" dangerouslySetInnerHTML={{ __html: css }} />
      {GA_KEY && <GA gaKey={GA_KEY} />}
    </head>
    <body>
      <script dangerouslySetInnerHTML={{ __html: `window.__INITIAL_STATE__ = ${initialState}` }}/>
      <div id="html" dangerouslySetInnerHTML={{ __html: body }} />
      <div id="scripts" dangerouslySetInnerHTML={{ __html: js }} />
    </body>
  </html>
);

Index.propTypes = {
  initialState: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  body: PropTypes.string.isRequired,
  js: PropTypes.string.isRequired,
  css: PropTypes.string.isRequired,
  links: PropTypes.string.isRequired,
  GA_KEY: PropTypes.string,
};

export default Index;
